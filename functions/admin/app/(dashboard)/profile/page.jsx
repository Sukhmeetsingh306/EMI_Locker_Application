'use client';

import { useEffect, useState } from 'react';
import { getMyProfile } from '@/src/features/admins/api';
import { User, Mail, Phone, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getMyProfile();
      const adminData = data?.data || data;
      setProfile(adminData);
    } catch (err) {
      console.error('fetchProfile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <div className="text-center py-12 text-zinc-500">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Profile</h1>
      </div>

      <div className={`grid gap-6 ${profile.role !== 'superadmin' ? 'lg:grid-cols-3' : ''}`}>
        {/* Main Content - 2 columns */}
        <div className={profile.role !== 'superadmin' ? 'lg:col-span-2 space-y-6' : 'space-y-6'}>
          {/* Basic Information Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Full Name
                </label>
                <div className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                  {profile.name || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <div className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                  {profile.email || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Mobile
                </label>
                <div className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                  {profile.mobile || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - 1 column */}
        {profile.role !== 'superadmin' && (
          <div className="space-y-6">
            {/* Account Info Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Account Info</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Role</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white capitalize">
                    {profile.role || 'admin'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Status</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {profile.status === 1 ? (
                      <span className="text-emerald-600">Active</span>
                    ) : (
                      <span className="text-red-600">Blocked</span>
                    )}
                  </p>
                </div>
                {profile.totalKeys !== undefined && (
                  <>
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Keys</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {profile.totalKeys || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Used Keys</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {profile.usedKeys || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Available Keys</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {profile.availableKeys || 0}
                      </p>
                    </div>
                  </>
                )}
                {profile.createdAt && (
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Member Since</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
