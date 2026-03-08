'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAllPackages, getPackageConfigs } from '@/src/features/keyPackages/api';
import { getAllPackagePaymentTransactions } from '@/src/features/payments/api';
import RefreshButton from '@/src/components/ui/RefreshButton';
import FilterBar from '@/src/components/ui/FilterBar';
import Pagination from '@/src/components/ui/Pagination';

// Skeleton loader component for cards
const CardSkeleton = () => (
  <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
    <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded mb-3"></div>
    <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
  </div>
);

export default function PackageRevenuePage() {
  const [packages, setPackages] = useState([]);
  const [paymentTransactions, setPaymentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [packageTypes, setPackageTypes] = useState([]);
  const [stats, setStats] = useState(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    paymentStatus: 'completed',
    packageType: '',
    type: '', // NEW: Type filter for package vs cash
    priceOperator: '',
    priceValue: '',
    createdFrom: '',
    createdTo: '',
  });

  // Fetch stats separately - only on mount and refresh (not based on filters)
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      // Fetch all packages without any filters for stats
      const statsParams = new URLSearchParams({
        limit: '10000', // Large limit to get all for stats
      });
      
      const [packagesPayload, transactionsPayload] = await Promise.all([
        getAllPackages(statsParams.toString()),
        getAllPackagePaymentTransactions('limit=10000')
      ]);
      
      const allPackages = packagesPayload.pagination 
        ? (packagesPayload.data || [])
        : (Array.isArray(packagesPayload) ? packagesPayload : packagesPayload.data || []);

      const allTransactions = transactionsPayload.data || [];

      // Calculate stats from all packages and transactions
      const completedPackages = allPackages.filter(p => p.paymentStatus === 'completed');
      const completedTransactions = allTransactions.filter(t => t.status === 'completed');
      
      const packageRevenue = completedPackages.reduce((sum, p) => sum + (p.price || 0), 0);
      const transactionRevenue = completedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalRevenue = packageRevenue + transactionRevenue;

      // Calculate today's revenue (completed packages + transactions created today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayCompletedPackages = completedPackages.filter(p => {
        if (!p.createdAt) return false;
        const packageDate = new Date(p.createdAt);
        packageDate.setHours(0, 0, 0, 0);
        return packageDate.getTime() === today.getTime();
      });
      
      const todayCompletedTransactions = completedTransactions.filter(t => {
        if (!t.createdAt) return false;
        const transactionDate = new Date(t.createdAt);
        transactionDate.setHours(0, 0, 0, 0);
        return transactionDate.getTime() === today.getTime();
      });
      
      const todayPackageRevenue = todayCompletedPackages.reduce((sum, p) => sum + (p.price || 0), 0);
      const todayTransactionRevenue = todayCompletedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const todayRevenue = todayPackageRevenue + todayTransactionRevenue;

      setStats({
        totalRevenue,
        todayRevenue,
        completedPackages: completedPackages.length + completedTransactions.length
      });
    } catch (err) {
      console.error('fetchStats', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch package types from backend
  const fetchPackageTypes = useCallback(async () => {
    try {
      const configs = await getPackageConfigs();
      // Convert configs object to array of options
      // Backend stores packageType as keys value (string), so use keys for filtering
      const types = Object.values(configs || {})
        .sort((a, b) => (a.keys || 0) - (b.keys || 0))
        .map(config => ({
          value: config.keys?.toString() || '',
          label: config.packageName || `${config.keys} Keys`
        }))
        .filter(type => type.value); // Filter out empty values
      // Add "All" option at the beginning
      setPackageTypes([{ value: '', label: 'All' }, ...types]);
    } catch (err) {
      console.error('fetchPackageTypes', err);
      // Fallback to default options
      setPackageTypes([
        { value: '', label: 'All' },
        { value: 'basic', label: 'Basic' },
        { value: 'standard', label: 'Standard' },
        { value: 'premium', label: 'Premium' },
      ]);
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      
      // Convert price filter to backend format
      const backendFilters = { ...filters };
      if (backendFilters.priceOperator && backendFilters.priceValue) {
        if (backendFilters.priceOperator === '>=') {
          backendFilters.priceMin = backendFilters.priceValue;
        } else if (backendFilters.priceOperator === '<') {
          backendFilters.priceMax = backendFilters.priceValue;
        }
        delete backendFilters.priceOperator;
        delete backendFilters.priceValue;
      }
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(backendFilters).filter(([_, v]) => v !== '' && v !== null)
        ),
      });
      
      const [packagesPayload, transactionsPayload] = await Promise.all([
        getAllPackages(params.toString()),
        getAllPackagePaymentTransactions(params.toString())
      ]);
      
      if (packagesPayload.pagination) {
        setPagination(packagesPayload.pagination);
        setPackages(packagesPayload.data || []);
      } else {
        // Fallback for old API format
        const list = Array.isArray(packagesPayload) ? packagesPayload : packagesPayload.data || [];
        setPackages(list);
      }
      
      setPaymentTransactions(transactionsPayload.data || []);
      
      console.log('Fetched packages:', packagesPayload.data?.length || 0);
      console.log('Fetched payment transactions:', transactionsPayload.data?.length || 0);
      console.log('Sample payment transaction:', transactionsPayload.data?.[0]);
      
    } catch (err) {
      console.error('fetchPackages', err);
      setPackages([]);
      setPaymentTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Combined refresh function
  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchStats(), fetchPackages()]);
  }, [fetchStats, fetchPackages]);

  // Fetch package types and stats on mount
  useEffect(() => {
    fetchPackageTypes();
    fetchStats();
  }, [fetchPackageTypes, fetchStats]);

  // Fetch packages when filters/pagination changes
  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const filterOptions = [
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      type: 'select',
      options: [
        { value: '', label: 'All' },
        { value: 'completed', label: 'Completed' },
        { value: 'pending', label: 'Pending' },
        { value: 'failed', label: 'Failed' },
      ],
    },
    {
      key: 'packageType',
      label: 'Package Type',
      type: 'select',
      options: packageTypes.length > 0 ? packageTypes : [
        { value: '', label: 'All' },
        { value: 'basic', label: 'Basic' },
        { value: 'standard', label: 'Standard' },
        { value: 'premium', label: 'Premium' },
      ],
    },
    {
      key: 'price',
      label: 'Price',
      type: 'numberRange',
      placeholder: 'Enter price',
    },
    {
      key: 'createdFrom',
      label: 'Created From',
      type: 'date',
    },
    {
      key: 'createdTo',
      label: 'Created To',
      type: 'date',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Package Revenue</h1>
        <RefreshButton onRefresh={handleRefresh} disabled={loading || statsLoading} />
      </div>

      {/* Stats Cards - On Top */}
      <div className="grid gap-5 md:grid-cols-3">
        {statsLoading || !stats ? (
          // Show skeleton loaders
          Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={`skeleton-${index}`} />
          ))
        ) : (
          // Show actual cards
          <>
            <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">Total Revenue</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">
                ₹{stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">Today&apos;s Revenue</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">
                ₹{stats.todayRevenue.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">Completed Packages</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">
                {stats.completedPackages}
              </p>
            </div>
          </>
        )}
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Search by name, mobile, or email..."
        filterOptions={filterOptions}
      />

      {/* Combined Revenue Table */}
      {loading ? (
        <div className="text-center py-8">Loading revenue data...</div>
      ) : packages.length === 0 && paymentTransactions.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">No revenue data found.</div>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-zinc-900 text-white">
              <tr>
                <th className="p-4 text-left font-semibold">Name</th>
                <th className="p-4 text-left font-semibold">Contact</th>
                <th className="p-4 text-left font-semibold">Package</th>
                <th className="p-4 text-left font-semibold">Keys</th>
                <th className="p-4 text-left font-semibold">Price</th>
                <th className="p-4 text-left font-semibold">Payment Method</th>
                <th className="p-4 text-left font-semibold">Status</th>
                <th className="p-4 text-left font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900">
              {/* Combine and sort data by date descending */}
              {[
                // Map packages to unified format
                ...packages.map(pkg => ({
                  _id: pkg._id,
                  type: 'package',
                  name: pkg.admin?.name || 'N/A',
                  contact: {
                    email: pkg.admin?.email || 'N/A',
                    mobile: pkg.admin?.mobile || null
                  },
                  packageName: pkg.packageName || pkg.packageType || 'N/A',
                  keys: pkg.keys || 0,
                  price: pkg.price || 0,
                  paymentMethod: pkg.paymentMethod || 'N/A',
                  status: pkg.paymentStatus || 'pending',
                  date: pkg.createdAt ? new Date(pkg.createdAt) : new Date(0)
                })),
                // Map payment transactions to unified format
                ...paymentTransactions.map(transaction => ({
                  _id: transaction._id,
                  type: transaction.paymentMethod === 'cash' ? 'cash' : 'package',
                  name: transaction.admin?.name || 'N/A',
                  contact: {
                    email: transaction.admin?.email || 'N/A',
                    mobile: transaction.admin?.mobile || null
                  },
                  packageName: transaction.keyPrice?.packageName || transaction.keyPackage?.packageName || 'N/A',
                  keys: transaction.keyPrice?.keys || transaction.keyPackage?.keys || 0,
                  price: transaction.amount || 0,
                  paymentMethod: transaction.paymentMethod || 'N/A',
                  status: transaction.status || 'pending',
                  date: transaction.createdAt ? new Date(transaction.createdAt) : new Date(0)
                }))
              ]
                .filter(item => {
                  // Apply payment status filter
                  if (filters.paymentStatus && item.status !== filters.paymentStatus) {
                    return false;
                  }
                  // Apply search filter
                  if (filters.search) {
                    const searchLower = filters.search.toLowerCase();
                    const nameMatch = item.name?.toLowerCase().includes(searchLower);
                    const emailMatch = item.contact.email?.toLowerCase().includes(searchLower);
                    const mobileMatch = item.contact.mobile?.includes(searchLower);
                    const packageMatch = item.packageName?.toLowerCase().includes(searchLower);
                    if (!nameMatch && !emailMatch && !mobileMatch && !packageMatch) {
                      return false;
                    }
                  }
                  // Apply date filters
                  if (filters.createdFrom) {
                    const fromDate = new Date(filters.createdFrom);
                    if (item.date < fromDate) return false;
                  }
                  if (filters.createdTo) {
                    const toDate = new Date(filters.createdTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (item.date > toDate) return false;
                  }
                  // Apply price filters
                  if (filters.priceMin && item.price < parseFloat(filters.priceMin)) {
                    return false;
                  }
                  if (filters.priceMax && item.price > parseFloat(filters.priceMax)) {
                    return false;
                  }
                  return true;
                })
                .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort by date descending
                .map((item) => (
                  <tr key={`${item.type}-${item._id}`} className="border-b hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="p-4 font-medium text-zinc-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="p-4 text-zinc-700 dark:text-zinc-300">
                      <div className="flex flex-col gap-1">
                        {item.contact.mobile && (
                          <span>{item.contact.mobile}</span>
                        )}
                        {item.contact.email && (
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">{item.contact.email}</span>
                        )}
                        {!item.contact.mobile && !item.contact.email && (
                          <span className="text-zinc-400">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-zinc-700 dark:text-zinc-300">
                      {item.packageName}
                    </td>
                    <td className="p-4 text-zinc-700 dark:text-zinc-300">
                      {item.keys}
                    </td>
                    <td className="p-4 text-zinc-700 dark:text-zinc-300 font-medium">
                      ₹{item.price.toLocaleString()}
                    </td>
                    <td className="p-4 text-zinc-700 dark:text-zinc-300 capitalize">
                      {item.paymentMethod}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === 'completed' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : item.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {item.date.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && packages.length > 0 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
          limit={pagination.limit}
          total={pagination.total}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}
    </div>
  );
}

