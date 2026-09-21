# backend/app/adapters/rag/vector_rag_adapter.py
from typing import Optional
from fastembed import TextEmbedding
from supabase import create_client
from app.core.config import settings
from app.core.constants import EMBEDDING_MODEL_NAME, RAG_SIMILARITY_THRESHOLD
from app.ports.rag_port import RAGPort
from app.domain.models import RAGQuery, RAGQueryResult

class VectorRAGAdapter(RAGPort):
    def __init__(self):
        self.embedding_model = TextEmbedding(model_name=EMBEDDING_MODEL_NAME)
        self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    async def query_knowledge_base(self, payload: RAGQuery, org_id: Optional[str] = None) -> RAGQueryResult:
        embeddings = list(self.embedding_model.embed([payload.query]))
        query_vector = embeddings[0].tolist()

        filter_org = org_id if (org_id and org_id != "00000000-0000-0000-0000-000000000000") else None

        res = self.supabase.rpc(
            "match_manual_sections",
            {
                "query_embedding": query_vector,
                "match_threshold": RAG_SIMILARITY_THRESHOLD,
                "match_count": payload.top_k,
                "filter_org_id": filter_org
            }
        ).execute()

        matches = res.data or []
        sources = []
        context_str = ""

        for match in matches:
            sources.append({"manual": match.get("manual_title"), "page": match.get("page_number")})
            context_str += f"\n- {match.get('content')}"

        answer = f"Based on technical manual specs: {context_str}" if matches else "No matching spec found."

        return RAGQueryResult(
            answer=answer,
            sources=sources,
            confidence_score=matches[0].get("similarity", 0.0) if matches else 0.0
        )