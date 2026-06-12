import json
import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from pydantic import ValidationError

from app.services.code_review_agent import (
    CodeReviewFinding,
    CodeReviewResult,
    code_review_agent
)

# ==========================================
# 1. PYDANTIC SCHEMA VALIDATION TESTS
# ==========================================

def test_code_review_finding_validation_success():
    """Positive Case: Verify that correct parameters build a valid CodeReviewFinding model."""
    data = {
        "severity": "High",
        "file": "main.py",
        "line_number": 12,
        "issue": "Long Method",
        "explanation": "The handle_request function is 120 lines long.",
        "recommendation": "Split handle_request into smaller, modular handlers."
    }
    finding = CodeReviewFinding.model_validate(data)
    assert finding.severity == "High"
    assert finding.file == "main.py"
    assert finding.line_number == 12
    assert finding.issue == "Long Method"
    assert finding.explanation == data["explanation"]
    assert finding.recommendation == data["recommendation"]

def test_code_review_finding_validation_optional_fields():
    """Boundary Case: Verify that line_number is optional and defaults to None."""
    data = {
        "severity": "Low",
        "file": "utils.js",
        "issue": "Poor Naming",
        "explanation": "Variable 'x' is not descriptive.",
        "recommendation": "Rename 'x' to 'user_index'."
    }
    finding = CodeReviewFinding.model_validate(data)
    assert finding.line_number is None

def test_code_review_finding_validation_missing_required():
    """Negative Case: Verify that missing required fields raises a validation error."""
    invalid_data = {
        "severity": "High",
        "issue": "Missing file and explanations"
    }
    with pytest.raises(ValidationError):
        CodeReviewFinding.model_validate(invalid_data)

# ==========================================
# 2. JSON RESPONSE PARSING & SCHEMA VALIDATION
# ==========================================

def test_code_review_result_validation():
    """Positive Case: Verify that a valid list of findings passes CodeReviewResult schema validation."""
    raw_json = {
        "findings": [
            {
                "severity": "Medium",
                "file": "db.py",
                "line_number": 40,
                "issue": "Code Smell",
                "explanation": "Global database session used.",
                "recommendation": "Inject session dependency via fastapi Depends."
            },
            {
                "severity": "High",
                "file": "router.py",
                "line_number": 88,
                "issue": "Deep Nesting",
                "explanation": "For loops nested 4 layers deep.",
                "recommendation": "Extract nested loop logic into separate functions."
            }
        ]
    }
    result = CodeReviewResult.model_validate(raw_json)
    assert len(result.findings) == 2
    assert result.findings[0].severity == "Medium"
    assert result.findings[1].issue == "Deep Nesting"

# ==========================================
# 3. AGENT NODE LOGIC & FALLBACK TESTS
# ==========================================

@pytest.mark.asyncio
async def test_code_review_agent_run_node_success():
    """Positive Case: Verify run_node executes successfully when LLM returns well-formed JSON."""
    project_id = uuid.uuid4()
    state = {
        "project_id": str(project_id),
        "project_name": "test_project",
        "file_paths": ["app/main.py"]
    }

    mock_llm_response = MagicMock()
    mock_llm_response.content = json.dumps({
        "findings": [
            {
                "severity": "Medium",
                "file": "app/main.py",
                "line_number": 15,
                "issue": "Code Smell",
                "explanation": "Too many inline comments.",
                "recommendation": "Remove trivial comments and write docstrings instead."
            }
        ]
    })

    # Directly mock json_llm by reassignment to bypass Pydantic model blockings
    original_llm = code_review_agent.json_llm
    mock_json_llm = AsyncMock()
    mock_json_llm.ainvoke.return_value = mock_llm_response
    code_review_agent.json_llm = mock_json_llm

    try:
        with patch.object(code_review_agent, "_get_code_content", new_callable=AsyncMock) as mock_get_code:
            mock_get_code.return_value = "def test():\n    pass"
            
            output = await code_review_agent.run_node(state)
            
            assert "code_review_findings" in output
            findings = output["code_review_findings"]
            assert len(findings) == 1
            assert findings[0]["severity"] == "Medium"
            assert findings[0]["file"] == "app/main.py"
            assert findings[0]["issue"] == "Code Smell"
            assert findings[0]["explanation"] == "Too many inline comments."
    finally:
        # Restore original LLM
        code_review_agent.json_llm = original_llm

@pytest.mark.asyncio
async def test_code_review_agent_run_node_fallback_error():
    """Negative Case: Verify that run_node falls back gracefully to empty list on LLM exception."""
    project_id = uuid.uuid4()
    state = {
        "project_id": str(project_id),
        "project_name": "test_project",
        "file_paths": ["app/main.py"]
    }

    # Directly mock json_llm with a failing mock
    original_llm = code_review_agent.json_llm
    mock_json_llm = AsyncMock()
    mock_json_llm.ainvoke.side_effect = Exception("Google Generative AI service is down.")
    code_review_agent.json_llm = mock_json_llm

    try:
        with patch.object(code_review_agent, "_get_code_content", new_callable=AsyncMock) as mock_get_code:
            mock_get_code.return_value = "def test():\n    pass"
            
            # The agent should handle the exception internally and return empty findings rather than throwing
            output = await code_review_agent.run_node(state)
            
            assert "code_review_findings" in output
            assert output["code_review_findings"] == []
    finally:
        # Restore original LLM
        code_review_agent.json_llm = original_llm
