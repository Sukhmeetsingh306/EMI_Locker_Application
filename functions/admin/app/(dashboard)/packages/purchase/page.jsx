'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPackageConfigs, createPackageOrder, verifyPackagePayment } from '@/src/features/keyPackages/api';
import { ArrowLeft, CreditCard, Loader2, CheckCircle } from 'lucide-react';
import Script from 'next/script';

export default function PurchasePackagePage() {
  const router = useRouter();
  const [packageConfigs, setPackageConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [success, setSuccess] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    fetchPackageConfigs();
  }, []);

  const fetchPackageConfigs = async () => {
    try {
      setLoading(true);
      const data = await getPackageConfigs(); 
      setPackageConfigs(data || {});
    } catch (err) {
      console.error('fetchPackageConfigs', err);
      alert('Failed to load package configurations');
    } finally {
      setLoading(false);
    }
  };

  // Wait for Razorpay SDK to load
  const waitForRazorpay = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      const interval = setInterval(() => {
        attempts++;
        if (window.Razorpay) {
          clearInterval(interval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new Error('Razorpay SDK failed to load'));
        }
      }, 100);
    });
  };

  const handlePurchase = async (packageType) => {
    try {
      setProcessing(true);
      setSelectedPackage(packageType);

      // Create Razorpay order
      const result = await createPackageOrder(packageType);
      setOrderData(result);

      // Wait for Razorpay SDK to be available
      await waitForRazorpay();

      // Initialize Razorpay
      if (window.Razorpay) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '', // You'll need to add this to env
          amount: result.order.amount,
          currency: result.order.currency,
          name: 'EMI Locker',
          description: `Package Purchase - ${packageType} keys`,
          order_id: result.order.id,
          handler: async function (response) {
            try {
              // Verify payment
              await verifyPackagePayment(result.packageId, {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              });

              setSuccess(true);
              setTimeout(() => {
                router.push('/packages');
              }, 2000);
            } catch (err) {
              console.error('Payment verification failed:', err);
              alert('Payment verification failed. Please contact support.');
            }
          },
          prefill: {
            name: '',
            email: '',
            contact: ''
          },
          theme: {
            color: '#10b981'
          },
          modal: {
            ondismiss: function() {
              setProcessing(false);
              setOrderData(null);
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        setProcessing(false);
        setSelectedPackage(null);
        alert('Razorpay SDK not loaded. Please refresh the page and try again.');
      }
    } catch (err) {
      console.error('Purchase error:', err);
      alert(err?.response?.data?.message || 'Failed to initiate purchase');
      setProcessing(false);
      setSelectedPackage(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Loading packages...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-900/20">
          <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
            Payment Successful!
          </h2>
          <p className="text-emerald-700 dark:text-emerald-300">
            Your package has been purchased successfully. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  const packages = Object.values(packageConfigs);

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Razorpay SDK loaded');
          setRazorpayLoaded(true);
        }}
        onError={() => {
          console.error('Failed to load Razorpay SDK');
          alert('Failed to load payment gateway. Please refresh the page.');
        }}
      />
      
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Packages
        </button>

        <h1 className="text-2xl font-semibold">Purchase Package</h1>

        {packages.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            No packages available for purchase.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`rounded-2xl border p-6 transition-all ${
                  selectedPackage === pkg.keys.toString() && processing
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:shadow-lg'
                }`}
              >
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold mb-2">{pkg.packageName}</h3>
                  <div className="text-3xl font-bold text-emerald-600 mb-1">
                    ₹{pkg.price}
                  </div>
                  <p className="text-sm text-zinc-500">{pkg.keys} Keys</p>
                </div>

                <button
                  onClick={() => handlePurchase(pkg.keys.toString())}
                  disabled={processing}
                  className="w-full px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing && selectedPackage === pkg.keys.toString() ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Buy Now
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

