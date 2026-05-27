import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, GripVertical, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PageHeader, SectionCard } from '../components/ui/page';

interface CampaignPayload {
  title: string;
  department: string;
  employmentType: string;
  locationType: string;
  description: string;
  totalVacancies: number;
  bufferMultiplier: number;
  requiredSkills: string[];
  screeningRules: Record<string, never>;
  pipelineStages: Array<{ name: string; stageType: string; orderIndex: number }>;
  screeningQuestions: Array<{ questionText: string; questionType: string; isRequired: boolean; orderIndex: number }>;
}

function getServerMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message;
  }
  return undefined;
}

export default function CreateCampaign() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    department: '',
    employmentType: 'Full-time',
    locationType: 'Remote',
    description: '',
    totalVacancies: 1,
    bufferMultiplier: 2
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [stages, setStages] = useState([
    { id: '1', name: 'Applied', stageType: 'INTAKE', orderIndex: 0 },
    { id: '2', name: 'Screening', stageType: 'SCREENING', orderIndex: 1 },
    { id: '3', name: 'Interview', stageType: 'INTERVIEW', orderIndex: 2 },
    { id: '4', name: 'Offer', stageType: 'OFFER', orderIndex: 3 }
  ]);
  const [questions, setQuestions] = useState([
    { id: '1', questionText: 'Why are you a good fit for this role?', questionType: 'TEXT', isRequired: true, orderIndex: 0 }
  ]);

  const createMutation = useMutation({
    mutationFn: (data: CampaignPayload) => api.post('/campaigns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      navigate('/jobs');
    },
    onError: (error: unknown) => {
      console.error('Failed to create campaign:', error);
      const serverMsg = getServerMessage(error);
      alert(serverMsg || 'Failed to publish job. Please verify all details and try again.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      requiredSkills: skills,
      screeningRules: {},
      pipelineStages: stages.map((s, idx) => ({
        name: s.name,
        stageType: s.stageType,
        orderIndex: idx
      })),
      screeningQuestions: questions.map((q, idx) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        isRequired: q.isRequired,
        orderIndex: idx
      }))
    });
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextSkill = skillInput.trim();
      if (nextSkill && !skills.includes(nextSkill)) {
        setSkills([...skills, nextSkill]);
        setSkillInput('');
      }
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <div className="flex items-start gap-3">
        <Link to="/jobs">
          <Button variant="outline" size="icon" aria-label="Back to jobs">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          eyebrow="New campaign"
          title="Post a job"
          description="Define the role, screening criteria, and hiring stages. Local form IDs are stripped before submission."
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard title="Role details" description="Public job information and internal capacity planning.">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="title">Job title</label>
              <Input id="title" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Senior Backend Engineer" className="h-10" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="department">Department</label>
              <Input id="department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="Engineering" className="h-10" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="employmentType">Employment type</label>
              <select id="employmentType" className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20" value={formData.employmentType} onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="locationType">Location type</label>
              <select id="locationType" className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20" value={formData.locationType} onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}>
                <option>Remote</option>
                <option>Hybrid</option>
                <option>On-site</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="vacancies">Vacancies</label>
              <Input id="vacancies" type="number" min="1" required value={formData.totalVacancies} onChange={(e) => setFormData({ ...formData, totalVacancies: parseInt(e.target.value) || 1 })} className="h-10" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="description">Job description</label>
              <textarea id="description" required rows={6} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20" placeholder="Describe responsibilities, required experience, and working expectations." />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Required skills" description="Press Enter after each skill to build the matching criteria.">
          <div className="flex min-h-[46px] flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
            {skills.map((skill) => (
              <span key={skill} className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                {skill}
                <button type="button" onClick={() => setSkills(skills.filter((item) => item !== skill))} className="text-blue-500 hover:text-rose-600" aria-label={`Remove ${skill}`}>×</button>
              </span>
            ))}
            <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={handleSkillKeyDown} className="min-w-[160px] flex-1 bg-transparent px-2 py-1 text-sm outline-none" placeholder="Add a skill..." />
          </div>
        </SectionCard>

        <SectionCard
          title="Pipeline stages"
          description="Stages are saved in this order."
          action={<Button type="button" variant="outline" size="sm" onClick={() => setStages([...stages, { id: Date.now().toString(), name: 'New stage', stageType: 'INTERVIEW', orderIndex: stages.length }])}><Plus className="h-3.5 w-3.5" /> Add stage</Button>}
        >
          <div className="space-y-3">
            {stages.map((stage, idx) => (
              <div key={stage.id} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[auto_1fr_160px_auto] sm:items-center">
                <GripVertical className="hidden h-4 w-4 text-slate-400 sm:block" />
                <Input required value={stage.name} onChange={(e) => {
                  const next = [...stages];
                  next[idx].name = e.target.value;
                  setStages(next);
                }} className="h-9 bg-white" />
                <select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20" value={stage.stageType} onChange={(e) => {
                  const next = [...stages];
                  next[idx].stageType = e.target.value;
                  setStages(next);
                }}>
                  <option value="INTAKE">Intake</option>
                  <option value="SCREENING">Screening</option>
                  <option value="INTERVIEW">Interview</option>
                  <option value="OFFER">Offer</option>
                </select>
                <Button type="button" variant="ghost" size="icon" className="text-slate-400 hover:text-rose-700" onClick={() => setStages(stages.filter((item) => item.id !== stage.id))} disabled={stages.length === 1} aria-label="Remove stage">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Application questions"
          description="Questions appear on the public application form."
          action={<Button type="button" variant="outline" size="sm" onClick={() => setQuestions([...questions, { id: Date.now().toString(), questionText: '', questionType: 'TEXT', isRequired: true, orderIndex: questions.length }])}><Plus className="h-3.5 w-3.5" /> Add question</Button>}
        >
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={q.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_160px_auto_auto] md:items-end">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Question</label>
                    <Input required value={q.questionText} onChange={(e) => {
                      const next = [...questions];
                      next[idx].questionText = e.target.value;
                      setQuestions(next);
                    }} placeholder="Please link your portfolio." className="h-9 bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Answer type</label>
                    <select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20" value={q.questionType} onChange={(e) => {
                      const next = [...questions];
                      next[idx].questionType = e.target.value;
                      setQuestions(next);
                    }}>
                      <option value="TEXT">Short text</option>
                      <option value="LONG_TEXT">Long text</option>
                      <option value="BOOLEAN">Yes / No</option>
                    </select>
                  </div>
                  <label className="flex h-9 items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={q.isRequired} onChange={(e) => {
                      const next = [...questions];
                      next[idx].isRequired = e.target.checked;
                      setQuestions(next);
                    }} className="rounded border-slate-300 text-blue-700 focus:ring-blue-500" />
                    Required
                  </label>
                  <Button type="button" variant="ghost" size="icon" className="text-slate-400 hover:text-rose-700" onClick={() => setQuestions(questions.filter((item) => item.id !== q.id))} aria-label="Remove question">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {questions.length === 0 && <p className="py-5 text-center text-sm text-slate-500">No custom questions added.</p>}
          </div>
        </SectionCard>

        <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-slate-200 bg-slate-50/95 py-4 backdrop-blur sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => navigate('/jobs')}>Cancel</Button>
          <Button type="submit" className="bg-slate-950 text-white hover:bg-slate-800" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Publishing...' : 'Publish job'}
          </Button>
        </div>
      </form>
    </div>
  );
}
