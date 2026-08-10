import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*", "172.31.*.*"],
};

export default nextConfig;
