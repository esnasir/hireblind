import React from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';

export default function Settings() {
  const location = useLocation();

  if (location.pathname === '/settings' || location.pathname === '/settings/') {
    return <Navigate to="/settings/profile" replace />;
  }

  const links = [
    { name: 'Profile', path: '/settings/profile' },
    { name: 'Company', path: '/settings/company' },
    { name: 'Notifications', path: '/settings/notifications' },
    { name: 'Security', path: '/settings/security' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-[14px] text-slate-500 mt-1">Manage your account and workspace preferences.</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 border-t border-slate-200 pt-8">
        <aside className="w-full md:w-[160px] shrink-0">
          <nav className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto pb-2 md:pb-0">
            {links.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
                    isActive 
                      ? 'bg-slate-100 text-slate-900' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </aside>
        
        <div className="flex-1 min-w-0 max-w-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
