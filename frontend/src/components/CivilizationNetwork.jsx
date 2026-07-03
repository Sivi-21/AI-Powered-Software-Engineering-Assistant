import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Building2, 
  Share2, 
  ShieldCheck, 
  Activity, 
  BarChart3, 
  Users,
  CheckCircle,
  Clock,
  Plus
} from 'lucide-react';
import { getCivilizationOverview, sharePolicyCrossTenant } from '../api';

export default function CivilizationNetwork() {
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Policy share input form
  const [policyName, setPolicyName] = useState("");
  const [sourceOrg, setSourceOrg] = useState("");
  const [targetsInput, setTargetsInput] = useState("");
  const [shareLoading, setShareLoading] = useState(false);

  const loadNetwork = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCivilizationOverview();
      setNetworkData(data);
    } catch (err) {
      setError(err.message || "Failed to load civilization network.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNetwork();
  }, []);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!policyName.trim() || !sourceOrg.trim() || !targetsInput.trim()) return;
    setShareLoading(true);
    try {
      const targets = targetsInput.split(',').map(t => t.trim()).filter(Boolean);
      const updated = await sharePolicyCrossTenant(policyName, sourceOrg, targets);
      setNetworkData(updated);
      setPolicyName("");
      setSourceOrg("");
      setTargetsInput("");
      alert("Policy shared successfully across targeted organizational boundaries!");
    } catch (err) {
      alert("Failed to share policy: " + err.message);
    } finally {
      setShareLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-color)', marginBottom: '16px' }} />
        <p style={{ fontSize: '15px' }}>Retrieving civilization network topology...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ borderLeft: '4px solid var(--danger-color)', padding: '24px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: 'var(--danger-color)' }}>Network Loading Failure</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{error}</p>
      </div>
    );
  }

  if (!networkData) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Civilization Overview Jumbotron */}
      <div className="glass-card" style={{
        padding: '32px',
        background: 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)',
        borderLeft: '4px solid var(--accent-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Network size={28} style={{ color: 'var(--accent-color)' }} />
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#fff' }}>Global AI Civilization</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Operating system orchestrating secure workspace collaborations, standards replication, and unified analytics.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '30px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Active Orgs</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{networkData.metrics?.total_organizations}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Active Agents</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-color)' }}>{networkData.metrics?.total_collaborative_agents}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Patched Issues</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--success-color)' }}>{networkData.metrics?.security_alerts_patched}</span>
          </div>
        </div>
      </div>

      {/* Network Nodes map & Share Policy form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '30px' }}>
        
        {/* Interconnected Organization Node Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={16} style={{ color: 'var(--accent-color)' }} /> Connected Workspace Nodes
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {networkData.organizations.map((org, idx) => (
                <div key={org.id} style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{org.name}</span>
                    <span style={{
                      padding: '2px 6px',
                      background: 'rgba(16,185,129,0.1)',
                      color: 'var(--success-color)',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '700'
                    }}>Active</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span>Health Score:</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>{org.health_score}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span>Repositories:</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>{org.connected_repos_count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shared Policy registry list */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} style={{ color: 'var(--success-color)' }} /> Civilization Policy Registry
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {networkData.shared_policy_registry.map((reg, idx) => (
                <div key={idx} style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <div>
                    <h5 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '13px' }}>{reg.policy_name}</h5>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Publisher: {reg.source_org}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Shared with:</span>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {reg.shared_with.map((target, tIdx) => (
                        <span key={tIdx} style={{
                          padding: '2px 6px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '4px',
                          fontSize: '9px',
                          color: '#fff'
                        }}>{target}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Share Policy Form */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="glass-card" style={{ padding: '24px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <Share2 size={16} style={{ color: 'var(--accent-color)' }} />
              <h4 style={{ margin: 0, color: '#fff', fontSize: '14px' }}>Replicate Policy Standards</h4>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5', marginBottom: '20px' }}>
              Publish architectural governance or security standards cross-tenant to align multiple engineering divisions securely.
            </p>
            <form onSubmit={handleShare} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Policy standard Name</span>
                <input
                  type="text"
                  placeholder="e.g. Strict Production Docker constraints"
                  value={policyName}
                  onChange={(e) => setPolicyName(e.target.value)}
                  disabled={shareLoading}
                  required
                  style={{
                    background: 'rgba(10, 9, 21, 0.6)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Publisher Organization</span>
                <input
                  type="text"
                  placeholder="e.g. Acme Systems"
                  value={sourceOrg}
                  onChange={(e) => setSourceOrg(e.target.value)}
                  disabled={shareLoading}
                  required
                  style={{
                    background: 'rgba(10, 9, 21, 0.6)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Target Organizations (Comma separated)</span>
                <input
                  type="text"
                  placeholder="e.g. Globex Corp, Hooli Tech"
                  value={targetsInput}
                  onChange={(e) => setTargetsInput(e.target.value)}
                  disabled={shareLoading}
                  required
                  style={{
                    background: 'rgba(10, 9, 21, 0.6)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>

              <button type="submit" disabled={shareLoading || !policyName.trim() || !sourceOrg.trim() || !targetsInput.trim()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}>
                {shareLoading ? <span>Processing...</span> : <><span>Share Policy</span><Plus size={12} /></>}
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}

function Loader2({ className, size, style }) {
  return (
    <div className={className} style={{
      width: size || 24,
      height: size || 24,
      border: '3px solid rgba(59,130,246,0.1)',
      borderTop: '3px solid var(--accent-color)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      ...style
    }} />
  );
}

