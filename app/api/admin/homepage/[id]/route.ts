import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const existing = await prisma.homepageSection.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Section not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const data: { name?: string; isVisible?: boolean; config?: string } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "Section name is required" }, { status: 400 });
    data.name = name;
  }
  if (body.isVisible !== undefined) data.isVisible = body.isVisible === true;

  if (body.config !== undefined) {
    let configObj: unknown = body.config;
    if (typeof configObj === "string") {
      try {
        configObj = JSON.parse(configObj);
      } catch {
        return NextResponse.json({ error: "Config is not valid JSON" }, { status: 400 });
      }
    }
    if (!configObj || typeof configObj !== "object" || Array.isArray(configObj)) {
      return NextResponse.json({ error: "Config must be a JSON object" }, { status: 400 });
    }
    data.config = JSON.stringify(configObj);
  }

  const section = await prisma.homepageSection.update({ where: { id: params.id }, data });
  return NextResponse.json({ section });
}
