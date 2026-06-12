import React, { useState } from 'react';
import { Lightbulb, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export default function CodeReviewFindings({ report }) {
  const suggestions = report?.suggestions || [];
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleExplanation = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning-color)' }}>
        <Lightbulb size={22} />
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>AI Code Review & Suggestions</h3>
      </div>

      {suggestions.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <CheckCircle2 size={48} style={{ color: 'var(--success-color)', marginBottom: '16px' }} />
          <h4 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Clean Code Quality</h4>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
            No major refactoring, styling, or performance issues were flagged by the assistant.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {suggestions.map((item, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <div
                key={idx}
                className="glass-card"
                style={{
                  padding: '20px',
                  borderLeft: '4px solid var(--warning-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '16px' }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      FILE: <code>{item.file_path || "General"}</code>
                    </span>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#fff', lineHeight: '1.4' }}>
                      {item.suggestion}
                    </h4>
                  </div>
                  
                  <button
                    onClick={() => toggleExplanation(idx)}
                    style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      color: 'var(--warning-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontWeight: '500',
                      flexShrink: 0
                    }}
                  >
                    {isExpanded ? (
                      <>Hide Details <ChevronUp size={14} /></>
                    ) : (
                      <>View Details <ChevronDown size={14} /></>
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6'
                  }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: 'rgba(255, 255, 255, 0.01)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <AlertTriangle size={16} style={{ color: 'var(--warning-color)', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>Detailed Recommendation:</strong>
                        <p style={{ margin: '6px 0 0 0', whiteSpace: 'pre-wrap' }}>{item.explanation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
