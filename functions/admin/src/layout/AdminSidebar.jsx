'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import {
  AlertTriangle,
  BarChart3,
  FolderLock,
  KeyRound,
  LayoutDashboard,
  Settings2,
  Users,
  X,
  IndianRupee,
  Package,
  ShieldCheck,
  Lock,
  CreditCard,
  User,
  CheckCircle2,
  Clock,
  UserPlus,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const navSections = [
  {
    title: 'Monitoring',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  // Superadmin sections
  {
    title: 'Admin Management',
    items: [
      { href: '/admins', label: 'Admins', icon: Users, visibleTo: ['superadmin'] },
    ],
  },
  {
    title: 'Agent Management',
    items: [
      { href: '/agents', label: 'Agents', icon: UserPlus, visibleTo: ['superadmin'] },
    ],
  },
  {
    title: 'Package Management',
    items: [
      { href: '/cash-deposits', label: 'Cash Requests', icon: CreditCard, visibleTo: ['superadmin'] },
      { href: '/package-revenue', label: 'Package Revenue', icon: Package, visibleTo: ['superadmin'] },
      { href: '/key-prices', label: 'Key Prices', icon: IndianRupee, visibleTo: ['superadmin'] },
    ],
  },
  // Admin sections
  {
    title: 'User Management',
    items: [
      { href: '/users', label: 'Users', icon: Users, visibleTo: ['admin'] },
      { href: "/emis", label: "EMIs", icon: FolderLock, visibleTo: ["admin"] },
    ],
  },
  {
    title: 'Payments',
    items: [
      { href: "/payment-verifications", label: "Payment Verifications", icon: CheckCircle2, visibleTo: ["admin"] },
      { href: "/overdue-payments", label: "Overdue Payments", icon: Clock, visibleTo: ["admin"] },
      { href: "/payments-today", label: "Payments Today", icon: ShieldCheck, visibleTo: ["admin"] },
    ],
  },
  {
    title: 'Device Control',
    items: [
      { href: "/device-lock", label: "Device Unlock", icon: Lock, visibleTo: ["admin"] },
    ],
  },
  {
    title: 'Packages',
    items: [
      { href: "/packages", label: "My Packages", icon: Package, visibleTo: ["admin"] },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/profile', label: 'My Profile', icon: User },
      { href: "/payment-config", label: "Payment Configuration", icon: CreditCard, visibleTo: ["admin"] },
    ],
  },
];


const AdminSidebarContent = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('emilocker_admin_auth');
        const parsed = stored ? JSON.parse(stored) : null;
        setRole(parsed?.role || null);
      } catch {
        setRole(null);
      }
    }
  }, []);

  return (
    <aside
      className={clsx(
        'admin-scrollbar fixed inset-y-0 left-0 z-40 w-72 border-r border-white/30 bg-white/85 px-6 py-6 backdrop-blur-2xl transition-transform duration-300 ease-in-out dark:border-white/10 dark:bg-black/60',
        'lg:static lg:h-screen lg:translate-x-0 lg:flex-shrink-0 lg:overflow-y-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="mb-10 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-zinc-500">Emilocker</p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-white">Control Room</p>
        </div>
        <button
          type="button"
          className="rounded-2xl border border-white/40 p-2 text-zinc-500 transition hover:text-zinc-900 focus:outline-none lg:hidden dark:border-zinc-800 dark:text-zinc-300 dark:hover:text-white"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-xs text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/30 dark:text-emerald-200">
        <p className="font-semibold uppercase tracking-[0.35em] text-emerald-500">Environment</p>
        <p className="mt-1">Production • Last deploy 2h ago</p>
      </div> */}

      <nav className="mt-8 space-y-6">
        {navSections
          .map((section) => {
            // Filter items based on role visibility
            const visibleItems = section.items.filter(
              (item) => !item.visibleTo || item.visibleTo.includes(role)
            );
            
            // Only return section if it has visible items
            return visibleItems.length > 0 ? { ...section, items: visibleItems } : null;
          })
          .filter((section) => section !== null)
          .map((section) => (
            <div key={section.title} className="space-y-2">
              <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">{section.title}</p>

              {section.items.map((item) => {
                const Icon = item.icon;
                // Default active state: exact match or starts with the href
                let isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                
                // Special cases for superadmin: highlight "Admins" when viewing related pages
                if (item.href === '/admins' && role === 'superadmin') {
                  const createdBy = searchParams?.get('createdBy');
                  
                  // Case 1: Users list page with createdBy filter
                  if (pathname === '/users' && createdBy) {
                    isActive = true;
                  }
                  
                  // Case 2: User detail page with createdBy query param
                  if (pathname.startsWith('/users/') && createdBy) {
                    isActive = true;
                  }
                  
                  // Case 3: EMI detail page (for superadmin)
                  if (pathname.startsWith('/emis/')) {
                    isActive = true;
                  }
                }

                return (
                  <Link
                    key={item.href}
                    href={item.disabled ? '#' : item.href}
                    className={clsx(
                      'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                      isActive
                        ? 'bg-zinc-900 text-white shadow-lg dark:bg-white dark:text-zinc-900'
                        : 'text-zinc-500 hover:bg-white hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-white',
                      item.disabled && 'pointer-events-none opacity-40'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
      </nav>

    </aside>
  );
};

const AdminSidebar = ({ isOpen, onClose }) => {
  return <AdminSidebarContent isOpen={isOpen} onClose={onClose} />;
};

export default AdminSidebar;
