import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List
from app.services.db_service import db_service

logger = logging.getLogger("app.services.organization_service")

class OrganizationService:
    async def create_organization(self, name: str, owner_id: str) -> Dict[str, Any]:
        """
        Creates and seeds a new multi-tenant organization workspace.
        """
        org_id = str(uuid.uuid4())
        logger.info(f"Creating organization: {name} ({org_id}) for owner {owner_id}")

        org_doc = {
            "_id": org_id,
            "name": name,
            "owner_id": owner_id,
            "projects": ["Default Project", "Alpha Release"],
            "repositories": ["frontend-portal", "api-gateway", "data-pipeline"],
            "teams": [
                {
                    "email": "dev@intellios.ai",
                    "role": "Owner",
                    "joined_at": datetime.now(timezone.utc)
                }
            ],
            "cloud_resources": [
                {"provider": "AWS", "resource_type": "Kubernetes", "name": "prod-cluster-01", "status": "Connected"},
                {"provider": "AWS", "resource_type": "Database", "name": "aws-aurora-postgres", "status": "Connected"},
                {"provider": "GCP", "resource_type": "Caching", "name": "redis-session-cache", "status": "Connected"}
            ],
            "knowledge_base": [
                "architecture_standard_v2.md",
                "security_hardening_checklist.md",
                "onboarding_guide.md"
            ],
            "analytics": {
                "health_score": 92,
                "coverage": 84,
                "technical_debt_hours": 45,
                "vulnerabilities_count": 2
            },
            "shared_memory": [
                "Prefer clean architectures using service layer abstractions.",
                "Ensure all backend API routes implement strict schema validations."
            ],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        await db_service.save_organization(org_doc)
        org_doc["id"] = org_doc.pop("_id")
        return org_doc

    async def get_user_organization(self, owner_id: str) -> Dict[str, Any]:
        """
        Retrieves the organization workspace associated with the user, creating one
        if none exists yet.
        """
        org = await db_service.get_organization_by_owner(owner_id)
        if not org:
            # Seed default organization
            org = await self.create_organization("Default Organization", owner_id)
        return org

    async def invite_member(self, org_id: str, email: str, role: str) -> Dict[str, Any]:
        """
        Adds a new member node to the organization's team list.
        """
        org = await db_service.get_organization(org_id)
        if not org:
            raise ValueError(f"Organization {org_id} not found.")

        teams = org.get("teams", [])
        # Check if already added
        if any(m.get("email") == email for m in teams):
            raise ValueError(f"User {email} is already in the organization.")

        teams.append({
            "email": email,
            "role": role,
            "joined_at": datetime.now(timezone.utc)
        })

        await db_service.update_organization_teams(org_id, teams)
        
        # Return updated org
        updated_org = await db_service.get_organization(org_id)
        return updated_org

organization_service = OrganizationService()
