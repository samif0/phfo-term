import type { NextConfig } from "next";

const nextConfig: NextConfig & { webpack?: Function } = {
  output: "export",
  trailingSlash: true,
  distDir: "build",
  webpack(config, { isServer }) {
    // transpile .worker.ts via esbuild then bundle as web worker
    config.module.rules.push({
      test: /\.worker\.ts$/,
      use: [
        {
          loader: 'esbuild-loader',
          options: { loader: 'ts', target: 'es2022' }
        },
        {
          loader: 'worker-loader',
          options: {
            esModule: true,
            filename: 'static/chunks/[name].[contenthash:8].js',
            publicPath: '/_next/static/chunks/'
          }
        }
      ]
    });
    return config;
  }
};

export default nextConfig;
