import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Briefcase, Users, Plus, ArrowRight, Activity } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

interface Campaign {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  totalVacancies: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();

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
        const response = await axios.get('/api/processing/submissions', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        return response.data.length || 0;
      } catch (e) {
        return 0;
      }
    },
    enabled: !!accessToken
  });

  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE' || c.status === 'PUBLISHED').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-[14px] text-slate-500 mt-1">Overview of your unbiased hiring pipeline.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
            <h3 className="text-[13px] font-semibold text-slate-600">Active Jobs</h3>
          </div>
          <div className="text-3xl font-bold text-slate-900">{isLoadingCampaigns ? '-' : activeCampaigns}</div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <h3 className="text-[13px] font-semibold text-slate-600">Total Candidates</h3>
          </div>
          <div className="text-3xl font-bold text-slate-900">{isLoadingCandidates ? '-' : candidatesCount}</div>
        </div>
      </div>

      {/* Recent Campaigns Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-slate-900">Recent Jobs</h2>
          {campaigns.length > 0 && (
            <Link to="/jobs" className="text-[13px] font-medium text-slate-500 hover:text-slate-900 flex items-center transition-colors">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {isLoadingCampaigns ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <div className="h-6 w-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
            <Briefcase className="mx-auto h-8 w-8 mb-3 opacity-40" />
            <p className="text-[14px] font-medium text-slate-900">No jobs posted yet</p>
            <p className="text-[13px] mt-1 text-slate-500">Create your first job to start receiving applications.</p>
            <Button
              onClick={() => navigate('/jobs/new')}
              className="mt-4 bg-slate-900 text-white text-[13px] h-8 px-4"
            >
              Post a Job
            </Button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {campaigns.slice(0, 5).map((campaign) => (
                <div 
                  key={campaign.id} 
                  onClick={() => navigate(`/jobs/${campaign.id}`)}
                  className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
                >
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
                    <Button variant="ghost" className="h-8 px-3 text-[12px] font-medium text-slate-600 hover:text-slate-900">
                      View Details
                    </Button>
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
