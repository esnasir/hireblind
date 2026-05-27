import React, { useState } from 'react';
import axios from 'axios';
import { Camera, Loader2, Lock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { SectionCard } from '../../components/ui/page';
import { useAuthStore } from '../../store/authStore';

export default function ProfileSettings() {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const response = await axios.put('/api/iam/users/me',
        { fullName },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (user && accessToken && refreshToken) {
        setAuth(accessToken, refreshToken, { ...user, fullName: response.data.fullName });
      }
      setMessage('Profile updated.');
    } catch (error) {
      setMessage('Profile update failed.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Profile" description="Keep your recruiter profile current.">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="group relative flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-2xl font-semibold text-slate-600">
              {(user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/45 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <Button variant="outline" size="sm">Change photo</Button>
              <p className="mt-2 text-xs text-slate-500">Profile photos are optional and not shown in candidate review.</p>
            </div>
          </div>

          <div className="grid max-w-xl gap-5">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-10" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="flex items-center gap-2">Email address <Lock className="h-3 w-3 text-slate-400" /></Label>
              <Input id="email" value={user?.email || ''} disabled className="h-10 bg-slate-50 text-slate-500" />
              <p className="text-xs text-slate-500">Contact an administrator to change your email.</p>
            </div>
          </div>

          <div>
            <Button onClick={handleSaveProfile} disabled={isSaving || fullName === user?.fullName} className="bg-slate-950 text-white hover:bg-slate-800">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
            {message && <p className={`mt-3 text-sm ${message.includes('updated') ? 'text-emerald-700' : 'text-rose-700'}`}>{message}</p>}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Password" description="Password changes are handled securely by the IAM service.">
        <div className="grid max-w-xl gap-4">
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input id="currentPassword" type="password" className="h-10" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" type="password" className="h-10" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input id="confirmPassword" type="password" className="h-10" />
          </div>
          <Button className="w-fit" variant="outline">Update password</Button>
        </div>
      </SectionCard>
    </div>
  );
}
