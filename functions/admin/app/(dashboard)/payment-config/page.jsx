'use client';

import { useEffect, useState } from 'react';
import { getPaymentConfig, updatePaymentConfig } from '@/src/features/paymentConfig/api';
import { CreditCard, QrCode, CheckCircle, XCircle, Edit2, Building2 } from 'lucide-react';

export default function PaymentConfigPage() {
  const [config, setConfig] = useState({
    razorpayEnabled: false,
    qrCodeEnabled: false,
    bankDetailsEnabled: false,
    razorpayKeyId: '',
    razorpayKeySecret: '',
    upiId: '',
    qrCodeImage: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankAccountHolderName: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isEditing, setIsEditing] = useState(false);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getPaymentConfig();
      setConfig({
        razorpayEnabled: data.razorpayEnabled || false,
        qrCodeEnabled: data.qrCodeEnabled || false,
        bankDetailsEnabled: data.bankDetailsEnabled || false,
        razorpayKeyId: data.razorpayKeyId || '',
        razorpayKeySecret: data.razorpayKeySecret || '',
        upiId: data.upiId || '',
        qrCodeImage: data.qrCodeImage || '',
        bankAccountNumber: data.bankAccountNumber || '',
        bankIfsc: data.bankIfsc || '',
        bankAccountHolderName: data.bankAccountHolderName || '',
      });
    } catch (err) {
      console.error('fetchConfig', err);
      setMessage({ type: 'error', text: 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (message.type === 'success' && message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [message]);


  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const payload = {
        razorpayEnabled: config.razorpayEnabled,
        qrCodeEnabled: config.qrCodeEnabled,
        bankDetailsEnabled: config.bankDetailsEnabled,
        razorpayKeyId: config.razorpayKeyId || undefined,
        razorpayKeySecret: config.razorpayKeySecret || undefined,
        upiId: config.upiId || undefined,
        bankAccountNumber: config.bankAccountNumber || undefined,
        bankIfsc: config.bankIfsc || undefined,
        bankAccountHolderName: config.bankAccountHolderName || undefined,
      };

      await updatePaymentConfig(payload);
      setMessage({ type: 'success', text: 'Payment configuration saved successfully' });
      setIsEditing(false); // Lock after saving
      // Reload to get updated data
      await fetchConfig();
    } catch (err) {
      console.error('updatePaymentConfig', err);
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Payment Configuration</h1>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Payment Configuration</h1>
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Save Configuration
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Payment Method Selection */}
      <div className="rounded-3xl border border-zinc-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold mb-4">Select Payment Methods</h2>
        <div className="space-y-4">
          <label className={`flex items-center gap-3 ${isEditing ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
            <input
              type="checkbox"
              checked={config.razorpayEnabled}
              onChange={(e) => isEditing && setConfig(prev => ({ ...prev, razorpayEnabled: e.target.checked }))}
              disabled={!isEditing}
              className="w-5 h-5 rounded disabled:cursor-not-allowed"
            />
            <CreditCard className="h-5 w-5" />
            <span className="font-medium">Enable Razorpay</span>
          </label>
          <label className={`flex items-center gap-3 ${isEditing ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
            <input
              type="checkbox"
              checked={config.qrCodeEnabled}
              onChange={(e) => isEditing && setConfig(prev => ({ ...prev, qrCodeEnabled: e.target.checked }))}
              disabled={!isEditing}
              className="w-5 h-5 rounded disabled:cursor-not-allowed"
            />
            <QrCode className="h-5 w-5" />
            <span className="font-medium">Enable QR Code</span>
          </label>
          <label className={`flex items-center gap-3 ${isEditing ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
            <input
              type="checkbox"
              checked={config.bankDetailsEnabled}
              onChange={(e) => isEditing && setConfig(prev => ({ ...prev, bankDetailsEnabled: e.target.checked }))}
              disabled={!isEditing}
              className="w-5 h-5 rounded disabled:cursor-not-allowed"
            />
            <Building2 className="h-5 w-5" />
            <span className="font-medium">Enable Bank Details</span>
          </label>
        </div>
      </div>

      {/* Razorpay Configuration */}
      {config.razorpayEnabled && (
        <div className="rounded-3xl border border-zinc-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Razorpay Configuration
          </h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Razorpay Key ID</label>
              <input
                type="text"
                value={config.razorpayKeyId}
                onChange={(e) => setConfig(prev => ({ ...prev, razorpayKeyId: e.target.value }))}
                placeholder="Enter your Razorpay Key ID"
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-800 dark:border-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Razorpay Key Secret</label>
              <input
                type="text"
                value={config.razorpayKeySecret}
                onChange={(e) => setConfig(prev => ({ ...prev, razorpayKeySecret: e.target.value }))}
                placeholder="Enter your Razorpay Key Secret"
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-800 dark:border-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </form>
        </div>
      )}

      {/* QR Code Configuration */}
      {config.qrCodeEnabled && (
        <div className="rounded-3xl border border-zinc-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Configuration
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">UPI ID</label>
              <input
                type="text"
                value={config.upiId}
                onChange={(e) => setConfig(prev => ({ ...prev, upiId: e.target.value }))}
                placeholder="Enter your UPI ID (e.g., user@paytm, 1234567890@ybl)"
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-800 dark:border-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Enter your UPI ID. QR code will be generated automatically.
              </p>
            </div>
            {config.qrCodeImage && config.upiId && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Generated QR Code</p>
                <img 
                  src={config.qrCodeImage} 
                  alt="QR Code" 
                  className="w-48 h-48 border border-zinc-300 rounded-lg object-contain bg-white p-2"
                />
                <p className="text-xs text-zinc-500">
                  Users can scan this QR code to make payments via UPI
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bank Details Configuration */}
      {config.bankDetailsEnabled && (
        <div className="rounded-3xl border border-zinc-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Bank Details Configuration
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Account Holder Name</label>
              <input
                type="text"
                value={config.bankAccountHolderName}
                onChange={(e) => setConfig(prev => ({ ...prev, bankAccountHolderName: e.target.value }))}
                placeholder="Enter account holder name"
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-800 dark:border-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Account Number</label>
              <input
                type="text"
                value={config.bankAccountNumber}
                onChange={(e) => setConfig(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                placeholder="Enter bank account number"
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-800 dark:border-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">IFSC Code</label>
              <input
                type="text"
                value={config.bankIfsc}
                onChange={(e) => setConfig(prev => ({ ...prev, bankIfsc: e.target.value.toUpperCase() }))}
                placeholder="Enter IFSC code (e.g., SBIN0001234)"
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-800 dark:border-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      )}

      {!config.razorpayEnabled && !config.qrCodeEnabled && !config.bankDetailsEnabled && (
        <div className="rounded-3xl border border-zinc-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 text-center py-8">
          <p className="text-zinc-500">Please enable at least one payment method</p>
        </div>
      )}
    </div>
  );
}

