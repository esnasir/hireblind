import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Shield, LayoutDashboard, Briefcase, FileText, LogOut, Users, Settings } from 'lucide-react';
import { Button } from '../ui/button';

export default function AppLayout() {
  const { accessToken, user, clearAuth } = useAuthStore();
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const isOwnerOrAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN';

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Campaigns', path: '/campaigns', icon: Briefcase },
    ...(isOwnerOrAdmin ? [{ name: 'Team', path: '/team', icon: Users }] : []),
    ...(isOwnerOrAdmin ? [{ name: 'Audit Log', path: '/audit', icon: FileText }] : []),
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // Extract domain from email for a placeholder workspace name
  const workspaceName = user?.email?.split('@')[1]?.split('.')[0]?.toUpperCase() || 'WORKSPACE';

  return (
    <div className="flex h-screen bg-white overflow-hidden text-slate-900 font-sans selection:bg-slate-200 selection:text-slate-900">
      {/* Sidebar - Fixed */}
      <aside className="w-[240px] flex-shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col hidden md:flex">
        {/* Workspace Selector / Header */}
        <div className="h-14 flex items-center px-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded bg-slate-900 flex items-center justify-center text-white">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold tracking-tight text-slate-900 leading-none">{workspaceName}</span>
              <span className="text-[11px] font-medium text-slate-500 mt-0.5">HireBlind Pro</span>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-[13px] font-medium transition-all ${
                  isActive 
                    ? 'bg-slate-200/60 text-slate-900' 
                    : 'text-slate-600 hover:bg-slate-200/40 hover:text-slate-900'
                }`}
              >
                <Icon className={`mr-2.5 h-4 w-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile / Footer */}
        <div className="p-3 border-t border-slate-200">
          <div className="flex items-center px-2 py-2 mb-2">
            <div className="h-7 w-7 rounded bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold uppercase">
              {user?.fullName?.charAt(0) || user?.email?.charAt(0)}
            </div>
            <div className="ml-2.5 min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-900 truncate leading-none">{user?.fullName || 'User'}</p>
              <p className="text-[11px] font-medium text-slate-500 truncate mt-1">{user?.role}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-600 hover:bg-red-50 hover:text-red-600 h-8 px-2 text-[13px]" 
            onClick={clearAuth}
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content - Scrolls independently */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden bg-white">
        {/* Mobile Header */}
        <header className="h-14 border-b border-slate-200 flex items-center px-4 justify-between md:hidden shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-slate-900 flex items-center justify-center text-white">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <span className="text-[14px] font-semibold text-slate-900">{workspaceName}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={clearAuth} className="h-8 w-8">
            <LogOut className="h-4 w-4 text-slate-600" />
          </Button>
        </header>
        
        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-6 md:p-10 lg:p-12">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
