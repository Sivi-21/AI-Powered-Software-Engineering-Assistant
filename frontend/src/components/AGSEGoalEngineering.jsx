import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Play, 
  CheckCircle2, 
  HelpCircle, 
  FileText, 
  Layers, 
  Database, 
  Globe, 
  Loader2 
} from 'lucide-react';
import { submitAGSEGoal, listAGSEGoals, getAGSEGoal } from '../api';

const STAGE_ICONS = {
  "Requirements": <FileText size={16} />,
  "Architecture": <Layers size={16} />,
  "Database": <Database size={16} />,
  "APIs": <Globe size={16} />,
  "Deployment": <Cpu size={16} />
};

export default function AGSEGoalEngineering() {
  const [goals, setGoals] = useState([]);
  const [activeGoal, setActiveGoal] = useState(null);
  const [newGoalInput, setNewGoalInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedStage, setSelectedStage] = useState("Requirements");
  const pollIntervalRef = useRef(null);

  const fetchGoals = async () => {
    try {
      const list = await listAGSEGoals();
      setGoals(list);
      if (list.length > 0 && !activeGoal) {
        loadGoal(list[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadGoal = async (id) => {
    try {
      const data = await getAGSEGoal(id);
      setActiveGoal(data);
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
        const data = await getAGSEGoal(id);
        setActiveGoal(data);
        if (data.status !== "running") {
          stopPolling();
          fetchGoals();
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
    fetchGoals();
    return () => stopPolling();
  }, []);

  const handleSubmitGoal = async (e) => {
    e.preventDefault();
    if (!newGoalInput.trim()) return;
    setLoading(true);
    try {
      const newGoal = await submitAGSEGoal(newGoalInput);
      setNewGoalInput("");
      setActiveGoal(newGoal);
      fetchGoals();
      startPolling(newGoal.id);
    } catch (err) {
      alert("Failed to submit goal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStageContent = () => {
    if (!activeGoal) return "";
    const stage = activeGoal.stages.find(s => s.stage_name === selectedStage);
    return stage ? stage.content : "";
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', height: 'calc(100vh - 120px)' }}>
      
      {/* Sidebar - Goal Histories */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
        <h4 style={{ color: '#fff', fontSize: '13px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AGSE Goal Sessions</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {goals.map(g => {
            const isActive = activeGoal?.id === g.id;
            return (
              <button
                key={g.id}
                onClick={() => loadGoal(g.id)}
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
                  {g.business_goal}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)' }}>
                  <span>{new Date(g.created_at).toLocaleDateString()}</span>
                  <span style={{ color: g.status === 'completed' ? 'var(--success-color)' : 'var(--accent-color)' }}>
                    {g.status}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Goal Blueprint Workspace */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Horizontal Pipeline Steps */}
        {activeGoal && (
          <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            {activeGoal.stages.map((stage, idx) => {
              const isActive = selectedStage === stage.stage_name;
              const isCompleted = stage.status === 'completed';
              const isRunning = stage.status === 'running';

              return (
                <React.Fragment key={stage.stage_name}>
                  <button
                    onClick={() => isCompleted && setSelectedStage(stage.stage_name)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'transparent',
                      border: 'none',
                      cursor: isCompleted ? 'pointer' : 'default',
                      opacity: isCompleted || isActive ? 1 : 0.3,
                      flex: 1
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isCompleted ? 'var(--success-color)' : isRunning ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                      border: isActive ? '2px solid #fff' : '2px solid transparent',
                      color: isCompleted || isRunning ? '#fff' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: isRunning ? 'pulse 2s infinite' : 'none'
                    }}>
                      {isCompleted ? <CheckCircle2 size={16} /> : STAGE_ICONS[stage.stage_name]}
                    </div>
                    <span style={{ fontSize: '11px', color: '#fff', fontWeight: isActive ? '700' : '400' }}>{stage.stage_name}</span>
                  </button>
                  {idx < activeGoal.stages.length - 1 && (
                    <div style={{ height: '2px', background: 'var(--border-color)', flex: 0.5 }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Content specification Panel */}
        <div className="glass-card" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {activeGoal ? (
            <>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Active Stage: {selectedStage}</span>
                  <h3 style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '16px' }}>{activeGoal.business_goal}</h3>
                </div>
                <span style={{
                  padding: '4px 10px',
                  background: activeGoal.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                  color: activeGoal.status === 'completed' ? 'var(--success-color)' : 'var(--accent-color)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}>{activeGoal.status}</span>
              </div>

              {/* Spec content markdown previewer */}
              <div style={{ flex: 1, overflowY: 'auto', background: '#090812', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                {getStageContent() ? (
                  <pre style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif', lineHeight: '1.6' }}>
                    {getStageContent()}
                  </pre>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    {activeGoal.status === 'running' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <Loader2 className="animate-spin" size={24} style={{ color: 'var(--accent-color)' }} />
                        <span>AGSE compiling specifications...</span>
                      </div>
                    ) : (
                      <span>Select a completed stage in the pipeline above to view details.</span>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
              <Cpu size={48} style={{ marginBottom: '16px', color: 'rgba(255,255,255,0.1)' }} />
              <p style={{ fontSize: '14px', margin: 0 }}>Input a goal below to trigger the AGSE Core development flow.</p>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="glass-card" style={{ padding: '16px' }}>
          <form onSubmit={handleSubmitGoal} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="e.g. I want an AI-based Hospital Management System..."
              value={newGoalInput}
              onChange={(e) => setNewGoalInput(e.target.value)}
              disabled={loading || activeGoal?.status === 'running'}
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
              disabled={loading || !newGoalInput.trim() || activeGoal?.status === 'running'}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px' }}
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <><Play size={14} /> <span>Submit Goal</span></>}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
