// src/features/keyPackages/api.js
// cURL commands for all endpoints:
//
// 1. getMyPackages - Get admin's own packages
// curl -X GET "http://localhost:8800/api/key-packages/my-packages?page=1&limit=10" \
//   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
//   -H "Content-Type: application/json"
//
// 2. getAllPackages - Get all packages (superadmin only)
// curl -X GET "http://localhost:8800/api/key-packages?page=1&limit=10" \
//   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
//   -H "Content-Type: application/json"
//
// 3. getPackageById - Get package by ID
// curl -X GET "http://localhost:8800/api/key-packages/PACKAGE_ID_HERE" \
//   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
//   -H "Content-Type: application/json"
//
// 4. getPackageConfigs - Get package configurations
// curl -X GET "http://localhost:8800/api/key-packages/configs" \
//   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
//   -H "Content-Type: application/json"
//
// 5. createPackageOrder - Create Razorpay order for package purchase
// curl -X POST "http://localhost:8800/api/razorpay/package/order" \
//   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
//   -H "Content-Type: application/json" \
//   -d '{"packageType": "basic"}' 
//
// 6. verifyPackagePayment - Verify package payment
// curl -X POST "http://localhost:8800/api/razorpay/package/verify" \
//   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
//   -H "Content-Type: application/json" \
//   -d '{"packageId": "PACKAGE_ID_HERE", "razorpay_order_id": "order_id", "razorpay_payment_id": "payment_id", "razorpay_signature": "signature"}'

import apiClient from '@/src/lib/api-client';

export const getMyPackages = async (queryParams = '') => {
  const url = queryParams ? `/key-packages/my-packages?${queryParams}` : '/key-packages/my-packages';
  const res = await apiClient.get(url);
  if (res.data?.pagination) {
    return res.data;
  }
  return res.data?.data || res.data;
};

export const getAllPackages = async (queryParams = '') => {
  const url = queryParams ? `/key-packages?${queryParams}` : '/key-packages';
  const res = await apiClient.get(url);
  if (res.data?.pagination) {
    return res.data;
  }
  return res.data?.data || res.data;
};

export const getPackageById = async (id) => {
  const res = await apiClient.get(`/key-packages/${id}`);
  return res.data?.data || res.data;
};

export const getPackageConfigs = async () => {
  const res = await apiClient.get('/key-packages/configs');
  return res.data?.data || res.data;
};

export const createPackageOrder = async (packageType) => {
  const res = await apiClient.post('/razorpay/package/order', { packageType });
  return res.data?.data || res.data;
};

export const verifyPackagePayment = async (packageId, paymentData) => {
  const res = await apiClient.post('/razorpay/package/verify', {
    packageId,
    ...paymentData
  });
  return res.data?.data || res.data;
};

