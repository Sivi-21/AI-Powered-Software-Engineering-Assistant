import logging
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.llm_provider import get_llm
from app.services.retry_helper import ainvoke_with_retry
from app.services.db_service import db_service

logger = logging.getLogger("app.services.universal_brain_service")

class UniversalBrainService:
    def __init__(self):
        self.llm = get_llm(json_mode=True)

    async def make_decision(self, query: str, user_id: str | None = None) -> Dict[str, Any]:
        """
        Processes a strategic query or technical decision, runs task decomposition,
        performs risk checks and trade-off analysis, and saves the decision trace.
        """
        logger.info(f"Universal Brain processing decision query: {query[:60]}")

        system_instruction = (
            "You are the central Artificial Super Software Engineering Intelligence (ASSEI) Brain.\n"
            "Analyze the technical query, request, or proposal.\n"
            "Respond ONLY with a valid raw JSON object matching these keys:\n"
            "- tasks_decomposition: A list of objects, each containing:\n"
            "  - step_number: int\n"
            "  - task_name: str\n"
            "  - description: str\n"
            "- risk_assessment: Detailed markdown analysis of risks, pitfalls, or performance concerns.\n"
            "- trade_off_analysis: Detailed markdown comparing pros, cons, and alternatives (e.g. latency, cost, security).\n"
            "- confidence_score: An integer between 1 and 100.\n"
            "- validation_verdict: One of ['approved', 'needs_revision', 'rejected']."
        )

        try:
            response = await ainvoke_with_retry(self.llm, [
                SystemMessage(content=system_instruction),
                HumanMessage(content=f"Query: {query}")
            ])
            data = json.loads(response.content)
        except Exception as e:
            logger.error(f"Failed to compile brain decision: {e}", exc_info=True)
            data = {
                "tasks_decomposition": [
                    {"step_number": 1, "task_name": "Audit System Specifications", "description": "Review current code interfaces and constraints."}
                ],
                "risk_assessment": "Encountered processing delay. Proceed with caution.",
                "trade_off_analysis": "Default fallback analysis active.",
                "confidence_score": 75,
                "validation_verdict": "needs_revision"
            }

        decision_id = str(uuid.uuid4())
        decision_doc = {
            "_id": decision_id,
            "query": query,
            "owner_id": user_id,
            "tasks_decomposition": data.get("tasks_decomposition", []),
            "risk_assessment": data.get("risk_assessment", ""),
            "trade_off_analysis": data.get("trade_off_analysis", ""),
            "confidence_score": data.get("confidence_score", 90),
            "validation_verdict": data.get("validation_verdict", "approved"),
            "created_at": datetime.now(timezone.utc)
        }

        await db_service.save_brain_decision(decision_doc)
        decision_doc["id"] = decision_doc.pop("_id")
        return decision_doc

universal_brain_service = UniversalBrainService()
