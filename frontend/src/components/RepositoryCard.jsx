import React from 'react';
import { Shield, Calendar, FolderGit, Trash2, ArrowRight, AlertCircle } from 'lucide-react';
import { deleteProject } from '../api';

export default function RepositoryCard({ project, report, onSelect, onDelete }) {
  const score = report?.code_quality_score || 0;
  const vulns = report?.vulnerabilities || [];
  
  const criticalVulns = vulns.filter(v => v.severity.toUpperCase() === "CRITICAL");
  const highVulns = vulns.filter(v => v.severity.toUpperCase() === "HIGH");
  const medVulns = vulns.filter(v => v.severity.toUpperCase() === "MEDIUM");
  const lowVulns = vulns.filter(v => v.severity.toUpperCase() === "LOW");

  const getScoreColor = (val) => {
    if (val >= 85) return 'var(--success-color)';
    if (val >= 70) return 'var(--info-color)';
    if (val >= 50) return 'var(--warning-color)';
    return 'var(--danger-color)';
  };

  const getStackText = () => {
    if (report) {
      const lang = report.primary_language || "";
      const fw = report.framework || "";
      if (lang && fw) return `${lang} • ${fw}`;
      return lang || fw || "Unknown Stack";
    }
    return project.status === "completed" ? "Unknown Stack" : "Analyzing...";
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${project.repository_name || project.name}"? This will permanently erase all reports.`)) return;

    try {
      await deleteProject(project.id);
      onDelete(project.id);
    } catch (err) {
      alert("Failed to delete project: " + err.message);
    }
  };

  const formattedDate = project.created_at
    ? new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Unknown Date';

  return (
    <div className="premium-card" style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '210px',
      padding: '20px',
      position: 'relative',
      justifyContent: 'space-between'
    }}>
      
      {/* Upper Area */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h4 style={{
              margin: '0 0 4px 0',
              fontSize: '15px',
              fontWeight: '600',
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <FolderGit size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                {project.repository_name || project.name}
              </span>
            </h4>
            <span style={{
              background: '#27272a',
              border: '1px solid #3f3f46',
              color: 'var(--text-primary)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '4px'
            }}>
              {getStackText()}
            </span>
          </div>

          {/* Code quality score indicator */}
          {project.status === "completed" ? (
            <div style={{
              background: 'transparent',
              border: `1px solid var(--border-color)`,
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600',
              color: getScoreColor(score),
              flexShrink: 0
            }}>
              {score}
            </div>
          ) : (
            <div style={{
              background: 'transparent',
              border: '1px dashed var(--border-color)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-muted)',
              flexShrink: 0
            }}>
              --
            </div>
          )}
        </div>

        {/* Security findings breakdown */}
        {project.status === "completed" ? (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '12px 0' }}>
            <div className="badge-critical" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px', fontSize: '10px' }}>
              <Shield size={10} />
              <span>{highVulns.length + criticalVulns.length} High</span>
            </div>
            <div className="badge-high" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px', fontSize: '10px' }}>
              <Shield size={10} />
              <span>{medVulns.length} Med</span>
            </div>
            <div className="badge-low" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px', fontSize: '10px' }}>
              <Shield size={10} />
              <span>{lowVulns.length} Low</span>
            </div>
          </div>
        ) : project.status === "failed" ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(244, 63, 94, 0.04)',
            border: '1px solid rgba(244, 63, 94, 0.15)',
            padding: '6px 10px',
            borderRadius: '6px',
            margin: '12px 0',
            color: '#fca5a5',
            fontSize: '11px',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}>
            <AlertCircle size={12} style={{ color: 'var(--danger-color)', flexShrink: 0 }} />
            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              Failed: {project.error_message || "Unknown error"}
            </span>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            padding: '6px 10px',
            borderRadius: '6px',
            margin: '12px 0',
            color: 'var(--text-secondary)',
            fontSize: '11px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="animate-spin" style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                border: '1.5px solid var(--text-primary)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                flexShrink: 0
              }} />
              <span>Running: <span style={{ textTransform: 'uppercase', fontWeight: '500' }}>{project.status}</span></span>
            </div>
            {project.current_progress && (
              <div style={{ marginLeft: '18px', fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                ↳ {project.current_progress}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Area */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '8px',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '10px',
        width: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <Calendar size={10} />
          <span>{formattedDate}</span>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={handleDelete}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger-color)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            title="Delete Project"
          >
            <Trash2 size={12} />
          </button>
          
          {project.status === "completed" && (
            <button
              onClick={onSelect}
              className="btn-primary"
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Open Report
              <ArrowRight size={10} />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
