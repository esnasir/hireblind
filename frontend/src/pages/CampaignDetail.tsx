import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { ArrowLeft, User, FileText, ChevronRight, CheckCircle, FolderArchive, XCircle, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

export default function CampaignDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [confirmTitle, setConfirmTitle] = React.useState('');
  
  const [activeTab, setActiveTab] = React.useState<'ALL' | 'PIPELINE'>('ALL');
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectCandidateId, setRejectCandidateId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');

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

  const { data: pipeline = [] } = useQuery({
    queryKey: ['pipeline', id],
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

  const generateShortlistMutation = useMutation({
    mutationFn: () => api.post(`/campaigns/${id}/shortlist/generate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-submissions', id] });
      queryClient.invalidateQueries({ queryKey: ['pipeline', id] });
    },
  });

  const approveBufferMutation = useMutation({
    mutationFn: (subId: string) => api.post(`/submissions/${subId}/shortlist/approve-buffer`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-submissions', id] });
      queryClient.invalidateQueries({ queryKey: ['pipeline', id] });
    },
  });

  const shortlistMutation = useMutation({
    mutationFn: (subId: string) => api.post(`/submissions/${subId}/shortlist?campaignId=${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-submissions', id] });
      queryClient.invalidateQueries({ queryKey: ['pipeline', id] });
    },
  });

  const promoteMutation = useMutation({
    mutationFn: (subId: string) => api.post(`/submissions/${subId}/promote`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-submissions', id] });
      queryClient.invalidateQueries({ queryKey: ['pipeline', id] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ subId, reason }: { subId: string, reason: string }) => api.post(`/submissions/${subId}/shortlist/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-submissions', id] });
      queryClient.invalidateQueries({ queryKey: ['pipeline', id] });
      setRejectOpen(false);
      setRejectReason('');
      setRejectCandidateId(null);
    },
  });

  const handleRejectClick = (subId: string) => {
    setRejectCandidateId(subId);
    setRejectOpen(true);
  };

  function avatarColor(score: number | null) {
    if (score === null || score === undefined) return 'bg-slate-100 text-slate-600 border-slate-200';
    if (score >= 90) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (score >= 80) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  }

  function getInitials(label: string) {
    if (!label) return 'C';
    const cleanLabel = label.trim();
    
    // E.g., "Candidate Jade Falcon" -> "JF"
    // E.g., "Alex Johnson" -> "AJ"
    const parts = cleanLabel.split(/\s+/);
    if (parts.length >= 3 && parts[0].toLowerCase() === 'candidate') {
      return (parts[1].charAt(0) + parts[2].charAt(0)).toUpperCase();
    }
    if (parts.length >= 2) {
      if (parts[0].toLowerCase() === 'candidate') {
        const second = parts[1];
        if (second.includes('-')) {
          const subparts = second.split('-');
          return subparts[0].charAt(0).toUpperCase();
        }
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
      }
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    
    // E.g., "Candidate-7b985e9d" -> "C7"
    if (cleanLabel.includes('-')) {
      const parts = cleanLabel.split('-');
      const second = parts[1];
      if (second.length > 3) {
        return ('C' + second.charAt(0)).toUpperCase();
      }
      return second.slice(0, 2).toUpperCase();
    }
    
    return cleanLabel.slice(0, 2).toUpperCase();
  }

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
            <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400 font-semibold bg-slate-50 border border-slate-100 rounded-full px-3 py-1.5 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Total Candidates Processed: <span className="text-slate-800 font-extrabold">{submissions?.length || 0}</span>
            </div>
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


      <div className="flex border-b border-slate-200 mb-6">
        <button 
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'ALL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('ALL')}
        >
          All Candidates
        </button>
        <button 
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'PIPELINE' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('PIPELINE')}
        >
          Shortlist Pipeline
        </button>
      </div>

      {activeTab === 'ALL' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Anonymized Candidates</h2>
              <p className="text-sm text-slate-500">Ranked by AI match score. PII is hidden until explicitly revealed.</p>
            </div>
            {user?.role === 'ADMIN' && campaign.status === 'CLOSED' && (
              <Button onClick={() => generateShortlistMutation.mutate()} disabled={generateShortlistMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                {generateShortlistMutation.isPending ? 'Generating...' : 'Generate Shortlist'}
              </Button>
            )}
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
                  <TableHead className="w-[220px]">Candidate</TableHead>
                  <TableHead>Match Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pipeline Stage</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub: any) => (
                  <TableRow key={sub.id} className="hover:bg-slate-50/50 cursor-default transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs border mr-3 shadow-xs ${avatarColor(sub.matchScore)}`}>
                          {getInitials(sub.candidateLabel)}
                        </div>
                        <span className="font-mono text-sm text-slate-700">{sub.candidateLabel}</span>
                        {sub.flaggedSuspicious && (
                          <span title="Suspicious submission: resume contains potential prompt override keywords, hidden Unicode blocks, or system instructions.">
                            <AlertTriangle className="h-4 w-4 text-amber-500 ml-2 animate-pulse" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-semibold ${
                        sub.matchScore && sub.matchScore >= 80 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {sub.matchScore !== null && sub.matchScore !== undefined ? `${sub.matchScore}%` : 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-normal ${
                        sub.processingStatus === 'SCORED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        sub.processingStatus === 'REVEALED' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''
                      }`}>
                        {sub.processingStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal bg-slate-50">
                        {sub.pipelineStage || 'SCREENED'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {new Date(sub.receivedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Link to={`/candidates/${sub.id}`}>
                          <Button variant="outline" size="sm" className="rounded-full border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 px-4 transition-colors font-medium">
                            Review Profile
                          </Button>
                        </Link>
                        {sub.pipelineStage === 'REJECTED' ? (
                          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 rounded-full px-3 py-0.5">Rejected</Badge>
                        ) : sub.pipelineStage === 'SHORTLISTED' ? (
                          <Badge variant="outline" className={`font-semibold rounded-full px-3 py-0.5 ${
                            sub.shortlistTier === 'PRIMARY' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {sub.shortlistTier}
                          </Badge>
                        ) : (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium px-4 shadow-xs border-0"
                              onClick={() => shortlistMutation.mutate(sub.id)}
                              disabled={shortlistMutation.isPending}
                            >
                              Shortlist
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 rounded-full font-medium px-4"
                              onClick={() => handleRejectClick(sub.id)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {activeTab === 'PIPELINE' && (
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Job Pipeline</h2>
              <p className="text-sm text-slate-500">Track candidates across the custom hiring stages.</p>
            </div>
            {campaign.publicSlug && (
              <div className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Public Application Link</span>
                <a href={`http://localhost:5173/apply/${campaign.publicSlug}`} target="_blank" rel="noreferrer" className="text-sm font-mono text-blue-600 hover:underline">
                  hireblind.in/apply/{campaign.publicSlug}
                </a>
              </div>
            )}
          </div>

          {campaign.pipelineStages && campaign.pipelineStages.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x">
              {campaign.pipelineStages
                .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
                .map((stage: any) => {
                  const stageSubmissions = submissions?.filter((s: any) => s.pipelineStage === stage.name) || [];
                  return (
                    <div key={stage.id} className="min-w-[320px] w-[320px] max-w-[320px] bg-slate-50/80 rounded-xl border border-slate-200 shadow-sm flex flex-col max-h-[70vh] snap-start">
                      <div className="p-3 border-b border-slate-200 bg-white rounded-t-xl flex justify-between items-center">
                        <h3 className="font-semibold text-[14px] text-slate-800">{stage.name}</h3>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none px-2">{stageSubmissions.length}</Badge>
                      </div>
                      <div className="p-3 overflow-y-auto flex-1 space-y-3">
                        {stageSubmissions.map((sub: any) => (
                          <div key={sub.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate(`/candidates/${sub.id}`)}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-mono text-[13px] font-semibold text-slate-700">{sub.candidateLabel}</span>
                              <Badge variant="outline" className={`text-[10px] ${
                                sub.matchScore && sub.matchScore >= 80 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}>
                                {sub.matchScore !== null && sub.matchScore !== undefined ? `${sub.matchScore}%` : 'N/A'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between mt-3 text-[11px]">
                              <span className="text-slate-500">{new Date(sub.receivedAt).toLocaleDateString()}</span>
                              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500" />
                            </div>
                          </div>
                        ))}
                        {stageSubmissions.length === 0 && (
                          <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
                            <p className="text-[12px] text-slate-400 font-medium">No candidates in {stage.name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
              })}
              
              {/* Native Rejected Column */}
              <div className="min-w-[320px] w-[320px] max-w-[320px] bg-red-50/30 rounded-xl border border-red-100 shadow-sm flex flex-col max-h-[70vh] snap-start">
                <div className="p-3 border-b border-red-100 bg-red-50/80 rounded-t-xl flex justify-between items-center">
                  <h3 className="font-semibold text-[14px] text-red-800">Rejected</h3>
                  <Badge variant="secondary" className="bg-red-100 text-red-600 border-none px-2">
                    {submissions?.filter((s: any) => s.pipelineStage === 'REJECTED').length || 0}
                  </Badge>
                </div>
                <div className="p-3 overflow-y-auto flex-1 space-y-3">
                  {submissions?.filter((s: any) => s.pipelineStage === 'REJECTED').map((sub: any) => (
                    <div key={sub.id} className="bg-white p-3 rounded-lg border border-red-200 shadow-xs opacity-75 hover:opacity-100 transition-opacity cursor-pointer group" onClick={() => navigate(`/candidates/${sub.id}`)}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-[13px] font-semibold text-slate-700">{sub.candidateLabel}</span>
                      </div>
                      <p className="text-[11px] text-red-600 font-medium truncate">{sub.rejectionReason || 'Rejected'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-xl border border-slate-200">
              <AlertTriangle className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No custom pipeline configured</h3>
              <p className="text-[13px] text-slate-500 max-w-md mx-auto">This campaign was created without custom pipeline stages. Candidates will remain in the 'SCREENED' stage.</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Candidate</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this candidate.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                rows={3}
                placeholder="e.g. Lacks required years of experience..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={!rejectReason || rejectMutation.isPending} onClick={() => rejectCandidateId && rejectMutation.mutate({ subId: rejectCandidateId, reason: rejectReason })}>
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Candidate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white font-medium flex items-center shadow-sm">
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
