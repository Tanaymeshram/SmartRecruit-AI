import logging
import os
import re
from typing import List, Dict, Any, Tuple

logger = logging.getLogger("talentmatch.reranker")

class CrossEncoderReranker:
    """Cross-attention and semantic-relevance reranker for hybrid retrieval results."""

    def __init__(self):
        self._model = None
        self._is_loaded = False
        if os.getenv("ENABLE_REMOTE_ST", "false").lower() == "true":
            try:
                from sentence_transformers import CrossEncoder
                self._model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2", local_files_only=True)
                self._is_loaded = True
                logger.info("Loaded CrossEncoder reranker model.")
            except Exception:
                self._is_loaded = False
        else:
            self._is_loaded = False

    def rerank(self, query: str, candidate_chunks: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:
        """Rerank retrieved chunks using cross-attention or contextual relevance."""
        if not candidate_chunks:
            return []

        if self._is_loaded and self._model:
            try:
                pairs = [[query, c.get("text", "")] for c in candidate_chunks]
                scores = self._model.predict(pairs)
                ranked = []
                for idx, score in enumerate(scores):
                    c = dict(candidate_chunks[idx])
                    c["rerank_score"] = float(score)
                    ranked.append(c)
                ranked.sort(key=lambda x: x["rerank_score"], reverse=True)
                return ranked[:top_k]
            except Exception as e:
                logger.warning(f"Error during CrossEncoder prediction: {e}")

        # High-precision heuristic contextual reranker:
        query_terms = set(re.findall(r'\b[a-zA-Z0-9_+#.-]+\b', query.lower()))
        reranked = []

        for c in candidate_chunks:
            text = c.get("text", "").lower()
            metadata = c.get("metadata", {})
            base_score = c.get("combined_score", 0.5)

            # Exact term match bonus
            term_matches = sum(1 for term in query_terms if term in text)
            term_coverage = term_matches / len(query_terms) if query_terms else 0

            # Section bonus
            sec = str(metadata.get("section", "")).lower()
            sec_boost = 0.15 if any(h in sec for h in ["experience", "skills", "projects"]) else 0.0

            final_score = (base_score * 0.5) + (term_coverage * 0.35) + sec_boost
            item = dict(c)
            item["rerank_score"] = round(min(1.0, max(0.0, final_score)), 3)
            reranked.append(item)

        reranked.sort(key=lambda x: x["rerank_score"], reverse=True)
        return reranked[:top_k]

reranker = CrossEncoderReranker()
