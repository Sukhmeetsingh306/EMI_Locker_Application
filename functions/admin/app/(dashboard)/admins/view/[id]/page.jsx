'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  getAdminById, 
  updateAdmin,
  blockAdmin, 
  unblockAdmin,
  getAdminDetailedStats,
  transferAdmin
} from '@/src/features/admins/api';
import { getAgents } from '@/src/features/agents/api';
import { getAdminPaymentConfig, updateAdminPaymentConfig } from '@/src/features/paymentConfig/api';
import { ArrowLeft, Edit, Shield, ShieldOff, Key, Users, Package, DollarSign, Loader2, CreditCard, QrCode, CheckCircle, XCircle, Building2, X, Save, ArrowRightLeft } from 'lucide-react';
import ConfirmationModal from '@/src/components/ui/ConfirmationModal';

const AdminViewPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentConfigModal, setShowPaymentConfigModal] = useState(false);
  const [savingPaymentConfig, setSavingPaymentConfig] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'admin',
    password: '',
  });
  const [paymentConfigForm, setPaymentConfigForm] = useState({
    razorpayEnabled: false,
    qrCodeEnabled: false,
    bankDetailsEnabled: false,
    razorpayKeyId: '',
    razorpayKeySecret: '',
    upiId: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankAccountHolderName: '',
  });

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch admin details
        const adminPayload = await getAdminById(id);
        const adminDoc = adminPayload?.data || adminPayload;

        if (!adminDoc?._id && !adminDoc?.id) {
          setNotification("Admin not found");
          setTimeout(() => {
            router.push("/admins");
          }, 2000);
          return;
        }

        setAdmin(adminDoc);

        // Fetch detailed stats
        try {
          const statsData = await getAdminDetailedStats(id);
          setStats(statsData?.data || statsData);
        } catch (err) {
          console.error('Failed to load stats', err);
        }

        // Fetch payment configuration
        try {
          const paymentData = await getAdminPaymentConfig(id);
          setPaymentConfig(paymentData?.data || paymentData);
        } catch (err) {
          console.error('Failed to load payment config', err);
        }

      } catch (err) {
        console.error("getAdminById", err);
        setNotification("Failed to load admin");
        setTimeout(() => {
          router.push("/admins");
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleBlock = () => {
    setShowBlockModal(true);
  };

  const handleConfirmBlock = async () => {
    try {
      setBlocking(true);
      setShowBlockModal(false);
      
      if (admin?.status === 0) {
        await unblockAdmin(id);
        setNotification('Admin unblocked successfully!');
      } else {
        await blockAdmin(id);
        setNotification('Admin blocked successfully!');
      }
      
      // Refresh data
      const adminPayload = await getAdminById(id);
      const adminDoc = adminPayload?.data || adminPayload;
      setAdmin(adminDoc);
    } catch (err) {
      console.error('block/unblock failed', err);
      setNotification(err?.response?.data?.message || 'Operation failed');
    } finally {
      setBlocking(false);
    }
  };

  const handleOpenEdit = () => {
    setFormData({
      name: admin.name || '',
      email: admin.email || '',
      mobile: admin.mobile || '',
      role: admin.role || 'admin',
      password: '',
    });
    setShowEditModal(true);
  };

  // Transfer handlers
  const handleOpenTransfer = async () => {
    try {
      const agentsData = await getAgents('?limit=1000');
      setAgents(agentsData.data || agentsData || []);
      setSelectedAgent('');
      setShowTransferModal(true);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      alert('Failed to load agents');
    }
  };

  const handleTransfer = async () => {
    if (!selectedAgent) {
      alert('Please select an agent');
      return;
    }

    setTransferring(true);
    try {
      await transferAdmin(id, selectedAgent);
      
      // Refresh admin data by refetching
      try {
        setLoading(true);
        const adminData = await getAdminById(id);
        setAdmin(adminData?.data || adminData);
        
        // Fetch stats
        try {
          const statsData = await getAdminDetailedStats(id);
          setStats(statsData?.data || statsData);
        } catch (err) {
          console.error('Failed to load stats', err);
        }
      } catch (err) {
        console.error("Failed to refresh admin data", err);
      }
      
      setShowTransferModal(false);
      setSelectedAgent('');
      
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Failed to transfer admin: ' + (error.message || 'Unknown error'));
    } finally {
      setTransferring(false);
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { 
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      await updateAdmin(id, payload);
      setNotification('Admin updated successfully!');
      setShowEditModal(false);
      
      // Refresh data
      const adminPayload = await getAdminById(id);
      const adminDoc = adminPayload?.data || adminPayload;
      setAdmin(adminDoc);
    } catch (err) {
      console.error('updateAdmin', err);
      setNotification(err?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPaymentConfigEdit = () => {
    setPaymentConfigForm({
      razorpayEnabled: paymentConfig?.razorpayEnabled || false,
      qrCodeEnabled: paymentConfig?.qrCodeEnabled || false,
      bankDetailsEnabled: paymentConfig?.bankDetailsEnabled || false,
      razorpayKeyId: paymentConfig?.razorpayKeyId || '',
      razorpayKeySecret: paymentConfig?.razorpayKeySecret || '',
      upiId: paymentConfig?.upiId || '',
      bankAccountNumber: paymentConfig?.bankAccountNumber || '',
      bankIfsc: paymentConfig?.bankIfsc || '',
      bankAccountHolderName: paymentConfig?.bankAccountHolderName || '',
    });
    setShowPaymentConfigModal(true);
  };

  const handlePaymentConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPaymentConfigForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSavePaymentConfig = async (e) => {
    e.preventDefault();
    try {
      setSavingPaymentConfig(true);
      const payload = {
        razorpayEnabled: paymentConfigForm.razorpayEnabled,
        qrCodeEnabled: paymentConfigForm.qrCodeEnabled,
        bankDetailsEnabled: paymentConfigForm.bankDetailsEnabled,
        razorpayKeyId: paymentConfigForm.razorpayKeyId || undefined,
        razorpayKeySecret: paymentConfigForm.razorpayKeySecret || undefined,
        upiId: paymentConfigForm.upiId || undefined,
        bankAccountNumber: paymentConfigForm.bankAccountNumber || undefined,
        bankIfsc: paymentConfigForm.bankIfsc || undefined,
        bankAccountHolderName: paymentConfigForm.bankAccountHolderName || undefined,
      };

      await updateAdminPaymentConfig(id, payload);
      setNotification('Payment configuration updated successfully!');
      setShowPaymentConfigModal(false);
      
      // Refresh payment config
      const paymentData = await getAdminPaymentConfig(id);
      setPaymentConfig(paymentData?.data || paymentData);
    } catch (err) {
      console.error('updateAdminPaymentConfig', err);
      setNotification(err?.response?.data?.message || 'Failed to update payment configuration');
    } finally {
      setSavingPaymentConfig(false);
    }
  };

  // Auto-hide notification after 2 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle ESC key for edit modal
  useEffect(() => {
    if (!showEditModal) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !saving) {
        setShowEditModal(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showEditModal, saving]);

  // Handle ESC key for payment config modal
  useEffect(() => {
    if (!showPaymentConfigModal) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !savingPaymentConfig) {
        setShowPaymentConfigModal(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showPaymentConfigModal, savingPaymentConfig]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showEditModal || showPaymentConfigModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showEditModal, showPaymentConfigModal]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">Loading admin details...</div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-zinc-600 dark:text-zinc-400">Admin not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-50 border-b-2 border-emerald-500 px-6 py-3 shadow-md">
          <p className="text-emerald-700 font-medium text-center">{notification}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
              Admin Details - {admin.name || admin.email || 'N/A'}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              View admin information, statistics, and payment configuration
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBlock}
            disabled={blocking}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              admin.status === 0
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {blocking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : admin.status === 0 ? (
              <Shield className="h-4 w-4" />
            ) : (
              <ShieldOff className="h-4 w-4" />
            )}
            {blocking ? 'Processing…' : admin.status === 0 ? 'Unblock Admin' : 'Block Admin'}
          </button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Basic Information</h3>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              admin.status === 0 
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            }`}>
              {admin.status === 0 ? 'BLOCKED' : 'ACTIVE'}
            </span>
            <button
              onClick={handleOpenTransfer}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-semibold shadow-sm hover:from-purple-600 hover:to-purple-700 transition-all duration-200 hover:shadow-md"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Transfer Agent
            </button>
            <button
              onClick={handleOpenEdit}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold shadow-sm hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 hover:shadow-md"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Personal Details */}
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-20 pt-0.5">
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Personal:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Full Name</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">{admin.name || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Email</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">{admin.email || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Mobile</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">{admin.mobile || '-'}</p>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-20 pt-0.5">
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Account:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Role</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white capitalize">
                  {admin.role || 'admin'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Created At</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : '-'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Last Updated</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {admin.updatedAt ? new Date(admin.updatedAt).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Created By */}
          {(admin.enrolledBy || admin.createdBy) && (
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-20 pt-0.5">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Created By:</span>
              </div>
              <div className="flex-1">
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {admin.createdBy ? (
                    <>
                      {admin.createdBy.name}
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-2">
                        ({admin.creatorType === 'Agent' ? 'Agent' : 'Super Admin'})
                      </span>
                      {admin.createdBy.email && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
                          ({admin.createdBy.email})
                        </span>
                      )}
                      {admin.createdBy.mobile && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">
                          | {admin.createdBy.mobile}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      Unknown
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
                        (Creator not specified)
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Enrollment Information */}
          {admin.enrolledBy && (
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-20 pt-0.5">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Enrolled By:</span>
              </div>
              <div className="flex-1">
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {admin.enrolledBy.name}
                  {admin.enrolledBy.email && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
                      ({admin.enrolledBy.email})
                    </span>
                  )}
                  {admin.enrolledBy.mobile && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
                      ({admin.enrolledBy.mobile})
                    </span>
                  )}
                </p>
                {admin.enrolledAt && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Enrolled on: {new Date(admin.enrolledAt).toLocaleDateString()} at {new Date(admin.enrolledAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Statistics */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Key Statistics</h3>
        </div>

        <div className="space-y-6">
          {/* Keys Information */}
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-20 pt-0.5">
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Keys:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Available Keys</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {admin.availableKeys || 0}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Total Keys</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {admin.totalKeys || 0}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Used Keys</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {admin.usedKeys || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Activity Statistics */}
          {stats && (
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-20 pt-0.5">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Activity:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Users Created</label>
                  <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                    {stats.summary?.totalUsers || 0}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Packages</label>
                  <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                    {stats.summary?.completedPackages || 0}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Revenue</label>
                  <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    ₹{stats.summary?.totalPackageAmount || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Configuration */}
      {paymentConfig && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Payment Configuration</h3>
            <button
              onClick={handleOpenPaymentConfigEdit}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold shadow-sm hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 hover:shadow-md"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          </div>

          <div className="space-y-6">
            {/* Razorpay */}
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-20 pt-0.5">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Razorpay:</span>
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {paymentConfig.razorpayEnabled ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">Enabled</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-zinc-400" />
                        <span className="text-xs text-zinc-500">Disabled</span>
                      </>
                    )}
                  </div>
                </div>
                {paymentConfig.razorpayEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-zinc-500">Key ID:</label>
                      <p className="mt-1 font-mono text-zinc-700 dark:text-zinc-300">
                        {paymentConfig.razorpayKeyId || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="text-zinc-500">Key Secret:</label>
                      <p className="mt-1 font-mono text-zinc-700 dark:text-zinc-300">
                        {paymentConfig.razorpayKeySecret || 'Not set'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* QR Code */}
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-20 pt-0.5">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">QR Code:</span>
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {paymentConfig.qrCodeEnabled ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">Enabled</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-zinc-400" />
                        <span className="text-xs text-zinc-500">Disabled</span>
                      </>
                    )}
                  </div>
                </div>
                {paymentConfig.qrCodeEnabled && (
                  <div className="space-y-3">
                    {paymentConfig.upiId && (
                      <div>
                        <label className="text-xs text-zinc-500">UPI ID:</label>
                        <p className="mt-1 font-mono text-sm text-zinc-700 dark:text-zinc-300">
                          {paymentConfig.upiId}
                        </p>
                      </div>
                    )}
                    {paymentConfig.qrCodeImage && (
                      <div>
                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">QR Code Image</label>
                        <div className="mt-2">
                          <img
                            src={paymentConfig.qrCodeImage}
                            alt="QR Code"
                            className="w-32 h-32 border border-zinc-300 rounded-lg object-contain bg-white p-2"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bank Details */}
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-20 pt-0.5">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Bank:</span>
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {paymentConfig.bankDetailsEnabled ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">Enabled</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-zinc-400" />
                        <span className="text-xs text-zinc-500">Disabled</span>
                      </>
                    )}
                  </div>
                </div>
                {paymentConfig.bankDetailsEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {paymentConfig.bankAccountHolderName && (
                      <div>
                        <label className="text-zinc-500">Account Holder:</label>
                        <p className="mt-1 font-medium text-zinc-700 dark:text-zinc-300">
                          {paymentConfig.bankAccountHolderName}
                        </p>
                      </div>
                    )}
                    {paymentConfig.bankAccountNumber && (
                      <div>
                        <label className="text-zinc-500">Account Number:</label>
                        <p className="mt-1 font-mono text-zinc-700 dark:text-zinc-300">
                          {paymentConfig.bankAccountNumber}
                        </p>
                      </div>
                    )}
                    {paymentConfig.bankIfsc && (
                      <div>
                        <label className="text-zinc-500">IFSC Code:</label>
                        <p className="mt-1 font-mono text-zinc-700 dark:text-zinc-300">
                          {paymentConfig.bankIfsc}
                        </p>
                      </div>
                    )}
                    {!paymentConfig.bankAccountHolderName && !paymentConfig.bankAccountNumber && !paymentConfig.bankIfsc && (
                      <div className="text-zinc-500 italic">
                        Bank details not configured
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!paymentConfig && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <div className="text-center py-4 text-sm text-zinc-500">
            No payment configuration found
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={handleConfirmBlock}
        title={admin?.status === 0 ? 'Unblock Admin' : 'Block Admin'}
        message={`Are you sure you want to ${admin?.status === 0 ? 'unblock' : 'block'} this admin?`}
        confirmText={admin?.status === 0 ? 'Unblock' : 'Block'}
        variant="danger"
        isLoading={blocking}
      />

      {/* Edit Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) {
              setShowEditModal(false);
            }
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/30 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/95">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              disabled={saving}
              className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Content */}
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Edit className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Edit Admin
              </h3>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleEditChange}
                  required
                  placeholder="Enter full name"
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-500"
                  disabled={saving}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleEditChange}
                  required
                  placeholder="admin@example.com"
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-500"
                  disabled={saving}
                />
              </div>

              <div>
                <label
                  htmlFor="mobile"
                  className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Mobile
                </label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleEditChange}
                  placeholder="1234567890"
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-500"
                  disabled={saving}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleEditChange}
                  placeholder="Leave blank to keep current password"
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-500"
                  disabled={saving}
                />
                <p className="mt-1 text-xs text-zinc-500">Leave blank to keep the current password</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Configuration Edit Modal */}
      {showPaymentConfigModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingPaymentConfig) {
              setShowPaymentConfigModal(false);
            }
          }}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <div className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl border border-white/30 bg-white/95 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/95 flex flex-col">
            {/* Header - Fixed */}
            <div className="flex-shrink-0 p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Edit Payment Configuration
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentConfigModal(false)}
                  disabled={savingPaymentConfig}
                  className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="payment-config-form" onSubmit={handleSavePaymentConfig} className="space-y-6">
              {/* Payment Method Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Payment Methods</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="razorpayEnabled"
                      checked={paymentConfigForm.razorpayEnabled}
                      onChange={handlePaymentConfigChange}
                      disabled={savingPaymentConfig}
                      className="w-5 h-5 rounded disabled:cursor-not-allowed"
                    />
                    <CreditCard className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm font-medium">Enable Razorpay</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="qrCodeEnabled"
                      checked={paymentConfigForm.qrCodeEnabled}
                      onChange={handlePaymentConfigChange}
                      disabled={savingPaymentConfig}
                      className="w-5 h-5 rounded disabled:cursor-not-allowed"
                    />
                    <QrCode className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm font-medium">Enable QR Code</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="bankDetailsEnabled"
                      checked={paymentConfigForm.bankDetailsEnabled}
                      onChange={handlePaymentConfigChange}
                      disabled={savingPaymentConfig}
                      className="w-5 h-5 rounded disabled:cursor-not-allowed"
                    />
                    <Building2 className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm font-medium">Enable Bank Details</span>
                  </label>
                </div>
              </div>

              {/* Razorpay Configuration */}
              {paymentConfigForm.razorpayEnabled && (
                <div className="space-y-4 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Razorpay Configuration
                  </h4>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Razorpay Key ID
                    </label>
                    <input
                      type="text"
                      name="razorpayKeyId"
                      value={paymentConfigForm.razorpayKeyId}
                      onChange={handlePaymentConfigChange}
                      placeholder="Enter Razorpay Key ID"
                      className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-500"
                      disabled={savingPaymentConfig}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Razorpay Key Secret
                    </label>
                    <input
                      type="text"
                      name="razorpayKeySecret"
                      value={paymentConfigForm.razorpayKeySecret}
                      onChange={handlePaymentConfigChange}
                      placeholder="Enter Razorpay Key Secret"
                      className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-500"
                      disabled={savingPaymentConfig}
                    />
                  </div>
                </div>
              )}

              {/* QR Code Configuration */}
              {paymentConfigForm.qrCodeEnabled && (
                <div className="space-y-4 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    QR Code Configuration
                  </h4>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      name="upiId"
                      value={paymentConfigForm.upiId}
                      onChange={handlePaymentConfigChange}
                      placeholder="Enter UPI ID (e.g., user@paytm)"
                      className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-500"
                      disabled={savingPaymentConfig}
                    />
                  </div>
                </div>
              )}

              {/* Bank Details Configuration */}
              {paymentConfigForm.bankDetailsEnabled && (
                <div className="space-y-4 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Bank Details Configuration
                  </h4>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      name="bankAccountHolderName"
                      value={paymentConfigForm.bankAccountHolderName}
                      onChange={handlePaymentConfigChange}
                      placeholder="Enter account holder name"
                      className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-500"
                      disabled={savingPaymentConfig}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Account Number
                    </label>
                    <input
                      type="text"
                      name="bankAccountNumber"
                      value={paymentConfigForm.bankAccountNumber}
                      onChange={handlePaymentConfigChange}
                      placeholder="Enter bank account number"
                      className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-500"
                      disabled={savingPaymentConfig}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      name="bankIfsc"
                      value={paymentConfigForm.bankIfsc}
                      onChange={handlePaymentConfigChange}
                      placeholder="Enter IFSC code"
                      className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-500"
                      disabled={savingPaymentConfig}
                    />
                  </div>
                </div>
              )}
              </form>
            </div>

            {/* Footer - Fixed */}
            <div className="flex-shrink-0 p-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentConfigModal(false)}
                  disabled={savingPaymentConfig}
                  className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="payment-config-form"
                  disabled={savingPaymentConfig}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingPaymentConfig ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Configuration
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              Transfer Admin to Agent
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Select Agent
              </label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white"
              >
                <option value="">Choose an agent...</option>
                {agents.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.name} - {agent.email} - {agent.mobile}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-700 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={!selectedAgent || transferring}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {transferring ? 'Transferring...' : 'Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminViewPage;
