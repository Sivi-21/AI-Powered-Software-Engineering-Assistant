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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
        <Lightbulb size={16} />
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', letterSpacing: '-0.01em' }}>AI Code Review & Suggestions</h3>
      </div>

      {suggestions.length === 0 ? (
        <div className="premium-card" style={{ textAlign: 'center', padding: '40px 16px' }}>
          <CheckCircle2 size={36} style={{ color: 'var(--success-color)', marginBottom: '12px' }} />
          <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '600' }}>Clean Code Quality</h4>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>
            No major refactoring, styling, or performance issues were flagged by the assistant.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {suggestions.map((item, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <div
                key={idx}
                className="premium-card"
                style={{
                  padding: '16px 20px',
                  borderLeft: '3px solid var(--warning-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      File: <code className="font-mono">{item.file_path || "General"}</code>
                    </span>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#fff', lineHeight: '1.4', letterSpacing: '-0.01em' }}>
                      {item.suggestion}
                    </h4>
                  </div>
                  
                  <button
                    onClick={() => toggleExplanation(idx)}
                    className="btn-secondary"
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      flexShrink: 0
                    }}
                  >
                    {isExpanded ? (
                      <>Hide Details <ChevronUp size={12} /></>
                    ) : (
                      <>View Details <ChevronDown size={12} /></>
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
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: 'var(--bg-primary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <AlertTriangle size={14} style={{ color: 'var(--warning-color)', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>Detailed Recommendation:</strong>
                        <p style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>{item.explanation}</p>
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
