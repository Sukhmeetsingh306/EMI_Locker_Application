'use client';

import { useMemo } from 'react';
import Card from '@/src/components/ui/Card';
import { useAppSelector, useAppDispatch } from '@/src/hooks/useAppStore';
import { selectUser, selectAuthStatus } from '@/src/features/auth/selectors';
import { Users, ShieldCheck, KeyRound, AlertTriangle, Package, Lock, CircleAlert, IndianRupee } from 'lucide-react';
import { useEffect, useState } from 'react';
import { hydrateAuth } from '@/src/features/auth/authSlice';
import { getDashboardSummary, getAdminDashboardStats } from '@/src/features/admins/api';
import RefreshButton from '@/src/components/ui/RefreshButton';

// Skeleton loader component for cards
const CardSkeleton = () => (
  <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded mb-3"></div>
        <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-700 rounded mb-2"></div>
        <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
      </div>
      <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
    </div>
  </div>
);

const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const status = useAppSelector(selectAuthStatus);

  const [role, setRole] = useState(null);
  const [summary, setSummary] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingAdminStats, setLoadingAdminStats] = useState(true);

  // Fetch lightweight dashboard summary (counts only) - for superadmin
  const fetchDashboardSummary = async () => {
    try {
      setLoadingSummary(true);
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error('fetchDashboardSummary', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fetch admin-specific dashboard stats - for admin
  const fetchAdminDashboardStats = async () => {
    try {
      setLoadingAdminStats(true);
      const data = await getAdminDashboardStats();
      setAdminStats(data);
    } catch (err) {
      console.error('fetchAdminDashboardStats', err);
    } finally {
      setLoadingAdminStats(false);
    }
  };

  useEffect(() => {
    if (role === 'superadmin') {
      fetchDashboardSummary();
    } else if (role === 'admin') {
      fetchAdminDashboardStats();
    }
  }, [role]);

  // Load role from localStorage
  useEffect(() => {
    dispatch(hydrateAuth());

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('emilocker_admin_auth');
      const parsed = saved ? JSON.parse(saved) : null;
      setRole(parsed?.role || null);
    }
  }, [dispatch]);

  // -----------------------------
  // SUPERADMIN CARDS (Memoized for performance)
  // -----------------------------
  const superadminCards = useMemo(() => {
    if (loadingSummary || !summary) {
      return null; // Return null to show skeletons
    }
    return [
      {
        title: "Active Admins",
        value: summary.activeAdmins ?? "0",
        helper: "Currently active administrators",
        icon: <Users className="h-5 w-5" />,
        href: "/admins"
      },
      {
        title: "Package Revenue",
        value: `₹${summary.totalPackageRevenue ?? 0}`,
        helper: `${summary.completedPackages ?? 0} packages sold`,
        icon: <Package className="h-5 w-5" />,
        href: "/package-revenue"
      },
    ];
  }, [summary, loadingSummary]);

  // -----------------------------
  // ADMIN CARDS (Memoized for performance)
  // -----------------------------
  const adminCards = useMemo(() => {
    if (loadingAdminStats || !adminStats) {
      return null; // Return null to show skeletons
    }

    return [
      {
        title: "Keys Available",
        value: `${adminStats.keysLeft ?? 0}/${adminStats.totalKeys ?? 0}`,
        helper: `${adminStats.usedKeys ?? 0} keys Used`,
        icon: <KeyRound className="h-5 w-5" />,
        href: "/packages"
      },
      {
        title: "Total Payment Today",
        value: `₹${(adminStats.totalPaymentToday ?? 0).toLocaleString()}`,
        helper: `${adminStats.todayPayments ?? 0} payments received today`,
        icon: <IndianRupee className="h-5 w-5" />,
        href: "/payments-today"
      },
      {
        title: "Total Overdue Payments",
        value: adminStats.totalPendingPaymentsTillToday ?? "0",
        helper: `₹${(adminStats.totalPendingAmountTillToday ?? 0).toLocaleString()} pending amount`,
        icon: <AlertTriangle className="h-5 w-5" />,
        href: "/overdue-payments"
      },
      {
        title: "Active EMI Users",
        value: adminStats.activeEmiUsersCount ?? "0",
        helper: `${adminStats.totalUsers ?? 0} total users`,
        icon: <Users className="h-5 w-5" />,
        href: "/emis"
      },
      {
        title: "Devices Locked",
        value: adminStats.deviceLockedCount ?? "0",
        helper: "Devices currently locked",
        icon: <CircleAlert className="h-5 w-5" />,
        href: "/device-lock"
      },
      {
        title: "Devices to Lock",
        value: adminStats.devicesToLockCount ?? "0",
        helper: "Users with overdue EMIs",
        icon: <Lock className="h-5 w-5" />,
        href: "/device-lock"
      },
    ];
  }, [adminStats, loadingAdminStats]);

  // Choose cards
  const statCards = role === "superadmin" ? superadminCards : adminCards;
  const isLoading = role === "superadmin" ? loadingSummary : loadingAdminStats;
  const cardCount = role === "superadmin" ? 2 : 6;

  // -----------------------------
  // SYSTEM FEED (dynamic)
  // -----------------------------


  const handleRefresh = async () => {
    if (role === 'superadmin') {
      await fetchDashboardSummary();
    } else if (role === 'admin') {
      await fetchAdminDashboardStats();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <RefreshButton 
          onRefresh={handleRefresh} 
          disabled={loadingSummary || loadingAdminStats} 
        />
      </div>

      {/* HERO */}
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-8 dark:border-emerald-900/40">
        <p className="text-sm uppercase tracking-[0.4em] text-emerald-500">
          Welcome back
        </p>

        <h1 className="mt-2 text-3xl font-semibold text-zinc-600">
          {user ? `${user.name || user.fullName},` : "Admin,"} 
          {role === "superadmin" ? " you are in control." : " your EMIs are under watch."}
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          {role === "superadmin"
            ? "Manage admins and monitor platform activity."
            : "Monitor EMI schedules, overdue payments, and device lock states."}
        </p>
      </div>

      {/* STAT CARDS with lazy loading */}
      <div className="grid gap-5 md:grid-cols-3">
        {isLoading || !statCards ? (
          // Show skeleton loaders
          Array.from({ length: cardCount }).map((_, index) => (
            <CardSkeleton key={`skeleton-${index}`} />
          ))
        ) : (
          // Show actual cards
          statCards.map((card) => (
            <Card key={card.title} {...card} />
          ))
        )}
      </div>

    </div>
  );
};

export default DashboardPage;
