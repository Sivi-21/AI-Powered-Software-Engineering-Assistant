import React, { useEffect, useState } from 'react';
import { Settings, Server, ShieldCheck, Database, Info, Cpu, BarChart3, Palette } from 'lucide-react';

export default function SettingsView() {
  const [dbStatus, setDbStatus] = useState("Checking...");
  const [backendUrl] = useState("http://127.0.0.1:8001/api/v1");
  const [activeAccent, setActiveAccent] = useState(() => {
    return localStorage.getItem('saas-accent') || 'blue';
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
      root.style.setProperty('--accent-color', '#A855F7');
      root.style.setProperty('--accent-glow', 'rgba(168, 85, 247, 0.3)');
    } else if (theme === 'emerald') {
      root.style.setProperty('--accent-color', '#10B981');
      root.style.setProperty('--accent-glow', 'rgba(16, 185, 129, 0.3)');
    } else if (theme === 'amber') {
      root.style.setProperty('--accent-color', '#F59E0B');
      root.style.setProperty('--accent-glow', 'rgba(245, 158, 11, 0.3)');
    } else {
      // Default Blue
      root.style.setProperty('--accent-color', '#3B82F6');
      root.style.setProperty('--accent-glow', 'rgba(59, 130, 246, 0.3)');
    }
  };

  // Run on mount to apply stored theme
  useEffect(() => {
    changeAccent(activeAccent);
  }, []);

  const themeOptions = [
    { id: 'blue', name: 'Cyber Blue', color: '#3B82F6' },
    { id: 'purple', name: 'Neon Purple', color: '#A855F7' },
    { id: 'emerald', name: 'Emerald Mint', color: '#10B981' },
    { id: 'amber', name: 'Sunset Amber', color: '#F59E0B' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
        <Settings size={22} />
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>SaaS Portal & Config Settings</h3>
      </div>

      <div className="grid-cols-2">
        {/* Connection card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)' }}>
            <Server size={18} />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Backend Pipeline Link</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>API Base URL</span>
              <code style={{ color: 'var(--accent-color)', fontFamily: 'Consolas, monospace' }}>{backendUrl}</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
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
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)' }}>
            <Palette size={18} />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Personalize Accent Theme</h4>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
            Customize your portal brand colors instantly (changes apply globally across all views).
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {themeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => changeAccent(opt.id)}
                style={{
                  background: activeAccent === opt.id ? 'rgba(255,255,255,0.03)' : 'transparent',
                  border: `1px solid ${activeAccent === opt.id ? 'var(--accent-color)' : 'var(--border-color)'}`,
                  color: activeAccent === opt.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: opt.color }} />
                {opt.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SaaS Usage analytics metrics */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--accent-color)' }}>
          <BarChart3 size={18} />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Developer Plan Usage Analytics</h4>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          
          {/* Query quota */}
          <div style={{ background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <span>Monthly Query Limit</span>
              <span>87%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ width: '87%', height: '100%', background: 'var(--accent-color)' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>1,740 / 2,000 queries consumed</span>
          </div>

          {/* Token limits */}
          <div style={{ background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <span>Embedding Token Quota</span>
              <span>42%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ width: '42%', height: '100%', background: 'var(--success-color)' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>4.2M / 10.0M tokens indexed</span>
          </div>

          {/* Average Latency */}
          <div style={{ background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Average API Latency</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>1.24s</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-color)', display: 'inline-block', boxShadow: '0 0 8px var(--success-color)' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Optimized via Groq LPU inference</span>
          </div>

        </div>
      </div>

      {/* Diagnostics Card */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--info-color)' }}>
          <Cpu size={18} />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>AI Assistant Capabilities</h4>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(255, 255, 255, 0.01)', padding: '12px', borderRadius: '8px' }}>
            <Database size={16} style={{ color: 'var(--accent-color)', marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Vector Database</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ChromaDB persist block indexes codebase structure & comments locally.</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(255, 255, 255, 0.01)', padding: '12px', borderRadius: '8px' }}>
            <Info size={16} style={{ color: 'var(--success-color)', marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>RAG Q&A Engine</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Executes vector searches combined with LLM context prompts for specific responses.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
