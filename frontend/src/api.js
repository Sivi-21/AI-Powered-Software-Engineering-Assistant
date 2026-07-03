const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

function getHeaders(extraHeaders = {}) {
  const token = localStorage.getItem("token");
  const headers = { ...extraHeaders };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to log in.");
  }

  const data = await response.json();
  localStorage.setItem("token", data.access_token);
  return data;
}

export async function signupUser({ name, email, organization, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name: name, email, organization, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to sign up.");
  }

  return response.json();
}

export async function getProfile() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");
  
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to get user profile.");
  }

  return response.json();
}

export async function uploadRepository(file, name = "") {
  const formData = new FormData();
  formData.append("file", file);
  if (name) {
    formData.append("name", name);
  }

  const response = await fetch(`${API_BASE_URL}/projects/upload`, {
    method: "POST",
    headers: getHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to upload repository ZIP.");
  }

  return response.json();
}

export async function listProjects() {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to retrieve projects list.");
  }
  return response.json();
}

export async function getProject(projectId) {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to retrieve project details.");
  }
  return response.json();
}

export async function getReport(projectId) {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/report`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to retrieve analysis report.");
  }
  return response.json();
}

export async function queryCodebase(projectId, query, history = []) {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/query`, {
    method: "POST",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ query, history }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to query codebase.");
  }

  return response.json();
}

export async function deleteProject(projectId) {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete project.");
  }

  return response.json();
}

export async function listPrReviews(projectId) {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/pr-reviews`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to retrieve PR reviews.");
  }
  return response.json();
}

export async function createPrReview(projectId, payload) {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/pr-reviews`, {
    method: "POST",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to trigger PR review.");
  }
  return response.json();
}

export async function analyzeGithub(repoUrl) {
  const response = await fetch(`${API_BASE_URL}/repositories/analyze-github`, {
    method: "POST",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ repo_url: repoUrl }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    let msg = "Failed to analyze GitHub repository.";
    if (errorData && errorData.detail) {
      if (Array.isArray(errorData.detail)) {
        msg = errorData.detail.map(d => d.msg).join(", ");
      } else {
        msg = errorData.detail;
      }
    }
    throw new Error(msg);
  }

  return response.json();
}

export async function analyzeGithubMvp(repoUrl) {
  const response = await fetch(`${API_BASE_URL}/projects/analyze-mvp-github`, {
    method: "POST",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ repo_url: repoUrl }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    let msg = "Failed to analyze GitHub repository.";
    if (errorData && errorData.detail) {
      if (Array.isArray(errorData.detail)) {
        msg = errorData.detail.map(d => d.msg).join(", ");
      } else {
        msg = errorData.detail;
      }
    }
    throw new Error(msg);
  }

  return response.json();
}

export async function getGithubAuthorizeUrl() {
  const response = await fetch(`${API_BASE_URL}/auth/github/authorize`);
  if (!response.ok) {
    throw new Error("Failed to get GitHub authorization link.");
  }
  return response.json();
}

