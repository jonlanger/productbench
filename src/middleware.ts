import { type NextRequest, NextResponse } from "next/server";

/**
 * Pass-through only. Do not call Supabase Auth here — the project host no longer
 * resolves, and `auth.getUser()` hangs Edge Middleware until
 * MIDDLEWARE_INVOCATION_TIMEOUT (504).
 *
 * Session checks stay in `getViewer()` / route handlers. Reintroduce a refresh
 * step only after Auth is on a reachable provider (e.g. Clerk).
 */
export function middleware(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and images.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
