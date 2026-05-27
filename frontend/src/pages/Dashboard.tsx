import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Briefcase, Plus, ShieldCheck, Users } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { EmptyState, MetricCard, PageHeader, SectionCard, StatusBadge } from '../components/ui/page';
import { formatDate, jobRoute, statusClasses, titleCaseStatus } from '../lib/display';

interface Campaign {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  totalVacancies: number;
}

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await api.get('/campaigns');
      return res.data;
    },
  });

  const { data: candidatesCount = 0, isLoading: isLoadingCandidates } = useQuery({
    queryKey: ['dashboard-candidates-count'],
    queryFn: async () => {
      try {
        const response = await api.get('/submissions');
        return response.data.length || 0;
      } catch {
        return 0;
      }
    },
  });

  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE' || c.status === 'PUBLISHED').length;
  const draftCampaigns = campaigns.filter((c) => c.status === 'DRAFT').length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="Dashboard"
        description="A quick view of jobs, candidates, and review activity across your hiring workspace."
        action={
          <Button className="bg-slate-950 text-white hover:bg-slate-800" onClick={() => navigate('/jobs/new')}>
            <Plus className="h-4 w-4" /> Post a job
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Active jobs" value={isLoadingCampaigns ? '-' : activeCampaigns} detail={`${draftCampaigns} draft jobs waiting`} icon={<Activity className="h-5 w-5" />} />
        <MetricCard label="Total candidates" value={isLoadingCandidates ? '-' : candidatesCount} detail="Across all campaigns" icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Privacy posture" value="Locked" detail="PII hidden until authorized reveal" icon={<ShieldCheck className="h-5 w-5" />} />
      </div>

      <SectionCard
        title="Recent jobs"
        description="Track current campaigns and open the candidate pipeline."
        action={campaigns.length > 0 && (
          <Link to="/jobs" className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-950">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        contentClassName="p-0"
      >
        {isLoadingCampaigns ? (
          <div className="p-8 text-sm text-slate-500">Loading jobs...</div>
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-5 w-5" />}
            title="No jobs posted yet"
            description="Create your first hiring campaign to start receiving anonymized applications."
            action={<Button onClick={() => navigate('/jobs/new')} className="bg-slate-950 text-white hover:bg-slate-800"><Plus className="h-4 w-4" /> Post a job</Button>}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {campaigns.slice(0, 5).map((campaign) => (
              <button
                key={campaign.id}
                type="button"
                onClick={() => navigate(jobRoute(campaign.id))}
                className="flex w-full flex-col gap-3 p-5 text-left transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-semibold text-slate-950">{campaign.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{formatDate(campaign.createdAt)} · {campaign.totalVacancies} vacancies</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge className={statusClasses(campaign.status)}>{titleCaseStatus(campaign.status)}</StatusBadge>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
