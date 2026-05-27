import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Users } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { EmptyState, PageHeader, SectionCard, StatusBadge } from '../components/ui/page';
import { candidateRoute, formatDate, safeCandidateLabel, scoreClasses, statusClasses, titleCaseStatus } from '../lib/display';

interface CandidateListItem {
  id: string;
  candidateLabel?: string;
  campaignTitle?: string;
  pipelineStage?: string;
  stage?: string;
  processingStatus?: string;
  overallScore?: number | null;
  matchScore?: number | null;
  submittedAt?: string;
  receivedAt?: string;
}

export default function Candidates() {
  const { data: submissions = [], isLoading } = useQuery<CandidateListItem[]>({
    queryKey: ['all-candidates'],
    queryFn: () => api.get('/submissions').then((res) => res.data),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Review"
        title="Candidates"
        description="Browse anonymized applicants across every job. Identity details stay hidden unless an admin reveals them."
      />

      <SectionCard title="All candidates" description="Candidate names and contact details are masked in this list." contentClassName="p-0">
        {isLoading ? (
          <div className="p-8 text-sm text-slate-500">Loading candidates...</div>
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="No candidates yet"
            description="Candidates will appear here once they apply to active job postings."
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Candidate</th>
                    <th className="px-5 py-3">Applied for</th>
                    <th className="px-5 py-3">Stage</th>
                    <th className="px-5 py-3">Match score</th>
                    <th className="px-5 py-3">Applied</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-xs font-semibold text-blue-700">
                            <Shield className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-950">{safeCandidateLabel(sub, false)}</div>
                            <div className="text-xs text-slate-500">Identity hidden</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{sub.campaignTitle || 'Unknown job'}</td>
                      <td className="px-5 py-4">
                        <StatusBadge className={statusClasses(sub.pipelineStage || sub.stage || sub.processingStatus)}>{titleCaseStatus(sub.pipelineStage || sub.stage || 'Applied')}</StatusBadge>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge className={scoreClasses(sub.overallScore ?? sub.matchScore)}>{sub.overallScore != null ? `${sub.overallScore}%` : sub.matchScore != null ? `${sub.matchScore}%` : 'Not scored'}</StatusBadge>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{formatDate(sub.submittedAt || sub.receivedAt)}</td>
                      <td className="px-5 py-4 text-right">
                        <Link to={candidateRoute(sub.id)}>
                          <Button variant="outline" size="sm">Review <ArrowRight className="h-3.5 w-3.5" /></Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {submissions.map((sub) => (
                <Link key={sub.id} to={candidateRoute(sub.id)} className="block p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{safeCandidateLabel(sub, false)}</p>
                      <p className="mt-1 text-sm text-slate-500">{sub.campaignTitle || 'Unknown job'}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(sub.submittedAt || sub.receivedAt)}</p>
                    </div>
                    <StatusBadge className={scoreClasses(sub.overallScore ?? sub.matchScore)}>{sub.overallScore != null ? `${sub.overallScore}%` : sub.matchScore != null ? `${sub.matchScore}%` : 'New'}</StatusBadge>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
}
