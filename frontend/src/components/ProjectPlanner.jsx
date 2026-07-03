import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Trash2, 
  ListTodo, 
  Layers, 
  BookOpen, 
  Cpu, 
  Database, 
  Network, 
  FolderTree, 
  Clock, 
  AlertOctagon, 
  Users, 
  Compass,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { listPlans, generatePlan, deletePlan } from '../api';

export default function ProjectPlanner() {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [ideaInput, setIdeaInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("requirements");

  const fetchPlans = async () => {
    try {
      const data = await listPlans();
      setPlans(data);
    } catch (err) {
      console.error("Failed to load plans:", err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!ideaInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const newPlan = await generatePlan(ideaInput);
      setPlans(prev => [newPlan, ...prev]);
      setSelectedPlan(newPlan);
      setIdeaInput("");
    } catch (err) {
      setError(err.message || "Failed to generate project plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project plan?")) return;
    try {
      await deletePlan(id);
      setPlans(prev => prev.filter(p => p.id !== id));
      if (selectedPlan?.id === id) {
        setSelectedPlan(null);
      }
    } catch (err) {
      alert("Failed to delete plan: " + err.message);
    }
  };

  const renderPlanContent = () => {
    if (!selectedPlan) {
      return (
        <div className="glass-card" style={{
          textAlign: 'center',
          padding: '60px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px'
        }}>
          <Compass size={48} style={{ color: 'var(--accent-color)', marginBottom: '16px', opacity: 0.8 }} />
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600' }}>No Plan Selected</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: 0, fontSize: '13px', lineHeight: '1.6' }}>
            Select an existing plan from the sidebar, or type in a new product idea to kick off automated requirements gathering and project scheduling.
          </p>
        </div>
      );
    }

    const subTabs = [
      { id: "requirements", label: "Requirements", icon: <BookOpen size={14} /> },
      { id: "stories", label: "Stories & Epics", icon: <Layers size={14} /> },
      { id: "backlog", label: "Sprint Backlog", icon: <ListTodo size={14} /> },
      { id: "stack", label: "Tech Stack", icon: <Cpu size={14} /> },
      { id: "database", label: "Database", icon: <Database size={14} /> },
      { id: "apis", label: "API Design", icon: <Network size={14} /> },
      { id: "folder", label: "Structure", icon: <FolderTree size={14} /> },
      { id: "timeline", label: "Timeline", icon: <Clock size={14} /> },
      { id: "risks", label: "Risks & Team", icon: <Users size={14} /> }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header Summary Panel */}
        <div className="glass-card" style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.9) 100%)',
          borderLeft: '4px solid var(--accent-color)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#fff' }}>
            Plan: {selectedPlan.idea.length > 60 ? selectedPlan.idea.substring(0, 60) + "..." : selectedPlan.idea}
          </h3>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Complexity Rating</span>
              <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--warning-color)' }}>{selectedPlan.estimated_complexity}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Created At</span>
              <span style={{ fontSize: '13px', color: '#fff' }}>{new Date(selectedPlan.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div style={{
          display: 'flex',
          gap: '6px',
          borderBottom: '1px solid var(--border-color)',
          overflowX: 'auto',
          paddingBottom: '2px'
        }}>
          {subTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                border: 'none',
                background: activeSubTab === tab.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                color: activeSubTab === tab.id ? '#fff' : 'var(--text-secondary)',
                borderBottom: activeSubTab === tab.id ? '2px solid var(--accent-color)' : '2px solid transparent',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sub-tab Content Area */}
        <div className="glass-card" style={{ padding: '24px' }}>
          {activeSubTab === "requirements" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '12px' }}>Functional Requirements</h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '20px', margin: 0 }}>
                  {selectedPlan.functional_requirements.map((req, idx) => (
                    <li key={idx} style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>{req}</li>
                  ))}
                </ul>
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '12px' }}>Non-Functional Requirements</h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '20px', margin: 0 }}>
                  {selectedPlan.non_functional_requirements.map((req, idx) => (
                    <li key={idx} style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeSubTab === "stories" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '12px' }}>Epics</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  {selectedPlan.epics.map((epic, idx) => (
                    <div key={idx} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <h5 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#fff' }}>{epic.title}</h5>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{epic.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '12px' }}>User Stories</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {selectedPlan.user_stories.map((story, idx) => (
                    <div key={idx} style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <h5 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#fff' }}>{story.title}</h5>
                      <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{story.description}</p>
                      {story.acceptance_criteria && story.acceptance_criteria.length > 0 && (
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-color)' }}>Acceptance Criteria:</span>
                          <ul style={{ paddingLeft: '16px', margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                            {story.acceptance_criteria.map((ac, acIdx) => (
                              <li key={acIdx}>{ac}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "backlog" && (
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '16px' }}>Sprint Backlog Tasks</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                {selectedPlan.sprint_backlog.map((task, idx) => (
                  <div key={idx} style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <div>
                      <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#fff' }}>{task.title}</h5>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{task.description}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <span style={{
                        padding: '3px 8px',
                        background: 'rgba(59,130,246,0.1)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        color: 'var(--accent-color)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>{task.story_points} SP</span>
                      <span style={{
                        padding: '3px 8px',
                        background: task.priority === 'High' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                        border: task.priority === 'High' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(245,158,11,0.2)',
                        color: task.priority === 'High' ? 'var(--danger-color)' : 'var(--warning-color)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>{task.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === "stack" && (
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '16px' }}>Recommended Tech Stack</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {[
                  { label: "Frontend", items: selectedPlan.technology_stack.frontend },
                  { label: "Backend", items: selectedPlan.technology_stack.backend },
                  { label: "Database", items: selectedPlan.technology_stack.database },
                  { label: "DevOps & Cloud", items: selectedPlan.technology_stack.devops }
                ].map((col, idx) => (
                  <div key={idx} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--accent-color)', textTransform: 'uppercase' }}>{col.label}</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {col.items.map((item, itemIdx) => (
                        <span key={itemIdx} style={{ fontSize: '13px', color: '#fff' }}>• {item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === "database" && (
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '16px' }}>Database Design Suggestions</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {selectedPlan.database_design.tables.map((table, idx) => (
                  <div key={idx} style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Table / Collection: {table.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{table.description}</span>
                    </div>
                    {/* Fields Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '8px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                          <th style={{ padding: '6px', color: 'var(--text-secondary)' }}>Field / Property</th>
                          <th style={{ padding: '6px', color: 'var(--text-secondary)' }}>Data Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table.fields.map((field, fIdx) => {
                          const [key, value] = Object.entries(field)[0] || ["-", "-"];
                          return (
                            <tr key={fIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '6px', color: '#fff', fontFamily: 'monospace' }}>{key}</td>
                              <td style={{ padding: '6px', color: 'var(--text-muted)' }}>{value}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {table.relationships && table.relationships.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-color)' }}>Relationships:</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                          {table.relationships.map((rel, relIdx) => (
                            <span key={relIdx} style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>• {rel}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {selectedPlan.database_design.notes && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <strong>Architecture Notes:</strong> {selectedPlan.database_design.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === "apis" && (
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '16px' }}>REST API Specifications</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedPlan.api_list.map((api, idx) => (
                  <div key={idx} style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{
                        padding: '3px 8px',
                        background: api.method === 'GET' ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)',
                        border: api.method === 'GET' ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(59,130,246,0.2)',
                        color: api.method === 'GET' ? 'var(--success-color)' : 'var(--accent-color)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>{api.method}</span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff', fontFamily: 'monospace' }}>{api.endpoint}</span>
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{api.description}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '11px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Request Model:</span>
                        <pre style={{ margin: '4px 0 0 0', background: '#040308', padding: '6px', borderRadius: '4px', color: 'var(--accent-color)', fontFamily: 'monospace' }}>{api.request_model || "None"}</pre>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Response Model:</span>
                        <pre style={{ margin: '4px 0 0 0', background: '#040308', padding: '6px', borderRadius: '4px', color: 'var(--success-color)', fontFamily: 'monospace' }}>{api.response_model || "dict"}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === "folder" && (
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '16px' }}>Proposed Folder Layout</h4>
              <pre style={{
                background: '#040308',
                padding: '20px',
                borderRadius: '8px',
                color: 'var(--success-color)',
                fontSize: '13px',
                overflowX: 'auto',
                border: '1px solid var(--border-color)',
                fontFamily: 'Consolas, monospace',
                lineHeight: '1.5',
                margin: 0
              }}>
                <code>{selectedPlan.folder_structure}</code>
              </pre>
            </div>
          )}

          {activeSubTab === "timeline" && (
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '16px' }}>Project Development Roadmap</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '20px' }}>
                <div style={{ position: 'absolute', left: '4px', top: '8px', bottom: '8px', width: '2px', background: 'rgba(255,255,255,0.05)' }} />
                {selectedPlan.development_timeline.map((phase, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: 'var(--accent-color)',
                      boxShadow: '0 0 8px var(--accent-color)',
                      marginTop: '5px',
                      flexShrink: 0
                    }} />
                    <div>
                      <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#fff' }}>
                        {phase.phase} <span style={{ fontSize: '11px', color: 'var(--warning-color)', marginLeft: '8px' }}>({phase.duration})</span>
                      </h5>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{phase.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === "risks" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '12px' }}>Risk Assessment</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  {selectedPlan.risk_analysis.map((risk, idx) => (
                    <div key={idx} style={{
                      padding: '16px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>{risk.risk}</span>
                        <span style={{
                          padding: '2px 6px',
                          background: risk.impact === 'High' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                          border: risk.impact === 'High' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(245,158,11,0.2)',
                          color: risk.impact === 'High' ? 'var(--danger-color)' : 'var(--warning-color)',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '700'
                        }}>Impact: {risk.impact}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <strong>Mitigation Strategy:</strong> {risk.mitigation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '12px' }}>Team Recommendation</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  {selectedPlan.team_recommendation.map((team, idx) => (
                    <div key={idx} style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{team.role}</span>
                        <span style={{ fontSize: '11px', color: 'var(--accent-color)' }}>Count: {team.count}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {team.responsibilities.map((resp, rIdx) => (
                          <span key={rIdx} style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>• {resp}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '30px', minHeight: '500px' }}>
      
      {/* Plan History Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Planner input form */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={18} style={{ color: 'var(--accent-color)' }} />
            <h4 style={{ margin: 0, color: '#fff', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>New Project Idea</h4>
          </div>
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea
              value={ideaInput}
              onChange={(e) => setIdeaInput(e.target.value)}
              placeholder="e.g., I want to build an Online Banking System..."
              disabled={loading}
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
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !ideaInput.trim()}
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
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Planning...</span>
                </>
              ) : (
                <>
                  <span>Create Plan</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing plans list */}
        <div className="glass-card" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plans History</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '350px' }}>
            {plans.length === 0 ? (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No plans generated yet.</span>
            ) : (
              plans.map(p => {
                const isSelected = selectedPlan?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPlan(p);
                      setActiveSubTab("requirements");
                    }}
                    style={{
                      padding: '12px',
                      background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{
                      fontSize: '12px',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      fontWeight: isSelected ? '600' : 'normal',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {p.idea.length > 24 ? p.idea.substring(0, 24) + "..." : p.idea}
                    </span>
                    <button
                      onClick={(e) => handleDeletePlan(p.id, e)}
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
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Plan Visualizer panel */}
      <div style={{ minWidth: 0 }}>
        {renderPlanContent()}
      </div>

    </div>
  );
}
