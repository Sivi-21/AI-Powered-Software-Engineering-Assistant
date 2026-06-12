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
  LogOut
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

export default function App() {
  // Auth is bypassed — always treat the session as authenticated with a default local user
  const DEFAULT_USER = { name: "Developer", email: "dev@intellios.ai", organization: "AI-Powered Software Engineering Assistant Team", plan: "Developer Plan" };
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem("intellios_user");
    return stored ? JSON.parse(stored) : DEFAULT_USER;
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

  // Auto-login a default dev account in the background (does not block local scans/rendering)
  useEffect(() => {
    const autoAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) return;
      
      try {
        // Attempt login first
        const loginRes = await loginUser("dev@intellios.ai", "devpassword123!");
        localStorage.setItem("token", loginRes.access_token);
      } catch (loginErr) {
        try {
          // If login fails, try to signup first, then login
          await signupUser({
            name: "Developer",
            email: "dev@intellios.ai",
            organization: "AI-Powered Software Engineering Assistant Team",
            password: "devpassword123!"
          });
          const loginRes = await loginUser("dev@intellios.ai", "devpassword123!");
          localStorage.setItem("token", loginRes.access_token);
        } catch (signupErr) {
          console.error("Auto authentication failed in background:", signupErr);
        }
      }
    };
    
    setCurrentUser(DEFAULT_USER);
    autoAuth();
  }, []);

  const handleLoginSuccess = (userProfile) => {
    setCurrentUser(userProfile);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("intellios_jwt");
    localStorage.removeItem("intellios_user");
    setCurrentUser(DEFAULT_USER);
    setIsAuthenticated(true); // Stay authenticated — no login screen
    setSelectedProject(null);
    setReport(null);
    setProjects([]);
    setProjectReports({});
    setActiveTab("dashboard");
    // Re-acquire a fresh dev token after clearing credentials
    window.location.reload();
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Welcome SaaS Jumbotron */}
          <div className="glass-card" style={{
            padding: '32px',
            background: 'linear-gradient(135deg, rgba(30,41,59,0.85) 0%, rgba(15,23,42,0.95) 100%)',
            borderLeft: '4px solid var(--accent-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: '1 1 500px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {currentUser.avatar_url ? (
                  <img 
                    src={currentUser.avatar_url} 
                    alt={currentUser.name || currentUser.full_name || "User"} 
                    style={{ 
                      width: '64px', 
                      height: '64px', 
                      borderRadius: '50%', 
                      border: '2px solid var(--accent-color)',
                      boxShadow: '0 0 16px rgba(59, 130, 246, 0.25)',
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '2px solid var(--accent-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: '700',
                    color: 'var(--accent-color)',
                    boxShadow: '0 0 16px rgba(59, 130, 246, 0.15)',
                    flexShrink: 0
                  }}>
                    {(currentUser.name || currentUser.full_name || "D").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 style={{ margin: '0 0 6px 0', fontSize: '26px', fontWeight: '700', color: '#fff' }}>
                    Welcome back, {currentUser.name || currentUser.full_name || 'Developer'}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Subscription Plan:</span>
                    <span style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      color: '#60A5FA',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      boxShadow: '0 0 10px rgba(59, 130, 246, 0.05)'
                    }}>
                      {currentUser.plan || currentUser.plan_type || 'Developer Plan'}
                    </span>
                  </div>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px 0', maxWidth: '680px' }}>
                Execute static quality scans, audit security boundaries, and generate comprehensive architecture reports for your code repositories.
              </p>
              <button 
                onClick={() => setActiveTab("repository_analysis")}
                className="btn-primary"
                style={{ fontSize: '13px' }}
              >
                Analyze New Repository
              </button>
            </div>
          </div>

          {/* Global Statistics Cards */}
          <div className="grid-cols-4">
            {/* Repos count */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Total Repositories</span>
              <span style={{ fontSize: '32px', fontWeight: '800', color: '#fff', margin: '8px 0' }}>{totalRepos}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Registered in workspace</span>
            </div>

            {/* Avg Score */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Avg Health Score</span>
              <span style={{ 
                fontSize: '32px', 
                fontWeight: '800', 
                color: avgScore >= 85 ? 'var(--success-color)' : avgScore >= 70 ? 'var(--accent-color)' : avgScore >= 50 ? 'var(--warning-color)' : 'var(--danger-color)',
                margin: '8px 0' 
              }}>{avgScore}<span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/100</span></span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Workspace average standard</span>
            </div>

            {/* Total Vulnerabilities */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Vulnerabilities</span>
              <span style={{ fontSize: '32px', fontWeight: '800', color: totalVulns > 0 ? 'var(--danger-color)' : 'var(--success-color)', margin: '8px 0' }}>{totalVulns}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Security audit alerts</span>
            </div>

            {/* Suggestions count */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Suggestions</span>
              <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--warning-color)', margin: '8px 0' }}>{totalSuggestions}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Recommended actions</span>
            </div>
          </div>

          {/* Repositories Cards Grid */}
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Recent Analyses
            </h3>
            {projects.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
                <Terminal size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No codebases uploaded. Go to Repository Analysis to add your first repository.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {projects.map(p => (
                  <RepositoryCard
                    key={p.id}
                    project={p}
                    report={projectReports[p.id]}
                    onSelect={() => {
                      setSelectedProject(p);
                      setActiveTab("dashboard");
                    }}
                    onDelete={handleDeleteSuccess}
                  />
                ))}
              </div>
            )}
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
      case "documentation":
        return <ReportViewer report={report} project={selectedProject} />;
      case "chat":
        return <CodeChat project={selectedProject} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      
      {/* LEFT NAVIGATION SIDEBAR */}
      {appMode === "rag" && (
        <aside style={{
          width: isSidebarCollapsed ? '70px' : '260px',
          borderRight: '1px solid var(--border-color)',
          background: 'rgba(11, 15, 25, 0.6)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0,
          zIndex: 100
        }}>
          {/* Logo Brand area */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '24px 20px',
            borderBottom: '1px solid var(--border-color)',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}>
            <FileCode2 size={26} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
            {!isSidebarCollapsed && (
              <span style={{ fontWeight: '700', fontSize: '15px', color: '#fff', letterSpacing: '-0.3px' }}>
                AI-Powered Software Engineering Assistant
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <div style={{ flex: 1, padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
              { id: "repository_analysis", label: "Repository Analysis", icon: <GitBranch size={18} /> },
              { id: "security", label: "Security Findings", icon: <ShieldAlert size={18} /> },
              { id: "codereview", label: "Code Review", icon: <Lightbulb size={18} /> },
              { id: "documentation", label: "Documentation", icon: <BookOpen size={18} /> },
              { id: "chat", label: "AI Assistant", icon: <MessageSquare size={18} /> },
              { id: "settings", label: "Settings", icon: <Settings size={18} /> }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              if (isSidebarCollapsed) {
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`sidebar-collapsed-link ${isActive ? 'active' : ''}`}
                    title={tab.label}
                  >
                    {tab.icon}
                  </button>
                );
              }
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  {tab.icon}
                  <span style={{ fontSize: '13px' }}>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Profile Info Card */}
          <div style={{ padding: '10px', borderTop: '1px solid var(--border-color)' }}>
            {!isSidebarCollapsed ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                gap: '10px', 
                padding: '10px 12px', 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div style={{ 
                    width: '28px', 
                    height: '28px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, var(--accent-color) 0%, #818cf8 100%)', 
                    color: '#fff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '11px', 
                    fontWeight: '700', 
                    flexShrink: 0 
                  }}>
                    {currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "SR"}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {currentUser.name || "SIVAGAMI R"}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--success-color)', fontWeight: '600', textTransform: 'uppercase' }}>
                      {currentUser.plan || "Enterprise Plan"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger-color)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  title="Log Out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                <div style={{ 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, var(--accent-color) 0%, #818cf8 100%)', 
                  color: '#fff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '10px', 
                  fontWeight: '700', 
                  margin: '0 auto' 
                }}>
                  {currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "SR"}
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger-color)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  title="Log Out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Collapse Toggle Footer */}
          <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                borderRadius: '6px',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-color)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </aside>
      )}

      {/* RIGHT SIDE VIEW CONTAINER */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        
        {/* GLOBAL HEADER BAR */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 40px',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 90
        }}>
          {/* Left: Project Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {appMode === "rag" ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={16} style={{ color: 'var(--accent-color)' }} />
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
                    background: 'rgba(10, 9, 21, 0.6)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    outline: 'none',
                    fontSize: '13px',
                    cursor: 'pointer',
                    minWidth: '220px'
                  }}
                >
                  <option value="">-- Workspace Dashboard --</option>
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
                      padding: '8px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger-color)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    title="Delete Repository"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCode2 size={24} style={{ color: 'var(--accent-color)' }} />
                <span style={{ fontWeight: '700', fontSize: '16px' }}>Direct MVP Codebase Analyzer</span>
              </div>
            )}
          </div>
          
          {/* Right: Mode Switcher & Status badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {appMode === "rag" && selectedProject && selectedProject.status === "completed" && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                color: 'var(--success-color)',
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: '20px',
                fontWeight: '600',
                boxShadow: '0 0 10px rgba(34, 197, 94, 0.05)'
              }}>
                RAG Connected
              </div>
            )}

            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '4px'
            }}>
              <button
                onClick={() => setAppMode("rag")}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: appMode === "rag" ? 'var(--accent-color)' : 'transparent',
                  color: appMode === "rag" ? '#fff' : 'var(--text-secondary)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
              >
                RAG Mode
              </button>
              <button
                onClick={() => setAppMode("mvp")}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: appMode === "mvp" ? 'var(--accent-color)' : 'transparent',
                  color: appMode === "mvp" ? '#fff' : 'var(--text-secondary)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
              >
                Direct MVP Scan
              </button>
            </div>
          </div>
        </header>

        {/* MAIN DISPLAY BODY CONTENT FLEX */}
        <main style={{ flex: 1, padding: '30px 40px', minWidth: 0, overflowY: 'auto' }}>
          {appMode === "mvp" ? (
            <MvpUpload />
          ) : (
            renderActiveTabContent()
          )}
        </main>
      </div>

    </div>
  );
}
