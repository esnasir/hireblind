import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Briefcase, Users, Plus, ArrowRight, ShieldCheck, Activity } from 'lucide-react';
import { Button } from '../components/ui/button';

interface Campaign {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  totalVacancies: number;
}

export default function Dashboard() {
  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await api.get('/campaigns');
      return res.data;
    },
  });

  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE' || c.status === 'PUBLISHED').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-[14px] text-slate-500 mt-1">Overview of your unbiased hiring pipeline.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
            <h3 className="text-[13px] font-semibold text-slate-600">Active Campaigns</h3>
          </div>
          <div className="text-3xl font-bold text-slate-900">{isLoading ? '-' : activeCampaigns}</div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <h3 className="text-[13px] font-semibold text-slate-600">Total Candidates</h3>
          </div>
          <div className="text-3xl font-bold text-slate-900">-</div>
          <div className="text-[11px] text-slate-400 mt-1">Pending submission service integration</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-[13px] font-semibold text-slate-300">Compliance Status</h3>
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400"></div> All Systems Secure
          </div>
        </div>
      </div>

      {/* Recent Campaigns Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-slate-900">Recent Campaigns</h2>
          {campaigns.length > 0 && (
            <Link to="/campaigns" className="text-[13px] font-medium text-slate-500 hover:text-slate-900 flex items-center transition-colors">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <div className="h-6 w-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
              <Briefcase className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-900 mb-1">No campaigns yet</h3>
            <p className="text-[13px] text-slate-500 max-w-sm mx-auto mb-6">
              Create your first campaign to start accepting and anonymously evaluating candidates.
            </p>
            <Link to="/campaigns/new">
              <Button className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-[13px] rounded-md shadow-sm">
                <Plus className="mr-2 h-4 w-4" /> Create Campaign
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {campaigns.slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-900 mb-0.5">{campaign.title}</h3>
                    <div className="text-[12px] text-slate-500 flex items-center gap-3">
                      <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                      <span>{campaign.totalVacancies} vacancies</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${
                      campaign.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' : 
                      campaign.status === 'PUBLISHED' ? 'bg-blue-50 text-blue-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {campaign.status}
                    </span>
                    <Link to={`/campaigns/${campaign.id}`}>
                      <Button variant="ghost" className="h-8 px-3 text-[12px] font-medium text-slate-600 hover:text-slate-900">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
