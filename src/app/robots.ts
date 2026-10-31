import type { MetadataRoute } from "next";
import { demoMode } from "@/lib/demo";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  // Prototype deployments must never be indexed: every listing on them is sample data.
  if (demoMode) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/employer", "/admin", "/onboarding", "/settings", "/messages", "/notifications", "/api/", "/dev/", "/*/apply"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
