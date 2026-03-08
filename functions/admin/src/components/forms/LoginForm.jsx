// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { Loader2 } from 'lucide-react';
// import { loginAdmin, hydrateAuth } from '@/src/features/auth/authSlice';
// import { selectAuthState } from '@/src/features/auth/selectors';
// import { useAppDispatch, useAppSelector } from '@/src/hooks/useAppStore';

// const LoginForm = () => {
//   const router = useRouter();
//   const dispatch = useAppDispatch();
//   const { status, error, token, hydrated } = useAppSelector(selectAuthState);
//   const [formState, setFormState] = useState({
//     emailOrMobile: '',
//     password: '',
//   });

//   useEffect(() => {
//     dispatch(hydrateAuth());
//   }, [dispatch]);

//   useEffect(() => {
//     if (hydrated && token) {
//       router.replace('/dashboard');
//     }
//   }, [hydrated, token, router]);

//   const handleChange = (event) => {
//     const { name, value } = event.target;
//     setFormState((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     await dispatch(loginAdmin(formState));
//   };

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="space-y-5 rounded-3xl border border-zinc-100 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
//     >
//       <div>
//         <label className="text-sm text-zinc-500" htmlFor="email">
//           Email
//         </label>
//         <input
//           id="email"
//           name="emailOrMobile"
//           type="email"
//           required
//           value={formState.email}
//           onChange={handleChange}
//           className="mt-1 w-full rounded-2xl border border-zinc-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700"
//           placeholder="admin@emilocker.com"
//         />
//       </div>
//       <div>
//         <label className="text-sm text-zinc-500" htmlFor="password">
//           Password
//         </label>
//         <input
//           id="password"
//           name="password"
//           type="password"
//           required
//           value={formState.password}
//           onChange={handleChange}
//           className="mt-1 w-full rounded-2xl border border-zinc-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700"
//           placeholder="********"
//         />
//       </div>
//       {error && (
//         <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
//           {error}
//         </p>
//       )}
//       <button
//         type="submit"
//         disabled={status === 'loading'}
//         className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
//       >
//         {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
//         Sign in
//       </button>
//       <p className="text-center text-xs text-zinc-500">
//         Use the seeded admin credentials to access the dashboard.
//       </p>
//     </form>
//   );
// };

// export default LoginForm;



//////////////////////////////////



// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { Loader2 } from 'lucide-react';
// import { loginAdmin, hydrateAuth } from '@/src/features/auth/authSlice';
// import { selectAuthState } from '@/src/features/auth/selectors';
// import { useAppDispatch, useAppSelector } from '@/src/hooks/useAppStore';

// const LoginForm = () => {
//   const router = useRouter();
//   const dispatch = useAppDispatch();
//   const { status, error, token, hydrated } = useAppSelector(selectAuthState);

//   const [formState, setFormState] = useState({
//     emailOrMobile: '',
//     password: '',
//   });

//   useEffect(() => {
//     dispatch(hydrateAuth());
//   }, [dispatch]);

//   useEffect(() => {
//     if (hydrated && token) {
//       router.replace('/dashboard');
//     }
//   }, [hydrated, token, router]);

//   const handleChange = (event) => {
//     const { name, value } = event.target;
//     setFormState((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     await dispatch(loginAdmin(formState));
//   };

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="space-y-5 rounded-3xl border border-zinc-100 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
//     >
//       <div>
//         <label className="text-sm text-zinc-500" htmlFor="emailOrMobile">
//           Email or Mobile
//         </label>
//         <input
//           id="emailOrMobile"
//           name="emailOrMobile"
//           type="text"
//           required
//           value={formState.emailOrMobile}
//           onChange={handleChange}
//           className="mt-1 w-full rounded-2xl border border-zinc-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700"
//           placeholder="admin@gmail.com or 9999999999"
//         />
//       </div>
//       <div>
//         <label className="text-sm text-zinc-500" htmlFor="password">
//           Password
//         </label>
//         <input
//           id="password"
//           name="password"
//           type="password"
//           required
//           value={formState.password}
//           onChange={handleChange}
//           className="mt-1 w-full rounded-2xl border border-zinc-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700"
//           placeholder="********"
//         />
//       </div>
//       {error && (
//         <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
//           {error}
//         </p>
//       )}
//       <button
//         type="submit"
//         disabled={status === 'loading'}
//         className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
//       >
//         {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
//         Sign in
//       </button>
//       <p className="text-center text-xs text-zinc-500">
//         Admins and superadmins log in here. Clients use the mobile app.
//       </p>
//     </form>
//   );
// };

// export default LoginForm;



////////////////////////////////



// src/components/forms/LoginForm.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/src/hooks/useAppStore';
import { loginAdmin, hydrateAuth } from '@/src/features/auth/authSlice';
import { selectAuthState } from '@/src/features/auth/selectors';

const LoginForm = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { status, error, token, hydrated } = useAppSelector(selectAuthState);
  const [form, setForm] = useState({ emailOrMobile: '', password: '' });

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  useEffect(() => {
    if (hydrated && token) {
      router.replace('/dashboard');
    }
  }, [hydrated, token, router]);

  const handleChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    await dispatch(loginAdmin(form));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-zinc-100 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <label className="text-sm text-zinc-500" htmlFor="emailOrMobile">Email or Mobile</label>
        <input id="emailOrMobile" name="emailOrMobile" type="text" required value={form.emailOrMobile} onChange={handleChange}
          className="mt-1 w-full rounded-2xl border border-zinc-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700"
          placeholder="admin@gmail.com or 9999999999" />
      </div>

      <div>
        <label className="text-sm text-zinc-500" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required value={form.password} onChange={handleChange}
          className="mt-1 w-full rounded-2xl border border-zinc-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700" placeholder="********" />
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{error}</p>}

      <button type="submit" disabled={status === 'loading'} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-3 text-sm font-semibold text-white">
        {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
      </button>

      <p className="text-center text-xs text-zinc-500">Admins and superadmins log in here. Clients use the mobile app.</p>
    </form>
  );
};

export default LoginForm;
