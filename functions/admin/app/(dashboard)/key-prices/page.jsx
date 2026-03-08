'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getKeyPrices, deleteKeyPrice } from '@/src/features/keyPrices/api';
import { Plus, Edit, Trash2, IndianRupee, Loader2 } from 'lucide-react';
import ConfirmationModal from '@/src/components/ui/ConfirmationModal';
import Pagination from '@/src/components/ui/Pagination';
import RefreshButton from '@/src/components/ui/RefreshButton';

export default function KeyPricesPage() {
  // Key Prices Management Page
  const router = useRouter();
  const [keyPrices, setKeyPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState({ isOpen: false, id: null });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchKeyPrices = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      const data = await getKeyPrices(params.toString());
      
      if (data.pagination) {
        setPagination(data.pagination);
        setKeyPrices(data.data || []);
      } else {
        const list = Array.isArray(data) ? data : data.data || [];
        setKeyPrices(list);
      }
    } catch (err) {
      console.error('fetchKeyPrices', err);
      setKeyPrices([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchKeyPrices();
  }, [fetchKeyPrices]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleDelete = (id) => {
    setShowDeleteModal({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    const { id } = showDeleteModal;
    try {
      setDeletingId(id);
      setShowDeleteModal({ isOpen: false, id: null });
      await deleteKeyPrice(id);
      await fetchKeyPrices();
    } catch (err) {
      console.error('deleteKeyPrice', err);
      alert(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Key Prices</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage key package pricing</p>
        </div>
        <div className="flex items-center gap-3">
          <RefreshButton onRefresh={fetchKeyPrices} disabled={loading} />
          <Link
            href="/key-prices/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Plus className="h-4 w-4" />
            Create Key Price
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            <p className="text-sm text-zinc-500">Loading key prices…</p>
          </div>
        </div>
      ) : keyPrices.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <IndianRupee className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400 mb-2">No key prices found</p>
          <p className="text-sm text-zinc-500 mb-4">Create your first key price package</p>
          <Link
            href="/key-prices/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Key Price
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 overflow-hidden dark:border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 uppercase tracking-wider dark:text-zinc-300">
                  Package Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 uppercase tracking-wider dark:text-zinc-300">
                  Keys
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 uppercase tracking-wider dark:text-zinc-300">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 uppercase tracking-wider dark:text-zinc-300">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 uppercase tracking-wider dark:text-zinc-300">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 uppercase tracking-wider dark:text-zinc-300">
                  Edit
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 uppercase tracking-wider dark:text-zinc-300">
                  Delete
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-zinc-200 dark:bg-zinc-900 dark:divide-zinc-800">
              {keyPrices.map((price) => (
                <tr
                  key={price._id || price.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-zinc-900 dark:text-white">
                      {price.packageName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      {price.keys} keys
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{price.price}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {price.isActive ? (
                      <span className="px-2 py-1 text-xs font-semibold text-emerald-600 bg-emerald-100 rounded-full dark:bg-emerald-900/40 dark:text-emerald-300">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold text-red-600 bg-red-100 rounded-full dark:bg-red-900/40 dark:text-red-300">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs truncate">
                      {price.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/key-prices/edit/${price._id || price.id}`}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium shadow-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:shadow-md whitespace-nowrap min-w-[100px]"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(price._id || price.id)}
                      disabled={deletingId === (price._id || price.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium shadow-sm hover:from-red-700 hover:to-red-800 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[100px]"
                    >
                      {deletingId === (price._id || price.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && keyPrices.length > 0 && (
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
        title="Delete Key Price"
        message="Are you sure you want to delete this key price? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deletingId === showDeleteModal.id}
      />
    </div>
  );
}

