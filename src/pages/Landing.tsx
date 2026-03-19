import { useNavigate } from 'react-router-dom';
import { Zap, ChevronRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const handleWaitlist = () => {
    window.open('https://themanager.music', '_blank');
  };

  const handleDemo = () => {
    window.open('https://themanager.music', '_blank');
  };

  return (
    <div className="min-h-screen">
      <nav
        className="bg-white border-b border-black"
        style={{ paddingTop: 'var(--sat)' }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="hidden md:block w-48" />
            <div className="flex items-center">
              <img
                src="/TM-Icono-negro.png"
                alt="The Manager"
                className="h-12 w-12 md:h-20 md:w-20"
              />
            </div>
            <div className="flex items-center gap-3 md:gap-4 md:w-48 justify-end">
              <button
                onClick={() => navigate('/login')}
                className="text-xs md:text-sm font-medium text-black hover:text-gray-600 transition-colors"
              >
                Sign Up
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-white bg-black hover:bg-gray-800 active:bg-gray-700 transition-colors"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-90px)] flex items-center justify-center bg-white">
        <div className="text-center px-5 md:px-6 py-12 md:py-20">
          <h1 className="text-[3.5rem] sm:text-[5rem] md:text-[10rem] lg:text-[12rem] font-black text-black leading-[0.85] tracking-tighter mb-2 md:mb-4">
            RUN THE
          </h1>
          <h1 className="text-[3.5rem] sm:text-[5rem] md:text-[10rem] lg:text-[12rem] font-black text-black leading-[0.85] tracking-tighter mb-8 md:mb-12">
            SHOW
          </h1>
          <p className="text-base md:text-xl text-black max-w-2xl mx-auto mb-2 md:mb-4 font-medium">
            The first truly all-in-one artist management platform.
          </p>
          <p className="text-base md:text-xl text-black max-w-2xl mx-auto mb-8 md:mb-12 font-medium">
            Built for managers by managers
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-6 justify-center px-4 sm:px-0">
            <button
              onClick={handleWaitlist}
              className="px-8 py-4 bg-black text-white font-medium text-sm tracking-wide hover:bg-gray-900 active:bg-gray-800 transition-all"
            >
              join the waitlist
            </button>
            <button
              onClick={handleDemo}
              className="px-8 py-4 bg-transparent text-black font-medium text-sm tracking-wide border-2 border-black hover:bg-black/10 active:bg-black/5 transition-all"
            >
              request free demo
            </button>
          </div>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center bg-black px-5 md:px-6 py-16 md:py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#00a651]/50 rounded-full text-xs md:text-sm font-medium text-[#00a651] mb-8 md:mb-10">
            <Zap className="w-4 h-4" />
            Artist Management Reimagined
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-3 md:mb-4 leading-tight tracking-tight">
            The Complete Platform for
          </h2>
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-[#00a651] mb-6 md:mb-8 leading-tight tracking-tight italic">
            Artist Management
          </h2>
          <p className="text-gray-400 text-base md:text-xl max-w-3xl mx-auto mb-10 md:mb-12 leading-relaxed">
            From tour logistics to catalog management, financial tracking to contract analysis. Everything you need to manage your artists, all in one powerful platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4 sm:px-0">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-[#00a651] text-white font-medium rounded-lg hover:bg-[#00a651]/90 active:bg-[#00a651]/80 transition-all flex items-center justify-center gap-2"
            >
              Get Started
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 active:bg-gray-600 transition-all"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-6 md:py-8 px-5 md:px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <img
                src="/TM-Icono-negro.png"
                alt="The Manager"
                className="h-7 w-7 md:h-8 md:w-8 invert"
              />
              <span className="text-base md:text-lg font-bold text-white">THE MANAGER</span>
            </div>
            <div className="text-gray-400 text-xs md:text-sm">
              &copy; 2025 The Manager. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
