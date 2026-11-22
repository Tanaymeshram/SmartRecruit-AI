import re
from typing import List, Dict, Any, Tuple
from rank_bm25 import BM25Okapi

class BM25Retriever:
    """Fast lexical BM25 retriever for candidate resume chunks and HR documents."""

    def __init__(self):
        self.corpus_chunks: List[Dict[str, Any]] = []
        self.bm25: BM25Okapi = None

    def _tokenize(self, text: str) -> List[str]:
        tokens = re.findall(r'\b[a-zA-Z0-9_+#.-]+\b', text.lower())
        return tokens

    def index_chunks(self, chunks: List[Dict[str, Any]]):
        """Build or refresh BM25 index with provided chunks."""
        self.corpus_chunks = chunks
        if not chunks:
            self.bm25 = None
            return
        tokenized_corpus = [self._tokenize(c.get("text", "")) for c in chunks]
        self.bm25 = BM25Okapi(tokenized_corpus)

    def search(self, query: str, top_k: int = 10, filter_metadata: Dict[str, Any] = None) -> List[Tuple[Dict[str, Any], float]]:
        """Perform BM25 keyword search with metadata filtering."""
        if not self.bm25 or not self.corpus_chunks:
            return []

        tokens = self._tokenize(query)
        if not tokens:
            return []

        doc_scores = self.bm25.get_scores(tokens)
        scored_pairs = []

        max_score = max(doc_scores) if len(doc_scores) > 0 and max(doc_scores) > 0 else 1.0

        for i, score in enumerate(doc_scores):
            chunk = self.corpus_chunks[i]
            
            # Apply metadata filter
            if filter_metadata:
                match = True
                for k, v in filter_metadata.items():
                    if chunk.get("metadata", {}).get(k) != v:
                        match = False
                        break
                if not match:
                    continue

            normalized_score = float(score / max_score)
            scored_pairs.append((chunk, normalized_score))

        scored_pairs.sort(key=lambda x: x[1], reverse=True)
        return scored_pairs[:top_k]

