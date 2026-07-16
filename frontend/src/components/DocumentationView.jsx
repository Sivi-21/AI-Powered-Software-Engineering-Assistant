import React, { useState } from 'react';
import { BookOpen, Copy, Download, Check, FileText, Printer } from 'lucide-react';
import { exportFullReport } from '../api';

export default function DocumentationView({ report }) {
  const docs = report?.generated_docs || {};
  const [selectedDoc, setSelectedDoc] = useState("readme");
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const docTypes = [
    { key: "readme", label: "README.md" },
    { key: "installation", label: "Installation Guide" },
    { key: "api_docs", label: "API Documentation" },
    { key: "developer_guide", label: "Developer Guide" },
    { key: "architecture", label: "Architecture Overview" },
    { key: "folder_structure", label: "Folder Structure" },
    { key: "database", label: "Database Documentation" },
    { key: "deployment", label: "Deployment Guide" },
    { key: "environment", label: "Environment Setup" }
  ];

  const currentContent = docs[selectedDoc] || `# Selection Unavailable\nNo content has been generated for this documentation module yet.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const element = document.createElement("a");
    const fileBlob = new Blob([currentContent], { type: 'text/markdown' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = `${selectedDoc}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadPDF = () => {
    // Print window fallback that formats markdown to HTML print page cleanly
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedDoc.toUpperCase()} - Platform Documentation</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            h1 { border-bottom: 2px solid #eaecef; padding-bottom: 10px; color: #0366d6; }
            h2 { border-bottom: 1px solid #eaecef; padding-bottom: 8px; margin-top: 24px; color: #24292e; }
            pre { background-color: #f6f8fa; padding: 16px; border-radius: 6px; font-family: "SFMono-Regular", Consolas, monospace; overflow-x: auto; }
            code { background-color: rgba(27,31,35,0.05); padding: 2px 4px; border-radius: 3px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div style="max-width: 800px; margin: 0 auto;">
            ${currentContent
              .replace(/# (.*)/g, '<h1>$1</h1>')
              .replace(/## (.*)/g, '<h2>$2</h2>')
              .replace(/\n/g, '<br/>')
            }
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportCompleteReport = async () => {
    if (!report?.project_id && !report?.id) {
      alert("No project is currently selected for a full export.");
      return;
    }

    const projectId = report.project_id || report.id;
    setIsExporting(true);
    try {
      const blob = await exportFullReport(projectId);
      const url = window.URL.createObjectURL(blob);
      const element = document.createElement('a');
      element.href = url;
      element.download = 'complete-report.pdf';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message || 'Failed to export the complete report.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', height: '620px' }}>
      
      {/* Sidebar switcher */}
      <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
        {docTypes.map(doc => {
          const isActive = selectedDoc === doc.key;
          return (
            <button
              key={doc.key}
              onClick={() => setSelectedDoc(doc.key)}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              style={{
                textAlign: 'left',
                justifyContent: 'flex-start',
                padding: '10px 14px',
                fontSize: '13px'
              }}
            >
              <FileText size={16} />
              <span>{doc.label}</span>
            </button>
          );
        })}
      </div>

      {/* Editor Content Area */}
      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
        
        {/* Controls Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(255,255,255,0.01)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)', fontSize: '14px', fontWeight: '600' }}>
            <BookOpen size={16} />
            <span>PREVIEW</span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleCopy}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
            
            <button
              onClick={handleDownloadMarkdown}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={14} />
              Markdown
            </button>

            <button
              onClick={handleExportCompleteReport}
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              disabled={isExporting}
            >
              <Download size={14} />
              {isExporting ? 'Generating…' : 'Export Complete Report'}
            </button>

            <button
              onClick={handleDownloadPDF}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={14} />
              Export Current PDF
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          background: 'rgba(10, 9, 21, 0.25)',
          fontSize: '14px',
          lineHeight: '1.6',
          color: 'var(--text-secondary)'
        }}>
          <pre style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
            color: 'inherit'
          }}>
            <code>{currentContent}</code>
          </pre>
        </div>

      </div>

    </div>
  );
}
