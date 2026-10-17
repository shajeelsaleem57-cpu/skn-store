import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

/** Returns the admin user session, or a 401/403 NextResponse on failure. */
export async function requireAdmin(): Promise<
  { ok: true; user: { id: string; email?: string | null; name?: string | null } } | { ok: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (role !== "admin") {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, user: session.user as { id: string; email?: string | null; name?: string | null } };
}

/** Returns the logged-in user session, or a 401 NextResponse on failure. */
export async function requireUser(): Promise<
  { ok: true; user: { id: string; email?: string | null; name?: string | null } } | { ok: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true, user: session.user as { id: string; email?: string | null; name?: string | null } };
}
