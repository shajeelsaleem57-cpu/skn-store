import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { parsePageBody, ensureUniquePageSlug } from "./_helpers";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const pages = await prisma.page.findMany({ orderBy: { title: "asc" } });
  return NextResponse.json({ pages });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const parsed = parsePageBody(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const slug = await ensureUniquePageSlug(parsed.data.slug);
  const page = await prisma.page.create({ data: { ...parsed.data, slug } });
  return NextResponse.json({ page }, { status: 201 });
}
