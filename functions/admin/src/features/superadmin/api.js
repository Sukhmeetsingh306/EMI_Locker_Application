// src/features/superadmin/api.js
import apiClient from '@/src/lib/api-client';

// Get all cash deposits (superadmin only)
export const getAllCashDeposits = async (queryParams = '') => {
  const url = queryParams ? `/admins/cash-deposits/all?${queryParams}` : '/admins/cash-deposits/all';
  const res = await apiClient.get(url);
  // Backend returns: { success: true, data: [...], pagination: {...} }
  if (res.data?.success) {
    return res.data;
  }
  // Fallback for different response formats
  return { success: false, data: [], message: 'Failed to fetch cash deposits' };
};

// Approve cash deposit
export const approveCashDeposit = async (depositId) => {
  const res = await apiClient.post(`/admins/cash-deposits/${depositId}/approve`);
  return res.data?.data || res.data;
};

// Reject cash deposit
export const rejectCashDeposit = async (depositId, notes = '') => {
  const res = await apiClient.post(`/admins/cash-deposits/${depositId}/reject`, { notes });
  return res.data?.data || res.data;
};
