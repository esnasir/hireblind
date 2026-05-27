import React, { useState } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { SectionCard } from '../../components/ui/page';
import { useAuthStore } from '../../store/authStore';

export default function CompanySettings() {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();
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
      if (user && accessToken && refreshToken) {
        setAuth(accessToken, refreshToken, { ...user, companyName: response.data.companyName });
      }
      setMessage('Company details updated.');
    } catch (error) {
      setMessage('Company update failed.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SectionCard title="Company" description="Manage the workspace details shown to your hiring team.">
      <div className="grid max-w-xl gap-5">
        <div className="grid gap-2">
          <Label htmlFor="companyName">Company name</Label>
          <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-10" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" placeholder="https://example.com" value={website} onChange={(e) => setWebsite(e.target.value)} className="h-10" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="industry">Industry</Label>
          <select id="industry" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            <option value="">Select industry</option>
            <option value="tech">Technology</option>
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="companySize">Company size</Label>
          <select id="companySize" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20" value={companySize} onChange={(e) => setCompanySize(e.target.value)}>
            <option value="">Select size</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-500">201-500 employees</option>
            <option value="501+">501+ employees</option>
          </select>
        </div>
        <div className="pt-2">
          <Button onClick={handleSaveCompany} disabled={isSaving} className="bg-slate-950 text-white hover:bg-slate-800">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
          {message && <p className={`mt-3 text-sm ${message.includes('updated') ? 'text-emerald-700' : 'text-rose-700'}`}>{message}</p>}
        </div>
      </div>
    </SectionCard>
  );
}
