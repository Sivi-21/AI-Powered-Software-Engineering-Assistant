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

logger = logging.getLogger("app.services.security_analyst")

class SecurityFinding(BaseModel):
    file_path: str = Field(description="Filename where vulnerability is found")
    line_number: Optional[int] = Field(None, description="Line number of vulnerability")
    severity: str = Field(description="Severity (HIGH, MEDIUM, LOW)")
    description: str = Field(description="Vulnerability explanation and details")
    snippet: Optional[str] = Field(None, description="The vulnerable code snippet")
    recommendation: str = Field(description="Remediation recommendation")

class SecurityAnalysisResult(BaseModel):
    findings: List[SecurityFinding] = Field(description="List of security findings")

class SecurityAnalyst:
    def __init__(self):
        self.llm = get_llm(json_mode=False)
        self.json_llm = get_llm(json_mode=True)

    async def _get_code_content(self, project_id: uuid.UUID, file_paths: List[str]) -> str:
        project_dir = Path(settings.UPLOAD_DIR) / str(project_id)
        code_context = ""
        read_count = 0
        reviewable_extensions = {".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".cpp", ".c", ".go", ".rs", ".yaml", ".yml", ".json"}
        
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
            logger.info(f"Falling back to vector store query for security analyst: {project_id}")
            contexts = await vector_store.query_code(project_id, "API_KEY PASSWORD SECRET TOKEN key crypt decrypt sql injection xss cors authorization authentication CSRF", n_results=6)
            code_context = "\n---\n".join([f"File: {ctx['file_path']} (line {ctx['start_line']})\nContent:\n{ctx['content']}\n" for ctx in contexts])

        return code_context

    async def run_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        project_id = uuid.UUID(state["project_id"])
        project_name = state["project_name"]
        file_paths = state.get("file_paths", [])

        logger.info(f"[{project_name}] Running Security Analyst Agent")
        code_context = await self._get_code_content(project_id, file_paths)
        if not code_context:
            return {"security_vulnerabilities": []}

        system_instruction = (
            "You are an expert security auditor and penetration tester.\n"
            "Analyze the provided source code for security vulnerabilities. Check for secrets/key leak, OWASP Top 10, CWE violations, input injection, and CORS policies.\n\n"
            "Return a JSON object containing a 'findings' list of objects matching the schema:\n"
            "{\n"
            "  \"findings\": [\n"
            "    {\n"
            "      \"file_path\": \"string\",\n"
            "      \"line_number\": int or null,\n"
            "      \"severity\": \"HIGH\" | \"MEDIUM\" | \"LOW\",\n"
            "      \"description\": \"string\",\n"
            "      \"snippet\": \"string or null\",\n"
            "      \"recommendation\": \"string\"\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "Only return the raw JSON object. Do not include markdown wraps."
        )

        user_prompt = f"Source code to audit:\n\n{code_context}"

        try:
            from app.services.retry_helper import ainvoke_with_retry
            response = await ainvoke_with_retry(self.json_llm, [
                SystemMessage(content=system_instruction),
                HumanMessage(content=user_prompt)
            ])
            raw_data = json.loads(response.content)
            validated = SecurityAnalysisResult.model_validate(raw_data)
            return {"security_vulnerabilities": [f.model_dump() for f in validated.findings]}
        except Exception as e:
            logger.error(f"Security Analyst Agent failed: {str(e)}", exc_info=True)
            return {"security_vulnerabilities": []}

security_analyst = SecurityAnalyst()
