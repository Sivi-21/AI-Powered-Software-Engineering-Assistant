import logging
from datetime import datetime, timezone
from typing import Dict, Any, List
from app.services.db_service import db_service

logger = logging.getLogger("app.services.engineering_universe_service")

class EngineeringUniverseService:
    async def compile_universe(self, org_id: str) -> Dict[str, Any]:
        """
        Compiles the connected engineering universe for an organization,
        mapping high-level entities and relations.
        """
        # Fetch existing universe mapping from MongoDB
        universe = await db_service.get_engineering_universe(org_id)
        if universe:
            return universe

        logger.info(f"Compiling Engineering Universe map for Org: {org_id}")

        # Seed data mapping for Org Universe
        nodes = [
            {"id": "org-node", "label": "Enterprise Organization", "type": "organization", "metadata": {"status": "Active"}},
            {"id": "team-eng", "label": "Engineering Core", "type": "team", "metadata": {"members_count": 12}},
            {"id": "repo-portal", "label": "frontend-portal", "type": "repository", "metadata": {"lang": "Javascript", "loc": 14200}},
            {"id": "repo-gateway", "label": "api-gateway", "type": "repository", "metadata": {"lang": "Python", "loc": 9800}},
            {"id": "srv-auth", "label": "Auth Microservice", "type": "microservice", "metadata": {"port": 8080, "health": "Healthy"}},
            {"id": "srv-data", "label": "Data Pipeline", "type": "microservice", "metadata": {"port": 9000, "health": "Healthy"}},
            {"id": "db-pg", "label": "PostgreSQL Prod", "type": "database", "metadata": {"provider": "AWS RDS", "size_gb": 250}},
            {"id": "cloud-aws", "label": "AWS EKS Cluster", "type": "cloud", "metadata": {"nodes_count": 8, "region": "us-east-1"}},
            {"id": "policy-sec", "label": "OWASP Security standard", "type": "policy", "metadata": {"severity": "High"}}
        ]

        edges = [
            {"id": "e1", "source": "org-node", "target": "team-eng", "relationship": "has_team"},
            {"id": "e2", "source": "team-eng", "target": "repo-portal", "relationship": "owns_repo"},
            {"id": "e3", "source": "team-eng", "target": "repo-gateway", "relationship": "owns_repo"},
            {"id": "e4", "source": "repo-portal", "target": "srv-auth", "relationship": "contains_service"},
            {"id": "e5", "source": "repo-gateway", "target": "srv-data", "relationship": "contains_service"},
            {"id": "e6", "source": "srv-auth", "target": "db-pg", "relationship": "uses_db"},
            {"id": "e7", "source": "srv-data", "target": "db-pg", "relationship": "uses_db"},
            {"id": "e8", "source": "srv-auth", "target": "cloud-aws", "relationship": "hosted_on"},
            {"id": "e9", "source": "srv-data", "target": "cloud-aws", "relationship": "hosted_on"},
            {"id": "e10", "source": "org-node", "target": "policy-sec", "relationship": "implements_policy"}
        ]

        universe_doc = {
            "_id": org_id,
            "summary": "Unified enterprise microservices, repositories, database tables, and AWS cloud topology map.",
            "nodes": nodes,
            "edges": edges,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        await db_service.save_engineering_universe(universe_doc)
        universe_doc["org_id"] = universe_doc.pop("_id")
        return universe_doc

    async def delete_universe(self, org_id: str) -> bool:
        """Clears universe compilation from MongoDB."""
        return await db_service.delete_engineering_universe(org_id)

global_universe_service = EngineeringUniverseService()
