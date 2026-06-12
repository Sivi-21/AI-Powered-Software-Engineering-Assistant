import os
import json
import logging
import uuid
from pathlib import Path
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from langchain_core.messages import SystemMessage, HumanMessage
from app.services.llm_provider import get_llm
from app.services.vector_store import vector_store
from app.config import settings

logger = logging.getLogger("app.services.bug_detector")

class BugDetectionFinding(BaseModel):
    file_path: str = Field(description="Filename where the bug is found")
    line_number: Optional[int] = Field(None, description="Line number of the issue")
    bug_type: str = Field(description="Type of bug (e.g. Logic Error, Race Condition, Edge Case, Resource Leak)")
    severity: str = Field(description="Severity of the bug (HIGH, MEDIUM, LOW)")
    description: str = Field(description="Description of the bug and how it occurs")
    recommendation: str = Field(description="Recommendation for fixing the bug")

class BugDetectionResult(BaseModel):
    findings: List[BugDetectionFinding] = Field(description="List of detected bugs")

class BugDetector:
    def __init__(self):
        self.llm = get_llm(json_mode=False)
        self.json_llm = get_llm(json_mode=True)

    async def _get_code_content(self, project_id: uuid.UUID, file_paths: List[str]) -> str:
        project_dir = Path(settings.UPLOAD_DIR) / str(project_id)
        code_context = ""
        read_count = 0
        reviewable_extensions = {".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".cpp", ".c", ".go", ".rs"}
        
        for file_path in file_paths:
            clean_path = Path(file_path)
            if clean_path.suffix not in reviewable_extensions:
                continue
            full_path = project_dir / clean_path
            try:
                resolved_path = full_path.resolve()
                if not resolved_path.is_relative_to(project_dir.resolve()):
                    continue
            except Exception:
                continue

            if full_path.exists() and full_path.is_file():
                try:
                    if full_path.stat().st_size > 50 * 1024:
                        continue
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        code_context += f"--- File: {file_path} ---\n{content}\n\n"
                        read_count += 1
                        if read_count >= 6:
                            break
                except Exception as e:
                    logger.warning(f"Failed to read file {file_path}: {str(e)}")

        if not code_context:
            logger.info(f"Falling back to vector store query for bug detector: {project_id}")
            contexts = await vector_store.query_code(project_id, "error handling Exception exception safety logic error bug loop boundary null pointer undefined", n_results=6)
            code_context = "\n---\n".join([f"File: {ctx['file_path']} (line {ctx['start_line']})\nContent:\n{ctx['content']}\n" for ctx in contexts])

        return code_context

    async def run_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        project_id = uuid.UUID(state["project_id"])
        project_name = state["project_name"]
        file_paths = state.get("file_paths", [])

        logger.info(f"[{project_name}] Running Bug Detector Agent")
        code_context = await self._get_code_content(project_id, file_paths)
        if not code_context:
            return {"bug_detections": []}

        system_instruction = (
            "You are an expert software engineer specializing in finding logic flaws, race conditions, edge cases, and memory leaks.\n"
            "Analyze the provided source code and identify bugs. Focus on actual logical incorrectness rather than styling issues.\n\n"
            "Return a JSON object containing a 'findings' list of objects matching the schema:\n"
            "{\n"
            "  \"findings\": [\n"
            "    {\n"
            "      \"file_path\": \"string\",\n"
            "      \"line_number\": int or null,\n"
            "      \"bug_type\": \"string\",\n"
            "      \"severity\": \"HIGH\" | \"MEDIUM\" | \"LOW\",\n"
            "      \"description\": \"string\",\n"
            "      \"recommendation\": \"string\"\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "Only return the raw JSON object. Do not include markdown wraps."
        )

        user_prompt = f"Source code to scan for bugs:\n\n{code_context}"

        try:
            from app.services.retry_helper import ainvoke_with_retry
            response = await ainvoke_with_retry(self.json_llm, [
                SystemMessage(content=system_instruction),
                HumanMessage(content=user_prompt)
            ])
            raw_data = json.loads(response.content)
            validated = BugDetectionResult.model_validate(raw_data)
            return {"bug_detections": [f.model_dump() for f in validated.findings]}
        except Exception as e:
            logger.error(f"Bug Detector Agent failed: {str(e)}", exc_info=True)
            return {"bug_detections": []}

bug_detector = BugDetector()
