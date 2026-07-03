import logging
from fastapi import APIRouter, Depends, status, HTTPException
from app.schemas.agse_goal import GoalSubmitRequest, GoalResponse
from app.services.goal_based_engineering_service import goal_based_engineering_service
from app.services.db_service import db_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/agse", tags=["agse"])
logger = logging.getLogger("app.api.routes.goal_based_engineering")

@router.post("/goals", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def submit_business_goal(
    payload: GoalSubmitRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Submits a business goal to trigger automated AGSE project specification loops.
    """
    try:
        session = await goal_based_engineering_service.submit_goal(
            business_goal=payload.business_goal,
            user_id=str(current_user.id)
        )
        return session
    except Exception as e:
        logger.error(f"Failed to submit AGSE goal: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit goal: {str(e)}"
        )

@router.get("/goals", response_model=list[GoalResponse])
async def list_business_goals(
    current_user: User = Depends(get_current_user)
):
    """
    Lists all goal sessions submitted to the AGSE core.
    """
    return await db_service.get_agse_goals(user_id=str(current_user.id))

@router.get("/goals/{goal_id}", response_model=GoalResponse)
async def get_business_goal_details(
    goal_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves execution details for a specific AGSE goal.
    """
    session = await db_service.get_agse_goal(goal_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AGSE Goal session not found."
        )
    return session
