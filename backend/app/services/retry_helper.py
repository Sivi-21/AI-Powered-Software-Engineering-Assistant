import asyncio
import logging
import json
import re
from typing import Any, List

logger = logging.getLogger("app.services.retry_helper")

def get_provider_name(model: Any) -> str:
    while hasattr(model, "bound"):
        model = model.bound
    if hasattr(model, "provider_name") and getattr(model, "provider_name"):
        return getattr(model, "provider_name")
    model_name = type(model).__name__
    if "ChatGroq" in model_name:
        return f"Groq ({getattr(model, 'model_name', 'default')})"
    elif "ChatGoogleGenerativeAI" in model_name:
        return f"Gemini ({getattr(model, 'model', 'default')})"
    elif "ChatOpenAI" in model_name:
        base_url = getattr(model, "base_url", "")
        model_id = getattr(model, "model", "default")
        if "openrouter" in str(base_url).lower():
            return f"OpenRouter ({model_id})"
        elif "inference.ai.azure" in str(base_url).lower():
            return f"GitHub Models ({model_id})"
        return f"OpenAI ({model_id})"
    return model_name

def validate_api_key(model: Any) -> bool:
    while hasattr(model, "bound"):
        model = model.bound
    model_name = type(model).__name__
    key = None
    if "ChatGroq" in model_name:
        key = getattr(model, "groq_api_key", None)
    elif "ChatGoogleGenerativeAI" in model_name:
        key = getattr(model, "google_api_key", None)
    elif "ChatOpenAI" in model_name:
        key = getattr(model, "api_key", None)
    
    if key and hasattr(key, "get_secret_value"):
        key = key.get_secret_value()
        
    if not key:
        return False
        
    key_str = str(key).strip()
    if not key_str or len(key_str) < 8 or "YOUR_API_KEY" in key_str:
        return False
        
    return True

def is_transient_error(err_msg: str) -> bool:
    err_upper = err_msg.upper()
    transient_indicators = [
        "429", "503", "502", "504", "500",
        "RESOURCE_EXHAUSTED", "RATE_LIMIT", "TIMEOUT", "OVERLOADED", 
        "SERVICE_UNAVAILABLE", "UNAVAILABLE", "INTERNAL", "BAD_GATEWAY", "GATEWAY_TIMEOUT"
    ]
    if any(ind in err_upper for ind in transient_indicators):
        permanent_indicators = ["401", "403", "404", "EXPIRED", "JWT", "UNAUTHORIZED", "INVALID_API_KEY", "BAD_API_KEY"]
        if not any(p_ind in err_upper for p_ind in permanent_indicators):
            return True
    return False

