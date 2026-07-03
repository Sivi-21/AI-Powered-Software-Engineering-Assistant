import logging
import json
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.llm_provider import get_llm
from app.services.retry_helper import ainvoke_with_retry
from app.services.db_service import db_service

logger = logging.getLogger("app.services.company_simulator_service")

class CompanySimulatorService:
    def __init__(self):
        self.llm = get_llm(json_mode=False)

    async def start_simulation(self, objective: str, user_id: str | None = None) -> Dict[str, Any]:
        """
        Starts a simulator session, posts the first CEO message, and triggers the department loop.
        """
        session_id = str(uuid.uuid4())
        logger.info(f"Starting Company Simulation {session_id} for objective: {objective[:60]}")

        # CEO introduces the objective
        ceo_msg = {
            "department": "CEO",
            "role": "Chief Executive Officer",
            "message": f"Welcome team. We have a new strategic corporate objective: '{objective}'. I want the CTO, PM, Solution Architect, and team leads to collaborate and coordinate a robust technical blueprint, resource allocations, database structures, security audits, and support matrices to deliver this successfully. Let's start the review.",
            "timestamp": datetime.now(timezone.utc)
        }

        session_doc = {
            "_id": session_id,
            "objective": objective,
            "owner_id": user_id,
            "status": "running",
            "messages": [ceo_msg],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        await db_service.save_simulator_session(session_doc)

        # Trigger background departments thread steps
        asyncio.create_task(self._run_simulation_steps(session_id))

        session_doc["id"] = session_doc.pop("_id")
        return session_doc

    async def _run_simulation_steps(self, session_id: str):
        """
        Loop through consecutive departments to coordinate the plan:
        CEO -> CTO -> PM -> Solution Architect -> Database Team -> Security Team -> DevOps -> QA -> Support
        """
        departments = [
            {"name": "CTO", "role": "Chief Technology Officer", "prompt": "Evaluate the technology requirements, potential frameworks, scalability, and target tech stacks."},
            {"name": "Product Manager", "role": "PM Team Lead", "prompt": "Outline functional requirements, epics, sprint backlog, and customer value mapping."},
            {"name": "Solution Architect", "role": "Principal Systems Designer", "prompt": "Draft system topology, microservice boundaries, UML interfaces, and caching strategies."},
            {"name": "Database Team", "role": "Lead DB Architect", "prompt": "Design SQL tables or MongoDB schemas, indexing suggestions, and relations."},
            {"name": "Security Team", "role": "Cybersecurity Lead", "prompt": "Audit potential vulnerabilities, compliance policies (GDPR/HIPAA), and secret scanning plans."},
            {"name": "DevOps Team", "role": "DevOps Lead", "prompt": "Draft Docker configurations, Kubernetes layout, and CI/CD automated pipeline."},
            {"name": "QA Team", "role": "QA Lead", "prompt": "Outline unit tests, coverage goals, integration suites, and API validation specs."},
            {"name": "Customer Support", "role": "Support Lead", "prompt": "Formulate monitoring hooks, logs monitoring guidelines, and incident SLA matrix."}
        ]

        for dept in departments:
            # Sleep 2.5 seconds per step for realistic discussion flow visualization
            await asyncio.sleep(2.5)

            session = await db_service.get_simulator_session(session_id)
            if not session or session.get("status") != "running":
                break

            messages = session.get("messages", [])
            
            # Format the conversation history for the AI department
            history_str = ""
            for msg in messages[-4:]:  # last 4 replies to keep context clean
                history_str += f"{msg['department']} ({msg['role']}): {msg['message']}\n\n"

            prompt = (
                f"You are the {dept['role']} ({dept['name']}) participating in a company simulation.\n"
                f"Company Objective: {session['objective']}\n\n"
                f"Recent Discussion History:\n{history_str}\n"
                f"Your Task: {dept['prompt']}\n\n"
                "Respond with a professional, detailed, department-specific reply contributing to the roadmap."
            )

            try:
                response = await ainvoke_with_retry(self.llm, [
                    SystemMessage(content=f"You are a professional {dept['role']} working on the corporate objective. Provide highly specific, actionable guidance."),
                    HumanMessage(content=prompt)
                ])
                message_content = response.content
            except Exception as e:
                logger.warning(f"Sim step failed for {dept['name']}: {e}")
                message_content = f"Acknowledged. We are lining up tech stack blueprints to conform with the '{session['objective']}' standard."

            new_msg = {
                "department": dept["name"],
                "role": dept["role"],
                "message": message_content,
                "timestamp": datetime.now(timezone.utc)
            }
            messages.append(new_msg)

            await db_service.update_simulator_session_messages(session_id, messages)

        # Complete session
        await db_service.update_simulator_session_status(session_id, "completed")
        logger.info(f"Simulation session {session_id} finished successfully.")

company_simulator_service = CompanySimulatorService()
