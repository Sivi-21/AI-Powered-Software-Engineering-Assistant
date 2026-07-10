# CodeSphere AI - Enterprise Repository Intelligence Platform

CodeSphere AI is an intelligent software engineering platform designed to help developers and software teams analyze repositories, review code quality, detect vulnerabilities, map architectural digital twins, and gain actionable insights using AI-driven workflows at the speed of Groq LPU inference.

---

## 🚀 Key Modules & Features

* 📂 **Repository Analysis**
  * Process repository codebases uploaded as ZIP files (up to 50MB).
  * Clone and analyze public GitHub repositories directly using repository URLs.

* 🤖 **AI-Powered Code Reviews**
  * Generate detailed automated code review reports detailing code quality and syntax tree mappings.
  * Identify code smells, duplicate code, and potential design improvements.

* 🔒 **Security Vulnerability Detection**
  * Audit code for common security issues (SQL injection, XSS, exposed tokens, etc.).
  * Classify vulnerabilities by severity (High, Medium, Low) with actionable remediation.

* 🏗️ **Architecture & Dependency Mappings**
  * Identify project structure, libraries, frameworks, and modules.
  * Build interactive engineering universe maps.

* 💬 **RAG Codebase Architect Q&A**
  * Chat with your repository using semantic vector indexing (ChromaDB).
  * Retrieve context-aware answers from your source code.

* ⚡ **Multi-Agent Workflow**
  * Coordinates multiple AI agents for architecture analysis, code auditing, security assessment, and report generation using LangGraph.

* 🌐 **Integration & Identity**
  * Secure JWT-based local authentication.
  * Optional Google Sign-in (OAuth 2.0) with graceful fallback if unconfigured.

---

## 🛠️ Technology Stack

* **Frontend**: React.js, Tailwind CSS, Lucide React, Axios, `@react-oauth/google`
* **Backend**: FastAPI (Python), LangGraph, LangChain, Uvicorn
* **Database & Indexing**: MongoDB Atlas (Persistent Store), ChromaDB (Vector Store)
* **LLM Engine**: Google Gemini API, Groq LPU API, OpenRouter, GitHub Models

---

## ⚙️ Environment Variables Configuration

Create appropriate environment configuration files before starting the services.

### Frontend (`frontend/.env`)
```env
# API Endpoint URL (pointing to FastAPI backend)
VITE_API_URL=http://localhost:8000/api/v1

# Google OAuth Client ID (Optional; if left blank, Google login is disabled gracefully)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

### Backend (`backend/.env`)
```env
PROJECT_NAME="AI-Powered Software Engineering Assistant"
API_V1_STR="/api/v1"

# Allowed CORS Origins (Comma-separated list)
# e.g., http://localhost:3000,http://localhost:5173,https://your-vercel-domain.vercel.app
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# MongoDB Atlas URI (Required)
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
MONGO_DB_NAME=intellios_db

# JWT Configuration (Required)
# CRITICAL: Replace this secret key with a strong secure key in production
JWT_SECRET=supersecretkey_change_me_in_prod
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Google OAuth Configuration (Optional; Google Login will be disabled if omitted)
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# GitHub Integration (Optional)
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_REDIRECT_URI=http://localhost:5173/oauth/callback

# Gemini API Configuration (Required for agents)
GEMINI_API_KEY=your_gemini_api_key_here

# Groq API Configuration (Optional)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

---

## 📦 Local Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd AI-Powered-Software-Engineering-Assistant
```

### 2. Backend Setup
```bash
cd backend
# Create virtual environment and install packages
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt

# Run the dev server
python -m uvicorn app.main:app --reload
```
The API documentation will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
The UI application will be available at [http://localhost:5173](http://localhost:5173).

---

## 🛡️ Production Deployment Checklist

Before pushing CodeSphere AI to production:

1. **Secrets Security**:
   - Ensure `JWT_SECRET` is changed to a high-entropy cryptographically random string.
   - Do NOT commit `.env` files. Inject them securely via your hosting provider environment panels (Vercel, render, AWS, etc.).

2. **CORS allowed origins**:
   - Update `ALLOWED_ORIGINS` in your backend deployment env settings to include only your actual frontend domain: `ALLOWED_ORIGINS=https://your-production-app.vercel.app`.

3. **Database Setup**:
   - Verify that your MongoDB connection points to a clustered MongoDB Atlas instance with restricted IP whitelisting.

4. **Google OAuth Graceful Fallback**:
   - Google Login runs dynamically based on `VITE_GOOGLE_CLIENT_ID` configuration.
   - If Google OAuth configuration is missing, the application will disable the Google button gracefully on the UI, and the backend endpoint will return a clean `400 Bad Request` instead of crashing.

5. **Static Assets & Build Size Optimization**:
   - Production Vite builds should be packaged with:
     ```bash
     npm run build
     ```
     This triggers build tree-shaking and output minification.

---

## 🤝 License

This project is licensed under the MIT License.
