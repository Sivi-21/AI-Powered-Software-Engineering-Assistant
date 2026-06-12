import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, Copy, Check, List } from 'lucide-react';

export default function ReportViewer({ report, project }) {
  const [copied, setCopied] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState("executive-summary");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveAnchor(entry.target.id);
          }
        });
      },
      { rootMargin: "-10% 0px -70% 0px" }
    );

    const ids = ["executive-summary", "architecture-overview", "security-findings", "code-review-findings", "recommendations", "download-options"];
    
    // Set up brief delay to let markdown render before observing
    const timer = setTimeout(() => {
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, [report?.full_report_md]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(report?.full_report_md || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy report: ", err);
    }
  };

  // Upgraded custom markdown-to-HTML parser that injects navigation IDs
  const parseMarkdown = (mdText) => {
    if (!mdText) return "";
    
    const lines = mdText.split('\n');
    let inCodeBlock = false;
    let inTable = false;
    let codeContent = [];
    let htmlLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle Code Blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          htmlLines.push(
            `<pre style="background:#070A13; padding:16px; border-radius:8px; overflow-x:auto; border:1px solid var(--border-color); margin: 16px 0; font-size:13px; font-family:Consolas, monospace;"><code style="color:var(--text-primary);">${codeContent.join('\n')}</code></pre>`
          );
          codeContent = [];
        } else {
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        const escapedLine = line
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        codeContent.push(escapedLine);
        continue;
      }

      // Handle Markdown Tables
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (cells.every(c => c.startsWith('-') || c.match(/^:?-+:?$/))) {
          continue;
        }

        if (!inTable) {
          inTable = true;
          htmlLines.push(`<div style="overflow-x:auto; margin:16px 0;"><table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px; border:1px solid var(--border-color);">`);
          htmlLines.push(`<thead><tr style="background:rgba(59,130,246,0.06); border-bottom:1px solid var(--border-color);">`);
          cells.forEach(cell => {
            htmlLines.push(`<th style="padding:10px 12px; font-weight:600; color:#fff;">${parseInline(cell)}</th>`);
          });
          htmlLines.push(`</tr></thead><tbody>`);
        } else {
          htmlLines.push(`<tr style="border-bottom:1px solid rgba(255,255,255,0.03);">`);
          cells.forEach(cell => {
            htmlLines.push(`<td style="padding:10px 12px; color:var(--text-secondary);">${parseInline(cell)}</td>`);
          });
          htmlLines.push(`</tr>`);
        }
        continue;
      } else {
        if (inTable) {
          inTable = false;
          htmlLines.push(`</tbody></table></div>`);
        }
      }

      // Handle Headers with custom anchor IDs
      if (line.startsWith('# ')) {
        const headerText = line.substring(2).trim();
        const headerLower = headerText.toLowerCase();
        let anchorId = "";
        if (headerLower.includes("executive")) anchorId = "executive-summary";
        else if (headerLower.includes("architecture")) anchorId = "architecture-overview";
        else if (headerLower.includes("security")) anchorId = "security-findings";
        else if (headerLower.includes("review")) anchorId = "code-review-findings";
        else if (headerLower.includes("refactoring") || headerLower.includes("recommendation") || headerLower.includes("action") || headerLower.includes("suggestion")) anchorId = "recommendations";
        else if (headerLower.includes("conclusion")) anchorId = "conclusion";

        htmlLines.push(`<h1 ${anchorId ? `id="${anchorId}"` : ''} style="font-size: 24px; margin: 24px 0 12px 0; font-weight: 700; color: #fff; scroll-margin-top: 80px;">${parseInline(headerText)}</h1>`);
      } else if (line.startsWith('## ')) {
        const headerText = line.substring(3).trim();
        const headerLower = headerText.toLowerCase();
        let anchorId = "";
        if (headerLower.includes("executive")) anchorId = "executive-summary";
        else if (headerLower.includes("architecture")) anchorId = "architecture-overview";
        else if (headerLower.includes("security")) anchorId = "security-findings";
        else if (headerLower.includes("review")) anchorId = "code-review-findings";
        else if (headerLower.includes("refactoring") || headerLower.includes("recommendation") || headerLower.includes("action") || headerLower.includes("suggestion")) anchorId = "recommendations";
        else if (headerLower.includes("conclusion")) anchorId = "conclusion";

        htmlLines.push(`<h2 ${anchorId ? `id="${anchorId}"` : ''} style="font-size: 18px; margin: 28px 0 14px 0; font-weight: 600; color: #fff; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; scroll-margin-top: 80px;">${parseInline(headerText)}</h2>`);
      } else if (line.startsWith('### ')) {
        htmlLines.push(`<h3 style="font-size: 15px; margin: 16px 0 8px 0; font-weight: 600; color: #fff;">${parseInline(line.substring(4))}</h3>`);
      }
      // Handle Lists
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        htmlLines.push(`<li style="margin-left: 20px; margin-bottom: 6px; color: var(--text-secondary); font-size: 14px; line-height: 1.5;">${parseInline(line.substring(2))}</li>`);
      }
      // Handle Horizontal Rules
      else if (line.trim() === '---') {
        htmlLines.push('<hr style="border:0; border-top:1px solid var(--border-color); margin: 24px 0;" />');
      }
      // Handle Paragraphs
      else if (line.trim() !== '') {
        htmlLines.push(`<p style="font-size: 14px; line-height: 1.6; color: var(--text-secondary); margin: 0 0 12px 0;">${parseInline(line)}</p>`);
      } else {
        htmlLines.push('<br />');
      }
    }

    if (inTable) {
      htmlLines.push(`</tbody></table></div>`);
    }

    return htmlLines.join('');
  };

  const parseInline = (text) => {
    let parsed = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fff;">$1</strong>');
    parsed = parsed.replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; font-family:Consolas, monospace; font-size:12px; color:#93C5FD;">$1</code>');
    return parsed;
  };

  const downloadMarkdown = () => {
    const element = document.createElement("a");
    const file = new Blob([report.full_report_md], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    const fileName = project ? `${project.name.replace(/\s+/g, '_')}_analysis_report.md` : 'codebase_analysis_report.md';
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const printPdf = () => {
    window.print();
  };

  const scrollToAnchor = (id) => {
    setActiveAnchor(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const formattedHtml = parseMarkdown(report.full_report_md);

  const sidebarLinks = [
    { id: "executive-summary", label: "Executive Summary" },
    { id: "architecture-overview", label: "Architecture Overview" },
    { id: "security-findings", label: "Security Findings" },
    { id: "code-review-findings", label: "Code Review Findings" },
    { id: "recommendations", label: "Recommendations" },
    { id: "download-options", label: "Download Options" }
  ];

  return (
    <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', position: 'relative' }}>
      
      {/* LEFT SIDEBAR: Table of Contents */}
      <aside style={{
        width: '240px',
        position: 'sticky',
        top: '100px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        flexShrink: 0
      }} className="no-print">
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            <List size={16} />
            <span style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Report Sections</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sidebarLinks.map(link => {
              const isActive = activeAnchor === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => scrollToAnchor(link.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: isActive ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                    color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: isActive ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderLeft: isActive ? '2px solid var(--accent-color)' : '2px solid transparent',
                    paddingLeft: isActive ? '10px' : '12px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {link.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Copy shortcut card */}
        <button
          onClick={copyToClipboard}
          className="glass-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px',
            width: '100%',
            cursor: 'pointer',
            background: copied ? 'rgba(34, 197, 94, 0.05)' : 'var(--bg-card)',
            borderColor: copied ? 'rgba(34, 197, 94, 0.2)' : 'var(--border-color)',
            color: copied ? 'var(--success-color)' : 'var(--text-secondary)',
            fontWeight: '600',
            fontSize: '12px',
            transition: 'all 0.2s'
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied to Clipboard" : "Copy Full Markdown"}
        </button>
      </aside>

      {/* RIGHT PANEL: Structured Report Contents */}
      <div className="glass-card" style={{ flex: 1, padding: '36px' }}>
        
        {/* Document Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-color)' }}>
            <FileText size={24} />
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>AI Analysis Report Document</h3>
          </div>
        </div>

        {/* Markdown Render Body */}
        <div 
          dangerouslySetInnerHTML={{ __html: formattedHtml }} 
          style={{
            fontFamily: "'Outfit', sans-serif",
            color: 'var(--text-secondary)',
            lineHeight: '1.7'
          }}
        />

        {/* Download Options Panel */}
        <div id="download-options" style={{
          marginTop: '40px',
          paddingTop: '28px',
          borderTop: '1px solid var(--border-color)',
          scrollMarginTop: '80px'
        }} className="no-print">
          <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#fff', fontWeight: '600' }}>Download Options</h4>
          <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Export this repository analysis report for offline distribution, printing, or compliance audits.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={downloadMarkdown}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontSize: '13px',
                cursor: 'pointer',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#818cf8',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-color)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                e.currentTarget.style.color = '#818cf8';
              }}
            >
              <Download size={14} />
              Export Markdown (.md)
            </button>
            
            <button
              onClick={printPdf}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontSize: '13px',
                cursor: 'pointer',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              <Printer size={14} />
              Save as PDF Document
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
