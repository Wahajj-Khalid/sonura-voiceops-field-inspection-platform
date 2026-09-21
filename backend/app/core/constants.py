"""
Sonura Centralized Backend Constants
Single source of truth for backend AI models, chunking rules, and system defaults.
"""

# AI Model Identifiers
GROQ_MODEL = "openai/gpt-oss-20b"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

# Google Gemini Vision Configuration
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# Active Vision Models for Google API Keys
GEMINI_PRIORITY_MODELS = [
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-flash-lite-latest",
    "gemini-2.5-flash-image",
    "gemini-3.1-pro-preview"
]

EMBEDDING_MODEL_NAME = "BAAI/bge-small-en-v1.5"
EMBEDDING_DIMENSION = 384

DEEPGRAM_STT_MODEL = "nova-2-general"
DEEPGRAM_TTS_VOICE = "aura-asteria-en"

# RAG Configuration
RAG_CHUNK_SIZE = 500
RAG_CHUNK_OVERLAP = 50
RAG_TOP_K_MATCHES = 2
RAG_SIMILARITY_THRESHOLD = 0.3

# Default System Identifiers
SUPER_ADMIN_ORG_ID = "00000000-0000-0000-0000-000000000000"
DEFAULT_ORG_ID = "11111111-1111-1111-1111-111111111111"
DEFAULT_UNIT_ID = "BUILDING-4B"
DEFAULT_INSPECTOR_ID = "Operator 01"

# Plan Tier Default Quotas
PLAN_QUOTAS = {
    "pilot": {
        "max_users": 5,
        "max_sites": 2,
        "max_audits": 50,
        "storage_limit_mb": 100,
    },
    "growth": {
        "max_users": 25,
        "max_sites": 15,
        "max_audits": 500,
        "storage_limit_mb": 1024,
    },
    "enterprise": {
        "max_users": 100,
        "max_sites": 50,
        "max_audits": 5000,
        "storage_limit_mb": 10240,
    },
}