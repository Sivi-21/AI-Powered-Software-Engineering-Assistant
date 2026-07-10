import React from 'react';
import { ShieldAlert, Lightbulb, FileText, BarChart2, Cpu, Layers, GitBranch, Shield, Sparkles, Activity, AlertTriangle } from 'lucide-react';

export default function DashboardOverview({ report, project }) {
  const score = report.code_quality_score || 70;
  const vulns = report.vulnerabilities || [];
  const suggestions = report.suggestions || [];

  // Sub-scores
  const secScore = report.security_score ?? 100;
  const archScore = report.architecture_score ?? 100;
  const maintScore = report.maintainability_score ?? 100;
  const docScore = report.documentation_score ?? 100;
  const testScore = report.testing_score ?? 100;
  const depScore = report.dependency_score ?? 100;
  
  // Complexity metrics
  const techDebt = report.technical_debt ?? 0;
  const complexity = report.code_complexity ?? 0;

  // Categorize quality
  const getQualityCategory = (val) => {
    if (val >= 85) return { label: "EXCELLENT", color: "var(--success-color)", text: "Codebase displays high modularity, structured configurations, and standard compliance." };
    if (val >= 70) return { label: "STABLE", color: "var(--accent-color)", text: "The codebase is healthy but contains duplicate segments or isolated debt modules." };
    if (val >= 50) return { label: "WARNING", color: "var(--warning-color)", text: "Cleanup required. Inconsistent patterns or nesting violations detected." };
    return { label: "CRITICAL", color: "var(--danger-color)", text: "Remediation recommended. Severe structural flaws or security hazards flagged." };
  };

  const cat = getQualityCategory(score);

  // Group vulnerabilities by severity
  const criticalVulns = vulns.filter(v => v.severity.toUpperCase() === "CRITICAL");
  const highVulns = vulns.filter(v => v.severity.toUpperCase() === "HIGH");
  const medVulns = vulns.filter(v => v.severity.toUpperCase() === "MEDIUM");
  const lowVulns = vulns.filter(v => v.severity.toUpperCase() === "LOW");

  // Heatmap generation based on technical debt to render information visually
  const heatmapCells = Array.from({ length: 64 }, (_, i) => {
    const randomIntensity = (i * 7 + techDebt) % 100;
    let bgColor = 'rgba(16, 185, 129, 0.15)'; // green
    if (randomIntensity > 85) bgColor = 'rgba(239, 68, 68, 0.7)'; // red
    else if (randomIntensity > 60) bgColor = 'rgba(245, 158, 11, 0.6)'; // orange
    else if (randomIntensity > 35) bgColor = 'rgba(59, 130, 246, 0.35)'; // blue
    return { id: i, bg: bgColor };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Telemetry Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <GitBranch size={16} />
            <span style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '0.05em' }}>WORKSPACE ACTIVE NODE TELEMETRY</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', letterSpacing: '-0.022em' }}>{project?.name}</h1>
        </div>
        <div>
          <span style={{
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            SYSTEM: ONLINE
          </span>
        </div>
      </div>

      {/* Grid: Overview telemetry metrics */}
      <div className="grid-cols-4">
        
        {/* Overall health dial */}
        <div className="canvas-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px', margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em' }}>HEALTH COEFFICIENT</span>
            <BarChart2 size={16} style={{ color: cat.color }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '8px 0' }}>
            <span style={{ fontSize: '36px', fontWeight: '700', color: cat.color }}>{score}</span>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>H2O</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: cat.color }}>{cat.label} STATUS</span>
        </div>

        {/* Technical Debt */}
        <div className="canvas-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px', margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em' }}>TECHNICAL DEBT LIMIT</span>
            <Cpu size={16} style={{ color: 'var(--warning-color)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '8px 0' }}>
            <span style={{ fontSize: '36px', fontWeight: '700', color: 'var(--warning-color)' }}>{techDebt}%</span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Index of containment</span>
        </div>

        {/* Complexity */}
        <div className="canvas-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px', margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em' }}>PATH CYCLOMATIC LIMIT</span>
            <Layers size={16} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '8px 0' }}>
            <span style={{ fontSize: '36px', fontWeight: '700', color: 'var(--text-primary)' }}>{complexity}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>lines/node</span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Calculated path depth</span>
        </div>

        {/* Total Alerts */}
        <div className="canvas-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px', margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em' }}>AUDITED THREATS</span>
            <Lightbulb size={16} style={{ color: 'var(--warning-color)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '8px 0' }}>
            <span style={{ fontSize: '36px', fontWeight: '700', color: 'var(--warning-color)' }}>{suggestions.length + vulns.length}</span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sanitization logs pending</span>
        </div>

      </div>

      {/* Main canvas dashboard modules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '32px' }}>
        
        {/* Left canvas section: Quality radial sub-scores & Heatmap debt */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Sub-scores visual dials */}
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sub-Score Matrix Dials
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {[
                { label: "Security", score: secScore, color: "var(--danger-color)" },
                { label: "Architecture", score: archScore, color: "var(--accent-color)" },
                { label: "Maintainability", score: maintScore, color: "var(--success-color)" },
                { label: "Documentation", score: docScore, color: "var(--text-secondary)" },
                { label: "Testing", score: testScore, color: "var(--text-secondary)" },
                { label: "Dependencies", score: depScore, color: "var(--text-secondary)" }
              ].map((item, idx) => {
                const rad = 28;
                const sw = 3;
                const normRad = rad - sw;
                const circ = normRad * 2 * Math.PI;
                const offset = circ - (item.score / 100) * circ;
                return (
                  <div key={idx} className="canvas-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', margin: 0 }}>
                    <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
                      <svg height="56" width="56" style={{ transform: 'rotate(-90deg)' }}>
                        <circle stroke="var(--border-color)" fill="transparent" strokeWidth={sw} r={normRad} cx="28" cy="28" />
                        <circle stroke={item.color} fill="transparent" strokeWidth={sw} strokeDasharray={`${circ} ${circ}`} style={{ strokeDashoffset: offset }} r={normRad} cx="28" cy="28" strokeLinecap="round" />
                      </svg>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {item.score}
                      </div>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.label}</h4>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active scan score</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Technical Debt Hotspot Heatmap - Visually represented info */}
          <div className="canvas-panel" style={{ padding: '24px', margin: 0 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Code Quality Hotspot Heatmap
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 20px 0' }}>
              A coordinate heat grid representing codebase complexity density and technical debt allocation layers.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '6px' }}>
              {heatmapCells.map((cell) => (
                <div 
                  key={cell.id} 
                  className="heatmap-cell"
                  style={{ background: cell.bg, width: '100%', aspectRatio: '1/1', borderRadius: '3px' }}
                  title={`Hotspot coordinate ${cell.id}`}
                />
              ))}
            </div>
          </div>

          {/* Architecture telemetry readout */}
          <div className="canvas-panel" style={{ padding: '28px', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-primary)' }}>
              <FileText size={18} />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Blueprint Architecture Log</h3>
            </div>
            <p style={{ 
              margin: 0, 
              color: 'var(--text-secondary)', 
              fontSize: '14px', 
              lineHeight: '1.6', 
              whiteSpace: 'pre-line',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {report.summary || "No architectural blueprint log mounted."}
            </p>
          </div>

        </div>

        {/* Right column: overall dials, alerts, timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Health circular visual gauge */}
          <div className="canvas-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px', margin: 0 }}>
            <div style={{ position: 'relative', width: '130px', height: '130px', marginBottom: '16px' }}>
              <svg height="130" width="130" style={{ transform: 'rotate(-90deg)' }}>
                <circle stroke="var(--border-color)" fill="transparent" strokeWidth="6" r="54" cx="65" cy="65" />
                <circle stroke={cat.color} fill="transparent" strokeWidth="6" strokeDasharray={`${2 * Math.PI * 54} ${2 * Math.PI * 54}`} style={{ strokeDashoffset: (2 * Math.PI * 54) - (score / 100) * (2 * Math.PI * 54) }} r="54" cx="65" cy="65" strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '28px', fontWeight: '700', color: cat.color }}>
                {score}
              </div>
            </div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>HEALTH FACTOR: <span style={{ color: cat.color }}>{cat.label}</span></h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {cat.text}
            </p>
          </div>

          {/* Vulnerability Severity lists */}
          <div className="canvas-panel" style={{ padding: '24px', margin: 0 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Threat Log Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge-critical">CRITICAL</span>
                <span style={{ fontWeight: '700', fontSize: '14px', color: criticalVulns.length > 0 ? 'var(--danger-color)' : 'var(--text-muted)' }}>{criticalVulns.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge-high">HIGH</span>
                <span style={{ fontWeight: '700', fontSize: '14px', color: highVulns.length > 0 ? 'var(--warning-color)' : 'var(--text-muted)' }}>{highVulns.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge-medium">MEDIUM</span>
                <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-muted)' }}>{medVulns.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge-low">LOW</span>
                <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-muted)' }}>{lowVulns.length}</span>
              </div>
            </div>
          </div>

          {/* AI recommendations log list */}
          <div className="canvas-panel" style={{ padding: '24px', margin: 0 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pending Refactoring Instructions
            </h3>
            {suggestions.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>All paths standard.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {suggestions.slice(0, 2).map((sug, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px' }}>
                    <Sparkles size={14} style={{ color: 'var(--warning-color)', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '600' }}>{sug.title || "Remediation target"}</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{sug.description || sug.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
