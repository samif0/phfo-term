import type { NextConfig } from "next";

const nextConfig: NextConfig & { webpack?: Function } = {
  output: "export",
  trailingSlash: true,
  distDir: "build",
  webpack(config, { isServer }) {
    config.module.rules.push({
      test: /\.worker\.ts$/,
      use: [{
        loader: "worker-loader",
        options: { esModule: true }
      }]
    });
    return config;
  }
};

export default nextConfig;
