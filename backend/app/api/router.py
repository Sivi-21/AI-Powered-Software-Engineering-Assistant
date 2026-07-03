from fastapi import APIRouter
from app.api.routes import projects, repositories, auth, planning, autonomous_agent, knowledge_graph, organization, self_learning, company_simulator, goal_based_engineering, global_network, universal_brain, engineering_universe, digital_twin, engineering_government

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(projects.router)
api_router.include_router(repositories.router)
api_router.include_router(planning.router)
api_router.include_router(autonomous_agent.router)
api_router.include_router(knowledge_graph.router)
api_router.include_router(organization.router)
api_router.include_router(self_learning.router)
api_router.include_router(company_simulator.router)
api_router.include_router(goal_based_engineering.router)
api_router.include_router(global_network.router)
api_router.include_router(universal_brain.router)
api_router.include_router(engineering_universe.router)
api_router.include_router(digital_twin.router)
api_router.include_router(engineering_government.router)












