import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Briefcase, Users, FileText, CheckCircle } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';

export default function Dashboard() {
  const { data: campaignStats, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['campaignStats'],
    queryFn: () => api.get('/campaigns/stats').then(res => res.data),
  });

  const { data: submissionStats, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['submissionStats'],
    queryFn: () => api.get('/submissions/stats').then(res => res.data),
  });

  const StatCard = ({ title, value, icon: Icon, loading }: { title: string, value: string | number, icon: any, loading: boolean }) => (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        <Icon className="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold text-slate-900">{value}</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your screening platform.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Campaigns" 
          value={campaignStats?.TOTAL || 0} 
          icon={Briefcase} 
          loading={isLoadingCampaigns} 
        />
        <StatCard 
          title="Active Campaigns" 
          value={campaignStats?.ACTIVE || 0} 
          icon={CheckCircle} 
          loading={isLoadingCampaigns} 
        />
        <StatCard 
          title="Total Submissions" 
          value={submissionStats?.TOTAL || 0} 
          icon={Users} 
          loading={isLoadingSubmissions} 
        />
        <StatCard 
          title="Scored Candidates" 
          value={submissionStats?.SCORED || 0} 
          icon={FileText} 
          loading={isLoadingSubmissions} 
        />
      </div>

      {/* Placeholder for recent activity or charts */}
      <Card className="mt-6 border-slate-200 shadow-sm min-h-[300px] flex items-center justify-center bg-slate-50/50">
        <p className="text-slate-500 text-sm">Recent activity will appear here.</p>
      </Card>
    </div>
  );
}
