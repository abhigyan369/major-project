import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Handle Root Redirect
  if (pathname === "/") {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
    }
    const target = userRole === "ADMIN" ? "/admin/dashboard" : "/user/dashboard";
    return NextResponse.redirect(new URL(target, req.nextUrl.origin));
  }

  // Enforce ADMIN Route Protection (/admin/*)
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== "ADMIN") {
      const redirectUrl = new URL("/user/dashboard", req.nextUrl.origin);
      redirectUrl.searchParams.set("error", "forbidden_admin_access");
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Enforce USER Route Protection (/user/*)
  if (pathname.startsWith("/user")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Prevent logged-in users from seeing login page
  if (pathname === "/login" && isLoggedIn) {
    const target = userRole === "ADMIN" ? "/admin/dashboard" : "/user/dashboard";
    return NextResponse.redirect(new URL(target, req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/", "/admin/:path*", "/user/:path*", "/login"],
};
