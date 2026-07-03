import json
import logging
from typing import Dict, Any
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.llm_provider import get_llm

logger = logging.getLogger("app.services.refactoring_service")

class RefactoringService:
    def __init__(self):
        self.llm = get_llm(json_mode=True)

    async def refactor_code(self, target_name: str, code_content: str, instructions: str = "Optimize, rename variables, split long functions, and improve readability.") -> Dict[str, Any]:
        """
        Refactors a given block of code (Class, Method, File) according to prompt parameters.
        """
        system_prompt = (
            "You are a principal engineer. Refactor the code segment for maximum readability, safety, clean architecture, and performance.\n"
            "Respond ONLY with a JSON object containing keys:\n"
            "- refactored_code: The complete updated replacement code block.\n"
            "- modifications: A list of specific changes made (e.g. ['Renamed tmp_val to index', 'Extracted parse_line method']).\n"
            "- design_patterns_used: A list of architectural or design pattern names applied.\n"
            "- performance_impact: High-level explanation of performance changes."
        )

        user_prompt = (
            f"Target Context: {target_name}\n"
            f"Instruction: {instructions}\n\n"
            f"Original Code:\n```\n{code_content}\n```"
        )

        try:
            from app.services.retry_helper import ainvoke_with_retry
            response = await ainvoke_with_retry(self.llm, [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ])
            data = json.loads(response.content)
            return data
        except Exception as e:
            logger.error(f"Refactor API query failed: {e}")
            return {
                "refactored_code": code_content,
                "modifications": ["No modifications applied due to pipeline timeout."],
                "design_patterns_used": [],
                "performance_impact": "None",
                "error": str(e)
            }

refactoring_service = RefactoringService()
