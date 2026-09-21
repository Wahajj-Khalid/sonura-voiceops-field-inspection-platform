import os
import sys
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.api.v1.router import api_router

logger = logging.getLogger("sonura-main")
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    agent_process = None
    if settings.LIVEKIT_URL and settings.LIVEKIT_API_KEY:
        try:
            current_env = dict(os.environ)
            current_env["PYTHONPATH"] = os.getenv("PYTHONPATH", "/opt/render/project/src/backend")
            
            agent_process = await asyncio.create_subprocess_exec(
                sys.executable,
                "-m",
                "app.agent.voice_agent",
                "dev",
                env=current_env
            )
            logger.info(f"LiveKit Voice Agent background process launched (PID: {agent_process.pid})")
        except Exception as e:
            logger.error(f"Failed to launch background voice agent process: {str(e)}")
    else:
        logger.warning("LiveKit credentials not configured. Voice agent worker disabled.")

    yield

    if agent_process:
        try:
            agent_process.terminate()
            await agent_process.wait()
            logger.info("LiveKit Voice Agent background process terminated.")
        except Exception:
            pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url=None,
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please check system logs."}
    )

@app.api_route("/", methods=["GET", "HEAD"], tags=["Health Check"])
async def root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

@app.api_route("/health", methods=["GET", "HEAD"], tags=["Health Check"])
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION
    }

app.include_router(api_router, prefix="/api/v1")