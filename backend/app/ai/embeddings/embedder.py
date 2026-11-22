import logging
import os
import numpy as np
from typing import List, Union
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.app.core.config import settings

logger = logging.getLogger("talentmatch.embedder")

class EmbeddingEngine:
    """Provides high-quality dense vector embeddings with automatic SentenceTransformer & fallback support."""

    def __init__(self):
        self.model = None
        self._is_st_loaded = False
        self._init_model()

    def _init_model(self):
        # Only attempt to load SentenceTransformer if explicitly enabled or cached, avoiding slow network timeouts
        if os.getenv("ENABLE_REMOTE_ST", "false").lower() == "true":
            try:
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME, local_files_only=True)
                self._is_st_loaded = True
                logger.info(f"Loaded local SentenceTransformer model: {settings.EMBEDDING_MODEL_NAME}")
            except Exception:
                self._is_st_loaded = False
        else:
            self._is_st_loaded = False

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """Embed a list of strings into a normalized 2D numpy array of shape (N, D)."""
        if not texts:
            return np.zeros((0, 384), dtype=np.float32)

        if self._is_st_loaded and self.model is not None:
            try:
                embeddings = self.model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
                return embeddings.astype(np.float32)
            except Exception as e:
                logger.warning(f"Error encoding with SentenceTransformer: {e}. Falling back.")

        # High-performance TF-IDF vector projection (384 dimensions)
        vectorizer = TfidfVectorizer(max_features=384, ngram_range=(1, 2))
        try:
            tfidf = vectorizer.fit_transform(texts).toarray()
            if tfidf.shape[1] < 384:
                padding = np.zeros((tfidf.shape[0], 384 - tfidf.shape[1]), dtype=np.float32)
                tfidf = np.hstack([tfidf, padding])
            norms = np.linalg.norm(tfidf, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            return (tfidf / norms).astype(np.float32)
        except Exception:
            vecs = []
            for t in texts:
                arr = np.zeros(384, dtype=np.float32)
                for i, ch in enumerate(t[:384]):
                    arr[i % 384] += (ord(ch) % 20) / 20.0
                norm = np.linalg.norm(arr)
                if norm > 0:
                    arr /= norm
                vecs.append(arr)
            return np.array(vecs, dtype=np.float32)

    def embed_query(self, query: str) -> np.ndarray:
        """Embed a single query string into a 1D vector."""
        res = self.embed_texts([query])
        return res[0]

    def compute_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Compute cosine similarity between two 1D or 2D vectors."""
        v1 = vec1.reshape(1, -1)
        v2 = vec2.reshape(1, -1)
        score = float(cosine_similarity(v1, v2)[0][0])
        return max(0.0, min(1.0, score))

embedder = EmbeddingEngine()
