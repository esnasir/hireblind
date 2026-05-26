import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';

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
    mutationFn: (data: any) => api.post('/campaigns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      navigate('/jobs');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      requiredSkills: skills,
      screeningRules: {},
      pipelineStages: stages.map((s, idx) => ({ ...s, orderIndex: idx })),
      screeningQuestions: questions.map((q, idx) => ({ ...q, orderIndex: idx }))
    });
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (skillInput.trim() && !skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
        setSkillInput('');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link to="/jobs">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Post a New Job</h1>
          <p className="text-[14px] text-slate-500 mt-1">Define the role, pipeline, and screening criteria.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Details */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-[14px] font-bold text-slate-900">Core Details</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[13px] font-semibold text-slate-700">Job Title</label>
              <Input 
                required 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Senior Frontend Engineer" 
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-700">Department</label>
              <Input 
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
                placeholder="e.g. Engineering" 
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-700">Employment Type</label>
              <select 
                className="w-full h-10 px-3 text-[13px] rounded-md border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-slate-900"
                value={formData.employmentType}
                onChange={e => setFormData({...formData, employmentType: e.target.value})}
              >
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-700">Location Type</label>
              <select 
                className="w-full h-10 px-3 text-[13px] rounded-md border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-slate-900"
                value={formData.locationType}
                onChange={e => setFormData({...formData, locationType: e.target.value})}
              >
                <option>Remote</option>
                <option>Hybrid</option>
                <option>On-site</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-700">Vacancies</label>
              <Input 
                type="number" min="1" required 
                value={formData.totalVacancies}
                onChange={e => setFormData({...formData, totalVacancies: parseInt(e.target.value) || 1})}
                className="h-10"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[13px] font-semibold text-slate-700">Job Description</label>
              <textarea 
                required rows={5}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full p-3 text-[13px] rounded-md border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-slate-900 resize-y"
                placeholder="Describe the responsibilities and requirements..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[13px] font-semibold text-slate-700">Required Skills</label>
              <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-md min-h-[42px] bg-white">
                {skills.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-[12px] font-medium">
                    {s}
                    <button type="button" onClick={() => setSkills(skills.filter((_, idx) => idx !== i))} className="hover:text-red-500">×</button>
                  </span>
                ))}
                <input 
                  type="text" 
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  className="flex-1 outline-none min-w-[120px] text-[13px]"
                  placeholder="Press enter to add skill..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Stages */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-[14px] font-bold text-slate-900">Pipeline Stages</h2>
            <Button 
              type="button" variant="outline" size="sm" className="h-7 text-[12px]"
              onClick={() => setStages([...stages, { id: Date.now().toString(), name: 'New Stage', stageType: 'INTERVIEW', orderIndex: stages.length }])}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Stage
            </Button>
          </div>
          <div className="p-6 space-y-3">
            {stages.map((stage, idx) => (
              <div key={stage.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <GripVertical className="h-4 w-4 text-slate-400 cursor-grab" />
                <Input 
                  value={stage.name} 
                  onChange={e => {
                    const newStages = [...stages];
                    newStages[idx].name = e.target.value;
                    setStages(newStages);
                  }}
                  className="h-9 flex-1"
                />
                <select 
                  className="h-9 px-3 text-[12px] rounded-md border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-slate-900 w-[140px]"
                  value={stage.stageType}
                  onChange={e => {
                    const newStages = [...stages];
                    newStages[idx].stageType = e.target.value;
                    setStages(newStages);
                  }}
                >
                  <option value="INTAKE">Intake</option>
                  <option value="SCREENING">Screening</option>
                  <option value="INTERVIEW">Interview</option>
                  <option value="OFFER">Offer</option>
                </select>
                <Button 
                  type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600"
                  onClick={() => setStages(stages.filter(s => s.id !== stage.id))}
                  disabled={stages.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Screening Questions */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-[14px] font-bold text-slate-900">Application Questions</h2>
            <Button 
              type="button" variant="outline" size="sm" className="h-7 text-[12px]"
              onClick={() => setQuestions([...questions, { id: Date.now().toString(), questionText: '', questionType: 'TEXT', isRequired: true, orderIndex: questions.length }])}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Question
            </Button>
          </div>
          <div className="p-6 space-y-4">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 relative pr-12">
                <Button 
                  type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 absolute top-3 right-3"
                  onClick={() => setQuestions(questions.filter(qu => qu.id !== q.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">Question Prompt</label>
                  <Input 
                    value={q.questionText} 
                    onChange={e => {
                      const newQ = [...questions];
                      newQ[idx].questionText = e.target.value;
                      setQuestions(newQ);
                    }}
                    placeholder="e.g. Please link your portfolio."
                    className="h-9"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="space-y-1.5 w-1/3">
                    <label className="text-[12px] font-semibold text-slate-700">Answer Type</label>
                    <select 
                      className="w-full h-9 px-3 text-[12px] rounded-md border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-slate-900"
                      value={q.questionType}
                      onChange={e => {
                        const newQ = [...questions];
                        newQ[idx].questionType = e.target.value;
                        setQuestions(newQ);
                      }}
                    >
                      <option value="TEXT">Short Text</option>
                      <option value="LONG_TEXT">Long Text</option>
                      <option value="BOOLEAN">Yes / No</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <input 
                      type="checkbox" 
                      id={`req-${q.id}`} 
                      checked={q.isRequired}
                      onChange={e => {
                        const newQ = [...questions];
                        newQ[idx].isRequired = e.target.checked;
                        setQuestions(newQ);
                      }}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <label htmlFor={`req-${q.id}`} className="text-[12px] font-medium text-slate-700">Required</label>
                  </div>
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <p className="text-center text-[13px] text-slate-500 py-4">No custom screening questions added.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="ghost" onClick={() => navigate('/jobs')}>Cancel</Button>
          <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Publishing...' : 'Publish Job'}
          </Button>
        </div>
      </form>
    </div>
  );
}
