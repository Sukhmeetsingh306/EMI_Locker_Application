// app/(dashboard)/emis/[id]/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEmiById, getEmiPayments } from '@/src/features/emis/api';
import { extendPayment } from '@/src/features/payments/api';
import ExtensionModal from '@/src/components/ui/ExtensionModal';
import ExtensionDetailsModal from '@/src/components/ui/ExtensionDetailsModal';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';

export default function EmiDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [emi, setEmi] = useState(null);
  const [payments, setPayments] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [showExtendModal, setShowExtendModal] = useState({ isOpen: false, paymentId: null, userId: null });
  const [showExtensionDetailsModal, setShowExtensionDetailsModal] = useState({ isOpen: false, payment: null });

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const doc = await getEmiById(id);
      const e = doc.data || doc;
      setEmi(e);

      const pays = await getEmiPayments(id);
      const list = Array.isArray(pays) ? pays : pays.data || [];
      setPayments(list);
    } catch (err) {
      console.error('load emi', err);
      alert('Failed to load EMI details');
      router.push('/emis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, router]);

  const handleExtend = (paymentId) => {
    // Get userId from EMI data
    const userId = emi?.user?._id || emi?.user;
    if (!userId) {
      alert('User ID not found');
      return;
    }
    setShowExtendModal({ isOpen: true, paymentId, userId });
  };

  const handleConfirmExtend = async (extensionData) => {
    const { paymentId, userId } = showExtendModal;
    if (!userId) {
      alert('User ID not found');
      return;
    }
    try {
      setProcessingId(paymentId);
      setShowExtendModal({ isOpen: false, paymentId: null, userId: null });
      // Convert extendDays to days for the new API
      await extendPayment(userId, { 
        days: extensionData.extendDays, 
        reason: extensionData.reason 
      });
      await fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Extend failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleShowExtensionDetails = (payment) => {
    if (payment.extendDays && payment.extendDays > 0) {
      setShowExtensionDetailsModal({ isOpen: true, payment });
    }
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">Loading EMI details...</div>
      </div>
    );
  }

  if (!emi) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-zinc-600 dark:text-zinc-400">EMI not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            EMI Details - {emi.billNumber || 'N/A'}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            View EMI information, description, and payment schedule
          </p>
        </div>
      </div>

      {/* EMI Details */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">EMI Information</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            emi.status === 'active' 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
          }`}>
            {emi.status?.toUpperCase() || 'ACTIVE'}
          </span>
        </div>

        <div className="space-y-6">
          {/* Top Row: Bill Number, Created At, and Start Date */}
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-20 pt-0.5">
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Bill:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Bill Number</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">{emi.billNumber || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Start Date</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {emi.startDate ? new Date(emi.startDate).toLocaleDateString() : '-'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Created At</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {emi.createdAt ? new Date(emi.createdAt).toLocaleString() : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* User Details: Name, Number, Email */}
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-20 pt-0.5">
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">User:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Name</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {emi.user?.fullName || emi.user?.name || '-'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Mobile Number</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {emi.user?.mobile || '-'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Email</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {emi.user?.email || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Amount Row: Principal, Interest, Total */}
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-20 pt-0.5">
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Amounts:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Principal Amount</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  ₹{emi.principalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Interest/Markup</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {emi.interestPercentage || '0'}%
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Total Amount</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  ₹{emi.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Info Row: Paid Installments, Payment Duration, Due Dates */}
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-20 pt-0.5">
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Installments:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Paid Installments</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {emi.paidInstallments || 0} / {emi.totalInstallments || 0}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Payment Duration</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {emi.paymentScheduleType ? `${emi.paymentScheduleType} Month(s)` : 'Custom Schedule'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Due Dates</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {emi.dueDates && emi.dueDates.length > 0 
                    ? emi.dueDates.map(d => d + (d === 1 || d === 21 || d === 31 ? 'st' : d === 2 || d === 22 ? 'nd' : d === 3 || d === 23 ? 'rd' : 'th')).join(', ')
                    : 'Custom Schedule'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      {emi.description && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Description</h3>
          <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{emi.description}</p>
        </div>
      )}

      {/* Installment Schedule */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Installment Schedule</h3>
        </div>

        {payments.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No payment schedule available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Paid Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Extension Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Extend</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                {payments.map((p, idx) => (
                  <tr key={p._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      #{p.installmentNumber || idx + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                      ₹{p.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      {p.percentage && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">({p.percentage.toFixed(2)}%)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      {p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                        p.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : p.status === 'overdue'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : p.status === 'locked'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        {p.status === 'paid' && <CheckCircle className="h-3 w-3" />}
                        {p.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      {p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      {p.extendDays && p.extendDays > 0 ? (
                        <div className="relative group">
                          <button
                            onClick={() => handleShowExtensionDetails(p)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-medium hover:bg-orange-200 dark:hover:bg-orange-900/50 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer border border-orange-200 dark:border-orange-800"
                            title="Click to view extension details"
                          >
                            <Clock className="h-3 w-3" />
                            {p.extendDays} {p.extendDays === 1 ? 'day' : 'days'}
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
                        <span className="text-zinc-400 dark:text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {p.status !== 'paid' ? (
                        <button 
                          onClick={() => handleExtend(p._id)} 
                          disabled={processingId === p._id} 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-orange-600 dark:text-white dark:hover:bg-orange-700"
                        >
                          {processingId === p._id ? (
                            <Clock className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Clock className="h-3.5 w-3.5" />
                          )}
                          {processingId === p._id ? 'Processing…' : 'Extend'}
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExtensionModal
        isOpen={showExtendModal.isOpen}
        onClose={() => setShowExtendModal({ isOpen: false, paymentId: null, userId: null })}
        onConfirm={handleConfirmExtend}
        isLoading={processingId === showExtendModal.paymentId}
      />

      <ExtensionDetailsModal
        isOpen={showExtensionDetailsModal.isOpen}
        onClose={() => setShowExtensionDetailsModal({ isOpen: false, payment: null })}
        extensionData={showExtensionDetailsModal.payment}
      />
    </div>
  );
}

