// 'use client';

// import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
// import { loginRequest, profileRequest } from './authApi';

// const STORAGE_KEY = 'emilocker_admin_auth';

// const readPersistedAuth = () => {
//   if (typeof window === 'undefined') return null;
//   try {
//     const raw = window.localStorage.getItem(STORAGE_KEY);
//     return raw ? JSON.parse(raw) : null;
//   } catch (error) {
//     window.localStorage.removeItem(STORAGE_KEY);
//     return null;
//   }
// };

// const writePersistedAuth = (payload) => {
//   if (typeof window === 'undefined') return;
//   if (!payload) {
//     window.localStorage.removeItem(STORAGE_KEY);
//     return;
//   }
//   window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
// };

// export const loginAdmin = createAsyncThunk(
//   'auth/login',
//   async (credentials, { rejectWithValue }) => {
//     try {
//       const { data } = await loginRequest(credentials);
//       if (data?.data?.role !== 'admin') {
//         return rejectWithValue('User is not authorized as admin');
//       }
//       return data;
//     } catch (error) {
//       const message =
//         error.response?.data?.message || error.message || 'Unable to login';
//       return rejectWithValue(message);
//     }
//   }
// );

// export const fetchAdminProfile = createAsyncThunk(
//   'auth/fetchProfile',
//   async (_, { rejectWithValue }) => {
//     try {
//       const { data } = await profileRequest();
//       if (data?.data?.role !== 'admin') {
//         return rejectWithValue('User is not authorized as admin');
//       }
//       return data.data;
//     } catch (error) {
//       const message =
//         error.response?.data?.message || error.message || 'Unable to fetch profile';
//       return rejectWithValue(message);
//     }
//   }
// );

// const initialState = {
//   admin: null,
//   token: null,
//   status: 'idle',
//   error: null,
//   hydrated: false,
// };

// const authSlice = createSlice({
//   name: 'auth',
//   initialState,
//   reducers: {
//     hydrateAuth(state) {
//       if (state.hydrated) return;
//       const persisted = readPersistedAuth();
//       if (persisted) {
//         state.admin = persisted.admin;
//         state.token = persisted.token;
//       }
//       state.hydrated = true;
//     },
//     logout(state) {
//       state.admin = null;
//       state.token = null;
//       state.status = 'idle';
//       state.error = null;
//       writePersistedAuth(null);
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(loginAdmin.pending, (state) => {
//         state.status = 'loading';
//         state.error = null;
//       })
//       .addCase(loginAdmin.fulfilled, (state, action) => {
//         state.status = 'succeeded';
//         state.admin = action.payload.data;
//         state.token = action.payload.token;
//         state.error = null;
//         writePersistedAuth({
//           admin: action.payload.data,
//           token: action.payload.token,
//         });
//       })
//       .addCase(loginAdmin.rejected, (state, action) => {
//         state.status = 'failed';
//         state.error = action.payload || 'Login failed';
//       })
//       .addCase(fetchAdminProfile.pending, (state) => {
//         state.status = 'loading';
//         state.error = null;
//       })
//       .addCase(fetchAdminProfile.fulfilled, (state, action) => {
//         state.status = 'succeeded';
//         state.admin = action.payload;
//         state.error = null;
//         writePersistedAuth({
//           admin: action.payload,
//           token: state.token,
//         });
//       })
//       .addCase(fetchAdminProfile.rejected, (state, action) => {
//         state.status = 'failed';
//         state.error = action.payload || 'Unable to load profile';
//         state.admin = null;
//         state.token = null;
//         writePersistedAuth(null);
//       });
//   },
// });

// export const { hydrateAuth, logout } = authSlice.actions;
// export default authSlice.reducer;



/////////////////////////////////////



// src/features/auth/authSlice.js
'use client';

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { adminLoginApi } from './authApi';
import { loadAuthData, saveAuthData, clearAuthData } from '@/src/lib/token';

// hydrate from localStorage
export const hydrateAuth = createAsyncThunk('auth/hydrate', async () => {
  const stored = loadAuthData();
  return stored;
});

export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async ({ emailOrMobile, password }, { rejectWithValue }) => {
    try {
      const data = await adminLoginApi({ emailOrMobile, password });
      // backend returns { user, accessToken or token, role, type }
      const token = data.accessToken || data.token;
      const payload = {
        user: data.user,
        token,
        role: data.role,
        type: data.type,
      };
      saveAuthData(payload);
      return payload;
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Login failed';
      return rejectWithValue(msg);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    role: null,
    type: null,
    hydrated: false,
    status: 'idle',
    error: null,
  },
  reducers: {
    logout(state) {
      clearAuthData();
      state.user = null;
      state.token = null;
      state.role = null;
      state.type = null;
      state.hydrated = true;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        const stored = action.payload;
        if (stored) {
          state.user = stored.user;
          state.token = stored.token;
          state.role = stored.role;
          state.type = stored.type;
        }
        state.hydrated = true;
      })
      .addCase(loginAdmin.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.type = action.payload.type;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed';
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
