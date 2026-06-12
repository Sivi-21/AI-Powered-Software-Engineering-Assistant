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

logger = logging.getLogger("app.services.code_review_agent")

# --- Pydantic Models for Code Review Validation ---

class CodeReviewFinding(BaseModel):
    severity: str = Field(description="Severity of the issue. Must be 'Low', 'Medium', or 'High'")
    file: str = Field(description="Filename where the issue is found")
    line_number: Optional[int] = Field(None, description="Approximate starting line number of the issue")
    issue: str = Field(description="Type/name of the issue. E.g. 'Long Method', 'Duplicate Code', 'Poor Naming', 'Deep Nesting', 'Code Smell'")
    explanation: str = Field(description="Detailed explanation of the code review issue found")
    recommendation: str = Field(description="Step-by-step suggestions on how to refactor or resolve this issue")

class CodeReviewResult(BaseModel):
    findings: List[CodeReviewFinding] = Field(description="List of detected code quality or style issues.")

# --- Code Review Agent Node ---

class CodeReviewAgent:
    def __init__(self):
        self.llm = get_llm(json_mode=False)
        self.json_llm = get_llm(json_mode=True)


    async def _get_code_content(self, project_id: uuid.UUID, file_paths: List[str]) -> str:
        """
        Loads source code files from the temporary extraction directory.
        Falls back to vector store retrieval if files are unavailable on disk.
        """
        project_dir = Path(settings.UPLOAD_DIR) / str(project_id)
        code_context = ""
        read_count = 0
        
        # We review typical source code extensions (skip configs/binaries/images)
        reviewable_extensions = {".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".cpp", ".c", ".go", ".rs"}
        
        for file_path in file_paths:
            clean_path = Path(file_path)
            if clean_path.suffix not in reviewable_extensions:
                continue
                
            full_path = project_dir / clean_path
            # Resolve potential symlinks and prevent escape
            try:
                resolved_path = full_path.resolve()
                if not resolved_path.is_relative_to(project_dir.resolve()):
                    continue
            except Exception:
                continue

            if full_path.exists() and full_path.is_file():
                try:
                    # Skip files larger than 50KB to keep LLM context clean
                    if full_path.stat().st_size > 50 * 1024:
                        continue
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        code_context += f"--- File: {file_path} ---\n{content}\n\n"
                        read_count += 1
                        if read_count >= 6: # Analyze at most 6 key files to avoid prompt token limits
                            break
                except Exception as e:
                    logger.warning(f"Failed to read file {file_path} from disk: {str(e)}")

        # Fallback to vector store query if files could not be read from disk
        if not code_context:
            logger.info(f"Falling back to vector store query for project: {project_id}")
            query_terms = [
                "function definition logic class component method handler",
                "core algorithm business logic database router"
            ]
            retrieved_chunks = []
            for term in query_terms:
                contexts = await vector_store.query_code(project_id, term, n_results=4)
                for ctx in contexts:
                    retrieved_chunks.append(
                        f"File: {ctx['file_path']} (line {ctx['start_line']})\nContent:\n{ctx['content']}\n"
                    )
            code_context = "\n---\n".join(retrieved_chunks[:6])

        return code_context

    async def run_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        LangGraph Node Implementation:
        1. Gathers representative source code files.
        2. Prompts Gemini to detect structural code quality issues.
        3. Parses and validates findings via Pydantic.
        """
        project_id = uuid.UUID(state["project_id"])
        project_name = state["project_name"]
        file_paths = state.get("file_paths", [])

        logger.info(f"[{project_name}] Running Code Review Agent on project {project_id}")

        # 1. Fetch code context
        code_context = await self._get_code_content(project_id, file_paths)
        if not code_context:
            logger.warning(f"No code context was compiled for project: {project_id}")
            return {"code_review_findings": []}

        # 2. Build system and user prompts
        system_instruction = (
            "You are a Senior Staff Software Engineer and codebase auditor.\n"
            "Your task is to inspect the provided source code blocks and detect maintainability issues.\n\n"
            "Analyze the code for the following concerns:\n"
            "1. Code Smells: unhandled exception handling, bad pattern practices, global state mutations.\n"
            "2. Long Methods: functions or methods that are excessively long (longer than 40-50 lines).\n"
            "3. Duplicate Code: repetitive logic chunks or copy-pasted blocks.\n"
            "4. Poor Naming Conventions: single-letter or non-descriptive variables, variables not matching target languages conventions.\n"
            "5. Deep Nesting: loops or nested conditionals (>3 levels deep).\n"
            "6. Maintainability & Refactoring: suggestions to decouple classes or modularize large files.\n\n"
            "You MUST return a JSON object with a single key 'findings' containing a list of findings matching this exact schema:\n"
            "{\n"
            "  \"findings\": [\n"
            "    {\n"
            "      \"severity\": \"High\" | \"Medium\" | \"Low\",\n"
            "      \"file\": \"string\",\n"
            "      \"line_number\": int or null,\n"
            "      \"issue\": \"string (e.g. Long Method, Deep Nesting, Code Smell, Naming Convention, Duplicate Code)\",\n"
            "      \"explanation\": \"string detailing why this is a problem\",\n"
            "      \"recommendation\": \"string detailing the recommended refactoring or fix\"\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "Only return the raw JSON object. Do not include markdown code block quotes (```json)."
        )

        user_prompt = f"Source code to review:\n\n{code_context}"

        try:
            from app.services.retry_helper import ainvoke_with_retry
            # 3. Call Gemini / Groq Chat LLM in JSON mode
            response = await ainvoke_with_retry(self.json_llm, [
                SystemMessage(content=system_instruction),
                HumanMessage(content=user_prompt)
            ])


            # 4. Parse and Validate structured output
            raw_data = json.loads(response.content)
            validated_result = CodeReviewResult.model_validate(raw_data)
            
            # Map Pydantic structures back to raw dictionary list for LangGraph state storage
            findings_dicts = [finding.model_dump() for finding in validated_result.findings]
            logger.info(f"Code Review Agent detected {len(findings_dicts)} findings for {project_name}.")
            return {"code_review_findings": findings_dicts}

        except Exception as e:
            logger.error(f"Code Review Agent execution failed for {project_name}: {str(e)}", exc_info=True)
            # Graceful fallback: return empty findings list instead of failing the pipeline
            return {"code_review_findings": []}

# Instantiate agent
code_review_agent = CodeReviewAgent()
