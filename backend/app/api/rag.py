from fastapi import APIRouter, Depends, UploadFile, File, Form
from typing import List, Optional
from backend.app.schemas.rag import RagQueryRequest, RagQueryResponse
from backend.app.services.rag_service import RagService
from backend.app.services.auth_service import get_current_user

router = APIRouter(prefix="/rag", tags=["RAG Knowledge Engines"])

@router.post("/query", response_model=RagQueryResponse)
async def query_rag(req: RagQueryRequest, current_user: dict = Depends(get_current_user)):
    return await RagService.ask_rag(
        query=req.query,
        scope=req.scope,
        current_user=current_user,
        candidate_ids=req.candidate_ids,
        job_id=req.job_id,
        top_k=req.top_k
    )

@router.post("/documents/upload")
async def upload_company_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    doc_type: str = Form("policy"),
    current_user: dict = Depends(get_current_user)
):
    return await RagService.upload_company_knowledge_document(
        file=file,
        title=title,
        doc_type=doc_type,
        current_user=current_user
    )

@router.get("/documents")
async def list_company_documents(current_user: dict = Depends(get_current_user)):
    return await RagService.get_company_knowledge_documents(current_user)

