'use client';

import { useEffect, useState } from 'react';
import { 
  getPendingPaymentTransactions, 
  verifyPaymentTransaction, 
  rejectPaymentTransaction 
} from '@/src/features/admins/api';
import { CheckCircle2, XCircle, Calendar, CreditCard, QrCode, Building2 } from 'lucide-react';
import RefreshButton from '@/src/components/ui/RefreshButton';
import FilterBar from '@/src/components/ui/FilterBar';
import Pagination from '@/src/components/ui/Pagination';
import ConfirmationModal from '@/src/components/ui/ConfirmationModal';

export default function PaymentVerificationsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ 
    search: '', 
    paymentMethod: '', 
    createdFrom: '', 
    createdTo: '' 
  });

  // Modal states
  const [verifyModal, setVerifyModal] = useState({ isOpen: false, transaction: null, notes: '' });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, transaction: null, notes: '' });
  const [processing, setProcessing] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.paymentMethod) queryParams.append('paymentMethod', filters.paymentMethod);
      if (filters.createdFrom) queryParams.append('createdFrom', filters.createdFrom);
      if (filters.createdTo) queryParams.append('createdTo', filters.createdTo);
      queryParams.append('page', pagination.page);
      queryParams.append('limit', pagination.limit);

      const data = await getPendingPaymentTransactions(queryParams.toString());
      
      setTransactions(data.data || []);
      
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
      console.error('Error fetching transactions:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
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

  const handleVerifyClick = (transaction) => {
    setVerifyModal({ isOpen: true, transaction, notes: '' });
  };

  const handleRejectClick = (transaction) => {
    setRejectModal({ isOpen: true, transaction, notes: '' });
  };

  const handleVerifyConfirm = async () => {
    if (!verifyModal.transaction) return;
    
    try {
      setProcessing(true);
      await verifyPaymentTransaction(
        verifyModal.transaction._id, 
        verifyModal.notes || null
      );
      setVerifyModal({ isOpen: false, transaction: null, notes: '' });
      // Refresh the list
      await fetchTransactions();
    } catch (err) {
      console.error('Error verifying transaction:', err);
      alert(err.response?.data?.message || 'Failed to verify transaction');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal.transaction) return;
    
    try {
      setProcessing(true);
      await rejectPaymentTransaction(
        rejectModal.transaction._id, 
        rejectModal.notes || null
      );
      setRejectModal({ isOpen: false, transaction: null, notes: '' });
      // Refresh the list
      await fetchTransactions();
    } catch (err) {
      console.error('Error rejecting transaction:', err);
      alert(err.response?.data?.message || 'Failed to reject transaction');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
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

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'qr_code':
        return <QrCode className="h-4 w-4" />;
      case 'bank_transfer':
        return <Building2 className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'qr_code':
        return 'QR Code';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return method;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Payment Verifications</h1>
        <RefreshButton onRefresh={fetchTransactions} disabled={loading} />
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Search by user name, mobile, bill number, or transaction ID..."
        showSearch={true}
        filterOptions={[
          {
            key: 'paymentMethod',
            label: 'Payment Method',
            type: 'select',
            placeholder: 'All Methods',
            options: [
              { value: '', label: 'All Methods' },
              { value: 'qr_code', label: 'QR Code' },
              { value: 'bank_transfer', label: 'Bank Transfer' }
            ]
          },
          {
            key: 'createdFrom',
            label: 'From Date',
            type: 'date',
            placeholder: 'Select from date'
          },
          {
            key: 'createdTo',
            label: 'To Date',
            type: 'date',
            placeholder: 'Select to date'
          }
        ]}
      />

      {/* Transactions Table */}
      {loading ? (
        <div className="text-center py-8 text-zinc-500">Loading pending transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">No pending payment verifications.</div>
      ) : (
        <>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-zinc-900 text-white">
                <tr>
                  <th className="p-3 text-left text-sm font-medium">User</th>
                  <th className="p-3 text-left text-sm font-medium">Bill Number</th>
                  <th className="p-3 text-left text-sm font-medium">Amount</th>
                  <th className="p-3 text-left text-sm font-medium">Payment Method</th>
                  <th className="p-3 text-left text-sm font-medium">Transaction ID</th>
                  <th className="p-3 text-left text-sm font-medium">Submitted</th>
                  <th className="p-3 text-left text-sm font-medium">Installment</th>
                  <th className="p-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr 
                    key={transaction._id} 
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <td className="p-3">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white">
                          {transaction.user?.fullName || transaction.user?.name || 'N/A'}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {transaction.user?.mobile || transaction.user?.phone || ''}
                        </p>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-zinc-900 dark:text-white">
                      {transaction.emi?.billNumber || 'N/A'}
                    </td>
                    <td className="p-3 font-medium text-zinc-900 dark:text-white">
                      ₹{(transaction.amount || 0).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(transaction.paymentMethod)}
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          {getPaymentMethodLabel(transaction.paymentMethod)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                      {transaction.transactionId || 'N/A'}
                    </td>
                    <td className="p-3 text-sm text-zinc-500 dark:text-zinc-400">
                      {formatDateTime(transaction.createdAt)}
                    </td>
                    <td className="p-3 text-sm text-zinc-500 dark:text-zinc-400">
                      {transaction.emiPayment?.installmentNumber ? 
                        `#${transaction.emiPayment.installmentNumber}` : 
                        'N/A'
                      }
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVerifyClick(transaction)}
                          className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Verify
                        </button>
                        <button
                          onClick={() => handleRejectClick(transaction)}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* Verify Confirmation Modal */}
      <ConfirmationModal
        isOpen={verifyModal.isOpen}
        onClose={() => setVerifyModal({ isOpen: false, transaction: null, notes: '' })}
        onConfirm={handleVerifyConfirm}
        title="Verify Payment Transaction"
        message={
          verifyModal.transaction ? (
            <>
              Are you sure you want to verify this payment?
              <div className="mt-3 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-left">
                <p className="text-sm"><strong>Amount:</strong> ₹{(verifyModal.transaction.amount || 0).toLocaleString()}</p>
                <p className="text-sm"><strong>User:</strong> {verifyModal.transaction.user?.fullName || verifyModal.transaction.user?.name || 'N/A'}</p>
                <p className="text-sm"><strong>Bill Number:</strong> {verifyModal.transaction.emi?.billNumber || 'N/A'}</p>
                <p className="text-sm"><strong>Transaction ID:</strong> {verifyModal.transaction.transactionId || 'N/A'}</p>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Notes (optional):
                </label>
                <textarea
                  value={verifyModal.notes}
                  onChange={(e) => setVerifyModal({ ...verifyModal, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  rows={3}
                  placeholder="Add any notes about this verification..."
                />
              </div>
            </>
          ) : (
            'Are you sure you want to verify this payment?'
          )
        }
        confirmText="Verify Payment"
        cancelText="Cancel"
        variant="default"
        isLoading={processing}
      />

      {/* Reject Confirmation Modal */}
      <ConfirmationModal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, transaction: null, notes: '' })}
        onConfirm={handleRejectConfirm}
        title="Reject Payment Transaction"
        message={
          rejectModal.transaction ? (
            <>
              Are you sure you want to reject this payment?
              <div className="mt-3 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-left">
                <p className="text-sm"><strong>Amount:</strong> ₹{(rejectModal.transaction.amount || 0).toLocaleString()}</p>
                <p className="text-sm"><strong>User:</strong> {rejectModal.transaction.user?.fullName || rejectModal.transaction.user?.name || 'N/A'}</p>
                <p className="text-sm"><strong>Bill Number:</strong> {rejectModal.transaction.emi?.billNumber || 'N/A'}</p>
                <p className="text-sm"><strong>Transaction ID:</strong> {rejectModal.transaction.transactionId || 'N/A'}</p>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Reason (optional):
                </label>
                <textarea
                  value={rejectModal.notes}
                  onChange={(e) => setRejectModal({ ...rejectModal, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  rows={3}
                  placeholder="Add reason for rejection..."
                />
              </div>
            </>
          ) : (
            'Are you sure you want to reject this payment?'
          )
        }
        confirmText="Reject Payment"
        cancelText="Cancel"
        variant="danger"
        isLoading={processing}
      />
    </div>
  );
}

