// app/(dashboard)/emis/page.jsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getEmis } from '@/src/features/emis/api';
import Pagination from '@/src/components/ui/Pagination';
import FilterBar from '@/src/components/ui/FilterBar';
import RefreshButton from '@/src/components/ui/RefreshButton';

export default function EmiListPage() {
  const [emis, setEmis] = useState([]);
  const [loading, setLoading] = useState(true);
  
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
    status: '',
    userId: '',
    amountOperator: '',
    amountValue: '',
    createdFrom: '',
    createdTo: '',
  });

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      
      // Convert amount filter to backend format
      const backendFilters = { ...filters };
      if (backendFilters.amountOperator && backendFilters.amountValue) {
        if (backendFilters.amountOperator === '>=') {
          backendFilters.amountMin = backendFilters.amountValue;
        } else if (backendFilters.amountOperator === '<') {
          backendFilters.amountMax = backendFilters.amountValue;
        }
        delete backendFilters.amountOperator;
        delete backendFilters.amountValue;
      }
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(backendFilters).filter(([_, v]) => v !== '' && v !== null)
        ),
      });
      
      const payload = await getEmis(params.toString());
      
      if (payload.pagination) {
        setPagination(payload.pagination);
        setEmis(payload.data || []);
      } else {
        const list = Array.isArray(payload) ? payload : payload.data || [];
        setEmis(list);
      }
    } catch (err) {
      console.error('fetch emis', err);
      setEmis([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetch();
  }, [fetch]);

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
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All' },
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
      ],
    },
    {
      key: 'amount',
      label: 'Amount',
      type: 'numberRange',
      placeholder: 'Enter amount',
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
        <h1 className="text-2xl font-semibold">EMIs</h1>
        <div className="flex items-center gap-3">
          <RefreshButton onRefresh={fetch} disabled={loading} />
          <Link href="/emis/create" className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
            + Create EMI
          </Link>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Search by name, number, email, or bill number..."
        filterOptions={filterOptions}
      />

      {loading ? (
        <div className="rounded-xl border px-6 py-8 text-center">Loading EMIs…</div>
      ) : emis.length === 0 ? (
        <div className="rounded-xl border px-6 py-8 text-center">No EMIs found.</div>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-zinc-900 text-white">
              <tr>
                <th className="p-4 text-left font-semibold">Bill No.</th>
                <th className="p-4 text-left font-semibold">User</th>
                <th className="p-4 text-left font-semibold">Contact</th>
                <th className="p-4 text-left font-semibold">Total</th>
                <th className="p-4 text-left font-semibold">Status</th>
                <th className="p-4 text-left font-semibold">Paid Installments</th>
                <th className="p-4 text-left font-semibold">View Details</th>
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-zinc-900">
              {emis.map((e) => (
                <tr key={e._id} className="border-b hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="p-4 font-medium text-zinc-900 dark:text-white">{e.billNumber || '-'}</td>
                  <td className="p-4 text-zinc-700 dark:text-zinc-300">{e.user?.fullName || e.user?.name || e.user?.mobile || '-'}</td>
                  <td className="p-4 text-zinc-700 dark:text-zinc-300">
                    <div className="flex flex-col gap-1">
                      <span>{e.user?.mobile || '-'}</span>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">{e.user?.email || '-'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-700 dark:text-zinc-300">₹{e.totalAmount?.toLocaleString() || '0'}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      e.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}>
                      {e.status?.toUpperCase() || 'ACTIVE'}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-700 dark:text-zinc-300">{e.paidInstallments || 0} / {e.totalInstallments || 0}</td>
                  <td className="p-4">
                    <Link
                      href={`/emis/${e._id}`}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium shadow-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:shadow-md whitespace-nowrap min-w-[120px]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}

      {!loading && emis.length > 0 && (
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
