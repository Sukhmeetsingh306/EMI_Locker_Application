'use client';

import { useEffect, useState } from 'react';
import { X, Calendar } from 'lucide-react';

const ExtensionModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [days, setDays] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setDays('');
      setReason('');
      setErrors({});
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate days
    const daysNum = Number(days);
    if (!days || days.trim() === '') {
      newErrors.days = 'Extension days is required';
    } else if (Number.isNaN(daysNum) || daysNum <= 0 || !Number.isInteger(daysNum)) {
      newErrors.days = 'Please enter a valid positive integer';
    }

    // Validate reason
    if (!reason || reason.trim() === '') {
      newErrors.reason = 'Reason is required';
    } else if (reason.trim().length < 3) {
      newErrors.reason = 'Reason must be at least 3 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onConfirm({ extendDays: daysNum, reason: reason.trim() });
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/30 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/95">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-orange-100 p-3 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Extend Payment Due Date
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Extension Days */}
          <div>
            <label
              htmlFor="days"
              className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Extension Days <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="days"
              value={days}
              onChange={(e) => {
                setDays(e.target.value);
                if (errors.days) setErrors({ ...errors, days: '' });
              }}
              min="1"
              step="1"
              placeholder="Enter number of days (e.g., 3)"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                errors.days
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700 dark:focus:border-red-500'
                  : 'border-zinc-300 focus:border-orange-500 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-orange-500'
              }`}
              disabled={isLoading}
            />
            {errors.days && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.days}</p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label
              htmlFor="reason"
              className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) setErrors({ ...errors, reason: '' });
              }}
              placeholder="Enter reason for extension..."
              rows={4}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 resize-none ${
                errors.reason
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700 dark:focus:border-red-500'
                  : 'border-zinc-300 focus:border-orange-500 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-orange-500'
              }`}
              disabled={isLoading}
            />
            {errors.reason && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.reason}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-orange-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Extend Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtensionModal;

