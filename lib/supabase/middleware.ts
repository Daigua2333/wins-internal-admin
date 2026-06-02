import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr/dist/module/types";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/types/database";

const protectedRoutes = ["/dashboard", "/orders", "/fleet", "/drivers", "/guides", "/customers", "/pricing", "/profit", "/settings"];
type SupabaseCookie = { name: string; value: string; options: CookieOptions };

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  const { url, publishableKey } = getSupabaseConfig();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: SupabaseCookie[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims ?? null;

  if (protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route)) && (!claims || error)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("error", "auth_required");
    return NextResponse.redirect(loginUrl);
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
