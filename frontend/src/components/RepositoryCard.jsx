import React from 'react';
import { Shield, BarChart2, Calendar, FolderGit, Trash2, ArrowRight, AlertCircle } from 'lucide-react';
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
    if (val >= 70) return 'var(--accent-color)';
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
    <div className="glass-card" style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '230px',
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
              fontSize: '16px',
              fontWeight: '600',
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <FolderGit size={16} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {project.repository_name || project.name}
              </span>
            </h4>
            <span style={{
              background: 'rgba(59, 130, 246, 0.06)',
              border: '1px solid rgba(59, 130, 246, 0.15)',
              color: '#93C5FD',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '6px'
            }}>
              {getStackText()}
            </span>
          </div>

          {/* Code quality score indicator */}
          {project.status === "completed" ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: `2px solid ${getScoreColor(score)}`,
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '800',
              color: getScoreColor(score),
              flexShrink: 0,
              boxShadow: `0 0 12px ${getScoreColor(score)}20`
            }}>
              {score}
            </div>
          ) : (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed var(--text-muted)',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '800',
              color: 'var(--text-muted)',
              flexShrink: 0
            }}>
              --
            </div>
          )}
        </div>

        {/* Security findings breakdown */}
        {project.status === "completed" ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '16px 0' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.18)',
              padding: '4px 8px',
              borderRadius: '6px',
              color: '#FCA5A5',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              <Shield size={12} style={{ color: 'var(--danger-color)' }} />
              <span>{highVulns.length + criticalVulns.length} High</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.18)',
              padding: '4px 8px',
              borderRadius: '6px',
              color: '#FDE047',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              <Shield size={12} style={{ color: 'var(--warning-color)' }} />
              <span>{medVulns.length} Med</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.18)',
              padding: '4px 8px',
              borderRadius: '6px',
              color: '#86EFAC',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              <Shield size={12} style={{ color: 'var(--success-color)' }} />
              <span>{lowVulns.length} Low</span>
            </div>
          </div>
        ) : project.status === "failed" ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            padding: '8px 12px',
            borderRadius: '8px',
            margin: '16px 0',
            color: '#FCA5A5',
            fontSize: '11px',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}>
            <AlertCircle size={14} style={{ color: 'var(--danger-color)', flexShrink: 0 }} />
            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              Failed: {project.error_message || "Unknown error"}
            </span>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            background: 'rgba(59, 130, 246, 0.06)',
            border: '1px solid rgba(59, 130, 246, 0.15)',
            padding: '8px 12px',
            borderRadius: '8px',
            margin: '16px 0',
            color: '#93C5FD',
            fontSize: '11px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="animate-spin" style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                border: '2px solid var(--accent-color)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                flexShrink: 0
              }} />
              <span>Workflow running: <strong style={{ textTransform: 'uppercase', color: 'var(--accent-color)' }}>{project.status}</strong></span>
            </div>
            {project.current_progress && (
              <div style={{ marginLeft: '20px', fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
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
        marginTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '12px',
        width: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <Calendar size={12} />
          <span>{formattedDate}</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleDelete}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger-color)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            title="Delete Project"
          >
            <Trash2 size={14} />
          </button>
          
          {project.status === "completed" && (
            <button
              onClick={onSelect}
              className="btn-primary"
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Open Report
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
