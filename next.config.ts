import type { NextConfig } from "next";

const nextConfig: NextConfig & { webpack?: Function } = {
  webpack(config, { dev, isServer }) {
    if (!dev) {
      // only apply in production build so dev server serves pages normally
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
    }
    return config;
  }
};

export default nextConfig;
