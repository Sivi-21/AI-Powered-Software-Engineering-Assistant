import logging
import uuid
from datetime import datetime, timezone
from app.mongodb import get_database
from app.schemas.report import ReportCreate
from app.schemas.user import UserCreate
from app.schemas.user import UserOut


logger = logging.getLogger("app.services.db_service")

class DBService:
    # --- User Methods ---

    async def get_user(self, user_id: str) -> dict | None:
        """Retrieves a single user by ID."""
        db = get_database()
        user = await db.users.find_one({"_id": str(user_id)})
        if user:
            user["id"] = user.pop("_id")
        return user

    async def get_user_by_email(self, email: str) -> dict | None:
        """Retrieves a single user by email."""
        db = get_database()
        user = await db.users.find_one({"email": email})
        if user:
            user["id"] = user.pop("_id")
        return user

    async def create_user(self, user_in: UserCreate) -> dict:
        """Creates a new User record with a hashed password."""
        from app.services.auth_helper import hash_password
        db = get_database()
        user_id = str(uuid.uuid4())
        user_doc = {
            "_id": user_id,
            "email": user_in.email,
            "hashed_password": hash_password(user_in.password),
            "full_name": user_in.full_name,
            "organization": user_in.organization,
            "plan_type": "Developer Plan",
            "created_at": datetime.now(timezone.utc),
            "github_id": None,
            "avatar_url": None
        }
        await db.users.insert_one(user_doc)
        user_doc["id"] = user_doc.pop("_id")
        logger.info(f"Created user in MongoDB: {user_id} ({user_in.email})")
        return user_doc

    async def get_user_by_github_id(self, github_id: str) -> dict | None:
        """Retrieves a single user by their GitHub user ID."""
        db = get_database()
        user = await db.users.find_one({"github_id": github_id})
        if user:
            user["id"] = user.pop("_id")
        return user

    async def create_github_user(
        self,
        github_id: str,
        email: str,
        full_name: str,
        avatar_url: str | None = None
    ) -> dict:
        """Creates a new User record for GitHub OAuth login."""
        import secrets
        from app.services.auth_helper import hash_password
        db = get_database()
        random_pass = secrets.token_urlsafe(24)
        user_id = str(uuid.uuid4())
        user_doc = {
            "_id": user_id,
            "email": email,
            "hashed_password": hash_password(random_pass),
            "full_name": full_name,
            "organization": "GitHub Sandbox",
            "plan_type": "Developer Plan",
            "created_at": datetime.now(timezone.utc),
            "github_id": github_id,
            "avatar_url": avatar_url
        }
        await db.users.insert_one(user_doc)
        user_doc["id"] = user_doc.pop("_id")
        logger.info(f"Created GitHub user in MongoDB: {user_id} ({email})")
        return user_doc

    async def get_user_by_google_id(self, google_id: str) -> dict | None:
        """Retrieves a single user by their Google user ID."""
        db = get_database()
        user = await db.users.find_one({"google_id": google_id})
        if user:
            user["id"] = user.pop("_id")
        return user

    async def create_google_user(
        self,
        google_id: str,
        email: str,
        full_name: str,
        avatar_url: str | None = None
    ) -> dict:
        """Creates a new User record for Google OAuth login."""
        import secrets
        from app.services.auth_helper import hash_password
        db = get_database()
        random_pass = secrets.token_urlsafe(24)
        user_id = str(uuid.uuid4())
        user_doc = {
            "_id": user_id,
            "email": email,
            "hashed_password": hash_password(random_pass),
            "full_name": full_name,
            "organization": "Google Login",
            "plan_type": "Developer Plan",
            "created_at": datetime.now(timezone.utc),
            "google_id": google_id,
            "avatar_url": avatar_url,
            "login_provider": "google"
        }
        await db.users.insert_one(user_doc)
        user_doc["id"] = user_doc.pop("_id")
        logger.info(f"Created Google user in MongoDB: {user_id} ({email})")
        return user_doc

    # --- Project & Report Scoped Methods ---

    async def create_project(
        self, 
        name: str,
        project_id: str | uuid.UUID | None = None,
        user_id: str | uuid.UUID | None = None,
        repository_source: str = "ZIP",
        github_url: str | None = None,
        commit_hash: str | None = None,
        clone_timestamp = None
    ) -> dict:
        """Creates a new Repository document in MongoDB, associated with a user."""
        db = get_database()
        proj_id = str(project_id) if project_id else str(uuid.uuid4())
        owner_id = str(user_id) if user_id else None
        
        project_doc = {
            "_id": proj_id,
            "repository_name": name,
            "status": "pending",
            "current_progress": "Initializing...",
            "owner_id": owner_id,
            "repository_source": repository_source,
            "github_url": github_url,
            "commit_hash": commit_hash,
            "clone_timestamp": clone_timestamp,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "error_message": None
        }
        await db.repositories.insert_one(project_doc)
        project_doc["id"] = project_doc.pop("_id")
        logger.info(f"Created repository in MongoDB: {proj_id} ({name}) for owner {owner_id}")
        return project_doc

    async def get_project(self, project_id: str | uuid.UUID, user_id: str | uuid.UUID | None = None) -> dict | None:
        """Retrieves a single repository by its ID, optionally scoped to user."""
        db = get_database()
        query = {"_id": str(project_id)}
        if user_id:
            query["owner_id"] = str(user_id)
            
        project = await db.repositories.find_one(query)
        if project:
            project["id"] = project.pop("_id")
        return project

    async def get_all_projects(self, user_id: str | uuid.UUID | None = None) -> list[dict]:
        """Retrieves all repositories, optionally scoped to user."""
        db = get_database()
        query = {}
        if user_id:
            query["owner_id"] = str(user_id)
            
        cursor = db.repositories.find(query).sort("created_at", -1)
        projects = []
        async for project in cursor:
            project["id"] = project.pop("_id")
            projects.append(project)
        return projects

    async def update_project_progress(self, project_id: str | uuid.UUID, progress: str) -> bool:
        """Updates the current_progress message for a repository."""
        db = get_database()
        result = await db.repositories.update_one(
            {"_id": str(project_id)},
            {"$set": {"current_progress": progress, "updated_at": datetime.now(timezone.utc)}}
        )
        return result.modified_count > 0

    async def update_project_status(
        self, project_id: str | uuid.UUID, status: str, error_message: str | None = None
    ) -> dict | None:
        """Updates the status and potential error messages for a project."""
        db = get_database()
        update_fields = {"status": status, "updated_at": datetime.now(timezone.utc)}
        if error_message is not None:
            update_fields["error_message"] = error_message
            
        result = await db.repositories.find_one_and_update(
            {"_id": str(project_id)},
            {"$set": update_fields},
            return_document=True
        )
        if result:
            result["id"] = result.pop("_id")
            logger.info(f"Updated repository {project_id} status to {status}")
        return result

    async def delete_project(self, project_id: str | uuid.UUID, user_id: str | uuid.UUID | None = None) -> bool:
        """Deletes a project document from MongoDB, scoped to user if user_id is provided."""
        db = get_database()
        query = {"_id": str(project_id)}
        if user_id:
            query["owner_id"] = str(user_id)
            
        result = await db.repositories.delete_one(query)
        if result.deleted_count > 0:
            logger.info(f"Deleted repository {project_id} from MongoDB.")
            # Also cascade delete reports
            await db.reports.delete_many({"repository_id": str(project_id)})
            return True
        return False

    async def create_report(self, report_data: ReportCreate) -> dict:
        """Stores a generated AI report in MongoDB."""
        db = get_database()
        report_id = str(uuid.uuid4())
        
        report_doc = {
            "_id": report_id,
            "repository_id": str(report_data.project_id),
            "summary": report_data.summary,
            "code_quality_score": report_data.code_quality_score,
            "security_score": report_data.security_score,
            "architecture_score": report_data.architecture_score,
            "maintainability_score": report_data.maintainability_score,
            "documentation_score": report_data.documentation_score,
            "testing_score": report_data.testing_score,
            "dependency_score": report_data.dependency_score,
            "technical_debt": report_data.technical_debt,
            "code_complexity": report_data.code_complexity,
            "vulnerabilities": [v.model_dump() for v in report_data.vulnerabilities] if report_data.vulnerabilities else [],
            "suggestions": [s.model_dump() for s in report_data.suggestions] if report_data.suggestions else [],
            "ai_fixes": [f.model_dump() for f in report_data.ai_fixes] if report_data.ai_fixes else [],
            "generated_docs": report_data.generated_docs or {},
            "full_report_md": report_data.full_report_md,
            "created_at": datetime.now(timezone.utc)
        }
        await db.reports.insert_one(report_doc)
        report_doc["id"] = report_doc.pop("_id")
        logger.info(f"Stored report {report_id} for repository {report_data.project_id}")
        return report_doc

    async def get_report_by_project(self, project_id: str | uuid.UUID, user_id: str | uuid.UUID | None = None) -> dict | None:
        """Retrieves the analysis report linked to a project, verifying user ownership if user_id is provided."""
        db = get_database()
        if user_id:
            project = await self.get_project(str(project_id), user_id)
            if not project:
                return None
                
        report = await db.reports.find_one({"repository_id": str(project_id)})
        if report:
            report["id"] = report.pop("_id")
        return report

    # --- Pull Request Review Methods ---

    async def create_pr_review(self, project_id: str | uuid.UUID, pr_number: int, title: str, source_branch: str, target_branch: str, review_data: dict) -> dict:
        """Stores a generated PR review in MongoDB."""
        db = get_database()
        pr_id = str(uuid.uuid4())
        
        pr_doc = {
            "_id": pr_id,
            "project_id": str(project_id),
            "pr_number": pr_number,
            "title": title,
            "source_branch": source_branch,
            "target_branch": target_branch,
            "overall_pr_score": review_data.get("overall_pr_score", 100),
            "risk_assessment": review_data.get("risk_assessment", "LOW"),
            "merge_recommendation": review_data.get("merge_recommendation", "APPROVE"),
            "summary": review_data.get("summary", ""),
            "improvements": review_data.get("improvements", []),
            "comments": review_data.get("comments", []),
            "created_at": datetime.now(timezone.utc)
        }
        await db.pr_reviews.insert_one(pr_doc)
        pr_doc["id"] = pr_doc.pop("_id")
        logger.info(f"Stored PR review {pr_id} for PR #{pr_number} on project {project_id}")
        return pr_doc

    async def get_pr_reviews(self, project_id: str | uuid.UUID) -> list[dict]:
        """Retrieves all PR reviews associated with a repository."""
        db = get_database()
        cursor = db.pr_reviews.find({"project_id": str(project_id)}).sort("created_at", -1)
        reviews = []
        async for doc in cursor:
            doc["id"] = doc.pop("_id")
            reviews.append(doc)
        return reviews

    # --- Project Planning Methods ---

    async def save_project_plan(self, plan_doc: dict) -> None:
        """Stores a generated project plan in MongoDB."""
        db = get_database()
        await db.project_plans.insert_one(plan_doc)
        logger.info(f"Stored project plan {plan_doc.get('_id')} in MongoDB.")

    async def get_project_plan(self, plan_id: str, user_id: str | None = None) -> dict | None:
        """Retrieves a project plan by ID."""
        db = get_database()
        query = {"_id": str(plan_id)}
        if user_id:
            query["owner_id"] = str(user_id)
        plan = await db.project_plans.find_one(query)
        if plan:
            plan["id"] = plan.pop("_id")
        return plan

    async def get_project_plans(self, user_id: str | None = None) -> list[dict]:
        """Retrieves all project plans, optionally filtered by user ID."""
        db = get_database()
        query = {}
        if user_id:
            query["owner_id"] = str(user_id)
        cursor = db.project_plans.find(query).sort("created_at", -1)
        plans = []
        async for doc in cursor:
            doc["id"] = doc.pop("_id")
            plans.append(doc)
        return plans

    async def delete_project_plan(self, plan_id: str, user_id: str | None = None) -> bool:
        """Deletes a project plan from MongoDB."""
        db = get_database()
        query = {"_id": str(plan_id)}
        if user_id:
            query["owner_id"] = str(user_id)
        result = await db.project_plans.delete_one(query)
        return result.deleted_count > 0

    # --- Autonomous Engineering Methods ---

    async def save_autonomous_session(self, session_doc: dict) -> None:
        """Stores a new autonomous engineering session document in MongoDB."""
        db = get_database()
        await db.autonomous_sessions.insert_one(session_doc)
        logger.info(f"Stored autonomous session {session_doc['_id']} in MongoDB.")

    async def get_autonomous_session(self, session_id: str, user_id: str | None = None) -> dict | None:
        """Retrieves a single autonomous session by ID."""
        db = get_database()
        query = {"_id": str(session_id)}
        if user_id:
            query["owner_id"] = str(user_id)
        session = await db.autonomous_sessions.find_one(query)
        if session:
            session["id"] = session.pop("_id")
        return session

    async def get_autonomous_sessions(self, user_id: str | None = None) -> list[dict]:
        """Retrieves all autonomous sessions."""
        db = get_database()
        query = {}
        if user_id:
            query["owner_id"] = str(user_id)
        cursor = db.autonomous_sessions.find(query).sort("created_at", -1)
        sessions = []
        async for doc in cursor:
            doc["id"] = doc.pop("_id")
            sessions.append(doc)
        return sessions

    async def update_autonomous_session_status(
        self, session_id: str, status: str, tasks: list, logs: list, final_report: str | None = None
    ) -> bool:
        """Updates the tasks, logs, final report and state for an autonomous session."""
        db = get_database()
        update_fields = {
            "status": status,
            "tasks": tasks,
            "logs": logs,
            "updated_at": datetime.now(timezone.utc)
        }
        if final_report is not None:
            update_fields["final_report"] = final_report

        result = await db.autonomous_sessions.update_one(
            {"_id": str(session_id)},
            {"$set": update_fields}
        )
        return result.modified_count > 0

    async def delete_autonomous_session(self, session_id: str, user_id: str | None = None) -> bool:
        """Deletes an autonomous session document from MongoDB."""
        db = get_database()
        query = {"_id": str(session_id)}
        if user_id:
            query["owner_id"] = str(user_id)
        result = await db.autonomous_sessions.delete_one(query)
        return result.deleted_count > 0

    # --- Knowledge Graph Methods ---

    async def save_knowledge_graph(self, graph_doc: dict) -> None:
        """Stores a generated knowledge graph document in MongoDB."""
        db = get_database()
        # Set primary key to project_id to keep 1-to-1 map
        graph_doc["_id"] = str(graph_doc.get("project_id"))
        # Clean up existing before insert
        await db.knowledge_graphs.delete_many({"_id": graph_doc["_id"]})
        await db.knowledge_graphs.insert_one(graph_doc)
        logger.info(f"Stored knowledge graph for project {graph_doc['_id']} in MongoDB.")

    async def get_knowledge_graph(self, project_id: str) -> dict | None:
        """Retrieves knowledge graph mapping for a project."""
        db = get_database()
        graph = await db.knowledge_graphs.find_one({"_id": str(project_id)})
        if graph:
            graph["project_id"] = graph.pop("_id")
        return graph

    async def delete_knowledge_graph(self, project_id: str) -> bool:
        """Deletes knowledge graph document from MongoDB."""
        db = get_database()
        result = await db.knowledge_graphs.delete_one({"_id": str(project_id)})
        return result.deleted_count > 0

    # --- Organization Cloud Methods ---

    async def save_organization(self, org_doc: dict) -> None:
        """Stores a generated organization workspace in MongoDB."""
        db = get_database()
        await db.organizations.insert_one(org_doc)
        logger.info(f"Stored organization {org_doc['_id']} in MongoDB.")

    async def get_organization(self, org_id: str) -> dict | None:
        """Retrieves a single organization by ID."""
        db = get_database()
        org = await db.organizations.find_one({"_id": str(org_id)})
        if org:
            org["id"] = org.pop("_id")
        return org

    async def get_organization_by_owner(self, owner_id: str) -> dict | None:
        """Retrieves organization document by owner/creator ID."""
        db = get_database()
        org = await db.organizations.find_one({"owner_id": str(owner_id)})
        if org:
            org["id"] = org.pop("_id")
        return org

    async def update_organization_teams(self, org_id: str, teams: list) -> bool:
        """Updates team members roster for an organization."""
        db = get_database()
        result = await db.organizations.update_one(
            {"_id": str(org_id)},
            {"$set": {"teams": teams, "updated_at": datetime.now(timezone.utc)}}
        )
        return result.modified_count > 0

    async def delete_organization(self, org_id: str) -> bool:
        """Deletes organization workspace from MongoDB."""
        db = get_database()
        result = await db.organizations.delete_one({"_id": str(org_id)})
        return result.deleted_count > 0

    # --- Self-Learning Rules Methods ---

    async def save_self_learning_rule(self, rule_doc: dict) -> None:
        """Stores a self-learned rule document in MongoDB."""
        db = get_database()
        await db.self_learning_rules.insert_one(rule_doc)
        logger.info(f"Stored self-learning rule {rule_doc['_id']} in MongoDB.")

    async def get_self_learning_rules(self, category: str | None = None, user_id: str | None = None) -> list[dict]:
        """Retrieves self-learning rules, optionally filtered by category/user."""
        db = get_database()
        query = {}
        if category:
            query["category"] = category
        if user_id:
            query["owner_id"] = str(user_id)
        cursor = db.self_learning_rules.find(query).sort("created_at", -1)
        rules = []
        async for doc in cursor:
            doc["id"] = doc.pop("_id")
            rules.append(doc)
        return rules

    async def delete_self_learning_rule(self, rule_id: str, user_id: str | None = None) -> bool:
        """Deletes a self-learned rule document from MongoDB."""
        db = get_database()
        query = {"_id": str(rule_id)}
        if user_id:
            query["owner_id"] = str(user_id)
        result = await db.self_learning_rules.delete_one(query)
        return result.deleted_count > 0

    # --- Company Simulator Methods ---

    async def save_simulator_session(self, session_doc: dict) -> None:
        """Stores a new simulation session in MongoDB."""
        db = get_database()
        await db.simulator_sessions.insert_one(session_doc)
        logger.info(f"Stored simulation session {session_doc['_id']} in MongoDB.")

    async def get_simulator_session(self, session_id: str) -> dict | None:
        """Retrieves a single simulator session by ID."""
        db = get_database()
        session = await db.simulator_sessions.find_one({"_id": str(session_id)})
        if session:
            session["id"] = session.pop("_id")
        return session

    async def get_simulator_sessions(self, user_id: str | None = None) -> list[dict]:
        """Retrieves list of simulator sessions, sorted by date."""
        db = get_database()
        query = {}
        if user_id:
            query["owner_id"] = str(user_id)
        cursor = db.simulator_sessions.find(query).sort("created_at", -1)
        sessions = []
        async for doc in cursor:
            doc["id"] = doc.pop("_id")
            sessions.append(doc)
        return sessions

    async def update_simulator_session_messages(self, session_id: str, messages: list) -> bool:
        """Appends new messages into the simulation session thread."""
        db = get_database()
        result = await db.simulator_sessions.update_one(
            {"_id": str(session_id)},
            {"$set": {"messages": messages, "updated_at": datetime.now(timezone.utc)}}
        )
        return result.modified_count > 0

    async def update_simulator_session_status(self, session_id: str, status: str) -> bool:
        """Updates the status of the simulation session run."""
        db = get_database()
        result = await db.simulator_sessions.update_one(
            {"_id": str(session_id)},
            {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}}
        )
        return result.modified_count > 0

    # --- AGSE Goal Methods ---

    async def save_agse_goal(self, goal_doc: dict) -> None:
        """Stores a new AGSE goal session in MongoDB."""
        db = get_database()
        await db.agse_goals.insert_one(goal_doc)
        logger.info(f"Stored AGSE Goal {goal_doc['_id']} in MongoDB.")

    async def get_agse_goal(self, goal_id: str) -> dict | None:
        """Retrieves a single AGSE goal session by ID."""
        db = get_database()
        goal = await db.agse_goals.find_one({"_id": str(goal_id)})
        if goal:
            goal["id"] = goal.pop("_id")
        return goal

    async def get_agse_goals(self, user_id: str | None = None) -> list[dict]:
        """Retrieves list of AGSE goals, sorted by date."""
        db = get_database()
        query = {}
        if user_id:
            query["owner_id"] = str(user_id)
        cursor = db.agse_goals.find(query).sort("created_at", -1)
        goals = []
        async for doc in cursor:
            doc["id"] = doc.pop("_id")
            goals.append(doc)
        return goals

    async def update_agse_goal_stages(self, goal_id: str, stages: list) -> bool:
        """Updates generated details for the goal pipeline stages."""
        db = get_database()
        result = await db.agse_goals.update_one(
            {"_id": str(goal_id)},
            {"$set": {"stages": stages, "updated_at": datetime.now(timezone.utc)}}
        )
        return result.modified_count > 0

    async def update_agse_goal_status(self, goal_id: str, status: str) -> bool:
        """Updates the status of the AGSE run."""
        db = get_database()
        result = await db.agse_goals.update_one(
            {"_id": str(goal_id)},
            {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}}
        )
        return result.modified_count > 0

    # --- Global Civilization Network Methods ---

    async def save_global_network(self, network_doc: dict) -> None:
        """Stores a global civilization network document in MongoDB."""
        db = get_database()
        await db.global_networks.insert_one(network_doc)
        logger.info(f"Stored global civilization network {network_doc['_id']} in MongoDB.")

    async def get_global_network(self) -> dict | None:
        """Retrieves the active global civilization network workspace data."""
        db = get_database()
        # Find single active civilization network configuration
        network = await db.global_networks.find_one()
        return network

    async def update_global_network_registry(self, network_id: str, registry: list, metrics: dict) -> bool:
        """Updates shared policy checklists and civilization stats."""
        db = get_database()
        result = await db.global_networks.update_one(
            {"_id": str(network_id)},
            {"$set": {"shared_policy_registry": registry, "metrics": metrics, "updated_at": datetime.now(timezone.utc)}}
        )
        return result.modified_count > 0

    # --- Universal Brain Methods ---

    async def save_brain_decision(self, decision_doc: dict) -> None:
        """Stores a brain decision tracing document in MongoDB."""
        db = get_database()
        await db.universal_brain_decisions.insert_one(decision_doc)
        logger.info(f"Stored brain decision {decision_doc['_id']} in MongoDB.")

    async def get_brain_decisions(self, user_id: str | None = None) -> list[dict]:
        """Retrieves list of brain decisions, sorted by date."""
        db = get_database()
        query = {}
        if user_id:
            query["owner_id"] = str(user_id)
        cursor = db.universal_brain_decisions.find(query).sort("created_at", -1)
        decisions = []
        async for doc in cursor:
            doc["id"] = doc.pop("_id")
            decisions.append(doc)
        return decisions

    # --- Engineering Universe Methods ---

    async def save_engineering_universe(self, universe_doc: dict) -> None:
        """Stores a compiled engineering universe document in MongoDB."""
        db = get_database()
        await db.engineering_universes.insert_one(universe_doc)
        logger.info(f"Stored engineering universe for Org {universe_doc['_id']} in MongoDB.")

    async def get_engineering_universe(self, org_id: str) -> dict | None:
        """Retrieves engineering universe map for an organization."""
        db = get_database()
        universe = await db.engineering_universes.find_one({"_id": str(org_id)})
        if universe:
            universe["org_id"] = universe.pop("_id")
        return universe

    async def delete_engineering_universe(self, org_id: str) -> bool:
        """Deletes engineering universe document from MongoDB."""
        db = get_database()
        result = await db.engineering_universes.delete_one({"_id": str(org_id)})
        return result.deleted_count > 0

    # --- Digital Twin Methods ---

    async def save_digital_twin(self, twin_doc: dict) -> None:
        """Stores an organization digital twin trace in MongoDB."""
        db = get_database()
        await db.digital_twins.insert_one(twin_doc)
        logger.info(f"Stored digital twin for Org {twin_doc['_id']} in MongoDB.")

    async def get_digital_twin(self, org_id: str) -> dict | None:
        """Retrieves organization digital twin profile details."""
        db = get_database()
        twin = await db.digital_twins.find_one({"_id": str(org_id)})
        if twin:
            twin["org_id"] = twin.pop("_id")
        return twin

    # --- Engineering Government Methods ---

    async def save_government_session(self, session_doc: dict) -> None:
        """Stores a government session debate record in MongoDB."""
        db = get_database()
        await db.engineering_government_sessions.insert_one(session_doc)
        logger.info(f"Stored government session {session_doc['_id']} in MongoDB.")

    async def get_government_sessions(self, user_id: str | None = None) -> list[dict]:
        """Retrieves history of government debate session records."""
        db = get_database()
        query = {}
        if user_id:
            query["owner_id"] = str(user_id)
        cursor = db.engineering_government_sessions.find(query).sort("created_at", -1)
        sessions = []
        async for doc in cursor:
            doc["id"] = doc.pop("_id")
            sessions.append(doc)
        return sessions

# Instantiate the service
db_service = DBService()
