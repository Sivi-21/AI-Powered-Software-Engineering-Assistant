from pydantic import BaseModel, Field
from typing import List, Dict, Any

class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # project, file, api, database, dependency, vulnerability, debt
    metadata: Dict[str, Any] = Field(default_factory=dict)

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship: str  # uses, contains, triggers, references, depends_on, has_issue

class KnowledgeGraphResponse(BaseModel):
    project_id: str
    nodes: List[GraphNode] = Field(default_factory=list)
    edges: List[GraphEdge] = Field(default_factory=list)
    summary: str | None = None
