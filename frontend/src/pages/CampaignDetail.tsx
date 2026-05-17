import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { ArrowLeft, User, FileText, ChevronRight, CheckCircle, FolderArchive, XCircle, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

export default function CampaignDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [confirmTitle, setConfirmTitle] = React.useState('');

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setDeleteOpen(false);
      navigate('/campaigns');
    },
  });

  const { data: campaign, isLoading: isLoadingCampaign } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => api.get(`/campaigns/${id}`).then(res => res.data),
  });

  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['campaign-submissions', id],
    queryFn: () => api.get(`/submissions?campaignId=${id}`).then(res => res.data),
  });

  const transitionMutation = useMutation({
    mutationFn: (action: 'activate' | 'close' | 'archive') =>
      api.post(`/campaigns/${id}/${action}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  if (isLoadingCampaign) return <div className="space-y-4"><Skeleton className="h-8 w-1/3"/><Skeleton className="h-24 w-full"/></div>;
  if (!campaign) return <div>Campaign not found</div>;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/campaigns" className="text-sm font-medium text-slate-500 hover:text-slate-900 inline-flex items-center mb-4 transition-colors">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Campaigns
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">{campaign.title}</h1>
              <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'} className={campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}>
                {campaign.status}
              </Badge>
            </div>
            <p className="text-slate-600 mt-2 max-w-3xl">{campaign.description}</p>
          </div>

          {user?.role === 'ADMIN' && (
            <div className="flex gap-2">
              {campaign.status === 'DRAFT' && (
                <Button 
                  onClick={() => transitionMutation.mutate('activate')}
                  disabled={transitionMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-sm flex items-center"
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Publish Campaign
                </Button>
              )}
              {campaign.status === 'ACTIVE' && (
                <Button 
                  onClick={() => transitionMutation.mutate('close')}
                  disabled={transitionMutation.isPending}
                  variant="destructive"
                  className="shadow-sm flex items-center"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Close Campaign
                </Button>
              )}
              {campaign.status === 'CLOSED' && (
                <Button 
                  onClick={() => transitionMutation.mutate('archive')}
                  disabled={transitionMutation.isPending}
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center"
                >
                  <FolderArchive className="mr-2 h-4 w-4" /> Archive Campaign
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Anonymized Candidates</h2>
            <p className="text-sm text-slate-500">Ranked by AI match score. PII is hidden until explicitly revealed.</p>
          </div>
        </div>

        {isLoadingSubmissions ? (
          <div className="p-6 space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : submissions?.length === 0 ? (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No candidates yet</h3>
            <p className="text-slate-500 mt-1">Wait for applications to be submitted and processed.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-[150px]">Candidate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub: any) => (
                <TableRow key={sub.id} className="hover:bg-slate-50/50 cursor-default transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mr-3 border border-slate-200">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="font-mono text-sm text-slate-700">{sub.candidateLabel}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-normal ${
                      sub.processingStatus === 'SCORED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      sub.processingStatus === 'REVEALED' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''
                    }`}>
                      {sub.processingStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {new Date(sub.receivedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/candidates/${sub.id}`}>
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                        Review Profile <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {user?.role === 'ADMIN' && campaign.status === 'ARCHIVED' && (
        <div className="mt-8 border border-red-200 rounded-xl overflow-hidden shadow-sm bg-white">
          <div className="bg-red-50 px-5 py-4 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-900 flex items-center">
              <ShieldAlert className="mr-2 h-5 w-5 text-red-600" /> Danger Zone
            </h3>
          </div>
          <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Delete this campaign permanently</h4>
              <p className="text-sm text-slate-500 mt-1">
                Once deleted, all candidate submissions, anonymized profiles, and match scores will be permanently deleted and cannot be recovered.
              </p>
            </div>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white font-medium flex items-center">
                  Delete Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white rounded-xl shadow-2xl w-full">
                <DialogHeader>
                  <DialogTitle className="text-red-700 flex items-center">
                    <ShieldAlert className="mr-2 h-5 w-5" /> Permanent Deletion Confirmation
                  </DialogTitle>
                  <DialogDescription className="pt-2 text-slate-600 leading-relaxed">
                    This action is destructive and irreversible. You are deleting <strong className="text-slate-900">{campaign.title}</strong>, including all associated candidate profiles and match scores.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-3">
                  <p className="text-sm text-slate-600 font-medium">
                    To confirm deletion, please type the campaign title exactly:
                  </p>
                  <code className="block bg-slate-100 p-2 rounded text-slate-700 text-sm border font-mono">
                    {campaign.title}
                  </code>
                  <input
                    type="text"
                    value={confirmTitle}
                    onChange={(e) => setConfirmTitle(e.target.value)}
                    placeholder="Type campaign title exactly"
                    className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <DialogFooter className="flex justify-end gap-2 mt-2">
                  <Button variant="ghost" onClick={() => { setDeleteOpen(false); setConfirmTitle(''); }}>Cancel</Button>
                  <Button
                    onClick={() => deleteMutation.mutate()}
                    disabled={confirmTitle !== campaign.title || deleteMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white disabled:bg-slate-200 disabled:text-slate-400 font-medium shadow-sm"
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Permanently Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </div>
  );
}
