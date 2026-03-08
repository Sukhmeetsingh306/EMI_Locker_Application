'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getKeyPriceById, updateKeyPrice } from '@/src/features/keyPrices/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function EditKeyPricePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    packageName: '',
    keys: '',
    price: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getKeyPriceById(id);
        const price = data?.data || data;

        if (!price?._id && !price?.id) {
          alert('Key price not found');
          router.push('/key-prices');
          return;
        }

        setFormData({
          packageName: price.packageName || '',
          keys: price.keys || '',
          price: price.price || '',
          description: price.description || '',
          isActive: price.isActive !== undefined ? price.isActive : true,
        });
      } catch (err) {
        console.error('getKeyPriceById', err);
        alert('Failed to load key price');
        router.push('/key-prices');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || '' : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.packageName || !formData.keys || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await updateKeyPrice(id, {
        ...formData,
        keys: parseInt(formData.keys),
        price: parseFloat(formData.price),
      });
      alert('Key price updated successfully!');
      router.push('/key-prices');
    } catch (err) {
      console.error('updateKeyPrice', err);
      alert(err?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <p className="text-sm text-zinc-500">Loading key price…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Key Prices
      </button>

      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Edit Key Price</h1>
        <p className="text-sm text-zinc-500 mt-1">Update key package pricing</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Package Name <span className="text-red-500">*</span>
            </label>
            <input
              name="packageName"
              type="text"
              value={formData.packageName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 bg-transparent text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:focus:border-zinc-600"
              placeholder="e.g., Starter, Business, Enterprise"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Number of Keys <span className="text-red-500">*</span>
            </label>
            <input
              name="keys"
              type="number"
              value={formData.keys}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 bg-transparent text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:focus:border-zinc-600"
              placeholder="e.g., 100, 500, 1000"
            />
            <p className="mt-1 text-xs text-zinc-500">The number of keys in this package</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 bg-transparent text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:focus:border-zinc-600"
              placeholder="e.g., 499, 999, 1499"
            />
            <p className="mt-1 text-xs text-zinc-500">Price in Indian Rupees</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 bg-transparent text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:focus:border-zinc-600"
              placeholder="Optional description for this package"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              name="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Active (Package will be available for purchase)
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

