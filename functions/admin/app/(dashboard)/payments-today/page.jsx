'use client';

import { useEffect, useState } from 'react';
import { getPaymentsToday } from '@/src/features/admins/api';
import { CheckCircle2 } from 'lucide-react';
import RefreshButton from '@/src/components/ui/RefreshButton';
import FilterBar from '@/src/components/ui/FilterBar';

export default function PaymentsTodayPage() {
  const [todayPayments, setTodayPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(false);
  const [todayStats, setTodayStats] = useState(null);
  const [filters, setFilters] = useState({ search: '', fromDate: '', toDate: '' });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);

      const data = await getPaymentsToday(queryParams.toString());
      
      setTodayPayments(data.todayPayments || []);
      setTodayStats(data.todayStats || { count: 0, totalAmount: 0 });
      setInitialLoad(true);
    } catch (err) {
      console.error('fetchPayments', err);
      setTodayPayments([]);
      setInitialLoad(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Payments Today</h1>
        <RefreshButton onRefresh={fetchPayments} disabled={loading} />
      </div>

      {/* Stats Cards */}
      {initialLoad && todayStats !== null && (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <p className="text-sm text-zinc-500">Today's Payments</p>
            </div>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-white">
              {loading ? '...' : (todayStats?.count || 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <p className="text-sm text-zinc-500">Today's Amount</p>
            </div>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-white">
              {loading ? '...' : `₹${(todayStats?.totalAmount || 0).toLocaleString()}`}
            </p>
          </div>
        </div>
      )}

      {/* Search Filter */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Search by user name, mobile, or bill number..."
        showSearch={true}
        filterOptions={[
          {
            key: 'fromDate',
            label: 'From Date',
            type: 'date',
            placeholder: 'Select from date'
          },
          {
            key: 'toDate',
            label: 'To Date',
            type: 'date',
            placeholder: 'Select to date'
          }
        ]}
      />

      {/* Content */}
      {loading ? (
        <div className="text-center py-8 text-zinc-500">Loading payments...</div>
      ) : todayPayments.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">No payments received today.</div>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-zinc-900 text-white">
              <tr>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Bill Number</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Paid Date</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {todayPayments.map((payment) => (
                <tr key={payment._id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <td className="p-3">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">
                        {payment.userId?.fullName || 'N/A'}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {payment.userId?.mobile || ''}
                      </p>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-zinc-900 dark:text-white">
                    {payment.emiId?.billNumber || 'N/A'}
                  </td>
                  <td className="p-3 font-medium text-zinc-900 dark:text-white">
                    ₹{(payment.amount || 0).toLocaleString()}
                  </td>
                  <td className="p-3 text-sm text-zinc-500 dark:text-zinc-400">
                    {formatDateTime(payment.paidDate)}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
