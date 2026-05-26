import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Shield, LayoutDashboard, Briefcase, FileText, LogOut, Users, Settings, UserPlus, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import * as Tooltip from '@radix-ui/react-tooltip';

export default function AppLayout() {
  const { accessToken, user, clearAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const isOwnerOrAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN';

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Jobs', path: '/jobs', icon: Briefcase },
    { name: 'Candidates', path: '/candidates', icon: Users },
    ...(isOwnerOrAdmin ? [{ name: 'Team', path: '/team', icon: UserPlus }] : []),
    ...(isOwnerOrAdmin ? [{ name: 'Audit Log', path: '/audit', icon: ShieldCheck }] : []),
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const companyName = user?.companyName || user?.email?.split('@')[1]?.split('.')[0]?.toUpperCase() || 'WORKSPACE';
  const userInitials = (user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase();

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="flex h-screen bg-white overflow-hidden text-slate-900 font-sans selection:bg-slate-200 selection:text-slate-900">
        {/* Sidebar - Fixed */}
        <aside 
          className={`flex-shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col hidden md:flex transition-all duration-200 ease-in-out ${
            isCollapsed ? 'w-[56px]' : 'w-[220px]'
          }`}
        >
          {/* Workspace Selector / Header */}
          <div className="h-14 flex items-center px-4 border-b border-slate-200 overflow-hidden shrink-0">
            <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center w-full ml-[-8px]' : ''}`}>
              <div className="h-6 w-6 rounded bg-slate-900 flex items-center justify-center text-white shrink-0">
                <Shield className="h-3.5 w-3.5" />
              </div>
              {!isCollapsed && (
                <span className="text-[13px] font-medium tracking-tight text-slate-900 leading-none truncate">
                  {companyName}
                </span>
              )}
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              
              const linkContent = (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center rounded-md transition-all ${
                    isCollapsed ? 'justify-center h-10 w-10 mx-auto' : 'px-3 py-2 text-[13px] font-medium'
                  } ${
                    isActive 
                      ? 'bg-slate-900 text-white' 
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 bg-transparent'
                  }`}
                >
                  <Icon className={`${isCollapsed ? 'h-4 w-4' : 'mr-2.5 h-4 w-4'} ${isActive ? 'text-white' : ''}`} />
                  {!isCollapsed && item.name}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip.Root key={item.path}>
                    <Tooltip.Trigger asChild>
                      {linkContent}
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content 
                        side="right" 
                        sideOffset={10} 
                        className="bg-slate-900 text-white text-[12px] px-2 py-1 rounded shadow-md z-50"
                      >
                        {item.name}
                        <Tooltip.Arrow className="fill-slate-900" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                );
              }
              
              return linkContent;
            })}
          </nav>

          {/* Collapse Toggle */}
          <div className="px-2 pb-2">
            <button 
              onClick={toggleSidebar}
              className={`flex items-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors ${
                isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'w-full px-3 py-2 text-[13px] font-medium'
              }`}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : (
                <>
                  <ChevronLeft className="mr-2.5 h-4 w-4" />
                  Collapse
                </>
              )}
            </button>
          </div>

          {/* User Profile / Footer */}
          <div className="border-t border-slate-200">
            {isCollapsed ? (
              <div className="py-3 flex justify-center">
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <div 
                      onClick={() => navigate('/settings/profile')}
                      className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-semibold cursor-pointer hover:ring-2 hover:ring-slate-300"
                    >
                      {userInitials}
                    </div>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content 
                      side="right" 
                      sideOffset={10} 
                      className="bg-slate-900 text-white text-[12px] px-3 py-2 rounded shadow-md z-50 flex flex-col"
                    >
                      <span className="font-semibold">{user?.fullName || 'User'}</span>
                      <span className="text-slate-300">{user?.email}</span>
                      <Tooltip.Arrow className="fill-slate-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-slate-100 group transition-colors">
                <div 
                  className="flex items-center min-w-0 flex-1"
                  onClick={() => navigate('/settings/profile')}
                >
                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-semibold shrink-0">
                    {userInitials}
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-900 truncate leading-none">{user?.fullName || 'User'}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-1">{user?.email}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); clearAuth(); }} className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content - Scrolls independently */}
        <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden bg-white transition-all duration-200 ease-in-out">
          {/* Mobile Header */}
          <header className="h-14 border-b border-slate-200 flex items-center px-4 justify-between md:hidden shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-slate-900 flex items-center justify-center text-white">
                <Shield className="h-3.5 w-3.5" />
              </div>
              <span className="text-[14px] font-semibold text-slate-900">{companyName}</span>
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
    </Tooltip.Provider>
  );
}
