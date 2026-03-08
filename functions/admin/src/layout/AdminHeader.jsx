// src/layout/AdminHeader.jsx
'use client';

import { Bell, Clock, LogOut, Menu, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logout } from '@/src/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/src/hooks/useAppStore';
import { selectUser } from '@/src/features/auth/selectors';
import { useState, useMemo } from 'react';

const AdminHeader = ({ onToggleSidebar }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector(selectUser);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/20 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-black/50">
      <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <div className="flex min-w-[220px] flex-1 items-center gap-3">
          <button type="button" className="rounded-2xl border border-white/60 bg-white/60 p-2 text-emerald-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-white lg:hidden dark:border-white/10 dark:bg-white/10 dark:text-white" onClick={onToggleSidebar} aria-label="Toggle sidebar">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-500">Emilocker</p>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">{greeting}, {user?.name?.split(' ')[0] || user?.fullName?.split(' ')[0] || 'Admin'}</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Control room</p>
          </div>
        </div>

        {/* <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/40 bg-white/40 px-3 py-2 backdrop-blur sm:max-w-md dark:border-white/10 dark:bg-white/10">
          <Search className="h-4 w-4 text-zinc-400 dark:text-zinc-300" />
          <input type="search" placeholder="Search vaults, admins, policies..." className="flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-500 dark:text-white" />
        </div> */}

        <div className="flex items-center gap-3">
          {/* <div className="hidden md:block">
            <div className="flex items-center gap-2 rounded-full border border-white/50 bg-white/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-zinc-600 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-zinc-200">
              <Clock className="h-4 w-4" />
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div> */}
          {/* <button className="rounded-full border border-white/40 bg-white/40 p-2 text-zinc-600 transition hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/10 dark:text-white" type="button" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </button> */}
          <button type="button" onClick={handleLogout} className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
