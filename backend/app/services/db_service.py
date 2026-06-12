import logging
import uuid
from datetime import datetime, timezone
from app.mongodb import get_database
from app.schemas.report import ReportCreate
from app.schemas.user import UserCreate
from app.schemas.user import UserOut


logger = logging.getLogger("app.services.db_service")

class DBService:
    # --- User Methods ---

    async def get_user(self, user_id: str) -> dict | None:
        """Retrieves a single user by ID."""
        db = get_database()
        user = await db.users.find_one({"_id": str(user_id)})
        if user:
            user["id"] = user.pop("_id")
        return user

    async def get_user_by_email(self, email: str) -> dict | None:
        """Retrieves a single user by email."""
        db = get_database()
        user = await db.users.find_one({"email": email})
        if user:
            user["id"] = user.pop("_id")
        return user

    async def create_user(self, user_in: UserCreate) -> dict:
        """Creates a new User record with a hashed password."""
        from app.services.auth_helper import hash_password
        db = get_database()
        user_id = str(uuid.uuid4())
        user_doc = {
            "_id": user_id,
            "email": user_in.email,
            "hashed_password": hash_password(user_in.password),
            "full_name": user_in.full_name,
            "organization": user_in.organization,
            "plan_type": "Developer Plan",
            "created_at": datetime.now(timezone.utc),
            "github_id": None,
            "avatar_url": None
        }
        await db.users.insert_one(user_doc)
        user_doc["id"] = user_doc.pop("_id")
        logger.info(f"Created user in MongoDB: {user_id} ({user_in.email})")
        return user_doc

    async def get_user_by_github_id(self, github_id: str) -> dict | None:
        """Retrieves a single user by their GitHub user ID."""
        db = get_database()
        user = await db.users.find_one({"github_id": github_id})
        if user:
            user["id"] = user.pop("_id")
        return user

    async def create_github_user(
        self,
        github_id: str,
        email: str,
        full_name: str,
        avatar_url: str | None = None
    ) -> dict:
        """Creates a new User record for GitHub OAuth login."""
        import secrets
        from app.services.auth_helper import hash_password
        db = get_database()
        random_pass = secrets.token_urlsafe(24)
        user_id = str(uuid.uuid4())
        user_doc = {
            "_id": user_id,
            "email": email,
            "hashed_password": hash_password(random_pass),
            "full_name": full_name,
            "organization": "GitHub Sandbox",
            "plan_type": "Developer Plan",
            "created_at": datetime.now(timezone.utc),
            "github_id": github_id,
            "avatar_url": avatar_url
        }
        await db.users.insert_one(user_doc)
        user_doc["id"] = user_doc.pop("_id")
        logger.info(f"Created GitHub user in MongoDB: {user_id} ({email})")
        return user_doc

    # --- Project & Report Scoped Methods ---

    async def create_project(
        self, 
        name: str,
        project_id: str | uuid.UUID | None = None,
        user_id: str | uuid.UUID | None = None,
        repository_source: str = "ZIP",
        github_url: str | None = None,
        commit_hash: str | None = None,
        clone_timestamp = None
    ) -> dict:
        """Creates a new Repository document in MongoDB, associated with a user."""
        db = get_database()
        proj_id = str(project_id) if project_id else str(uuid.uuid4())
        owner_id = str(user_id) if user_id else None
        
        project_doc = {
            "_id": proj_id,
            "repository_name": name,
            "status": "pending",
            "current_progress": "Initializing...",
            "owner_id": owner_id,
            "repository_source": repository_source,
            "github_url": github_url,
            "commit_hash": commit_hash,
            "clone_timestamp": clone_timestamp,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "error_message": None
        }
        await db.repositories.insert_one(project_doc)
        project_doc["id"] = project_doc.pop("_id")
        logger.info(f"Created repository in MongoDB: {proj_id} ({name}) for owner {owner_id}")
        return project_doc

    async def get_project(self, project_id: str | uuid.UUID, user_id: str | uuid.UUID | None = None) -> dict | None:
        """Retrieves a single repository by its ID, optionally scoped to user."""
        db = get_database()
        query = {"_id": str(project_id)}
        if user_id:
            query["owner_id"] = str(user_id)
            
        project = await db.repositories.find_one(query)
        if project:
            project["id"] = project.pop("_id")
        return project

    async def get_all_projects(self, user_id: str | uuid.UUID | None = None) -> list[dict]:
        """Retrieves all repositories, optionally scoped to user."""
        db = get_database()
        query = {}
        if user_id:
            query["owner_id"] = str(user_id)
            
        cursor = db.repositories.find(query).sort("created_at", -1)
        projects = []
        async for project in cursor:
            project["id"] = project.pop("_id")
            projects.append(project)
        return projects

    async def update_project_progress(self, project_id: str | uuid.UUID, progress: str) -> bool:
        """Updates the current_progress message for a repository."""
        db = get_database()
        result = await db.repositories.update_one(
            {"_id": str(project_id)},
            {"$set": {"current_progress": progress, "updated_at": datetime.now(timezone.utc)}}
        )
        return result.modified_count > 0

    async def update_project_status(
        self, project_id: str | uuid.UUID, status: str, error_message: str | None = None
    ) -> dict | None:
        """Updates the status and potential error messages for a project."""
        db = get_database()
        update_fields = {"status": status, "updated_at": datetime.now(timezone.utc)}
        if error_message is not None:
            update_fields["error_message"] = error_message
            
        result = await db.repositories.find_one_and_update(
            {"_id": str(project_id)},
            {"$set": update_fields},
            return_document=True
        )
        if result:
            result["id"] = result.pop("_id")
            logger.info(f"Updated repository {project_id} status to {status}")
        return result

    async def delete_project(self, project_id: str | uuid.UUID, user_id: str | uuid.UUID | None = None) -> bool:
        """Deletes a project document from MongoDB, scoped to user if user_id is provided."""
        db = get_database()
        query = {"_id": str(project_id)}
        if user_id:
            query["owner_id"] = str(user_id)
            
        result = await db.repositories.delete_one(query)
        if result.deleted_count > 0:
            logger.info(f"Deleted repository {project_id} from MongoDB.")
            # Also cascade delete reports
            await db.reports.delete_many({"repository_id": str(project_id)})
            return True
        return False

    async def create_report(self, report_data: ReportCreate) -> dict:
        """Stores a generated AI report in MongoDB."""
        db = get_database()
        report_id = str(uuid.uuid4())
        
        report_doc = {
            "_id": report_id,
            "repository_id": str(report_data.project_id),
            "summary": report_data.summary,
            "code_quality_score": report_data.code_quality_score,
            "vulnerabilities": [v.model_dump() for v in report_data.vulnerabilities] if report_data.vulnerabilities else [],
            "suggestions": [s.model_dump() for s in report_data.suggestions] if report_data.suggestions else [],
            "full_report_md": report_data.full_report_md,
            "created_at": datetime.now(timezone.utc)
        }
        await db.reports.insert_one(report_doc)
        report_doc["id"] = report_doc.pop("_id")
        logger.info(f"Stored report {report_id} for repository {report_data.project_id}")
        return report_doc

    async def get_report_by_project(self, project_id: str | uuid.UUID, user_id: str | uuid.UUID | None = None) -> dict | None:
        """Retrieves the analysis report linked to a project, verifying user ownership if user_id is provided."""
        db = get_database()
        if user_id:
            project = await self.get_project(str(project_id), user_id)
            if not project:
                return None
                
        report = await db.reports.find_one({"repository_id": str(project_id)})
        if report:
            report["id"] = report.pop("_id")
        return report

# Instantiate the service
db_service = DBService()
