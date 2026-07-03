import logging
from fastapi import APIRouter, Depends, status, HTTPException
from app.schemas.universe import UniverseResponse
from app.services.engineering_universe_service import global_universe_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/universe", tags=["universe"])
logger = logging.getLogger("app.api.routes.engineering_universe")

@router.get("/{org_id}", response_model=UniverseResponse)
async def get_org_engineering_universe(
    org_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get connected engineering universe map connecting services, teams, databases, and infra.
    """
    try:
        universe = await global_universe_service.compile_universe(org_id)
        return universe
    except Exception as e:
        logger.error(f"Failed to fetch engineering universe: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve ecosystem universe: {str(e)}"
        )

@router.delete("/{org_id}", status_code=status.HTTP_200_OK)
async def clear_org_engineering_universe(
    org_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Deletes the compiled organization universe, forcing a fresh re-index on next load.
    """
    deleted = await global_universe_service.delete_universe(org_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Engineering universe map not found or already deleted."
        )
    return {"status": "success", "message": f"Universe map for Org {org_id} cleared successfully."}
