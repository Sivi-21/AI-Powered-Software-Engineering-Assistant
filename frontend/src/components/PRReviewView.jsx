import React, { useState, useEffect } from 'react';
import { GitPullRequest, Loader2, Play, AlertTriangle, CheckCircle, HelpCircle, FileText, ChevronRight, MessageSquare } from 'lucide-react';
import { listPrReviews, createPrReview } from '../api';

export default function PRReviewView({ project }) {
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [prNumber, setPrNumber] = useState(1);
  const [prTitle, setPrTitle] = useState("Implement JWT Session Auth and Login Endpoint");
  const [srcBranch, setSrcBranch] = useState("feature/jwt-auth");
  const [targetBranch, setTargetBranch] = useState("main");

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await listPrReviews(project.id);
      setReviews(data);
      if (data.length > 0) {
        setSelectedReview(data[0]);
      } else {
        setSelectedReview(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [project.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        pr_number: parseInt(prNumber),
        title: prTitle,
        source_branch: srcBranch,
        target_branch: targetBranch
      };
      const newReview = await createPrReview(project.id, payload);
      setReviews(prev => [newReview, ...prev]);
      setSelectedReview(newReview);
    } catch (err) {
      alert("Failed to analyze pull request: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getMergeRecBadge = (rec) => {
    if (rec === "APPROVE") return { label: "Approve Merge", color: "var(--success-color)", bg: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" };
    if (rec === "REQUEST_CHANGES") return { label: "Request Changes", color: "var(--warning-color)", bg: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" };
    return { label: "Reject Merge", color: "var(--danger-color)", bg: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" };
  };

  const getRiskBadge = (risk) => {
    if (risk === "LOW") return { label: "Low Risk", color: "var(--success-color)" };
    if (risk === "MEDIUM") return { label: "Medium Risk", color: "var(--warning-color)" };
    return { label: "High Risk", color: "var(--danger-color)" };
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', height: '100%', minHeight: '620px' }}>
      
      {/* Left Sidebar - Form and History */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Analyze Form */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitPullRequest size={16} style={{ color: 'var(--accent-color)' }} />
            <span>Analyze Pull Request</span>
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>PR Number</label>
              <input type="number" value={prNumber} onChange={(e) => setPrNumber(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Title</label>
              <input type="text" value={prTitle} onChange={(e) => setPrTitle(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '13px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Source Branch</label>
                <input type="text" value={srcBranch} onChange={(e) => setSrcBranch(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '12px' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Target Branch</label>
                <input type="text" value={targetBranch} onChange={(e) => setTargetBranch(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '12px' }} />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              <span>{submitting ? "Analyzing..." : "Run Review"}</span>
            </button>
          </form>
        </div>

        {/* PR History List */}
        <div className="glass-card" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PR Review History</h4>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 className="animate-spin" size={20} style={{ color: 'var(--accent-color)' }} /></div>
          ) : reviews.length === 0 ? (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No PRs analyzed yet.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxH: '300px' }}>
              {reviews.map(rev => {
                const isSel = selectedReview?.id === rev.id;
                const rec = getMergeRecBadge(rev.merge_recommendation);
                return (
                  <div
                    key={rev.id}
                    onClick={() => setSelectedReview(rev)}
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      border: `1px solid ${isSel ? 'var(--accent-color)' : 'var(--border-color)'}`,
                      background: isSel ? 'rgba(59,130,246,0.03)' : 'rgba(255,255,255,0.01)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>PR #{rev.pr_number}</span>
                      <span style={{ color: rec.color }}>{rev.overall_pr_score}/100</span>
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '4px 0' }}>{rev.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{rev.source_branch} &rarr; {rev.target_branch}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Right Details Pane */}
      <div style={{ minWidth: 0 }}>
        {selectedReview ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* PR Assessment Header Card */}
            <div className="glass-card" style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '24px 32px' }}>
              
              {/* Score Circular gauge */}
              <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
                <svg height="90" width="90" style={{ transform: 'rotate(-90deg)' }}>
                  <circle stroke="rgba(255,255,255,0.02)" fill="transparent" strokeWidth="6" r="38" cx="45" cy="45" />
                  <circle stroke="var(--accent-color)" fill="transparent" strokeWidth="6" strokeDasharray={`${2 * Math.PI * 38}`} style={{ strokeDashoffset: (2 * Math.PI * 38) * (1 - selectedReview.overall_pr_score / 100) }} r="38" cx="45" cy="45" strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '20px', fontWeight: '800', color: '#fff' }}>
                  {selectedReview.overall_pr_score}
                </div>
              </div>

              <div>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700', color: '#fff' }}>PR #{selectedReview.pr_number}: {selectedReview.title}</h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {selectedReview.source_branch} &rarr; {selectedReview.target_branch}
                  </span>
                  <span style={{
                    background: getMergeRecBadge(selectedReview.merge_recommendation).bg,
                    border: getMergeRecBadge(selectedReview.merge_recommendation).border,
                    color: getMergeRecBadge(selectedReview.merge_recommendation).color,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {getMergeRecBadge(selectedReview.merge_recommendation).label}
                  </span>
                  <span style={{
                    color: getRiskBadge(selectedReview.risk_assessment).color,
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {getRiskBadge(selectedReview.risk_assessment).label}
                  </span>
                </div>
              </div>

            </div>

            {/* Summary & Improvements */}
            <div className="grid-cols-2">
              <div className="glass-card" style={{ padding: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600', color: 'var(--accent-color)' }}>AI Review Summary</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{selectedReview.summary}</p>
              </div>
              <div className="glass-card" style={{ padding: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600', color: 'var(--warning-color)' }}>Key Action Items</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedReview.improvements.map((imp, idx) => (
                    <li key={idx}>{imp}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Inline Review comments */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Inline PR Code Review Comments
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {selectedReview.comments.map((comm, idx) => (
                  <div key={idx} className="glass-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-color)', fontSize: '12px' }}>
                      <span style={{ fontFamily: 'Consolas, monospace', color: 'var(--text-secondary)' }}>{comm.file_path} : line {comm.line_number}</span>
                      <span style={{
                        color: comm.severity === 'High' ? 'var(--danger-color)' : comm.severity === 'Medium' ? 'var(--warning-color)' : 'var(--success-color)',
                        fontWeight: '600'
                      }}>
                        {comm.severity} Priority
                      </span>
                    </div>

                    {/* Diff chunk preview */}
                    {comm.diff_hunk && (
                      <pre style={{
                        margin: 0,
                        padding: '12px 16px',
                        background: '#040308',
                        fontSize: '12px',
                        fontFamily: 'Consolas, monospace',
                        color: 'var(--text-secondary)',
                        overflowX: 'auto',
                        borderBottom: '1px solid var(--border-color)'
                      }}>
                        <code>{comm.diff_hunk}</code>
                      </pre>
                    )}

                    {/* Comment bubble */}
                    <div style={{ display: 'flex', gap: '10px', padding: '12px 16px', background: 'rgba(59,130,246,0.02)' }}>
                      <MessageSquare size={16} style={{ color: 'var(--accent-color)', flexShrink: 0, marginTop: '2px' }} />
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>{comm.comment}</p>
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 40px', textAlign: 'center' }}>
            <GitPullRequest size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#fff' }}>No Active PR Analysis</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px' }}>
              Select a pull request from the review history list or input parameters to trigger a new repository change audit.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
