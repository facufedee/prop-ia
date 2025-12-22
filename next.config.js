/** @type {import('next').NextConfig} */
// Trigger redeploy
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
        ],
    },

    // Security Headers
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    // HSTS - Force HTTPS
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains; preload'
                    },
                    // Prevent clickjacking
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    // Prevent MIME type sniffing
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    // XSS Protection
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    // Referrer Policy
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    // Permissions Policy
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
                    },
                    // Content Security Policy - Properly configured for Firebase
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://apis.google.com https://sdk.mercadopago.com https://http2.mlstatic.com https://maps.googleapis.com https://maps.gstatic.com",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "img-src 'self' data: https: blob: https://http2.mlstatic.com https://maps.gstatic.com https://maps.googleapis.com",
                            "font-src 'self' https://fonts.gstatic.com",
                            "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com wss://*.firebaseio.com https://api.mercadopago.com https://events.mercadopago.com https://apis.datos.gob.ar",
                            "frame-src 'self' https://www.google.com https://*.firebaseapp.com https://accounts.google.com https://www.mercadopago.com.ar https://sdk.mercadopago.com",
                            "object-src 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                            "frame-ancestors 'self'",
                            "upgrade-insecure-requests"
                        ].join('; ')
                    },
                    // Allow Google Sign-in popups
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin-allow-popups'
                    }
                ],
            },
        ];
    },

    // Environment variables validation and exposure
    // This ensures all NEXT_PUBLIC_ variables are available in the browser
    env: {
        NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        NEXT_PUBLIC_FIREBASE_DATABASE_URL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    },

    // Production optimizations
    reactStrictMode: true,

    // Disable x-powered-by header
    poweredByHeader: false,
};

module.exports = nextConfig;
