import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Layers, 
  Cpu, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { submitBrainQuery, listBrainDecisions } from '../api';

export default function UniversalBrain() {
  const [decisions, setDecisions] = useState([]);
  const [activeDecision, setActiveDecision] = useState(null);
  const [queryInput, setQueryInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("timeline");

  const loadDecisions = async () => {
    try {
      const data = await listBrainDecisions();
      setDecisions(data);
      if (data.length > 0 && !activeDecision) {
        setActiveDecision(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDecisions();
  }, []);

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    setLoading(true);
    try {
      const result = await submitBrainQuery(queryInput);
      setDecisions(prev => [result, ...prev]);
      setActiveDecision(result);
      setQueryInput("");
    } catch (err) {
      alert("Orchestration query failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', height: 'calc(100vh - 120px)' }}>
      
      {/* Sidebar - Decisions History */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
        <h4 style={{ color: '#fff', fontSize: '13px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Agent Activity</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {decisions.map(d => {
            const isActive = activeDecision?.id === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setActiveDecision(d)}
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
                  {d.query}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)' }}>
                  <span>Confidence: {d.confidence_score}%</span>
                  <span style={{ color: d.validation_verdict === 'approved' ? 'var(--success-color)' : 'var(--warning-color)' }}>
                    {d.validation_verdict}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Input Console */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <form onSubmit={handleQuery} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="Query the Agent Orchestrator (e.g. Evaluate migration risk to FastAPI async models)..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              disabled={loading}
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
              disabled={loading || !queryInput.trim()}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px' }}
            >
              {loading ? <span>Reasoning...</span> : <><BrainCircuit size={14} /> <span>Query Orchestrator</span></>}
            </button>
          </form>
        </div>

        {/* Detailed Decision Blueprint */}
        <div className="glass-card" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          {activeDecision ? (
            <>
              {/* Header metrics */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Central Orchestration System</span>
                  <h3 style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '16px' }}>{activeDecision.query}</h3>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Confidence Index</span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: activeDecision.confidence_score > 80 ? 'var(--success-color)' : 'var(--warning-color)' }}>
                      {activeDecision.confidence_score}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Validation Verdict</span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: activeDecision.validation_verdict === 'approved' ? 'var(--success-color)' : 'var(--danger-color)', textTransform: 'capitalize' }}>
                      {activeDecision.validation_verdict}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-navigation tabs */}
              <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                {[
                  { id: "timeline", label: "Task Decomposition", icon: <Layers size={14} /> },
                  { id: "risks", label: "Risk Assessment", icon: <AlertTriangle size={14} /> },
                  { id: "tradeoffs", label: "Trade-off Analysis", icon: <TrendingUp size={14} /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: activeTab === tab.id ? '700' : '400'
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Display Panel */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {activeTab === 'timeline' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
                    {activeDecision.tasks_decomposition.map(task => (
                      <div key={task.step_number} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'rgba(59,130,246,0.1)',
                          border: '1px solid rgba(59,130,246,0.3)',
                          color: 'var(--accent-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '800',
                          flexShrink: 0
                        }}>
                          {task.step_number}
                        </div>
                        <div>
                          <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#fff' }}>{task.task_name}</h5>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{task.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'risks' && (
                  <div style={{ background: '#090812', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', minHeight: '140px' }}>
                    <pre style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif', lineHeight: '1.6' }}>
                      {activeDecision.risk_assessment}
                    </pre>
                  </div>
                )}

                {activeTab === 'tradeoffs' && (
                  <div style={{ background: '#090812', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', minHeight: '140px' }}>
                    <pre style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif', lineHeight: '1.6' }}>
                      {activeDecision.trade_off_analysis}
                    </pre>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
              <Cpu size={48} style={{ marginBottom: '16px', color: 'rgba(255,255,255,0.1)' }} />
              <p style={{ fontSize: '14px', margin: 0 }}>Select a decision query trace to inspect logical blueprints.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
