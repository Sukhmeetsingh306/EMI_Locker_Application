'use client';

import { useEffect, useState } from 'react';
import { getAllAdminsPaymentConfig } from '@/src/features/paymentConfig/api';
import { CreditCard, QrCode, CheckCircle, XCircle, Building2 } from 'lucide-react';
import RefreshButton from '@/src/components/ui/RefreshButton';

export default function AdminPaymentConfigsPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await getAllAdminsPaymentConfig();
      setConfigs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchConfigs', err);
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Admin Payment Configurations</h1>
          <RefreshButton onRefresh={fetchConfigs} disabled={loading} />
        </div>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Payment Configurations</h1>
        <RefreshButton onRefresh={fetchConfigs} disabled={loading} />
      </div>

      {configs.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">No admin payment configurations found.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {configs.map((admin) => (
            <div
              key={admin._id}
              className="rounded-3xl border border-zinc-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{admin.name}</h3>
                  <p className="text-sm text-zinc-500">{admin.email || admin.mobile}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Razorpay Status */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <span className="font-medium">Razorpay</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {admin.razorpayEnabled ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                        <span className="text-sm text-emerald-600">Enabled</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-zinc-400" />
                        <span className="text-sm text-zinc-500">Disabled</span>
                      </>
                    )}
                  </div>
                </div>

                {admin.razorpayEnabled && (
                  <div className="pl-8 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Key ID:</span>
                      <span className="font-mono">{admin.razorpayKeyId || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Key Secret:</span>
                      <span className="font-mono">{admin.razorpayKeySecret || 'Not set'}</span>
                    </div>
                  </div>
                )}

                {/* QR Code Status */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    <span className="font-medium">QR Code</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {admin.qrCodeEnabled ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                        <span className="text-sm text-emerald-600">Enabled</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-zinc-400" />
                        <span className="text-sm text-zinc-500">Disabled</span>
                      </>
                    )}
                  </div>
                </div>

                {admin.qrCodeEnabled && (
                  <div className="pl-8 space-y-2 text-sm">
                    {admin.upiId && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">UPI ID:</span>
                        <span className="font-mono">{admin.upiId}</span>
                      </div>
                    )}
                    {admin.qrCodeImage && (
                      <div>
                        <img
                          src={admin.qrCodeImage}
                          alt="QR Code"
                          className="w-32 h-32 border border-zinc-300 rounded-lg object-contain bg-white p-2"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Bank Details Status */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    <span className="font-medium">Bank Details</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {admin.bankDetailsEnabled ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                        <span className="text-sm text-emerald-600">Enabled</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-zinc-400" />
                        <span className="text-sm text-zinc-500">Disabled</span>
                      </>
                    )}
                  </div>
                </div>

                {admin.bankDetailsEnabled && (
                  <div className="pl-8 space-y-2 text-sm">
                    {admin.bankAccountHolderName && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Account Holder:</span>
                        <span className="font-medium">{admin.bankAccountHolderName}</span>
                      </div>
                    )}
                    {admin.bankAccountNumber && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Account Number:</span>
                        <span className="font-mono">{admin.bankAccountNumber}</span>
                      </div>
                    )}
                    {admin.bankIfsc && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">IFSC Code:</span>
                        <span className="font-mono">{admin.bankIfsc}</span>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

