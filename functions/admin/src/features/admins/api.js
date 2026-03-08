// src/features/admins/api.js
import apiClient from '@/src/lib/api-client';

export const getAdmins = async (queryParams = '') => {
  const url = queryParams ? `/admins?${queryParams}` : '/admins';
  const res = await apiClient.get(url);
  // Backend now returns: { data: [...], pagination: {...} }
  if (res.data?.pagination) {
    return res.data;
  }
  // Fallback for old format
  return res.data?.data || res.data;
};

export const createAdmin = async (payload) => {
  const res = await apiClient.post('/admins', payload);
  return res.data?.data || res.data;
};

export const getAdminById = async (id) => {
  const res = await apiClient.get(`/admins/${id}`);
  return res.data?.data || res.data;
};

export const updateAdmin = async (id, payload) => {
  const res = await apiClient.put(`/admins/${id}`, payload);
  return res.data?.data || res.data;
};

export const deleteAdmin = async (id) => {
  const res = await apiClient.delete(`/admins/${id}`);
  return res.data?.data || res.data;
};

export const blockAdmin = async (id) => {
  const res = await apiClient.post(`/admins/${id}/block`);
  return res.data?.data || res.data;
};

export const unblockAdmin = async (id) => {
  const res = await apiClient.post(`/admins/${id}/unblock`);
  return res.data?.data || res.data;
};

export const getAdminDetailedStats = async (adminId) => {
  const res = await apiClient.get(`/dashboard-stats/admin/${adminId}`);
  return res.data?.data || res.data;
};

// Lightweight dashboard APIs
export const getDashboardSummary = async () => {
  const res = await apiClient.get('/dashboard-stats/summary');
  return res.data?.data || res.data;
};

// Get admin-specific dashboard stats
export const getAdminDashboardStats = async () => {
  const res = await apiClient.get('/dashboard-stats/admin-stats');
  return res.data?.data || res.data;
};

// Get current admin profile
export const getMyProfile = async () => {
  const res = await apiClient.get('/admins/me');
  return res.data?.data || res.data;
};

// Get payments today (pending and today's paid)
export const getPaymentsToday = async (queryParams = '') => {
  const url = queryParams ? `/dashboard-stats/payments-today?${queryParams}` : '/dashboard-stats/payments-today';
  const res = await apiClient.get(url);
  return res.data?.data || res.data;
};

// Payment Verifications APIs
export const getPendingPaymentTransactions = async (queryParams = '') => {
  const url = queryParams ? `/admins/emi-payment-transactions/pending?${queryParams}` : '/admins/emi-payment-transactions/pending';
  const res = await apiClient.get(url);
  return res.data?.data || res.data;
};

export const verifyPaymentTransaction = async (transactionId, notes = null) => {
  const res = await apiClient.post(`/admins/emi-payment-transactions/${transactionId}/verify`, { notes });
  return res.data?.data || res.data;
};

export const rejectPaymentTransaction = async (transactionId, notes = null) => {
  const res = await apiClient.post(`/admins/emi-payment-transactions/${transactionId}/reject`, { notes });
  return res.data?.data || res.data;
};

// Transfer admin to another agent
export const transferAdmin = async (adminId, newAgentId) => {
  const res = await apiClient.post('/admins/transfer', { adminId, newAgentId });
  return res.data?.data || res.data;
};

// Get agents for transfer functionality
export const getAgents = async (queryParams = '') => {
  const url = queryParams ? `/agents?${queryParams}` : '/agents';
  const res = await apiClient.get(url);
  return res.data?.data || res.data;
};

// Get admin cash deposits
export const getCashDeposits = async (queryParams = '') => {
  const url = queryParams ? `/admins/cash-deposits?${queryParams}` : '/admins/cash-deposits';
  const res = await apiClient.get(url);
  // Backend returns: { success: true, data: [...], pagination: {...} }
  if (res.data?.success) {
    return res.data;
  }
  // Fallback for different response formats
  return res.data?.data || res.data;
};