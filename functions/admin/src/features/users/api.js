// src/features/users/api.js
import apiClient from '@/src/lib/api-client';

export const getUsers = async (queryParams = '', signal = null) => {
  const url = queryParams ? `/users?${queryParams}` : '/users';
  const config = signal ? { signal } : {};
  const res = await apiClient.get(url, config);
  // Backend now returns: { data: [...], pagination: {...} }
  if (res.data?.pagination) {
    return res.data;
  }
  // Fallback for old format
  return res.data?.data || res.data;
};

export const createUser = async (payload) => {
  const res = await apiClient.post('/users', payload);
  // Backend returns: { success: true, message: "...", data: user }
  // So we need to access res.data.data
  if (res.data?.data) {
    return res.data.data;
  }
  // Fallback for different response structures
  return res.data;
};

export const getUserById = async (id) => {
  const res = await apiClient.get(`/users/${id}`);
  return res.data?.data || res.data;
};

export const deleteUser = async (id) => {
  const res = await apiClient.delete(`/users/${id}`);
  return res.data?.data || res.data;
};

export const renewKey = async (id) => {
  const res = await apiClient.post(`/users/${id}/renew-key`);
  return res.data?.data || res.data;
};