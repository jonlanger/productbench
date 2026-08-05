import { type NextRequest, NextResponse } from "next/server";

/**
 * @deprecated Supabase Auth refresh removed — dead project host caused Edge
 * Middleware timeouts. Kept so older imports do not break.
 */
export async function updateSession(request: NextRequest) {
  return NextResponse.next({ request });
}
