import os
import json
import logging
import uuid
from pathlib import Path
from typing import Dict, Any, List
from pydantic import BaseModel, Field

from langchain_core.messages import SystemMessage, HumanMessage
from app.services.llm_provider import get_llm
from app.services.repository_scanner import repository_scanner
from app.config import settings

logger = logging.getLogger("app.services.repository_agent")

# --- Pydantic Schema for Agent Validation ---
class RepositoryAgentResult(BaseModel):
    project_type: str = Field(description="Project type classification. E.g. 'web_service', 'library', 'cli', 'frontend'.")
    primary_language: str = Field(description="Main programming language used in the project.")
    framework: str = Field(description="Dominant framework detected. E.g. 'FastAPI', 'React', 'None'.")
    total_files: int = Field(description="Total count of files in the scanned codebase.")
    summary: str = Field(description="Detailed architecture and directory layout summary.")

class RepositoryAgent:
    def __init__(self):
        self.llm = get_llm(json_mode=False)
        self.json_llm = get_llm(json_mode=True)


    async def run_node(self, project_id: uuid.UUID, project_name: str) -> Dict[str, Any]:
        """
        LangGraph Node Implementation:
        1. Runs the static RepositoryScanner to map files and configuration metadata.
        2. Gathers config settings and file trees.
        3. Calls Gemini in JSON-mode to summarize the architecture structure.
        4. Returns validated RepositoryAgentResult data.
        """
        logger.info(f"Repository Agent processing project: {project_id}")
        
        # Determine extraction directory
        extract_dir = Path(settings.UPLOAD_DIR) / str(project_id)
        if not extract_dir.exists():
            # If the files were cleaned up, check uploads root or default to safe directory
            logger.warning(f"Project path {extract_dir} does not exist. Scanning uploads folder instead.")
            extract_dir = Path(settings.UPLOAD_DIR)

        # 1. Run deterministic scanner
        scan_results = repository_scanner.scan_project(extract_dir)
        total_files = scan_results.get("file_count", 0)
        languages = scan_results.get("detected_languages", [])
        frameworks = scan_results.get("detected_frameworks", [])

        # Filter config files for LLM context parsing
        config_files_present = []
        for key, val in scan_results.get("configuration_files", {}).items():
            if val:
                config_files_present.append(key)

        # 2. Package prompt for Gemini
        system_instruction = (
            "You are an expert Repository Architect Agent. "
            "Your responsibility is to analyze the file tree and static scanner metrics "
            "to summarize the codebase layout and classify its structure.\n\n"
            "You MUST return a JSON object matching this schema:\n"
            "{\n"
            "  \"project_type\": \"string\",\n"
            "  \"primary_language\": \"string\",\n"
            "  \"framework\": \"string\",\n"
            "  \"total_files\": int,\n"
            "  \"summary\": \"string\"\n"
            "}"
        )

        user_prompt = (
            f"Project: {project_name}\n"
            f"Deterministic Scan Data:\n"
            f"- Total files counted: {total_files}\n"
            f"- Primary languages detected: {', '.join(languages) if languages else 'Unknown'}\n"
            f"- Frameworks found: {', '.join(frameworks) if frameworks else 'None'}\n"
            f"- Configuration files present: {', '.join(config_files_present)}\n\n"
            "Synthesize a concise summary explaining the structural design patterns, "
            "entrypoint file locations, and folder mappings of the codebase."
        )

        try:
            from app.services.retry_helper import ainvoke_with_retry
            # 3. Call Gemini / Groq
            response = await ainvoke_with_retry(self.json_llm, [
                SystemMessage(content=system_instruction),
                HumanMessage(content=user_prompt)
            ])


            # 4. Parse & Validate structured JSON
            raw_data = json.loads(response.content)
            
            # Map parameters dynamically
            raw_data["total_files"] = total_files  # Override with actual count from scanner
            if not raw_data.get("primary_language") and languages:
                raw_data["primary_language"] = languages[0]
            if not raw_data.get("framework") and frameworks:
                raw_data["framework"] = frameworks[0]

            # Validate using Pydantic V2
            validated_result = RepositoryAgentResult.model_validate(raw_data)
            logger.info(f"Repository Agent analysis successful for {project_name}.")
            return validated_result.model_dump()

        except Exception as e:
            logger.error(f"Repository Agent execution failed: {str(e)}", exc_info=True)
            # Safe fallback response
            fallback = RepositoryAgentResult(
                project_type="unknown",
                primary_language=languages[0] if languages else "unknown",
                framework=frameworks[0] if frameworks else "None",
                total_files=total_files,
                summary=f"Analysis failed due to error: {str(e)}"
            )
            return fallback.model_dump()

# Instantiate agent
repository_agent = RepositoryAgent()
