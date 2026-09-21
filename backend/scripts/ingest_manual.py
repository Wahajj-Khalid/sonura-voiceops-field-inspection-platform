import asyncio
from fastembed import TextEmbedding
from supabase import create_client
from app.core.config import settings
from app.core.constants import EMBEDDING_MODEL_NAME, DEFAULT_ORG_ID

SAMPLE_MANUAL_CHUNKS = [
    {
        "manual_title": "Industrial HVAC and Pressure System Manual v4.2",
        "category": "HVAC",
        "page_number": 12,
        "content": "Building 4B Main Pressure Valve normal operating range is 45 to 60 PSI. If readings exceed 65 PSI, trigger emergency bypass protocol B-2."
    },
    {
        "manual_title": "Industrial HVAC and Pressure System Manual v4.2",
        "category": "HVAC",
        "page_number": 18,
        "content": "Compressor intake filters must be inspected every 30 days. Replacement part number is FLT-9982. Clean using low-pressure compressed air only."
    },
    {
        "manual_title": "Safety Standards Protocol 2026",
        "category": "Safety",
        "page_number": 3,
        "content": "Secondary coolant loop seals require immediate replacement if micro-cracks exceed 0.5mm or if fluid seepage is visible near the manifold."
    }
]

async def seed_manuals():
    embedding_model = TextEmbedding(model_name=EMBEDDING_MODEL_NAME)
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    
    for chunk in SAMPLE_MANUAL_CHUNKS:
        embeddings = list(embedding_model.embed([chunk["content"]]))
        vector = embeddings[0].tolist()
        
        supabase.table("manual_sections").insert({
            "org_id": DEFAULT_ORG_ID,
            "manual_title": chunk["manual_title"],
            "category": chunk["category"],
            "page_number": chunk["page_number"],
            "content": chunk["content"],
            "embedding": vector
        }).execute()
        
        print(f"Ingested: {chunk['manual_title']} (Page {chunk['page_number']})")

if __name__ == "__main__":
    asyncio.run(seed_manuals())