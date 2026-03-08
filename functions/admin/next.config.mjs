/** @type {import('next').NextConfig} */

// Extract origin from API base URL for CSP
const getApiOrigin = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8800/api';
  try {
    // If it includes /api, remove it to get the origin
    const url = apiUrl.replace(/\/api\/?$/, '');
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch {
    // Fallback: try to extract origin manually
    const match = apiUrl.match(/^(https?:\/\/[^\/]+)/);
    return match ? match[1] : 'http://localhost:8800';
  }
};

const apiOrigin = getApiOrigin();

const nextConfig = {
  /* config options here */
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com", // Razorpay SDK
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              `connect-src 'self' ${apiOrigin} https://api.razorpay.com`, // Razorpay API
              "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com", // Razorpay payment modal
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          }
        ],
      },
    ];
  },
};

export default nextConfig;
