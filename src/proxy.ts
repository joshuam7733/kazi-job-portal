import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const AREA_ROLES: { prefix: string; roles: string[] }[] = [
  { prefix: "/dashboard", roles: ["JOB_SEEKER"] },
  { prefix: "/employer", roles: ["EMPLOYER"] },
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/onboarding", roles: ["JOB_SEEKER", "EMPLOYER"] },
  { prefix: "/settings", roles: ["JOB_SEEKER", "EMPLOYER", "ADMIN"] },
  { prefix: "/messages", roles: ["JOB_SEEKER", "EMPLOYER"] },
  { prefix: "/notifications", roles: ["JOB_SEEKER", "EMPLOYER", "ADMIN"] },
];

/**
 * First line of defence only: every page, server action and route handler re-checks
 * authorization on the server (see src/lib/session.ts).
 */
export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const area = AREA_ROLES.find((a) => pathname === a.prefix || pathname.startsWith(`${a.prefix}/`));
  if (!area) return NextResponse.next();

  const user = req.auth?.user;
  if (!user) {
    const url = new URL("/signin", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }
  if (!area.roles.includes(user.role)) {
    return NextResponse.redirect(new URL("/forbidden", req.nextUrl.origin));
  }
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/employer/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
    "/settings/:path*",
    "/messages/:path*",
    "/notifications/:path*",
  ],
};
