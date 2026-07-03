import logging
from fastapi import APIRouter, Depends, status, HTTPException
from app.schemas.company_simulator import SimulatorSessionRequest, SimulatorSessionResponse
from app.services.company_simulator_service import company_simulator_service
from app.services.db_service import db_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/simulator", tags=["simulator"])
logger = logging.getLogger("app.api.routes.company_simulator")

@router.post("/start", response_model=SimulatorSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_company_simulation(
    payload: SimulatorSessionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Initializes a new AI Software Company Simulator session.
    """
    try:
        session = await company_simulator_service.start_simulation(
            objective=payload.objective,
            user_id=str(current_user.id)
        )
        return session
    except Exception as e:
        logger.error(f"Failed to start company simulation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start simulation: {str(e)}"
        )

@router.get("/sessions", response_model=list[SimulatorSessionResponse])
async def list_simulation_sessions(
    current_user: User = Depends(get_current_user)
):
    """
    Lists all simulation histories for the current user.
    """
    return await db_service.get_simulator_sessions(user_id=str(current_user.id))

@router.get("/sessions/{session_id}", response_model=SimulatorSessionResponse)
async def get_simulation_session_details(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the current thread messages and status of a simulation.
    """
    session = await db_service.get_simulator_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation session not found."
        )
    return session
