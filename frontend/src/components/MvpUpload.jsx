import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, FileArchive, RefreshCw, BarChart2, GitBranch, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, "") : "";

export default function MvpUpload() {
  const [scanMode, setScanMode] = useState("zip"); // zip, git
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".zip")) {
        setFile(droppedFile);
        setError("");
        setResult(null);
      } else {
        setError("Only ZIP archives are supported.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError("");
      setResult(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const validateUrl = (url) => {
    const regex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+(?:\.git)?\/?$/;
    return regex.test(url.trim());
  };

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setResult(null);

    if (scanMode === "zip") {
      if (!file) return;
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/projects/analyze-mvp-zip`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setResult(response.data);
        setFile(null);
      } catch (err) {
        const msg = err.response?.data?.detail || "Connection failure. Ensure backend server is running.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    } else {
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
        const response = await axios.post(`${API_BASE_URL}/api/v1/projects/analyze-mvp-github`, {
          repo_url: trimmedUrl
        }, {
          headers: {
            "Content-Type": "application/json"
          }
        });
        setResult(response.data);
        setRepoUrl("");
      } catch (err) {
        const msg = err.response?.data?.detail || "Failed to analyze repository. Ensure backend is active.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>

      {/* Upload Zone Card */}
      <div className="premium-card">
        <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', letterSpacing: '-0.02em' }}>Direct MVP Codebase Analyzer</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px 0', fontSize: '13px', lineHeight: '1.5' }}>
          This page executes a direct synchronous code scan. Your codebase is analyzed statically by the Repository Agent in one single request without writing persistent DB reports.
        </p>

        {/* Scan Mode Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '2px',
          marginBottom: '20px',
          maxWidth: '240px'
        }}>
          <button
            onClick={() => { setScanMode("zip"); setError(""); setResult(null); }}
            style={{
              flex: 1,
              padding: '6px 10px',
              border: 'none',
              background: scanMode === "zip" ? 'var(--accent-color)' : 'transparent',
              color: scanMode === "zip" ? '#09090b' : 'var(--text-secondary)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '12px',
              transition: 'all 0.15s ease'
            }}
          >
            ZIP Upload
          </button>
          <button
            onClick={() => { setScanMode("git"); setError(""); setResult(null); }}
            style={{
              flex: 1,
              padding: '6px 10px',
              border: 'none',
              background: scanMode === "git" ? 'var(--accent-color)' : 'transparent',
              color: scanMode === "git" ? '#09090b' : 'var(--text-secondary)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '12px',
              transition: 'all 0.15s ease'
            }}
          >
            Git Link
          </button>
        </div>

        {scanMode === "zip" ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className="upload-dropzone"
            style={{
              padding: '36px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".zip"
              style={{ display: 'none' }}
            />

            {!file ? (
              <div>
                <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <p style={{ margin: '0 0 4px 0', fontWeight: '500', fontSize: '13px' }}>
                  Drag your ZIP archive here or <span style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>browse</span>
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                  Maximum size limit: 50MB
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <FileArchive size={32} style={{ color: 'var(--success-color)' }} />
                <p style={{ margin: 0, fontWeight: '500', fontSize: '13px' }}>{file.name}</p>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Public GitHub Repository Link
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
              <GitBranch size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/user/repository"
                style={{
                  paddingLeft: '32px'
                }}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            background: 'rgba(244, 63, 94, 0.05)',
            border: '1px solid rgba(244, 63, 94, 0.15)',
            color: 'var(--danger-color)',
            borderRadius: '6px',
            fontSize: '12px',
            marginBottom: '16px'
          }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {((scanMode === "zip" && file) || (scanMode === "git" && repoUrl.trim())) && (
          <button
            onClick={handleScan}
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={12} />
                <span>{scanMode === "git" ? "Cloning & Scanning..." : "Running Scan & Analysis..."}</span>
              </>
            ) : (
              "Analyze Instantly"
            )}
          </button>
        )}
      </div>

      {/* Structured Results Card */}
      {result && (
        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-primary)' }}>
            <BarChart2 size={16} />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Analysis Results</h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project Type</div>
              <div style={{ fontSize: '13px', fontWeight: '600', textTransform: 'capitalize' }}>
                {result.project_type?.replace('_', ' ') || "N/A"}
              </div>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary Language</div>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>{result.primary_language || "N/A"}</div>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Framework</div>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>{result.framework || "N/A"}</div>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Files</div>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>{result.total_files || 0}</div>
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Executive Summary</h4>
            <div style={{
              fontSize: '13px',
              lineHeight: '1.6',
              color: 'var(--text-secondary)',
              background: 'var(--bg-primary)',
              padding: '14px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              whiteSpace: 'pre-wrap'
            }}>
              {result.summary}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
