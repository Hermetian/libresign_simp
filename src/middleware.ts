import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "./lib/supabase";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for these paths
  const publicPaths = [
    "/_next",
    "/api",
    "/favicon.ico",
    "/",
    "/login",
    "/signup",
    "/auth/"
  ];
  
  // Check if the current path is public
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path)
  );
  
  if (isPublicPath) {
    return NextResponse.next();
  }

  try {
    // Create a response to modify
    const response = NextResponse.next();
    
    // Create a Supabase client for the middleware
    const supabase = createMiddlewareClient<Database>({ req: request, res: response });
    
    // Refresh session if expired
    const { data: { session } } = await supabase.auth.getSession();
    
    // If no session, redirect to login
    if (!session) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("from", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // User has a valid session, let them proceed
    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    // If there's an error, redirect to login
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("error", "auth_error");
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)",],
}; 