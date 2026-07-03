import logging
from datetime import datetime, timezone
from typing import Dict, Any, List
from app.services.db_service import db_service

logger = logging.getLogger("app.services.digital_twin_service")

class DigitalTwinService:
    async def get_digital_twin(self, org_id: str) -> Dict[str, Any]:
        """
        Retrieves real-time digital twin health metrics, business units,
        and cloud infrastructure costs for an organization.
        """
        # Fetch existing digital twin details from MongoDB
        twin = await db_service.get_digital_twin(org_id)
        if twin:
            return twin

        logger.info(f"Generating live Digital Twin data for Org: {org_id}")

        # Seed data metrics mapping
        twin_doc = {
            "_id": org_id,
            "health_index": 92,
            "compliance_score": 86,
            "monthly_cloud_spend": 12850.0,
            "business_units": [
                {"name": "Core Banking System", "status": "active", "leads": ["Sarah Jenkins (Dir)"]},
                {"name": "Data Analytics Division", "status": "active", "leads": ["Marcus Vance (PM)"]},
                {"name": "Internal Billing API", "status": "warning", "leads": ["Toby Flenderson (Dev)"]}
            ],
            "cloud_assets": [
                {"name": "Production EKS Cluster", "asset_type": "VM Cluster", "status": "healthy", "monthly_cost": 4200.0},
                {"name": "AWS Aurora PostgreSQL", "asset_type": "Database", "status": "healthy", "monthly_cost": 2800.0},
                {"name": "Billing API Gateway", "asset_type": "API Gateway", "status": "warning", "monthly_cost": 1250.0},
                {"name": "Redis Session Caching", "asset_type": "Cache", "status": "healthy", "monthly_cost": 600.0}
            ],
            "warnings": [
                "Billing API Gateway is reporting 2% higher latency on healthchecks.",
                "Compliance check: SOC 2 policy standard audit needs revision."
            ],
            "updated_at": datetime.now(timezone.utc)
        }

        await db_service.save_digital_twin(twin_doc)
        twin_doc["org_id"] = twin_doc.pop("_id")
        return twin_doc

    async def simulate_traffic_cost(self, org_id: str, load_factor: float) -> Dict[str, Any]:
        """
        Simulates request load variations on active cloud assets, updating spend projections.
        """
        twin = await self.get_digital_twin(org_id)
        
        # Calculate simulated costs
        simulated_assets = []
        total_spend = 0.0
        warnings = list(twin.get("warnings", []))

        for asset in twin.get("cloud_assets", []):
            base_cost = asset["monthly_cost"]
            # Traffic load scales VM clusters and API gateways directly
            factor = load_factor if asset["asset_type"] in ["VM Cluster", "API Gateway"] else 1.1
            sim_cost = round(base_cost * factor, 2)
            
            simulated_assets.append({
                **asset,
                "monthly_cost": sim_cost,
                "status": "warning" if (factor > 1.8 and asset["status"] == "healthy") else asset["status"]
            })
            total_spend += sim_cost

        if load_factor > 1.8:
            warnings.append(f"Load Simulation Alert: Production EKS Cluster capacity threshold reached ({int(load_factor * 50)}% CPU utilization).")

        return {
            "org_id": org_id,
            "health_index": max(60, int(twin["health_index"] - (load_factor * 5))),
            "compliance_score": twin["compliance_score"],
            "monthly_cloud_spend": round(total_spend, 2),
            "business_units": twin["business_units"],
            "cloud_assets": simulated_assets,
            "warnings": warnings,
            "updated_at": datetime.now(timezone.utc)
        }

global_twin_service = DigitalTwinService()
