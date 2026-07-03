import logging
from fastapi import APIRouter, Depends, status, HTTPException
from app.schemas.universal_brain import BrainDecisionRequest, BrainDecisionResponse
from app.services.universal_brain_service import universal_brain_service
from app.services.db_service import db_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/brain", tags=["brain"])
logger = logging.getLogger("app.api.routes.universal_brain")

@router.post("/decide", response_model=BrainDecisionResponse, status_code=status.HTTP_201_CREATED)
async def submit_brain_decision_query(
    payload: BrainDecisionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Submits a complex architectural query to the Universal AI Engineering Brain for strategic trace resolution.
    """
    try:
        decision = await universal_brain_service.make_decision(
            query=payload.query,
            user_id=str(current_user.id)
        )
        return decision
    except Exception as e:
        logger.error(f"Universal Brain failed to process query: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Brain decision processing failed: {str(e)}"
        )

@router.get("/decisions", response_model=list[BrainDecisionResponse])
async def list_brain_decisions(
    current_user: User = Depends(get_current_user)
):
    """
    Lists past decision traces and risk profiles evaluated by the Universal Brain.
    """
    return await db_service.get_brain_decisions(user_id=str(current_user.id))
export = router
