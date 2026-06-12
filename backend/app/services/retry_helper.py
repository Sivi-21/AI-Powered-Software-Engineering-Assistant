import asyncio
import logging
from typing import Any, List

logger = logging.getLogger("app.services.retry_helper")

async def ainvoke_with_retry(llm: Any, messages: List[Any], max_retries: int = 3, initial_delay: float = 5.0) -> Any:
    """
    Executes ainvoke on a LangChain LLM instance with exponential backoff retry logic
    for transient errors (429 Rate Limit/Resource Exhausted, 500, 502, 503, 504).
    """
    delay = initial_delay
    for attempt in range(max_retries + 1):
        try:
            return await llm.ainvoke(messages)
        except Exception as e:
            err_msg = str(e)
            
            # Identify transient errors by status codes or names
            is_transient = any(
                code in err_msg or status_name in err_msg.upper()
                for code in ["429", "500", "502", "503", "504"]
                for status_name in ["RESOURCE_EXHAUSTED", "UNAVAILABLE", "INTERNAL", "BAD_GATEWAY", "GATEWAY_TIMEOUT", "OVERLOADED"]
            )
            
            if is_transient and attempt < max_retries:
                logger.warning(
                    f"LLM request failed with rate limit or transient error. "
                    f"Retrying {attempt + 1}/{max_retries} after {delay} seconds. Error details: {err_msg}"
                )
                await asyncio.sleep(delay)
                delay *= 2  # 5s -> 10s -> 20s
            else:
                # Re-raise the exception on permanent failures or exhaustion of retry budget
                raise e
