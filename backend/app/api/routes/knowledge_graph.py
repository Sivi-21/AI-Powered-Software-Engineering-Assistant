import logging
from fastapi import APIRouter, Depends, status, HTTPException
from app.schemas.knowledge_graph import KnowledgeGraphResponse
from app.services.knowledge_graph_service import knowledge_graph_service
from app.services.db_service import db_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/graph", tags=["graph"])
logger = logging.getLogger("app.api.routes.knowledge_graph")

@router.get("/{project_id}", response_model=KnowledgeGraphResponse)
async def get_project_knowledge_graph(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get or compile the global knowledge graph for a project repository.
    """
    project = await db_service.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found."
        )

    # Scopes check: check that the user owns the project
    if str(project.get("owner_id")) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have access to this project."
        )

    try:
        graph = await knowledge_graph_service.get_or_generate_graph(project_id)
        return graph
    except Exception as e:
        logger.error(f"Failed to generate knowledge graph: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate knowledge graph: {str(e)}"
        )

@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
async def delete_project_knowledge_graph(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Clear compiled knowledge graph mapping for a repository.
    """
    project = await db_service.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found."
        )

    if str(project.get("owner_id")) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have access to this project."
        )

    deleted = await db_service.delete_knowledge_graph(project_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge graph data not found."
        )
    return {"status": "success", "message": f"Knowledge graph for project {project_id} deleted successfully."}
