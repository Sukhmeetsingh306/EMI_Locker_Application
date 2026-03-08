// src/features/emis/api.js
import apiClient from '@/src/lib/api-client';

export const getEmis = async (queryParams = '') => {
  const url = queryParams ? `/emis?${queryParams}` : '/emis';
  const res = await apiClient.get(url);
  if (res.data?.pagination) {
    return res.data;
  }
  return res.data?.data || res.data;
};

export const createEmi = async (payload) => {
  // Ensure we're sending proper JSON
  const res = await apiClient.post('/emis', JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return res.data?.data || res.data;
};

export const getEmiById = async (id) => {
  const res = await apiClient.get(`/emis/${id}`);
  return res.data?.data || res.data;
};

export const getEmiPayments = async (emiId) => {
  const res = await apiClient.get(`/emis/${emiId}/payments`);
  return res.data?.data || res.data;
};

