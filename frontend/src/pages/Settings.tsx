import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { Bell, Building2, Lock, User } from 'lucide-react';
import { PageHeader } from '../components/ui/page';
import { cn } from '../lib/utils';

export default function Settings() {
  const location = useLocation();

  if (location.pathname === '/settings' || location.pathname === '/settings/') {
    return <Navigate to="/settings/profile" replace />;
  }

  const links = [
    { name: 'Profile', path: '/settings/profile', icon: User },
    { name: 'Company', path: '/settings/company', icon: Building2 },
    { name: 'Notifications', path: '/settings/notifications', icon: Bell },
    { name: 'Security', path: '/settings/security', icon: Lock },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Manage account details, company profile, notifications, and security preferences."
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm lg:h-fit">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950',
                    isActive && 'bg-slate-950 text-white hover:bg-slate-950 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
