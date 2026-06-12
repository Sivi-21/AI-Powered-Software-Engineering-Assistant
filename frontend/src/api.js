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

export async function queryCodebase(projectId, query) {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/query`, {
    method: "POST",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ query }),
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

