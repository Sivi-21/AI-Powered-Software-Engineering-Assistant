import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  BrainCircuit, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Cpu, 
  Users, 
  AlertCircle
} from 'lucide-react';
import { submitGovProposal, listGovSessions } from '../api';

export default function CivilizationGovernment() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [proposalInput, setProposalInput] = useState("");
  const [loading, setLoading] = useState(false);

  const loadSessions = async () => {
    try {
      const data = await listGovSessions();
      setSessions(data);
      if (data.length > 0 && !activeSession) {
        setActiveSession(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handlePropose = async (e) => {
    e.preventDefault();
    if (!proposalInput.trim()) return;
    setLoading(true);
    try {
      const result = await submitGovProposal(proposalInput);
      setSessions(prev => [result, ...prev]);
      setActiveSession(result);
      setProposalInput("");
    } catch (err) {
      alert("Proposal debate failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getOfficerColor = (role) => {
    switch (role) {
      case "CEO": return "#3b82f6"; // blue
      case "CTO": return "#10b981"; // emerald
      case "Chief Architect": return "#8b5cf6"; // violet
      case "CSO": return "#ef4444"; // red
      case "Chief DevOps": return "#f59e0b"; // amber
      default: return "#94a3b8"; // slate
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', height: 'calc(100vh - 120px)' }}>
      
      {/* Sidebar - Proposal History */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
        <h4 style={{ color: '#fff', fontSize: '13px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Review Sessions</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sessions.map(s => {
            const isActive = activeSession?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSession(s)}
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
                  {s.proposal}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)' }}>
                  <span>Ballot: {s.yes_votes}Y - {s.no_votes}N</span>
                  <span style={{ color: s.verdict === 'approved' ? 'var(--success-color)' : 'var(--warning-color)' }}>
                    {s.verdict}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Input Proposal Console */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <form onSubmit={handlePropose} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="Submit proposal to the Engineering Leadership Council (e.g. Migrate core database tables to PostgreSQL)..."
              value={proposalInput}
              onChange={(e) => setProposalInput(e.target.value)}
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
              disabled={loading || !proposalInput.trim()}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px' }}
            >
              {loading ? <span>Debating...</span> : <><BrainCircuit size={14} /> <span>Submit Proposal</span></>}
            </button>
          </form>
        </div>

        {/* Boardroom Session Viewer */}
        <div className="glass-card" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          {activeSession ? (
            <>
              {/* Header Details */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Engineering Leadership Council</span>
                  <h3 style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '16px' }}>{activeSession.proposal}</h3>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Council Verdict</span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: activeSession.verdict === 'approved' ? 'var(--success-color)' : 'var(--danger-color)', textTransform: 'capitalize' }}>
                      {activeSession.verdict}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Votes Cast (Yes/No)</span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                      {activeSession.yes_votes} / {activeSession.no_votes}
                    </span>
                  </div>
                </div>
              </div>

              {/* Debate Transcript */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Debate Transcript</span>
                {activeSession.debate_statements.map((stmt, idx) => (
                  <div key={idx} style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${getOfficerColor(stmt.role)}`,
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: getOfficerColor(stmt.role) }}>{stmt.role}</span>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: stmt.vote === 'yes' ? 'var(--success-color)' : 'var(--danger-color)'
                      }}>
                        {stmt.vote === 'yes' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        <span style={{ textTransform: 'uppercase', fontWeight: '700' }}>Vote: {stmt.vote}</span>
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      "{stmt.opinion}"
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
              <Cpu size={48} style={{ marginBottom: '16px', color: 'rgba(255,255,255,0.1)' }} />
              <p style={{ fontSize: '14px', margin: 0 }}>Select a council session proposal from the history list to inspect board debate details.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
