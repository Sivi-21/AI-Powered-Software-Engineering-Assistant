import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileCode2, Mail, Lock, AlertCircle, ArrowLeft, ShieldCheck, Cpu } from 'lucide-react';
import { loginUser, getProfile, loginWithGoogle } from '../api';
import { GoogleLogin } from '@react-oauth/google';


export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    console.log("Google Client ID =", import.meta.env.VITE_GOOGLE_CLIENT_ID);
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (clientId) {
      console.log("[Diagnostics] Google Client ID loaded:", clientId.substring(0, 10) + "...");
      console.log("[Diagnostics] OAuth initialized");
    } else {
      console.warn("[Diagnostics] Google Client ID is missing.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser(email.trim(), password);
      localStorage.setItem('codesphere_jwt', response.access_token);

      const profile = await getProfile();
      localStorage.setItem('codesphere_user', JSON.stringify(profile));
      onLoginSuccess(profile);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to authenticate.');
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
            Enterprise Repository Intelligence
          </span>
          <h2 style={{ fontSize: '38px', fontWeight: '800', margin: '16px 0 20px 0', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
            Secure and Optimize Your Codebases
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.7', margin: 0 }}>
            Automate audits, trace architecture pipelines, and fix code smells at the speed of Groq LPU inference.
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
            <h3 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>Welcome Back</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 }}>
              Enter your credentials to access your workspace.
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>Password</label>
                <span style={{ fontSize: '14px', color: 'var(--accent-color)', cursor: 'pointer' }}>Forgot Password?</span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingLeft: '44px', width: '100%', height: '48px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '15px' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
              />
              <label htmlFor="remember" style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>Remember me for 30 days</label>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', height: '48px' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            {!import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <div style={{
                color: 'var(--danger-color)',
                fontSize: '14px',
                textAlign: 'center',
                padding: '12px',
                border: '1px solid rgba(220, 38, 38, 0.2)',
                background: 'rgba(220, 38, 38, 0.05)',
                borderRadius: '6px',
                width: '100%',
                lineHeight: '1.5'
              }}>
                Google Authentication is not configured. Please configure VITE_GOOGLE_CLIENT_ID.
              </div>
            ) : (
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  console.log("[Diagnostics] Google Login Success");
                  setError('');
                  setLoading(true);
                  try {
                    const response = await loginWithGoogle(credentialResponse.credential);
                    localStorage.setItem('codesphere_jwt', response.access_token);
                    localStorage.setItem('codesphere_refresh', response.refresh_token);
                    localStorage.setItem('codesphere_user', JSON.stringify(response.user));
                    onLoginSuccess(response.user);
                    navigate('/dashboard');
                  } catch (err) {
                    setError(err.message || 'Google authentication failed.');
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => {
                  console.error("[Diagnostics] Google Login Failure");
                  setError('Google Sign-In failed. Please try again.');
                }}
                useOneTap
                theme="outline"
                shape="rectangular"
                text="continue_with"
                width="380px"
              />
            )}
          </div>

          <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '15px', color: 'var(--text-secondary)', margin: '24px 0 0 0' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--accent-color)', fontWeight: '600' }}>Create Account</Link>
          </p>
        </div>
      </div>

    </div>
  );
}
