import logging
from fastapi import APIRouter, Depends, status, HTTPException
from app.schemas.organization import OrganizationCreate, InviteMemberRequest, OrganizationResponse
from app.services.organization_service import organization_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/organization", tags=["organization"])
logger = logging.getLogger("app.api.routes.organization")

@router.get("/current", response_model=OrganizationResponse)
async def get_current_organization(
    current_user: User = Depends(get_current_user)
):
    """
    Get organization cloud workspace details associated with the current user.
    """
    try:
        org = await organization_service.get_user_organization(owner_id=str(current_user.id))
        return org
    except Exception as e:
        logger.error(f"Failed to fetch organization: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch organization workspace: {str(e)}"
        )

@router.post("/create", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization_workspace(
    payload: OrganizationCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new multi-tenant organization cloud workspace.
    """
    try:
        org = await organization_service.create_organization(
            name=payload.name,
            owner_id=str(current_user.id)
        )
        return org
    except Exception as e:
        logger.error(f"Failed to create organization: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize organization workspace: {str(e)}"
        )

@router.post("/invite", response_model=OrganizationResponse)
async def invite_team_member(
    payload: InviteMemberRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Invite or add a team member/developer to the current active organization.
    """
    try:
        current_org = await organization_service.get_user_organization(owner_id=str(current_user.id))
        updated_org = await organization_service.invite_member(
            org_id=current_org["id"],
            email=payload.email,
            role=payload.role
        )
        return updated_org
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as e:
        logger.error(f"Failed to invite member: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process member invitation: {str(e)}"
        )
