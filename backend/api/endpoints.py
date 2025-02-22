from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..core.indicators import Indicators

router = APIRouter()

@router.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint"""
    return {"status": "healthy"} 