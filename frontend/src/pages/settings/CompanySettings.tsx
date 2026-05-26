import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

export default function CompanySettings() {
  const { user, setAuth, accessToken } = useAuthStore();
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [website, setWebsite] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveCompany = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const response = await axios.put('/api/iam/tenants/me', 
        { companyName, industry, companySize, website },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (user && accessToken) {
        setAuth(accessToken, { ...user, companyName: response.data.companyName });
      }
      setMessage('Company details updated successfully.');
    } catch (error) {
      setMessage('Failed to update company details.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Company Settings</h2>
        <p className="text-[13px] text-slate-500 mt-1">Manage your workspace and company information.</p>
      </div>

      <div className="space-y-6 max-w-md">
        <div className="grid gap-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input 
            id="companyName" 
            value={companyName} 
            onChange={(e) => setCompanyName(e.target.value)} 
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="website">Website</Label>
          <Input 
            id="website" 
            placeholder="https://example.com"
            value={website} 
            onChange={(e) => setWebsite(e.target.value)} 
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="industry">Industry</Label>
          <select 
            id="industry"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            <option value="">Select industry...</option>
            <option value="tech">Technology</option>
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="companySize">Company Size</Label>
          <select 
            id="companySize"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={companySize}
            onChange={(e) => setCompanySize(e.target.value)}
          >
            <option value="">Select size...</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-500">201-500 employees</option>
            <option value="501+">501+ employees</option>
          </select>
        </div>

        <div className="pt-4">
          <Button 
            onClick={handleSaveCompany} 
            disabled={isSaving}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          {message && <p className={`text-[13px] mt-3 ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
        </div>
      </div>
    </div>
  );
}
