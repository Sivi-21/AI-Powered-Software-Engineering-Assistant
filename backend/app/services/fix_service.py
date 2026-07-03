import json
import logging
from typing import Dict, Any
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.llm_provider import get_llm

logger = logging.getLogger("app.services.fix_service")

class FixService:
    def __init__(self):
        # We request json_mode if possible or standard text LLM
        self.llm = get_llm(json_mode=True)

    async def generate_fix(self, file_path: str, snippet: str, issue_description: str) -> Dict[str, Any]:
        """
        Queries LLM to propose a root-cause explanation and corrected code.
        """
        system_prompt = (
            "You are an expert Senior Full-Stack Engineer and AI Code Reviewer.\n"
            "Analyze the given issue and target code snippet. Propose a complete fix in JSON format.\n"
            "Return EXACTLY a JSON object with these keys:\n"
            "- root_cause: Explanation of why the code is broken or unsafe.\n"
            "- impact: Impact of this issue (e.g. security leak, performance drop, crash).\n"
            "- explanation: Explanation of the fix.\n"
            "- suggested_fix: High-level strategy of the fix.\n"
            "- corrected_code: Complete replacement code snippet.\n"
            "- best_practices: Bullet points describing best practices for this scenario.\n"
            "- confidence_score: Number between 0 and 100."
        )
        
        user_prompt = (
            f"File: {file_path}\n"
            f"Issue: {issue_description}\n"
            f"Code Snippet:\n```\n{snippet}\n```"
        )
        
        try:
            from app.services.retry_helper import ainvoke_with_retry
            response = await ainvoke_with_retry(self.llm, [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ])
            
            # Load JSON content safely
            data = json.loads(response.content)
            return data
        except Exception as e:
            logger.error(f"Failed to generate code fix: {e}", exc_info=True)
            return {
                "root_cause": "Failed to analyze root cause automatically.",
                "impact": "Potential bugs, crashes, or security exposures.",
                "explanation": "No explanation available due to model parsing errors.",
                "suggested_fix": "Examine code structure and correct manual logical issues.",
                "corrected_code": snippet,
                "best_practices": ["Verify inputs securely", "Add error boundaries"],
                "confidence_score": 0,
                "error": str(e)
            }

fix_service = FixService()
