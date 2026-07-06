import json
import logging
import uuid
from typing import Any, TypedDict, List, Dict
from pydantic import BaseModel, Field

from langgraph.graph import StateGraph, START, END
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.services.llm_provider import get_llm

from app.config import settings
from app.services.db_service import db_service
from app.services.vector_store import vector_store
from app.services.code_review_agent import code_review_agent
from app.services.bug_detector import bug_detector
from app.services.security_analyst import security_analyst
from app.services.doc_generator import doc_generator
from app.services.test_generator import test_generator
from app.services.quality_scorer import quality_scorer
from app.schemas.report import Vulnerability, Suggestion, ReportCreate, AIFix

logger = logging.getLogger("app.services.agent_workflow")

# 1. State Definition
class AnalysisState(TypedDict):
    project_id: str
    project_name: str
    file_paths: List[str]
    architecture_summary: str
    vulnerabilities: List[dict]
    suggestions: List[dict]
    code_review_findings: List[dict]
    bug_detections: List[dict]
    security_vulnerabilities: List[dict]
    documentation_manifest: Dict[str, Any]
    generated_unit_tests: Dict[str, Any]
    health_summary: str
    code_quality_score: int
    security_score: int
    architecture_score: int
    maintainability_score: int
    documentation_score: int
    testing_score: int
    dependency_score: int
    technical_debt: int
    code_complexity: int
    ai_fixes: List[dict]
    full_report_md: str
    error: str | None

