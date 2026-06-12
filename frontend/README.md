# AI-Powered Software Engineering Assistant - React Dashboard

This folder contains the modern React dashboard client built on Vite and vanilla CSS modules.

## Technology Stack
- **React**: Core library.
- **Vite**: Rapid compiler and development server.
- **Lucide React**: Clean SVG icons.
- **Vanilla CSS**: Premium dark-theme layout with responsive grids and glassmorphism.

---

## Getting Started

### 1. Requirements
- Node.js (v18 or higher) installed on your host machine.

### 2. Local Installation
Navigate into this folder and install dependencies:
```bash
npm install
```

### 3. Start Development Server
Run the local dev server:
```bash
npm run dev
```

By default, the application will boot on:
- **Local URL**: [http://localhost:3000](http://localhost:3000)

---

## Configuration & API Connection

The dashboard is configured to query the FastAPI backend directly on:
- `http://localhost:8000/api/v1`

If you deploy the backend on a different domain or port, update the `API_BASE_URL` constant inside [src/api.js](file:///c:/Users/ELCOT/Desktop/AI-Powered%20Software%20Engineering%20Assistant/frontend/src/api.js).
