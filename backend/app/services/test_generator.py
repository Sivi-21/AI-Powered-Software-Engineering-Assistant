import os
import logging
import uuid
from pathlib import Path
from typing import Dict, Any, List
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.llm_provider import get_llm
from app.services.vector_store import vector_store

logger = logging.getLogger("app.services.test_generator")

class TestGenerator:
    def __init__(self):
        self.llm = get_llm(json_mode=False)

    async def run_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        project_id = uuid.UUID(state["project_id"])
        project_name = state["project_name"]
        
        logger.info(f"[{project_name}] Running Test Generator Agent")

        # Query vector store for functions or routers that require unit testing
        contexts = await vector_store.query_code(project_id, "def router class function module logic", n_results=4)
        code_context = "\n---\n".join([f"File: {ctx['file_path']} (line {ctx['start_line']})\nContent:\n{ctx['content']}\n" for ctx in contexts])

        if not code_context:
            return {"generated_unit_tests": {"markdown_tests": "# Unit Tests\nNo testable contexts located."}}

        system_instruction = (
            "You are an expert test engineer.\n"
            "Analyze the provided code and generate a corresponding suite of unit tests.\n"
            "Generate tests using appropriate frameworks (e.g. pytest for Python, Jest/Mocha for JS/TS).\n"
            "Include code blocks for the unit tests and explain the happy path and edge case scenarios covered."
        )

        user_prompt = f"Code context to write tests for:\n\n{code_context}"

        try:
            from app.services.retry_helper import ainvoke_with_retry
            response = await ainvoke_with_retry(self.llm, [
                SystemMessage(content=system_instruction),
                HumanMessage(content=user_prompt)
            ])
            return {"generated_unit_tests": {"markdown_tests": response.content}}
        except Exception as e:
            logger.error(f"Test Generator Agent failed: {str(e)}", exc_info=True)
            return {"generated_unit_tests": {"markdown_tests": "# Unit Tests\nGeneration failed."}}

test_generator = TestGenerator()
