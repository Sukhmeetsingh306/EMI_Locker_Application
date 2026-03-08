'use client';

import { useState, useEffect } from 'react';
import { createAgent } from '@/src/features/agents/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function CreateAgentPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
  });

  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      await createAgent(form);
      router.push('/agents');
    } catch (err) {
      console.error('createAgent', err);
      setNotification(err?.response?.data?.message || 'Create agent failed');
    } finally {
      setSaving(false);
    }
  };

  // Auto-hide notification after 2 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="max-w-2xl space-y-6">
      {/* Notification */}
      {notification && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-50 border-b-2 border-emerald-500 px-6 py-3 shadow-md">
          <p className="text-emerald-700 font-medium text-center">{notification}</p>
        </div>
      )}

      {/* BACK BUTTON */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Agents
      </button>

      <h1 className="text-2xl font-semibold">Create Agent</h1>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Full Name
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 bg-transparent text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:focus:border-zinc-600"
              placeholder="Enter full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 bg-transparent text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:focus:border-zinc-600"
              placeholder="agent@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Mobile
            </label>
            <input
              type="tel"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 bg-transparent text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:focus:border-zinc-600"
              placeholder="1234567890"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 bg-transparent text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:focus:border-zinc-600"
              placeholder="Enter password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
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
                Create Agent
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

