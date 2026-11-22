# TalentMatch AI – System Architecture

## Architectural Philosophy
TalentMatch AI is engineered as a privacy-preserving, enterprise-grade, retrieval-augmented recruitment intelligence platform. The architecture separates untrusted raw candidate documents from clean, structured semantic indices and applies company-level multi-tenant boundaries at every query path.

```mermaid
flowchart TD
    subgraph Frontend["React.js + Vite Client (Port 5173)"]
        UI[16 Interactive SaaS Pages]
        AuthCtx[Auth Context & JWT Bearer]
        Charts[Recharts Data Visualizations]
        Router[React Router DOM]
    end

    subgraph Backend["FastAPI Core Engine (Port 8000)"]
        API[REST API Gateway]
        Guard[Prompt Injection & Untrusted Guardrails]
        Parser[PyMuPDF / python-docx Parser]
        NLP[Boundary-Aware Skill Extractor]
        Matcher[Multi-Dimensional Match Scorer]
        Hybrid[Hybrid Retriever: Dense + BM25Okapi]
        Rerank[Cross-Encoder Contextual Reranker]
    end

    subgraph Storage["Storage & Persistence Layer"]
        Mongo[MongoDB / Resilient Local Doc Store]
        Chroma[ChromaDB Vector Store (384-dim)]
        FS[Secure Local File System]
    end

    Frontend -->|JWT Authenticated API Calls| API
    API --> Guard
    Guard --> Matcher
    Guard --> Hybrid
    API --> Parser
    Parser --> NLP
    NLP --> Matcher
    Hybrid --> Chroma
    Hybrid --> Rerank
    Matcher --> Mongo
    API --> Mongo
    Parser --> FS
```

## Key Architectural Decisions
1. **Multi-Tenant Company Isolation**: Every user record, job posting, candidate resume chunk, and ChromaDB vector tag is bound to a strict `company_id`. Retrieval queries enforce metadata filters at search time.
2. **Dual-Layer Database Resilience**: Connects dynamically to live MongoDB (via Motor) when available, while providing thread-safe JSON Document persistence on fallback so developer environments run seamlessly out of the box.
3. **Deterministic & Cloud LLM Flexibility**: Supports Google Gemini 1.5, OpenAI GPT-4o, and an extractive zero-hallucination deterministic RAG synthesizer with strict citation attribution.
