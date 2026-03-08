'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  getAgentById, 
  updateAgent,
  blockAgent, 
  unblockAgent 
} from '@/src/features/agents/api';
import { ArrowLeft, Edit, Shield, ShieldOff, Loader2, X, Save } from 'lucide-react';
import ConfirmationModal from '@/src/components/ui/ConfirmationModal';

const AgentViewPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [agent, setAgent] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
  });

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch agent details
        const agentPayload = await getAgentById(id);
        const agentDoc = agentPayload?.data || agentPayload;

        if (!agentDoc?._id && !agentDoc?.id) {
          setNotification("Agent not found");
          setTimeout(() => {
            router.push("/agents");
          }, 2000);
          return;
        }

        setAgent(agentDoc);

      } catch (err) {
        console.error("getAgentById", err);
        setNotification("Failed to load agent");
        setTimeout(() => {
          router.push("/agents");
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
      
      if (agent?.status === 0) {
        await unblockAgent(id);
        setNotification('Agent unblocked successfully!');
      } else {
        await blockAgent(id);
        setNotification('Agent blocked successfully!');
      }
      
      // Refresh data
      const agentPayload = await getAgentById(id);
      const agentDoc = agentPayload?.data || agentPayload;
      setAgent(agentDoc);
    } catch (err) {
      console.error('block/unblock failed', err);
      setNotification(err?.response?.data?.message || 'Operation failed');
    } finally {
      setBlocking(false);
    }
  };

  const handleOpenEdit = () => {
    setFormData({
      name: agent.name || agent.fullName || '',
      email: agent.email || '',
      mobile: agent.mobile || '',
      password: '',
    });
    setShowEditModal(true);
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

      await updateAgent(id, payload);
      setNotification('Agent updated successfully!');
      setShowEditModal(false);
      
      // Refresh data
      const agentPayload = await getAgentById(id);
      const agentDoc = agentPayload?.data || agentPayload;
      setAgent(agentDoc);
    } catch (err) {
      console.error('updateAgent', err);
      setNotification(err?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
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

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showEditModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showEditModal]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">Loading agent details...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-zinc-600 dark:text-zinc-400">Agent not found</div>
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
              Agent Details - {agent.name || agent.fullName || agent.email || 'N/A'}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              View and manage agent information
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBlock}
            disabled={blocking}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              agent.status === 0
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {blocking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : agent.status === 0 ? (
              <Shield className="h-4 w-4" />
            ) : (
              <ShieldOff className="h-4 w-4" />
            )}
            {blocking ? 'Processing…' : agent.status === 0 ? 'Unblock Agent' : 'Block Agent'}
          </button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Basic Information</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              agent.status === 0 
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            }`}>
              {agent.status === 0 ? 'BLOCKED' : 'ACTIVE'}
            </span>
          </div>
          <button
            onClick={handleOpenEdit}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold shadow-sm hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 hover:shadow-md"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
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
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">{agent.name || agent.fullName || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Email</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">{agent.email || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Mobile</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">{agent.mobile || '-'}</p>
              </div>
            </div>
          </div>

          {/* Address */}
          {agent.address && (
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-20 pt-0.5">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Address:</span>
              </div>
              <div className="flex-1">
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {agent.address}
                </p>
              </div>
            </div>
          )}

          {/* Account Details */}
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-20 pt-0.5">
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Account:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Created At</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : '-'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Last Updated</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {agent.updatedAt ? new Date(agent.updatedAt).toLocaleDateString() : '-'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Created By</label>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  {agent.createdBy ? (typeof agent.createdBy === 'object' ? agent.createdBy.name : 'System') : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={handleConfirmBlock}
        title={agent?.status === 0 ? 'Unblock Agent' : 'Block Agent'}
        message={`Are you sure you want to ${agent?.status === 0 ? 'unblock' : 'block'} this agent?`}
        confirmText={agent?.status === 0 ? 'Unblock' : 'Block'}
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
                Edit Agent
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
                  placeholder="Enter email address"
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
                  placeholder="Enter mobile number"
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-500"
                  disabled={saving}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Password <span className="text-xs text-zinc-500">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleEditChange}
                  placeholder="Enter new password"
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-500"
                  disabled={saving}
                />
              </div>

              <div className="flex gap-3 pt-4">
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
    </div>
  );
};

export default AgentViewPage;