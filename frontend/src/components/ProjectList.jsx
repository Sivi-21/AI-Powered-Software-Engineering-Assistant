import React from 'react';
import { Database, Loader2, Play, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { deleteProject } from '../api';

export default function ProjectList({ projects, selectedProjectId, onSelectProject, onDeleteSuccess }) {
  
  const handleDelete = async (e, projectId) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project? This will erase all vector indexes and database reports.")) return;
    
    try {
      await deleteProject(projectId);
      onDeleteSuccess(projectId);
    } catch (err) {
      alert("Failed to delete project: " + err.message);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={16} style={{ color: 'var(--success-color)' }} />;
      case "failed":
        return <XCircle size={16} style={{ color: 'var(--danger-color)' }} />;
      case "pending":
      case "parsing":
      case "indexing":
      case "analyzing":
        return <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent-color)' }} />;
      default:
        return <Play size={16} style={{ color: 'var(--text-muted)' }} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed": return "Analyzed";
      case "failed": return "Failed";
      case "pending": return "Queued";
      case "parsing": return "Parsing ZIP";
      case "indexing": return "Indexing Code";
      case "analyzing": return "Analyzing AI";
      default: return status;
    }
  };

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <Database size={20} style={{ color: 'var(--accent-color)' }} />
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Your Repositories</h3>
      </div>

      {projects.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', margin: '30px 0' }}>
          No repositories uploaded yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {projects.map((proj) => {
            const isSelected = proj.id === selectedProjectId;
            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj)}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.name}</span>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: '600',
                      padding: '2px 6px',
                      borderRadius: '8px',
                      background: proj.repository_source === "GITHUB" ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: proj.repository_source === "GITHUB" ? '#818cf8' : 'var(--text-muted)',
                      border: proj.repository_source === "GITHUB" ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid var(--border-color)',
                      flexShrink: 0
                    }}>
                      {proj.repository_source === "GITHUB" ? "Git" : "ZIP"}
                    </span>
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {getStatusIcon(proj.status)}
                    <span>{getStatusText(proj.status)}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(e, proj.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger-color)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
