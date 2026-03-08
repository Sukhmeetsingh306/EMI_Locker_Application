// 'use client';

// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import apiClient from '@/src/lib/api-client';

// export default function UsersPage() {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [deleting, setDeleting] = useState(null); // id being deleted

//   const fetchUsers = async () => {
//     try {
//       setLoading(true);
//       const res = await apiClient.get('/users');
//       // backend response assumed: { data: { data: [...] } } or { data: [...] }
//       const payload = res.data?.data || res.data;
//       const list = Array.isArray(payload) ? payload : payload.data || payload;
//       setUsers(list || []);
//     } catch (err) {
//       console.error('fetchUsers error', err);
//       setUsers([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const handleDelete = async (id) => {
//     if (!confirm('Delete this user? This cannot be undone.')) return;
//     try {
//       setDeleting(id);
//       await apiClient.delete(`/users/${id}`);
//       await fetchUsers();
//     } catch (err) {
//       console.error('delete', err);
//       alert(err?.response?.data?.message || 'Delete failed');
//     } finally {
//       setDeleting(null);
//     }
//   };

//   const handleUnlock = async (id) => {
//     if (!confirm('Unlock device for this user?')) return;
//     try {
//       await apiClient.post(`/device-lock/unlock/${id}`);
//       await fetchUsers();
//     } catch (err) {
//       console.error('unlock', err);
//       alert(err?.response?.data?.message || 'Unlock failed');
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-semibold">Users</h1>
//         <Link
//           href="/users/create"
//           className="px-4 py-2 rounded-xl bg-emerald-600 text-white"
//         >
//           + Create user
//         </Link>
//       </div>

//       {loading ? (
//         <div className="rounded-xl border px-6 py-8 text-center">Loading users…</div>
//       ) : users.length === 0 ? (
//         <div className="rounded-xl border px-6 py-8 text-center">No users yet.</div>
//       ) : (
//         <div className="rounded-xl border overflow-x-auto">
//           <table className="min-w-full">
//             <thead className="bg-zinc-900 text-white">
//               <tr>
//                 <th className="p-3 text-left">Name</th>
//                 <th className="p-3 text-left">Aadhar</th>
//                 <th className="p-3 text-left">PAN</th>
//                 <th className="p-3 text-left">Mobile</th>
//                 <th className="p-3 text-left">Email</th>
//                 <th className="p-3 text-left">Device ID</th>
//                 <th className="p-3 text-left">Device Locked</th>
//                 <th className="p-3 text-left">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white dark:bg-zinc-900">
//               {users.map((u) => (
//                 <tr key={u._id} className="border-b last:border-b-0">
//                   <td className="p-3">{u.fullName || u.name || '-'}</td>
//                   <td className="p-3">{u.aadhar || '-'}</td>
//                   <td className="p-3">{u.pan || '-'}</td>
//                   <td className="p-3">{u.mobile}</td>
//                   <td className="p-3">{u.email || '-'}</td>
//                   <td className="p-3">{u.deviceId || '-'}</td>
//                   <td className="p-3">
//                     {u.deviceLocked ? (
//                       <span className="inline-block rounded-full bg-red-600/20 px-3 py-1 text-xs text-red-600">
//                         Locked
//                       </span>
//                     ) : (
//                       <span className="inline-block rounded-full bg-emerald-600/10 px-3 py-1 text-xs text-emerald-600">
//                         Active
//                       </span>
//                     )}
//                   </td>
//                   <td className="p-3 space-x-3">
//                     <Link href={`/users/${u._id}/edit`} className="text-blue-500">
//                       Edit
//                     </Link>
//                     <button
//                       onClick={() => handleDelete(u._id)}
//                       disabled={deleting === u._id}
//                       className="text-red-600"
//                     >
//                       {deleting === u._id ? 'Deleting…' : 'Delete'}
//                     </button>

//                     {u.deviceLocked && (
//                       <button
//                         onClick={() => handleUnlock(u._id)}
//                         className="ml-2 text-emerald-600"
//                       >
//                         Unlock
//                       </button>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }



////////////////////////////////////////////




// app/(dashboard)/users/page.jsx
'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getUsers, deleteUser } from '@/src/features/users/api';
import ConfirmationModal from '@/src/components/ui/ConfirmationModal';
import Pagination from '@/src/components/ui/Pagination';
import FilterBar from '@/src/components/ui/FilterBar';
import RefreshButton from '@/src/components/ui/RefreshButton';
import { useAppSelector, useAppDispatch } from '@/src/hooks/useAppStore';
import { selectRole } from '@/src/features/auth/selectors';
import { hydrateAuth } from '@/src/features/auth/authSlice';

const UsersListPageContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const role = useAppSelector(selectRole);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState({ isOpen: false, id: null });
  const [keyStats, setKeyStats] = useState({ active: 0, expired: 0, noKey: 0, total: 0 });
  
  // Get createdBy from URL query params
  const createdByFromUrl = searchParams ? searchParams.get('createdBy') || '' : '';
  
  // Get admin name for display (if available from URL or we can fetch it)
  const [adminName, setAdminName] = useState('');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  
  // Sorting state
  const [sorting, setSorting] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  
  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    deviceLocked: '',
    hasKey: '',
    keyStatus: '',
    createdFrom: '',
    createdTo: '',
    emiCountOperator: '',
    emiCountValue: '',
    createdBy: createdByFromUrl, // Initialize from URL
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Convert emiCount filter to backend format
      const backendFilters = { ...filters };
      if (backendFilters.emiCountOperator && backendFilters.emiCountValue) {
        if (backendFilters.emiCountOperator === '>=') {
          backendFilters.emiCountMin = backendFilters.emiCountValue;
        } else if (backendFilters.emiCountOperator === '<') {
          backendFilters.emiCountMax = backendFilters.emiCountValue;
        }
        delete backendFilters.emiCountOperator;
        delete backendFilters.emiCountValue;
      }
      
      // Always include createdBy if present (from URL or filters) - preserve across pagination
      const createdBy = createdByFromUrl || backendFilters.createdBy || (searchParams ? searchParams.get('createdBy') : '');
      if (createdBy) {
        backendFilters.createdBy = createdBy;
        // Ensure it's in the URL
        if (typeof window !== 'undefined' && !createdByFromUrl) {
          const url = new URL(window.location.href);
          url.searchParams.set('createdBy', createdBy);
          window.history.replaceState({}, '', url);
        }
      }
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
        ...Object.fromEntries(
          Object.entries(backendFilters).filter(([_, v]) => v !== '' && v !== null)
        ),
      });
      
      const payload = await getUsers(params.toString());
      
      if (payload.pagination) {
        setPagination(payload.pagination);
        setUsers(payload.data || []);
        // Set key stats if available
        if (payload.keyStats) {
          setKeyStats(payload.keyStats);
        }
      } else {
        // Fallback for old API format
        const list = Array.isArray(payload) ? payload : payload.data || [];
        setUsers(list);
      }
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, sorting, createdByFromUrl]);

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleFilterChange = (newFilters) => {
    // Always preserve createdBy filter - never let it be cleared
    const preservedCreatedBy = createdByFromUrl || filters.createdBy;
    if (preservedCreatedBy) {
      newFilters.createdBy = preservedCreatedBy;
    }
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSort = (field) => {
    setSorting((prev) => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDelete = (id) => {
    setShowDeleteModal({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    const { id } = showDeleteModal;
    try {
      setDeletingId(id);
      setShowDeleteModal({ isOpen: false, id: null });
      await deleteUser(id);
      await fetchUsers();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed');
    } finally {
      setDeletingId(null);
    }
  };



  const isKeyExpired = (user) => {
    if (!user.userKey || !user.keyExpiryDate) return false;
    return new Date(user.keyExpiryDate) < new Date();
  };


  const filterOptions = [
    {
      key: 'deviceLocked',
      label: 'Device Status',
      type: 'select',
      options: [
        { value: '', label: 'All' },
        { value: 'true', label: 'Locked' },
        { value: 'false', label: 'Unlocked' },
      ],
    },
    {
      key: 'keyStatus',
      label: 'Key Status',
      type: 'select',
      options: [
        { value: '', label: 'All' },
        { value: 'active', label: 'Active Keys' },
        { value: 'expired', label: 'Expired Keys' },
      ],
    },
    {
      key: 'emiCount',
      label: 'EMI Count',
      type: 'numberRange',
      placeholder: 'Enter count',
    },
    {
      key: 'createdFrom',
      label: 'Created From',
      type: 'date',
    },
    {
      key: 'createdTo',
      label: 'Created To',
      type: 'date',
    },
  ];

  // Update filters when URL changes and preserve createdBy in URL
  useEffect(() => {
    const currentCreatedBy = searchParams ? searchParams.get('createdBy') || '' : '';
    
    if (currentCreatedBy && filters.createdBy !== currentCreatedBy) {
      setFilters(prev => ({ ...prev, createdBy: currentCreatedBy }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }
    
    // Always ensure createdBy persists in URL if it exists
    const preservedCreatedBy = currentCreatedBy || filters.createdBy;
    if (preservedCreatedBy && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('createdBy') !== preservedCreatedBy) {
        url.searchParams.set('createdBy', preservedCreatedBy);
        window.history.replaceState({}, '', url);
      }
    }
  }, [searchParams, filters.createdBy]);

  const handleBackToAdmins = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {(() => {
            const hasCreatedBy = createdByFromUrl || filters.createdBy || (searchParams ? searchParams.get('createdBy') : '');
            return hasCreatedBy ? (
              <button
                onClick={handleBackToAdmins}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition-colors dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Admins
              </button>
            ) : null;
          })()}
          <h1 className="text-2xl font-semibold">
            Users
            {(() => {
              const hasCreatedBy = createdByFromUrl || filters.createdBy || (searchParams ? searchParams.get('createdBy') : '');
              return hasCreatedBy ? (
                <span className="ml-2 text-sm font-normal text-zinc-500">
                  (Filtered by Admin)
                </span>
              ) : null;
            })()}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <RefreshButton onRefresh={fetchUsers} disabled={loading} />
          {role !== 'superadmin' && (
            <Link
              href="/users/create"
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              + Create user
            </Link>
          )}
        </div>
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Search by name, email, or mobile..."
        filterOptions={filterOptions}
      />

      {loading ? (
        <div className="rounded-xl border px-6 py-8 text-center">Loading users…</div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border px-6 py-8 text-center">No users found.</div>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-zinc-900 text-white">
              <tr>
                <th className="p-4 text-left font-semibold">Name</th>
                <th className="p-4 text-left font-semibold">Email</th>
                <th className="p-4 text-left font-semibold">Mobile</th>
                <th className="p-4 text-left font-semibold">Total EMIs</th>
                <th className="p-4 text-left font-semibold">Key Status</th>
                <th className="p-4 text-left font-semibold">Device Status</th>
                <th className="p-4 text-left font-semibold">View Details</th>
                {role !== 'superadmin' && (
                  <th className="p-4 text-left font-semibold">Create EMI</th>
                )}
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-zinc-900">
              {users.map((u) => {
                const keyExpired = isKeyExpired(u);
                
                return (
                <tr key={u._id} className="border-b hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="p-4 font-medium text-zinc-900 dark:text-white">{u.name || u.fullName || '-'}</td>
                  <td className="p-4 text-zinc-700 dark:text-zinc-300">{u.email || '-'}</td>
                  <td className="p-4 text-zinc-700 dark:text-zinc-300">{u.mobile || '-'}</td>
                  <td className="p-4 text-zinc-700 dark:text-zinc-300 font-medium">
                    {u.emiCount !== undefined ? u.emiCount : '-'}
                  </td>
                  <td className="p-4">
                    {!u.userKey ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                        No Key
                      </span>
                    ) : keyExpired ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {u.deviceLocked ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Active
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    <Link
                      href={`/users/${u._id}${createdByFromUrl ? `?createdBy=${createdByFromUrl}` : ''}`}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium shadow-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:shadow-md w-full"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </Link>
                  </td>

                  {role !== 'superadmin' && (
                    <td className="p-4">
                      <Link
                        href={`/emis/create?userId=${u._id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium shadow-sm hover:bg-emerald-700 transition-all duration-200 hover:shadow-md w-full"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        EMI
                      </Link>
                    </td>
                  )}

                </tr>
              )})}
            </tbody>

          </table>
        </div>
      )}

      {!loading && users.length > 0 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
          limit={pagination.limit}
          total={pagination.total}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}

      <ConfirmationModal
        isOpen={showDeleteModal.isOpen}
        onClose={() => setShowDeleteModal({ isOpen: false, id: null })}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deletingId === showDeleteModal.id}
      />

    </div>
  );
};

const UsersListPage = () => {
  return (
    <Suspense fallback={<div className="rounded-xl border px-6 py-8 text-center">Loading users…</div>}>
      <UsersListPageContent />
    </Suspense>
  );
};

export default UsersListPage;
