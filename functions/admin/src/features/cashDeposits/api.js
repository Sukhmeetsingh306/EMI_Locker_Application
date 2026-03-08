// src/features/cashDeposits/api.js
import apiClient from '@/src/lib/api-client';

// Get all cash deposits (super admin)
export const getAllCashDeposits = async (params = '') => {
  try {
    const res = await apiClient.get(`/admins/cash-deposits/all?${params}`);
    
    if (res.data?.success) {
      return res.data;
    }
    
    throw new Error(res.data?.message || 'Failed to fetch cash deposits');
  } catch (error) {
    console.error('getAllCashDeposits error:', error);
    throw error;
  }
};

// Approve cash deposit
export const approveCashDeposit = async (depositId) => {
  try {
    const res = await apiClient.post(`/admins/cash-deposits/${depositId}/approve`);
    
    // Check if the response indicates success
    if (res.data?.success || res.status === 200) {
      return res.data?.data || res.data;
    }
    
    throw new Error(res.data?.message || 'Failed to approve cash deposit');
  } catch (error) {
    console.error('approveCashDeposit error:', error);
    throw error;
  }
};

// Reject cash deposit
export const rejectCashDeposit = async (depositId, notes = '') => {
  try {
    const res = await apiClient.post(`/admins/cash-deposits/${depositId}/reject`, { notes });
    
    // Check if the response indicates success
    if (res.data?.success || res.status === 200) {
      return res.data?.data || res.data;
    }
    
    throw new Error(res.data?.message || 'Failed to reject cash deposit');
  } catch (error) {
    console.error('rejectCashDeposit error:', error);
    throw error;
  }
};
