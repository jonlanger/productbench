import { NextResponse } from "next/server";

/** Legacy Supabase Auth callback — Clerk handles its own redirects. */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`);
}
