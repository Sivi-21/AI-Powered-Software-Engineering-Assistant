import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileCode2, Mail, Lock, User, AlertCircle, ArrowLeft, ShieldCheck, Cpu } from 'lucide-react';
import { signupUser, loginUser, getProfile } from '../api';


export default function SignupPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organization, setOrganization] = useState('My Workgroup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await signupUser({
        name: name.trim(),
        email: email.trim(),
        organization: organization.trim(),
        password: password
      });

      // Automatically log in after registration
      const response = await loginUser(email.trim(), password);
      localStorage.setItem('codesphere_jwt', response.access_token);
      
      const profile = await getProfile();
      localStorage.setItem('codesphere_user', JSON.stringify(profile));
      onLoginSuccess(profile);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: "'Inter', sans-serif"
    }}>
      
      {/* LEFT SIDE: BRANDING PANEL */}
      <div style={{
        flex: 1,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Top brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <FileCode2 size={24} style={{ color: 'var(--accent-color)' }} />
          <span style={{ fontWeight: '700', fontSize: '20px' }}>CodeSphere AI</span>
        </div>

        {/* Center illustration & descriptions */}
        <div style={{ maxWidth: '480px', zIndex: 1 }}>
          <span style={{ color: 'var(--accent-color)', fontWeight: '600', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            AI-Powered Software Engineering
          </span>
          <h2 style={{ fontSize: '38px', fontWeight: '800', margin: '16px 0 20px 0', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
            Build Better Software with AI
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.7', margin: 0 }}>
            Create an account to analyze software repositories, review code quality, detect vulnerabilities, and index codebase documentation.
          </p>

          <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldCheck size={20} style={{ color: 'var(--success-color)' }} />
              <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Automated compliance & security check gates</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Cpu size={20} style={{ color: 'var(--accent-color)' }} />
              <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Intelligent architectural digital twins mapping</span>
            </div>
          </div>
        </div>

        {/* Bottom footer toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
          <button 
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '15px' }}
          >
            <ArrowLeft size={16} /> Back to Landing
          </button>
        </div>
      </div>

      {/* RIGHT SIDE: AUTHENTICATION CONTAINER */}
      <div style={{
        width: '560px',
        padding: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div className="glass-card" style={{ width: '100%', padding: '40px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', background: 'var(--bg-secondary)' }}>
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>Get Started</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 }}>
              Create your profile credentials.
            </p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(220, 38, 38, 0.06)', border: '1px solid rgba(220, 38, 38, 0.2)', color: 'var(--danger-color)', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe" 
                  style={{ paddingLeft: '44px', width: '100%', height: '48px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '15px' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  style={{ paddingLeft: '44px', width: '100%', height: '48px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '15px' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters" 
                  style={{ paddingLeft: '44px', width: '100%', height: '48px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '15px' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password" 
                  style={{ paddingLeft: '44px', width: '100%', height: '48px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '15px' }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', height: '48px' }} disabled={loading}>
              {loading ? 'Registering...' : 'Create Account'}
            </button>
          </form>

          <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '15px', color: 'var(--text-secondary)', margin: '24px 0 0 0' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent-color)', fontWeight: '600' }}>Login</Link>
          </p>
        </div>
      </div>

    </div>
  );
}
