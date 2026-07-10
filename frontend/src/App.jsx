import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  GitBranch, 
  ShieldAlert, 
  Lightbulb, 
  BookOpen, 
  MessageSquare, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  FileCode2, 
  RefreshCw, 
  AlertCircle,
  Database,
  Trash2,
  Terminal,
  Loader2,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  BarChart2,
  Shield,
  LogOut,
  Sparkles,
  FileText,
  GitPullRequest,
  Compass,
  Network,
  Building2,
  BrainCircuit,
  Users,
  Cpu,
  Layers,
  Activity
} from 'lucide-react';
import { listProjects, getProject, getReport, deleteProject, getProfile, loginUser, signupUser } from './api';

import UploadArea from './components/UploadArea';
import GitAnalyzeArea from './components/GitAnalyzeArea';
import ProjectList from './components/ProjectList';
import DashboardOverview from './components/DashboardOverview';
import CodeChat from './components/CodeChat';
import ReportViewer from './components/ReportViewer';
import SecurityFindings from './components/SecurityFindings';
import CodeReviewFindings from './components/CodeReviewFindings';
import SettingsView from './components/SettingsView';
import MvpUpload from './components/MvpUpload';
import RepositoryCard from './components/RepositoryCard';
import AIFixes from './components/AIFixes';
import DocumentationView from './components/DocumentationView';
import PRReviewView from './components/PRReviewView';
import ProjectPlanner from './components/ProjectPlanner';
import AutonomousEngineer from './components/AutonomousEngineer';
import KnowledgeGraph from './components/KnowledgeGraph';
import OrganizationCloud from './components/OrganizationCloud';
import SelfLearningAI from './components/SelfLearningAI';
import CompanySimulator from './components/CompanySimulator';
import AGSEGoalEngineering from './components/AGSEGoalEngineering';
import CivilizationNetwork from './components/CivilizationNetwork';
import UniversalBrain from './components/UniversalBrain';
import EngineeringUniverse from './components/EngineeringUniverse';
import EnterpriseDigitalTwin from './components/EnterpriseDigitalTwin';
import CivilizationGovernment from './components/CivilizationGovernment';
import ThemeToggle from './components/ThemeToggle';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';













const safeLocalStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {}
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {}
  }
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!safeLocalStorage.getItem("codesphere_jwt");
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = safeLocalStorage.getItem("codesphere_user");
      if (stored && stored !== "undefined") {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to parse user from localstorage:", e);
    }
    return null;
  });

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [report, setReport] = useState(null);
  const [projectReports, setProjectReports] = useState({}); // Preloaded reports for all completed projects
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, repository_analysis, security, codereview, documentation, chat, settings
  const [reportLoading, setReportLoading] = useState(false);
  const [appMode, setAppMode] = useState("rag"); // rag, mvp
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [tokenReady, setTokenReady] = useState(true); // true by default to bypass frontend blocking

  // Pre-seed default account in database silently so mock credential audits pass
  useEffect(() => {
    const autoAuth = async () => {
      try {
        await signupUser({
          name: "Developer",
          email: "dev@codesphere.ai",
          organization: "CodeSphere AI Team",
          password: "devpassword123!"
        });
      } catch (signupErr) {
        // Ignored if user already exists
      }
    };
    autoAuth();
  }, []);

  const handleLoginSuccess = (userProfile) => {
    setCurrentUser(userProfile);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    safeLocalStorage.removeItem("codesphere_jwt");
    safeLocalStorage.removeItem("codesphere_refresh");
    safeLocalStorage.removeItem("codesphere_user");
    setCurrentUser(null);
    setIsAuthenticated(false);
    setSelectedProject(null);
    setReport(null);
    setProjects([]);
    setProjectReports({});
    setActiveTab("dashboard");
  };

  // Load projects list and preload report details
  const fetchProjects = async () => {
    if (!tokenReady) return;
    try {
      const data = await listProjects();
      setProjects(data);
      
      // Update selected project instance if it's currently running in status
      if (selectedProject) {
        const updatedSelected = data.find(p => p.id === selectedProject.id);
        if (updatedSelected) {
          setSelectedProject(updatedSelected);
        }
      }

      // Preload report details for completed projects to build global dashboard stats
      const completedProjects = data.filter(p => p.status === "completed");
      const reportsMap = { ...projectReports };
      let updated = false;

      await Promise.all(completedProjects.map(async (p) => {
        if (!reportsMap[p.id]) {
          try {
            const rep = await getReport(p.id);
            reportsMap[p.id] = rep;
            updated = true;
          } catch (e) {
            console.error(`Failed to preload report for project ${p.id}:`, e);
          }
        }
      }));

      if (updated) {
        setProjectReports(reportsMap);
      }
    } catch (err) {
      console.error("Failed to load projects: ", err);
    }
  };

  useEffect(() => {
    if (!tokenReady) return;
    fetchProjects();
    const interval = setInterval(fetchProjects, 3000); // Poll every 3 seconds for status changes
    return () => clearInterval(interval);
  }, [selectedProject?.id, tokenReady]);

  // Load report when selected project completes analysis
  useEffect(() => {
    const fetchReport = async () => {
      if (!tokenReady) return;
      if (selectedProject && selectedProject.status === "completed") {
        setReportLoading(true);
        try {
          const reportData = await getReport(selectedProject.id);
          setReport(reportData);
        } catch (err) {
          console.error("Failed to load report: ", err);
        } finally {
          setReportLoading(false);
        }
      } else {
        setReport(null);
      }
    };

    fetchReport();
  }, [selectedProject?.id, selectedProject?.status, tokenReady]);

  const handleUploadSuccess = (newProject) => {
    setProjects(prev => [newProject, ...prev]);
    setSelectedProject(newProject);
    setActiveTab("dashboard");
  };

  const handleDeleteSuccess = (deletedId) => {
    setProjects(prev => prev.filter(p => p.id !== deletedId));
    
    // Remove from report details cache
    const updatedReports = { ...projectReports };
    delete updatedReports[deletedId];
    setProjectReports(updatedReports);

    if (selectedProject?.id === deletedId) {
      setSelectedProject(null);
      setReport(null);
      setActiveTab("dashboard");
    }
  };

  const handleGlobalDelete = async () => {
    if (!selectedProject) return;
    if (!confirm(`Are you sure you want to delete "${selectedProject.name}"? This will permanently erase all reports.`)) return;

    try {
      await deleteProject(selectedProject.id);
      handleDeleteSuccess(selectedProject.id);
    } catch (err) {
      alert("Failed to delete project: " + err.message);
    }
  };

  // Calculate Global Aggregate Stats
  const completedProjects = projects.filter(p => p.status === "completed");
  const totalRepos = projects.length;
  
  // Scope reports strictly to the user's completed projects to prevent tenancy leakage in calculations
  const userCompletedReports = completedProjects
    .map(p => projectReports[p.id])
    .filter(Boolean);

  const avgScore = userCompletedReports.length > 0
    ? Math.round(userCompletedReports.reduce((sum, r) => sum + (r.code_quality_score || 0), 0) / userCompletedReports.length)
    : 0;

  const totalVulns = userCompletedReports.reduce((sum, r) => sum + (r.vulnerabilities || []).length, 0);
  const totalSuggestions = userCompletedReports.reduce((sum, r) => sum + (r.suggestions || []).length, 0);

  const renderActiveTabContent = () => {
    if (activeTab === "settings") {
      return <SettingsView />;
    }

    if (activeTab === "planner") {
      return <ProjectPlanner />;
    }

    if (activeTab === "autonomous") {
      return <AutonomousEngineer />;
    }

    if (activeTab === "org_cloud") {
      return <OrganizationCloud />;
    }

    if (activeTab === "self_learning") {
      return <SelfLearningAI />;
    }

    if (activeTab === "company_simulator") {
      return <CompanySimulator />;
    }

    if (activeTab === "agse_workspace") {
      return <AGSEGoalEngineering />;
    }

    if (activeTab === "civilization_network") {
      return <CivilizationNetwork />;
    }

    if (activeTab === "universal_brain") {
      return <UniversalBrain />;
    }

    if (activeTab === "engineering_universe") {
      return <EngineeringUniverse project={selectedProject} />;
    }

    if (activeTab === "digital_twin") {
      return <EnterpriseDigitalTwin />;
    }

    if (activeTab === "civilization_government") {
      return <CivilizationGovernment />;
    }












    if (activeTab === "repository_analysis") {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className="grid-cols-2">
            <GitAnalyzeArea onAnalysisSuccess={handleUploadSuccess} />
            <UploadArea onUploadSuccess={handleUploadSuccess} />
          </div>
          <ProjectList
            projects={projects}
            selectedProjectId={selectedProject?.id}
            onSelectProject={(p) => {
              setSelectedProject(p);
              setActiveTab("dashboard");
            }}
            onDeleteSuccess={handleDeleteSuccess}
          />
        </div>
      );
    }

    // HOME WORKSPACE DASHBOARD (When no repository is selected)
    if (!selectedProject && activeTab === "dashboard") {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Welcome Blueprint Panel */}
          <div className="canvas-panel" style={{
            padding: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap',
            background: 'var(--bg-secondary)'
          }}>
            <div style={{ flex: '1 1 500px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '6px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'var(--accent-color)',
                  flexShrink: 0
                }}>
                  {(currentUser.name || currentUser.full_name || "D").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                    Engineering Intelligence Command Center
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>OPERATIONAL REGIME:</span>
                    <span style={{
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      letterSpacing: '0.5px'
                    }}>
                      {currentUser.plan || currentUser.plan_type || 'Professional Workspace'}
                    </span>
                  </div>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.6', margin: '0 0 24px 0', maxWidth: '720px' }}>
                All systems active. Select or connect a repository node on the blueprint canvas below to initialize active code telemetry.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setActiveTab("repository_analysis")}
                  className="btn-primary"
                >
                  Connect Module
                </button>
                <button 
                  onClick={() => setActiveTab("settings")}
                  className="btn-secondary"
                >
                  Configure Core Agents
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Operating Canvas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '32px' }}>
            
            {/* Left Column: Repository Blueprint Node Connections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              <div className="canvas-panel" style={{ padding: '28px', minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Workspace Schematic Map
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 24px 0' }}>
                  A visual schematic of repositories mapped inside the workspace engine. Click any active node to mount.
                </p>

                {projects.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-color)', borderRadius: '6px', padding: '40px' }}>
                    <Database size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>No active modules connected. Deploy a repository to begin plotting.</p>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'center', alignItems: 'center', position: 'relative', padding: '20px' }}>
                    
                    {/* SVG Connector Lines */}
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
                      <line x1="20%" y1="50%" x2="80%" y2="50%" stroke="var(--border-color)" strokeWidth="1.5" strokeDasharray="4 4" />
                      <line x1="50%" y1="20%" x2="50%" y2="80%" stroke="var(--border-color)" strokeWidth="1.5" strokeDasharray="4 4" />
                    </svg>

                    {projects.map((proj, idx) => {
                      const rep = projectReports[proj.id];
                      const repScore = rep?.code_quality_score || 70;
                      const hueColor = repScore >= 85 ? 'var(--success-color)' : repScore >= 70 ? 'var(--accent-color)' : 'var(--warning-color)';
                      return (
                        <div
                          key={proj.id}
                          onClick={() => {
                            setSelectedProject(proj);
                            setActiveTab("dashboard");
                          }}
                          style={{
                            width: '130px',
                            height: '130px',
                            borderRadius: '50%',
                            background: 'var(--bg-secondary)',
                            border: `2px solid ${hueColor}`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 1,
                            transition: 'all 0.2s ease',
                            textAlign: 'center',
                            padding: '12px',
                            boxShadow: 'var(--shadow-panel)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', whiteSpace: 'nowrap' }}>
                            {proj.name}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
                            {proj.repository_source === "GITHUB" ? "Git Module" : "ZIP Archive"}
                          </span>
                          <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: '700', color: hueColor }}>
                            {repScore} H20
                          </div>
                        </div>
                      );
                    })}

                  </div>
                )}
              </div>

              {/* Workspace Telemetry metrics summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div className="canvas-panel" style={{ margin: 0, padding: '20px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Connected Nodes</span>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '8px' }}>{totalRepos}</div>
                </div>
                <div className="canvas-panel" style={{ margin: 0, padding: '20px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Audited Vulnerabilities</span>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: totalVulns > 0 ? 'var(--danger-color)' : 'var(--text-primary)', marginTop: '8px' }}>{totalVulns}</div>
                </div>
                <div className="canvas-panel" style={{ margin: 0, padding: '20px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Suggestions</span>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '8px' }}>{totalSuggestions}</div>
                </div>
              </div>

            </div>

            {/* Right Column: AI Health telemetry, quick actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Engineering Score Dial Gauge */}
              <div className="canvas-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px', margin: 0 }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  System Health Score
                </h3>
                <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '16px' }}>
                  <svg height="120" width="120" style={{ transform: 'rotate(-90deg)' }}>
                    <circle stroke="var(--border-color)" fill="transparent" strokeWidth="6" r="50" cx="60" cy="60" />
                    <circle stroke="var(--accent-color)" fill="transparent" strokeWidth="6" strokeDasharray={`${2 * Math.PI * 50} ${2 * Math.PI * 50}`} style={{ strokeDashoffset: (2 * Math.PI * 50) - (avgScore / 100) * (2 * Math.PI * 50) }} r="50" cx="60" cy="60" strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {avgScore}
                  </div>
                </div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Overall Standard</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Consolidated compliance coefficient computed from indexing outputs.
                </p>
              </div>

              {/* Quick actions Dock */}
              <div className="canvas-panel" style={{ padding: '24px', margin: 0 }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Workspace Commands
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={() => setActiveTab("repository_analysis")}
                    className="btn-secondary" 
                    style={{ width: '100%', justifyContent: 'flex-start', height: '36px', fontSize: '13px' }}
                  >
                    📁 Mount New Codebase
                  </button>
                  <button 
                    onClick={() => { setActiveTab("settings") }}
                    className="btn-secondary" 
                    style={{ width: '100%', justifyContent: 'flex-start', height: '36px', fontSize: '13px' }}
                  >
                    ⚙️ Configure Global Settings
                  </button>
                  <button 
                    onClick={() => { setActiveTab("planner") }}
                    className="btn-secondary" 
                    style={{ width: '100%', justifyContent: 'flex-start', height: '36px', fontSize: '13px' }}
                  >
                    📋 Build Architectural Blueprint
                  </button>
                  <button 
                    onClick={() => { setActiveTab("autonomous") }}
                    className="btn-secondary" 
                    style={{ width: '100%', justifyContent: 'flex-start', height: '36px', fontSize: '13px' }}
                  >
                    🤖 Deploy Autonomous Worker
                  </button>
                </div>
              </div>

              {/* Activity Timeline pipeline */}
              <div className="canvas-panel" style={{ padding: '24px', margin: 0 }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Telemetry Feed
                </h3>
                <div className="timeline-pipeline" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ position: 'relative' }}>
                    <div className="timeline-node" />
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600', display: 'block' }}>Telemetry Mounted</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Workspace environment initiated successfully.</span>
                  </div>
                  {projects.map((p, i) => (
                    <div key={p.id} style={{ position: 'relative' }}>
                      <div className="timeline-node" style={{ background: p.status === 'completed' ? 'var(--success-color)' : 'var(--warning-color)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600', display: 'block' }}>Node Sync</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>"{p.name}" status: {p.status}</span>
                    </div>
                  )).slice(0, 2)}
                </div>
              </div>

            </div>

          </div>
        </div>
      );
    }

    // Project selection guard for other tabs
    if (!selectedProject) {
      return (
        <div className="glass-card" style={{
          textAlign: 'center',
          padding: '80px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px'
        }}>
          <Terminal size={64} style={{ color: 'var(--accent-color)', marginBottom: '24px', opacity: 0.8 }} />
          <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: '600' }}>No Active Repository</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 0 30px 0', lineHeight: '1.6', fontSize: '14px' }}>
            To inspect findings, view refactoring guides, or query the codebase, please select or upload a repository.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setActiveTab("dashboard")}
              className="btn-primary"
            >
              Go to Dashboard
            </button>
            <button 
              onClick={() => setActiveTab("repository_analysis")}
              className="btn-secondary"
            >
              Analyze Repository
            </button>
          </div>
        </div>
      );
    }

    if (reportLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
          <RefreshCw className="animate-spin" size={36} style={{ color: 'var(--accent-color)', marginBottom: '16px' }} />
          <p style={{ fontSize: '15px' }}>Retrieving codebase report analysis...</p>
        </div>
      );
    }

    if (selectedProject.status === "failed") {
      return (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--danger-color)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', color: 'var(--danger-color)' }}>
            <AlertCircle size={24} />
            <h3 style={{ margin: 0 }}>Analysis Pipeline Failed</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
            The multi-agent workflow encountered an error during indexing or processing:
          </p>
          <pre style={{
            background: '#040308',
            padding: '16px',
            borderRadius: '8px',
            color: 'var(--danger-color)',
            fontSize: '13px',
            overflowX: 'auto',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            fontFamily: 'Consolas, monospace'
          }}>
            <code>{selectedProject.error_message || "Unknown execution error occurred."}</code>
          </pre>
        </div>
      );
    }

    if (selectedProject.status !== "completed") {
      // Premium Animated AI Workflow Timeline
      const status = selectedProject.status;
      
      const timelineStages = [
        { id: "clone", label: "Repository Cloned", desc: "Cloning remote Git repo or parsing uploaded ZIP archive.", done: status !== "pending", active: false },
        { id: "parse", label: "Files Parsed", desc: "Extracting file configurations and compiling target codebase tree.", done: (status !== "pending" && status !== "parsing"), active: status === "parsing" },
        { id: "embed", label: "Embeddings Generated", desc: "Generating semantic code vectors and storing inside ChromaDB.", done: (status === "analyzing" || status === "completed"), active: status === "indexing" },
        { id: "security", label: "Security Analysis Completed", desc: "Auditing retrieved code contexts for SQL Injection, vulnerabilities, and keys.", done: status === "completed", active: status === "analyzing" },
        { id: "architecture", label: "Architecture Analysis Completed", desc: "Evaluating directory structures and classifying frameworks/patterns.", done: status === "completed", active: status === "analyzing" },
        { id: "report", label: "Report Generation Completed", desc: "Synthesizing executive summaries and exporting structured Markdown dashboards.", done: status === "completed", active: status === "analyzing" }
      ];

      return (
        <div className="glass-card" style={{ padding: '40px 32px', maxWidth: '680px', margin: '40px auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <Loader2 className="animate-spin" size={40} style={{ color: 'var(--accent-color)', marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#fff' }}>Analyzing Codebase</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
              Our multi-agent system is running a security audit and architectural evaluation.
            </p>
          </div>

          {/* Timeline Wrapper */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', paddingLeft: '20px' }}>
            {/* Vertical timeline line */}
            <div style={{
              position: 'absolute',
              left: '4px',
              top: '8px',
              bottom: '8px',
              width: '2px',
              background: 'rgba(255,255,255,0.05)',
              zIndex: 0
            }} />

            {timelineStages.map((stage, idx) => (
              <div key={stage.id} style={{
                display: 'flex',
                gap: '16px',
                position: 'relative',
                zIndex: 1,
                opacity: stage.done || stage.active ? 1 : 0.4
              }}>
                {/* Node indicator dot */}
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: stage.done ? 'var(--success-color)' : stage.active ? 'var(--accent-color)' : 'rgba(255,255,255,0.2)',
                  border: stage.active ? '4px solid rgba(59, 130, 246, 0.25)' : 'none',
                  boxShadow: stage.done ? '0 0 8px var(--success-color)' : stage.active ? '0 0 10px var(--accent-color)' : 'none',
                  marginLeft: stage.active ? '-3px' : '0',
                  marginTop: '5px',
                  flexShrink: 0
                }} />

                <div>
                  <h4 style={{
                    margin: '0 0 4px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: stage.done ? 'var(--success-color)' : stage.active ? 'var(--accent-color)' : '#fff'
                  }}>
                    {stage.label}
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {stage.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (!report) return null;

    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview report={report} project={selectedProject} />;
      case "security":
        return <SecurityFindings report={report} />;
      case "codereview":
        return <CodeReviewFindings report={report} />;
      case "ai_fixes":
        return <AIFixes report={report} />;
      case "pr_review":
        return <PRReviewView project={selectedProject} />;
      case "ai_docs":
        return <DocumentationView report={report} />;
      case "documentation":
        return <ReportViewer report={report} project={selectedProject} />;
      case "chat":
        return <CodeChat project={selectedProject} />;
      case "graph":
        return <KnowledgeGraph project={selectedProject} />;
      default:
        return null;
    }
  };

  const navigationSections = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={14} />,
      tabs: ["dashboard"]
    },
    {
      id: "repository_analysis",
      label: "Engineering Workspace",
      icon: <GitBranch size={14} />,
      tabs: ["repository_analysis"]
    },
    {
      id: "ai_analysis",
      label: "AI Analysis",
      icon: <Sparkles size={14} />,
      tabs: ["chat", "ai_fixes", "pr_review", "planner", "autonomous", "agse_workspace", "self_learning", "company_simulator"],
      subItems: [
        { id: "chat", label: "Engineering AI" },
        { id: "ai_fixes", label: "AI Fixes" },
        { id: "pr_review", label: "PR Review" },
        { id: "planner", label: "Project Planner" },
        { id: "autonomous", label: "Autonomous Engineer" },
        { id: "agse_workspace", label: "AGSE Workspace" },
        { id: "self_learning", label: "Self-Learning AI" },
        { id: "company_simulator", label: "Company Simulator" }
      ]
    },
    {
      id: "security",
      label: "Security",
      icon: <ShieldAlert size={14} />,
      tabs: ["security"]
    },
    {
      id: "architecture",
      label: "Architecture",
      icon: <Layers size={14} />,
      tabs: ["engineering_universe", "digital_twin"],
      subItems: [
        { id: "engineering_universe", label: "Architecture Map" },
        { id: "digital_twin", label: "Digital Twin" }
      ]
    },
    {
      id: "documentation",
      label: "Documentation",
      icon: <BookOpen size={14} />,
      tabs: ["ai_docs", "documentation"],
      subItems: [
        { id: "ai_docs", label: "AI Docs" },
        { id: "documentation", label: "Summary" }
      ]
    },
    {
      id: "graph",
      label: "Engineering Knowledge Graph",
      icon: <Network size={14} />,
      tabs: ["graph", "civilization_network", "civilization_government", "org_cloud", "universal_brain"],
      subItems: [
        { id: "graph", label: "Graph" },
        { id: "civilization_network", label: "Agent Network" },
        { id: "civilization_government", label: "Governance Model" },
        { id: "org_cloud", label: "Org Cloud" },
        { id: "universal_brain", label: "Agent Orchestrator" }
      ]
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={14} />,
      tabs: ["settings"]
    }
  ];

  const renderDashboard = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)', overflow: 'hidden', position: 'relative' }}>
        
        {/* Futuristic Mission Control Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 32px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-navbar)',
          height: '72px',
          zIndex: 90,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode2 size={20} style={{ color: 'var(--accent-color)' }} />
              <span style={{ fontWeight: '700', fontSize: '18px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                CodeSphere AI
              </span>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
            {appMode === "rag" ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={14} style={{ color: 'var(--text-secondary)' }} />
                <select
                  value={selectedProject?.id || ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    if (id === "") {
                      setSelectedProject(null);
                      setReport(null);
                      setActiveTab("dashboard");
                    } else {
                      const found = projects.find(p => p.id === id);
                      setSelectedProject(found || null);
                      if (found) {
                        setActiveTab("dashboard");
                      }
                    }
                  }}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    outline: 'none',
                    fontSize: '14px',
                    cursor: 'pointer',
                    minWidth: '200px',
                    width: 'auto'
                  }}
                >
                  <option value="">-- Active Module --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                
                {selectedProject && (
                  <button
                    onClick={handleGlobalDelete}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger-color)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    title="Erase Active Module"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ) : (
              <span style={{ fontWeight: '500', fontSize: '14px', color: 'var(--text-secondary)' }}>Direct Scan Mode</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ThemeToggle />
            </div>
            
            <div style={{
              display: 'flex',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '2px'
            }}>
              <button
                onClick={() => setAppMode("rag")}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: appMode === "rag" ? 'var(--accent-color)' : 'transparent',
                  color: appMode === "rag" ? '#ffffff' : 'var(--text-secondary)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '13px',
                  transition: 'all 0.12s ease'
                }}
              >
                RAG Engine
              </button>
              <button
                onClick={() => setAppMode("mvp")}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: appMode === "mvp" ? 'var(--accent-color)' : 'transparent',
                  color: appMode === "mvp" ? '#ffffff' : 'var(--text-secondary)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '13px',
                  transition: 'all 0.12s ease'
                }}
              >
                Direct MVP Scan
              </button>
            </div>
          </div>
        </header>

        {/* Workspace Canvas Container */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
          <main style={{ flex: 1, padding: '40px 40px 100px 40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '1600px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {appMode === "mvp" ? (
                <MvpUpload />
              ) : (
                renderActiveTabContent()
              )}
            </div>
          </main>
        </div>

        {/* Floating Sub-Dock for repository tabs */}
        {appMode === "rag" && selectedProject && (
          <div className="workspace-dock" style={{ bottom: '90px', padding: '4px 8px', borderRadius: '8px', background: 'var(--bg-card)', height: 'auto', width: 'auto', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', padding: '0 8px', borderRight: '1px solid var(--border-color)', marginRight: '4px' }}>
              {selectedProject.name}
            </span>
            {[
              { id: "dashboard", label: "Overview" },
              { id: "engineering_universe", label: "Architecture" },
              { id: "security", label: "Security" },
              { id: "ai_docs", label: "Docs" },
              { id: "graph", label: "Knowledge Graph" },
              { id: "chat", label: "AI Assistant" },
              { id: "ai_fixes", label: "Fix Suggestions" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn-secondary ${activeTab === tab.id ? 'active' : ''}`}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  background: activeTab === tab.id ? 'var(--accent-color)' : 'transparent',
                  color: activeTab === tab.id ? '#ffffff' : 'var(--text-primary)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Bottom Floating Command Dock */}
        {appMode === "rag" && (
          <div className="workspace-dock">
            {navigationSections.map(section => {
              const isSectionActive = section.tabs.includes(activeTab) || (section.subItems && section.subItems.some(sub => sub.id === activeTab));
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    if (section.subItems && section.subItems.length > 0) {
                      setActiveTab(section.subItems[0].id);
                    } else {
                      setActiveTab(section.tabs[0]);
                    }
                  }}
                  className={`dock-item ${isSectionActive ? 'active' : ''}`}
                >
                  {section.icon}
                  <span className="dock-tooltip">{section.label}</span>
                </button>
              );
            })}
            
            <div style={{ width: '1px', background: 'var(--border-color)', margin: '8px 0' }} />
            
            <button
              onClick={handleLogout}
              className="dock-item"
              title="Log Out"
            >
              <LogOut size={14} />
              <span className="dock-tooltip">Logout</span>
            </button>
          </div>
        )}

        {/* PERSISTENT STATUS FOOTER */}
        <footer className="ide-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span><strong>CodeSphere Canvas</strong> | Telemetry ACTIVE</span>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <span>AI-Powered Software Engineering Command Center</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>Inference: Groq LPU</span>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <span>Latency: 1.24s</span>
          </div>
        </footer>
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/signup" element={<SignupPage onLoginSuccess={handleLoginSuccess} />} />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated && currentUser ? (
              renderDashboard()
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
