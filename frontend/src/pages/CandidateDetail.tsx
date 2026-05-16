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
import { ArrowLeft, User, BrainCircuit, ShieldAlert, Eye, CheckCircle2, XCircle, FileText } from 'lucide-react';

export default function CandidateDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [revealOpen, setRevealOpen] = useState(false);
  const [revealedData, setRevealedData] = useState<{candidateName: string, candidateEmail: string} | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to={`/campaigns/${submission.campaignId}`} className="text-sm font-medium text-slate-500 hover:text-slate-900 inline-flex items-center mb-4 transition-colors">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Campaign
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
              <User className="h-5 w-5 text-slate-600" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
              {revealedData?.candidateName || (isRevealed ? "Identity Revealed (Refresh to load)" : submission.candidateLabel)}
            </h1>
            <Badge variant="outline" className={`font-normal ml-2 ${
              isRevealed ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {submission.processingStatus}
            </Badge>
          </div>
          {revealedData?.candidateEmail && (
            <p className="text-slate-600 mt-1 ml-14">{revealedData.candidateEmail}</p>
          )}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Anonymized Profile */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-xl">
              <CardTitle className="text-lg flex items-center">
                <FileText className="mr-2 h-5 w-5 text-slate-400" />
                Anonymized Experience
              </CardTitle>
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
