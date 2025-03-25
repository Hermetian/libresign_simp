import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  
  if (!code) {
    // If no code provided, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );
    
    // Exchange code for session and ensure it's properly saved in cookies
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Error exchanging code for session:", error.message);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
    }
    
    if (data?.session) {
      // Session established successfully, redirect to dashboard or next path
      return NextResponse.redirect(new URL(next, request.url));
    }
  } catch (error) {
    console.error("Unexpected error in auth callback:", error);
    return NextResponse.redirect(new URL("/login?error=unexpected_error", request.url));
  }

  // Fallback redirect if something went wrong
  return NextResponse.redirect(new URL("/login?error=unknown_error", request.url));
} 