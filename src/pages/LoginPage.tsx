import React, { useState } from 'react';
import {
  Zap,
  Building,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Bot,
  CalendarCheck,
  Award,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, signInAsDemoUser, error: authError } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLocalError(null);
    setLoadingGoogle(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Google sign-in was interrupted.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleDemoLogin = async (role: 'OWNER' | 'SALES_REP') => {
    setLocalError(null);
    setLoadingDemo(true);
    try {
      await signInAsDemoUser(role);
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Demo session initialization failed.');
    } finally {
      setLoadingDemo(false);
    }
  };

  const features = [
    {
      icon: Bot,
      title: 'Real-Time Lead Qualification',
      desc: 'Instant intent scoring (0–100) and hot/warm/cold temperature triage for Indian real estate buyers.',
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp Follow-Up Engine',
      desc: 'Multilingual Hinglish & English responses without hallucinating discounts or fake inventory.',
    },
    {
      icon: CalendarCheck,
      title: 'Site Visit Acceleration',
      desc: 'Streamlined booking workflow turning inbound inquiries into confirmed weekend walkthroughs.',
    },
    {
      icon: TrendingUp,
      title: 'Revenue Attribution',
      desc: 'Measure exact deal pipeline and closed revenue influenced by AI follow-ups.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-600/15 via-teal-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Branding and Product Pitch */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>LeadPilot AI • Enterprise Sales OS</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              AI Sales & Revenue Operating System for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                Real Estate
              </span>
            </h1>

            <p className="text-base text-slate-300 max-w-xl leading-relaxed">
              Convert inbound property enquiries into verified site visits, follow-up cadence, and
              measurable closed revenue. Built specifically for developers, channel partners, and
              sales teams across India.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-6 pt-2 text-xs text-slate-400 border-t border-slate-800/80">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Multi-Tenant Firestore Isolated
              </span>
              <span className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-400" /> NCR • Mumbai • Bengaluru • Pune
              </span>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black mx-auto mb-3 shadow-lg shadow-emerald-900/40">
                  <Zap className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Sign in to LeadPilot AI</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Access your organization’s sales workspace
                </p>
              </div>

              {(localError || authError) && (
                <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs">
                  {localError || authError}
                </div>
              )}

              <div className="space-y-4">
                {/* Google Sign-in */}
                <Button
                  onClick={handleGoogleLogin}
                  isLoading={loadingGoogle}
                  variant="outline"
                  size="lg"
                  className="w-full bg-white text-slate-900 hover:bg-slate-100 border-slate-300 font-semibold shadow-md flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-semibold">
                    <span className="bg-slate-900 px-3 text-slate-500">
                      or Instant Demo Workspace
                    </span>
                  </div>
                </div>

                {/* Instant Demo Account Selector */}
                <div className="space-y-2.5">
                  <button
                    onClick={() => handleDemoLogin('OWNER')}
                    disabled={loadingDemo}
                    className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-all group cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          Vikram Mehta
                        </span>
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 font-semibold px-1.5 py-0.2 rounded border border-purple-500/30">
                          OWNER / MD
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Skyline Luxe Realty • Full operational & executive access
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <button
                    onClick={() => handleDemoLogin('SALES_REP')}
                    disabled={loadingDemo}
                    className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-all group cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          Priya Singh
                        </span>
                        <span className="text-[10px] bg-slate-700 text-slate-300 font-semibold px-1.5 py-0.2 rounded border border-slate-600">
                          SALES_REP
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Assigned leads, daily follow-ups & appointment booking
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-800 text-center">
                <p className="text-[11px] text-slate-500">
                  By signing in, you accept the LeadPilot AI Enterprise Terms.
                  Role-based access and tenant encryption are active.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