export async function loginWithGithub(code) {
  const response = await fetch(`${API_BASE_URL}/auth/github/callback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to log in with GitHub.");
  }

  return response.json();
}

export async function listPlans() {
  const response = await fetch(`${API_BASE_URL}/planning/plans`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to retrieve project plans.");
  }
  return response.json();
}

export async function generatePlan(idea) {
  const response = await fetch(`${API_BASE_URL}/planning/generate`, {
    method: "POST",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ idea }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to generate project plan.");
  }
  return response.json();
}

export async function getPlan(planId) {
  const response = await fetch(`${API_BASE_URL}/planning/plans/${planId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to retrieve project plan details.");
  }
  return response.json();
}

export async function deletePlan(planId) {
  const response = await fetch(`${API_BASE_URL}/planning/plans/${planId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to delete project plan.");
  }
  return response.json();
}

export async function listSessions() {
  const response = await fetch(`${API_BASE_URL}/autonomous/sessions`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to retrieve sessions list.");
  }
  return response.json();
}

export async function executeGoal(goal, projectId = null) {
  const response = await fetch(`${API_BASE_URL}/autonomous/execute`, {
    method: "POST",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ goal, project_id: projectId }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to start autonomous execution.");
  }
  return response.json();
}

export async function getSession(sessionId) {
  const response = await fetch(`${API_BASE_URL}/autonomous/sessions/${sessionId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to retrieve session details.");
  }
  return response.json();
}

export async function deleteSession(sessionId) {
  const response = await fetch(`${API_BASE_URL}/autonomous/sessions/${sessionId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to delete session.");
  }
  return response.json();
}

export async function getProjectGraph(projectId) {
  const response = await fetch(`${API_BASE_URL}/graph/${projectId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to retrieve codebase knowledge graph.");
  }
  return response.json();
}

export async function deleteProjectGraph(projectId) {
  const response = await fetch(`${API_BASE_URL}/graph/${projectId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to clear knowledge graph mapping.");
  }
  return response.json();
}

export async function getCurrentOrganization() {
  const response = await fetch(`${API_BASE_URL}/organization/current`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to retrieve organization details.");
  }
  return response.json();
}

export async function createOrganization(name) {
  const response = await fetch(`${API_BASE_URL}/organization/create`, {
    method: "POST",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to create organization.");
  }
  return response.json();
}

export async function inviteMember(email, role) {
  const response = await fetch(`${API_BASE_URL}/organization/invite`, {
    method: "POST",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ email, role }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to process invitation.");
  }
  return response.json();
}

export async function submitFeedback(category, original_recommendation, user_corrections, score) {
  const response = await fetch(`${API_BASE_URL}/learning/feedback`, {
    method: "POST",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ category, original_recommendation, user_corrections, score }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to submit feedback.");
  }
  return response.json();
}

export async function listLearnedRules() {
  const response = await fetch(`${API_BASE_URL}/learning/rules`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to retrieve learned rules.");
  }
  return response.json();
}

export async function deleteLearnedRule(ruleId) {
  const response = await fetch(`${API_BASE_URL}/learning/rules/${ruleId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to delete learned rule.");
  }
  return response.json();
}

export async function startSimulation(objective) {
  const response = await fetch(`${API_BASE_URL}/simulator/start`, {
    method: "POST",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ objective }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to start simulation.");
  }
  return response.json();
}

export async function listSimulationSessions() {
  const response = await fetch(`${API_BASE_URL}/simulator/sessions`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to retrieve simulation history.");
  }
  return response.json();
}

export async function getSimulationSession(sessionId) {
  const response = await fetch(`${API_BASE_URL}/simulator/sessions/${sessionId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to retrieve simulation details.");
  }
  return response.json();
}

export async function submitAGSEGoal(business_goal) {
  const response = await fetch(`${API_BASE_URL}/agse/goals`, {
    method: "POST",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ business_goal }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to submit goal to AGSE.");
  }
  return response.json();
}

export async function listAGSEGoals() {
  const response = await fetch(`${API_BASE_URL}/agse/goals`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to retrieve AGSE goals.");
  }
  return response.json();
}

export async function getAGSEGoal(goalId) {
  const response = await fetch(`${API_BASE_URL}/agse/goals/${goalId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to retrieve AGSE details.");
  }
  return response.json();
}

export async function getCivilizationOverview() {
  const response = await fetch(`${API_BASE_URL}/civilization/overview`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to retrieve civilization network details.");
  }
  return response.json();
}

export async function sharePolicyCrossTenant(policyName, sourceOrg, targets) {
  const response = await fetch(`${API_BASE_URL}/civilization/share-policy`, {
    method: "POST",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ policy_name: policyName, source_org: sourceOrg, targets }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to share policy.");
  }
  return response.json();
}

export async function submitBrainQuery(query) {
  const response = await fetch(`${API_BASE_URL}/brain/decide`, {
    method: "POST",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ query }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to submit query to Universal Brain.");
  }
  return response.json();
}

export async function listBrainDecisions() {
  const response = await fetch(`${API_BASE_URL}/brain/decisions`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to retrieve brain decisions.");
  }
  return response.json();
}

export async function getEngineeringUniverse(orgId) {
  const response = await fetch(`${API_BASE_URL}/universe/${orgId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to retrieve engineering universe mapping.");
  }
  return response.json();
}

export async function clearEngineeringUniverse(orgId) {
  const response = await fetch(`${API_BASE_URL}/universe/${orgId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to clear universe compilation.");
  }
  return response.json();
}

export async function getDigitalTwinProfile(orgId) {
  const response = await fetch(`${API_BASE_URL}/twin/${orgId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to retrieve organization digital twin.");
  }
  return response.json();
}

export async function simulateTwinTraffic(orgId, loadFactor) {
  const response = await fetch(`${API_BASE_URL}/twin/${orgId}/simulate?load_factor=${loadFactor}`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to execute traffic simulation.");
  }
  return response.json();
}

export async function submitGovProposal(proposal) {
  const response = await fetch(`${API_BASE_URL}/government/propose`, {
    method: "POST",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ proposal }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to submit proposal to government.");
  }
  return response.json();
}

export async function listGovSessions() {
  const response = await fetch(`${API_BASE_URL}/government/sessions`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to retrieve government debate sessions.");
  }
  return response.json();
}













