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
            "- corrected_code: Complete replacement code snippet as a PLAIN STRING. Do NOT return this as a nested JSON object or dictionary under any circumstances. It must be a single string containing only the code.\n"
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
            
            # Load JSON content safely and robustly
            content_str = response.content.strip()
            if content_str.startswith("```json"):
                content_str = content_str[7:]
            elif content_str.startswith("```"):
                content_str = content_str[3:]
            if content_str.endswith("```"):
                content_str = content_str[:-3]
            content_str = content_str.strip()

            try:
                data = json.loads(content_str)
            except Exception:
                # Try finding outer braces
                start_idx = content_str.find('{')
                end_idx = content_str.rfind('}')
                if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                    data = json.loads(content_str[start_idx:end_idx + 1])
                else:
                    raise

            if not isinstance(data, dict):
                raise ValueError("Parsed JSON is not a dictionary/object")

            # Check and clean corrected_code to be a string
            corrected = data.get("corrected_code")
            if isinstance(corrected, dict):
                extracted = None
                for key in ["code", "corrected_code", "fixed_code"]:
                    if key in corrected and isinstance(corrected[key], str):
                        extracted = corrected[key]
                        break
                if extracted is None:
                    try:
                        extracted = json.dumps(corrected, indent=2)
                    except Exception:
                        extracted = str(corrected)
                data["corrected_code"] = extracted
            elif corrected is None:
                data["corrected_code"] = snippet
            elif not isinstance(corrected, str):
                try:
                    data["corrected_code"] = json.dumps(corrected, indent=2)
                except Exception:
                    data["corrected_code"] = str(corrected)

            data.setdefault("root_cause", "No root cause provided.")
            data.setdefault("impact", "Potential bugs, crashes, or security exposures.")
            data.setdefault("explanation", "No explanation available.")
            data.setdefault("suggested_fix", "Examine code structure.")
            data.setdefault("best_practices", [])
            
            if not isinstance(data.get("best_practices"), list):
                if data["best_practices"] is not None:
                    data["best_practices"] = [str(data["best_practices"])]
                else:
                    data["best_practices"] = []

            try:
                data["confidence_score"] = int(data.get("confidence_score", 85))
            except Exception:
                data["confidence_score"] = 85

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
