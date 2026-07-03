import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  TrendingUp, 
  Building2, 
  Database, 
  Cloud, 
  AlertTriangle,
  Play,
  Gauge
} from 'lucide-react';
import { getDigitalTwinProfile, simulateTwinTraffic } from '../api';

export default function EnterpriseDigitalTwin() {
  const [twin, setTwin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadFactor, setLoadFactor] = useState(1.0);
  const [simulating, setSimulating] = useState(false);

  const loadTwin = async () => {
    setLoading(true);
    setError(null);
    try {
      const orgId = "org-enterprise-01";
      const data = await getDigitalTwinProfile(orgId);
      setTwin(data);
    } catch (err) {
      setError(err.message || "Failed to load digital twin profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTwin();
  }, []);

  const triggerSimulation = async (factor) => {
    setLoadFactor(factor);
    setSimulating(true);
    try {
      const orgId = "org-enterprise-01";
      const simulatedData = await simulateTwinTraffic(orgId, factor);
      setTwin(simulatedData);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-color)', marginBottom: '16px' }} />
        <p style={{ fontSize: '15px' }}>Instantiating enterprise digital twin telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ borderLeft: '4px solid var(--danger-color)', padding: '24px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: 'var(--danger-color)' }}>Telemetry Sync Failure</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{error}</p>
      </div>
    );
  }

  if (!twin) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Overview Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-color)', borderRadius: '8px' }}>
            <Gauge size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Ecosystem Health</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: '800', color: '#fff' }}>{twin.health_index}%</h3>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', color: 'var(--success-color)', borderRadius: '8px' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Compliance Index</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: '800', color: '#fff' }}>{twin.compliance_score}%</h3>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(245,158,11,0.1)', color: 'var(--warning-color)', borderRadius: '8px' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Projected Monthly Spend</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: '800', color: '#fff' }}>${twin.monthly_cloud_spend}</h3>
          </div>
        </div>

      </div>

      {/* Main Grid: Topology Inspector & Traffic Cost Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '30px' }}>
        
        {/* Business Units & Asset list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Business Units Tree */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={16} style={{ color: 'var(--accent-color)' }} /> Enterprise Business Units
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {twin.business_units.map((unit, idx) => (
                <div key={idx} style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '13px' }}>{unit.name}</h5>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Leads: {unit.leads.join(', ')}</span>
                  </div>
                  <span style={{
                    padding: '2px 8px',
                    background: unit.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: unit.status === 'active' ? 'var(--success-color)' : 'var(--warning-color)',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '700',
                    textTransform: 'uppercase'
                  }}>{unit.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cloud Assets List */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cloud size={16} style={{ color: 'var(--accent-color)' }} /> Infrastructure Cloud Assets
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {twin.cloud_assets.map((asset, idx) => (
                <div key={idx} style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{asset.name}</span>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: asset.status === 'healthy' ? 'var(--success-color)' : 'var(--warning-color)'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>Type:</span>
                    <span>{asset.asset_type}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>Monthly Cost:</span>
                    <span style={{ color: '#fff', fontWeight: '700' }}>${asset.monthly_cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Load Simulator Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ color: '#fff', fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Play size={14} style={{ color: 'var(--accent-color)' }} /> Traffic Cost Simulation
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5', marginBottom: '20px' }}>
              Slide to scale mock request load factor, projecting scaling costs and warning alerts on the EKS cluster.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#fff' }}>
                <span>Simulated Load Factor:</span>
                <span style={{ fontWeight: '700', color: 'var(--accent-color)' }}>{loadFactor}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={loadFactor}
                onChange={(e) => triggerSimulation(parseFloat(e.target.value))}
                disabled={simulating}
                style={{ width: '100%', accentColor: 'var(--accent-color)' }}
              />
            </div>

            {twin.warnings.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Active Telemetry Warnings</span>
                {twin.warnings.map((warn, wIdx) => (
                  <div key={wIdx} style={{
                    padding: '10px 12px',
                    background: 'rgba(245,158,11,0.05)',
                    borderLeft: '3px solid var(--warning-color)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: 'var(--warning-color)',
                    lineHeight: '1.4'
                  }}>
                    {warn}
                  </div>
                ))}
              </div>
            )}
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

