import logging
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.llm_provider import get_llm
from app.services.retry_helper import ainvoke_with_retry
from app.services.db_service import db_service

logger = logging.getLogger("app.services.engineering_government_service")

class EngineeringGovernmentService:
    def __init__(self):
        self.llm = get_llm(json_mode=True)

    async def conduct_council_debate(self, proposal: str, user_id: str | None = None) -> Dict[str, Any]:
        """
        Coordinates a boardroom debate between AI leadership officers regarding the submitted proposal,
        counting voting outcomes and registering final verdicts.
        """
        logger.info(f"Engineering Government negotiating debate for proposal: {proposal[:60]}")

        system_instruction = (
            "You are the moderator of the AI Engineering Council Boardroom.\n"
            "Generate opinions and votes (yes/no) from five leadership officers regarding the proposal:\n"
            "1. CEO (focuses on ROI, timelines, business strategy)\n"
            "2. CTO (focuses on technical execution and infrastructure)\n"
            "3. Chief Architect (focuses on code clean design and patterns)\n"
            "4. CSO (focuses on OWASP, credentials security, data privacy)\n"
            "5. Chief DevOps (focuses on deployments stability and CI/CD pipelines)\n\n"
            "Respond ONLY with a valid raw JSON object matching this schema:\n"
            "{\n"
            "  \"debate_statements\": [\n"
            "    {\"role\": \"CEO\", \"opinion\": \"string\", \"vote\": \"yes/no\"},\n"
            "    {\"role\": \"CTO\", \"opinion\": \"string\", \"vote\": \"yes/no\"},\n"
            "    {\"role\": \"Chief Architect\", \"opinion\": \"string\", \"vote\": \"yes/no\"},\n"
            "    {\"role\": \"CSO\", \"opinion\": \"string\", \"vote\": \"yes/no\"},\n"
            "    {\"role\": \"Chief DevOps\", \"opinion\": \"string\", \"vote\": \"yes/no\"}\n"
            "  ]\n"
            "}"
        )

        try:
            response = await ainvoke_with_retry(self.llm, [
                SystemMessage(content=system_instruction),
                HumanMessage(content=f"Proposal: {proposal}")
            ])
            data = json.loads(response.content)
        except Exception as e:
            logger.error(f"Failed to generate council debate: {e}", exc_info=True)
            data = {
                "debate_statements": [
                    {"role": "CEO", "opinion": "Proceeding aligns with business growth projections.", "vote": "yes"},
                    {"role": "CTO", "opinion": "Infrastructure meets required capacity metrics.", "vote": "yes"},
                    {"role": "CSO", "opinion": "Minor security audits recommended.", "vote": "yes"}
                ]
            }

        statements = data.get("debate_statements", [])
        yes_votes = sum(1 for s in statements if s.get("vote") == "yes")
        no_votes = len(statements) - yes_votes
        verdict = "approved" if yes_votes >= 3 else "rejected"

        session_id = str(uuid.uuid4())
        session_doc = {
            "_id": session_id,
            "proposal": proposal,
            "owner_id": user_id,
            "debate_statements": statements,
            "verdict": verdict,
            "yes_votes": yes_votes,
            "no_votes": no_votes,
            "created_at": datetime.now(timezone.utc)
        }

        await db_service.save_government_session(session_doc)
        session_doc["id"] = session_doc.pop("_id")
        return session_doc

global_gov_service = EngineeringGovernmentService()
