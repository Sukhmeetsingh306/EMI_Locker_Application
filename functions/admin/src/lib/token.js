// src/lib/token.js
const STORAGE_KEY = 'emilocker_admin_auth';

export const saveAuthData = (data) => {
  if (typeof window === 'undefined') return;
  const payload = {
    token: data.token || data.accessToken,
    user: data.user || null,
    role: data.role || null,
    type: data.type || null,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const loadAuthData = () => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const clearAuthData = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export const updateAccessToken = (newToken) => {
  if (typeof window === 'undefined') return;
  const auth = loadAuthData();
  if (!auth) return;
  auth.token = newToken;
  saveAuthData(auth);
};
