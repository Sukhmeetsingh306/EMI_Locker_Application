// src/features/payments/api.js
import apiClient from '@/src/lib/api-client';

export const getAllPackagePaymentTransactions = async (params = '') => {
  // Get all package payment transactions (for superadmin)
  const res = await apiClient.get(`/payment-transactions?${params}`);
  return res.data?.data || res.data;
};

export const markPaymentPaid = async (paymentId, payload = {}) => {
  // Admin marking payment as paid
  const res = await apiClient.post(`/emis/${paymentId}/pay`, payload);
  return res.data?.data || res.data;
};

/**
 * Extend Payment (Flutter API)
 * POST /api/device-lock/devices/:userId/extend-payment
 */
export const extendPayment = async (userId, { days, reason }) => {
  const res = await apiClient.post(`/device-lock/devices/${userId}/extend-payment`, { days, reason });
  return res.data?.data || res.data;
};
