import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Users, Mail, ShieldAlert, Plus, ShieldCheck } from 'lucide-react';

export default function TeamSettings() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteRole, setInviteRole] = useState<'RECRUITER' | 'ADMIN'>('RECRUITER');
  
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: () => api.get('/iam/team').then(res => res.data),
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
      <div className="flex flex-col items-center justify-center py-20">
        <ShieldAlert className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-slate-500 mt-2">Only administrators can manage the team.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Team Management</h1>
          <p className="text-slate-500 mt-1">Manage recruiters, reviewers, and platform administrators.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white flex items-center">
          <Plus className="mr-2 h-4 w-4" /> Invite Member
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">Active Members & Invitations</h2>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers?.map((member: any) => (
                <TableRow key={member.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold border border-slate-200 shadow-xs">
                        {member.fullName ? member.fullName.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 text-[14px]">
                          {member.fullName || 'Pending...'}
                        </div>
                        <div className="text-slate-500 text-[12px] flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {member.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {member.role === 'ADMIN' || member.role === 'OWNER' ? (
                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Users className="h-4 w-4 text-slate-400" />
                      )}
                      <span className="text-sm font-medium text-slate-700 capitalize">{member.role.toLowerCase()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-medium ${
                      member.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      member.status === 'INVITED' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation email to a new recruiter or administrator to join your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <Input
                value={inviteFullName}
                onChange={(e) => setInviteFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email address <span className="text-red-500">*</span></label>
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="jane@example.com"
                type="email"
                className="w-full h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Role</label>
              <Select value={inviteRole} onValueChange={(val: any) => setInviteRole(val)}>
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECRUITER">Recruiter</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Recruiters can view and process candidates. Administrators can also manage team members, create jobs, and reveal candidate identities.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => inviteMutation.mutate()} 
              disabled={!inviteEmail || inviteMutation.isPending}
              className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
            >
              {inviteMutation.isPending ? 'Sending Invite...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
