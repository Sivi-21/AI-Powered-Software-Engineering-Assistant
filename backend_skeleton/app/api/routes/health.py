from fastapi import APIRouter, status

router = APIRouter(prefix="/health", tags=["system-health"])

@router.get("", status_code=status.HTTP_200_OK)
async def check_health():
    """Simple status check verifying if the FastAPI server is reachable."""
    return {
        "status": "healthy",
        "service": "AI-Powered Software Engineering Assistant Backend"
    }
