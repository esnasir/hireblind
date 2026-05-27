import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { Badge } from '../components/ui/badge';
import { EmptyState, PageHeader, SectionCard } from '../components/ui/page';
import { formatDateTime } from '../lib/display';
import { formatActorName } from '../lib/utils';

interface AuditEvent {
  id: string;
  timestamp?: string;
  createdAt?: string;
  actionType?: string;
  eventType?: string;
  actorEmail?: string;
  actorId?: string;
  actorType?: string;
  entityType?: string;
  entityId?: string;
}

export default function AuditLog() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['auditEvents'],
    queryFn: () => api.get('/audit/events').then((res) => res.data),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Compliance"
        title="Audit log"
        description="Append-only record of sensitive actions and system events across the platform."
      />

      <SectionCard
        title="Recent events"
        description="Records are displayed for review and cannot be edited from the frontend."
        action={<Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700"><Activity className="h-3 w-3" /> Live</Badge>}
        contentClassName="p-0"
      >
        {isLoading ? (
          <div className="p-8 text-sm text-slate-500">Loading audit events...</div>
        ) : events?.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="h-5 w-5" />}
            title="No events recorded"
            description="Compliance events will appear here when logins, campaign changes, or reveal actions are recorded."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Actor</th>
                  <th className="px-5 py-3">Entity</th>
                  <th className="px-5 py-3 text-right">Event ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events?.map((event: AuditEvent) => {
                  const action = event.actionType || event.eventType || 'EVENT';
                  return (
                    <tr key={event.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600">{formatDateTime(event.timestamp || event.createdAt)}</td>
                      <td className="px-5 py-4">
                        <Badge variant="outline" className={action.includes('REVEAL') ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-700'}>
                          {action.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-950">{formatActorName(event.actorEmail || event.actorId)}</div>
                        <div className="text-xs text-slate-500">{event.actorType || 'User'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-slate-700">{event.entityType || 'Entity'}</div>
                        <div className="max-w-[180px] truncate text-xs text-slate-500" title={event.entityId}>{event.entityId}</div>
                      </td>
                      <td className="px-5 py-4 text-right text-xs text-slate-400">{String(event.id).slice(0, 8)}...</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
