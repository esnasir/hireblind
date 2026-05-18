import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Briefcase, Users, FileText, CheckCircle, Clock, MapPin, Calendar, HelpCircle, ArrowUpRight, BarChart3 } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { formatActorName } from '../lib/utils';

export default function Dashboard() {
  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get('/campaigns').then(res => res.data),
  });

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
      return (data || []).slice(0, 10).map((event: any) => ({
        id: event.id,
        eventType: event.actionType,
        actorId: event.actorId,
        timestamp: event.timestamp,
      }));
    }),
  });

  const eventDotColor = (eventType: string) => {
    switch (eventType) {
      case 'IDENTITY_REVEALED':
        return 'bg-amber-500 shadow-sm shadow-amber-200';
      case 'CAMPAIGN_CREATED':
        return 'bg-green-500 shadow-sm shadow-green-200';
      case 'CAMPAIGN_STATUS_CHANGED':
        return 'bg-blue-500 shadow-sm shadow-blue-200';
      case 'SUBMISSION_RECEIVED':
        return 'bg-indigo-500 shadow-sm shadow-indigo-200';
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

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    loading, 
    onClick, 
    clickable 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    loading: boolean; 
    onClick?: () => void; 
    clickable?: boolean;
  }) => (
    <Card 
      onClick={onClick}
      className={`shadow-xs border-slate-200/80 transition-all duration-300 ${
        clickable 
          ? 'cursor-pointer hover:shadow-md hover:border-blue-400 hover:scale-[1.01] active:scale-[0.99] group' 
          : ''
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</CardTitle>
        <Icon className={`h-4 w-4 transition-colors ${clickable ? 'text-slate-400 group-hover:text-blue-500' : 'text-slate-400'}`} />
      </CardHeader>
      <CardContent className="flex items-baseline justify-between">
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-3xl font-bold tracking-tight text-slate-900">{value}</div>
        )}
        {clickable && !loading && (
          <span className="text-[10px] font-medium text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
            View Analytics <ArrowUpRight className="h-3 w-3" />
          </span>
        )}
      </CardContent>
    </Card>
  );

  // Parse state stats or use seeded state defaults
  const stateStats: Record<string, number> = submissionStats?.stateStats || {
    "Karnataka": 4,
    "Maharashtra": 3,
    "Telangana": 2,
    "Delhi": 2,
    "Tamil Nadu": 1
  };

  const maxStateCount = Math.max(...Object.values(stateStats), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Real-time overview of candidate screenings & demographics.</p>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid gap-5 md:grid-cols-3">
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
      </div>

      {/* Main Grid Layout - Restructured */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Side: Demographics SVG Chart */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="shadow-xs border-slate-200/80 overflow-hidden">
            <CardHeader className="border-b border-slate-100/80 bg-slate-50/40 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">Geographic Talent Distribution</CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-0.5">State-wise distribution of applications received.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingSubmissions ? (
                <div className="space-y-4 py-4">
                  <Skeleton className="h-[220px] w-full rounded-lg" />
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  {/* Interactive Premium SVG Chart */}
                  <div className="w-full md:w-3/5">
                    <svg viewBox="0 0 500 240" className="w-full h-auto">
                      {/* Grid Lines */}
                      <line x1="50" y1="30" x2="480" y2="30" stroke="#f8fafc" strokeWidth="1" />
                      <line x1="50" y1="75" x2="480" y2="75" stroke="#f8fafc" strokeWidth="1" />
                      <line x1="50" y1="120" x2="480" y2="120" stroke="#f8fafc" strokeWidth="1" />
                      <line x1="50" y1="165" x2="480" y2="165" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="50" y1="210" x2="480" y2="210" stroke="#cbd5e1" strokeWidth="1.5" />

                      {/* Y-Axis Label Indicators */}
                      <text x="40" y="34" className="text-[10px] font-medium fill-slate-400 text-right" textAnchor="end">{maxStateCount}</text>
                      <text x="40" y="124" className="text-[10px] font-medium fill-slate-400 text-right" textAnchor="end">{Math.ceil(maxStateCount / 2)}</text>
                      <text x="40" y="214" className="text-[10px] font-medium fill-slate-400 text-right" textAnchor="end">0</text>

                      {/* Render Bars */}
                      {Object.entries(stateStats).map(([state, count], index) => {
                        const barWidth = 40;
                        const spacing = (430 - (Object.keys(stateStats).length * barWidth)) / (Object.keys(stateStats).length + 1);
                        const x = 50 + spacing + index * (barWidth + spacing);
                        
                        // Calculate height
                        const maxBarHeight = 180;
                        const height = (count / maxStateCount) * maxBarHeight;
                        const y = 210 - height;
                        
                        return (
                          <g key={state} className="group cursor-pointer">
                            {/* Curved Gradient Column Bar */}
                            <path
                              d={`M ${x} 210 L ${x} ${y + 6} Q ${x} ${y} ${x + 6} ${y} L ${x + barWidth - 6} ${y} Q ${x + barWidth} ${y} ${x + barWidth} ${y + 6} L ${x + barWidth} 210 Z`}
                              className="fill-blue-500/80 group-hover:fill-blue-600 transition-all duration-300"
                            />
                            
                            {/* Label under bar */}
                            <text
                              x={x + barWidth / 2}
                              y="228"
                              className="text-[9px] font-medium fill-slate-500 group-hover:fill-slate-900 group-hover:font-semibold transition-colors text-center"
                              textAnchor="middle"
                            >
                              {state.substring(0, 10)}
                            </text>

                            {/* Floating count hover banner */}
                            <rect
                              x={x - 2}
                              y={y - 22}
                              width={barWidth + 4}
                              height={16}
                              rx={4}
                              className="fill-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            />
                            <text
                              x={x + barWidth / 2}
                              y={y - 11}
                              className="text-[9px] font-bold fill-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              textAnchor="middle"
                            >
                              {count}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* List breakdown next to chart */}
                  <div className="w-full md:w-2/5 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Demographic Breakdown</h3>
                    <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                      {Object.entries(stateStats).map(([state, count]) => {
                        const pct = Math.round((count / (submissionStats?.TOTAL || 12)) * 100);
                        return (
                          <div key={state} className="flex flex-col gap-1 text-sm bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                            <div className="flex justify-between font-medium text-slate-700">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                {state}
                              </span>
                              <span>{count} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                                style={{ width: `${pct}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Large Platform Submission Intelligence & Metrics Card */}
          <Card className="shadow-xs border-slate-200/80 overflow-hidden">
            <CardHeader className="border-b border-slate-100/80 bg-slate-50/40 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 animate-pulse">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">Platform Submission Intelligence & Metrics</CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-0.5">Historical ingestion breakdown and active campaigns volume.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Temporal Application Metrics Grid */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Temporal Application Volume</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100/60">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Processed Today</span>
                      <span className="block text-2xl font-extrabold text-slate-800 mt-1">{submissionStats?.applicationsToday ?? 0}</span>
                    </div>
                    <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100/60">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Past 7 Days</span>
                      <span className="block text-2xl font-extrabold text-slate-800 mt-1">{submissionStats?.applicationsWeekly ?? 0}</span>
                    </div>
                    <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100/60">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Past 30 Days</span>
                      <span className="block text-2xl font-extrabold text-slate-800 mt-1">{submissionStats?.applicationsMonthly ?? 0}</span>
                    </div>
                    <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100/60">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Past 12 Months</span>
                      <span className="block text-2xl font-extrabold text-slate-800 mt-1">{submissionStats?.applicationsYearly ?? 0}</span>
                    </div>
                  </div>
                  
                  {/* Historical Ingestion Totals Info */}
                  <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/30 flex items-center justify-between mt-6">
                    <div>
                      <span className="block text-[10px] font-bold text-blue-500 uppercase tracking-wider">Overall Platform Ingests</span>
                      <span className="block text-xs text-slate-400 mt-0.5">Cumulative candidate submissions (all campaigns).</span>
                    </div>
                    <span className="text-3xl font-extrabold text-blue-600">{submissionStats?.TOTAL ?? 0}</span>
                  </div>
                </div>

                {/* Right Column: Campaign Ingest Distribution List */}
                <div className="space-y-4 flex flex-col">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Campaign Intake Shares</h3>
                  <div className="flex-1 overflow-y-auto max-h-[220px] pr-2 space-y-3 custom-scrollbar">
                    {isLoadingCampaigns ? (
                      <div className="space-y-2"><Skeleton className="h-8 w-full"/><Skeleton className="h-8 w-full"/></div>
                    ) : campaigns && campaigns.length > 0 ? (
                      campaigns.map((campaign: any) => {
                        const count = submissionStats?.campaignStats?.[campaign.id] ?? 0;
                        const total = submissionStats?.TOTAL ?? 1;
                        const percent = Math.min(100, Math.round((count / total) * 100));
                        return (
                          <div key={campaign.id} className="space-y-1.5 bg-slate-50/40 border border-slate-100/50 rounded-xl p-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-700 truncate max-w-[200px]" title={campaign.title}>
                                {campaign.title}
                              </span>
                              <span className="font-bold text-slate-500">{count} ({percent}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-400 italic py-4 text-center">No campaigns seeded yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Space-Optimized Sidebar Recent Activity */}
        <div className="lg:col-span-4">
          <Card className="shadow-xs border-slate-200/80 h-full flex flex-col">
            <CardHeader className="border-b border-slate-100/80 bg-slate-50/40 pb-4">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" /> Recent Platform Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex-1 overflow-y-auto max-h-[360px] lg:max-h-none">
              {isLoadingActivity ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-2 w-2 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !recentActivity || recentActivity.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-xs italic">No recent activity recorded.</p>
                </div>
              ) : (
                <ul className="relative border-l border-slate-100 ml-1.5 space-y-5 py-1">
                  {recentActivity.map((event: any) => (
                    <li key={event.id} className="relative pl-5 group">
                      {/* Timeline dot */}
                      <span className={`absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white ${eventDotColor(event.eventType)}`} />
                      
                      <div className="min-w-0">
                        <p className="text-xs text-slate-700 leading-relaxed">
                          <span className="font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {formatActorName(event.actorId)}
                          </span>
                          {' '}{eventLabel(event.eventType)}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
