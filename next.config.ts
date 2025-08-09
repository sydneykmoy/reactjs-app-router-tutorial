import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname, 
  experimental: {
    ppr: 'incremental',
  },
};

export default nextConfig;
