import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import CreateCampaign from './pages/CreateCampaign';
import CampaignDetail from './pages/CampaignDetail';
import CandidateDetail from './pages/CandidateDetail';
import AuditLog from './pages/AuditLog';
import PublicApplication from './pages/PublicApplication';
import TeamSettings from './pages/TeamSettings';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

import Settings from './pages/Settings';
import ProfileSettings from './pages/settings/ProfileSettings';
import CompanySettings from './pages/settings/CompanySettings';
import Candidates from './pages/Candidates';

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  const isAuthorized = user?.role === 'ADMIN' || user?.role === 'OWNER';
  return isAuthorized ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/apply/:slug" element={<PublicApplication />} />
          
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs" element={<Campaigns />} />
            <Route path="/jobs/new" element={<CreateCampaign />} />
            <Route path="/jobs/:id" element={<CampaignDetail />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/candidates/:id" element={<CandidateDetail />} />
            <Route path="/team" element={<TeamSettings />} />
            
            <Route path="/settings" element={<Settings />}>
              <Route path="profile" element={<ProfileSettings />} />
              <Route path="company" element={<CompanySettings />} />
              <Route path="notifications" element={<div className="p-6 text-slate-500">Notifications settings coming soon.</div>} />
              <Route path="security" element={<div className="p-6 text-slate-500">Security settings coming soon.</div>} />
            </Route>

            <Route path="/audit" element={
              <AdminRoute>
                <AuditLog />
              </AdminRoute>
            } />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
