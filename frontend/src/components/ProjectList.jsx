import React, { useState } from 'react';
import { Database, Loader2, Play, CheckCircle2, XCircle, Trash2, Search, ExternalLink, GitBranch, FileArchive } from 'lucide-react';
import { deleteProject } from '../api';

export default function ProjectList({ projects, selectedProjectId, onSelectProject, onDeleteSuccess }) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async (e, projectId) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this repository? This will erase all vector indexes and database reports.")) return;
    
    try {
      await deleteProject(projectId);
      onDeleteSuccess(projectId);
    } catch (err) {
      alert("Failed to delete repository: " + err.message);
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

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span style={{
            background: 'rgba(22, 163, 74, 0.08)',
            color: 'var(--success-color)',
            border: '1px solid rgba(22, 163, 74, 0.2)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {getStatusIcon(status)} ACTIVE
          </span>
        );
      case "failed":
        return (
          <span style={{
            background: 'rgba(220, 38, 38, 0.08)',
            color: 'var(--danger-color)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {getStatusIcon(status)} ERROR
          </span>
        );
      default:
        return (
          <span style={{
            background: 'var(--bg-secondary)',
            color: 'var(--accent-color)',
            border: '1px solid var(--border-color)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {getStatusIcon(status)} {status.toUpperCase()}
          </span>
        );
    }
  };

  const filteredProjects = projects.filter(proj => 
    proj.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="canvas-panel" style={{ padding: '28px', background: 'var(--bg-secondary)' }}>
      
      {/* Header and Search */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '24px',
        marginBottom: '28px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Database size={20} style={{ color: 'var(--text-secondary)' }} />
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', letterSpacing: '-0.015em' }}>Connected System Modules</h2>
        </div>
        
        {/* Search input bar */}
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            placeholder="Filter active modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '38px',
              fontSize: '14px',
              height: '38px'
            }}
          />
        </div>
      </div>

      {/* Schematic grid layout */}
      {filteredProjects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
          <Database size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            No connected modules matched your query.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
          {filteredProjects.map((proj) => {
            const isSelected = proj.id === selectedProjectId;
            const isGit = proj.repository_source === "GITHUB";
            return (
              <div 
                key={proj.id}
                onClick={() => onSelectProject(proj)}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-card)'}`,
                  borderRadius: '6px',
                  padding: '20px',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isSelected ? 'var(--accent-color)' : 'var(--border-card)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Node indicator dots on edges for engineering schematic feel */}
                <div style={{ position: 'absolute', left: '-5px', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '8px', borderRadius: '50%', background: isSelected ? 'var(--accent-color)' : 'var(--border-color)', border: '1px solid var(--bg-card)' }} />
                <div style={{ position: 'absolute', right: '-5px', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '8px', borderRadius: '50%', background: isSelected ? 'var(--accent-color)' : 'var(--border-color)', border: '1px solid var(--bg-card)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isGit ? <GitBranch size={18} style={{ color: 'var(--accent-color)' }} /> : <FileArchive size={18} style={{ color: 'var(--text-secondary)' }} />}
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{proj.name}</h3>
                  </div>
                  {getStatusBadge(proj.status)}
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <span>Source: {isGit ? "GitHub repository" : "Local Archive"}</span>
                  <span style={{ color: 'var(--text-muted)' }}>ID: {proj.id.substring(0, 8)}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    onClick={() => onSelectProject(proj)}
                    className="btn-secondary"
                    style={{
                      height: '32px',
                      padding: '0 12px',
                      fontSize: '13px',
                      borderRadius: '4px',
                      gap: '4px'
                    }}
                  >
                    Mount <ExternalLink size={12} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, proj.id)}
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
                    title="Erase Module"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
