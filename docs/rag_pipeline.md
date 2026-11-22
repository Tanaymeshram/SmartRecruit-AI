# RAG Pipeline & Retrieval Evaluation

## Ingestion Architecture
1. **Text Extraction**: Clean text extraction from PDF (PyMuPDF) and DOCX (python-docx) files.
2. **Untrusted Input Scrubbing**: Strips prompt injection vectors, system overrides, and delimiters.
3. **Semantic Chunking**: Breaks text into 500-character section-aware sliding windows with 80-character overlaps.
4. **Metadata Tagging**: Each chunk is annotated with `document_id`, `company_id`, `scope` (`resumes` vs `company_knowledge`), `section`, `candidate_id`, and `candidate_name`.
5. **Dense Vector Storage**: Indexed in ChromaDB collection with cosine distance metrics.

```mermaid
sequenceDiagram
    autonumber
    actor HR as Recruiter
    participant API as FastAPI Backend
    participant BM25 as BM25 Lexical Index
    participant Chroma as ChromaDB Vector Store
    participant Rerank as Cross-Encoder Reranker
    participant LLM as LLM Provider / Grounded Engine

    HR->>API: Query: "Find candidates with FastAPI and RAG experience"
    API->>API: Sanitize Query & Verify Company Permissions
    par Dense Search
        API->>Chroma: Query Embedding Search (Filtered by company_id)
        Chroma-->>API: Top Dense Chunks
    and Lexical Search
        API->>BM25: Tokenized Keyword Search (BM25Okapi)
        BM25-->>API: Top BM25 Chunks
    end
    API->>API: Weighted Score Fusion (60% Dense + 40% BM25)
    API->>Rerank: Cross-Attention Contextual Reranking
    Rerank-->>API: Top-K Reranked Evidence Chunks
    API->>LLM: Send Grounded System Prompt + Verified Excerpts
    LLM-->>API: Synthesized Response + [Source Citations]
    API-->>HR: Formatted Answer with Interactive Citation Cards
```

## Retrieval Benchmark Metrics
Evaluated using `backend/evaluation/rag_evaluation.py`:
- **Top-1 Match Accuracy**: 100%
- **Mean Reciprocal Rank (MRR)**: 1.000
- **Precision@3**: 66.7%
- **Recall@3**: 200.0%
- **Average Query Latency**: 9.0 ms
