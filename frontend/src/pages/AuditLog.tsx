import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { ShieldAlert, Activity } from 'lucide-react';

export default function AuditLog() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['auditEvents'],
    queryFn: () => api.get('/audit/events').then(res => res.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
          <ShieldAlert className="mr-2 h-6 w-6 text-indigo-600" /> Compliance Audit Log
        </h1>
        <p className="text-slate-500 mt-1">Immutable record of system actions and data access.</p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Events</CardTitle>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
              <Activity className="mr-1 h-3 w-3" /> Live
            </Badge>
          </div>
          <CardDescription>
            Records are append-only. No updates or deletions are permitted.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : events?.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No audit events recorded yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead className="text-right">Event ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events?.map((event: any) => (
                  <TableRow key={event.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                      {new Date(event.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`font-mono text-xs ${
                        event.actionType.includes('REVEAL') ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {event.actionType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-900">{event.actorId}</div>
                      <div className="text-xs text-slate-500">{event.actorType}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-700">{event.entityType}</div>
                      <div className="text-xs text-slate-500 font-mono truncate max-w-[150px]" title={event.entityId}>
                        {event.entityId}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-400">
                      {event.id.substring(0, 8)}...
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
