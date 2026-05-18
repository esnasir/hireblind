import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import { ArrowLeft, User, BrainCircuit, ShieldAlert, Eye, CheckCircle2, XCircle, FileText, Download, MessageSquare, Send } from 'lucide-react';

export default function CandidateDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [revealOpen, setRevealOpen] = useState(false);
  const [revealedData, setRevealedData] = useState<{candidateName: string, candidateEmail: string} | null>(null);
  const [newNote, setNewNote] = useState('');
  
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data: submission, isLoading: loadingSub } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => api.get(`/submissions/${id}`).then(res => res.data),
  });

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => api.get(`/submissions/${id}/profile`).then(res => res.data),
    enabled: !!submission?.currentProfileId,
  });

  const { data: score, isLoading: loadingScore } = useQuery({
    queryKey: ['score', id],
    queryFn: () => api.get(`/submissions/${id}/score`).then(res => res.data),
    enabled: !!submission?.currentScoreId,
  });

  const { data: notes, isLoading: loadingNotes } = useQuery({
    queryKey: ['notes', id],
    queryFn: () => api.get(`/submissions/${id}/notes`).then(res => res.data),
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
    mutationFn: () => api.post(`/submissions/${id}/shortlist?campaignId=${submission.campaignId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', id] });
    },
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

  if (loadingSub) return <div className="space-y-4"><Skeleton className="h-8 w-1/4"/><Skeleton className="h-[400px] w-full"/></div>;
  if (!submission) return <div>Candidate not found</div>;

  const isRevealed = submission.processingStatus === 'REVEALED';

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
        if (match && match[1]) filename = match[1];
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
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link to={`/campaigns/${submission.campaignId}`} className="text-sm font-medium text-slate-500 hover:text-slate-900 inline-flex items-center mb-4 transition-colors">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Campaign
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
              <User className="h-5 w-5 text-slate-600" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
              {revealedData?.candidateName || submission.candidateName || submission.candidateLabel}
            </h1>
            <Badge variant="outline" className={`font-normal ml-2 ${
              isRevealed ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {submission.processingStatus}
            </Badge>
          </div>
          {(revealedData?.candidateEmail || submission.candidateEmail) && (
            <p className="text-slate-600 mt-1 ml-14">{revealedData?.candidateEmail || submission.candidateEmail}</p>
          )}

          {/* D.1 State button details */}
          <div className="flex items-center gap-3 mt-4 ml-14">
            {submission.pipelineStage === 'REJECTED' ? (
              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 font-semibold px-3 py-1">
                REJECTED
              </Badge>
            ) : submission.pipelineStage === 'SHORTLISTED' ? (
              <Badge variant="outline" className={`font-semibold px-3 py-1 ${
                submission.shortlistTier === 'PRIMARY' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                SHORTLISTED ({submission.shortlistTier})
              </Badge>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 font-medium"
                  onClick={() => shortlistMutation.mutate()}
                  disabled={shortlistMutation.isPending}
                >
                  Add to Shortlist
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 font-medium"
                  onClick={() => setRejectOpen(true)}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>

        {user?.role === 'ADMIN' && !isRevealed && !revealedData && (
          <Dialog open={revealOpen} onOpenChange={setRevealOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800">
                <Eye className="mr-2 h-4 w-4" /> Reveal Identity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center text-amber-600">
                  <ShieldAlert className="mr-2 h-5 w-5" /> Confirm Identity Reveal
                </DialogTitle>
                <DialogDescription className="pt-2 text-slate-600">
                  This action will permanently unmask the candidate's personally identifiable information (PII). 
                  An immutable audit event will be recorded attributing this action to your account.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button variant="ghost" onClick={() => setRevealOpen(false)}>Cancel</Button>
                <Button 
                  className="bg-amber-600 hover:bg-amber-700 text-white" 
                  onClick={() => revealMutation.mutate()}
                  disabled={revealMutation.isPending}
                >
                  {revealMutation.isPending ? 'Revealing...' : 'Acknowledge & Reveal'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Reject Dialogue Modal */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <XCircle className="mr-2 h-5 w-5" /> Reject Candidate
            </DialogTitle>
            <DialogDescription className="pt-2 text-slate-600">
              Please specify the reason for rejecting this candidate. This will exclude them from the active shortlist pipeline.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
              placeholder="e.g., Lacks required professional years of experience in system design..."
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white font-medium" 
              onClick={() => rejectMutation.mutate(rejectReason)}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Anonymized Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Overview Grid Section */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
              <CardTitle className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Candidate Profile Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Experience</span>
                <span className="text-sm font-medium text-slate-800">
                  {submission.yearsOfExperience !== null && submission.yearsOfExperience !== undefined ? `${submission.yearsOfExperience} Years` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Role</span>
                <span className="text-sm font-medium text-slate-800 truncate block font-mono" title={submission.currentJobRole || 'N/A'}>
                  {submission.currentJobRole || 'N/A'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Company</span>
                <span className="text-sm font-medium text-slate-800 truncate block font-mono" title={submission.currentCompany || 'N/A'}>
                  {submission.currentCompany || 'N/A'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contact Info</span>
                {isRevealed ? (
                  <div className="text-xs text-slate-700 space-y-0.5">
                    <span className="block font-mono font-medium">{submission.phone || 'No phone'}</span>
                    <span className="block text-blue-600 hover:underline truncate" title={submission.linkedinUrl || ''}>
                      {submission.linkedinUrl ? (
                        <a href={`https://${submission.linkedinUrl}`} target="_blank" rel="noopener noreferrer">{submission.linkedinUrl}</a>
                      ) : 'No LinkedIn'}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 inline-block">
                    Locked (Masked PII)
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-xl flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center m-0">
                <FileText className="mr-2 h-5 w-5 text-slate-400" />
                {isRevealed ? "Candidate Experience" : "Anonymized Experience"}
              </CardTitle>
              {isRevealed && (
                <Button onClick={handleDownloadResume} variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 shrink-0">
                  <Download className="mr-2 h-4 w-4" /> Original Resume
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              {loadingProfile ? <Skeleton className="h-32 w-full" /> : (
                <div className="prose prose-slate max-w-none">
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
                    {profile?.experienceSummary || "No experience summary available."}
                  </p>
                  
                  <h4 className="text-sm font-semibold text-slate-900 mt-6 mb-2 uppercase tracking-wider">Education</h4>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-100">
                    {profile?.educationSummaryRedacted || "No education summary available."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {isRevealed && (
            <Card className="shadow-sm border-slate-200 mt-6">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-xl">
                <CardTitle className="text-lg flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-slate-400" />
                  Recruiter Notes
                </CardTitle>
                <CardDescription>Private notes visible only to your team.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    placeholder="Add a note about this candidate..."
                  />
                  <Button 
                    onClick={() => addNoteMutation.mutate(newNote)}
                    disabled={!newNote.trim() || addNoteMutation.isPending}
                    className="self-end bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Send className="mr-2 h-4 w-4" /> {addNoteMutation.isPending ? 'Saving...' : 'Add Note'}
                  </Button>
                </div>

                <div className="space-y-4 mt-6">
                  {loadingNotes ? <Skeleton className="h-20 w-full" /> : notes?.length === 0 ? (
                    <p className="text-sm text-slate-500 italic text-center py-4 border-t border-slate-100 mt-4">No notes yet. Be the first to add one.</p>
                  ) : (
                    notes?.map((note: any) => (
                      <div key={note.id} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm text-slate-900">{note.authorEmail}</span>
                          <span className="text-xs text-slate-500">{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Score Explainability */}
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
              <BrainCircuit className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <div className="text-sm font-medium opacity-90 uppercase tracking-wider mb-1">Match Score</div>
              {loadingScore ? (
                <Skeleton className="h-12 w-24 mx-auto bg-white/20" />
              ) : (
                <div className="text-5xl font-bold">{score?.scoreValue || 0}<span className="text-2xl opacity-70">/100</span></div>
              )}
            </div>
            
            <CardContent className="pt-6">
              {loadingScore ? <div className="space-y-2"><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-full"/></div> : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 mb-2">AI Assessment</h4>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-100">
                      {score?.summaryReason}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 mb-3 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" /> Matched Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {score?.matchedSkills?.map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="bg-green-50 text-green-700 border-green-200 font-normal">
                          {skill}
                        </Badge>
                      ))}
                      {(!score?.matchedSkills || score.matchedSkills.length === 0) && (
                        <span className="text-sm text-slate-400">None identified</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-900 mb-3 flex items-center">
                      <XCircle className="h-4 w-4 mr-1 text-red-500" /> Missing Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {score?.missingSkills?.map((skill: string) => (
                        <Badge key={skill} variant="outline" className="text-slate-600 font-normal bg-slate-50 border-slate-200">
                          {skill}
                        </Badge>
                      ))}
                      {(!score?.missingSkills || score.missingSkills.length === 0) && (
                        <span className="text-sm text-slate-400">None identified</span>
                      )}
                    </div>
                  </div>

                  {/* D.3 missing skills card experienceGaps category */}
                  {score?.experienceGaps && score.experienceGaps.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 mb-3 flex items-center">
                        <ShieldAlert className="h-4 w-4 mr-1 text-amber-500" /> Experience Gaps
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {score.experienceGaps.map((gap: string) => (
                          <Badge key={gap} variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 font-normal">
                            {gap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {score?.explainabilityTags && score.explainabilityTags.length > 0 && (
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {score.explainabilityTags.map((tag: string) => (
                          <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                            {tag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
