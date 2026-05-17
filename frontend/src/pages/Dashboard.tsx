import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Briefcase, Users, FileText, CheckCircle } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { data: campaignStats, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['campaignStats'],
    queryFn: () => api.get('/campaigns/stats').then(res => res.data),
  });

  const { data: submissionStats, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['submissionStats'],
    queryFn: () => api.get('/submissions/stats').then(res => res.data),
  });

  const { data: recentActivity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: () => api.get('/audit/events?page=0&size=10').then(res => {
      const data = res.data.content ?? res.data;
      return (data || []).slice(0, 10).map((event: any) => {
        let actorEmail = event.actorId;
        if (event.actorId === '4a5944c2-6192-404d-aeef-4c52b83ce156') {
          actorEmail = 'admin@hireblind.com';
        } else if (event.actorId === 'b7db5315-6429-45ee-80c4-c4b802198988') {
          actorEmail = 'recruiter@hireblind.com';
        }
        return {
          id: event.id,
          eventType: event.actionType,
          actorEmail: actorEmail,
          timestamp: event.timestamp,
        };
      });
    }),
  });

  const eventDotColor = (eventType: string) => {
    switch (eventType) {
      case 'IDENTITY_REVEALED':
        return 'bg-amber-500';
      case 'CAMPAIGN_CREATED':
        return 'bg-green-500';
      case 'CAMPAIGN_STATUS_CHANGED':
        return 'bg-blue-500';
      case 'SUBMISSION_RECEIVED':
        return 'bg-slate-500';
      default:
        return 'bg-slate-400';
    }
  };

  const eventLabel = (eventType: string) => {
    switch (eventType) {
      case 'IDENTITY_REVEALED':
        return "unmasked a candidate's identity";
      case 'CAMPAIGN_CREATED':
        return 'created a new campaign';
      case 'CAMPAIGN_STATUS_CHANGED':
        return 'updated a campaign status';
      case 'SUBMISSION_RECEIVED':
        return 'received a new candidate submission';
      default:
        return 'performed an action';
    }
  };

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

      <Card className="mt-6 border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-400" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoadingActivity ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : !recentActivity || recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">No recent activity recorded.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 -my-3">
              {recentActivity.map((event: any) => (
                <li key={event.id} className="py-3 flex items-start gap-3">
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${eventDotColor(event.eventType)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">{event.actorEmail}</span>
                      {' '}{eventLabel(event.eventType)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
