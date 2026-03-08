import apiClient from '@/src/lib/api-client';

export const getKeyPrices = async (queryParams = '') => {
  const url = queryParams ? `/key-prices?${queryParams}` : '/key-prices';
  const res = await apiClient.get(url);
  if (res.data?.pagination) {
    return res.data;
  }
  return res.data?.data || res.data;
};

export const getKeyPriceById = async (id) => {
  const res = await apiClient.get(`/key-prices/${id}`);
  return res.data?.data || res.data;
};

export const createKeyPrice = async (payload) => {
  const res = await apiClient.post('/key-prices', payload);
  return res.data?.data || res.data;
};

export const updateKeyPrice = async (id, payload) => {
  const res = await apiClient.put(`/key-prices/${id}`, payload);
  return res.data?.data || res.data;
};

export const deleteKeyPrice = async (id) => {
  const res = await apiClient.delete(`/key-prices/${id}`);
  return res.data?.data || res.data;
};

