import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  
  // Get cookies from request headers
  const cookies = request.headers.get("cookie");
  
  return NextResponse.json({
    hasSession: !!session,
    session: session ? JSON.stringify(session) : null,
    token: session ? (session as { token?: unknown }).token : null,
    cookies: cookies ? cookies.substring(0, 200) : "no cookies",
    url: request.url,
  });
}
