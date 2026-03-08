// 'use client';

// import AdminShell from '@/src/features/layout/components/AdminShell';
// import { useAuthGuard } from '@/src/hooks/useAuthGuard';

// const DashboardLayout = ({ children }) => {
//   const { hydrated, token } = useAuthGuard(true);

//   if (!hydrated) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-black text-white">
//         <p className="text-sm uppercase tracking-[0.4em] text-zinc-400">Hydrating session…</p>
//       </div>
//     );
//   }

//   if (!token) {
//     return null;
//   }

//   return <AdminShell>{children}</AdminShell>;
// };

// export default DashboardLayout;




//////////////////////////////////





// app/(dashboard)/layout.jsx
'use client';

import AdminShell from '@/src/layout/AdminShell';
import { useAuthGuard } from '@/src/hooks/useAuthGuard';

const DashboardLayout = ({ children }) => {
  const { hydrated, token } = useAuthGuard(true);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-sm uppercase tracking-[0.4em] text-zinc-400">Hydrating session…</p>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return <AdminShell>{children}</AdminShell>;
};

export default DashboardLayout;
