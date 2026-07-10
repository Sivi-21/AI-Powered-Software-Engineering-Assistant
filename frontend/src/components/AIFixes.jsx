import React, { useState } from 'react';
import { Sparkles, Copy, Download, Check } from 'lucide-react';

export default function AIFixes({ report }) {
  const fixes = report?.ai_fixes || [];
  const [copiedIdx, setCopiedIdx] = useState(null);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleDownloadPatch = (file, before, after, idx) => {
    // Generate unified diff content
    const patchContent = `--- a/${file}\n+++ b/${file}\n@@ -1,1 +1,1 @@\n-${before.split('\n').join('\n-')}\n+${after.split('\n').join('\n+')}\n`;
    const element = document.createElement("a");
    const fileBlob = new Blob([patchContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = `fix_${file.replace(/[\/\\:\*\?"<>\|]/g, '_')}_${idx}.patch`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (fixes.length === 0) {
    return (
      <div className="premium-card" style={{ textAlign: 'center', padding: '40px 16px' }}>
        <Sparkles size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
        <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '600' }}>No AI Fixes Proposed</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>
          No quality, logic, or security bugs have been scanned that warrant automated patch generation.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
        <Sparkles size={16} />
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '600', letterSpacing: '-0.01em' }}>AI-Generated Code Fixes</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {fixes.map((fix, idx) => (
          <div key={idx} className="premium-card" style={{ borderLeft: `3px solid ${fix.severity === 'HIGH' || fix.severity === 'CRITICAL' ? 'var(--danger-color)' : 'var(--warning-color)'}` }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
              <div>
                <span className="badge-low" style={{ display: 'inline-block', fontSize: '10px' }}>
                  {fix.issue_type}
                </span>
                <h3 style={{ margin: '4px 0 2px 0', fontSize: '14px', fontWeight: '600', color: '#fff', letterSpacing: '-0.01em' }}>
                  {fix.file_path} {fix.line_number && `(Line ${fix.line_number})`}
                </h3>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Confidence</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--success-color)' }}>{fix.confidence_score}%</div>
                </div>
                <span className={fix.severity === 'HIGH' || fix.severity === 'CRITICAL' ? 'badge-critical' : 'badge-high'}>
                  {fix.severity}
                </span>
              </div>
            </div>

            {/* Explanation items */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>Root Cause</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{fix.root_cause}</p>
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>Why the Fix Works</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{fix.why_fix_works}</p>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>Explanation</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{fix.explanation}</p>
            </div>

            {/* Code Diff Panel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: 'rgba(244,63,94,0.03)', border: '1px solid var(--border-color)', borderBottom: 'none', borderTopLeftRadius: '6px', borderTopRightRadius: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--danger-color)' }}>Original Code</span>
                </div>
                <pre style={{
                  margin: 0,
                  padding: '10px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderBottomLeftRadius: '6px',
                  borderBottomRightRadius: '6px',
                  overflowX: 'auto',
                  fontSize: '12px',
                  color: 'var(--text-secondary)'
                }}>
                  <code>{fix.before_code}</code>
                </pre>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: 'rgba(16,185,129,0.03)', border: '1px solid var(--border-color)', borderBottom: 'none', borderTopLeftRadius: '6px', borderTopRightRadius: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--success-color)' }}>AI Fixed Code</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleCopy(fix.fixed_code, idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px'
                      }}
                    >
                      {copiedIdx === idx ? <Check size={10} style={{ color: 'var(--success-color)' }} /> : null}
                      <span>{copiedIdx === idx ? "Copied" : "Copy"}</span>
                    </button>
                    <button
                      onClick={() => handleDownloadPatch(fix.file_path, fix.before_code, fix.fixed_code, idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px'
                      }}
                    >
                      <Download size={10} />
                      <span>Patch</span>
                    </button>
                  </div>
                </div>
                <pre style={{
                  margin: 0,
                  padding: '10px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderBottomLeftRadius: '6px',
                  borderBottomRightRadius: '6px',
                  overflowX: 'auto',
                  fontSize: '12px',
                  color: 'var(--success-color)'
                }}>
                  <code>{fix.fixed_code}</code>
                </pre>
              </div>
            </div>

            {/* Best Practices */}
            {fix.best_practices && fix.best_practices.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Best Practices Recommended</h4>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {fix.best_practices.map((bp, bpIdx) => (
                    <li key={bpIdx}>{bp}</li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}
