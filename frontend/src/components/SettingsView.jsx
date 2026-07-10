import React, { useEffect, useState } from 'react';
import { Settings, Server, Database, Info, Cpu, BarChart3, Palette } from 'lucide-react';

export default function SettingsView() {
  const [dbStatus, setDbStatus] = useState("Checking...");
  const [backendUrl] = useState(import.meta.env.VITE_API_URL || "/api/v1");
  const [activeAccent, setActiveAccent] = useState(() => {
    return localStorage.getItem('saas-accent') || 'white';
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${backendUrl}/projects`);
        if (res.ok) {
          setDbStatus("Online & Connected");
        } else {
          setDbStatus("Error: " + res.status);
        }
      } catch (err) {
        setDbStatus("Offline / Connection Error");
      }
    };
    checkStatus();
  }, [backendUrl]);

  // Handle CSS variable theme selection dynamically
  const changeAccent = (theme) => {
    const root = document.documentElement;
    setActiveAccent(theme);
    localStorage.setItem('saas-accent', theme);

    if (theme === 'purple') {
      root.style.setProperty('--accent-color', '#818cf8');
      root.style.setProperty('--accent-hover', '#6366f1');
    } else if (theme === 'emerald') {
      root.style.setProperty('--accent-color', '#10b981');
      root.style.setProperty('--accent-hover', '#059669');
    } else if (theme === 'amber') {
      root.style.setProperty('--accent-color', '#f59e0b');
      root.style.setProperty('--accent-hover', '#d97706');
    } else {
      // Default White
      root.style.setProperty('--accent-color', '#ffffff');
      root.style.setProperty('--accent-hover', '#e4e4e7');
    }
  };

  // Run on mount to apply stored theme
  useEffect(() => {
    changeAccent(activeAccent);
  }, []);

  const themeOptions = [
    { id: 'white', name: 'Sleek White', color: '#ffffff' },
    { id: 'purple', name: 'Indigo Aura', color: '#818cf8' },
    { id: 'emerald', name: 'Emerald', color: '#10b981' },
    { id: 'amber', name: 'Amber Glow', color: '#f59e0b' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
        <Settings size={16} />
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', letterSpacing: '-0.01em' }}>SaaS Portal & Config Settings</h3>
      </div>

      <div className="grid-cols-2">
        {/* Connection card */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Server size={14} />
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>Backend Pipeline Link</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>API Base URL</span>
              <code style={{ color: 'var(--text-primary)' }}>{backendUrl}</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Service Health</span>
              <span style={{ 
                fontWeight: '600', 
                color: dbStatus.includes("Online") ? 'var(--success-color)' : 'var(--danger-color)'
              }}>
                {dbStatus}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Active Model</span>
              <span style={{ fontWeight: '500' }}>Groq / Gemini Auto-detect</span>
            </div>
          </div>
        </div>

        {/* Dynamic theme switcher */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Palette size={14} />
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>Personalize Accent Theme</h4>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            Customize your portal brand colors instantly (changes apply globally across all views).
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {themeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => changeAccent(opt.id)}
                style={{
                  background: activeAccent === opt.id ? 'var(--bg-primary)' : 'transparent',
                  border: `1px solid ${activeAccent === opt.id ? 'var(--text-primary)' : 'var(--border-color)'}`,
                  color: 'var(--text-primary)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: opt.color }} />
                {opt.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SaaS Usage analytics metrics */}
      <div className="premium-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-primary)' }}>
          <BarChart3 size={14} />
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>Developer Plan Usage Analytics</h4>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          
          {/* Query quota */}
          <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <span>Monthly Query Limit</span>
              <span>87%</span>
            </div>
            <div style={{ height: '4px', background: '#27272a', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
              <div style={{ width: '87%', height: '100%', background: 'var(--accent-color)' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>1,740 / 2,000 queries consumed</span>
          </div>

          {/* Token limits */}
          <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <span>Embedding Token Quota</span>
              <span>42%</span>
            </div>
            <div style={{ height: '4px', background: '#27272a', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
              <div style={{ width: '42%', height: '100%', background: 'var(--success-color)' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>4.2M / 10.0M tokens indexed</span>
          </div>

          {/* Average Latency */}
          <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Average API Latency</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#fff' }}>1.24s</span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success-color)', display: 'inline-block' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Optimized via Groq LPU inference</span>
          </div>

        </div>
      </div>

      {/* Diagnostics Card */}
      <div className="premium-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-primary)' }}>
          <Cpu size={14} />
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>AI Assistant Capabilities</h4>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'var(--bg-primary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <Database size={14} style={{ color: 'var(--text-secondary)', marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Vector Database</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>ChromaDB persist block indexes codebase structure & comments locally.</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'var(--bg-primary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <Info size={14} style={{ color: 'var(--text-secondary)', marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>RAG Q&A Engine</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Executes vector searches combined with LLM context prompts for specific responses.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
