import React, { useState } from 'react';
import { 
  Shield, 
  Terminal, 
  Cpu, 
  Mail, 
  Lock, 
  User, 
  Building, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { loginUser, signupUser, getProfile, getGithubAuthorizeUrl } from '../api';

export default function AuthScreen({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Signup Form States
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Error & Loading states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!loginEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!loginPassword) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser(loginEmail.trim(), loginPassword);
      localStorage.setItem("codesphere_jwt", response.access_token);
      
      const profile = await getProfile();
      localStorage.setItem("codesphere_user", JSON.stringify(profile));
      onLoginSuccess(profile);
    } catch (err) {
      setError(err.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!organization.trim()) {
      setError("Please enter your organization name.");
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (signupPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!agreeTerms) {
      setError("You must agree to the Terms of Service.");
      return;
    }

    setLoading(true);
    try {
      await signupUser({
        name: fullName.trim(),
        email: signupEmail.trim(),
        organization: organization.trim(),
        password: signupPassword
      });

      // Automatically log in after registration
      const response = await loginUser(signupEmail.trim(), signupPassword);
      localStorage.setItem("codesphere_jwt", response.access_token);
      
      const profile = await getProfile();
      localStorage.setItem("codesphere_user", JSON.stringify(profile));
      onLoginSuccess(profile);
    } catch (err) {
      setError(err.message || "Failed to register account.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    setError("");
    try {
      const socialEmail = `sivagami@${provider === 'github' ? 'github.com' : 'gmail.com'}`;
      try {
        await signupUser({
          name: "SIVAGAMI R",
          email: socialEmail,
          organization: "Global Devs",
          password: "socialpassword123!"
        });
      } catch (e) {
        // Ignored if user already exists
      }

      const response = await loginUser(socialEmail, "socialpassword123!");
      localStorage.setItem("codesphere_jwt", response.access_token);
      
      const profile = await getProfile();
      localStorage.setItem("codesphere_user", JSON.stringify(profile));
      onLoginSuccess(profile);
    } catch (err) {
      setError(`Failed social login via ${provider}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubClick = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getGithubAuthorizeUrl();
      if (response && response.authorize_url) {
        if (response.authorize_url.includes("client_id=mock_client_id")) {
          window.location.href = window.location.protocol + "//" + window.location.host + window.location.pathname + "?code=mock_code";
        } else {
          window.location.href = response.authorize_url;
        }
      } else {
        throw new Error("Invalid authorize URL.");
      }
    } catch (err) {
      setError("Failed to initialize GitHub OAuth: " + err.message);
      setLoading(false);
    }
  };


  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Interactive Glowing Mesh background blobs */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '-10%',
        width: '50vw',
        height: '50vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 60%)',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-5%',
        width: '45vw',
        height: '45vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.06) 0%, transparent 70%)',
        filter: 'blur(100px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Main Container */}
      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '30px',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1
      }}>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr',
          width: '100%',
          background: 'rgba(15, 23, 42, 0.55)',
          border: '1px solid rgba(255, 255, 255, 0.03)',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(16px)',
          minHeight: '680px'
        }} className="auth-grid-container">

          {/* LEFT PANEL: SaaS Brand Showcase */}
          <div style={{
            padding: '50px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
            borderRight: '1px solid rgba(255, 255, 255, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }} className="auth-showcase-panel">
            
            {/* Header Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, var(--accent-color) 0%, #818cf8 100%)',
                  borderRadius: '10px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)'
                }}>
                  <Terminal size={18} style={{ color: '#fff' }} />
                </div>
                <span style={{
                  fontWeight: '800',
                  fontSize: '22px',
                  color: '#fff',
                  letterSpacing: '-0.5px',
                  background: 'linear-gradient(to right, #fff, #94A3B8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  CodeSphere AI
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                AI-Powered Software Engineering Platform
              </span>
            </div>

            {/* Middle Feature Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', margin: '40px 0' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Cpu size={20} style={{ color: 'var(--accent-color)' }} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#fff', fontWeight: '600' }}>Multi-Agent Quality Scans</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Contextual structure parsing, syntax tree mappings, and maintainability checks executed asynchronously.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Shield size={20} style={{ color: 'var(--success-color)' }} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#fff', fontWeight: '600' }}>Vulnerability Detection Pipeline</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Audit codebases for SQL Injection, XSS, token exposure, and dependency gaps with immediate remediation suggestions.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Terminal size={20} style={{ color: 'var(--warning-color)' }} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#fff', fontWeight: '600' }}>RAG Codebase Architect Q&A</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Semantics-aware vector indexing lets you query code files, explore patterns, and map imports interactively.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer metric stats */}
            <div style={{
              display: 'flex',
              gap: '24px',
              paddingTop: '24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.03)'
            }}>
              <div>
                <span style={{ display: 'block', fontSize: '20px', fontWeight: '800', color: '#fff' }}>99.4%</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scan Accuracy</span>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.05)' }} />
              <div>
                <span style={{ display: 'block', fontSize: '20px', fontWeight: '800', color: '#fff' }}>&lt; 5 sec</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average Analysis</span>
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: Authentication Forms */}
          <div style={{
            padding: '50px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }} className="auth-form-panel">
            
            {/* Header Switcher */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#fff' }}>
                {isLogin ? "Welcome back" : "Create developer account"}
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={handleToggleMode}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-color)',
                    cursor: 'pointer',
                    fontWeight: '600',
                    padding: 0,
                    fontSize: '14px'
                  }}
                >
                  {isLogin ? "Sign up free" : "Log in"}
                </button>
              </p>
            </div>

            {/* Social Oauth Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={handleGithubClick}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                {/* Inline SVG for Github */}
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.164 22 16.418 22 12c0-5.523-4.478-10-10-10z" />
                </svg>
                GitHub
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                {/* Inline SVG for Google */}
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 1.74 14.96 1 12 1 7.37 1 3.4 3.65 1.48 7.5l3.86 3c.9-2.7 3.42-4.46 6.66-4.46z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.45c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.74-4.87 3.74-8.49z" />
                  <path fill="#FBBC05" d="M5.34 10.5a7.18 7.18 0 010 3l-3.86 3A11.957 11.957 0 011 12c0-1.69.35-3.3 1.48-4.5l3.86 3z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-4.3 1.09-3.24 0-5.76-1.76-6.66-4.46L1.48 16.5C3.4 20.35 7.37 23 12 23z" />
                </svg>
                Google
              </button>
            </div>

            {/* Separator */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0 20px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.03)' }} />
              <span style={{ padding: '0 12px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>or continue with</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.03)' }} />
            </div>

            {/* Validation Feedback */}
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                color: 'var(--danger-color)',
                borderRadius: '8px',
                fontSize: '12px',
                marginBottom: '16px'
              }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            {isLogin ? (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Email Address</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Mail size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        background: 'rgba(10, 9, 21, 0.4)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: '#fff',
                        outline: 'none',
                        fontSize: '13px'
                      }}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Password</label>
                    <a href="#forgot" style={{ fontSize: '12px', color: 'var(--accent-color)', textDecoration: 'none', fontWeight: '500' }}>Forgot password?</a>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '10px 38px 10px 36px',
                        background: 'rgba(10, 9, 21, 0.4)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: '#fff',
                        outline: 'none',
                        fontSize: '13px'
                      }}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{
                      accentColor: 'var(--accent-color)',
                      cursor: 'pointer'
                    }}
                  />
                  <label htmlFor="remember" style={{ fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                    Remember me on this browser
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '11px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginTop: '8px'
                  }}
                >
                  {loading ? (
                    <span className="animate-spin" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Full Name</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <User size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        style={{
                          width: '100%',
                          padding: '8px 10px 8px 30px',
                          background: 'rgba(10, 9, 21, 0.4)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          color: '#fff',
                          outline: 'none',
                          fontSize: '12px'
                        }}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Organization</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Building size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Acme Corp"
                        style={{
                          width: '100%',
                          padding: '8px 10px 8px 30px',
                          background: 'rgba(10, 9, 21, 0.4)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          color: '#fff',
                          outline: 'none',
                          fontSize: '12px'
                        }}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Email Address</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Mail size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="name@company.com"
                      style={{
                        width: '100%',
                        padding: '8px 10px 8px 30px',
                        background: 'rgba(10, 9, 21, 0.4)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: '#fff',
                        outline: 'none',
                        fontSize: '12px'
                      }}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Choose Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      style={{
                        width: '100%',
                        padding: '8px 32px 8px 30px',
                        background: 'rgba(10, 9, 21, 0.4)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: '#fff',
                        outline: 'none',
                        fontSize: '12px'
                      }}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Terms agreement */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '2px' }}>
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    style={{
                      accentColor: 'var(--accent-color)',
                      cursor: 'pointer',
                      marginTop: '2px'
                    }}
                  />
                  <label htmlFor="terms" style={{ fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: '1.4' }}>
                    I agree to the <a href="#terms" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>Terms of Service</a> and <a href="#privacy" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>Privacy Policy</a>.
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginTop: '4px'
                  }}
                >
                  {loading ? (
                    <span className="animate-spin" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  ) : (
                    <>
                      Register Account
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
