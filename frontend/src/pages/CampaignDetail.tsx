import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, CheckCircle, ChevronRight, Copy, FolderArchive, ShieldAlert, User, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { EmptyState, MetricCard, PageHeader, SectionCard, StatusBadge } from '../components/ui/page';
import { candidateRoute, formatDate, safeCandidateLabel, scoreClasses, statusClasses, titleCaseStatus } from '../lib/display';

interface PipelineStage {
  id: string;
  name: string;
  orderIndex: number;
}

interface Campaign {
  id: string;
  title: string;
  description?: string;
  status: string;
  totalVacancies?: number;
  publicSlug?: string;
  pipelineStages?: PipelineStage[];
}

interface Submission {
  id: string;
  candidateLabel?: string;
  matchScore?: number | null;
  processingStatus?: string;
  pipelineStage?: string;
  receivedAt?: string;
  flaggedSuspicious?: boolean;
  shortlistTier?: string;
  rejectionReason?: string;
}

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

  const { data: campaign, isLoading: isLoadingCampaign } = useQuery<Campaign>({
    queryKey: ['campaign', id],
    queryFn: () => api.get(`/campaigns/${id}`).then((res) => res.data),
  });

  const { data: submissions = [], isLoading: isLoadingSubmissions } = useQuery<Submission[]>({
    queryKey: ['campaign-submissions', id],
    queryFn: () => api.get(`/submissions?campaignId=${id}`).then((res) => res.data),
  });

  const transitionMutation = useMutation({
    mutationFn: (action: 'activate' | 'close' | 'archive') => api.post(`/campaigns/${id}/${action}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const generateShortlistMutation = useMutation({
    mutationFn: () => api.post(`/submissions/campaigns/${id}/shortlist/generate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-submissions', id] }),
  });

  const approveBufferMutation = useMutation({
    mutationFn: (subId: string) => api.post(`/submissions/${subId}/shortlist/approve-buffer`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-submissions', id] }),
  });

  const shortlistMutation = useMutation({
    mutationFn: (subId: string) => api.post(`/submissions/${subId}/shortlist?campaignId=${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-submissions', id] }),
  });

  const promoteMutation = useMutation({
    mutationFn: (subId: string) => api.post(`/submissions/${subId}/promote`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-submissions', id] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ subId, reason }: { subId: string; reason: string }) => api.post(`/submissions/${subId}/shortlist/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-submissions', id] });
      setRejectOpen(false);
      setRejectReason('');
      setRejectCandidateId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setDeleteOpen(false);
      navigate('/jobs');
    },
  });

  const handleRejectClick = (subId: string) => {
    setRejectCandidateId(subId);
    setRejectOpen(true);
  };

  if (isLoadingCampaign) {
    return <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading job...</div>;
  }

  if (!campaign) {
    return <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500">Campaign not found.</div>;
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';
  const shortlistedCount = submissions.filter((s) => s.pipelineStage === 'SHORTLISTED').length;
  const rejectedCount = submissions.filter((s) => s.pipelineStage === 'REJECTED').length;
  const publicApplicationUrl = campaign.publicSlug ? `${window.location.origin}/apply/${campaign.publicSlug}` : '';

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link to="/jobs" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <PageHeader
            eyebrow="Job campaign"
            title={campaign.title}
            description={campaign.description}
          />
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              {campaign.status === 'DRAFT' && (
                <Button onClick={() => transitionMutation.mutate('activate')} disabled={transitionMutation.isPending} className="bg-emerald-700 text-white hover:bg-emerald-800">
                  <CheckCircle className="h-4 w-4" /> Publish
                </Button>
              )}
              {campaign.status === 'ACTIVE' && (
                <Button onClick={() => transitionMutation.mutate('close')} disabled={transitionMutation.isPending} variant="destructive">
                  <XCircle className="h-4 w-4" /> Close
                </Button>
              )}
              {campaign.status === 'CLOSED' && (
                <Button onClick={() => transitionMutation.mutate('archive')} disabled={transitionMutation.isPending} variant="outline">
                  <FolderArchive className="h-4 w-4" /> Archive
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total candidates" value={isLoadingSubmissions ? '-' : submissions.length} detail="Applications received" icon={<User className="h-5 w-5" />} />
        <MetricCard label="Shortlisted" value={shortlistedCount} detail="In review pipeline" icon={<CheckCircle className="h-5 w-5" />} />
        <MetricCard label="Rejected" value={rejectedCount} detail="Removed from shortlist" icon={<XCircle className="h-5 w-5" />} />
        <MetricCard label="Status" value={<span className="text-xl">{titleCaseStatus(campaign.status)}</span>} detail={`${campaign.totalVacancies || 0} vacancies`} icon={<FolderArchive className="h-5 w-5" />} />
      </div>

      {publicApplicationUrl && (
        <div className="flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-950">Public application link</p>
            <a href={publicApplicationUrl} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm text-blue-700 hover:underline">{publicApplicationUrl}</a>
          </div>
          <Button type="button" variant="outline" onClick={() => navigator.clipboard?.writeText(publicApplicationUrl)} className="w-fit border-blue-200 bg-white text-blue-700 hover:bg-blue-50">
            <Copy className="h-4 w-4" /> Copy
          </Button>
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-200">
        {[
          ['ALL', 'All candidates'],
          ['PIPELINE', 'Pipeline'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as 'ALL' | 'PIPELINE')}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === key ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-950'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'ALL' && (
        <SectionCard
          title="Anonymized candidates"
          description="Ranked by match score. PII remains hidden until an authorized reveal."
          action={user?.role === 'ADMIN' && campaign.status === 'CLOSED' && (
            <Button onClick={() => generateShortlistMutation.mutate()} disabled={generateShortlistMutation.isPending} className="bg-blue-700 text-white hover:bg-blue-800">
              {generateShortlistMutation.isPending ? 'Generating...' : 'Generate shortlist'}
            </Button>
          )}
          contentClassName="p-0"
        >
          {isLoadingSubmissions ? (
            <div className="p-8 text-sm text-slate-500">Loading candidates...</div>
          ) : submissions.length === 0 ? (
            <EmptyState icon={<User className="h-5 w-5" />} title="No candidates yet" description="Applications will appear here once candidates submit the public form." />
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Candidate</th>
                      <th className="px-5 py-3">Match score</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Pipeline stage</th>
                      <th className="px-5 py-3">Received</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-xs font-semibold text-blue-700">
                              {safeCandidateLabel(sub, false).slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-950">{safeCandidateLabel(sub, false)}</div>
                              {sub.flaggedSuspicious && <div className="mt-1 flex items-center gap-1 text-xs text-amber-700"><AlertTriangle className="h-3 w-3" /> Flagged for review</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4"><StatusBadge className={scoreClasses(sub.matchScore)}>{sub.matchScore != null ? `${sub.matchScore}%` : 'Not scored'}</StatusBadge></td>
                        <td className="px-5 py-4"><StatusBadge className={statusClasses(sub.processingStatus)}>{titleCaseStatus(sub.processingStatus)}</StatusBadge></td>
                        <td className="px-5 py-4"><StatusBadge className={statusClasses(sub.pipelineStage || 'SCREENED')}>{titleCaseStatus(sub.pipelineStage || 'SCREENED')}</StatusBadge></td>
                        <td className="px-5 py-4 text-slate-500">{formatDate(sub.receivedAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Link to={candidateRoute(sub.id)}>
                              <Button variant="outline" size="sm">Review</Button>
                            </Link>
                            {sub.pipelineStage === 'REJECTED' ? (
                              <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">Rejected</Badge>
                            ) : sub.pipelineStage === 'SHORTLISTED' ? (
                              <>
                                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">{sub.shortlistTier || 'Shortlisted'}</Badge>
                                <Button variant="outline" size="sm" onClick={() => promoteMutation.mutate(sub.id)} disabled={promoteMutation.isPending}>Promote</Button>
                                {sub.shortlistTier === 'BUFFER' && <Button variant="outline" size="sm" onClick={() => approveBufferMutation.mutate(sub.id)} disabled={approveBufferMutation.isPending}>Approve buffer</Button>}
                              </>
                            ) : (
                              <>
                                <Button size="sm" className="bg-blue-700 text-white hover:bg-blue-800" onClick={() => shortlistMutation.mutate(sub.id)} disabled={shortlistMutation.isPending}>Shortlist</Button>
                                <Button variant="outline" size="sm" className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" onClick={() => handleRejectClick(sub.id)}>Reject</Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 lg:hidden">
                {submissions.map((sub) => (
                  <div key={sub.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{safeCandidateLabel(sub, false)}</p>
                        <p className="mt-1 text-sm text-slate-500">{formatDate(sub.receivedAt)}</p>
                      </div>
                      <StatusBadge className={scoreClasses(sub.matchScore)}>{sub.matchScore != null ? `${sub.matchScore}%` : 'New'}</StatusBadge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link to={candidateRoute(sub.id)}><Button variant="outline" size="sm">Review</Button></Link>
                      <Button size="sm" className="bg-blue-700 text-white hover:bg-blue-800" onClick={() => shortlistMutation.mutate(sub.id)}>Shortlist</Button>
                      <Button variant="outline" size="sm" className="border-rose-200 bg-rose-50 text-rose-700" onClick={() => handleRejectClick(sub.id)}>Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      )}

      {activeTab === 'PIPELINE' && (
        <SectionCard title="Pipeline" description="Track candidates across configured stages." contentClassName="overflow-x-auto p-5">
          {campaign.pipelineStages && campaign.pipelineStages.length > 0 ? (
            <div className="flex min-h-[420px] gap-4 pb-2">
              {[...campaign.pipelineStages].sort((a, b) => a.orderIndex - b.orderIndex).map((stage) => {
                const stageSubmissions = submissions.filter((s) => s.pipelineStage === stage.name);
                return (
                  <div key={stage.id} className="flex w-[300px] shrink-0 flex-col rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                      <h3 className="font-semibold text-slate-950">{stage.name}</h3>
                      <Badge variant="outline">{stageSubmissions.length}</Badge>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto p-3">
                      {stageSubmissions.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">No candidates</div>
                      ) : stageSubmissions.map((sub) => (
                        <button key={sub.id} type="button" onClick={() => navigate(candidateRoute(sub.id))} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md">
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-semibold text-slate-950">{safeCandidateLabel(sub, false)}</span>
                            <StatusBadge className={scoreClasses(sub.matchScore)}>{sub.matchScore != null ? `${sub.matchScore}%` : 'New'}</StatusBadge>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                            {formatDate(sub.receivedAt)}
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="flex w-[300px] shrink-0 flex-col rounded-lg border border-rose-100 bg-rose-50/60">
                <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50 px-4 py-3">
                  <h3 className="font-semibold text-rose-800">Rejected</h3>
                  <Badge variant="outline" className="border-rose-200 bg-white text-rose-700">{rejectedCount}</Badge>
                </div>
                <div className="space-y-3 p-3">
                  {submissions.filter((s) => s.pipelineStage === 'REJECTED').map((sub) => (
                    <button key={sub.id} type="button" onClick={() => navigate(candidateRoute(sub.id))} className="w-full rounded-lg border border-rose-100 bg-white p-3 text-left">
                      <p className="font-semibold text-slate-950">{safeCandidateLabel(sub, false)}</p>
                      <p className="mt-2 truncate text-xs text-rose-600">{sub.rejectionReason || 'Rejected'}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState icon={<AlertTriangle className="h-5 w-5" />} title="No custom pipeline configured" description="This campaign was created without custom stages. Candidates remain in the default screening stage." />
          )}
        </SectionCard>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject candidate</DialogTitle>
            <DialogDescription>Provide a clear reason for this decision.</DialogDescription>
          </DialogHeader>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="min-h-[100px] rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20" placeholder="Reason for rejection..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={!rejectReason || rejectMutation.isPending} onClick={() => rejectCandidateId && rejectMutation.mutate({ subId: rejectCandidateId, reason: rejectReason })}>
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject candidate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {user?.role === 'ADMIN' && campaign.status === 'ARCHIVED' && (
        <SectionCard title="Danger zone" description="Permanent deletion removes campaign records from the campaign service." className="border-rose-200" contentClassName="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h4 className="font-semibold text-slate-950">Delete this campaign</h4>
              <p className="mt-1 text-sm leading-6 text-slate-500">This action is irreversible. Type the campaign title to confirm.</p>
            </div>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive"><ShieldAlert className="h-4 w-4" /> Delete campaign</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-rose-700">Delete campaign permanently</DialogTitle>
                  <DialogDescription>Type <strong>{campaign.title}</strong> to confirm deletion.</DialogDescription>
                </DialogHeader>
                <Input value={confirmTitle} onChange={(e) => setConfirmTitle(e.target.value)} placeholder="Type campaign title" />
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setDeleteOpen(false); setConfirmTitle(''); }}>Cancel</Button>
                  <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={confirmTitle !== campaign.title || deleteMutation.isPending}>
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete permanently'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
