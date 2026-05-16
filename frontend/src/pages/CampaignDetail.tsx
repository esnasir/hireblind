import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { ArrowLeft, User, FileText, ChevronRight } from 'lucide-react';

export default function CampaignDetail() {
  const { id } = useParams();

  const { data: campaign, isLoading: isLoadingCampaign } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => api.get(`/campaigns/${id}`).then(res => res.data),
  });

  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['campaign-submissions', id],
    queryFn: () => api.get(`/submissions?campaignId=${id}`).then(res => res.data),
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
    </div>
  );
}
