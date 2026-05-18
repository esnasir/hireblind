import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Shield, EyeOff, CheckCircle2, UserCheck, ArrowRight, FileText, Lock, Landmark, Award } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function LandingPage() {
  const { accessToken } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold tracking-tight text-slate-900">HireBlind</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#security" className="hover:text-slate-900 transition-colors">Compliance</a>
          </nav>

          <div>
            {accessToken ? (
              <Link to="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
              <Award className="h-3.5 w-3.5" /> Biased-Free HR Screening
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight">
              Anonymized Candidate Screening for <span className="text-blue-600">Fair Hiring</span>
            </h1>
            
            <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
              HireBlind automatically ingests, anonymizes, and ranks candidate resumes using advanced AI match scoring. Recruiter evaluation stays fully unbiased until identity reveal is authorized.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              {accessToken ? (
                <Link to="/dashboard">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md text-base px-8 h-13 transition-all">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md text-base px-8 h-13 transition-all">
                      Get Started Free
                    </Button>
                  </Link>
                  <a href="#features">
                    <Button size="lg" variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-base px-8 h-13 transition-all">
                      Learn More
                    </Button>
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-blue-100/50 rounded-3xl blur-3xl -z-10" />
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <div className="text-xs font-mono text-slate-400">anonymized_profile.json</div>
              </div>

              <div className="space-y-4 font-sans">
                <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200/60 shadow-sm">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border text-slate-500">
                    <EyeOff className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-28 bg-slate-200 rounded font-mono text-[10px] text-slate-400 flex items-center px-1.5 uppercase">Redacted</div>
                    <div className="h-2 w-20 bg-slate-100 rounded" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm space-y-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Anonymized Experience Summary</div>
                  <p className="text-xs text-slate-600 leading-relaxed font-mono bg-slate-50 p-2.5 rounded border border-slate-100">
                    Candidate has <span className="bg-blue-100 text-blue-800 px-1 rounded">5+ years</span> of React & TypeScript engineering experience at a major <span className="bg-slate-200 text-slate-600 px-1 rounded">[REDACTED COMPANY]</span>. Designed scalable UI components, improving workflow efficiency by 30%.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">AI Score Assessment</div>
                    <div className="text-xs text-slate-600 font-medium">Ranked #1 in Active Campaign</div>
                  </div>
                  <div className="text-3xl font-extrabold text-blue-600">89<span className="text-xs font-semibold text-blue-400">/100</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 lg:py-28 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Powerful Features for Bias-Free Recruitment
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Our B2B HR platform is specifically designed to eliminate demographic and gender bias in candidate sourcing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
                <EyeOff className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">PII Redaction Engine</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Automatically masks names, gender markers, contact details, profile pictures, and university/employer names that carry background bias.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">AI Match Scoring</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Objective scoring evaluates direct experience and matching skills against job requirements without considering demographic details.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
                <UserCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Primary & Buffer Pipeline</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Automatically allocates candidate tiers using dynamic vacancy thresholds. Promote backup candidates instantly if a candidate drops out.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 lg:py-28 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Unbiased Recruiting in Three Simple Steps
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Ingest, score, shortlist, and reveal. An automated system that ensures fairness from inbox to offer.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
            <div className="space-y-4 relative">
              <div className="text-5xl font-extrabold text-slate-100 absolute -top-8 -left-2 select-none">01</div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 relative">
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-4">1</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Ingestion</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Candidates apply by sending their resumes directly to your campaign-linked email address. Resumes are parsed instantly.
                </p>
              </div>
            </div>

            <div className="space-y-4 relative">
              <div className="text-5xl font-extrabold text-slate-100 absolute -top-8 -left-2 select-none">02</div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 relative">
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-4">2</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Unbiased AI Evaluation</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Our LLM processing service extracts core competencies, filters PII, and applies an objective match score.
                </p>
              </div>
            </div>

            <div className="space-y-4 relative">
              <div className="text-5xl font-extrabold text-slate-100 absolute -top-8 -left-2 select-none">03</div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 relative">
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-4">3</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Shortlisting & Audit Reveal</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Admins shortlist the candidates. Unmasking an identity requires explicit authorization and emits an immutable compliance audit record.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section id="security" className="py-20 lg:py-28 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
              <Lock className="h-3.5 w-3.5" /> High-Level Compliance
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Enterprise-Grade Security & Immutable Compliance Logs
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              We understand the sensitive nature of PII and recruitment records. Our microservice-based architecture is designed from the ground up to protect candidate privacy and meet strict corporate regulatory requirements.
            </p>

            <ul className="space-y-3 pt-2">
              <li className="flex items-center gap-3 text-sm text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <span>Immutable audit logs ensure a complete compliance paper trail.</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <span>Strict backend data boundaries — direct DB cross-reads are completely banned.</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <span>Role-based access control (RBAC) secures delicate identity reveal features.</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <Lock className="h-8 w-8 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-sm">Encrypted Storage</h4>
              <p className="text-xs text-slate-600 leading-relaxed">All candidate files and details are encrypted in transition and at rest.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <Landmark className="h-8 w-8 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-sm">Sovereign Architecture</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Independent database schema isolation ensures absolute data limits.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-sm">PII Segregation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Identity is separated from assessment profiles at the ingestion gateway.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-sm">Regulatory Compliance</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Built aligned with modern anti-discrimination regulatory standards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white border-t border-slate-200 text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Ready to Build an Unbiased Recruitment Pipeline?
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Eliminate candidate demographic bias and streamline screening with HireBlind. Install and run in just a few minutes.
          </p>
          <div className="pt-4">
            {accessToken ? (
              <Link to="/dashboard">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md text-base px-8 h-13 transition-all">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md text-base px-8 h-13 transition-all">
                  Sign In & Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-blue-500" />
            <span className="font-bold tracking-tight">HireBlind</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} HireBlind. All rights reserved. Professional Compliance-Aware Screening.
          </div>
        </div>
      </footer>
    </div>
  );
}
