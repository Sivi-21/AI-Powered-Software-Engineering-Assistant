import logging
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.llm_provider import get_llm
from app.services.retry_helper import ainvoke_with_retry
from app.services.db_service import db_service

logger = logging.getLogger("app.services.self_learning_service")

class SelfLearningService:
    def __init__(self):
        self.llm = get_llm(json_mode=True)

    async def record_feedback(
        self, category: str, original_recommendation: str, user_corrections: str, score: int, owner_id: str | None = None
    ) -> Dict[str, Any]:
        """
        Accepts user corrections/ratings and prompts Gemini to extract generalizable coding rules.
        Saves rules in MongoDB.
        """
        logger.info(f"Processing self-learning feedback for category: {category}")

        system_instruction = (
            "You are an expert Principal AI Software Engineering Auditor.\n"
            "Analyze the original recommendation made by the AI, the user's manual correction or notes,\n"
            "and extract a generalized coding rule or guideline to prevent the AI from making similar incorrect recommendations in the future.\n"
            "Respond ONLY with a raw JSON object containing these keys:\n"
            "- rule_summary: A short, concise phrase summarizing the rule (e.g. 'Use async endpoints for file uploads').\n"
            "- guideline: A detailed explanation of the guideline to inject into subsequent prompts.\n"
            "- confidence_score: An integer between 1 and 100 representing confidence in this rule."
        )

        user_prompt = (
            f"Category: {category}\n"
            f"Original Recommendation:\n{original_recommendation}\n\n"
            f"User Correction/Notes:\n{user_corrections}\n\n"
            f"Feedback Rating: {score}/5"
        )

        try:
            response = await ainvoke_with_retry(self.llm, [
                SystemMessage(content=system_instruction),
                HumanMessage(content=user_prompt)
            ])
            data = json.loads(response.content)
        except Exception as e:
            logger.error(f"Failed to analyze self-learning feedback: {e}", exc_info=True)
            data = {
                "rule_summary": f"Preferred correction for {category}",
                "guideline": f"When advising on {category}, respect user criteria: {user_corrections}",
                "confidence_score": 80
            }

        rule_id = str(uuid.uuid4())
        rule_doc = {
            "_id": rule_id,
            "category": category,
            "owner_id": owner_id,
            "rule_summary": data.get("rule_summary"),
            "guideline": data.get("guideline"),
            "confidence_score": data.get("confidence_score", 90),
            "created_at": datetime.now(timezone.utc)
        }

        await db_service.save_self_learning_rule(rule_doc)
        rule_doc["id"] = rule_doc.pop("_id")
        return rule_doc

    async def get_learned_contexts(self, category: str, owner_id: str | None = None) -> str:
        """
        Retrieves learned guidelines for a given category to append to agent prompts.
        """
        rules = await db_service.get_self_learning_rules(category=category, user_id=owner_id)
        if not rules:
            return ""

        context_lines = ["\n[Self-Learned Active Guidelines - Adhere to these strictly]:"]
        for r in rules:
            context_lines.append(f"- {r.get('rule_summary')}: {r.get('guideline')}")
        return "\n".join(context_lines)

self_learning_service = SelfLearningService()
