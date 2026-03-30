import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth";

const protectedPaths = [
  "/admin",
  "/api/admin",
  "/api/restricted",
  "/api/alerts",
  "/api/reports/moderate",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    const user = await getSessionUserFromRequest(request);
    if (!user || (user.role !== "ADMIN" && user.role !== "ANALYST")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/restricted/:path*", "/api/alerts/:path*", "/api/reports/moderate/:path*"],
};