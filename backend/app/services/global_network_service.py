import logging
from datetime import datetime, timezone
from typing import Dict, Any, List
from app.services.db_service import db_service

logger = logging.getLogger("app.services.global_network_service")

class GlobalNetworkService:
    async def get_civilization_overview(self) -> Dict[str, Any]:
        """
        Compiles civilization-wide statistics, active connected tenants,
        and the shared policy registry.
        """
        # Fetch or seed the network doc
        network = await db_service.get_global_network()
        if not network:
            # Seed default civilization network data
            network = {
                "_id": "civilization-01",
                "metrics": {
                    "total_organizations": 4,
                    "total_collaborative_agents": 284,
                    "shared_policies_count": 8,
                    "security_alerts_patched": 142
                },
                "organizations": [
                    {"id": "org-acme", "name": "Acme Systems", "health_score": 94, "connected_repos_count": 5},
                    {"id": "org-globex", "name": "Globex Corp", "health_score": 88, "connected_repos_count": 3},
                    {"id": "org-hooli", "name": "Hooli Tech", "health_score": 91, "connected_repos_count": 8},
                    {"id": "org-initech", "name": "Initech Corp", "health_score": 82, "connected_repos_count": 4}
                ],
                "shared_policy_registry": [
                    {
                        "policy_name": "OWASP Top 10 Strict Compliance",
                        "source_org": "Acme Systems",
                        "shared_with": ["Globex Corp", "Hooli Tech"],
                        "created_at": datetime.now(timezone.utc)
                    },
                    {
                        "policy_name": "Continuous Integration Test Speed standard",
                        "source_org": "Hooli Tech",
                        "shared_with": ["Initech Corp"],
                        "created_at": datetime.now(timezone.utc)
                    }
                ],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            await db_service.save_global_network(network)

        network["civilization_id"] = network.pop("_id")
        return network

    async def share_policy(self, policy_name: str, source_org: str, targets: List[str]) -> Dict[str, Any]:
        """
        Shares a standard policy or security ruleset across organizations in the network.
        """
        network = await db_service.get_global_network()
        if not network:
            raise ValueError("Civilization network not initialized.")

        registry = network.get("shared_policy_registry", [])
        
        # Check if already shared
        for p in registry:
            if p["policy_name"] == policy_name and p["source_org"] == source_org:
                p["shared_with"] = list(set(p["shared_with"] + targets))
                break
        else:
            registry.append({
                "policy_name": policy_name,
                "source_org": source_org,
                "shared_with": targets,
                "created_at": datetime.now(timezone.utc)
            })

        # Update metrics
        metrics = network.get("metrics", {})
        metrics["shared_policies_count"] = len(registry)

        await db_service.update_global_network_registry(network["_id"], registry, metrics)
        
        # Return updated civilization network
        updated_network = await db_service.get_global_network()
        updated_network["civilization_id"] = updated_network.pop("_id")
        return updated_network

global_network_service = GlobalNetworkService()
