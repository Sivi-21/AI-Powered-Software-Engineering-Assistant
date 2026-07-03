import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Trash2, 
  Sparkles, 
  BarChart3, 
  Lightbulb, 
  Plus, 
  Star, 
  ShieldCheck, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { listLearnedRules, submitFeedback, deleteLearnedRule } from '../api';

export default function SelfLearningAI() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form Inputs
  const [category, setCategory] = useState("Code Quality");
  const [originalRec, setOriginalRec] = useState("");
  const [corrections, setCorrections] = useState("");
  const [score, setScore] = useState(5);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listLearnedRules();
      setRules(data);
    } catch (err) {
      setError(err.message || "Failed to load self-learning rules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!corrections.trim()) return;
    setSubmitLoading(true);
    try {
      const newRule = await submitFeedback(category, originalRec || "User-defined custom rule.", corrections, score);
      setRules(prev => [newRule, ...prev]);
      setOriginalRec("");
      setCorrections("");
      setScore(5);
    } catch (err) {
      alert("Failed to submit feedback: " + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteRule = async (id) => {
    if (!confirm("Are you sure you want to delete this learned rule?")) return;
    try {
      await deleteLearnedRule(id);
      setRules(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert("Failed to delete rule: " + err.message);
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case "Security":
        return "#ef4444"; // red
      case "Architecture":
        return "#3b82f6"; // blue
      case "Testing":
        return "#10b981"; // emerald
      case "Database":
        return "#f59e0b"; // amber
      default:
        return "#818cf8"; // indigo
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px' }}>
      
      {/* Learned Rules Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <BrainCircuit size={20} style={{ color: 'var(--accent-color)' }} />
            <h3 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>Active Coding Principles & Guidelines</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>
            The AI self-evolves by extracting code standards from user reviews, feedback loops, and correction logs. These guidelines are injected into future analysis loops.
          </p>

          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <span>Loading guidelines...</span>
            </div>
          ) : rules.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
              <Lightbulb size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>No rules learned yet. Submit feedback below to train the AI.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {rules.map(rule => (
                <div key={rule.id} style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '2px 8px',
                        background: `${getCategoryColor(rule.category)}20`,
                        border: `1px solid ${getCategoryColor(rule.category)}40`,
                        color: getCategoryColor(rule.category),
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>{rule.category}</span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{rule.rule_summary}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{rule.guideline}</p>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <span>Confidence: {rule.confidence_score}%</span>
                      <span>•</span>
                      <span>Learned: {new Date(rule.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
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
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger-color)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Train AI Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <Sparkles size={16} style={{ color: 'var(--accent-color)' }} />
            <h4 style={{ margin: 0, color: '#fff', fontSize: '14px' }}>Submit Feedback Loop</h4>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitLoading}
                style={{
                  width: '100%',
                  background: 'rgba(10, 9, 21, 0.6)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="Code Quality">Code Quality</option>
                <option value="Security">Security</option>
                <option value="Architecture">Architecture</option>
                <option value="Testing">Testing</option>
                <option value="Database">Database</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Original Recommendation (Optional)</span>
              <textarea
                value={originalRec}
                onChange={(e) => setOriginalRec(e.target.value)}
                placeholder="e.g. AI recommended using standard lists..."
                disabled={submitLoading}
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(10, 9, 21, 0.6)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '12px',
                  resize: 'none',
                  outline: 'none',
                  lineHeight: '1.4'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>User Correction / Preference Rules</span>
              <textarea
                value={corrections}
                onChange={(e) => setCorrections(e.target.value)}
                placeholder="e.g. Always use async Motor clients instead..."
                required
                disabled={submitLoading}
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(10, 9, 21, 0.6)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '12px',
                  resize: 'none',
                  outline: 'none',
                  lineHeight: '1.4'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Accuracy Rating</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setScore(num)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: num <= score ? 'var(--warning-color)' : 'var(--text-muted)',
                      padding: '4px'
                    }}
                  >
                    <Star size={18} fill={num <= score ? 'var(--warning-color)' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={submitLoading || !corrections.trim()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}>
              {submitLoading ? <span>Processing...</span> : <><span>Train Model</span><Plus size={12} /></>}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
