// src/features/device-lock/api.js
import apiClient from "@/src/lib/api-client";

export const getLockRequests = async () => {
  const res = await apiClient.get("/device-lock");
  return res.data?.data || res.data;
};

export const getUserLockStatus = async (userId) => {
  const res = await apiClient.get(`/device-lock/${userId}`);
  return res.data?.data || res.data;
};

/**
 * Lock User Device (Flutter API)
 * POST /api/device-lock/devices/:userId/lock
 */
export const adminLockUser = async (userId, lockData = {}) => {
  const res = await apiClient.post(`/device-lock/devices/${userId}/lock`, lockData);
  return res.data?.data || res.data;
};

/**
 * Unlock User Device (Flutter API)
 * POST /api/device-lock/devices/:userId/unlock
 */
export const adminUnlockUser = async (userId, reason = 'Payment received') => {
  const res = await apiClient.post(`/device-lock/devices/${userId}/unlock`, { reason });
  return res.data?.data || res.data;
};

export const getUsersWithOverdueEmis = async (queryParams = '') => {
  const url = queryParams ? `/device-lock/overdue-users?${queryParams}` : '/device-lock/overdue-users';
  const res = await apiClient.get(url);
  if (res.data?.pagination) {
    return res.data;
  }
  return res.data?.data || res.data;
};