import os
import re
import uuid
import logging
from typing import List, Dict, Any, Optional
import httpx
from backend.app.core.config import settings
from backend.app.ai.embeddings.embedder import embedder
from backend.app.ai.retrieval.bm25_retriever import BM25Retriever
from backend.app.ai.reranking.reranker import reranker
from backend.app.ai.rag.guardrails import UntrustedContentGuardrail

logger = logging.getLogger("talentmatch.rag")

class RagEngine:
    """Production RAG pipeline featuring Hybrid Retrieval (Dense + BM25), Cross-Encoder Reranking,
    Multi-Tenant Isolation, Source Citations, and Multi-Provider LLM synthesis."""

    def __init__(self):
        self.bm25 = BM25Retriever()
        self.chunks_db: List[Dict[str, Any]] = []
        self._init_chroma()

    def _init_chroma(self):
        self.chroma_client = None
        self.collection = None
        try:
            import chromadb
            from chromadb.config import Settings as ChromaSettings
            self.chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
            self.collection = self.chroma_client.get_or_create_collection(
                name="talentmatch_documents",
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("ChromaDB vector collection initialized.")
        except Exception as e:
            logger.warning(f"ChromaDB persistent client notice ({e}). In-memory vector index active.")
            self.chroma_client = None
            self.collection = None

    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 80) -> List[str]:
        """Split text into semantic paragraphs and sliding chunks."""
        clean_text = UntrustedContentGuardrail.sanitize_untrusted_text(text)
        paragraphs = [p.strip() for p in clean_text.split("\n\n") if p.strip()]
        chunks = []

        for p in paragraphs:
            if len(p) <= chunk_size:
                chunks.append(p)
            else:
                # Sliding window
                start = 0
                while start < len(p):
                    end = min(start + chunk_size, len(p))
                    chunk = p[start:end].strip()
                    if chunk:
                        chunks.append(chunk)
                    if end == len(p):
                        break
                    start += (chunk_size - overlap)

        return chunks if chunks else [clean_text[:chunk_size]]

    def ingest_document(
        self,
        document_id: str,
        title: str,
        text: str,
        company_id: str,
        scope: str = "resumes",
        candidate_id: Optional[str] = None,
        candidate_name: Optional[str] = None,
        sections: Optional[Dict[str, str]] = None
    ) -> int:
        """Ingest document, chunk text, embed, and store in vector DB & BM25 index."""
        raw_chunks = []

        # If structured sections exist, chunk section-by-section
        if sections:
            for sec_name, sec_text in sections.items():
                if sec_text and len(sec_text.strip()) > 20:
                    sub_chunks = self.chunk_text(sec_text)
                    for sc in sub_chunks:
                        raw_chunks.append({"text": sc, "section": sec_name.title()})
        else:
            sub_chunks = self.chunk_text(text)
            for sc in sub_chunks:
                raw_chunks.append({"text": sc, "section": "General"})

        if not raw_chunks:
            return 0

        texts = [c["text"] for c in raw_chunks]
        embeddings = embedder.embed_texts(texts)

        new_chunks = []
        ids = []
        metadatas = []

        for idx, item in enumerate(raw_chunks):
            chunk_id = f"{document_id}_{idx}_{uuid.uuid4().hex[:6]}"
            meta = {
                "document_id": str(document_id),
                "document_title": str(title),
                "company_id": str(company_id),
                "scope": str(scope),
                "section": str(item["section"]),
                "candidate_id": str(candidate_id or ""),
                "candidate_name": str(candidate_name or "")
            }
            ids.append(chunk_id)
            metadatas.append(meta)
            new_chunks.append({
                "id": chunk_id,
                "text": item["text"],
                "embedding": embeddings[idx],
                "metadata": meta
            })

        # Add to ChromaDB if available
        if self.collection is not None:
            try:
                self.collection.upsert(
                    ids=ids,
                    embeddings=embeddings.tolist(),
                    documents=texts,
                    metadatas=metadatas
                )
            except Exception as e:
                logger.warning(f"Error adding to ChromaDB: {e}")

        # Add to local corpus
        self.chunks_db.extend(new_chunks)
        # Re-index BM25
        self.bm25.index_chunks(self.chunks_db)

        return len(new_chunks)

    def delete_document_chunks(self, document_id: str, company_id: str):
        """Clean up document vectors from vector store and memory."""
        if self.collection is not None:
            try:
                self.collection.delete(where={"$and": [{"document_id": document_id}, {"company_id": company_id}]})
            except Exception as e:
                logger.warning(f"Chroma delete error: {e}")

        self.chunks_db = [
            c for c in self.chunks_db
            if not (c["metadata"].get("document_id") == document_id and c["metadata"].get("company_id") == company_id)
        ]
        self.bm25.index_chunks(self.chunks_db)

    def retrieve(
        self,
        query: str,
        company_id: str,
        scope: str = "resumes",
        candidate_ids: Optional[List[str]] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Hybrid Retrieval: Dense Vector Search + BM25 Keyword Search + Reranking."""
        query_emb = embedder.embed_query(query)

        # 1. Filter candidates in memory matching company & scope
        eligible_chunks = [
            c for c in self.chunks_db
            if c["metadata"].get("company_id") == company_id and c["metadata"].get("scope") == scope
        ]

        if candidate_ids:
            eligible_chunks = [c for c in eligible_chunks if c["metadata"].get("candidate_id") in candidate_ids]

        if not eligible_chunks:
            return []

        # 2. Dense Vector Scoring
        dense_scored = []
        for c in eligible_chunks:
            sim = embedder.compute_similarity(query_emb, c["embedding"])
            dense_scored.append((c, sim))

        # 3. BM25 Lexical Scoring
        bm25_filter = {"company_id": company_id, "scope": scope}
        bm25_results = self.bm25.search(query, top_k=len(eligible_chunks), filter_metadata=bm25_filter)
        bm25_map = {item[0]["id"]: item[1] for item in bm25_results}

        # 4. Hybrid Score Fusion (60% Dense + 40% BM25)
        combined = []
        for c, dense_score in dense_scored:
            b_score = bm25_map.get(c["id"], 0.0)
            fused_score = (dense_score * 0.60) + (b_score * 0.40)
            chunk_copy = dict(c)
            chunk_copy["combined_score"] = fused_score
            combined.append(chunk_copy)

        combined.sort(key=lambda x: x["combined_score"], reverse=True)
        top_candidates = combined[:top_k * 2]

        # 5. Cross-Encoder Contextual Reranking
        reranked = reranker.rerank(query, top_candidates, top_k=top_k)
        return reranked

    async def generate_grounded_answer(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        provider: str = "demo"
    ) -> Dict[str, Any]:
        """Synthesize answer grounded in retrieved chunks with citations and anti-hallucination guard."""
        if not retrieved_chunks:
            return {
                "answer": "The uploaded documents do not contain sufficient information to answer this inquiry. Please verify that relevant resumes or policy documents have been uploaded.",
                "citations": [],
                "confidence": 0.0,
                "model_used": "Grounded Fallback Engine"
            }

        # Format citations
        citations = []
        context_blocks = []
        for i, c in enumerate(retrieved_chunks):
            meta = c.get("metadata", {})
            cand_name = meta.get("candidate_name") or meta.get("document_title") or "Document"
            sec = meta.get("section", "General")
            snippet = c.get("text", "").strip()
            score = round(float(c.get("rerank_score", c.get("combined_score", 0.8))), 2)

            citations.append({
                "document_id": meta.get("document_id", ""),
                "document_title": meta.get("document_title", "Document"),
                "candidate_id": meta.get("candidate_id"),
                "candidate_name": cand_name,
                "section": sec,
                "snippet": snippet[:250] + ("..." if len(snippet) > 250 else ""),
                "relevance_score": score
            })

            context_blocks.append(f"[{i+1}] Candidate/Doc: {cand_name} (Section: {sec})\nExcerpt: \"{snippet}\"")

        context_str = "\n\n".join(context_blocks)

        # Real LLM API calls if configured
        if provider == "gemini" and settings.GEMINI_API_KEY:
            try:
                return await self._call_gemini(query, context_str, citations)
            except Exception as e:
                logger.warning(f"Gemini API call failed ({e}). Falling back to Grounded Synthesizer.")
        elif provider == "openai" and settings.OPENAI_API_KEY:
            try:
                return await self._call_openai(query, context_str, citations)
            except Exception as e:
                logger.warning(f"OpenAI API call failed ({e}). Falling back to Grounded Synthesizer.")

        # Grounded Synthesizer (Zero-hallucination factual synthesis)
        answer = self._synthesize_grounded_fallback(query, retrieved_chunks, citations)
        return {
            "answer": answer,
            "citations": citations,
            "confidence": round(float(sum(c["relevance_score"] for c in citations) / len(citations)), 2),
            "model_used": "Grounded Verified RAG Engine (Deterministic)"
        }

    def _synthesize_grounded_fallback(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        citations: List[Dict[str, Any]]
    ) -> str:
        """Deterministic, grounded synthesis strictly from retrieved text without hallucinations."""
        query_lower = query.lower()
        query_terms = [t for t in re.findall(r'\b[a-zA-Z0-9_+#.-]+\b', query_lower) if len(t) > 2]

        # Group by candidate or document
        grouped: Dict[str, List[Dict[str, Any]]] = {}
        for c in citations:
            name = c.get("candidate_name") or c.get("document_title") or "Document"
            grouped.setdefault(name, []).append(c)

        lines = [f"Based on the verified records from the recruitment knowledge base:\n"]

        for cand_name, items in grouped.items():
            lines.append(f"### **{cand_name}**")
            for item in items:
                sec = item.get("section", "Profile")
                snippet = item.get("snippet", "")
                # Find highlighted sentences matching query terms
                sentences = [s.strip() for s in snippet.split(".") if s.strip()]
                matching_sentences = [
                    s for s in sentences
                    if any(t in s.lower() for t in query_terms)
                ]
                if matching_sentences:
                    for ms in matching_sentences[:2]:
                        lines.append(f"- **{sec}**: \"{ms}\" `[Source: {cand_name} - {sec}]`")
                else:
                    lines.append(f"- **{sec}**: \"{snippet[:180]}...\" `[Source: {cand_name} - {sec}]`")
            lines.append("")

        lines.append(
            "> *Grounded Verification:* All statements above are cited directly from the uploaded documents. "
            "Unverified traits or claims not present in source documents are excluded."
        )

        return "\n".join(lines)

    async def _call_gemini(self, query: str, context: str, citations: List[Dict[str, Any]]) -> Dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        system_prompt = UntrustedContentGuardrail.format_grounded_system_prompt()
        prompt = (
            f"{system_prompt}\n\n"
            f"VERIFIED SOURCE EXCERPTS:\n{context}\n\n"
            f"USER INQUIRY:\n{query}\n\n"
            f"YOUR GROUNDED RESPONSE (with [Source: ...] citations):"
        )
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            answer_text = data["candidates"][0]["content"]["parts"][0]["text"]
            return {
                "answer": answer_text,
                "citations": citations,
                "confidence": 0.95,
                "model_used": "Google Gemini 1.5 Flash"
            }

    async def _call_openai(self, query: str, context: str, citations: List[Dict[str, Any]]) -> Dict[str, Any]:
        url = "https://api.openai.com/v1/chat/completions"
        system_prompt = UntrustedContentGuardrail.format_grounded_system_prompt()
        prompt = (
            f"VERIFIED SOURCE EXCERPTS:\n{context}\n\n"
            f"USER INQUIRY:\n{query}\n\n"
            f"YOUR GROUNDED RESPONSE (with [Source: ...] citations):"
        )
        headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            answer_text = data["choices"][0]["message"]["content"]
            return {
                "answer": answer_text,
                "citations": citations,
                "confidence": 0.94,
                "model_used": "OpenAI GPT-4o Mini"
            }

rag_engine = RagEngine()

