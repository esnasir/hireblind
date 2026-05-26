import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Users, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function Candidates() {
  const { accessToken } = useAuthStore();

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['all-candidates'],
    queryFn: async () => {
      // Use existing endpoint, usually GET /api/submissions or GET /api/campaigns/submissions
      try {
        const response = await axios.get('/api/processing/submissions', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        return response.data;
      } catch (e) {
        // Fallback or ignore if the endpoint is slightly different
        console.error(e);
        return [];
      }
    },
    enabled: !!accessToken
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Candidates</h1>
        <p className="text-[14px] text-slate-500 mt-1">View all applicants across all jobs.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="mx-auto h-8 w-8 mb-3 opacity-40" />
          <p className="text-[14px] font-medium">No candidates yet</p>
          <p className="text-[13px] mt-1">Candidates will appear here once applications are submitted.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Candidate ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Applied For</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Stage</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">LLM Score</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Applied Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {submissions.map((sub: any) => (
                <tr key={sub.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-[13px] font-medium text-slate-900 font-mono">
                    {sub.candidateLabel || sub.id.substring(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-600">
                    {sub.campaignTitle || 'Unknown Job'}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-600">
                    {sub.stage || 'APPLIED'}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-600">
                    {sub.overallScore != null ? `${sub.overallScore}%` : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-500">
                    {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/candidates/${sub.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 text-[12px]">
                        Review
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
