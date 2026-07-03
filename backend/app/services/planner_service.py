import logging
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.llm_provider import get_llm
from app.services.retry_helper import ainvoke_with_retry
from app.services.db_service import db_service

logger = logging.getLogger("app.services.planner_service")

class PlannerService:
    def __init__(self):
        self.llm = get_llm(json_mode=True)

    async def generate_project_plan(self, idea: str, user_id: str | None = None) -> Dict[str, Any]:
        """
        Generates a comprehensive project plan based on a natural language idea/description.
        Returns a dict conforming to the ProjectPlanResponse schema.
        """
        logger.info(f"Generating project plan for idea: '{idea[:100]}...'")

        system_instruction = (
            "You are an expert software architect, systems designer, and project manager.\n"
            "Analyze the user's idea and generate a complete, production-ready, structured project plan in JSON format.\n"
            "You MUST respond ONLY with a raw JSON object containing the following keys and structures:\n"
            "- functional_requirements: List of strings detailing what the system must do.\n"
            "- non_functional_requirements: List of strings detailing quality attributes (performance, scale, security).\n"
            "- user_stories: List of objects, each containing:\n"
            "  * title: String title of the story.\n"
            "  * description: String description.\n"
            "  * acceptance_criteria: List of strings.\n"
            "- epics: List of objects, each containing:\n"
            "  * title: String.\n"
            "  * description: String.\n"
            "- sprint_backlog: List of objects, each containing:\n"
            "  * title: String.\n"
            "  * description: String.\n"
            "  * story_points: Integer (e.g. 1, 2, 3, 5, 8).\n"
            "  * priority: String ('High', 'Medium', 'Low').\n"
            "- technology_stack: Object containing:\n"
            "  * frontend: List of strings.\n"
            "  * backend: List of strings.\n"
            "  * database: List of strings.\n"
            "  * devops: List of strings.\n"
            "- database_design: Object containing:\n"
            "  * tables: List of objects, each containing:\n"
            "    + name: String.\n"
            "    + description: String.\n"
            "    + fields: List of key-value pairs (e.g. {\"id\": \"UUID\", \"name\": \"VARCHAR(255)\"}).\n"
            "    + relationships: List of strings.\n"
            "  * notes: String.\n"
            "- api_list: List of objects, each containing:\n"
            "  * endpoint: String.\n"
            "  * method: String (GET/POST/PUT/DELETE).\n"
            "  * description: String.\n"
            "  * request_model: String or null.\n"
            "  * response_model: String or null.\n"
            "- folder_structure: String outlining the recommended directory file tree structure (use text tree format).\n"
            "- development_timeline: List of objects, each containing:\n"
            "  * phase: String (e.g. 'Requirements', 'Design', 'Phase 1').\n"
            "  * duration: String (e.g. '2 weeks').\n"
            "  * description: String.\n"
            "- risk_analysis: List of objects, each containing:\n"
            "  * risk: String.\n"
            "  * impact: String (High/Medium/Low).\n"
            "  * mitigation: String.\n"
            "- estimated_complexity: String describing complexity (e.g. 'High - requires distributed transaction logs').\n"
            "- team_recommendation: List of objects, each containing:\n"
            "  * role: String.\n"
            "  * count: Integer.\n"
            "  * responsibilities: List of strings.\n\n"
            "Provide realistic, highly specific content based on the project idea."
        )

        user_prompt = f"Project Idea:\n{idea}"

        try:
            response = await ainvoke_with_retry(self.llm, [
                SystemMessage(content=system_instruction),
                HumanMessage(content=user_prompt)
            ])
            
            plan_data = json.loads(response.content)
        except Exception as e:
            logger.error(f"Planner LLM generation or parsing failed: {e}", exc_info=True)
            # Safe default fallback structure
            plan_data = {
                "functional_requirements": ["Perform core operations based on: " + idea],
                "non_functional_requirements": ["High availability", "Secure data transmission"],
                "user_stories": [{"title": "Initial Setup", "description": "Set up project infrastructure", "acceptance_criteria": ["Project runs locally"]}],
                "epics": [{"title": "Core System", "description": "Implement core business logic"}],
                "sprint_backlog": [{"title": "Setup repository", "description": "Create boilerplate", "story_points": 2, "priority": "High"}],
                "technology_stack": {"frontend": ["React"], "backend": ["FastAPI"], "database": ["MongoDB"], "devops": ["Docker"]},
                "database_design": {"tables": [{"name": "Users", "description": "Saves users details", "fields": [{"id": "UUID", "email": "VARCHAR"}], "relationships": []}], "notes": "Basic database schema"},
                "api_list": [{"endpoint": "/api/v1/health", "method": "GET", "description": "Health check", "request_model": None, "response_model": "Dict"}],
                "folder_structure": "src/\n  components/\n  routes/\n  models/\n",
                "development_timeline": [{"phase": "Setup & Design", "duration": "1 week", "description": "Initial design phase"}],
                "risk_analysis": [{"risk": "Unspecified requirements", "impact": "Medium", "mitigation": "Perform detailed scope discovery"}],
                "estimated_complexity": "Medium",
                "team_recommendation": [{"role": "Fullstack Developer", "count": 1, "responsibilities": ["Develop frontend and backend functionalities"]}]
            }

        # Inject identifier and metadata
        plan_id = str(uuid.uuid4())
        plan_doc = {
            "_id": plan_id,
            "idea": idea,
            "owner_id": user_id,
            "created_at": datetime.now(timezone.utc),
            **plan_data
        }

        # Save to database
        await db_service.save_project_plan(plan_doc)
        
        # Format for output
        plan_doc["id"] = plan_doc.pop("_id")
        return plan_doc

planner_service = PlannerService()
