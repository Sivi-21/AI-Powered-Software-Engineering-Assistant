import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, ChevronDown, ChevronUp, AlertCircle, Search, Filter } from 'lucide-react';

export default function SecurityFindings({ report }) {
  const vulns = report?.vulnerabilities || [];
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL"); // ALL, HIGH_CRITICAL, MEDIUM, LOW

  const toggleSnippet = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const getSeverityBadgeClass = (severity) => {
    const sev = severity.toUpperCase();
    if (sev === "CRITICAL") return "badge-critical";
    if (sev === "HIGH") return "badge-high";
    if (sev === "MEDIUM") return "badge-medium";
    return "badge-low";
  };

  // Filter vulnerabilities
  const filteredVulns = vulns.filter(v => {
    // 1. Filter by severity
    const sev = v.severity.toUpperCase();
    if (severityFilter === "HIGH_CRITICAL" && sev !== "HIGH" && sev !== "CRITICAL") return false;
    if (severityFilter === "MEDIUM" && sev !== "MEDIUM") return false;
    if (severityFilter === "LOW" && sev !== "LOW") return false;

    // 2. Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const desc = (v.description || "").toLowerCase();
      const file = (v.file_path || v.file || "").toLowerCase();
      const name = (v.vulnerability || "").toLowerCase();
      return desc.includes(q) || file.includes(q) || name.includes(q);
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)' }}>
        <ShieldAlert size={22} />
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Security Vulnerability Audit</h3>
      </div>

      {/* Interactive Controls Bar */}
      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        background: 'rgba(255,255,255,0.01)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px'
      }}>
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by vulnerability type, description, or file..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '6px',
              background: 'rgba(10, 9, 21, 0.4)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '13px'
            }}
          />
        </div>

        {/* Severity Filters */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '2px'
          }}>
            {[
              { id: "ALL", label: "All" },
              { id: "HIGH_CRITICAL", label: "High / Critical" },
              { id: "MEDIUM", label: "Medium" },
              { id: "LOW", label: "Low" }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setSeverityFilter(filter.id)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: severityFilter === filter.id ? 'var(--accent-color)' : 'transparent',
                  color: severityFilter === filter.id ? '#fff' : 'var(--text-secondary)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '12px',
                  transition: 'all 0.2s'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredVulns.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <ShieldCheck size={48} style={{ color: 'var(--success-color)', marginBottom: '16px' }} />
          <h4 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>No Vulnerabilities Found</h4>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
            No security findings match your active filters or search terms.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredVulns.map((vuln, idx) => {
            const isExpanded = expandedIndex === idx;
            const badgeClass = getSeverityBadgeClass(vuln.severity);
            const severityUpper = vuln.severity.toUpperCase();
            
            return (
              <div key={idx} className="glass-card" style={{
                padding: '20px',
                borderLeft: `4px solid ${
                  severityUpper === "CRITICAL" ? 'var(--danger-color)' :
                  severityUpper === "HIGH" ? 'var(--warning-color)' :
                  severityUpper === "MEDIUM" ? '#EAB308' : 'var(--success-color)'
                }`
              }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className={`badge-tag ${badgeClass}`} style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    textTransform: 'uppercase'
                  }}>
                    {vuln.severity}
                  </span>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span><strong>File:</strong> <code>{vuln.file_path || vuln.file}</code></span>
                    {vuln.line_number && <span><strong>Line:</strong> {vuln.line_number}</span>}
                  </div>
                </div>

                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#fff' }}>
                  {vuln.vulnerability || vuln.description.substring(0, 60) + "..."}
                </h4>
                
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {vuln.description}
                </p>

                {vuln.snippet && (
                  <div style={{ marginBottom: '12px' }}>
                    <button
                      onClick={() => toggleSnippet(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-color)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        padding: 0,
                        fontWeight: '500'
                      }}
                    >
                      {isExpanded ? (
                        <>Hide Code Snippet <ChevronUp size={14} /></>
                      ) : (
                        <>Expand Code Snippet <ChevronDown size={14} /></>
                      )}
                    </button>

                    {isExpanded && (
                      <pre style={{
                        background: '#070A13',
                        padding: '14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        overflowX: 'auto',
                        border: '1px solid rgba(255,255,255,0.03)',
                        marginTop: '10px'
                      }}>
                        <code style={{ fontFamily: 'Consolas, monospace' }}>{vuln.snippet}</code>
                      </pre>
                    )}
                  </div>
                )}

                {vuln.remediation && (
                  <div style={{
                    padding: '10px 14px',
                    background: 'rgba(34, 197, 94, 0.05)',
                    border: '1px solid rgba(34, 197, 94, 0.15)',
                    color: 'var(--success-color)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>Remediation:</strong> {vuln.remediation}</span>
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
