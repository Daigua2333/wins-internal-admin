import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const dashboardUrl = request.nextUrl.clone();
  dashboardUrl.pathname = "/dashboard";
  dashboardUrl.search = "";

  // After a form POST, use 303 so the browser performs a GET to /dashboard.
  const response = NextResponse.redirect(dashboardUrl, 303);

  response.cookies.set("wins-admin-session", "mock-session", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
