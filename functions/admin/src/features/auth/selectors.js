// export const selectAuthState = (state) => state.auth;
// export const selectAdmin = (state) => state.auth.admin;
// export const selectToken = (state) => state.auth.token;
// export const selectAuthStatus = (state) => state.auth.status;



//////////////////////////////////


// src/features/auth/selectors.js
export const selectAuthState = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectRole = (state) => state.auth.role;
export const selectHydrated = (state) => state.auth.hydrated;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
