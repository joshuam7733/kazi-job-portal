import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Next.js injects small inline bootstrap scripts, so 'unsafe-inline' is required for scripts
// unless a nonce-based CSP is configured. Everything else is locked to our own origin.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self' https://accounts.google.com",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["embedded-postgres"],
  experimental: {
    // Uploads are capped at 4 MB; Vercel rejects request bodies above 4.5 MB.
    serverActions: {
      bodySizeLimit: "4.5mb",
      // Extra origins allowed to call server actions, e.g. "*.trycloudflare.com" for a tunnelled preview.
      allowedOrigins: process.env.SERVER_ACTIONS_ALLOWED_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean),
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
          // Prototype deployments are never indexed (see src/lib/demo.ts).
          ...(process.env.DEMO_MODE === "true" ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
        ],
      },
    ];
  },
};

export default nextConfig;
