import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { clearSettingsCache } from "@/lib/settings";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const rows = await prisma.siteSetting.findMany();
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return NextResponse.json({ settings: map });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be an object of {key: value}" }, { status: 400 });
  }

  const entries = Object.entries(body).filter(([k]) => typeof k === "string" && k.length > 0 && k.length <= 100);
  for (const [key, raw] of entries) {
    const value = raw === null || raw === undefined ? "" : String(raw);
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  clearSettingsCache();
  return NextResponse.json({ ok: true, updated: entries.length });
}
