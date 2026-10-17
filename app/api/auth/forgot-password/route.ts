import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";

const schema = z.object({ email: z.string().email() });

/**
 * POST /api/auth/forgot-password — issue a reset token.
 * Always returns {ok:true} so the endpoint never reveals whether an email is registered.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: true });

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });
    const siteUrl = await getSetting("site_url", process.env.NEXTAUTH_URL || "");
    // Dev / log-based delivery until transactional email is wired up.
    console.log(`[auth] Password reset link for ${email}: ${siteUrl}/reset-password/${token}`);
  }

  return NextResponse.json({ ok: true });
}
