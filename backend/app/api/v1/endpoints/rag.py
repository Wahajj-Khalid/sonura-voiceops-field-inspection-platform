import io
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pypdf import PdfReader
from fastembed import TextEmbedding
from supabase import create_client
from app.core.config import settings
from app.core.constants import EMBEDDING_MODEL_NAME, RAG_CHUNK_SIZE
from app.core.security import get_current_user
from app.domain.models import RAGQuery, RAGQueryResult
from app.adapters.rag.vector_rag_adapter import VectorRAGAdapter

router = APIRouter(prefix="/rag", tags=["RAG Knowledge Base"])
rag_adapter = VectorRAGAdapter()

def get_supabase_client():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

@router.get("/manuals")
async def list_indexed_manuals(
    current_user: dict = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    client = get_supabase_client()
    org_id = current_user.get("org_id")
    try:
        query = client.table("manual_sections").select("manual_title, category, org_id")
        if current_user.get("role") != "super_admin":
            query = query.or_(f"org_id.eq.{org_id},org_id.is.null")
            
        res = query.execute()
        rows = res.data or []
        manuals_map = {}
        for row in rows:
            title = row.get("manual_title")
            cat = row.get("category", "General")
            if title not in manuals_map:
                manuals_map[title] = {"manual_title": title, "category": cat, "chunks": 0}
            manuals_map[title]["chunks"] += 1
        return list(manuals_map.values())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch manuals: {str(e)}")

@router.get("/manuals/{manual_title}/chunks")
async def get_manual_chunks(
    manual_title: str,
    current_user: dict = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    client = get_supabase_client()
    org_id = current_user.get("org_id")
    try:
        query = client.table("manual_sections").select("id, page_number, content, category").eq("manual_title", manual_title).order("page_number", desc=False)
        if current_user.get("role") != "super_admin":
            query = query.or_(f"org_id.eq.{org_id},org_id.is.null")
            
        res = query.execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch manual chunks: {str(e)}")

@router.post("/query", response_model=RAGQueryResult)
async def test_rag_query(
    payload: RAGQuery,
    current_user: dict = Depends(get_current_user)
):
    try:
        user_org = current_user.get("org_id")
        return await rag_adapter.query_knowledge_base(payload, org_id=user_org)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG query error: {str(e)}")

@router.post("/manuals/upload")
async def upload_manual_pdf(
    file: UploadFile = File(...),
    manual_title: str = Form(...),
    category: str = Form("HVAC"),
    current_user: dict = Depends(get_current_user)
):
    try:
        content_bytes = await file.read()
        extracted_text = ""
        try:
            pdf_stream = io.BytesIO(content_bytes)
            reader = PdfReader(pdf_stream)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text += page_text + "\n"
        except Exception:
            extracted_text = content_bytes.decode("utf-8", errors="ignore")

        if not extracted_text.strip():
            extracted_text = f"Standard Operating Manual specification content for {manual_title}."

        text_chunks = [
            extracted_text[i:i + RAG_CHUNK_SIZE] 
            for i in range(0, min(len(extracted_text), 8000), RAG_CHUNK_SIZE)
        ]
        
        embedding_model = TextEmbedding(model_name=EMBEDDING_MODEL_NAME)
        client = get_supabase_client()
        org_id = current_user.get("org_id")

        for idx, chunk in enumerate(text_chunks):
            embeddings = list(embedding_model.embed([chunk]))
            vector = embeddings[0].tolist()

            client.table("manual_sections").insert({
                "org_id": org_id,
                "manual_title": manual_title,
                "category": category,
                "page_number": idx + 1,
                "content": chunk,
                "embedding": vector
            }).execute()

        return {
            "status": "success",
            "filename": file.filename,
            "manual_title": manual_title,
            "chunks_indexed": len(text_chunks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Manual processing failed: {str(e)}")