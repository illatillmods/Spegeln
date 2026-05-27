import type { NextConfig } from "next";

function normalizeBackendUrl(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "";
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/$/, "");
}

const backendProxyTarget =
  normalizeBackendUrl(process.env.BACKEND_URL) ||
  (process.env.NODE_ENV === "development" ? "http://127.0.0.1:4000" : "");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  output: "standalone",
  async rewrites() {
    if (!backendProxyTarget) {
      return [];
    }

    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${backendProxyTarget}/api/:path*`,
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "off",
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;