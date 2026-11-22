import sys
import os
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

import time
import asyncio
from typing import List, Dict, Any
from backend.app.ai.rag.engine import rag_engine
from backend.app.database.mongodb import init_db
from backend.app.utils.seed_data import seed_database_if_empty, DEMO_COMPANY_ID

# Gold evaluation test cases
EVAL_DATASET = [
    {
        "query": "Find candidates with FastAPI, Python, and RAG vector experience",
        "expected_candidate_ids": ["cand-001"],
        "expected_keywords": ["FastAPI", "Python", "RAG"]
    },
    {
        "query": "Who is specialized in Next.js, Tailwind CSS, and frontend design systems?",
        "expected_candidate_ids": ["cand-002"],
        "expected_keywords": ["Next.js", "Tailwind CSS", "React"]
    },
    {
        "query": "Candidates with AWS, Kubernetes cluster management, and Terraform",
        "expected_candidate_ids": ["cand-003"],
        "expected_keywords": ["AWS", "Kubernetes", "Terraform"]
    },
    {
        "query": "NLP researchers with transformer fine-tuning and PyTorch",
        "expected_candidate_ids": ["cand-004"],
        "expected_keywords": ["NLP", "PyTorch", "Transformers"]
    }
]

async def run_rag_evaluation():
    print("=" * 65)
    print("TalentMatch AI – RAG Retrieval & Generation Benchmark")
    print("=" * 65)

    await init_db()
    await seed_database_if_empty()

    precision_scores = []
    recall_scores = []
    reciprocal_ranks = []
    latencies = []
    faithfulness_scores = []

    k = 3

    for idx, test in enumerate(EVAL_DATASET):
        query = test["query"]
        expected_ids = set(test["expected_candidate_ids"])
        expected_kws = test["expected_keywords"]

        t0 = time.perf_counter()
        retrieved = rag_engine.retrieve(
            query=query,
            company_id=DEMO_COMPANY_ID,
            scope="resumes",
            top_k=k
        )
        latency_ms = (time.perf_counter() - t0) * 1000
        latencies.append(latency_ms)

        retrieved_ids = [c["metadata"].get("candidate_id") for c in retrieved]

        # Precision@K & Recall@K
        relevant_retrieved = sum(1 for cid in retrieved_ids if cid in expected_ids)
        p_at_k = relevant_retrieved / k if k > 0 else 0
        r_at_k = relevant_retrieved / len(expected_ids) if expected_ids else 0
        precision_scores.append(p_at_k)
        recall_scores.append(r_at_k)

        # MRR
        rr = 0.0
        for rank, cid in enumerate(retrieved_ids, 1):
            if cid in expected_ids:
                rr = 1.0 / rank
                break
        reciprocal_ranks.append(rr)

        # Faithfulness check on generated answer
        synthesis = await rag_engine.generate_grounded_answer(query, retrieved)
        answer = synthesis["answer"]
        grounded_hits = sum(1 for kw in expected_kws if kw.lower() in answer.lower())
        faith_score = grounded_hits / len(expected_kws) if expected_kws else 1.0
        faithfulness_scores.append(faith_score)

        cand_name = retrieved[0]['metadata'].get('candidate_name') if retrieved else "None"
        rerank_sc = retrieved[0].get('rerank_score', 0) if retrieved else 0
        print(f"[{idx+1}/{len(EVAL_DATASET)}] Query: '{query[:45]}...'")
        print(f"      Top-1 Match: {cand_name} (Score: {rerank_sc})")
        print(f"      Latency: {latency_ms:.1f}ms | P@{k}: {p_at_k:.2f} | R@{k}: {r_at_k:.2f} | Faithfulness: {faith_score:.2f}")

    avg_p = sum(precision_scores) / len(precision_scores)
    avg_r = sum(recall_scores) / len(recall_scores)
    mrr = sum(reciprocal_ranks) / len(reciprocal_ranks)
    avg_latency = sum(latencies) / len(latencies)
    avg_faith = sum(faithfulness_scores) / len(faithfulness_scores)

    print("-" * 65)
    print("BENCHMARK SUMMARY METRICS:")
    print(f"  • Precision@{k}:        {avg_p * 100:.1f}%")
    print(f"  • Recall@{k}:           {avg_r * 100:.1f}%")
    print(f"  • Mean Reciprocal Rank: {mrr:.3f}")
    print(f"  • Grounded Faithfulness: {avg_faith * 100:.1f}%")
    print(f"  • Average Latency:      {avg_latency:.1f} ms")
    print("=" * 65)

if __name__ == "__main__":
    asyncio.run(run_rag_evaluation())
