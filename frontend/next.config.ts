import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure standard Next.js output (no static export)
  distDir: process.env.BUILD_TO_PARENT === "true" ? "../.next" : ".next",
};

export default nextConfig;
