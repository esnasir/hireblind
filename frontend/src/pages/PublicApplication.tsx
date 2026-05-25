import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Shield, Building, MapPin, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const PUBLIC_API_URL = 'http://localhost:8080/api';

export default function PublicApplication() {
  const { slug } = useParams();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Fetch campaign by public slug
  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ['publicCampaign', slug],
    queryFn: async () => {
      const res = await axios.get(`${PUBLIC_API_URL}/campaigns/public/${slug}`);
      return res.data;
    },
    enabled: !!slug
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      // Step 14 will build this processing-service endpoint. We prepare for it now.
      return axios.post(`${PUBLIC_API_URL}/submissions/apply`, payload);
    },
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign) return;

    // Package the dynamic answers
    const answers = campaign.screeningQuestions.map((q: any) => ({
      questionId: q.id,
      answerText: formData[q.id] || '',
    }));

    submitMutation.mutate({
      campaignId: campaign.id,
      candidateEmail: formData.email,
      candidateName: formData.fullName,
      candidatePhone: formData.phone,
      resumeUrl: formData.resumeUrl,
      answers: answers
    });
  };

  const handleInputChange = (id: string, val: string) => {
    setFormData(prev => ({ ...prev, [id]: val }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-md w-full text-center">
          <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Job Not Found</h2>
          <p className="text-[14px] text-slate-500 mb-6">This application link is invalid or the job has been closed.</p>
          <Link to="/">
            <Button variant="outline" className="w-full">Return to HireBlind</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center py-20 px-6">
        <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm max-w-lg w-full text-center">
          <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
          <p className="text-[15px] text-slate-500 mb-8 leading-relaxed">
            Your application for <strong>{campaign.title}</strong> has been received securely. HireBlind anonymizes your profile so you are evaluated strictly on your skills.
          </p>
          <p className="text-[12px] text-slate-400 font-medium uppercase tracking-wider">Powered by HireBlind</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 selection:bg-slate-200 selection:text-slate-900">
      <div className="max-w-2xl mx-auto">
        {/* Header / Job Info */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">{campaign.title}</h1>
          <div className="flex flex-wrap justify-center items-center gap-3 text-[14px] font-medium text-slate-600">
            <span className="flex items-center gap-1.5"><Building className="h-4 w-4 text-slate-400" /> {campaign.department || 'General'}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-400" /> {campaign.locationType || 'Any Location'}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
            <span>{campaign.employmentType || 'Full-time'}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="p-8 prose prose-slate prose-sm max-w-none border-b border-slate-100 whitespace-pre-wrap">
            {campaign.description}
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-slate-50/30">
            {/* Standard Profile Fields */}
            <div className="space-y-6">
              <h3 className="text-[15px] font-bold text-slate-900 border-b border-slate-200 pb-2">Your Profile</h3>
              
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-slate-700">Full Name <span className="text-red-500">*</span></label>
                <Input required value={formData.fullName || ''} onChange={e => handleInputChange('fullName', e.target.value)} className="h-11 text-[14px]" placeholder="Jane Doe" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-slate-700">Email Address <span className="text-red-500">*</span></label>
                  <Input required type="email" value={formData.email || ''} onChange={e => handleInputChange('email', e.target.value)} className="h-11 text-[14px]" placeholder="jane@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-slate-700">Phone Number</label>
                  <Input type="tel" value={formData.phone || ''} onChange={e => handleInputChange('phone', e.target.value)} className="h-11 text-[14px]" placeholder="+1 (555) 000-0000" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-slate-700">Resume/Portfolio Link <span className="text-red-500">*</span></label>
                <Input required type="url" value={formData.resumeUrl || ''} onChange={e => handleInputChange('resumeUrl', e.target.value)} className="h-11 text-[14px]" placeholder="https://linkedin.com/in/janedoe or Drive link" />
                <p className="text-[11px] text-slate-500">Currently only accepting public URLs for attachments.</p>
              </div>
            </div>

            {/* Dynamic Screening Questions */}
            {campaign.screeningQuestions && campaign.screeningQuestions.length > 0 && (
              <div className="space-y-6 pt-6">
                <h3 className="text-[15px] font-bold text-slate-900 border-b border-slate-200 pb-2">Application Questions</h3>
                {campaign.screeningQuestions.map((q: any) => (
                  <div key={q.id} className="space-y-2">
                    <label className="text-[13px] font-semibold text-slate-700">
                      {q.questionText} {q.isRequired && <span className="text-red-500">*</span>}
                    </label>
                    {q.questionType === 'BOOLEAN' ? (
                      <select 
                        required={q.isRequired}
                        value={formData[q.id] || ''}
                        onChange={e => handleInputChange(q.id, e.target.value)}
                        className="w-full h-11 px-3 text-[14px] rounded-md border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-slate-900"
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
                        onChange={e => handleInputChange(q.id, e.target.value)}
                        className="w-full p-3 text-[14px] rounded-md border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-slate-900 resize-y"
                      />
                    ) : (
                      <Input 
                        required={q.isRequired}
                        value={formData[q.id] || ''}
                        onChange={e => handleInputChange(q.id, e.target.value)}
                        className="h-11 text-[14px]"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-8 flex flex-col items-center">
              <Button type="submit" disabled={submitMutation.isPending} className="w-full max-w-sm h-12 text-[15px] font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-md">
                {submitMutation.isPending ? 'Submitting...' : 'Submit Application'}
              </Button>
              <div className="mt-6 flex items-center gap-2 text-slate-400">
                <Shield className="h-4 w-4" />
                <span className="text-[12px] font-medium">Your identity is hidden during the initial review.</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
