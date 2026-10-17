import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const sections = await prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ sections });
}
