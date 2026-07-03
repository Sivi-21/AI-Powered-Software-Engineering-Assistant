import logging
from fastapi import APIRouter, Depends, status, HTTPException
from app.schemas.planning import ProjectPlanRequest, ProjectPlanResponse
from app.services.planner_service import planner_service
from app.services.db_service import db_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/planning", tags=["planning"])
logger = logging.getLogger("app.api.routes.planning")

@router.post("/generate", response_model=ProjectPlanResponse, status_code=status.HTTP_201_CREATED)
async def generate_plan(
    payload: ProjectPlanRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate a new software project plan based on a description prompt.
    """
    try:
        plan = await planner_service.generate_project_plan(
            idea=payload.idea,
            user_id=str(current_user.id)
        )
        return plan
    except Exception as e:
        logger.error(f"Failed to generate project plan: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate project plan: {str(e)}"
        )

@router.get("/plans", response_model=list[ProjectPlanResponse])
async def list_plans(
    current_user: User = Depends(get_current_user)
):
    """
    List all generated project plans for the current authenticated user.
    """
    return await db_service.get_project_plans(user_id=str(current_user.id))

@router.get("/plans/{plan_id}", response_model=ProjectPlanResponse)
async def get_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve a specific project plan.
    """
    plan = await db_service.get_project_plan(plan_id, user_id=str(current_user.id))
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project plan not found."
        )
    return plan

@router.delete("/plans/{plan_id}", status_code=status.HTTP_200_OK)
async def delete_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a specific project plan.
    """
    deleted = await db_service.delete_project_plan(plan_id, user_id=str(current_user.id))
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project plan not found or you do not have permission to delete it."
        )
    return {"status": "success", "message": f"Project plan {plan_id} deleted successfully."}
