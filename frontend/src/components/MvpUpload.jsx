import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, FileArchive, CheckCircle2, AlertOctagon, RefreshCw, BarChart2, GitBranch } from 'lucide-react';

const API_BASE_URL = "http://127.0.0.1:8000";

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
          `${API_BASE_URL}/api/v1/projects/analyze-mvp-github`,
          {
            repo_url: trimmedUrl,
          },
          {
            headers: {
              "Content-Type": "application/json",
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
        const response = await axios.post("http://127.0.0.1:8000/api/v1/projects/analyze-mvp-github", {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>

      {/* Upload Zone Card */}
      <div className="glass-card">
        <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '600' }}>Direct MVP Codebase Analyzer</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px 0', fontSize: '14px' }}>
          This page executes a direct synchronous code scan. Your codebase is analyzed statically by the Repository Agent in one single request without writing persistent DB reports.
        </p>

        {/* Scan Mode Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '20px',
          maxWidth: '300px'
        }}>
          <button
            onClick={() => { setScanMode("zip"); setError(""); setResult(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              background: scanMode === "zip" ? 'var(--accent-color)' : 'transparent',
              color: scanMode === "zip" ? '#fff' : 'var(--text-secondary)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            ZIP Upload
          </button>
          <button
            onClick={() => { setScanMode("git"); setError(""); setResult(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              background: scanMode === "git" ? 'var(--accent-color)' : 'transparent',
              color: scanMode === "git" ? '#fff' : 'var(--text-secondary)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            Git Clone Link
          </button>
        </div>

        {scanMode === "zip" ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            style={{
              border: `2px dashed ${isDragActive ? 'var(--accent-color)' : 'var(--border-color)'}`,
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragActive ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
              transition: 'all 0.2s',
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
                <Upload size={40} style={{ color: 'var(--accent-color)', marginBottom: '16px', opacity: 0.8 }} />
                <p style={{ margin: '0 0 8px 0', fontWeight: '500', fontSize: '15px' }}>
                  Drag and drop your ZIP archive, or <span style={{ color: 'var(--accent-color)' }}>browse</span>
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                  Maximum size limit: 50MB
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <FileArchive size={40} style={{ color: 'var(--success-color)' }} />
                <p style={{ margin: 0, fontWeight: '500', fontSize: '15px' }}>{file.name}</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Public GitHub Repository Link
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
              <GitBranch size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/user/repository"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 38px',
                  borderRadius: '8px',
                  background: 'rgba(10, 9, 21, 0.6)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '14px'
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
            padding: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--danger-color)',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            <AlertOctagon size={18} />
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
                <RefreshCw className="animate-spin" size={16} />
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
        <div className="glass-card" style={{ borderLeft: '4px solid var(--success-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--success-color)' }}>
            <BarChart2 size={22} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Analysis Results</h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>PROJECT TYPE</div>
              <div style={{ fontSize: '16px', fontWeight: '600', textTransform: 'capitalize' }}>
                {result.project_type?.replace('_', ' ') || "N/A"}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>PRIMARY LANGUAGE</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>{result.primary_language || "N/A"}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>FRAMEWORK</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>{result.framework || "N/A"}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>TOTAL FILES</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>{result.total_files || 0}</div>
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '500' }}>Executive Summary</h4>
            <div style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: 'var(--text-secondary)',
              background: 'rgba(10, 9, 21, 0.4)',
              padding: '16px',
              borderRadius: '8px',
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
