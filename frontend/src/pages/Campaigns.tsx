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
  const [newCampaign, setNewCampaign] = useState({ title: '', description: '', requiredSkills: '' });

  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get('/campaigns').then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/campaigns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setIsDialogOpen(false);
      setNewCampaign({ title: '', description: '', requiredSkills: '' });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title: newCampaign.title,
      description: newCampaign.description,
      requiredSkills: newCampaign.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
      screeningRules: {}, // default
    });
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
            <DialogContent className="sm:max-w-[425px]">
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
                    <Input 
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                      placeholder="Brief role description" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Required Skills (comma separated)</label>
                    <Input 
                      value={newCampaign.requiredSkills}
                      onChange={(e) => setNewCampaign({...newCampaign, requiredSkills: e.target.value})}
                      placeholder="React, TypeScript, CSS" 
                    />
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
