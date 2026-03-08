'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getMyPackages, getPackageConfigs, createPackageOrder, verifyPackagePayment } from '@/src/features/keyPackages/api';
import { getAdminDashboardStats, getCashDeposits } from '@/src/features/admins/api';
import { Package, Plus, CreditCard, Loader2, CheckCircle, KeyRound } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';
import Pagination from '@/src/components/ui/Pagination';
import FilterBar from '@/src/components/ui/FilterBar';
import RefreshButton from '@/src/components/ui/RefreshButton';

// Skeleton loader component for cards
const CardSkeleton = () => (
  <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
      <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
    </div>
    <div className="h-9 w-16 bg-zinc-200 dark:bg-zinc-700 rounded mb-2"></div>
    <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
  </div>
);

// Memoized Stats Cards component to prevent re-renders on filter changes
const StatsCards = React.memo(({ stats, statsLoading }) => {
  if (statsLoading || !stats) {
    return (
      <div className="grid gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <CardSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-3">
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3 mb-4">
          <KeyRound className="h-6 w-6 text-emerald-500" />
          <p className="text-sm text-zinc-500">Total Keys</p>
        </div>
        <p className="text-3xl font-semibold text-zinc-900 dark:text-white">
          {stats?.totalKeys ?? 0}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Keys purchased and received
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3 mb-4">
          <KeyRound className="h-6 w-6 text-blue-500" />
          <p className="text-sm text-zinc-500">Used Keys</p>
        </div>
        <p className="text-3xl font-semibold text-zinc-900 dark:text-white">
          {stats?.usedKeys ?? 0}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Keys used for user creation
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-sm dark:border-emerald-900/40">
        <div className="flex items-center gap-3 mb-4">
          <KeyRound className="h-6 w-6 text-emerald-600" />
          <p className="text-sm text-zinc-500">Available Keys</p>
        </div>
        <p className="text-3xl font-semibold text-emerald-600">
          {stats?.keysLeft ?? 0}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Keys remaining for use
        </p>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if stats data or loading state actually changed
  return (
    prevProps.statsLoading === nextProps.statsLoading &&
    prevProps.stats?.totalKeys === nextProps.stats?.totalKeys &&
    prevProps.stats?.usedKeys === nextProps.stats?.usedKeys &&
    prevProps.stats?.keysLeft === nextProps.stats?.keysLeft
  );
});

StatsCards.displayName = 'StatsCards';

export default function PackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [packageConfigs, setPackageConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsFetched, setStatsFetched] = useState(false);
  
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
    paymentStatus: 'completed',
    createdFrom: '',
    createdTo: '',
  });

  const [cashDeposits, setCashDeposits] = useState([]);
  const [cashDepositsLoading, setCashDepositsLoading] = useState(false);
  const [cashDepositsPagination, setCashDepositsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
        ),
      });
      
      const data = await getMyPackages(params.toString());
      
      if (data.pagination) {
        setPagination(data.pagination);
        setPackages(data.data || []);
      } else {
        const packagesList = Array.isArray(data) ? data : data.data || [];
        setPackages(packagesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
    } catch (err) {
      console.error('fetchPackages', err);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  const fetchCashDeposits = useCallback(async () => {
    try {
      setCashDepositsLoading(true);
      const params = new URLSearchParams({
        page: cashDepositsPagination.page.toString(),
        limit: cashDepositsPagination.limit.toString(),
        status: filters.paymentStatus,
        dateFrom: filters.createdFrom,
        dateTo: filters.createdTo
      });
      
      const result = await getCashDeposits(params.toString());
      
      if (result.success) {
        setCashDeposits(result.data || []);
        setCashDepositsPagination(result.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        });
      } else {
        console.error('fetchCashDeposits error:', result.message);
        setCashDeposits([]);
      }
    } catch (err) {
      console.error('fetchCashDeposits error:', err);
      setCashDeposits([]);
    } finally {
      setCashDepositsLoading(false);
    }
  }, [cashDepositsPagination.page, cashDepositsPagination.limit, filters.paymentStatus, filters.createdFrom, filters.createdTo]);

  // Merge packages and cash deposits for display
  const allTransactions = useMemo(() => {
    const transactions = [];
    
    // Add razorpay packages
    packages.forEach(pkg => {
      transactions.push({
        ...pkg,
        paymentMethod: pkg.paymentMethod || 'razorpay',
        transactionType: 'package_purchase',
        status: pkg.status || 'completed'
      });
    });
    
    // Add cash deposits
    cashDeposits.forEach(deposit => {
      transactions.push({
        _id: deposit._id,
        keyPrice: {
          packageName: deposit.keyPrice?.packageName || 'Unknown',
          keys: deposit.keyPrice?.keys || 0,
          price: deposit.amount,
          duration: deposit.keyPrice?.duration || 0
        },
        status: deposit.status,
        paymentMethod: 'cash',
        transactionType: 'cash_deposit',
        createdAt: deposit.requestedAt,
        updatedAt: deposit.processedAt || deposit.requestedAt,
        agent: deposit.agent,
        keyPackage: deposit.keyPackage
      });
    });
    
    // Sort by creation date (newest first)
    return transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [packages, cashDeposits]);

  const fetchPackageConfigs = async () => {
    try {
      const data = await getPackageConfigs();
      setPackageConfigs(data || {});
    } catch (err) {
      console.error('fetchPackageConfigs', err);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const data = await getAdminDashboardStats();
      setStats(data);
      setStatsFetched(true);
    } catch (err) {
      console.error('fetchStats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchPackageConfigs();
    fetchCashDeposits();
  }, [fetchPackages, fetchCashDeposits]);

  // Lazy load stats on initial mount
  useEffect(() => {
    const loadStats = async () => {
      // Small delay for lazy loading effect
      await new Promise(resolve => setTimeout(resolve, 300));
      await fetchStats();
    };
    
    if (!statsFetched) {
      loadStats();
    }
  }, []); // Only run once on mount

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

  // Wait for Razorpay SDK to load
  const waitForRazorpay = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      const interval = setInterval(() => {
        attempts++;
        if (window.Razorpay) {
          clearInterval(interval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new Error('Razorpay SDK failed to load'));
        }
      }, 100);
    });
  };

  const handlePurchase = async (packageType) => {
    try {
      setProcessing(true);
      setSelectedPackage(packageType);

      // Create Razorpay order
      const result = await createPackageOrder(packageType);
      setOrderData(result);

      // Wait for Razorpay SDK to be available
      await waitForRazorpay();

      // Initialize Razorpay
      if (window.Razorpay) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
          amount: result.order.amount,
          currency: result.order.currency,
          name: 'EMI Locker',
          description: `Package Purchase - ${packageType} keys`,
          order_id: result.order.id,
          handler: async function (response) {
            try {
              // Verify payment
              await verifyPackagePayment(result.packageId, {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              });

              setSuccess(true);
              setTimeout(() => {
                fetchPackages();
                fetchCashDeposits();
                fetchStats();
                setSuccess(false);
              }, 2000);
            } catch (err) {
              console.error('Payment verification failed:', err);
              alert('Payment verification failed. Please contact support.');
            }
          },
          prefill: {
            name: '',
            email: '',
            contact: ''
          },
          theme: {
            color: '#10b981'
          },
          modal: {
            ondismiss: function() {
              setProcessing(false);
              setOrderData(null);
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        setProcessing(false);
        setSelectedPackage(null);
        alert('Razorpay SDK not loaded. Please refresh the page and try again.');
      }
    } catch (err) {
      console.error('Purchase error:', err);
      alert(err?.response?.data?.message || 'Failed to initiate purchase');
      setProcessing(false);
      setSelectedPackage(null);
    }
  };

  const availablePackages = Object.values(packageConfigs);
  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => console.log('Razorpay SDK loaded')}
        onError={() => {
          console.error('Failed to load Razorpay SDK');
        }}
      />
      
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Packages</h1>
        {!loading && (
          <div className="flex items-center gap-3">
            <RefreshButton onRefresh={() => { fetchPackages(); fetchCashDeposits(); fetchStats(); }} disabled={loading} />
            <Link
              href="/packages/purchase"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Buy Package
            </Link>
          </div>
        )}
      </div>

      {/* Keys Stats - Lazy loaded on mount, memoized to prevent re-renders on filter changes */}
      <StatsCards stats={stats} statsLoading={statsLoading} />

      {!loading && (
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          showSearch={false}
          filterOptions={[
            {
              key: 'paymentStatus',
              label: 'Payment Status',
              type: 'select',
              options: [
                { value: '', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' },
                { value: 'failed', label: 'Failed' },
              ],
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
          ]}
        />
      )}

      {/* All Packages Table */}
      {loading ? (
        <div className="text-center py-8">Loading packages...</div>
      ) : packages.length === 0 ? (
        <>
          {success ? (
            <div className="max-w-2xl mx-auto">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-900/20">
                <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
                  Payment Successful!
                </h2>
                <p className="text-emerald-700 dark:text-emerald-300">
                  Your package has been purchased successfully. Refreshing...
                </p>
              </div>
            </div>
          ) : (() => {
            // Check if any filters are active
            const hasActiveFilters = filters.paymentStatus !== '' || filters.createdFrom !== '' || filters.createdTo !== '';
            
            // If filters are active, show "No results found"
            if (hasActiveFilters) {
              return (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    No results found
                  </h2>
                </div>
              );
            }
            
            // Otherwise show no packages message
            return (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  No packages yet
                </h2>
              </div>
            );
          })()}
        </>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-zinc-900 text-white">
              <tr>
                <th className="p-3 text-left">Package</th>
                <th className="p-3 text-left">Keys</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Payment Method</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {allTransactions.map((transaction) => (
                <tr key={transaction._id} className="border-b hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <td className="p-3">{transaction.keyPrice?.packageName || transaction.packageType || 'N/A'}</td>
                  <td className="p-3">{transaction.keyPrice?.keys || 0}</td>
                  <td className="p-3">₹{transaction.keyPrice?.price || 0}</td>
                  <td className="p-3">{transaction.paymentMethod}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      transaction.status === 'completed' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200'
                        : transaction.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {transaction.status || 'N/A'}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-zinc-500">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && allTransactions.length > 0 && (
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
    </>
  );
}

