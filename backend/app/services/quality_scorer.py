import os
import json
import logging
from typing import Dict, Any
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.llm_provider import get_llm

logger = logging.getLogger("app.services.quality_scorer")

class QualityScorer:
    def __init__(self):
        self.llm = get_llm(json_mode=False)
        self.json_llm = get_llm(json_mode=True)

    async def run_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        project_name = state["project_name"]
        
        code_reviews = state.get("code_review_findings", [])
        bugs = state.get("bug_detections", [])
        vulns = state.get("security_vulnerabilities", [])

        logger.info(f"[{project_name}] Running Quality Scorer Agent")

        system_instruction = (
            "You are a Senior Technical Lead and Quality Manager.\n"
            "Analyze the lists of code review findings, logic bugs, and security vulnerabilities discovered in the codebase.\n"
            "Calculate an overall quality score from 1 (broken/insecure) to 100 (flawless) and provide a high-level summary paragraph of the code health.\n\n"
            "Return a JSON object matching this schema:\n"
            "{\n"
            "  \"code_quality_score\": int,\n"
            "  \"health_summary\": \"string\"\n"
            "}\n"
            "Only return the raw JSON object."
        )

        user_prompt = (
            f"Code Review Findings count: {len(code_reviews)}\n"
            f"Bugs count: {len(bugs)}\n"
            f"Security Vulnerabilities count: {len(vulns)}\n\n"
            f"Bugs Details: {json.dumps(bugs[:10], indent=2)}\n\n"
            f"Security Details: {json.dumps(vulns[:10], indent=2)}"
        )

        try:
            from app.services.retry_helper import ainvoke_with_retry
            response = await ainvoke_with_retry(self.json_llm, [
                SystemMessage(content=system_instruction),
                HumanMessage(content=user_prompt)
            ])
            data = json.loads(response.content)
            score = data.get("code_quality_score", 80)
            # Bound check
            score = min(100, max(1, score))
            return {
                "code_quality_score": score,
                "health_summary": data.get("health_summary", "Analysis completed.")
            }
        except Exception as e:
            logger.error(f"Quality Scorer Agent failed: {str(e)}", exc_info=True)
            # Default score calculation based on findings
            base_score = 100 - (len(bugs) * 10) - (len(vulns) * 15) - (len(code_reviews) * 2)
            base_score = min(100, max(1, base_score))
            return {
                "code_quality_score": base_score,
                "health_summary": f"Calculated fallback code quality score based on finding counts: {base_score}."
            }

quality_scorer = QualityScorer()
