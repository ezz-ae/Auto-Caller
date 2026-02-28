import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
