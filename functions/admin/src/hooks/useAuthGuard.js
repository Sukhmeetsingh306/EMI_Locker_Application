// 'use client';

// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { hydrateAuth } from '@/src/features/auth/authSlice';
// import { selectAuthState } from '@/src/features/auth/selectors';
// import { useAppDispatch, useAppSelector } from '@/src/hooks/useAppStore';

// export const useAuthGuard = (shouldRedirect = true) => {
//   const router = useRouter();
//   const dispatch = useAppDispatch();
//   const { token, hydrated } = useAppSelector(selectAuthState);

//   useEffect(() => {
//     dispatch(hydrateAuth());
//   }, [dispatch]);

//   useEffect(() => {
//     if (!shouldRedirect) return;
//     if (hydrated && !token) {
//       router.replace('/login');
//     }
//   }, [token, hydrated, router, shouldRedirect]);

//   return { token, hydrated };
// };



//////////////////////////////////


// src/hooks/useAuthGuard.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from './useAppStore';
import { hydrateAuth } from '@/src/features/auth/authSlice';
import { selectAuthState } from '@/src/features/auth/selectors';

export const useAuthGuard = (redirectIfUnauthed = false) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { hydrated, token } = useAppSelector(selectAuthState);

  useEffect(() => {
    if (!hydrated) {
      dispatch(hydrateAuth());
    }
  }, [hydrated, dispatch]);

  useEffect(() => {
    if (redirectIfUnauthed && hydrated && !token) {
      router.replace('/login');
    }
  }, [redirectIfUnauthed, hydrated, token, router]);

  return { hydrated, token };
};
