// src/features/auth/authApi.js
import apiClient from '@/src/lib/api-client';

// Admin/Superadmin login
export const adminLoginApi = async ({ emailOrMobile, password }) => {
  const res = await apiClient.post('/auth/admin/login', { emailOrMobile, password });
  // Normalize: backend may return { data: { user, accessToken } } or { user, accessToken }
  return res.data?.data || res.data;
};

// Client/User login (for reference, not used in admin panel)
export const loginApi = async ({ emailOrMobile, password }) => {
  const res = await apiClient.post('/auth/login', { emailOrMobile, password });
  // Normalize: backend may return { data: { user, accessToken } } or { user, accessToken }
  return res.data?.data || res.data;
};
