import logging
from fastapi import APIRouter, Depends, status, HTTPException
from app.schemas.global_network import SharedPolicyRequest, NetworkOverviewResponse
from app.services.global_network_service import global_network_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/civilization", tags=["civilization"])
logger = logging.getLogger("app.api.routes.global_network")

@router.get("/overview", response_model=NetworkOverviewResponse)
async def get_civilization_network_overview(
    current_user: User = Depends(get_current_user)
):
    """
    Get civilization-wide network statistics and organizations list.
    """
    try:
        overview = await global_network_service.get_civilization_overview()
        return overview
    except Exception as e:
        logger.error(f"Failed to fetch civilization network: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch civilization data: {str(e)}"
        )

@router.post("/share-policy", response_model=NetworkOverviewResponse)
async def share_policy_cross_tenant(
    payload: SharedPolicyRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Share a standard policy checklist across organization boundaries.
    """
    try:
        updated_network = await global_network_service.share_policy(
            policy_name=payload.policy_name,
            source_org=payload.source_org,
            targets=payload.targets
        )
        return updated_network
    except Exception as e:
        logger.error(f"Failed to share policy: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to share engineering policy: {str(e)}"
        )
