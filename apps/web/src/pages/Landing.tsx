import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const handleWaitlist = () => {
    window.open('https://themanager.music', '_blank');
  };

  const handleDemo = () => {
    window.open('https://themanager.music', '_blank');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* ── NAV ── */}
      <nav
        style={{
          background: '#111111',
          borderBottom: '1px solid var(--border)',
          paddingTop: 'var(--sat)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="hidden md:block w-48" />
            <div className="flex items-center">
              <img
                src="/The Manager_Logo_PNG-2.png"
                alt="The Manager"
                className="h-6 md:h-8 object-contain invert"
              />
            </div>
            <div className="flex items-center gap-3 md:gap-4 md:w-48 justify-end">
              <button
                onClick={() => navigate('/login')}
                className="text-xs md:text-sm font-medium transition-colors"
                style={{ color: 'var(--t3)' }}
              >
                Sign Up
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        className="min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-90px)] flex items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <div className="text-center px-5 md:px-6 py-12 md:py-20">
          <h1
            className="text-[3.5rem] sm:text-[5rem] md:text-[10rem] lg:text-[12rem] font-black leading-[0.85] tracking-tighter mb-2 md:mb-4"
            style={{ color: 'var(--t1)' }}
          >
            RUN THE
          </h1>
          <h1
            className="text-[3.5rem] sm:text-[5rem] md:text-[10rem] lg:text-[12rem] font-black leading-[0.85] tracking-tighter mb-8 md:mb-12"
            style={{ color: 'var(--brand-1)' }}
          >
            SHOW
          </h1>
          <p
            className="text-base md:text-xl max-w-2xl mx-auto mb-2 md:mb-4 font-medium"
            style={{ color: 'var(--t2)' }}
          >
            The first truly all-in-one artist management platform.
          </p>
          <p
            className="text-base md:text-xl max-w-2xl mx-auto mb-8 md:mb-12 font-medium"
            style={{ color: 'var(--t3)' }}
          >
            Built for managers by managers
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-6 justify-center px-4 sm:px-0">
            <button
              onClick={handleWaitlist}
              className="btn-primary px-8 py-4 text-sm tracking-wide"
            >
              join the waitlist
            </button>
            <button
              onClick={handleDemo}
              className="btn-secondary px-8 py-4 text-sm tracking-wide"
            >
              request free demo
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        id="features"
        className="min-h-screen flex items-center justify-center px-5 md:px-6 py-16 md:py-20"
        style={{ background: 'var(--surface)' }}
      >
        <div className="text-center max-w-4xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-medium mb-8 md:mb-10"
            style={{
              border: '1px solid rgba(68,170,153,0.3)',
              color: 'var(--brand-1)',
              background: 'var(--status-green-bg)',
            }}
          >
            Artist Management Reimagined
          </div>
          <h2
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-3 md:mb-4 leading-tight tracking-tight"
            style={{ color: 'var(--t1)' }}
          >
            The Complete Platform for
          </h2>
          <h2
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-6 md:mb-8 leading-tight tracking-tight italic"
            style={{ color: 'var(--brand-1)' }}
          >
            Artist Management
          </h2>
          <p
            className="text-base md:text-xl max-w-3xl mx-auto mb-10 md:mb-12 leading-relaxed"
            style={{ color: 'var(--t3)' }}
          >
            From tour logistics to catalog management, financial tracking to contract analysis.
            Everything you need to manage your artists, all in one powerful platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4 sm:px-0">
            <button
              onClick={() => navigate('/login')}
              className="btn-primary px-8 py-4 flex items-center justify-center gap-2"
            >
              Get Started
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary px-8 py-4"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="py-6 md:py-8 px-5 md:px-6"
        style={{
          background: '#111111',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <img
                src="/The Manager_Logo_PNG-2.png"
                alt="The Manager"
                className="h-4 md:h-5 object-contain invert"
              />
            </div>
            <div className="text-xs md:text-sm" style={{ color: 'var(--t3)' }}>
              &copy; 2025 The Manager. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