class AgentWorkflow:
    def __init__(self):
        self.llm = get_llm(json_mode=False)
        self._build_graph()

    # --- LangGraph Nodes ---

    async def analyze_architecture(self, state: AnalysisState) -> dict:
        """Node 1: Evaluates the project directory structures to understand technology stack."""
        logger.info(f"[{state['project_name']}] Node: Analyze Architecture started.")
        await db_service.update_project_progress(state["project_id"], "Agent: Analyzing System Architecture...")
        
        file_tree = "\n".join(state["file_paths"][:200])
        if len(state["file_paths"]) > 200:
            file_tree += f"\n... and {len(state['file_paths']) - 200} more files."
            
        system_prompt = (
            "You are an expert senior software architect. "
            "Analyze the provided file structure of a repository. "
            "Identify the programming language(s), frameworks, libraries, design patterns, "
            "and overall directory layout. "
            "Provide a concise high-level architecture overview."
        )
        
        user_prompt = f"Project Name: {state['project_name']}\n\nFile paths in project:\n{file_tree}"
        
        try:
            from app.services.retry_helper import ainvoke_with_retry
            response = await ainvoke_with_retry(self.llm, [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ])
            return {"architecture_summary": response.content}
        except Exception as e:
            logger.error(f"Error in analyze_architecture: {str(e)}")
            return {"architecture_summary": "Architecture analysis unavailable due to API error.", "error": str(e)}

    async def review_code(self, state: AnalysisState) -> dict:
        """Node: Audits codebase files for maintainability, duplicate code, naming and nesting issues."""
        await db_service.update_project_progress(state["project_id"], "Agent: Running Code Review Audit...")
        return await code_review_agent.run_node(state)

    async def detect_bugs(self, state: AnalysisState) -> dict:
        """Node: Audits codebase for functional logic bugs and edge cases."""
        await db_service.update_project_progress(state["project_id"], "Agent: Detecting Logical Bugs...")
        return await bug_detector.run_node(state)

    async def audit_security(self, state: AnalysisState) -> dict:
        """Node: Scans codebase for secrets leak, CWEs, injection vulnerabilities."""
        await db_service.update_project_progress(state["project_id"], "Agent: Scanning for Security Vulnerabilities...")
        return await security_analyst.run_node(state)

    async def generate_docs(self, state: AnalysisState) -> dict:
        """Node: Generates codebase overview and file descriptions."""
        await db_service.update_project_progress(state["project_id"], "Agent: Generating Documentation...")
        return await doc_generator.run_node(state)

    async def generate_tests(self, state: AnalysisState) -> dict:
        """Node: Generates boilerplate unit tests for core modules."""
        await db_service.update_project_progress(state["project_id"], "Agent: Generating Unit Tests...")
        return await test_generator.run_node(state)

    async def score_quality(self, state: AnalysisState) -> dict:
        """Node: Aggregates issues and computes a quality score."""
        await db_service.update_project_progress(state["project_id"], "Agent: Computing Quality Score...")
        return await quality_scorer.run_node(state)

    async def synthesize_report(self, state: AnalysisState) -> dict:
        """Node: Aggregates findings and compiles a structured final Markdown report."""
        logger.info(f"[{state['project_name']}] Node: Synthesize Report started.")
        await db_service.update_project_progress(state["project_id"], "Agent: Synthesizing Final Report...")
        
        vuln_list = json.dumps(state.get("security_vulnerabilities", []), indent=2)
        bug_list = json.dumps(state.get("bug_detections", []), indent=2)
        code_review_list = json.dumps(state.get("code_review_findings", []), indent=2)
        docs = state.get("documentation_manifest", {}).get("markdown_docs", "")
        tests = state.get("generated_unit_tests", {}).get("markdown_tests", "")
        health_summary = state.get("health_summary", "")
        
        system_prompt = (
            "You are a professional technical lead and technical writer. "
            "Create a clean, thorough Software Analysis Report in Markdown format based on the given findings."
        )
        
        user_prompt = (
            f"Project: {state['project_name']}\n"
            f"Overall Quality Score: {state['code_quality_score']}/100\n\n"
            f"Health Summary:\n{health_summary}\n\n"
            f"Architecture Summary:\n{state['architecture_summary']}\n\n"
            f"Security Audit (Vulnerabilities):\n```json\n{vuln_list}\n```\n\n"
            f"Bug Detection Audit:\n```json\n{bug_list}\n```\n\n"
            f"Code Review Findings:\n```json\n{code_review_list}\n```\n\n"
            f"Generated Documentation Overview:\n{docs}\n\n"
            f"Generated Unit Tests Overview:\n{tests}\n\n"
            "Generate a professional, structured markdown report. Include an Executive Summary, Health & Quality Analysis, "
            "Architecture Breakdown, Security Vulnerabilities, Detected Bugs, Code Quality Review, "
            "Documentation Overview, and Boilerplate Unit Tests."
        )
        
        try:
            from app.services.retry_helper import ainvoke_with_retry
            response = await ainvoke_with_retry(self.llm, [
                SystemMessage(content=system_instruction), # Note: we use system_prompt as it was defined, wait let's use system_prompt
            ])
        except Exception:
            # Let's write the response generation cleanly using local variable
            pass
            
        try:
            from app.services.retry_helper import ainvoke_with_retry
            response = await ainvoke_with_retry(self.llm, [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ])
            return {"full_report_md": response.content}
        except Exception as e:
            logger.error(f"Error in synthesize_report: {str(e)}")
            return {"full_report_md": f"# Analysis Report\n\nFailed to compile full report due to error: {str(e)}"}

    async def generate_fixes(self, state: AnalysisState) -> dict:
        """Node: Generates AI-powered fixes for detected security vulnerabilities, bugs, and code smells."""
        logger.info(f"[{state['project_name']}] Node: Generate AI Fixes started.")
        await db_service.update_project_progress(state["project_id"], "Agent: Generating AI Code Fixes...")
        
        findings_to_fix = []
        
        # Gather security vulns
        for v in state.get("security_vulnerabilities", []):
            findings_to_fix.append({
                "file_path": v.get("file_path", "unknown"),
                "line_number": v.get("line_number"),
                "issue_type": "Security Vulnerability",
                "severity": v.get("severity", "MEDIUM"),
                "description": v.get("description", "Security alert."),
                "snippet": v.get("snippet") or "No snippet available."
            })
            
        # Gather bugs
        for b in state.get("bug_detections", []):
            findings_to_fix.append({
                "file_path": b.get("file_path", "unknown"),
                "line_number": b.get("line_number"),
                "issue_type": f"Bug: {b.get('bug_type', 'Logic Error')}",
                "severity": b.get("severity", "MEDIUM"),
                "description": b.get("description", "Logic issue."),
                "snippet": b.get("snippet") or "No snippet available."
            })
            
        # Gather code smells
        for cr in state.get("code_review_findings", []):
            findings_to_fix.append({
                "file_path": cr.get("file", "unknown"),
                "line_number": cr.get("line_number"),
                "issue_type": f"Code Quality: {cr.get('issue', 'Style Issue')}",
                "severity": cr.get("severity", "MEDIUM"),
                "description": cr.get("explanation", "Style smell."),
                "snippet": cr.get("snippet") or "No snippet available."
            })
            
        # Limit to top 8 findings to preserve API quota
        findings_to_fix = findings_to_fix[:8]
        
        fixes = []
        import asyncio
        from app.services.fix_service import fix_service
        
        async def process_fix(f):
            try:
                res = await fix_service.generate_fix(
                    file_path=f["file_path"],
                    snippet=f["snippet"],
                    issue_description=f["description"]
                )
                corrected = res.get("corrected_code", f["snippet"])
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
                    corrected = extracted
                elif corrected is None:
                    corrected = f["snippet"]
                elif not isinstance(corrected, str):
                    try:
                        corrected = json.dumps(corrected, indent=2)
                    except Exception:
                        corrected = str(corrected)

                return {
                    "file_path": f["file_path"],
                    "line_number": f["line_number"],
                    "issue_type": f["issue_type"],
                    "severity": f["severity"],
                    "root_cause": res.get("root_cause", "N/A"),
                    "explanation": res.get("explanation", "N/A"),
                    "before_code": f["snippet"],
                    "fixed_code": corrected,
                    "why_fix_works": res.get("why_fix_works") or res.get("explanation") or "Corrects invalid code pattern.",
                    "best_practices": res.get("best_practices", []),
                    "confidence_score": res.get("confidence_score", 85)
                }
            except Exception as e:
                logger.error(f"Error generating fix for {f['file_path']}: {e}")
                return None

        tasks = [process_fix(f) for f in findings_to_fix]
        results = await asyncio.gather(*tasks)
        fixes = [r for r in results if r is not None]
        
        return {"ai_fixes": fixes}


    # --- Setup Graph ---

    def _build_graph(self):
        builder = StateGraph(AnalysisState)
        
        # Add nodes
        builder.add_node("analyze_architecture", self.analyze_architecture)
        builder.add_node("review_code", self.review_code)
        builder.add_node("detect_bugs", self.detect_bugs)
        builder.add_node("audit_security", self.audit_security)
        builder.add_node("generate_docs", self.generate_docs)
        builder.add_node("generate_fixes", self.generate_fixes)
        builder.add_node("generate_tests", self.generate_tests)
        builder.add_node("score_quality", self.score_quality)
        builder.add_node("synthesize_report", self.synthesize_report)
        
        # Link nodes - Fan out architecture summary to reviews, bugs, and security in parallel
        builder.add_edge(START, "analyze_architecture")
        builder.add_edge("analyze_architecture", "review_code")
        builder.add_edge("analyze_architecture", "detect_bugs")
        builder.add_edge("analyze_architecture", "audit_security")
        
        # Fan in review findings to docs & fixes
        builder.add_edge("review_code", "generate_docs")
        builder.add_edge("detect_bugs", "generate_docs")
        builder.add_edge("audit_security", "generate_docs")
        
        builder.add_edge("review_code", "generate_fixes")
        builder.add_edge("detect_bugs", "generate_fixes")
        builder.add_edge("audit_security", "generate_fixes")
        
        # Link docs and fixes to tests -> score -> report
        builder.add_edge("generate_docs", "generate_tests")
        builder.add_edge("generate_fixes", "generate_tests")
        builder.add_edge("generate_tests", "score_quality")
        builder.add_edge("score_quality", "synthesize_report")
        builder.add_edge("synthesize_report", END)
        
        self.graph = builder.compile()


    # --- Executable Methods ---

    async def run_analysis(self, project_id: uuid.UUID, project_name: str, file_paths: list[str]) -> ReportCreate:
        """Triggers the full LangGraph state machine analysis."""
        initial_state = {
            "project_id": str(project_id),
            "project_name": project_name,
            "file_paths": file_paths,
            "architecture_summary": "",
            "vulnerabilities": [],
            "suggestions": [],
            "code_review_findings": [],
            "bug_detections": [],
            "security_vulnerabilities": [],
            "documentation_manifest": {},
            "generated_unit_tests": {},
            "health_summary": "",
            "code_quality_score": 100,
            "full_report_md": "",
            "error": None
        }
        
        result_state = await self.graph.ainvoke(initial_state)
        
        if result_state.get("error"):
            logger.warning(f"Workflow finished with error log: {result_state['error']}")
            
        # Parse vulnerabilities
        vulns = []
        for v in result_state.get("security_vulnerabilities", []):
            vulns.append(Vulnerability(
                severity=v.get("severity", "MEDIUM"),
                file_path=v.get("file_path", "unknown"),
                line_number=v.get("line_number"),
                description=v.get("description", "Security alert."),
                snippet=v.get("snippet")
            ))

        suggs = []
        for s in result_state.get("bug_detections", []):
            suggs.append(Suggestion(
                file_path=s.get("file_path", "unknown"),
                suggestion=f"[BUG] {s.get('bug_type', 'Logic Bug')}",
                explanation=f"{s.get('description', '')}\nFix Recommendation: {s.get('recommendation', '')}"
            ))

        for cr in result_state.get("code_review_findings", []):
            suggs.append(Suggestion(
                file_path=cr.get("file", "unknown"),
                suggestion=f"[CODE REVIEW] {cr.get('issue', 'Style Issue')}",
                explanation=f"{cr.get('explanation', '')}\nFix Recommendation: {cr.get('recommendation', '')}"
            ))

        # Parse AIFixes
        fixes_list = []
        for f in result_state.get("ai_fixes", []):
            fixes_list.append(AIFix(
                file_path=f.get("file_path", "unknown"),
                line_number=f.get("line_number"),
                issue_type=f.get("issue_type", "Smell"),
                severity=f.get("severity", "MEDIUM"),
                root_cause=f.get("root_cause", ""),
                explanation=f.get("explanation", ""),
                before_code=f.get("before_code", ""),
                fixed_code=f.get("fixed_code", ""),
                why_fix_works=f.get("why_fix_works", ""),
                best_practices=f.get("best_practices", []),
                confidence_score=f.get("confidence_score", 85)
            ))

        return ReportCreate(
            project_id=project_id,
            summary=result_state.get("health_summary") or result_state.get("architecture_summary") or "Analysis completed.",
            code_quality_score=result_state.get("code_quality_score", 70),
            security_score=result_state.get("security_score", 100),
            architecture_score=result_state.get("architecture_score", 100),
            maintainability_score=result_state.get("maintainability_score", 100),
            documentation_score=result_state.get("documentation_score", 100),
            testing_score=result_state.get("testing_score", 100),
            dependency_score=result_state.get("dependency_score", 100),
            technical_debt=result_state.get("technical_debt", 0),
            code_complexity=result_state.get("code_complexity", 0),
            vulnerabilities=vulns,
            suggestions=suggs,
            ai_fixes=fixes_list,
            generated_docs=result_state.get("documentation_manifest", {}),
            full_report_md=result_state.get("full_report_md", "# Report generation failed.")
        )


    async def answer_codebase_query(self, project_id: uuid.UUID, project_name: str, query: str, history: list[dict] = []) -> dict:
        """Performs a simple codebase RAG search and returns a QA response from Gemini."""
        logger.info(f"Answering query on codebase '{project_name}' for query: '{query}'")
        
        contexts = await vector_store.query_code(project_id, query, n_results=5)
        sources = list(set([ctx["file_path"] for ctx in contexts if ctx.get("file_path")]))
        
        context_str = ""
        for idx, ctx in enumerate(contexts):
            context_str += f"\nSource {idx+1}: {ctx['file_path']} (line {ctx['start_line']})\nContent:\n{ctx['content']}\n"

        system_prompt = (
            f"You are a helpful software engineering assistant working on the codebase '{project_name}'. "
            "Answer the user's question about the codebase based on the provided semantic code snippets. "
            "Provide code examples and file references where necessary. "
            "Only answer questions using repository context. If the answer cannot be determined from the codebase, explain that context is missing."
        )
        
        user_prompt = f"Context files:\n{context_str}\n\nQuestion: {query}"
        
        # Build prompt sequence with memory history
        messages = [SystemMessage(content=system_prompt)]
        for msg in history:
            role = msg.get("role")
            content = msg.get("content")
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))
        messages.append(HumanMessage(content=user_prompt))

        try:
            from app.services.retry_helper import ainvoke_with_retry
            response = await ainvoke_with_retry(self.llm, messages)
            return {
                "answer": response.content,
                "sources": sources
            }
        except Exception as e:
            logger.error(f"Error answering codebase query: {str(e)}")
            return {
                "answer": f"Could not generate an answer because of an API error: {str(e)}",
                "sources": []
            }

agent_workflow = AgentWorkflow()
