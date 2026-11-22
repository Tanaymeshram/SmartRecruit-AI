import os
import uuid
import shutil
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, UploadFile
from backend.app.core.config import settings
from backend.app.database.mongodb import get_db
from backend.app.ai.rag.engine import rag_engine
from backend.app.ai.resume_parser.parser import resume_parser

class RagService:
    @staticmethod
    async def ask_rag(
        query: str,
        scope: str,
        current_user: dict,
        candidate_ids: Optional[List[str]] = None,
        job_id: Optional[str] = None,
        top_k: int = 5
    ) -> dict:
        company_id = current_user["company_id"]

        # 1. Retrieve relevant chunks using hybrid retrieval + reranking
        retrieved_chunks = rag_engine.retrieve(
            query=query,
            company_id=company_id,
            scope=scope,
            candidate_ids=candidate_ids,
            top_k=top_k
        )

        # 2. Synthesize grounded answer with source citations
        synthesis = await rag_engine.generate_grounded_answer(
            query=query,
            retrieved_chunks=retrieved_chunks,
            provider=settings.LLM_PROVIDER
        )

        # 3. Log query activity
        db = get_db()
        await db["activities"].insert_one({
            "_id": str(uuid.uuid4()),
            "company_id": company_id,
            "user_name": current_user.get("full_name", "Recruiter"),
            "action": f"RAG Query ({scope}): \"{query[:40]}...\"",
            "type": "rag",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        return {
            "query": query,
            "answer": synthesis["answer"],
            "citations": synthesis["citations"],
            "confidence": synthesis["confidence"],
            "retrieval_method": "Hybrid (Dense Vector + BM25 Lexical + Cross-Encoder Rerank)",
            "model_used": synthesis["model_used"],
            "is_demo_mode": settings.DEMO_MODE
        }

    @staticmethod
    async def upload_company_knowledge_document(
        file: UploadFile,
        title: str,
        doc_type: str,
        current_user: dict
    ) -> dict:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS and ext != ".txt":
            raise HTTPException(status_code=400, detail="Supported formats: PDF, DOCX, TXT")

        doc_id = str(uuid.uuid4())
        save_path = os.path.join(settings.UPLOAD_DIR, f"doc_{doc_id}_{file.filename}")

        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract text
        try:
            text = resume_parser.extract_file_text(save_path, ext)
        except Exception as e:
            if os.path.exists(save_path):
                os.remove(save_path)
            raise HTTPException(status_code=400, detail=f"Failed to read document: {e}")

        db = get_db()
        now_iso = datetime.now(timezone.utc).isoformat()

        doc_record = {
            "_id": doc_id,
            "company_id": current_user["company_id"],
            "title": title or file.filename,
            "doc_type": doc_type,  # policy, interview_guideline, assessment, company_info
            "filename": file.filename,
            "file_path": save_path,
            "text": text,
            "created_at": now_iso
        }
        await db["documents"].insert_one(doc_record)

        # Ingest into vector store
        chunks_count = rag_engine.ingest_document(
            document_id=doc_id,
            title=doc_record["title"],
            text=text,
            company_id=current_user["company_id"],
            scope="company_knowledge"
        )

        doc_record["id"] = doc_id
        doc_record["chunks_ingested"] = chunks_count
        return doc_record

    @staticmethod
    async def get_company_knowledge_documents(current_user: dict) -> List[dict]:
        db = get_db()
        docs = await db["documents"].find({"company_id": current_user["company_id"]})
        for d in docs:
            d["id"] = str(d["_id"])
        return docs

