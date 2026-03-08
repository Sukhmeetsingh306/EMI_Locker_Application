'use client';

import { useEffect } from 'react';
import { X, Calendar, FileText, Clock } from 'lucide-react';

const ExtensionDetailsModal = ({
  isOpen,
  onClose,
  extensionData,
}) => {
  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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

  if (!isOpen || !extensionData) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const { extendDays, extendReason, extendedOn } = extensionData;

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
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 focus:outline-none dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
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
            Extension Details
          </h3>
        </div>

        <div className="space-y-4">
          {/* Extension Days */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                Extension Days
              </label>
            </div>
            <p className="text-lg font-semibold text-zinc-900 dark:text-white">
              {extendDays} {extendDays === 1 ? 'day' : 'days'}
            </p>
          </div>

          {/* Reason */}
          {extendReason && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  Reason
                </label>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {extendReason}
              </p>
            </div>
          )}

          {/* Extended On */}
          {extendedOn && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  Extended On
                </label>
              </div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                {new Date(extendedOn).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-orange-700 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtensionDetailsModal;

