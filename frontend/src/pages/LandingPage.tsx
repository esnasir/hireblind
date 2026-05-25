import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Shield, ArrowRight, EyeOff, CheckCircle2, Lock, FileText, Database } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function LandingPage() {
  const { accessToken } = useAuthStore();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="h-5 w-5 text-slate-800" />
            <span className="text-sm font-semibold tracking-tight text-slate-900">HireBlind</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-slate-500">
            <a href="#features" className="hover:text-slate-900 transition-colors">Platform</a>
            <a href="#workflow" className="hover:text-slate-900 transition-colors">Workflow</a>
            <a href="#compliance" className="hover:text-slate-900 transition-colors">Compliance</a>
          </nav>

          <div className="flex items-center gap-4">
            {accessToken ? (
              <Link to="/dashboard">
                <Button variant="ghost" className="text-[13px] h-8 font-medium">
                  Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">
                  Log in
                </Link>
                <Link to="/login">
                  <Button className="h-8 text-[13px] px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-md shadow-sm transition-all">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 relative max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600 mb-8">
          <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
          HireBlind B2B Platform Live
        </div>
        
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-slate-900 tracking-tighter leading-[1.1] mb-6 max-w-4xl">
          Hire for skill.<br />Not for background.
        </h1>
        
        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
          A production-grade screening platform that algorithmically anonymizes candidate data, evaluates pure technical matching, and generates immutable compliance records.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link to={accessToken ? "/dashboard" : "/login"}>
            <Button className="h-11 px-6 text-[14px] bg-slate-900 hover:bg-slate-800 text-white shadow-sm rounded-md transition-all flex items-center gap-2">
              {accessToken ? "Go to Workspace" : "Start Onboarding"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-24 px-6 border-t border-slate-100 bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-4">Structural Anonymity</h2>
            <p className="text-slate-500 text-[15px] leading-relaxed">
              We separate the identity layer from the competency layer at the gateway. Evaluators see only raw capabilities until explicit unmasking is authorized.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="h-10 w-10 rounded bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <EyeOff className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="text-[15px] font-semibold text-slate-900">PII Redaction Engine</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Automatically masks names, gender markers, contact details, and socio-economic indicators using our proprietary parsing model.
              </p>
            </div>
            <div className="space-y-4">
              <div className="h-10 w-10 rounded bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="text-[15px] font-semibold text-slate-900">Deterministic Scoring</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Candidates are scored purely against job requirements and technical competencies, standardizing the evaluation baseline.
              </p>
            </div>
            <div className="space-y-4">
              <div className="h-10 w-10 rounded bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <Database className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="text-[15px] font-semibold text-slate-900">Tenant Isolation</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Strict multi-tenant architecture ensures your organization's hiring data is cryptographically isolated and secure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance / Workflow */}
      <section id="compliance" className="py-24 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-16 items-start">
          <div className="flex-1 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Immutable Audit Trail</h2>
            <p className="text-slate-500 text-[15px] leading-relaxed max-w-md">
              Every identity reveal, score override, and pipeline progression is permanently logged to an append-only ledger, providing a bulletproof compliance artifact.
            </p>
            <ul className="space-y-4 pt-4">
              <li className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-600 font-medium">Role-Based Reveal Authorizations</span>
              </li>
              <li className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-600 font-medium">Exportable Regulatory Reports</span>
              </li>
            </ul>
          </div>
          
          <div className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-lg p-8 font-mono text-[13px]">
            <div className="flex gap-2 mb-4 border-b border-slate-200 pb-4">
              <span className="text-slate-400">log_id:</span>
              <span className="text-slate-700">evt_01H9XZ...</span>
            </div>
            <div className="space-y-3 text-slate-600">
              <div className="flex justify-between">
                <span>action</span>
                <span className="text-slate-900 font-medium">"IDENTITY_REVEALED"</span>
              </div>
              <div className="flex justify-between">
                <span>actor</span>
                <span className="text-slate-900 font-medium">"recruiter@acme.inc"</span>
              </div>
              <div className="flex justify-between">
                <span>target_candidate</span>
                <span className="text-slate-900 font-medium">"cand_892nf3"</span>
              </div>
              <div className="flex justify-between">
                <span>timestamp</span>
                <span className="text-slate-500">"2026-05-21T10:00:00Z"</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-400" />
            <span className="text-[13px] font-semibold text-slate-900 tracking-tight">HireBlind</span>
          </div>
          <p className="text-[13px] text-slate-500">
            &copy; {new Date().getFullYear()} HireBlind Inc. Production Infrastructure.
          </p>
        </div>
      </footer>
    </div>
  );
}
