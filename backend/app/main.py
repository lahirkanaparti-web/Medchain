import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Setup logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("medchain-backend")

from app.routes import batches, verify
from app.services.vision import load_model

# Rate Limiter setup for FastAPI
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing MedChain FastAPI Backend...")
    load_model()
    yield


app = FastAPI(
    title="MedChain Backend API",
    description="Pharmaceutical Supply Chain Traceability & Counterfeit Verification System",
    version="1.0.0",
    lifespan=lifespan
)

# Register slowapi state and rate limit exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS for local React dev server
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(batches.router)
app.include_router(verify.router)


@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "MedChain Pharmaceutical Supply Chain Traceability API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }
