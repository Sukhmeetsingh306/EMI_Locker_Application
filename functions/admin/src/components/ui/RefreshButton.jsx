'use client';

import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

const RefreshButton = ({ onRefresh, className = '', disabled = false }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (refreshing || disabled) return;
    
    try {
      setRefreshing(true);
      await onRefresh();
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      // Add a small delay to show the spinning animation
      setTimeout(() => {
        setRefreshing(false);
      }, 300);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={refreshing || disabled}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 ${className}`}
      title="Refresh data"
    >
      <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
      <span className="text-sm font-medium">Refresh</span>
    </button>
  );
};

export default RefreshButton;

