# AI-Powered Software Engineering Assistant

An intelligent platform designed to help developers and software teams analyze repositories, review code quality, detect vulnerabilities, and gain actionable insights using AI-driven workflows.

## 🚀 Features

* 📂 **Repository Analysis**

  * Analyze projects uploaded as ZIP files.
  * Analyze public GitHub repositories directly using repository URLs.

* 🤖 **AI-Powered Code Reviews**

  * Generate automated code review reports.
  * Identify potential improvements and best practices.

* 🔒 **Security Vulnerability Detection**

  * Detect common security issues within the codebase.
  * Categorize vulnerabilities based on severity levels.

* 🏗️ **Architecture Analysis**

  * Identify project structure, frameworks, and technologies used.
  * Provide high-level architecture insights.

* 📊 **Interactive Dashboard**

  * Monitor analyzed repositories.
  * View project health and generated reports in a centralized interface.

* 💬 **RAG-Based Developer Assistant**

  * Ask questions about your codebase.
  * Retrieve context-aware answers from repository data.

* ⚡ **Multi-Agent Workflow**

  * Coordinate multiple AI agents for architecture analysis, code auditing, security assessment, and report generation.

* 🌐 **GitHub Integration**

  * Analyze repositories directly from GitHub.
  * Track repository insights without manual uploads.

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Axios
* Tailwind CSS
* Lucide React

### Backend

* FastAPI
* Python
* LangGraph
* LangChain

### Databases & Storage

* MongoDB
* ChromaDB

### AI Models

* Groq
* Google Gemini
* OpenRouter (Optional)
* GitHub Models (Optional)

---

## 📌 Project Workflow

1. User uploads a ZIP file or provides a GitHub repository URL.
2. The backend extracts and processes the repository contents.
3. AI agents analyze:

   * Project architecture
   * Code quality
   * Security vulnerabilities
   * Improvement opportunities
4. Reports are generated and stored.
5. Results are displayed on the dashboard.
6. Users can interact with the codebase through the RAG-powered assistant.

---

## ⚙️ Installation

### Clone the Repository

```bash
git clone <repository-url>
cd AI-Powered-Software-Engineering-Assistant
```

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Backend will run at:

```text
http://127.0.0.1:8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend will run at:

```text
http://localhost:3000
```

---

## 🔑 Environment Variables

Create a `.env` file in the backend directory and configure the required variables:

```env
# Groq Configuration
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key

# MongoDB
MONGODB_URL=your_mongodb_connection_string

# ChromaDB
CHROMA_PERSIST_DIR=./chromadb_data

# Upload Directory
UPLOAD_DIR=./uploads
```

---

## 🎯 Use Cases

* Repository health assessment
* Automated code reviews
* Security auditing
* Architecture understanding
* Developer productivity enhancement
* Engineering team insights

---

## 📷 Key Modules

* Authentication & User Management
* Repository Management
* AI Analysis Engine
* Security Scanner
* Report Generation
* RAG Query Assistant
* Dashboard & Analytics

---

## 🔮 Future Enhancements

* Team collaboration features
* CI/CD integration
* Pull Request reviews
* Email and Slack notifications
* Historical trend analysis
* SaaS deployment with subscription plans

---

## 🤝 Contributing

Contributions, feature requests, and suggestions are welcome. Feel free to open issues or submit pull requests to improve the platform.

---

## 📄 License

This project is licensed under the MIT License.

---

### Built to empower developers with intelligent software engineering insights through AI.
