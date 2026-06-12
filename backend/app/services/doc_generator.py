import os
import logging
import uuid
from pathlib import Path
from typing import Dict, Any, List
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.llm_provider import get_llm

logger = logging.getLogger("app.services.doc_generator")

class DocGenerator:
    def __init__(self):
        self.llm = get_llm(json_mode=False)

    async def run_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        project_name = state["project_name"]
        file_paths = state.get("file_paths", [])
        architecture_summary = state.get("architecture_summary", "")

        logger.info(f"[{project_name}] Running Doc Generator Agent")
        
        file_list = "\n".join(file_paths[:150])
        system_instruction = (
            "You are a professional software technical writer.\n"
            "Analyze the project's file list and architecture overview, and generate a comprehensive markdown documentation manifest.\n"
            "Include:\n"
            "1. Getting Started instructions.\n"
            "2. Directory layout explanations.\n"
            "3. Key modules and dependencies description."
        )

        user_prompt = (
            f"Project Name: {project_name}\n\n"
            f"Architecture Summary:\n{architecture_summary}\n\n"
            f"File Paths:\n{file_list}"
        )

        try:
            from app.services.retry_helper import ainvoke_with_retry
            response = await ainvoke_with_retry(self.llm, [
                SystemMessage(content=system_instruction),
                HumanMessage(content=user_prompt)
            ])
            return {"documentation_manifest": {"markdown_docs": response.content}}
        except Exception as e:
            logger.error(f"Doc Generator Agent failed: {str(e)}", exc_info=True)
            return {"documentation_manifest": {"markdown_docs": "Documentation generation failed."}}

doc_generator = DocGenerator()
