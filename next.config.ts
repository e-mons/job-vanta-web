import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.32", "localhost:3000", "127.0.0.1:3000"],
  transpilePackages: ["@google/genai"],
};

export default nextConfig;
