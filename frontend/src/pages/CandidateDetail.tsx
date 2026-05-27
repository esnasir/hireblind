import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  Lock,
  Send,
  Shield,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import { PageHeader, SectionCard, StatusBadge } from '../components/ui/page';
import { cleanUrlLabel, formatDateTime, jobRoute, safeCandidateLabel, scoreClasses, statusClasses, titleCaseStatus } from '../lib/display';
import { formatActorName } from '../lib/utils';

interface CandidateSubmission {
  id: string;
  campaignId?: string;
  candidateLabel?: string;
  candidateName?: string;
  candidateEmail?: string;
  processingStatus?: string;
  pipelineStage?: string;
  shortlistTier?: string;
  matchScore?: number | null;
  overallScore?: number | null;
  currentProfileId?: string;
  currentScoreId?: string;
  extractedUrlsJson?: string;
  flaggedSuspicious?: boolean;
  flagReason?: string;
  yearsOfExperience?: number | null;
  currentJobRole?: string;
  currentCompany?: string;
  phone?: string;
}

interface CandidateProfile {
  experienceSummary?: string;
  educationSummaryRedacted?: string;
}

interface CandidateScore {
  scoreValue?: number | null;
  summaryReason?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  explainabilityTags?: string[];
}

interface CandidateNote {
  id: string;
  authorEmail?: string;
  createdAt?: string;
  content?: string;
}

interface ProfessionalProfileUrl {
  platform: string;
  url: string;
}

