import logging
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.llm_provider import get_llm
from app.services.retry_helper import ainvoke_with_retry
from app.services.db_service import db_service

logger = logging.getLogger("app.services.goal_based_engineering_service")

class GoalBasedEngineeringService:
    def __init__(self):
        self.llm = get_llm(json_mode=False)

    async def submit_goal(self, business_goal: str, user_id: str | None = None) -> Dict[str, Any]:
        """
        Submits a high-level business objective to the AGSE core, initializes stages,
        and starts background execution.
        """
        goal_id = str(uuid.uuid4())
        logger.info(f"AGSE received new business goal: {business_goal[:60]} ({goal_id})")

        stages = [
            {"stage_name": "Requirements", "status": "pending", "content": "", "updated_at": datetime.now(timezone.utc)},
            {"stage_name": "Architecture", "status": "pending", "content": "", "updated_at": datetime.now(timezone.utc)},
            {"stage_name": "Database", "status": "pending", "content": "", "updated_at": datetime.now(timezone.utc)},
            {"stage_name": "APIs", "status": "pending", "content": "", "updated_at": datetime.now(timezone.utc)},
            {"stage_name": "Deployment", "status": "pending", "content": "", "updated_at": datetime.now(timezone.utc)}
        ]

        goal_doc = {
            "_id": goal_id,
            "business_goal": business_goal,
            "owner_id": user_id,
            "status": "running",
            "stages": stages,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        await db_service.save_agse_goal(goal_doc)

        # Launch pipeline loop asynchronously
        asyncio.create_task(self._process_goal_pipeline(goal_id))

        goal_doc["id"] = goal_doc.pop("_id")
        return goal_doc

    async def _process_goal_pipeline(self, goal_id: str):
        """
        Sequentially executes LLM prompts to build design specifications for each stage.
        """
        stage_prompts = {
            "Requirements": (
                "Identify primary business requirements, target users, core feature epics, "
                "and modular structure for the following system goal:\n"
            ),
            "Architecture": (
                "Design system components layout, service-oriented modules, routing topology, "
                "caching mechanism, and data-flow interfaces based on requirements:\n"
            ),
            "Database": (
                "Provide detailed relational SQL table definitions, field types, index keys, "
                "foreign keys, and logical schemas conforming to the architecture:\n"
            ),
            "APIs": (
                "Layout standard REST API endpoints (routes, requests, response schemas, "
                "query filters, and auth middlewares):\n"
            ),
            "Deployment": (
                "Write Dockerfile template config, CI/CD pipeline yaml phases, automated QA "
                "unit testing parameters, and a production release checklist:\n"
            )
        }

        # Load active session
        session = await db_service.get_agse_goal(goal_id)
        if not session:
            return

        stages = session.get("stages", [])
        goal_text = session.get("business_goal")
        context_accumulated = f"Business Objective: {goal_text}\n\n"

        for idx, stage in enumerate(stages):
            logger.info(f"AGSE executing stage: {stage['stage_name']} for session {goal_id}")
            stage["status"] = "running"
            stage["updated_at"] = datetime.now(timezone.utc)
            await db_service.update_agse_goal_stages(goal_id, stages)

            # Sleep 2 seconds for visual spacing in UI
            await asyncio.sleep(2)

            prompt = (
                f"{stage_prompts[stage['stage_name']]}\n"
                f"Accumulated Blueprint Details:\n{context_accumulated}\n\n"
                "Respond with clear, comprehensive markdown formatting explaining the specification."
            )

            try:
                response = await ainvoke_with_retry(self.llm, [
                    SystemMessage(content=f"You are the AGSE Core Intelligence leading the {stage['stage_name']} architectural specifications stage."),
                    HumanMessage(content=prompt)
                ])
                content = response.content
            except Exception as e:
                logger.error(f"AGSE stage {stage['stage_name']} failed: {e}")
                content = f"### {stage['stage_name']} spec generation encountered an error.\n{str(e)}"

            stage["status"] = "completed"
            stage["content"] = content
            stage["updated_at"] = datetime.now(timezone.utc)
            
            # Save progress after each step
            await db_service.update_agse_goal_stages(goal_id, stages)
            context_accumulated += f"### Completed {stage['stage_name']} Spec:\n{content}\n\n"

        # Mark whole session complete
        await db_service.update_agse_goal_status(goal_id, "completed")
        logger.info(f"AGSE successfully compiled goal-based project blueprints for {goal_id}")

goal_based_engineering_service = GoalBasedEngineeringService()
