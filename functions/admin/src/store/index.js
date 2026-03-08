// 'use client';

// import { configureStore } from '@reduxjs/toolkit';
// import authReducer from '@/src/features/auth/authSlice';

// export const store = configureStore({
//   reducer: {
//     auth: authReducer,
//   },
//   devTools: process.env.NODE_ENV !== 'production',
// });

// export const AppDispatch = store.dispatch;



///////////////////////////////////



// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/src/features/auth/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});
