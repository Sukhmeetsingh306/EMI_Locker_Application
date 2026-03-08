'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getUserById, renewKey } from '@/src/features/users/api';
import { getEmis } from '@/src/features/emis/api';
import { adminUnlockUser } from '@/src/features/device-lock/api';
import { ArrowLeft } from 'lucide-react';
import ConfirmationModal from '@/src/components/ui/ConfirmationModal';
import { useAppSelector, useAppDispatch } from '@/src/hooks/useAppStore';
import { selectRole } from '@/src/features/auth/selectors';
import { hydrateAuth } from '@/src/features/auth/authSlice';

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const role = useAppSelector(selectRole);
  const id = params.id;
  const createdBy = searchParams ? searchParams.get('createdBy') || '' : '';

  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  const [userEmis, setUserEmis] = useState([]);
  const [renewingKey, setRenewingKey] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [unlockingDevice, setUnlockingDevice] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch user details
      const user = await getUserById(id);
      setUserDetails(user);
      
      // Fetch user's EMIs
      const emis = await getEmis(`userId=${id}`);
      const emisList = Array.isArray(emis) ? emis : emis.data || [];
      setUserEmis(emisList);
    } catch (err) {
      console.error('Error fetching user details:', err);
      alert(err?.response?.data?.message || 'Failed to load user details');
      router.push('/users');
    } finally {
      setLoading(false);
    }
  };

  const isKeyExpired = (user) => {
    if (!user?.userKey || !user?.keyExpiryDate) return false;
    return new Date(user.keyExpiryDate) < new Date();
  };

  const handleRenewKey = () => {
    setShowRenewModal(true);
  };

  const handleConfirmRenew = async () => {
    try {
      setRenewingKey(true);
      setShowRenewModal(false);
      const updatedUser = await renewKey(id);
      setUserDetails(updatedUser);
      alert('Key renewed successfully! The key will expire in 1 year.');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to renew key');
    } finally {
      setRenewingKey(false);
    }
  };

  const handleUnlockDevice = () => {
    setShowUnlockModal(true);
  };

  const handleConfirmUnlock = async () => {
    try {
      setUnlockingDevice(true);
      setShowUnlockModal(false);
      await adminUnlockUser(id);
      // Reload user data to get updated device status
      const updatedUser = await getUserById(id);
      setUserDetails(updatedUser);
      alert('Device unlocked successfully!');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to unlock device');
    } finally {
      setUnlockingDevice(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">Loading user details...</div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-zinc-600 dark:text-zinc-400">User not found</div>
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
            User Details - {userDetails.fullName || userDetails.name || 'N/A'}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            View all user information and EMIs
          </p>
        </div>
      </div>

      {/* User Basic Details */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">User Information</h3>
          {role !== 'superadmin' && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Device Action:</label>
              {userDetails.deviceLocked ? (
                <button
                  onClick={handleUnlockDevice}
                  disabled={unlockingDevice}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium shadow-sm hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  {unlockingDevice ? 'Unlocking…' : 'Unlock Device'}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-medium dark:bg-emerald-900/30 dark:text-emerald-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Already Unlocked
                </span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Personal Information Row */}
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-20 pt-0.5">
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Personal:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Full Name</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">{userDetails.fullName || userDetails.name || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Email</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">{userDetails.email || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Mobile</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">{userDetails.mobile || '-'}</p>
              </div>
            </div>
          </div>

          {/* Identity Documents Row */}
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-20 pt-0.5">
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Identity:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Aadhar</label>
                <p className="mt-1 text-sm font-semibold font-mono text-zinc-900 dark:text-white">{userDetails.aadhar || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">PAN</label>
                <p className="mt-1 text-sm font-semibold font-mono uppercase text-zinc-900 dark:text-white">{userDetails.pan || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Device Status</label>
                <p className="mt-1">
                  {userDetails.deviceLocked ? (
                    <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      Locked
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Active
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Account Info Row */}
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-20 pt-0.5">
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Account:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Created At</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {userDetails.createdAt ? new Date(userDetails.createdAt).toLocaleString() : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Information */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Key Information</h3>
          {role !== 'superadmin' && userDetails.userKey && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Key Action:</label>
              {isKeyExpired(userDetails) ? (
                <button
                  onClick={handleRenewKey}
                  disabled={renewingKey}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium shadow-sm hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {renewingKey ? 'Renewing…' : 'Renew Key'}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-medium dark:bg-emerald-900/30 dark:text-emerald-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Already Active
                </span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Key Details Row */}
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-20 pt-0.5">
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Key:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">User Key</label>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm font-semibold font-mono text-zinc-900 dark:text-white break-all">{userDetails.userKey || 'No Key'}</p>
                  {userDetails.userKey && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(userDetails.userKey);
                        alert('Key copied to clipboard!');
                      }}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Copy key"
                    >
                      <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Key Status</label>
                <p className="mt-1">
                  {!userDetails.userKey ? (
                    <span className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      No Key
                    </span>
                  ) : isKeyExpired(userDetails) ? (
                    <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      Expired
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Active
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Key Dates Row */}
          {(userDetails.keyAssignedAt || userDetails.keyExpiryDate) && (
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-20 pt-0.5">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Dates:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                {userDetails.keyAssignedAt && (
                  <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Key Assigned At</label>
                    <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                      {new Date(userDetails.keyAssignedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {userDetails.keyExpiryDate && (
                  <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Key Expiry Date</label>
                    <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                      {new Date(userDetails.keyExpiryDate).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EMIs Section */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            EMIs ({userEmis.length})
          </h3>
          {role !== 'superadmin' && (
            <Link
              href={`/emis/create?userId=${id}`}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              + Create EMI
            </Link>
          )}
        </div>

        {userEmis.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No EMIs found for this user.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Bill No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Paid Installments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">View More</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                {userEmis.map((emi) => (
                  <tr key={emi._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">{emi.billNumber || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">₹{emi.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                        emi.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        {emi.status?.toUpperCase() || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">{emi.paidInstallments || 0} / {emi.totalInstallments || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/emis/${emi._id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium shadow-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:shadow-md whitespace-nowrap min-w-[120px]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View More
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        onConfirm={handleConfirmRenew}
        title="Renew Key"
        message="Renew this expired key? This will consume one of your available keys and extend the key for another year."
        confirmText="Renew Key"
        cancelText="Cancel"
        variant="warning"
        isLoading={renewingKey}
      />

      <ConfirmationModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onConfirm={handleConfirmUnlock}
        title="Unlock Device"
        message="Are you sure you want to unlock this user's device? This will allow them to access the application."
        confirmText="Unlock Device"
        cancelText="Cancel"
        variant="default"
        isLoading={unlockingDevice}
      />
    </div>
  );
}

