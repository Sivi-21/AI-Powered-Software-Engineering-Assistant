import logging
from fastapi import APIRouter, Depends, status, HTTPException
from app.schemas.autonomous_agent import EngineeringGoalRequest, AutonomousAgentResponse
from app.services.autonomous_agent_service import autonomous_agent_service
from app.services.db_service import db_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/autonomous", tags=["autonomous"])
logger = logging.getLogger("app.api.routes.autonomous_agent")

@router.post("/execute", response_model=AutonomousAgentResponse, status_code=status.HTTP_201_CREATED)
async def execute_engineering_goal(
    payload: EngineeringGoalRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Submit an engineering goal to trigger the autonomous multi-agent task runner.
    """
    try:
        session = await autonomous_agent_service.create_and_execute_session(
            goal=payload.goal,
            project_id=payload.project_id,
            user_id=str(current_user.id)
        )
        return session
    except Exception as e:
        logger.error(f"Failed to kick off autonomous execution: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start execution: {str(e)}"
        )

@router.get("/sessions", response_model=list[AutonomousAgentResponse])
async def list_sessions(
    current_user: User = Depends(get_current_user)
):
    """
    List all past and active autonomous execution sessions.
    """
    return await db_service.get_autonomous_sessions(user_id=str(current_user.id))

@router.get("/sessions/{session_id}", response_model=AutonomousAgentResponse)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve details of a specific autonomous execution session.
    """
    session = await db_service.get_autonomous_session(session_id, user_id=str(current_user.id))
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found."
        )
    return session

@router.delete("/sessions/{session_id}", status_code=status.HTTP_200_OK)
async def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a specific autonomous session records.
    """
    deleted = await db_service.delete_autonomous_session(session_id, user_id=str(current_user.id))
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or you do not have permission to delete it."
        )
    return {"status": "success", "message": f"Session {session_id} deleted successfully."}
