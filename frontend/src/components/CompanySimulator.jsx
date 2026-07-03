import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Send, 
  Bot, 
  User, 
  CheckCircle, 
  Play, 
  MessageSquare, 
  Users, 
  FileText,
  Loader2
} from 'lucide-react';
import { startSimulation, listSimulationSessions, getSimulationSession } from '../api';

const DEPARTMENTS = [
  { id: "CEO", name: "CEO", role: "Chief Executive", color: "#3b82f6" },
  { id: "CTO", name: "CTO", role: "Chief Technology", color: "#ef4444" },
  { id: "Product Manager", name: "PM", role: "Product Manager", color: "#10b981" },
  { id: "Solution Architect", name: "Architect", role: "Architect", color: "#f59e0b" },
  { id: "Database Team", name: "DB", role: "Database Lead", color: "#8b5cf6" },
  { id: "Security Team", name: "Security", role: "Security Auditor", color: "#ec4899" },
  { id: "DevOps Team", name: "DevOps", role: "DevOps/Infra", color: "#14b8a6" },
  { id: "QA Team", name: "QA", role: "QA Lead", color: "#84cc16" },
  { id: "Customer Support", name: "Support", role: "Customer Support", color: "#6366f1" }
];

export default function CompanySimulator() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [objective, setObjective] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const fetchSessions = async () => {
    try {
      const list = await listSimulationSessions();
      setSessions(list);
      if (list.length > 0 && !activeSession) {
        loadSession(list[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSession = async (id) => {
    try {
      const data = await getSimulationSession(id);
      setActiveSession(data);
      if (data.messages && data.messages.length > 0) {
        setActiveSpeaker(data.messages[data.messages.length - 1].department);
      }
      
      // If session is running, start polling
      if (data.status === "running") {
        startPolling(id);
      } else {
        stopPolling();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startPolling = (id) => {
    stopPolling();
    pollIntervalRef.current = setInterval(async () => {
      try {
        const data = await getSimulationSession(id);
        setActiveSession(data);
        if (data.messages && data.messages.length > 0) {
          setActiveSpeaker(data.messages[data.messages.length - 1].department);
        }
        if (data.status !== "running") {
          stopPolling();
          fetchSessions();
        }
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    fetchSessions();
    return () => stopPolling();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages?.length]);

  const handleStartSimulation = async (e) => {
    e.preventDefault();
    if (!objective.trim()) return;
    setLoading(true);
    try {
      const newSession = await startSimulation(objective);
      setObjective("");
      setActiveSession(newSession);
      setActiveSpeaker("CEO");
      fetchSessions();
      startPolling(newSession.id);
    } catch (err) {
      alert("Failed to start simulation: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDeptColor = (deptName) => {
    const dept = DEPARTMENTS.find(d => d.id === deptName);
    return dept ? dept.color : "#94a3b8";
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', height: 'calc(100vh - 120px)' }}>
      
      {/* Sidebar - Simulator Sessions History */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
        <h4 style={{ color: '#fff', fontSize: '13px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Simulation Runs</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sessions.map(s => {
            const isActive = activeSession?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  background: isActive ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.01)',
                  border: isActive ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: '#fff',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {s.objective}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)' }}>
                  <span>{new Date(s.created_at).toLocaleDateString()}</span>
                  <span style={{ color: s.status === 'completed' ? 'var(--success-color)' : 'var(--accent-color)' }}>
                    {s.status}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulator Workspace */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Avatars Header Row */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {DEPARTMENTS.map(dept => {
            const isSpeaking = activeSpeaker === dept.id;
            return (
              <div key={dept.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: isSpeaking ? 1 : 0.4, transform: isSpeaking ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.3s' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: `${dept.color}20`,
                  border: `2px solid ${isSpeaking ? dept.color : 'rgba(255,255,255,0.1)'}`,
                  color: dept.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '800'
                }}>
                  {dept.name}
                </div>
                <span style={{ fontSize: '9px', color: '#fff', fontWeight: isSpeaking ? '700' : '400' }}>{dept.role}</span>
              </div>
            );
          })}
        </div>

        {/* Chat Feed */}
        <div className="glass-card" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          {activeSession ? (
            <>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Simulation Objective</span>
                <h3 style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '16px' }}>{activeSession.objective}</h3>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                {activeSession.messages.map((msg, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `${getDeptColor(msg.department)}20`,
                      color: getDeptColor(msg.department),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: '800',
                      flexShrink: 0
                    }}>
                      {msg.department.substring(0, 3).toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#fff', fontWeight: '700' }}>{msg.role}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={{
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0 8px 8px 8px',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.5',
                        maxWidth: '800px',
                        wordBreak: 'break-word'
                      }}>
                        {msg.message}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
              <Building2 size={48} style={{ marginBottom: '16px', color: 'rgba(255,255,255,0.1)' }} />
              <p style={{ fontSize: '14px', margin: 0 }}>Start a new simulation to watch virtual departments collaborate.</p>
            </div>
          )}
        </div>

        {/* Input objective form */}
        <div className="glass-card" style={{ padding: '16px' }}>
          <form onSubmit={handleStartSimulation} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="Enter business/technical objective (e.g. Launch high-throughput analytics engine with Kafka)..."
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              disabled={loading || activeSession?.status === 'running'}
              style={{
                flex: 1,
                background: 'rgba(10, 9, 21, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loading || !objective.trim() || activeSession?.status === 'running'}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px' }}
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <><Play size={14} /> <span>Simulate</span></>}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
