import React, { useState } from 'react';
import { GitBranch, AlertTriangle, Loader2 } from 'lucide-react';
import { analyzeGithub } from '../api';

export default function GitAnalyzeArea({ onAnalysisSuccess }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateUrl = (url) => {
    const regex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+(?:\.git)?\/?$/;
    return regex.test(url.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedUrl = repoUrl.trim();
    if (!trimmedUrl) {
      setError("Please enter a repository URL.");
      return;
    }

    if (!validateUrl(trimmedUrl)) {
      setError("Invalid GitHub URL. Format: https://github.com/user/repository");
      return;
    }

    setLoading(true);
    try {
      const project = await analyzeGithub(trimmedUrl);
      onAnalysisSuccess(project);
      setRepoUrl("");
    } catch (err) {
      setError(err.message || "Failed to analyze repository.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <GitBranch size={18} style={{ color: 'var(--accent-color)' }} />
        Analyze Git Repository
      </h3>
      <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px 0', fontSize: '13px', lineHeight: '1.4' }}>
        Analyze a public GitHub repository directly.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={loading}
            placeholder="https://github.com/user/repository"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(10, 9, 21, 0.6)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '13px',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger-color)',
            borderRadius: '8px',
            fontSize: '12px',
            lineHeight: '1.4'
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !repoUrl.trim()}
          style={{ 
            width: '100%', 
            justifyContent: 'center',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            padding: '10px',
            fontSize: '13px',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Cloning repo...
            </>
          ) : "Analyze Repository"}
        </button>
      </form>
    </div>
  );
}
