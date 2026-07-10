import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, ChevronDown, ChevronUp, AlertCircle, Search, Filter, Terminal, FileCode } from 'lucide-react';

export default function SecurityFindings({ report }) {
  const vulns = report?.vulnerabilities || [];
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL"); // ALL, HIGH_CRITICAL, MEDIUM, LOW

  const toggleSnippet = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const getSeverityBadge = (severity) => {
    const sev = severity.toUpperCase();
    if (sev === "CRITICAL") return <span className="badge-critical">CRITICAL</span>;
    if (sev === "HIGH") return <span className="badge-high">HIGH</span>;
    if (sev === "MEDIUM") return <span className="badge-medium">MEDIUM</span>;
    return <span className="badge-low">LOW</span>;
  };

  const getSeverityColor = (severity) => {
    const sev = severity.toUpperCase();
    if (sev === "CRITICAL") return "var(--danger-color)";
    if (sev === "HIGH") return "var(--warning-color)";
    if (sev === "MEDIUM") return "var(--warning-color)";
    return "var(--success-color)";
  };

  // Filter vulnerabilities
  const filteredVulns = vulns.filter(v => {
    const sev = v.severity.toUpperCase();
    if (severityFilter === "HIGH_CRITICAL" && sev !== "HIGH" && sev !== "CRITICAL") return false;
    if (severityFilter === "MEDIUM" && sev !== "MEDIUM") return false;
    if (severityFilter === "LOW" && sev !== "LOW") return false;

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
        <ShieldAlert size={20} />
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', letterSpacing: '-0.015em' }}>Security Threat Timeline</h2>
      </div>

      {/* Interactive Controls Bar */}
      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px'
      }}>
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flex: 1, minWidth: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Query vulnerabilities, files, or symbols..."
            style={{
              paddingLeft: '38px',
              fontSize: '14px',
              height: '38px'
            }}
          />
        </div>

        {/* Severity Filters */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <div style={{
            display: 'flex',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '2px'
          }}>
            {[
              { id: "ALL", label: "All Threats" },
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
                  color: severityFilter === filter.id ? '#ffffff' : 'var(--text-secondary)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '12px',
                  transition: 'all 0.12s ease'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline pipeline representation */}
      {filteredVulns.length === 0 ? (
        <div className="canvas-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <ShieldCheck size={40} style={{ color: 'var(--success-color)', marginBottom: '16px' }} />
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Threat Pipeline Clear</h4>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            No security findings match your active filters or query metrics.
          </p>
        </div>
      ) : (
        <div className="timeline-pipeline" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {filteredVulns.map((vuln, idx) => {
            const isExpanded = expandedIndex === idx;
            const severityColor = getSeverityColor(vuln.severity);
            
            return (
              <div key={idx} className="canvas-panel" style={{ margin: 0, padding: '24px' }}>
                {/* Timeline node node connector dot */}
                <div 
                  className="timeline-node" 
                  style={{ 
                    background: severityColor,
                    boxShadow: `0 0 0 4px var(--bg-card), 0 0 0 6px ${severityColor}80`,
                    left: '-28px',
                    top: '24px'
                  }} 
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  {getSeverityBadge(vuln.severity)}
                  <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileCode size={13} />
                      <code className="font-mono">{vuln.file_path || vuln.file}</code>
                    </span>
                    {vuln.line_number && <span>Line: {vuln.line_number}</span>}
                  </div>
                </div>

                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.012em' }}>
                  {vuln.vulnerability || vuln.description.substring(0, 70) + "..."}
                </h4>
                
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {vuln.description}
                </p>

                {vuln.snippet && (
                  <div style={{ marginBottom: '16px' }}>
                    <button
                      onClick={() => toggleSnippet(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-color)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        padding: 0,
                        fontWeight: '600'
                      }}
                    >
                      {isExpanded ? (
                        <>Hide Code Snippet <ChevronUp size={14} /></>
                      ) : (
                        <>Verify Code Snippet <ChevronDown size={14} /></>
                      )}
                    </button>

                    {isExpanded && (
                      <pre style={{
                        background: 'var(--bg-secondary)',
                        padding: '16px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        marginTop: '10px',
                        overflowX: 'auto',
                        fontFamily: 'Consolas, monospace',
                        fontSize: '13px'
                      }}>
                        <code>{vuln.snippet}</code>
                      </pre>
                    )}
                  </div>
                )}

                {vuln.remediation && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--bg-secondary)',
                    border: `1px solid ${severityColor}40`,
                    color: 'var(--text-secondary)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px', color: severityColor }} />
                    <span><strong>Remediation Pipeline:</strong> {vuln.remediation}</span>
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
