import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Plus, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { EmptyState, PageHeader, SectionCard, StatusBadge } from '../components/ui/page';
import { formatDate, initialsFrom, statusClasses, titleCaseStatus } from '../lib/display';

interface TeamMember {
  id: string;
  fullName?: string;
  email: string;
  role: string;
  status?: string;
  createdAt?: string;
}

export default function TeamSettings() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteRole, setInviteRole] = useState<'RECRUITER' | 'ADMIN'>('RECRUITER');

  const { data: teamMembers, isLoading } = useQuery<TeamMember[]>({
    queryKey: ['team'],
    queryFn: () => api.get('/iam/team').then((res) => res.data),
  });

  const inviteMutation = useMutation({
    mutationFn: () => api.post('/iam/invitations', {
      email: inviteEmail,
      fullName: inviteFullName,
      role: inviteRole
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      setInviteOpen(false);
      setInviteEmail('');
      setInviteFullName('');
      setInviteRole('RECRUITER');
    }
  });

  if (user?.role !== 'ADMIN' && user?.role !== 'OWNER') {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
        <ShieldAlert className="mb-4 h-10 w-10 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-950">Access denied</h2>
        <p className="mt-2 text-sm text-slate-500">Only administrators and owners can manage team members.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="Team"
        description="Invite teammates and manage access to candidate review workflows."
        action={
          <Button onClick={() => setInviteOpen(true)} className="bg-slate-950 text-white hover:bg-slate-800">
            <Plus className="h-4 w-4" /> Invite member
          </Button>
        }
      />

      <SectionCard title="Members and invitations" description="Roles determine who can manage jobs, view candidates, and reveal identities." contentClassName="p-0">
        {isLoading ? (
          <div className="p-8 text-sm text-slate-500">Loading team...</div>
        ) : !teamMembers || teamMembers.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="No team members"
            description="Invite recruiters and administrators to collaborate on hiring campaigns."
            action={<Button onClick={() => setInviteOpen(true)} className="bg-slate-950 text-white hover:bg-slate-800"><Plus className="h-4 w-4" /> Invite member</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamMembers?.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700">
                          {initialsFrom(member.fullName || member.email, 'U')}
                        </div>
                        <div>
                          <div className="font-medium text-slate-950">{member.fullName || 'Pending invite'}</div>
                          <div className="flex items-center gap-1 text-xs text-slate-500"><Mail className="h-3 w-3" /> {member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-slate-700">
                        {member.role === 'ADMIN' || member.role === 'OWNER' ? <ShieldCheck className="h-4 w-4 text-blue-700" /> : <Users className="h-4 w-4 text-slate-400" />}
                        <span>{titleCaseStatus(member.role)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge className={statusClasses(member.status)}>{titleCaseStatus(member.status)}</StatusBadge>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(member.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>
              Send an invitation to a recruiter or administrator in your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="inviteName">Full name</label>
              <Input id="inviteName" value={inviteFullName} onChange={(e) => setInviteFullName(e.target.value)} placeholder="Jane Doe" className="h-10" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="inviteEmail">Email address <span className="text-rose-600">*</span></label>
              <Input id="inviteEmail" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="jane@example.com" type="email" className="h-10" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Role</label>
              <Select value={inviteRole} onValueChange={(val) => setInviteRole(val as 'RECRUITER' | 'ADMIN')}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECRUITER">Recruiter</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs leading-5 text-slate-500">Administrators can manage team members and reveal candidate identities. Recruiters cannot reveal identities.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={() => inviteMutation.mutate()} disabled={!inviteEmail || inviteMutation.isPending} className="bg-slate-950 text-white hover:bg-slate-800">
              {inviteMutation.isPending ? 'Sending...' : 'Send invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
