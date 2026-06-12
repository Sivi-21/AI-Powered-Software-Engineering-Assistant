import React, { useState, useRef } from 'react';
import { Upload, FileCode, CheckCircle, AlertTriangle } from 'lucide-react';
import { uploadRepository } from '../api';

export default function UploadArea({ onUploadSuccess }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
        setName(droppedFile.name.replace(".zip", ""));
        setError("");
      } else {
        setError("Only ZIP archives are supported.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setName(selectedFile.name.replace(".zip", ""));
      setError("");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");
    try {
      const project = await uploadRepository(file, name);
      onUploadSuccess(project);
      setFile(null);
      setName("");
    } catch (err) {
      setError(err.message || "Failed to upload project repository.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '600px', margin: '40px auto' }}>
      <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600' }}>Upload Codebase</h2>
      <p style={{ color: 'var(--text-secondary)', margin: '0 0 24px 0', fontSize: '14px' }}>
        Provide your repository compressed as a ZIP file to trigger the multi-agent AI analysis pipeline.
      </p>

      <form onSubmit={handleSubmit}>
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
            position: 'relative'
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
              <Upload size={48} style={{ color: 'var(--accent-color)', marginBottom: '16px', opacity: 0.8 }} />
              <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>
                Drag and drop your ZIP file here, or <span style={{ color: 'var(--accent-color)' }}>browse</span>
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                Max file size: 10MB (.zip archives only)
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <FileCode size={48} style={{ color: 'var(--success-color)' }} />
              <p style={{ margin: 0, fontWeight: '500' }}>{file.name}</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>

        {file && (
          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Project Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g. My Web Service"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(10, 9, 21, 0.6)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              required
            />
          </div>
        )}

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger-color)',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {file && (
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}
          >
            {loading ? "Uploading..." : "Analyze Codebase"}
          </button>
        )}
      </form>
    </div>
  );
}
