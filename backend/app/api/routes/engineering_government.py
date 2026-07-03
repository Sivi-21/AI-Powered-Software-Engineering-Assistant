import logging
from fastapi import APIRouter, Depends, status, HTTPException
from app.schemas.government import GovernmentProposalRequest, GovernmentSessionResponse
from app.services.engineering_government_service import global_gov_service
from app.services.db_service import db_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/government", tags=["government"])
logger = logging.getLogger("app.api.routes.engineering_government")

@router.post("/propose", response_model=GovernmentSessionResponse, status_code=status.HTTP_201_CREATED)
async def submit_government_proposal(
    payload: GovernmentProposalRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Submits a policy proposal to trigger a mock boardroom debate session between AEC AI officers.
    """
    try:
        session = await global_gov_service.conduct_council_debate(
            proposal=payload.proposal,
            user_id=str(current_user.id)
        )
        return session
    except Exception as e:
        logger.error(f"Council debate failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Boardroom proposal processing failed: {str(e)}"
        )

@router.get("/sessions", response_model=list[GovernmentSessionResponse])
async def list_government_sessions(
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves a list of previous executive boardroom debate records and ballots.
    """
    return await db_service.get_government_sessions(user_id=str(current_user.id))
