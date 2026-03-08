'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getAllCashDeposits, approveCashDeposit, rejectCashDeposit } from '@/src/features/cashDeposits/api';
import { getAgents } from '@/src/features/agents/api';
import { CreditCard, CheckCircle, XCircle, Clock, User, Package, Calendar } from 'lucide-react';
import Pagination from '@/src/components/ui/Pagination';
import FilterBar from '@/src/components/ui/FilterBar';
import RefreshButton from '@/src/components/ui/RefreshButton';
import ConfirmationModal from '@/src/components/ui/ConfirmationModal';

export default function CashDepositsPage() {
  const [cashDeposits, setCashDeposits] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [depositToApprove, setDepositToApprove] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  // Filters state
  const [filters, setFilters] = useState({
    status: 'pending',
    agentId: '',
    adminId: '',
    dateFrom: '',
    dateTo: ''
  });

  // Fetch cash deposits
  const fetchCashDeposits = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
        )
      });
      
      const result = await getAllCashDeposits(params.toString());
      
      if (result.success) {
        setCashDeposits(result.data || []);
        setPagination(result.pagination || pagination);
      }
    } catch (err) {
      console.error('fetchCashDeposits error:', err);
      setCashDeposits([]);
      
      // Show user-friendly error message
      if (err.message.includes('Too many requests')) {
        alert('Rate limit exceeded. Please wait a moment before refreshing.');
      } else {
        alert(err.message || 'Failed to fetch cash deposits');
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Fetch agents for filter dropdown
  const fetchAgents = useCallback(async () => {
    try {
      const result = await getAgents('?limit=1000');
      if (result.success) {
        const agentsData = result.data || [];
        setAgents(agentsData);
      } else if (Array.isArray(result)) {
        console.log('Setting agents from array:', result);
        setAgents(result);
      } else {
        console.log('No agents found, setting empty array');
        setAgents([]);
      }
    } catch (err) {
      console.error('fetchAgents error:', err);
      setAgents([]);
    }
  }, []);

  // Filter cash deposits based on search and filters
  const filteredCashDeposits = cashDeposits.filter(deposit => {
    // Search filter - search by agent name, agent email, agent mobile, admin name, admin email, admin mobile
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const agentMatch = deposit.agent?.name?.toLowerCase().includes(searchLower) ||
                         deposit.agent?.email?.toLowerCase().includes(searchLower) ||
                         deposit.agent?.mobile?.toLowerCase().includes(searchLower);
      const adminMatch = deposit.admin?.name?.toLowerCase().includes(searchLower) ||
                        deposit.admin?.email?.toLowerCase().includes(searchLower) ||
                        deposit.admin?.mobile?.toLowerCase().includes(searchLower);
      
      if (!agentMatch && !adminMatch) {
        return false;
      }
    }
    
    // Status filter
    if (filters.status && deposit.status !== filters.status) {
      return false;
    }
    
    // Agent filter
    if (filters.agentId && deposit.agent?._id !== filters.agentId) {
      return false;
    }
    
    // Date filters
    if (filters.dateFrom) {
      const depositDate = new Date(deposit.requestedAt);
      const fromDate = new Date(filters.dateFrom);
      if (depositDate < fromDate) {
        return false;
      }
    }
    
    if (filters.dateTo) {
      const depositDate = new Date(deposit.requestedAt);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      if (depositDate > toDate) {
        return false;
      }
    }
    
    return true;
  });

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setPagination({ page: 1, limit: newLimit });
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Approve deposit with confirmation modal
  const handleApprove = async (depositId) => {
    setDepositToApprove(depositId);
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    if (!depositToApprove) return;
    
    try {
      setProcessing(depositToApprove);
      await approveCashDeposit(depositToApprove);
      setShowApproveModal(false);
      setDepositToApprove(null);
      await fetchCashDeposits();
    } catch (err) {
      console.error('confirmApprove error:', err);
      // Only show alert if it's a real error, not just a status code issue
      if (!err.message.includes('Failed to approve') && err.response?.status !== 400) {
        alert(err.message || 'Failed to approve deposit');
      }
    } finally {
      setProcessing(null);
    }
  };

  const closeApproveModal = () => {
    setShowApproveModal(false);
    setDepositToApprove(null);
  };

  // Open reject modal
  const openRejectModal = (deposit) => {
    setSelectedDeposit(deposit);
    setShowRejectModal(true);
  };

  // Close reject modal
  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectNotes('');
    setSelectedDeposit(null);
  };

  // Confirm reject
  const confirmReject = async () => {
    if (!selectedDeposit) return;
    
    try {
      setProcessing(selectedDeposit._id);
      await rejectCashDeposit(selectedDeposit._id, rejectNotes);
      setShowRejectModal(false);
      setRejectNotes('');
      setSelectedDeposit(null);
      await fetchCashDeposits();
    } catch (err) {
      console.error('confirmReject error:', err);
      // Only show alert if it's a real error, not just a status code issue
      if (!err.message.includes('Failed to reject') && err.response?.status !== 400) {
        alert(err.message || 'Failed to reject deposit');
      }
    } finally {
      setProcessing(null);
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    fetchCashDeposits();
    fetchAgents();
  }, [fetchCashDeposits, fetchAgents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Cash Deposit Requests</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage agent cash deposit requests for admin packages
          </p>
        </div>
        <RefreshButton onRefresh={fetchCashDeposits} disabled={loading} />
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Search by agent name, email, mobile, admin name, email, or mobile..."
        filterOptions={[
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: '', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' }
            ]
          },
          {
            key: 'agentId',
            label: 'Agent',
            type: 'select',
            options: [
              { value: '', label: 'All Agents' },
              ...(agents.length > 0 ? agents.map(agent => ({
                value: agent._id,
                label: `${agent.name} - ${agent.email} - ${agent.mobile || 'N/A'}`
              })) : [])
            ]
          },
          {
            key: 'dateFrom',
            label: 'Date From',
            type: 'date'
          },
          {
            key: 'dateTo',
            label: 'Date To',
            type: 'date'
          }
        ]}
      />

      {/* Cash Deposits Table */}
      {loading ? (
        <div className="rounded-xl border px-6 py-8 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
            Loading cash deposits...
          </div>
        </div>
      ) : filteredCashDeposits.length === 0 ? (
        <div className="rounded-xl border px-6 py-8 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-zinc-400" />
          <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-white">No cash deposits found</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {Object.values(filters).some(v => v) ? 'Try adjusting your filters' : 'No cash deposit requests available'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-zinc-900 text-white">
              <tr>
                <th className="p-3 text-left">Agent</th>
                <th className="p-3 text-left">Admin</th>
                <th className="p-3 text-left">Package</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Requested</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900">
              {filteredCashDeposits.map((deposit) => (
                <tr key={deposit._id} className="border-b hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <td className="p-3">
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-white">
                        {deposit.agent?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {deposit.agent?.email || 'N/A'}
                      </div>
                      {deposit.agent?.mobile && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {deposit.agent.mobile}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-white">
                        {deposit.admin?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {deposit.admin?.email || 'N/A'}
                      </div>
                      {deposit.admin?.mobile && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {deposit.admin.mobile}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-white">
                        {deposit.keyPrice?.packageName || 'Unknown'}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {deposit.keyPrice?.keys || 0} keys • ₹{deposit.keyPrice?.price || 0}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-zinc-900 dark:text-white">
                      ₹{deposit.amount || 0}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deposit.status)}`}>
                      {getStatusIcon(deposit.status)}
                      {deposit.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(deposit.requestedAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-zinc-400 dark:text-zinc-500">
                      {new Date(deposit.requestedAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="p-3">
                    {deposit.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(deposit._id)}
                          disabled={processing === deposit._id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                          {processing === deposit._id ? (
                            <div className="h-3 w-3 animate-spin rounded-full border border-emerald-600 border-t-transparent"></div>
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(deposit)}
                          disabled={processing === deposit._id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                          <XCircle className="h-3 w-3" />
                          Reject
                        </button>
                      </div>
                    )}
                    {deposit.status === 'approved' && (
                      <div className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-lg">
                        <CheckCircle className="h-3 w-3" />
                        Approved
                      </div>
                    )}
                    {deposit.status === 'rejected' && (
                      <div className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg">
                        <XCircle className="h-3 w-3" />
                        Rejected
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && cashDeposits.length > 0 && (
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

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <ConfirmationModal
          isOpen={showApproveModal}
          onClose={closeApproveModal}
          onConfirm={confirmApprove}
          title="Approve Cash Deposit"
          message="Are you sure you want to approve this cash deposit request?"
          confirmText="Approve"
          cancelText="Cancel"
          variant="default"
          isLoading={processing === depositToApprove}
        />
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <ConfirmationModal
          isOpen={showRejectModal}
          onClose={closeRejectModal}
          onConfirm={confirmReject}
          title="Reject Cash Deposit"
          message="Are you sure you want to reject this cash deposit request?"
          confirmText="Reject"
          cancelText="Cancel"
          variant="danger"
          isLoading={processing === selectedDeposit?._id}
        />
      )}
    </div>
  );
}
