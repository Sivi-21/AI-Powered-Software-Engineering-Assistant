import React, { useState, useRef } from 'react';
import { Upload, FileCode, AlertTriangle } from 'lucide-react';
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
    <div className="premium-card">
      <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Upload size={16} style={{ color: 'var(--text-secondary)' }} />
        Upload ZIP Archive
      </h3>
      <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px 0', fontSize: '13px', lineHeight: '1.4' }}>
        Upload a compressed ZIP of your repository locally.
      </p>

      <form onSubmit={handleSubmit}>
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className="upload-dropzone"
          style={{
            padding: '30px 16px',
            textAlign: 'center',
            cursor: 'pointer',
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
              <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '500' }}>
                Drag your ZIP file here or <span style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>browse</span>
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                Max 10MB (.zip only)
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <FileCode size={32} style={{ color: 'var(--success-color)' }} />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>{file.name}</p>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>

        {file && (
          <div style={{ marginTop: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Project Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g. My Web Service"
              required
            />
          </div>
        )}

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '12px',
            padding: '10px 12px',
            background: 'rgba(244, 63, 94, 0.05)',
            border: '1px solid rgba(244, 63, 94, 0.15)',
            color: 'var(--danger-color)',
            borderRadius: '6px',
            fontSize: '12px'
          }}>
            <AlertTriangle size={14} />
            <span>{error}</span>
          </div>
        )}

        {file && (
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}
          >
            {loading ? "Uploading..." : "Analyze Codebase"}
          </button>
        )}
      </form>
    </div>
  );
}
