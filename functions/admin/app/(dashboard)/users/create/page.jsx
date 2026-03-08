// app/(dashboard)/users/create.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUser } from '@/src/features/users/api';
import { X, CheckCircle, ArrowLeft } from 'lucide-react';

export default function CreateUserPage() {
  const router = useRouter();
  
  const [form, setForm] = useState({
    fullName: '',
    aadhar: '',
    pan: '',
    email: '',
    mobile: '',
    password: '',
  });

  const [saving, setSaving] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) => {
    let value = e.target.value;
    
    if (e.target.name === 'pan') {
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    } else if (e.target.name === 'mobile' || e.target.name === 'aadhar') {
      value = value.replace(/[^0-9]/g, '');
    }
    
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      setError(null);
      
      const user = await createUser(form);
      
      if (!user || !user._id) {
        throw new Error('Invalid response from server');
      }

      setCreatedUser(user);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Create user error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to create user. Please try again.';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setCreatedUser(null);
    router.push('/users');
  };

  return (
    <>
      <div className="max-w-2xl space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </button>

        <h1 className="text-2xl font-semibold">Create User</h1>

        {error && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                name="fullName"
                placeholder="Enter full name"
                value={form.fullName}
                onChange={onChange}
                required
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 bg-transparent text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:focus:border-zinc-600 disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Aadhar Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="aadhar"
                  type="text"
                  placeholder="Enter 12-digit Aadhar"
                  value={form.aadhar}
                  onChange={onChange}
                  required
                  disabled={saving}
                  maxLength={12}
                  pattern="[0-9]{12}"
                  inputMode="numeric"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 bg-transparent text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:focus:border-zinc-600 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  PAN Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="pan"
                  type="text"
                  placeholder="Enter PAN (e.g., ABCDE1234F)"
                  value={form.pan}
                  onChange={onChange}
                  required
                  disabled={saving}
                  maxLength={10}
                  pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 bg-transparent text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:focus:border-zinc-600 disabled:opacity-50 uppercase"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                placeholder="user@example.com"
                value={form.email}
                onChange={onChange}
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 bg-transparent text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:focus:border-zinc-600 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Mobile <span className="text-red-500">*</span>
              </label>
              <input
                name="mobile"
                type="tel"
                placeholder="1234567890"
                value={form.mobile}
                onChange={onChange}
                required
                disabled={saving}
                pattern="[0-9]*"
                inputMode="numeric"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 bg-transparent text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:focus:border-zinc-600 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                name="password"
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={onChange}
                required
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 bg-transparent text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:focus:border-zinc-600 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create User
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && createdUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/30 bg-white p-6 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900">
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CheckCircle className="h-6 w-6" />
              </div>

              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
                User Created Successfully!
              </h3>

              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                The user has been created successfully. A key will be automatically assigned and activated when the user creates their first EMI.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  Back to List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
