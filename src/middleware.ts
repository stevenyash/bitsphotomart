import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Define protected routes
const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/orders",
  "/library",
  "/cart",
  "/checkout",
  "/photo-editing",
];

// Define admin-only routes
const adminRoutes = [
  "/admin",
];

// Define marketer-only routes
const marketerRoutes = [
  "/dashboard/marketer",
];

// Define auth routes that should redirect to dashboard if already logged in
const authRoutes = [
  "/login",
  "/register", 
];

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;
  
  const isLoggedIn = !!session;
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isMarketerRoute = marketerRoutes.some(route => pathname.startsWith(route));

  // Redirect to dashboard if already logged in and accessing auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Check if route is protected
  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if route is admin-only
  if (isAdminRoute && session) {
    const userRole = (session.user as { role?: string })?.role;
    
    // Allow only valid admin roles to access admin routes (NOT Marketer)
    const validAdminRoles = ["ADMIN", "SUPERADMIN", "MANAGER", "FINANCE_MANAGER"];
    
    if (!userRole || !validAdminRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Check if route is marketer-only
  if (isMarketerRoute && session) {
    const userRole = (session.user as { role?: string })?.role;
    
    if (userRole !== "MARKETER") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
