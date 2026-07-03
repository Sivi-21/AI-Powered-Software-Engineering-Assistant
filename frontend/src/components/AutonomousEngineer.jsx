import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Terminal, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  XCircle, 
  Play, 
  FileText, 
  Clock, 
  ChevronRight, 
  History,
  AlertTriangle
} from 'lucide-react';
import { listSessions, executeGoal, getSession, deleteSession } from '../api';

export default function AutonomousEngineer() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [goalInput, setGoalInput] = useState("");
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState(null);
  const consoleEndRef = useRef(null);

  const fetchSessions = async () => {
    try {
      const data = await listSessions();
      setSessions(data);
    } catch (err) {
      console.error("Failed to load autonomous sessions:", err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Poll for changes when selected session is running
  useEffect(() => {
    if (!selectedSession || selectedSession.status !== "running") return;

    const interval = setInterval(async () => {
      try {
        const updated = await getSession(selectedSession.id);
        setSelectedSession(updated);
        // Also update sessions list
        setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
      } catch (err) {
        console.error("Failed to poll session details:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedSession?.id, selectedSession?.status]);

  // Auto-scroll logs terminal
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedSession?.logs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!goalInput.trim()) return;
    setExecuting(true);
    setError(null);
    try {
      const session = await executeGoal(goalInput);
      setSessions(prev => [session, ...prev]);
      setSelectedSession(session);
      setGoalInput("");
    } catch (err) {
      setError(err.message || "Failed to start autonomous execution.");
    } finally {
      setExecuting(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this session?")) return;
    try {
      await deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (selectedSession?.id === id) {
        setSelectedSession(null);
      }
    } catch (err) {
      alert("Failed to delete session: " + err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <span style={{ padding: '3px 8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: 'var(--success-color)', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>Completed</span>;
      case "running":
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: 'var(--accent-color)', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
            <Loader2 className="animate-spin" size={10} /> Running
          </span>
        );
      case "failed":
        return <span style={{ padding: '3px 8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger-color)', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>Failed</span>;
      default:
        return <span style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', borderRadius: '4px', fontSize: '11px' }}>Pending</span>;
    }
  };

  const renderConsoleLogs = () => {
    if (!selectedSession || !selectedSession.logs) return null;
    return (
      <div style={{
        background: '#040308',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        padding: '16px',
        fontFamily: 'Consolas, monospace',
        fontSize: '12px',
        color: '#a7f3d0',
        maxHeight: '300px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        lineHeight: '1.4'
      }}>
        <div style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
          <span>LIVE AGENT SESSION CONSOLE</span>
          <span>{selectedSession.logs.length} lines</span>
        </div>
        {selectedSession.logs.map((log, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '8px' }}>
            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
            <span style={{ color: log.level === 'ERROR' ? 'var(--danger-color)' : '#fff' }}>{log.message}</span>
          </div>
        ))}
        <div ref={consoleEndRef} />
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '30px', minHeight: '500px' }}>
      
      {/* Session Navigation Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Run goal card */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={18} style={{ color: 'var(--accent-color)' }} />
            <h4 style={{ margin: 0, color: '#fff', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Engineering Goal</h4>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="e.g., Integrate a JWT auth caching service..."
              disabled={executing}
              rows={4}
              style={{
                width: '100%',
                background: 'rgba(10, 9, 21, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px',
                color: '#fff',
                fontSize: '13px',
                resize: 'none',
                outline: 'none',
                lineHeight: '1.5'
              }}
            />
            {error && (
              <div style={{ color: 'var(--danger-color)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={14} />
                <span>{error}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={executing || !goalInput.trim()}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                fontSize: '13px'
              }}
            >
              {executing ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Spawning Agent...</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>Execute Goal</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sessions History List */}
        <div className="glass-card" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={16} style={{ color: 'var(--text-secondary)' }} />
            <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Agent Runs</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '350px' }}>
            {sessions.length === 0 ? (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No execution history.</span>
            ) : (
              sessions.map(s => {
                const isSelected = selectedSession?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSession(s)}
                    style={{
                      padding: '12px',
                      background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '12px',
                        color: isSelected ? '#fff' : 'var(--text-secondary)',
                        fontWeight: isSelected ? '600' : 'normal',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '160px'
                      }}>
                        {s.goal}
                      </span>
                      <button
                        onClick={(e) => handleDelete(s.id, e)}
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
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleDateString()}</span>
                      {s.status === 'running' ? (
                        <span style={{ fontSize: '10px', color: 'var(--accent-color)' }}>Running...</span>
                      ) : (
                        <span style={{ fontSize: '10px', color: s.status === 'completed' ? 'var(--success-color)' : 'var(--danger-color)' }}>{s.status}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Execution View Dashboard */}
      <div style={{ minWidth: 0 }}>
        {!selectedSession ? (
          <div className="glass-card" style={{
            textAlign: 'center',
            padding: '60px 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px'
          }}>
            <Terminal size={48} style={{ color: 'var(--accent-color)', marginBottom: '16px', opacity: 0.8 }} />
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600' }}>No Active Session</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: 0, fontSize: '13px', lineHeight: '1.6' }}>
              Select a running session from history or write down a new development target to deploy the autonomous software engineering agents.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Header info */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Autonomous engineering Goal</span>
                  <h3 style={{ margin: '6px 0 0 0', fontSize: '20px', color: '#fff' }}>{selectedSession.goal}</h3>
                </div>
                {getStatusBadge(selectedSession.status)}
              </div>
            </div>

            {/* Task Breakdown checklist */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#fff' }}>Engineering Tasks Queue</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedSession.tasks.map((task, idx) => (
                  <div key={task.id} style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ marginTop: '2px' }}>
                        {task.status === 'completed' ? (
                          <CheckCircle2 size={16} style={{ color: 'var(--success-color)' }} />
                        ) : task.status === 'running' ? (
                          <Loader2 className="animate-spin" size={16} style={{ color: 'var(--accent-color)' }} />
                        ) : task.status === 'failed' ? (
                          <XCircle size={16} style={{ color: 'var(--danger-color)' }} />
                        ) : (
                          <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--text-muted)' }} />
                        )}
                      </div>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{task.title}</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{task.description}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', color: 'var(--accent-color)', fontWeight: '600' }}>{task.assigned_agent}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{task.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Logs console */}
            {renderConsoleLogs()}

            {/* Final Report layout */}
            {selectedSession.final_report && (
              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <FileText size={18} style={{ color: 'var(--success-color)' }} />
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '15px' }}>Engineering Outcome Report</h4>
                </div>
                <div style={{
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {selectedSession.final_report}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
