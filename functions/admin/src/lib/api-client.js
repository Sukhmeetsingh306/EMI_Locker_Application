// 'use client';

// import axios from 'axios';

// const apiClient = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8800/api',
//   withCredentials: true,
// });

// apiClient.interceptors.request.use((config) => {
//   if (typeof window !== 'undefined') {
//     const raw = window.localStorage.getItem('emilocker_admin_auth');
//     if (raw) {
//       try {
//         const parsed = JSON.parse(raw);
//         if (parsed?.token) {
//           config.headers.Authorization = `Bearer ${parsed.token}`;
//         }
//       } catch (error) {
//         window.localStorage.removeItem('emilocker_admin_auth');
//       }
//     }
//   }
//   return config;
// });

// export default apiClient;



/////////////////////////////////////////////



// src/lib/api-client.js
'use client';

import axios from 'axios';
import { loadAuthData } from '@/src/lib/token';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3050/api';

const apiClient = axios.create({
  baseURL,
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  const auth = loadAuthData();
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

export default apiClient;
