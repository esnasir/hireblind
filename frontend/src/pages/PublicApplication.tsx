import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Building2, CheckCircle2, MapPin, Shield, UploadCloud } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

interface ScreeningQuestion {
  id: string;
  questionText: string;
  questionType: 'TEXT' | 'LONG_TEXT' | 'BOOLEAN';
  isRequired: boolean;
}

interface PublicCampaign {
  id: string;
  title: string;
  department?: string;
  locationType?: string;
  employmentType?: string;
  description?: string;
  screeningQuestions: ScreeningQuestion[];
}

interface ApplicationPayload {
  campaignId: string;
  candidateEmail?: string;
  candidateName?: string;
  candidatePhone?: string;
  resumeUrl?: string;
  answers: Array<{ questionId: string; answerText: string }>;
}

export default function PublicApplication() {
  const { slug } = useParams();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: campaign, isLoading, error } = useQuery<PublicCampaign>({
    queryKey: ['publicCampaign', slug],
    queryFn: async () => {
      const res = await api.get(`/campaigns/public/${slug}`);
      return res.data;
    },
    enabled: !!slug
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: ApplicationPayload) => api.post('/submissions/apply', payload),
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign) return;

    const answers = campaign.screeningQuestions.map((q) => ({
      questionId: q.id,
      answerText: formData[q.id] || '',
    }));

    submitMutation.mutate({
      campaignId: campaign.id,
      candidateEmail: formData.email,
      candidateName: formData.fullName,
      candidatePhone: formData.phone,
      resumeUrl: formData.resumeUrl,
      answers,
    });
  };

  const handleInputChange = (id: string, val: string) => {
    setFormData((prev) => ({ ...prev, [id]: val }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-slate-900 motion-safe:animate-spin" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Shield className="mx-auto mb-4 h-10 w-10 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-950">Application link unavailable</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">This job may be closed, archived, or the link may be incorrect.</p>
          <Link to="/">
            <Button variant="outline" className="mt-6 w-full">Return to HireBlind</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Application submitted</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your application for <strong>{campaign.title}</strong> has been received. HireBlind will prepare an anonymized profile for the initial review.
          </p>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Powered by HireBlind</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Shield className="h-4 w-4 text-slate-900" />
            HireBlind application
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{campaign.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {campaign.department || 'General'}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {campaign.locationType || 'Any location'}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>{campaign.employmentType || 'Full-time'}</span>
          </div>
          <div className="mt-6 whitespace-pre-wrap border-t border-slate-100 pt-6 text-sm leading-7 text-slate-600">
            {campaign.description}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Your profile</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Your identity is collected for the employer, but hidden from recruiters during initial screening.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="fullName">Full name <span className="text-rose-600">*</span></label>
              <Input id="fullName" required value={formData.fullName || ''} onChange={(e) => handleInputChange('fullName', e.target.value)} className="h-11" placeholder="Jane Doe" />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="email">Email address <span className="text-rose-600">*</span></label>
                <Input id="email" required type="email" value={formData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} className="h-11" placeholder="jane@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="phone">Phone number</label>
                <Input id="phone" type="tel" value={formData.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} className="h-11" placeholder="+1 (555) 000-0000" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="resumeUrl">Resume or portfolio link <span className="text-rose-600">*</span></label>
              <div className="relative">
                <UploadCloud className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="resumeUrl" required type="url" value={formData.resumeUrl || ''} onChange={(e) => handleInputChange('resumeUrl', e.target.value)} className="h-11 pl-9" placeholder="https://..." />
              </div>
              <p className="text-xs leading-5 text-slate-500">Use a public resume, portfolio, LinkedIn, or document link for now.</p>
            </div>
          </div>

          {campaign.screeningQuestions && campaign.screeningQuestions.length > 0 && (
            <div className="mt-9 space-y-6 border-t border-slate-100 pt-8">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">Application questions</h2>
                <p className="mt-2 text-sm text-slate-500">Answer the questions requested by the hiring team.</p>
              </div>
                {campaign.screeningQuestions.map((q) => (
                <div key={q.id} className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {q.questionText} {q.isRequired && <span className="text-rose-600">*</span>}
                  </label>
                  {q.questionType === 'BOOLEAN' ? (
                    <select
                      required={q.isRequired}
                      value={formData[q.id] || ''}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
                    >
                      <option value="" disabled>Select an option</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  ) : q.questionType === 'LONG_TEXT' ? (
                    <textarea
                      required={q.isRequired}
                      rows={4}
                      value={formData[q.id] || ''}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
                    />
                  ) : (
                    <Input required={q.isRequired} value={formData[q.id] || ''} onChange={(e) => handleInputChange(q.id, e.target.value)} className="h-11" />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-9 flex flex-col items-center gap-4 border-t border-slate-100 pt-8">
            <Button type="submit" disabled={submitMutation.isPending} className="h-11 w-full max-w-sm bg-slate-950 text-white hover:bg-slate-800">
              {submitMutation.isPending ? 'Submitting...' : 'Submit application'}
            </Button>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Shield className="h-4 w-4" />
              Initial review hides your name and contact details.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
