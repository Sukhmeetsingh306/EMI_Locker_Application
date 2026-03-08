// 'use client';

// import LoginForm from '@/src/components/forms/LoginForm';

// const LoginPage = () => {
//   return (
//     <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-emerald-50 px-4 py-10 dark:from-black dark:via-zinc-900 dark:to-emerald-950">
//       <div className="grid w-full max-w-5xl grid-cols-1 gap-10 rounded-[40px] border border-white/60 bg-white/70 p-10 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80 lg:grid-cols-2">
//         <div className="space-y-4">
//           <p className="text-sm uppercase tracking-[0.4em] text-emerald-500">
//             Emilocker Control
//           </p>
//           <h1 className="text-4xl font-semibold text-zinc-900 dark:text-white">
//             Secure Admin Access
//           </h1>
//           <p className="text-sm text-zinc-500">
//             Manage encryption workflows, audit user vaults, and keep Emilocker guarded.
//           </p>
//           <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
//             <p className="font-semibold">Important</p>
//             <p>
//               Only seeded admin credentials are authorized. Rotate them frequently and keep the
//               backend `.env` secure.
//             </p>
//           </div>
//         </div>

//         <LoginForm />
//       </div>
//     </div>
//   );
// };

// export default LoginPage;




//////////////////////////////////



// app/(auth)/login/page.jsx
'use client';

import LoginForm from '@/src/components/forms/LoginForm';

const LoginPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-emerald-50 px-4 py-10 dark:from-black dark:via-zinc-900 dark:to-emerald-950">
      <div className="grid w-full max-w-5xl grid-cols-1 gap-10 rounded-[40px] border border-white/60 bg-white/70 p-10 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80 lg:grid-cols-2">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.4em] text-emerald-500">EmiLocker Control</p>
          <h1 className="text-4xl font-semibold text-zinc-900 dark:text-white">Secure Admin Access</h1>
          <p className="text-sm text-zinc-500">Manage EMI users, monitor unpaid installments and control device lock states from a single dashboard.</p>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
            <p className="font-semibold">Important</p>
            <p>Only authorized admins and superadmins should log in. The mobile app is for client users only.</p>
          </div>
        </div>

        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