def repair_and_normalize_response(content: str) -> str:
    """
    Cleans markdown wrappers and repairs malformed JSON syntax or structures 
    to prevent Pydantic/downstream schema validation crashes.
    """
    cleaned = content.strip()
    
    # Strip markdown code blocks
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    
    # Search for json object/array boundaries
    start_idx = cleaned.find('{')
    end_idx = cleaned.rfind('}')
    if start_idx == -1 or end_idx == -1 or end_idx < start_idx:
        start_list = cleaned.find('[')
        end_list = cleaned.rfind(']')
        if start_list != -1 and end_list != -1 and end_list > start_list:
            cleaned = cleaned[start_list:end_list + 1]
    else:
        cleaned = cleaned[start_idx:end_idx + 1]
        
    # Replace Python literals with JSON-compatible primitives
    cleaned = re.sub(r'\bTrue\b', 'true', cleaned)
    cleaned = re.sub(r'\bFalse\b', 'false', cleaned)
    cleaned = re.sub(r'\bNone\b', 'null', cleaned)
    
    # Fix trailing commas
    cleaned = re.sub(r',\s*\}', '}', cleaned)
    cleaned = re.sub(r',\s*\]', ']', cleaned)
    
    try:
        data = json.loads(cleaned)
    except Exception:
        # If standard parsing fails, return cleaned content to let the fallback handle it
        return cleaned

    # Intelligently normalize expected schema types to ensure zero validation crashes
    if isinstance(data, dict):
        # 1. Findings list normalization for agents (code review, bug detector, security analyst)
        if "findings" in data:
            findings = data["findings"]
            if not isinstance(findings, list):
                if isinstance(findings, dict):
                    data["findings"] = [findings]
                else:
                    data["findings"] = []
                    
            normalized_findings = []
            for item in data["findings"]:
                if not isinstance(item, dict):
                    continue
                # Normalize keys (file / file_path mapping)
                has_file_key = "file" in item
                has_filepath_key = "file_path" in item

                file_val = item.get("file") or item.get("file_path") or "unknown"
                item["file"] = str(file_val)
                item["file_path"] = str(file_val)
                
                # Normalize line_number to integer or None
                ln = item.get("line_number")
                if ln is not None:
                    try:
                        item["line_number"] = int(ln)
                    except Exception:
                        item["line_number"] = None
                else:
                    item["line_number"] = None
                    
                # Normalize severity based on client requirements (code review uses Title Case)
                if has_file_key and not has_filepath_key:
                    item["severity"] = str(item.get("severity", "Medium")).strip().capitalize()
                else:
                    item["severity"] = str(item.get("severity", "MEDIUM")).strip().upper()
                
                # Coerce target strings safely
                for str_field in ["issue", "explanation", "recommendation", "bug_type", "description", "snippet"]:
                    if str_field in item:
                        val = item[str_field]
                        if val is not None:
                            item[str_field] = str(val)
                normalized_findings.append(item)
            data["findings"] = normalized_findings
            
        # 2. AI Fix schema normalization
        if "corrected_code" in data or "fixed_code" in data:
            for str_field in ["root_cause", "impact", "explanation", "suggested_fix", "why_fix_works"]:
                if str_field in data and data[str_field] is not None:
                    data[str_field] = str(data[str_field])
                    
            corrected = data.get("corrected_code")
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
                data["corrected_code"] = extracted
            elif corrected is None:
                pass
            elif not isinstance(corrected, str):
                try:
                    data["corrected_code"] = json.dumps(corrected, indent=2)
                except Exception:
                    data["corrected_code"] = str(corrected)
                    
            try:
                data["confidence_score"] = int(data.get("confidence_score", 85))
            except Exception:
                data["confidence_score"] = 85

    return json.dumps(data, indent=2)

async def ainvoke_with_retry(llm: Any, messages: List[Any], max_retries: int = 3, initial_delay: float = 2.0) -> Any:
    """
    Executes ainvoke on a LangChain LLM instance with fallback chain orchestration,
    exponential backoff retry logic for transient errors, API key validation,
    fallback recovery logging, and response parsing normalization/repair.
    """
    models = []
    if hasattr(llm, "runnable") and hasattr(llm, "fallbacks"):
        models = [llm.runnable] + list(llm.fallbacks)
    else:
        models = [llm]

    last_exception = None
    
    for idx, model in enumerate(models):
        provider = get_provider_name(model)
        logger.info(f"Attempting LLM request with provider: {provider} (Candidate {idx+1}/{len(models)})")
        
        if not validate_api_key(model):
            msg = f"API Key validation failed for provider {provider}. Skipping to next fallback."
            logger.warning(msg)
            last_exception = ValueError(msg)
            continue
            
        delay = initial_delay
        for attempt in range(max_retries + 1):
            try:
                response = await model.ainvoke(messages)
                logger.info(f"Successfully processed LLM request using provider: {provider}")
                
                # Intercept and normalize response content structure defensively
                if hasattr(response, "content") and isinstance(response.content, str):
                    response.content = repair_and_normalize_response(response.content)
                    
                return response
            except Exception as e:
                err_msg = str(e)
                last_exception = e
                
                if is_transient_error(err_msg) and attempt < max_retries:
                    logger.warning(
                        f"Provider {provider} failed with transient error: {err_msg}. "
                        f"Retrying attempt {attempt+1}/{max_retries} in {delay}s..."
                    )
                    await asyncio.sleep(delay)
                    delay *= 2
                else:
                    logger.error(
                        f"Provider {provider} failed (attempt {attempt+1}/{max_retries+1}). "
                        f"Error: {err_msg}. Triggering fallback to next provider."
                    )
                    break
                    
    if last_exception:
        raise last_exception
    raise ValueError("No configured LLM providers were available or succeeded.")
