import type { NextConfig } from "next";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://www.youtube.com https://s.ytimg.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.cloudfunctions.net",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "frame-src 'self' https://www.youtube.com https://youtube.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  // DNS prefetch kontrolü
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // HSTS — 2 yıl, subdomain dahil, preload
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // XSS koruma (legacy tarayıcılar için)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Clickjacking koruması
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // MIME sniffing koruması
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Referer bilgisi kısıtlaması
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // İzinler politikası — gereksiz tarayıcı özelliklerini kapat
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()' },
  // Content Security Policy
  { key: 'Content-Security-Policy', value: CSP },
  // Cross-Origin politikaları
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
  // Cache kontrolü (hassas sayfalar için)
  { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.trycloudflare.com', 'localhost:3000'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ],
  },
  // API body size limiti — görsel upload için yüksek tutuyoruz
  experimental: {
    serverActions: {
      bodySizeLimit: '60mb',
    },
  },
  // Güvenlik: sunucu bilgilerini gizle
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Tüm sayfalar
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // API endpoint'leri için ek CORS kısıtlaması
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
      {
        // Static asset'ler için cache'i aç
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
