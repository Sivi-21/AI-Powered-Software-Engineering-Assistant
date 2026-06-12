from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("app.exceptions")

class AppException(Exception):
    """Base exception for app errors"""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class ProjectNotFoundError(AppException):
    def __init__(self, project_id: str):
        super().__init__(
            message=f"Project with ID {project_id} not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )

class ParsingError(AppException):
    def __init__(self, detail: str):
        super().__init__(
            message=f"Failed to parse source files: {detail}",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
        )

class AgentWorkflowError(AppException):
    def __init__(self, detail: str):
        super().__init__(
            message=f"Error running analysis workflow: {detail}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def register_exception_handlers(app: FastAPI):
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        logger.error(f"AppException raised: {exc.message} (status: {exc.status_code})")
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An unexpected error occurred. Please contact the administrator."}
        )
