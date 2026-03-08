'use client';

import { useEffect, useState } from 'react';
import { getPaymentsToday } from '@/src/features/admins/api';
import { Clock, Calendar } from 'lucide-react';
import RefreshButton from '@/src/components/ui/RefreshButton';
import FilterBar from '@/src/components/ui/FilterBar';
import Pagination from '@/src/components/ui/Pagination';

export default function OverduePaymentsPage() {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(false);
  const [pendingStats, setPendingStats] = useState(null);
  const [filters, setFilters] = useState({ search: '', fromDate: '', toDate: '', status: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);
      if (filters.status) queryParams.append('status', filters.status);
      queryParams.append('page', pagination.page);
      queryParams.append('limit', pagination.limit);

      const data = await getPaymentsToday(queryParams.toString());
      
      setPendingPayments(data.pendingPayments || []);
      setPendingStats(data.pendingStats || { count: 0, totalAmount: 0 });
      setInitialLoad(true);
      
      if (data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total || 0,
          totalPages: data.pagination.totalPages || 1,
          page: data.pagination.page || 1,
          limit: data.pagination.limit || 50
        }));
      }
    } catch (err) {
      console.error('fetchPayments', err);
      setPendingPayments([]);
      setInitialLoad(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filters, pagination.page, pagination.limit]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Overdue Payments</h1>
        <RefreshButton onRefresh={fetchPayments} disabled={loading} />
      </div>

      {/* Stats Cards */}
      {initialLoad && pendingStats !== null && (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <p className="text-sm text-zinc-500">Overdue Payments</p>
            </div>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-white">
              {loading ? '...' : (pendingStats?.count || 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <p className="text-sm text-zinc-500">Total Overdue Amount</p>
            </div>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-white">
              {loading ? '...' : `₹${(pendingStats?.totalAmount || 0).toLocaleString()}`}
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
            key: 'status',
            label: 'Status',
            type: 'select',
            placeholder: 'All',
            options: [
              { value: '', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'overdue', label: 'Overdue' }
            ]
          },
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
        <div className="text-center py-8 text-zinc-500">Loading overdue payments...</div>
      ) : pendingPayments.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">No overdue payments.</div>
      ) : (
        <>
          {/* Overdue Payments - Grouped by Date */}
          <div className="space-y-6">
            {pendingPayments.map((group) => (
              <div key={group.date} className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    <h3 className="font-semibold text-zinc-900 dark:text-white">
                      Due Date: {formatDate(group.date)}
                    </h3>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      ({group.payments.length} payment{group.payments.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-zinc-50 dark:bg-zinc-900">
                      <tr>
                        <th className="p-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400">User</th>
                        <th className="p-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400">Contact</th>
                        <th className="p-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400">Bill Number</th>
                        <th className="p-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400">Installment No.</th>
                        <th className="p-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400">Amount</th>
                        <th className="p-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400">Due Date</th>
                        <th className="p-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.payments.map((payment) => (
                        <tr key={payment._id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                          <td className="p-3">
                            <p className="font-medium text-zinc-900 dark:text-white">
                              {payment.userId?.fullName || 'N/A'}
                            </p>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1 text-zinc-700 dark:text-zinc-300">
                              <span className="text-sm">{payment.userId?.mobile || '-'}</span>
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">{payment.userId?.email || '-'}</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-zinc-900 dark:text-white">
                            {payment.emiId?.billNumber || 'N/A'}
                          </td>
                          <td className="p-3 text-sm text-zinc-900 dark:text-white">
                            {payment.installmentNumber || 'N/A'}
                          </td>
                          <td className="p-3 font-medium text-zinc-900 dark:text-white">
                            ₹{(payment.amount || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-sm text-zinc-500 dark:text-zinc-400">
                            {formatDate(payment.dueDate)}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              payment.status === 'overdue'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : payment.status === 'pending'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              hasNextPage={pagination.page < pagination.totalPages}
              hasPrevPage={pagination.page > 1}
              limit={pagination.limit}
              total={pagination.total}
              onLimitChange={handleLimitChange}
            />
          )}
        </>
      )}
    </div>
  );
}

