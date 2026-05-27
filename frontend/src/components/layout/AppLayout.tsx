import React, { useState } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Button } from '../ui/button';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import { initialsFrom } from '../../lib/display';

export default function AppLayout() {
  const { accessToken, user, clearAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => localStorage.getItem('sidebar-collapsed') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const isOwnerOrAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN';
  const companyName = user?.companyName || user?.email?.split('@')[1]?.split('.')[0]?.toUpperCase() || 'Workspace';
  const userInitials = initialsFrom(user?.fullName || user?.email, 'U');

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Jobs', path: '/jobs', icon: Briefcase },
    { name: 'Candidates', path: '/candidates', icon: Users },
    ...(isOwnerOrAdmin ? [{ name: 'Team', path: '/team', icon: UserPlus }] : []),
    ...(isOwnerOrAdmin ? [{ name: 'Audit Log', path: '/audit', icon: ShieldCheck }] : []),
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 px-3">
        <Link
          to="/dashboard"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-slate-950 transition-colors hover:bg-slate-100',
            isCollapsed && 'justify-center px-0'
          )}
          aria-label="Go to dashboard"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
            <Shield className="h-4 w-4" />
          </span>
          {!isCollapsed && (
            <span className="truncate text-sm font-semibold tracking-tight">{companyName}</span>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          const link = (
            <Link
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'group relative flex h-10 items-center gap-3 rounded-lg text-sm font-medium text-slate-600 outline-none transition-all hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-500/30',
                isCollapsed ? 'justify-center px-0' : 'px-3',
                isActive && 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200'
              )}
            >
              {isActive && !isCollapsed && <span className="absolute left-0 h-5 w-0.5 rounded-full bg-blue-600" />}
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-blue-700' : 'text-slate-500')} />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );

          if (!isCollapsed) return <React.Fragment key={item.path}>{link}</React.Fragment>;

          return (
            <Tooltip.Root key={item.path}>
              <Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="right" sideOffset={10} className="z-50 rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg">
                  {item.name}
                  <Tooltip.Arrow className="fill-slate-950" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-slate-200 p-2">
        <Button
          type="button"
          variant="ghost"
          onClick={toggleSidebar}
          className={cn(
            'hidden text-slate-500 hover:bg-slate-100 hover:text-slate-950 md:flex',
            isCollapsed ? 'h-9 w-9 justify-center px-0' : 'h-9 w-full justify-start px-3'
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /> Collapse</>}
        </Button>

        <div
          className={cn(
            'flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-100',
            isCollapsed && 'justify-center'
          )}
        >
          <button
            type="button"
            onClick={() => navigate('/settings/profile')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700 outline-none transition hover:ring-2 hover:ring-blue-500/20 focus-visible:ring-2 focus-visible:ring-blue-500/40"
            aria-label="Open profile settings"
          >
            {userInitials}
          </button>
          {!isCollapsed && (
            <>
              <button type="button" onClick={() => navigate('/settings/profile')} className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-slate-950">{user?.fullName || 'User'}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearAuth}
                className="h-8 w-8 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Tooltip.Provider delayDuration={180}>
      <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-950 antialiased">
        <aside
          className={cn(
            'hidden shrink-0 border-r border-slate-200 bg-slate-50/95 transition-[width] duration-300 ease-out motion-reduce:transition-none md:block',
            isCollapsed ? 'w-[64px]' : 'w-[248px]'
          )}
        >
          {sidebar}
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/30"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 w-[292px] border-r border-slate-200 bg-white shadow-2xl">
              <div className="absolute right-3 top-3">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {sidebar}
            </aside>
          </div>
        )}

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white/85 px-4 backdrop-blur md:hidden">
            <button type="button" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-900" />
              <span className="text-sm font-semibold">{companyName}</span>
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={clearAuth} aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </Tooltip.Provider>
  );
}