export default function CandidateDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [revealOpen, setRevealOpen] = useState(false);
  const [revealedData, setRevealedData] = useState<{ candidateName: string; candidateEmail: string } | null>(null);
  const [newNote, setNewNote] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data: submission, isLoading: loadingSub } = useQuery<CandidateSubmission>({
    queryKey: ['submission', id],
    queryFn: () => api.get(`/submissions/${id}`).then((res) => res.data),
  });

  const { data: profile, isLoading: loadingProfile } = useQuery<CandidateProfile>({
    queryKey: ['profile', id],
    queryFn: () => api.get(`/submissions/${id}/profile`).then((res) => res.data),
    enabled: !!submission?.currentProfileId,
  });

  const { data: score, isLoading: loadingScore } = useQuery<CandidateScore>({
    queryKey: ['score', id],
    queryFn: () => api.get(`/submissions/${id}/score`).then((res) => res.data),
    enabled: !!submission?.currentScoreId,
  });

  const { data: notes, isLoading: loadingNotes } = useQuery<CandidateNote[]>({
    queryKey: ['notes', id],
    queryFn: () => api.get(`/submissions/${id}/notes`).then((res) => res.data),
    enabled: !!submission && submission.processingStatus === 'REVEALED',
  });

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => api.post(`/submissions/${id}/notes`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', id] });
      setNewNote('');
    },
  });

  const shortlistMutation = useMutation({
    mutationFn: () => {
      if (!submission?.campaignId) return Promise.reject(new Error('Campaign id missing'));
      return api.post(`/submissions/${id}/shortlist?campaignId=${submission.campaignId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submission', id] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => api.post(`/submissions/${id}/shortlist/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', id] });
      setRejectOpen(false);
      setRejectReason('');
    },
  });

  const revealMutation = useMutation({
    mutationFn: () => api.post(`/submissions/${id}/reveal`),
    onSuccess: (res) => {
      setRevealedData(res.data);
      queryClient.invalidateQueries({ queryKey: ['submission', id] });
      setRevealOpen(false);
    },
  });

  if (loadingSub) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!submission) {
    return <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500">Candidate not found.</div>;
  }

  let extractedUrls: ProfessionalProfileUrl[] = [];
  if (submission.extractedUrlsJson) {
    try {
      const parsed = JSON.parse(submission.extractedUrlsJson) as unknown;
      extractedUrls = Array.isArray(parsed)
        ? parsed.filter((item): item is ProfessionalProfileUrl =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as ProfessionalProfileUrl).platform === 'string' &&
            typeof (item as ProfessionalProfileUrl).url === 'string'
          )
        : [];
    } catch (e) {
      console.error('Failed to parse extracted URLs JSON', e);
    }
  }

  const isRevealed = submission.processingStatus === 'REVEALED' || !!revealedData;
  const canShowIdentity = user?.role === 'ADMIN' && isRevealed;
  const displayName = safeCandidateLabel(submission, canShowIdentity, revealedData);
  const displayEmail = canShowIdentity ? (revealedData?.candidateEmail || submission.candidateEmail) : null;
  const scoreValue = score?.scoreValue ?? submission.matchScore ?? submission.overallScore ?? 0;
  const explainabilityTags = score?.explainabilityTags ?? [];

  const handleDownloadResume = async () => {
    try {
      const res = await api.get(`/submissions/${id}/resume`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = res.headers['content-disposition'];
      let filename = 'resume.pdf';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match?.[1]) filename = match[1];
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Failed to download resume', err);
      alert('Failed to download resume. It may not exist or you do not have permission.');
    }
  };

  return (
    <div className="space-y-8">
      {submission.flaggedSuspicious && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <h3 className="font-semibold text-amber-950">Suspicious submission activity</h3>
              <p className="mt-1 text-sm leading-6 text-amber-800">This submission was flagged by preprocessing checks and should be reviewed carefully.</p>
              {user?.role === 'ADMIN' && submission.flagReason && (
                <p className="mt-3 rounded-md border border-amber-200 bg-white/70 p-3 text-xs leading-5 text-amber-900">{submission.flagReason}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <Link to={jobRoute(submission.campaignId)} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" /> Back to campaign
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <PageHeader
            eyebrow="Candidate review"
            title={displayName}
            description={displayEmail || 'Identity details are hidden during initial review.'}
          />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge className={statusClasses(submission.processingStatus)}>{titleCaseStatus(submission.processingStatus)}</StatusBadge>
            {user?.role === 'ADMIN' && !isRevealed && !revealedData && (
              <Dialog open={revealOpen} onOpenChange={setRevealOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-slate-950 text-white hover:bg-slate-800">
                    <Eye className="h-4 w-4" /> Reveal identity
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-700">
                      <ShieldAlert className="h-5 w-5" /> Confirm identity reveal
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                      This will unmask candidate PII for your account and create an immutable audit event.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setRevealOpen(false)}>Cancel</Button>
                    <Button className="bg-amber-600 text-white hover:bg-amber-700" onClick={() => revealMutation.mutate()} disabled={revealMutation.isPending}>
                      {revealMutation.isPending ? 'Revealing...' : 'Acknowledge and reveal'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <SectionCard title="Profile overview" description="Recruiter-facing details are anonymized unless an admin reveal has been performed.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Experience</p>
                <p className="mt-1 font-medium text-slate-950">{submission.yearsOfExperience != null ? `${submission.yearsOfExperience} years` : 'Not available'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Current role</p>
                <p className="mt-1 truncate font-medium text-slate-950" title={submission.currentJobRole || ''}>{submission.currentJobRole || 'Not available'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Current company</p>
                <p className="mt-1 font-medium text-slate-950">{canShowIdentity ? (submission.currentCompany || 'Not available') : 'Hidden until reveal'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Contact</p>
                {canShowIdentity ? (
                  <p className="mt-1 text-sm leading-5 text-slate-700">{submission.phone || 'No phone'}<br />{displayEmail || 'No email'}</p>
                ) : (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"><Lock className="h-3 w-3" /> Hidden</span>
                )}
              </div>
            </div>
          </SectionCard>

          {extractedUrls.length > 0 && (
            <SectionCard title="Professional profiles" description={canShowIdentity ? 'Profile links extracted from the application.' : 'Profile links are treated as identity-bearing and stay locked until reveal.'}>
              <div className="grid gap-3 md:grid-cols-2">
                {extractedUrls.map((item, idx) => {
                  const isLocked = !canShowIdentity || item.url === '[REDACTED]';
                  return (
                    <div key={`${item.platform}-${idx}`} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{item.platform}</p>
                        <p className="mt-1 truncate text-sm font-medium text-slate-800" title={isLocked ? undefined : item.url}>{isLocked ? 'Available after reveal' : cleanUrlLabel(item.url)}</p>
                      </div>
                      {isLocked ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"><Lock className="h-3 w-3" /> Locked</span>
                      ) : (
                        <a href={item.url.startsWith('http') ? item.url : `https://${item.url}`} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
                          Open <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          <SectionCard
            title={canShowIdentity ? 'Candidate experience' : 'Anonymized experience'}
            description="Parsed summary from the candidate profile."
            action={canShowIdentity && <Button onClick={handleDownloadResume} variant="outline" size="sm"><Download className="h-4 w-4" /> Original resume</Button>}
          >
            {loadingProfile ? <Skeleton className="h-32 w-full" /> : (
              <div className="space-y-6 text-sm leading-7 text-slate-700">
                <p className="whitespace-pre-wrap">{profile?.experienceSummary || 'No experience summary available.'}</p>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-950">Education</h4>
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-3">{profile?.educationSummaryRedacted || 'No education summary available.'}</p>
                </div>
              </div>
            )}
          </SectionCard>

          {isRevealed && (
            <SectionCard title="Recruiter notes" description="Private notes visible to your hiring team.">
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} className="min-h-[88px] flex-1 rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20" placeholder="Add a note..." />
                  <Button onClick={() => addNoteMutation.mutate(newNote)} disabled={!newNote.trim() || addNoteMutation.isPending} className="self-end bg-slate-950 text-white hover:bg-slate-800">
                    <Send className="h-4 w-4" /> {addNoteMutation.isPending ? 'Saving...' : 'Add note'}
                  </Button>
                </div>
                {loadingNotes ? <Skeleton className="h-20 w-full" /> : notes?.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">No notes yet.</p>
                ) : (
                  <div className="space-y-3">
                    {notes?.map((note) => (
                      <div key={note.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-medium text-slate-950">{formatActorName(note.authorEmail)}</span>
                          <span className="text-xs text-slate-500">{formatDateTime(note.createdAt)}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          )}
        </div>

        <aside className="space-y-6">
          <SectionCard className="xl:sticky xl:top-6" contentClassName="p-0">
            <div className="border-b border-slate-100 bg-slate-950 p-6 text-white">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-100">
                <Shield className="h-4 w-4" /> Match score
              </div>
              <div className="mt-4 text-5xl font-semibold tracking-tight">{loadingScore ? '-' : scoreValue}<span className="text-2xl text-slate-400">/100</span></div>
            </div>
            <div className="space-y-6 p-5">
              <div>
                <h4 className="text-sm font-semibold text-slate-950">Screening summary</h4>
                <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">{score?.summaryReason || 'No screening summary available.'}</p>
              </div>
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Matched skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {score?.matchedSkills?.length ? score.matchedSkills.map((skill: string) => (
                    <Badge key={skill} variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">{skill}</Badge>
                  )) : <span className="text-sm text-slate-400">None identified</span>}
                </div>
              </div>
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950"><XCircle className="h-4 w-4 text-rose-500" /> Missing skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {score?.missingSkills?.length ? score.missingSkills.map((skill: string) => (
                    <Badge key={skill} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">{skill}</Badge>
                  )) : <span className="text-sm text-slate-400">None identified</span>}
                </div>
              </div>
              {explainabilityTags.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap gap-2">
                    {explainabilityTags.map((tag) => (
                      <StatusBadge key={tag} className={scoreClasses(scoreValue)}>{tag.replace(/_/g, ' ')}</StatusBadge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Decision" description="Move the candidate through shortlist review.">
            {submission.pipelineStage === 'REJECTED' ? (
              <StatusBadge className="border-rose-200 bg-rose-50 text-rose-700">Rejected</StatusBadge>
            ) : submission.pipelineStage === 'SHORTLISTED' ? (
              <StatusBadge className="border-blue-200 bg-blue-50 text-blue-700">Shortlisted {submission.shortlistTier ? `· ${titleCaseStatus(submission.shortlistTier)}` : ''}</StatusBadge>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                <Button className="bg-blue-700 text-white hover:bg-blue-800" onClick={() => shortlistMutation.mutate()} disabled={shortlistMutation.isPending}>
                  Add to shortlist
                </Button>
                <Button variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" onClick={() => setRejectOpen(true)}>
                  Reject
                </Button>
              </div>
            )}
          </SectionCard>
        </aside>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700"><XCircle className="h-5 w-5" /> Reject candidate</DialogTitle>
            <DialogDescription>Provide a reason so the decision is clear to your hiring team.</DialogDescription>
          </DialogHeader>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="min-h-[110px] rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20" placeholder="Reason for rejection..." />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button className="bg-rose-600 text-white hover:bg-rose-700" onClick={() => rejectMutation.mutate(rejectReason)} disabled={rejectMutation.isPending || !rejectReason.trim()}>
              {rejectMutation.isPending ? 'Rejecting...' : 'Confirm rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
