import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => null)) as { orderedIds?: unknown } | null;
  const orderedIds = Array.isArray(body?.orderedIds)
    ? body.orderedIds.filter((x): x is string => typeof x === "string")
    : [];
  if (orderedIds.length === 0) {
    return NextResponse.json({ error: "orderedIds must be a non-empty array of category ids" }, { status: 400 });
  }

  await prisma.$transaction(
    orderedIds.map((id, i) => prisma.category.update({ where: { id }, data: { sortOrder: i } }))
  );
  return NextResponse.json({ ok: true });
}
