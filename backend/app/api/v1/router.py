from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, 
    inspections, 
    voice, 
    vision, 
    audio,
    rag, 
    templates, 
    sites, 
    team, 
    organizations,
    notifications,
    contact
)

api_router = APIRouter()

api_router.include_router(auth.router, tags=["Enterprise Authentication"])
api_router.include_router(organizations.router, tags=["Tenant Organizations"])
api_router.include_router(inspections.router, prefix="/inspections", tags=["Inspections"])
api_router.include_router(voice.router, prefix="/voice", tags=["Voice Stream"])
api_router.include_router(vision.router, tags=["Multimodal Vision AI"])
api_router.include_router(audio.router, tags=["Audio Cloud Storage"])
api_router.include_router(rag.router, tags=["RAG Knowledge Base"])
api_router.include_router(templates.router, tags=["Checklist Templates"])
api_router.include_router(sites.router, tags=["Sites and Units"])
api_router.include_router(team.router, tags=["Team Members"])
api_router.include_router(notifications.router, tags=["Tenant Notifications"])
api_router.include_router(contact.router, tags=["Commercial Inquiries"])