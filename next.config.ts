import type { NextConfig } from "next";

const nextConfig: NextConfig & { webpack?: Function } = {
  output: 'standalone',
  trailingSlash: true,
  distDir: 'build',
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack(config, { isServer }) {
    // `isServer` is true when building the server bundle, false for the client bundle.
  // We only want to emit Web Worker assets for the client, so skip this rule during SSR.
  if (!isServer) {
      // Emit any .worker.ts or .worker.js as separate assets using Webpack 5 asset modules
      config.module.rules.push({
        test: /\.worker\.(ts|js)$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/chunks/[name].[contenthash:8].worker.js',
        },
      });
    }
    return config;
  },
};

export default nextConfig;
