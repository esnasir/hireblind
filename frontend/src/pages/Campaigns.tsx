import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Briefcase, ChevronRight } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';

export default function Campaigns() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ title: '', description: '' });
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get('/campaigns').then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/campaigns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setIsDialogOpen(false);
      setNewCampaign({ title: '', description: '' });
      setSkills([]);
      setSkillInput('');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title: newCampaign.title,
      description: newCampaign.description,
      requiredSkills: skills,
      screeningRules: {}, // default
    });
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    } else if (e.key === 'Backspace' && !skillInput && skills.length > 0) {
      setSkills(skills.slice(0, -1));
    }
  };

  const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(',')) {
      const parts = val.split(',');
      const newSkillsToAdd = parts
        .map(p => p.trim())
        .filter(Boolean)
        .filter(p => !skills.includes(p));
      
      let updatedSkills = [...skills];
      for (const s of newSkillsToAdd) {
        if (updatedSkills.length < 20) {
          updatedSkills.push(s);
        }
      }
      setSkills(updatedSkills);
      setSkillInput('');
    } else {
      setSkillInput(val);
    }
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 20) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const removeSkill = (indexToRemove: number) => {
    setSkills(skills.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Campaigns</h1>
          <p className="text-slate-500 mt-1">Manage hiring campaigns and review applicants.</p>
        </div>
        
        {user?.role === 'ADMIN' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" /> New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl w-full">
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create Campaign</DialogTitle>
                  <DialogDescription>
                    Set up a new hiring campaign to start screening candidates.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input 
                      value={newCampaign.title}
                      onChange={(e) => setNewCampaign({...newCampaign, title: e.target.value})}
                      placeholder="e.g. Senior Frontend Engineer" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      rows={6}
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                      placeholder="Enter a comprehensive description of the job, requirements, and responsibilities..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] resize-y leading-relaxed"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Required Skills</label>
                      <span className="text-xs text-slate-400 font-mono">{skills.length}/20</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 p-2 border border-slate-200 rounded-lg bg-white min-h-[42px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                      {skills.map((skill, idx) => (
                        <span key={skill + idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 shadow-xs">
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(idx)}
                            className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            <span className="text-[10px] font-bold">×</span>
                          </button>
                        </span>
                      ))}
                      {skills.length < 20 && (
                        <input
                          type="text"
                          value={skillInput}
                          onChange={handleSkillChange}
                          onKeyDown={handleSkillKeyDown}
                          onBlur={addSkill}
                          placeholder={skills.length === 0 ? "e.g. React, TypeScript, CSS" : "Add skill..."}
                          className="flex-1 min-w-[120px] bg-transparent border-0 p-0 text-sm outline-none placeholder:text-slate-400 focus:ring-0"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
          Failed to load campaigns.
        </div>
      ) : campaigns?.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
          <Briefcase className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No campaigns found</h3>
          <p className="text-slate-500 mt-1">Get started by creating a new campaign.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign: any) => (
            <Card key={campaign.id} className="shadow-sm border-slate-200 flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'} 
                         className={campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                    {campaign.status}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-lg mt-2 truncate" title={campaign.title}>{campaign.title}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                  {campaign.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pb-4">
                <div className="flex flex-wrap gap-1 mt-2">
                  {campaign.requiredSkills?.slice(0, 3).map((skill: string) => (
                    <Badge key={skill} variant="outline" className="text-xs font-normal text-slate-600 bg-slate-50">
                      {skill}
                    </Badge>
                  ))}
                  {campaign.requiredSkills?.length > 3 && (
                    <Badge variant="outline" className="text-xs font-normal text-slate-600 bg-slate-50">
                      +{campaign.requiredSkills.length - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <div className="p-4 pt-0 mt-auto border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex justify-end">
                <Link to={`/campaigns/${campaign.id}`}>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                    View Candidates <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
