import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Building2, Calendar, ChevronRight, MapPin, Plus, Search } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { EmptyState, PageHeader, SectionCard, StatusBadge } from '../components/ui/page';
import { formatDate, jobRoute, statusClasses, titleCaseStatus } from '../lib/display';

interface Campaign {
  id: string;
  title: string;
  department: string;
  employmentType: string;
  locationType: string;
  status: string;
  createdAt: string;
  totalVacancies: number;
}

export default function Campaigns() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: () => api.get('/campaigns').then((res) => res.data),
  });

  const filteredCampaigns = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return campaigns;
    return campaigns.filter((campaign) =>
      [campaign.title, campaign.department, campaign.employmentType, campaign.locationType, campaign.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [campaigns, search]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Campaigns"
        title="Jobs"
        description="Create roles, manage campaign status, and review anonymized applicants."
        action={
          <Link to="/jobs/new">
            <Button className="bg-slate-950 text-white hover:bg-slate-800">
              <Plus className="h-4 w-4" /> Post a job
            </Button>
          </Link>
        }
      />

      <SectionCard
        title="All jobs"
        description="Search and open a campaign to review candidates."
        action={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs" className="h-9 pl-9" />
          </div>
        }
        contentClassName="p-0"
      >
        {isLoading ? (
          <div className="p-8 text-sm text-slate-500">Loading jobs...</div>
        ) : filteredCampaigns.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-5 w-5" />}
            title={campaigns.length === 0 ? 'No jobs yet' : 'No jobs match your search'}
            description={campaigns.length === 0 ? 'Post your first job to start receiving anonymized applications.' : 'Try a different title, department, or status.'}
            action={campaigns.length === 0 && <Link to="/jobs/new"><Button className="bg-slate-950 text-white hover:bg-slate-800"><Plus className="h-4 w-4" /> Post a job</Button></Link>}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Location</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCampaigns.map((campaign) => (
                    <tr key={campaign.id} onClick={() => navigate(jobRoute(campaign.id))} className="cursor-pointer transition-colors hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-950">{campaign.title}</div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="h-3.5 w-3.5" /> {formatDate(campaign.createdAt)}
                          <span>·</span>
                          <span>{campaign.totalVacancies} vacancies</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{campaign.department || 'General'}</td>
                      <td className="px-5 py-4">
                        <div className="text-slate-950">{campaign.locationType || 'Any'}</div>
                        <div className="text-xs text-slate-500">{campaign.employmentType || 'Full-time'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge className={statusClasses(campaign.status)}>{titleCaseStatus(campaign.status)}</StatusBadge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {filteredCampaigns.map((campaign) => (
                <button key={campaign.id} type="button" onClick={() => navigate(jobRoute(campaign.id))} className="w-full p-5 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-950">{campaign.title}</h3>
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><Building2 className="h-4 w-4" /> {campaign.department || 'General'}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-4 w-4" /> {campaign.locationType || 'Any'} · {campaign.employmentType || 'Full-time'}</p>
                    </div>
                    <StatusBadge className={statusClasses(campaign.status)}>{titleCaseStatus(campaign.status)}</StatusBadge>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
}
