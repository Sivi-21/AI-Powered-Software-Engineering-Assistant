import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileCode2, 
  GitBranch, 
  ShieldCheck, 
  BookOpen, 
  Layers, 
  Network, 
  ArrowRight, 
  Users, 
  Activity, 
  Terminal,
  Compass
} from 'lucide-react';


export default function LandingPage() {
  const navigate = useNavigate();


  // Animated counters state
  const [stats, setStats] = useState({ repos: 0, reviews: 0, issues: 0, insights: 0 });

  useEffect(() => {
    const duration = 2000;
    const steps = 50;
    const stepTime = duration / steps;
    let step = 0;

    const targetRepos = 1420;
    const targetReviews = 8450;
    const targetIssues = 3120;
    const targetInsights = 12800;

    const timer = setInterval(() => {
      step++;
      setStats({
        repos: Math.floor((targetRepos / steps) * step),
        reviews: Math.floor((targetReviews / steps) * step),
        issues: Math.floor((targetIssues / steps) * step),
        insights: Math.floor((targetInsights / steps) * step),
      });

      if (step >= steps) {
        clearInterval(timer);
        setStats({ repos: targetRepos, reviews: targetReviews, issues: targetIssues, insights: targetInsights });
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <GitBranch size={24} style={{ color: 'var(--accent-color)' }} />,
      title: 'Repository Intelligence',
      desc: 'Analyze repositories automatically to index code structure and documentation.'
    },
    {
      icon: <FileCode2 size={24} style={{ color: 'var(--accent-color)' }} />,
      title: 'AI Code Review',
      desc: 'Detect bugs, code smells, and suggest clean-code refactoring structures.'
    },
    {
      icon: <ShieldCheck size={24} style={{ color: 'var(--accent-color)' }} />,
      title: 'Security Analysis',
      desc: 'Find critical vulnerabilities, dependencies exposure, and audit compliance.'
    },
    {
      icon: <BookOpen size={24} style={{ color: 'var(--accent-color)' }} />,
      title: 'AI Documentation',
      desc: 'Generate, maintain, and publish high-quality technical codebase summaries.'
    },
    {
      icon: <Layers size={24} style={{ color: 'var(--accent-color)' }} />,
      title: 'Architecture Insights',
      desc: 'Understand software component interactions, flow dependencies, and architectural maps.'
    },
    {
      icon: <Network size={24} style={{ color: 'var(--accent-color)' }} />,
      title: 'Engineering Knowledge Graph',
      desc: 'Visualize relations, class layouts, and function traces across files.'
    }
  ];

  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER NAVIGATION */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 40px',
        height: '72px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: 'var(--shadow-navbar)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <FileCode2 size={24} style={{ color: 'var(--accent-color)' }} />
          <span style={{ fontWeight: '700', fontSize: '20px', letterSpacing: '-0.02em' }}>CodeSphere AI</span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a href="#features" style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '500' }}>Features</a>
          <span style={{ fontSize: '15px', color: 'var(--text-muted)', cursor: 'not-allowed', fontWeight: '500' }}>Pricing (Coming Soon)</span>
          <a href="#about" style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '500' }}>About</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '500' }}>Documentation</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="btn-secondary" 
            style={{ height: '40px', padding: '0 16px', borderRadius: '8px', fontSize: '15px' }}
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          <button 
            className="btn-primary" 
            style={{ height: '40px', padding: '0 16px', borderRadius: '8px', fontSize: '15px' }}
            onClick={() => navigate('/signup')}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <main style={{ flex: 1 }}>
        <section style={{ padding: '80px 40px 100px 40px', maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div>
            <span style={{ color: 'var(--accent-color)', fontWeight: '600', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>Introducing CodeSphere AI</span>
            <h1 style={{ fontSize: '56px', fontWeight: '800', lineHeight: '1.15', margin: '16px 0 24px 0', letterSpacing: '-0.03em' }}>
              Build Better Software with AI
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: '1.8', margin: '0 0 36px 0', maxWidth: '600px' }}>
              Analyze repositories, review code, detect vulnerabilities, generate documentation, and improve software quality using intelligent AI agents.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn-primary" style={{ padding: '0 28px', height: '48px' }} onClick={() => navigate('/signup')}>
                Get Started <ArrowRight size={16} />
              </button>
              <button className="btn-secondary" style={{ padding: '0 28px', height: '48px' }} onClick={() => navigate('/login')}>
                Watch Demo
              </button>
            </div>
          </div>

          {/* Hero Illustration */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            minHeight: '400px',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
            </div>
            
            <div style={{ fontFamily: 'monospace', fontSize: '15px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--accent-color)' }}>$</span>
                <span>codesphere analyze ./repository</span>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }}>
                <div style={{ color: 'var(--success-color)', fontWeight: '600', marginBottom: '8px' }}>✓ Analysis Complete</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>• Files scanned: 1,248</span>
                  <span>• Vulnerabilities found: 0</span>
                  <span>• Architecture depth: Level 4</span>
                </div>
              </div>
            </div>

            {/* Illustration badges overlay */}
            <div style={{ position: 'absolute', bottom: '-20px', left: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '12px 20px', borderRadius: '12px', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} style={{ color: 'var(--success-color)' }} />
              <span style={{ fontSize: '14px', fontWeight: '600' }}>Security Verified</span>
            </div>

            <div style={{ position: 'absolute', top: '40px', right: '-20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '12px 20px', borderRadius: '12px', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={20} style={{ color: 'var(--accent-color)' }} />
              <span style={{ fontSize: '14px', fontWeight: '600' }}>AI Review Ready</span>
            </div>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" style={{ padding: '100px 40px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <span style={{ color: 'var(--accent-color)', fontWeight: '600', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>Core Capabilities</span>
              <h2 style={{ fontSize: '38px', fontWeight: '700', margin: '12px 0 16px 0', letterSpacing: '-0.02em' }}>Everything you need for engineering intelligence</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '17px', maxWidth: '600px', margin: '0 auto' }}>Streamlined workflows designed specifically to help software engineering organizations ship robust products.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              {features.map((f, i) => (
                <div key={i} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>{f.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0, lineHeight: '1.6' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STATISTICS SECTION */}
        <section style={{ padding: '80px 40px', maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '48px', fontWeight: '800', color: 'var(--accent-color)', letterSpacing: '-0.03em' }}>{stats.repos.toLocaleString()}+</div>
              <div style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '8px' }}>Repositories Analyzed</div>
            </div>
            <div>
              <div style={{ fontSize: '48px', fontWeight: '800', color: 'var(--accent-color)', letterSpacing: '-0.03em' }}>{stats.reviews.toLocaleString()}+</div>
              <div style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '8px' }}>AI Reviews Generated</div>
            </div>
            <div>
              <div style={{ fontSize: '48px', fontWeight: '800', color: 'var(--accent-color)', letterSpacing: '-0.03em' }}>{stats.issues.toLocaleString()}+</div>
              <div style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '8px' }}>Security Issues Found</div>
            </div>
            <div>
              <div style={{ fontSize: '48px', fontWeight: '800', color: 'var(--accent-color)', letterSpacing: '-0.03em' }}>{stats.insights.toLocaleString()}+</div>
              <div style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '8px' }}>Engineering Insights</div>
            </div>
          </div>
        </section>

        {/* WHY CODESPHERE SECTION */}
        <section id="about" style={{ padding: '100px 40px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <span style={{ color: 'var(--accent-color)', fontWeight: '600', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>Enterprise Choice</span>
              <h2 style={{ fontSize: '38px', fontWeight: '700', margin: '12px 0 16px 0', letterSpacing: '-0.02em' }}>Designed for Modern Teams</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '48px' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '16px' }}>Security First</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
                  We index metadata using local vectors. Code base logic remains completely safe within your cloud environment.
                </p>
              </div>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '16px' }}>Groq LPUs Powered</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
                  Enjoy rapid queries processing and analysis times without long background build cycles.
                </p>
              </div>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '16px' }}>Multi-Language</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
                  Seamless analysis maps across Python, React/JavaScript, Node, Go, Rust, Java, and C++ workspaces.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section style={{ padding: '100px 40px', maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{ color: 'var(--accent-color)', fontWeight: '600', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>Trusted By Builders</span>
            <h2 style={{ fontSize: '38px', fontWeight: '700', margin: '12px 0 16px 0', letterSpacing: '-0.02em' }}>What engineering teams are saying</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div className="glass-card" style={{ padding: '36px', borderRadius: '16px' }}>
              <p style={{ fontStyle: 'italic', fontSize: '16px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '24px' }}>
                "CodeSphere AI completely changed how we onboard new developers. The architectural insights and auto documentation generated saved us weeks of engineering ramp time."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>JD</div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>John Doe</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Lead Infrastructure Engineer</div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '36px', borderRadius: '16px' }}>
              <p style={{ fontStyle: 'italic', fontSize: '16px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '24px' }}>
                "We use CodeSphere's security analysis as a standard gate before merges. The agents catch dependency conflicts and architecture smells that other scanners miss."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>AS</div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>Alice Smith</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>VP of Software Quality</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        padding: '60px 40px 40px 40px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '40px', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <FileCode2 size={20} style={{ color: 'var(--accent-color)' }} />
              <span style={{ fontWeight: '700', fontSize: '18px' }}>CodeSphere AI</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '300px', margin: 0, lineHeight: '1.6' }}>
              AI-Powered Software Engineering Platform to index, audit, and optimize codebases.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '60px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Links</span>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>GitHub</a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Documentation</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Legal</span>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', cursor: 'pointer' }}>Privacy Policy</span>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', cursor: 'pointer' }}>Terms of Service</span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1280px', margin: '0 auto', borderTop: '1px solid var(--border-color)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
          <span>© {new Date().getFullYear()} CodeSphere AI. All rights reserved.</span>
          <span>Version 1.2.0</span>
        </div>
      </footer>
    </div>
  );
}
