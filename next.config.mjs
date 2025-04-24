/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const nextConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Temporarily enabling PWA in development for testing
  disable: false // process.env.NODE_ENV === 'development'
})({});

export default nextConfig;
