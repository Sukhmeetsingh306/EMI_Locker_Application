// src/features/agents/api.js
import apiClient from '@/src/lib/api-client';

export const getAgents = async (queryParams = '') => {
  const url = queryParams ? `/agents?${queryParams}` : '/agents';
  const res = await apiClient.get(url);
  // Backend now returns: { data: [...], pagination: {...} }
  if (res.data?.pagination) {
    return res.data;
  }
  // Fallback for old format
  return res.data?.data || res.data;
};

export const createAgent = async (payload) => {
  const res = await apiClient.post('/agents', payload);
  return res.data?.data || res.data;
};

export const getAgentById = async (id) => {
  const res = await apiClient.get(`/agents/${id}`);
  return res.data?.data || res.data;
};

export const updateAgent = async (id, payload) => {
  const res = await apiClient.put(`/agents/${id}`, payload);
  return res.data?.data || res.data;
};

export const deleteAgent = async (id) => {
  const res = await apiClient.delete(`/agents/${id}`);
  return res.data?.data || res.data;
};

export const blockAgent = async (id) => {
  const res = await apiClient.post(`/agents/${id}/block`);
  return res.data?.data || res.data;
};

export const unblockAgent = async (id) => {
  const res = await apiClient.post(`/agents/${id}/unblock`);
  return res.data?.data || res.data;
};

// Get agent cash deposits
export const getAgentCashDeposits = async (queryParams = '') => {
  const url = queryParams ? `/agents/cash-deposits?${queryParams}` : '/agents/cash-deposits';
  const res = await apiClient.get(url);
  // Backend returns: { success: true, data: [...], pagination: {...} }
  if (res.data?.success) {
    return res.data;
  }
  // Fallback for different response formats
  return { success: false, data: [], message: 'Failed to fetch cash deposits' };
};

// Request cash deposit
export const requestCashDeposit = async (payload) => {
  const res = await apiClient.post('/agents/cash-deposit/request', payload);
  return res.data?.data || res.data;
};

