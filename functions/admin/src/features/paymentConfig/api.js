// src/features/paymentConfig/api.js
import apiClient from '@/src/lib/api-client';

export const getPaymentConfig = async () => {
  const res = await apiClient.get('/payment-config');
  return res.data?.data || res.data;
};

export const updatePaymentConfig = async (payload) => {
  const res = await apiClient.put('/payment-config', payload);
  return res.data?.data || res.data;
};

// Get all admins' payment configs (superadmin only)
export const getAllAdminsPaymentConfig = async () => {
  const res = await apiClient.get('/payment-config/all');
  return res.data?.data || res.data;
};

// Get payment config for a specific admin (superadmin only)
export const getAdminPaymentConfig = async (adminId) => {
  const res = await apiClient.get(`/payment-config/admin/${adminId}`);
  return res.data?.data || res.data;
};

// Update payment config for a specific admin (superadmin only)
export const updateAdminPaymentConfig = async (adminId, payload) => {
  const res = await apiClient.put(`/payment-config/admin/${adminId}`, payload);
  return res.data?.data || res.data;
};

