import logging
from fastapi import APIRouter, Depends, status, HTTPException, Query
from app.schemas.digital_twin import DigitalTwinResponse
from app.services.digital_twin_service import global_twin_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/twin", tags=["twin"])
logger = logging.getLogger("app.api.routes.digital_twin")

@router.get("/{org_id}", response_model=DigitalTwinResponse)
async def get_org_digital_twin_profile(
    org_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Fetch organization digital twin dependencies map, costs, and vulnerability warning lists.
    """
    try:
        twin = await global_twin_service.get_digital_twin(org_id)
        return twin
    except Exception as e:
        logger.error(f"Failed to fetch digital twin: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve twin mapping: {str(e)}"
        )

@router.post("/{org_id}/simulate", response_model=DigitalTwinResponse)
async def simulate_twin_traffic_impact(
    org_id: str,
    load_factor: float = Query(1.0, ge=0.5, le=5.0),
    current_user: User = Depends(get_current_user)
):
    """
    Simulates traffic scaling load factor impact projections on cloud resources.
    """
    try:
        simulated = await global_twin_service.simulate_traffic_cost(org_id, load_factor)
        return simulated
    except Exception as e:
        logger.error(f"Failed to simulate twin impact: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Traffic load simulation failed: {str(e)}"
        )
