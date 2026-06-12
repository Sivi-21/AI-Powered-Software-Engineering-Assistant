import logging
from langchain_core.language_models.chat_models import BaseChatModel
from app.config import settings

logger = logging.getLogger("app.services.llm_provider")

def get_llm(json_mode: bool = False) -> BaseChatModel:
    """
    Returns a unified ChatModel that automatically falls back across:
    1. Groq (if GROQ_API_KEY is configured)
    2. Google Generative AI / Gemini (if GEMINI_API_KEY is configured)
    3. OpenRouter (if OPENROUTER_API_KEY is configured)
    4. GitHub Models (if GITHUB_TOKEN is configured)
    """
    models = []

    # 1. Groq Setup
    if settings.GROQ_API_KEY:
        try:
            from langchain_groq import ChatGroq
            groq_llm = ChatGroq(
                model_name=settings.GROQ_MODEL,
                groq_api_key=settings.GROQ_API_KEY,
                temperature=0.1
            )
            if json_mode:
                groq_llm = groq_llm.bind(response_format={"type": "json_object"})
            models.append(groq_llm)
        except Exception as e:
            logger.warning(f"Failed to initialize Groq model: {e}")

    # 2. Gemini Setup
    if settings.GEMINI_API_KEY:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            gemini_kwargs = {
                "model": "gemini-2.5-flash",
                "google_api_key": settings.GEMINI_API_KEY,
                "temperature": 0.1
            }
            gemini_llm = ChatGoogleGenerativeAI(**gemini_kwargs)
            if json_mode:
                gemini_llm = gemini_llm.bind(response_format={"type": "json_object"})
            models.append(gemini_llm)
        except Exception as e:
            logger.warning(f"Failed to initialize Gemini model: {e}")

    # 3. OpenRouter Setup (using langchain_openai)
    if settings.OPENROUTER_API_KEY:
        try:
            from langchain_openai import ChatOpenAI
            openrouter_llm = ChatOpenAI(
                api_key=settings.OPENROUTER_API_KEY,
                base_url="https://openrouter.ai/api/v1",
                model=settings.OPENROUTER_MODEL,
                temperature=0.1
            )
            if json_mode:
                openrouter_llm = openrouter_llm.bind(response_format={"type": "json_object"})
            models.append(openrouter_llm)
        except Exception as e:
            logger.warning(f"Failed to initialize OpenRouter model: {e}")

    # 4. GitHub Models Setup
    if settings.GITHUB_TOKEN:
        try:
            from langchain_openai import ChatOpenAI
            github_llm = ChatOpenAI(
                api_key=settings.GITHUB_TOKEN,
                base_url="https://models.inference.ai.azure.com",
                model=settings.GITHUB_MODEL,
                temperature=0.1
            )
            if json_mode:
                github_llm = github_llm.bind(response_format={"type": "json_object"})
            models.append(github_llm)
        except Exception as e:
            logger.warning(f"Failed to initialize GitHub model: {e}")

    if not models:
        # Fallback to standard local config error / dummy if none are configured
        raise ValueError("No LLM API keys are configured (Groq, Gemini, OpenRouter, or GitHub). Please set up your .env file.")

    import random
    # Shuffle the models list to load balance requests across all available API providers
    random.shuffle(models)

    primary_model = models[0]
    if len(models) > 1:
        logger.info(f"Setting up load-balanced LLM fallback chain. Primary for this call: {type(primary_model).__name__}")
        return primary_model.with_fallbacks(models[1:])
    
    return primary_model
