"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { getUsersWithOverdueEmis, adminUnlockUser } from "@/src/features/device-lock/api";
import RefreshButton from '@/src/components/ui/RefreshButton';
import FilterBar from '@/src/components/ui/FilterBar';
import Pagination from '@/src/components/ui/Pagination';
import ConfirmationModal from '@/src/components/ui/ConfirmationModal';
import ExtensionDetailsModal from '@/src/components/ui/ExtensionDetailsModal';
import { Clock } from 'lucide-react';

export default function DeviceLockPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlockingUserId, setUnlockingUserId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [showExtensionDetailsModal, setShowExtensionDetailsModal] = useState({ isOpen: false, payment: null });
  
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
    blocked: '',
    dueDateFrom: '',
    dueDateTo: '',
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
        ),
      });
      
      const data = await getUsersWithOverdueEmis(params.toString());
      
      if (data.pagination) {
        setPagination(data.pagination);
        setUsers(data.data || []);
      } else {
        const usersList = Array.isArray(data) ? data : data.data || [];
        setUsers(usersList);
      }
    } catch (err) {
      console.error("device lock list", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    load();
  }, [load]);

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

  const toggleRow = (userId, e) => {
    e.stopPropagation();
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleRowClick = (userId, e) => {
    // Don't navigate if clicking on the action button or expand button
    if (e.target.closest('button') || e.target.closest('.expand-button')) {
      return;
    }
    router.push(`/users/${userId}`);
  };

  const handleUnlock = (userId, e) => {
    e.stopPropagation(); // Prevent row click
    setUnlockingUserId(userId);
    setShowUnlockModal(true);
  };

  const handleShowExtensionDetails = (payment, e) => {
    if (e) {
      e.stopPropagation();
    }
    if (payment.extendDays && payment.extendDays > 0) {
      setShowExtensionDetailsModal({ isOpen: true, payment });
    }
  };

  const handleConfirmUnlock = async () => {
    if (!unlockingUserId) return;
    
    try {
      setProcessing(true);
      setShowUnlockModal(false);
      await adminUnlockUser(unlockingUserId);
      alert("Device unlocked successfully!");
      // Reload the list to reflect changes
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Unlock failed");
    } finally {
      setProcessing(false);
      setUnlockingUserId(null);
    }
  };

  const filterOptions = [
    {
      key: 'blocked',
      label: 'Blocked',
      type: 'select',
      options: [
        { value: '', label: 'All' },
        { value: 'true', label: 'Blocked' },
        { value: 'false', label: 'Not Blocked' },
      ],
    },
    {
      key: 'dueDateFrom',
      label: 'Due Date From',
      type: 'date',
    },
    {
      key: 'dueDateTo',
      label: 'Due Date To',
      type: 'date',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Devices to Lock</h1>
        <RefreshButton onRefresh={load} disabled={loading} />
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Search by name, mobile, email, or bill number..."
        filterOptions={filterOptions}
      />

      {loading ? (
        <div className="rounded-xl border px-6 py-8 text-center">Loading users with overdue EMIs…</div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border px-6 py-8 text-center">No users with overdue EMIs found.</div>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-zinc-900 text-white">
              <tr>
                <th className="p-3 text-left w-8"></th>
                <th className="p-3 text-left">User Name</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Total Overdues</th>
                <th className="p-3 text-left">Device Lock Status</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-zinc-900">
              {users.map((user) => {
                const isExpanded = expandedRows.has(user.userId);
                const overduePayments = user.overduePayments || [];
                
                return (
                  <>
                    <tr 
                      key={user.userId} 
                      onClick={(e) => handleRowClick(user.userId, e)}
                      className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 cursor-pointer group"
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => toggleRow(user.userId, e)}
                          className="expand-button p-1.5 rounded bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                        >
                          <svg 
                            className={`w-5 h-5 text-emerald-700 dark:text-emerald-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                      <td className="p-3">{user.userName || '-'}</td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1 text-zinc-700 dark:text-zinc-300">
                          <span>{user.userMobile || '-'}</span>
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">{user.userEmail || '-'}</span>
                        </div>
                      </td>
                      <td className="p-3">{user.overdueCount || 0}</td>
                      <td className="p-3">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          user.deviceLocked
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                          {user.deviceLocked ? 'Locked' : 'Unlocked'}
                        </span>
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        {user.deviceLocked ? (
                          <button
                            onClick={(e) => handleUnlock(user.userId, e)}
                            disabled={processing}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium shadow-sm hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[120px]"
                          >
                            {processing && unlockingUserId === user.userId ? (
                              <>
                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Processing...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Unblock
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">Already Unblocked</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${user.userId}-expanded`} className="bg-zinc-50 dark:bg-zinc-900/50">
                        <td colSpan={6} className="p-4">
                          <div className="pl-8">
                            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Overdue Installments:</h4>
                            <div className="space-y-2">
                              {overduePayments.length > 0 ? (
                                overduePayments.map((payment, idx) => (
                                  <div 
                                    key={payment._id || idx} 
                                    className="flex items-center gap-4 p-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                                  >
                                    
                                    <div className="flex-1 grid grid-cols-6 gap-4">
                                      <div>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Bill Number</span>
                                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{payment.billNumber || '-'}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Installment No.</span>
                                        <p className="text-sm font-medium text-zinc-900 dark:text-white">#{payment.installmentNumber || idx + 1}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Due Date</span>
                                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                                          {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : '-'}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Amount</span>
                                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">₹{payment.amount?.toLocaleString() || '0'}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Payment Status</span>
                                        <p>
                                          <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                                            payment.status === 'overdue'
                                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                              : payment.status === 'paid'
                                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                          }`}>
                                            {payment.status?.toUpperCase() || 'PENDING'}
                                          </span>
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Extension</span>
                                        <div className="mt-1">
                                          {payment.extendDays && payment.extendDays > 0 ? (
                                            <div className="relative group">
                                              <button
                                                onClick={(e) => handleShowExtensionDetails(payment, e)}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-medium hover:bg-orange-200 dark:hover:bg-orange-900/50 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer border border-orange-200 dark:border-orange-800"
                                                title="Click to view extension details"
                                              >
                                                <Clock className="h-3 w-3" />
                                                {payment.extendDays} {payment.extendDays === 1 ? 'day' : 'days'}
                                              </button>
                                              {/* Tooltip */}
                                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                Click to view extension details
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                                  <div className="border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-800"></div>
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            <span className="text-sm text-zinc-400 dark:text-zinc-500">-</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-zinc-500 dark:text-zinc-400 p-3">No overdue payments found.</div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && users.length > 0 && (
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

      <ConfirmationModal
        isOpen={showUnlockModal}
        onClose={() => {
          setShowUnlockModal(false);
          setUnlockingUserId(null);
        }}
        onConfirm={handleConfirmUnlock}
        title="Unblock Device"
        message={`Are you sure you want to unblock this user's device?`}
        confirmText="Unblock"
        variant="warning"
        isLoading={processing}
      />

      <ExtensionDetailsModal
        isOpen={showExtensionDetailsModal.isOpen}
        onClose={() => setShowExtensionDetailsModal({ isOpen: false, payment: null })}
        extensionData={showExtensionDetailsModal.payment}
      />
    </div>
  );
}
