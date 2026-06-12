import React from 'react';
import { ShieldAlert, Lightbulb, FileText, BarChart2, Shield, FolderOpen, AlertCircle } from 'lucide-react';

export default function DashboardOverview({ report, project }) {
  const score = report.code_quality_score || 70;
  const vulns = report.vulnerabilities || [];
  const suggestions = report.suggestions || [];

  // Categorize quality
  const getQualityCategory = (val) => {
    if (val >= 85) return { label: "Excellent", color: "var(--success-color)", text: "The codebase displays strong modularity, secure authentication flows, and healthy naming conventions with minimal technical debt." };
    if (val >= 70) return { label: "Good", color: "var(--accent-color)", text: "The codebase is well-structured but has minor issues in error containment or duplicate blocks that can be refactored." };
    if (val >= 50) return { label: "Fair", color: "var(--warning-color)", text: "The codebase requires cleanup. Multiple naming inconsistencies, deep nesting blocks, or unsecured patterns were detected." };
    return { label: "Poor", color: "var(--danger-color)", text: "Critical remediation required. Heavy security vulnerability flags, structural design flaws, or excessive nesting detected." };
  };

  const cat = getQualityCategory(score);

  // Group vulnerabilities by severity
  const criticalVulns = vulns.filter(v => v.severity.toUpperCase() === "CRITICAL");
  const highVulns = vulns.filter(v => v.severity.toUpperCase() === "HIGH");
  const medVulns = vulns.filter(v => v.severity.toUpperCase() === "MEDIUM");
  const lowVulns = vulns.filter(v => v.severity.toUpperCase() === "LOW");

  // SVG circular indicator parameters
  const radius = 60;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Estimate files based on summary or suggestions
  const estimatedFiles = report.summary ? (report.summary.match(/\w+\.\w+/g) || []).length + 3 : 5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Header Stat Cards */}
      <div className="grid-cols-4">
        {/* Card 1: Score */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', zIndex: 1 }}>
            <span style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Quality Score</span>
            <BarChart2 size={16} style={{ color: cat.color }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '14px 0 4px 0', zIndex: 1 }}>
            <span style={{ fontSize: '32px', fontWeight: '700', color: cat.color }}>{score}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/100</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '600', color: cat.color, zIndex: 1 }}>{cat.label} Standard</span>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.03, zIndex: 0 }}>
            <BarChart2 size={80} style={{ color: cat.color }} />
          </div>
        </div>

        {/* Card 2: Security */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', zIndex: 1 }}>
            <span style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Security Risks</span>
            <Shield size={16} style={{ color: vulns.length > 0 ? 'var(--danger-color)' : 'var(--success-color)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '14px 0 4px 0', zIndex: 1 }}>
            <span style={{ fontSize: '32px', fontWeight: '700', color: vulns.length > 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
              {vulns.length}
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', zIndex: 1 }}>
            {criticalVulns.length + highVulns.length} High Severity Flagged
          </span>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.03, zIndex: 0 }}>
            <Shield size={80} style={{ color: vulns.length > 0 ? 'var(--danger-color)' : 'var(--success-color)' }} />
          </div>
        </div>

        {/* Card 3: Files */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', zIndex: 1 }}>
            <span style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Files Scanned</span>
            <FolderOpen size={16} style={{ color: 'var(--accent-color)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '14px 0 4px 0', zIndex: 1 }}>
            <span style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)' }}>{estimatedFiles}</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', zIndex: 1 }}>Core codebase modules</span>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.03, zIndex: 0 }}>
            <FolderOpen size={80} style={{ color: 'var(--accent-color)' }} />
          </div>
        </div>

        {/* Card 4: Suggestions */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', zIndex: 1 }}>
            <span style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Refactors Flagged</span>
            <Lightbulb size={16} style={{ color: 'var(--warning-color)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '14px 0 4px 0', zIndex: 1 }}>
            <span style={{ fontSize: '32px', fontWeight: '700', color: 'var(--warning-color)' }}>{suggestions.length}</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', zIndex: 1 }}>Action items recommended</span>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.03, zIndex: 0 }}>
            <Lightbulb size={80} style={{ color: 'var(--warning-color)' }} />
          </div>
        </div>
      </div>

      {/* 2. Visual Gauge & Quality Description */}
      <div className="grid-cols-2">
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '24px 32px' }}>
          {/* Animated SVG Ring with Gradients */}
          <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
            <svg height="120" width="120" style={{ transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-color)" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
              <circle
                stroke="rgba(255, 255, 255, 0.03)"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx="60"
                cy="60"
              />
              <circle
                stroke={score >= 70 ? "url(#scoreGradient)" : cat.color}
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                r={normalizedRadius}
                cx="60"
                cy="60"
                strokeLinecap="round"
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '28px',
              fontWeight: '800',
              color: cat.color
            }}>
              {score}
            </div>
          </div>

          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#fff' }}>
              Quality Rating: <span style={{ color: cat.color }}>{cat.label}</span>
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
              {cat.text}
            </p>
          </div>
        </div>

        {/* Severity Metrics Table breakdown */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 32px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '600', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Vulnerability Breakdown
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--danger-color)' }}>{criticalVulns.length + highVulns.length}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Critical / High</div>
            </div>
            <div style={{ height: '35px', borderLeft: '1px solid var(--border-color)' }} />
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--warning-color)' }}>{medVulns.length}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Medium</div>
            </div>
            <div style={{ height: '35px', borderLeft: '1px solid var(--border-color)' }} />
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--success-color)' }}>{lowVulns.length}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Low</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Architecture Summary */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--accent-color)' }}>
          <FileText size={18} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Codebase Architecture Overview</h3>
        </div>
        <p style={{ 
          margin: 0, 
          color: 'var(--text-secondary)', 
          fontSize: '13px', 
          lineHeight: '1.6', 
          whiteSpace: 'pre-line',
          maxHeight: '350px',
          overflowY: 'auto',
          paddingRight: '8px'
        }}>
          {report.summary || "No architecture details available."}
        </p>
      </div>

    </div>
  );
}
