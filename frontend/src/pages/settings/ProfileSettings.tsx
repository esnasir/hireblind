import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Lock, Camera, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function ProfileSettings() {
  const { user, setAuth, accessToken } = useAuthStore();
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
      if (user && accessToken) {
        setAuth(accessToken, { ...user, fullName: response.data.fullName });
      }
      setMessage('Profile updated successfully.');
    } catch (error) {
      setMessage('Failed to update profile.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Profile</h2>
        <p className="text-[13px] text-slate-500 mt-1">Manage your personal information.</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 relative group cursor-pointer">
            <span className="text-2xl font-medium text-slate-600">
              {(user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
            </span>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <Button variant="outline" size="sm" className="h-8 text-[13px]">Change Photo</Button>
            <p className="text-[12px] text-slate-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input 
            id="fullName" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            className="max-w-md"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            Email Address <Lock className="h-3 w-3 text-slate-400" />
          </Label>
          <Input 
            id="email" 
            value={user?.email || ''} 
            disabled 
            className="max-w-md bg-slate-50 text-slate-500"
          />
          <p className="text-[12px] text-slate-500 mt-1">Contact support to change your email.</p>
        </div>

        <div>
          <Button 
            onClick={handleSaveProfile} 
            disabled={isSaving || fullName === user?.fullName}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          {message && <p className={`text-[13px] mt-3 ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
        </div>
      </div>

      <div className="pt-8 border-t border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Change Password</h3>
        <div className="space-y-4 max-w-md">
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" type="password" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" type="password" />
          </div>
          <Button className="mt-2" variant="outline">Update Password</Button>
        </div>
      </div>
    </div>
  );
}
