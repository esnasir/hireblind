import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Plus, Briefcase, ChevronRight, Search, MapPin, Building, Calendar } from 'lucide-react';
import { Input } from '../components/ui/input';

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
  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: () => api.get('/campaigns').then(res => res.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Campaigns</h1>
          <p className="text-[14px] text-slate-500 mt-1">Manage active roles and view historical hiring pipelines.</p>
        </div>
        
        <Link to="/jobs/new">
          <Button className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-[13px] rounded-md shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Post a Job
          </Button>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search campaigns..." 
              className="pl-9 h-9 text-[13px] border-slate-200 rounded-md focus-visible:ring-slate-300"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="h-6 w-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
              <Briefcase className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-900 mb-1">No campaigns found</h3>
            <p className="text-[13px] text-slate-500 max-w-sm mx-auto mb-6">
              Create a new hiring campaign to start accepting candidates.
            </p>
            <Link to="/jobs/new">
              <Button className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-[13px] rounded-md shadow-sm">
                <Plus className="mr-2 h-4 w-4" /> Post a Job
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {campaigns.map((campaign) => (
                  <tr 
                    key={campaign.id} 
                    onClick={() => navigate(`/jobs/${campaign.id}`)}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{campaign.title}</span>
                        <div className="flex items-center text-slate-500 text-[12px] mt-1 gap-3">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(campaign.createdAt).toLocaleDateString()}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                          <span>{campaign.totalVacancies} Vacancies</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium text-[12px]">
                        <Building className="h-3.5 w-3.5" />
                        {campaign.department || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-900 font-medium">{campaign.locationType || 'Any'}</span>
                        <span className="text-slate-500 text-[12px]">{campaign.employmentType || 'Full-time'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${
                        campaign.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' : 
                        campaign.status === 'PUBLISHED' || campaign.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
