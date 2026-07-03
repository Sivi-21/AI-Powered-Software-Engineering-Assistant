import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Cloud, 
  BrainCircuit, 
  UserPlus, 
  Database, 
  CheckCircle2, 
  Layers, 
  BarChart3, 
  ArrowRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { getCurrentOrganization, createOrganization, inviteMember } from '../api';

export default function OrganizationCloud() {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("teams");
  
  // Roster inputs
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Developer");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);

  // Create Org inputs
  const [newOrgName, setNewOrgName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const loadOrg = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCurrentOrganization();
      setOrg(data);
    } catch (err) {
      setError(err.message || "Failed to load organization workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrg();
  }, []);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setCreateLoading(true);
    try {
      const data = await createOrganization(newOrgName);
      setOrg(data);
      setNewOrgName("");
    } catch (err) {
      alert("Failed to create organization: " + err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    setInviteLoading(true);
    setInviteError(null);
    try {
      const updatedOrg = await inviteMember(newMemberEmail, newMemberRole);
      setOrg(updatedOrg);
      setNewMemberEmail("");
    } catch (err) {
      setInviteError(err.message || "Failed to invite member.");
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-color)', marginBottom: '16px' }} />
        <p style={{ fontSize: '15px' }}>Loading organization workspace...</p>
      </div>
    );
  }

  // Loader2 fallback if lucide loader is missing
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

  if (!org) {
    return (
      <div className="glass-card" style={{ maxWidth: '500px', margin: '60px auto', padding: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Building2 size={24} style={{ color: 'var(--accent-color)' }} />
          <h3 style={{ margin: 0, color: '#fff' }}>Initialize Organization Cloud</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', marginBottom: '24px' }}>
          Set up a multi-tenant cloud workspace to manage repositories, coordinate teams, connect cloud environments, and share long-term AI memory.
        </p>
        <form onSubmit={handleCreateOrg} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Organization Name (e.g. Acme Corp)"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            disabled={createLoading}
            style={{
              background: 'rgba(10, 9, 21, 0.6)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#fff',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <button type="submit" disabled={createLoading || !newOrgName.trim()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {createLoading ? <Loader2 size={16} /> : <span>Create Workspace</span>}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Executive Jumbotron Banner */}
      <div className="glass-card" style={{
        padding: '32px',
        background: 'linear-gradient(135deg, rgba(30,41,59,0.85) 0%, rgba(15,23,42,0.95) 100%)',
        borderLeft: '4px solid var(--accent-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Building2 size={24} style={{ color: 'var(--accent-color)' }} />
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#fff' }}>{org.name} Workspace</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Active multi-tenant organization cloud managing team members, cloud instances, and shared AI memory.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Workspace Health</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--success-color)' }}>{org.analytics?.health_score || 90}%</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Connected Repos</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{org.repositories?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '2px' }}>
        {[
          { id: "teams", label: "Teams & Developers", icon: <Users size={14} /> },
          { id: "cloud", label: "Cloud Resources", icon: <Cloud size={14} /> },
          { id: "memory", label: "Shared AI Memory", icon: <BrainCircuit size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              border: 'none',
              background: activeSubTab === tab.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              color: activeSubTab === tab.id ? '#fff' : 'var(--text-secondary)',
              borderBottom: activeSubTab === tab.id ? '2px solid var(--accent-color)' : '2px solid transparent',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Workspace Display Grid */}
      <div className="glass-card" style={{ padding: '24px' }}>
        {activeSubTab === "teams" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px' }}>
            {/* Team Roster list */}
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '16px' }}>Developer Team Roster</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {org.teams.map((member, idx) => (
                  <div key={idx} style={{
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>{member.email}</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Joined: {new Date(member.joined_at).toLocaleDateString()}</p>
                    </div>
                    <span style={{
                      padding: '3px 8px',
                      background: member.role === 'Owner' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)',
                      border: member.role === 'Owner' ? '1px solid rgba(59,130,246,0.2)' : '1px solid var(--border-color)',
                      color: member.role === 'Owner' ? 'var(--accent-color)' : 'var(--text-secondary)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>{member.role}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Invite Panel */}
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <UserPlus size={16} style={{ color: 'var(--accent-color)' }} />
                <h5 style={{ margin: 0, color: '#fff', fontSize: '13px' }}>Invite Developer</h5>
              </div>
              <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="email"
                  placeholder="developer@company.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  disabled={inviteLoading}
                  style={{
                    width: '100%',
                    background: 'rgba(10, 9, 21, 0.6)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  disabled={inviteLoading}
                  style={{
                    width: '100%',
                    background: 'rgba(10, 9, 21, 0.6)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Developer">Developer</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
                {inviteError && (
                  <span style={{ fontSize: '11px', color: 'var(--danger-color)' }}>{inviteError}</span>
                )}
                <button type="submit" disabled={inviteLoading || !newMemberEmail.trim()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}>
                  {inviteLoading ? <Loader2 size={14} /> : <><span>Add Member</span><Plus size={12} /></>}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeSubTab === "cloud" && (
          <div>
            <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '16px' }}>Connected Cloud Resources</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {org.cloud_resources.map((res, idx) => (
                <div key={idx} style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    background: 'rgba(59,130,246,0.1)',
                    color: 'var(--accent-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '12px'
                  }}>
                    {res.provider}
                  </div>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#fff' }}>{res.name}</h5>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Type: {res.resource_type}</span>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success-color)', fontSize: '11px', fontWeight: '600' }}>
                    <CheckCircle2 size={12} /> Connected
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === "memory" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Shared AI Memory */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <BrainCircuit size={16} style={{ color: 'var(--accent-color)' }} />
                <h4 style={{ margin: 0, color: '#fff', fontSize: '15px' }}>Shared Organization AI Memory</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {org.shared_memory.map((entry, idx) => (
                  <div key={idx} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    • {entry}
                  </div>
                ))}
              </div>
            </div>

            {/* Knowledge Base files */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Layers size={16} style={{ color: 'var(--warning-color)' }} />
                <h4 style={{ margin: 0, color: '#fff', fontSize: '15px' }}>Shared Knowledge Base</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {org.knowledge_base.map((doc, idx) => (
                  <div key={idx} style={{
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>{doc}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Markdown Document</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
