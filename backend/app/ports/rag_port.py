from typing import Protocol, Optional
from app.domain.models import RAGQuery, RAGQueryResult

class RAGPort(Protocol):
    async def query_knowledge_base(self, payload: RAGQuery, org_id: Optional[str] = None) -> RAGQueryResult: ...