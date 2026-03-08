// src/layout/AdminShell.jsx
'use client';

import { useState, Suspense } from 'react';
import AdminSidebar from '@/src/layout/AdminSidebar';
import AdminHeader from '@/src/layout/AdminHeader';

const AdminShell = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-zinc-50 via-white to-emerald-50 text-zinc-900 dark:from-black dark:via-zinc-950 dark:to-emerald-950 dark:text-white lg:h-screen">
      <Suspense fallback={null}>
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </Suspense>

      {sidebarOpen && (
        <button type="button" className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden" aria-label="Close sidebar overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex min-h-screen w-full flex-1 flex-col lg:h-full lg:overflow-hidden">
        <AdminHeader onToggleSidebar={() => setSidebarOpen((p) => !p)} />
        <main className="flex-1 overflow-y-auto px-4 pb-10 pt-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
};

export default AdminShell;
