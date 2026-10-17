import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type SessionUser = { id: string; email?: string | null; name?: string | null };

/** Server-side session guard for account pages (middleware guards too, but double-check). */
export async function getAccountUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) return null;
  return user;
}
