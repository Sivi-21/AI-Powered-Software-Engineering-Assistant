import os
import logging
import uuid
import json
from pathlib import Path
from typing import Dict, Any, List
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.llm_provider import get_llm

logger = logging.getLogger("app.services.doc_generator")

class DocGenerator:
    def __init__(self):
        self.llm = get_llm(json_mode=True)

    async def run_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        project_name = state["project_name"]
        file_paths = state.get("file_paths", [])
        architecture_summary = state.get("architecture_summary", "")

        logger.info(f"[{project_name}] Running Doc Generator Agent for 9 structural guides.")
        
        file_list = "\n".join(file_paths[:150])
        system_instruction = (
            "You are a professional software technical writer.\n"
            "Analyze the project's file list and architecture overview, and generate 9 comprehensive documentation guides.\n"
            "Return a JSON object containing EXACTLY these keys:\n"
            "- readme: Markdown content for README.md.\n"
            "- installation: Markdown content explaining how to install and configure it.\n"
            "- api_docs: Markdown detailing API routing, request/response models and endpoints.\n"
            "- developer_guide: Markdown for developers on contribution, style guides, and environment setup.\n"
            "- architecture: Markdown detailing the system architecture, design patterns, and flow.\n"
            "- folder_structure: Markdown explaining the folder layout and directory contents.\n"
            "- database: Markdown explaining data structures, databases, tables, and schemas used.\n"
            "- deployment: Markdown explaining production deployment, docker, cloud setups, and CI/CD.\n"
            "- environment: Markdown explaining environment variables, configurations, and secrets.\n\n"
            "Respond ONLY with raw JSON."
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
            data = json.loads(response.content)
            return {"documentation_manifest": data}
        except Exception as e:
            logger.error(f"Doc Generator Agent failed: {str(e)}", exc_info=True)
            fallback = {
                "readme": f"# {project_name}\n\nAutomatic README generation failed.",
                "installation": "# Installation\n\nNot available.",
                "api_docs": "# API Documentation\n\nNot available.",
                "developer_guide": "# Developer Guide\n\nNot available.",
                "architecture": f"# Architecture\n\n{architecture_summary}",
                "folder_structure": "# Folder Structure\n\nNot available.",
                "database": "# Database Documentation\n\nNot available.",
                "deployment": "# Deployment Guide\n\nNot available.",
                "environment": "# Environment Setup Guide\n\nNot available."
            }
            return {"documentation_manifest": fallback}

doc_generator = DocGenerator()

