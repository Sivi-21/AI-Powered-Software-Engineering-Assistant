import logging
from fastapi import APIRouter, Depends, status, HTTPException
from app.schemas.self_learning import FeedbackSubmission, LearningLogEntry
from app.services.self_learning_service import self_learning_service
from app.services.db_service import db_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/learning", tags=["learning"])
logger = logging.getLogger("app.api.routes.self_learning")

@router.post("/feedback", response_model=LearningLogEntry, status_code=status.HTTP_201_CREATED)
async def submit_learning_feedback(
    payload: FeedbackSubmission,
    current_user: User = Depends(get_current_user)
):
    """
    Submits corrections or feedback on code review recommendations.
    Triggers automated guidelines extraction.
    """
    try:
        rule = await self_learning_service.record_feedback(
            category=payload.category,
            original_recommendation=payload.original_recommendation,
            user_corrections=payload.user_corrections,
            score=payload.score,
            owner_id=str(current_user.id)
        )
        return rule
    except Exception as e:
        logger.error(f"Failed to record learning feedback: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit feedback: {str(e)}"
        )

@router.get("/rules", response_model=list[LearningLogEntry])
async def list_learned_rules(
    current_user: User = Depends(get_current_user)
):
    """
    Lists all guidelines and coding principles learned dynamically from feedback logs.
    """
    return await db_service.get_self_learning_rules(user_id=str(current_user.id))

@router.delete("/rules/{rule_id}", status_code=status.HTTP_200_OK)
async def delete_learned_rule(
    rule_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Clears a learned coding guideline.
    """
    deleted = await db_service.delete_self_learning_rule(rule_id, user_id=str(current_user.id))
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learned rule not found or you do not have permission to delete it."
        )
    return {"status": "success", "message": f"Rule {rule_id} deleted successfully."}
