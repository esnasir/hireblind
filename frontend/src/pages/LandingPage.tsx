import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ArrowRight, BarChart3, CheckCircle2, EyeOff, FileCheck2, LockKeyhole, Shield, Users } from 'lucide-react';
import { Button } from '../components/ui/button';

function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/70">
      <div className="flex h-10 items-center gap-2 border-b border-slate-200 bg-slate-50 px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <span className="ml-3 text-xs font-medium text-slate-500">hireblind.app/dashboard</span>
      </div>
      <div className="grid gap-0 md:grid-cols-[220px_1fr]">
        <div className="hidden border-r border-slate-200 bg-slate-50 p-4 md:block">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-slate-950">Northstar Talent</span>
          </div>
          {['Dashboard', 'Jobs', 'Candidates', 'Audit Log'].map((item, index) => (
            <div key={item} className={`mb-1 rounded-lg px-3 py-2 text-sm ${index === 1 ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200' : 'text-slate-500'}`}>
              {item}
            </div>
          ))}
        </div>
        <div className="p-5 sm:p-7">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Anonymized Screening</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Senior Backend Engineer</h3>
              <p className="mt-1 text-sm text-slate-500">12 candidates reviewed against role requirements.</p>
            </div>
            <Button className="w-fit bg-slate-950 text-white hover:bg-slate-800">Review shortlist</Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <div className="overflow-hidden rounded-lg border border-slate-200">
              {[
                ['Candidate A-184', '92', 'Screening', 'Java, Spring Boot, PostgreSQL'],
                ['Candidate B-209', '86', 'Interview', 'APIs, Docker, Microservices'],
                ['Candidate C-771', '74', 'Review', 'Kubernetes gap flagged'],
              ].map(([name, score, stage, skills]) => (
                <div key={name} className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-100 p-4 last:border-b-0 sm:grid-cols-[1fr_80px_110px]">
                  <div>
                    <p className="font-medium text-slate-950">{name}</p>
                    <p className="mt-1 text-xs text-slate-500">{skills}</p>
                  </div>
                  <div className="text-right text-sm font-semibold text-emerald-700">{score}%</div>
                  <div className="hidden text-sm text-slate-500 sm:block">{stage}</div>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-5">
              <EyeOff className="h-5 w-5 text-blue-700" />
              <h4 className="mt-4 text-base font-semibold text-slate-950">Identity stays hidden</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Recruiters review work history, skills, and screening answers before names or contact details are visible.
              </p>
              <div className="mt-5 rounded-md border border-blue-100 bg-white p-3 text-xs text-slate-500">
                Reveal requires admin approval and an audit event.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fbfcfd] text-slate-950 antialiased selection:bg-blue-100 selection:text-blue-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Shield className="h-4 w-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">HireBlind</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#platform" className="hover:text-slate-950">Platform</a>
            <a href="#workflow" className="hover:text-slate-950">Workflow</a>
            <a href="#compliance" className="hover:text-slate-950">Compliance</a>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => navigate('/login')}>Sign in</Button>
                <Button className="bg-slate-950 text-white hover:bg-slate-800" onClick={() => navigate('/register')}>
                  Create workspace
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Hiring decisions with less bias</p>
            <h1 className="mt-5 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">HireBlind</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              A recruiting workspace that separates identity from evaluation, helping teams screen candidates by skills, experience, and role fit before any reveal.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button className="h-11 bg-slate-950 px-5 text-white hover:bg-slate-800" onClick={() => navigate('/register')}>
                Start your workspace <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="h-11 px-5" onClick={() => document.getElementById('platform')?.scrollIntoView({ behavior: 'smooth' })}>
                Explore platform
              </Button>
            </div>
          </div>
          <div className="mx-auto mt-12 max-w-7xl">
            <ProductMockup />
          </div>
        </section>

        <section id="platform" className="border-y border-slate-200 bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">Platform</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Built for structured, fair early-stage review.</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Keep candidate identity, scoring, job criteria, and audit records in clear product surfaces your recruiting team can trust.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [EyeOff, 'Anonymized profiles', 'Names, emails, phone numbers, and profile links stay masked during initial review.'],
                [BarChart3, 'Role-based scoring', 'Compare candidates against required skills and campaign criteria.'],
                [Users, 'Team workflow', 'Recruiters, owners, and admins work from role-aware views.'],
                [LockKeyhole, 'Controlled reveal', 'Identity reveal is reserved for authorized admins and recorded for review.'],
              ].map(([Icon, title, body]) => (
                <div key={String(title)} className="rounded-lg border border-slate-200 bg-slate-50/70 p-5">
                  {React.createElement(Icon as typeof EyeOff, { className: 'h-5 w-5 text-blue-700' })}
                  <h3 className="mt-4 font-semibold text-slate-950">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{body as string}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">Workflow</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">From job setup to shortlist, without exposing PII.</h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ['Create a campaign', 'Define skills, screening questions, vacancies, and hiring stages.'],
                ['Collect applications', 'Candidates apply through a clean public form tied to your campaign slug.'],
                ['Review and reveal', 'Recruiters review anonymized profiles; admins reveal identity only when necessary.'],
              ].map(([title, body], index) => (
                <div key={title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">{index + 1}</span>
                  <h3 className="mt-5 font-semibold text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="compliance" className="bg-slate-950 px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-300">Compliance-aware by design</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Audit context where sensitive actions happen.</h2>
              <p className="mt-4 text-base leading-7 text-slate-300">
                HireBlind keeps reveal actions deliberate and visible. The product language stays precise so teams know what is hidden, what is visible, and what has been recorded.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-5">
              {[
                ['IDENTITY_REVEALED', 'Admin revealed candidate identity after shortlist review.'],
                ['SUBMISSION_RECEIVED', 'Application received and queued for anonymized screening.'],
                ['CAMPAIGN_CREATED', 'New hiring campaign created with role requirements.'],
              ].map(([action, detail]) => (
                <div key={action} className="flex items-start gap-3 border-b border-white/10 py-4 first:pt-0 last:border-b-0 last:pb-0">
                  <FileCheck2 className="mt-0.5 h-4 w-4 text-blue-300" />
                  <div>
                    <p className="text-sm font-semibold text-white">{action}</p>
                    <p className="mt-1 text-sm text-slate-300">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-slate-950">
            <Shield className="h-4 w-4" />
            <span className="font-semibold">HireBlind</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>&copy; {new Date().getFullYear()} HireBlind</span>
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Privacy-first screening</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
