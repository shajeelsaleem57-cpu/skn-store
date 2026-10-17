import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/admin";
import { PROVINCES } from "@/lib/constants";
import { isValidPakistaniMobile, normalizePakistaniMobile } from "@/lib/utils";

const addressSchema = z.object({
  label: z.string().max(40).optional().or(z.literal("")),
  fullName: z.string().min(3, "Full name is required.").max(80),
  mobile: z.string().refine((v) => isValidPakistaniMobile(v), "Invalid mobile number."),
  address: z.string().min(5, "Complete address is required.").max(300),
  city: z.string().min(2, "City is required.").max(80),
  province: z.enum(PROVINCES as unknown as [string, ...string[]]),
  postalCode: z.string().max(20).optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

/** GET /api/account/addresses — list own addresses. */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const addresses = await prisma.address.findMany({
    where: { userId: auth.user.id },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });
  return NextResponse.json({ addresses });
}

/** POST /api/account/addresses — create a new address. */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return NextResponse.json(
      { error: first ? first.message : "Invalid address data." },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const address = await prisma.$transaction(async (tx) => {
    if (d.isDefault) {
      await tx.address.updateMany({
        where: { userId: auth.user.id },
        data: { isDefault: false },
      });
    }
    return tx.address.create({
      data: {
        userId: auth.user.id,
        label: d.label?.trim() || "Home",
        fullName: d.fullName.trim(),
        mobile: normalizePakistaniMobile(d.mobile) ?? d.mobile.replace(/\D/g, ""),
        address: d.address.trim(),
        city: d.city.trim(),
        province: d.province,
        postalCode: d.postalCode?.trim() || null,
        isDefault: d.isDefault ?? false,
      },
    });
  });

  return NextResponse.json({ address }, { status: 201 });
}

/** PUT /api/account/addresses {id, ...fields} — update an own address. */
export async function PUT(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));
  const parsed = addressSchema.extend({ id: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return NextResponse.json(
      { error: first ? first.message : "Invalid address data." },
      { status: 400 }
    );
  }
  const { id, ...d } = parsed.data;

  const existing = await prisma.address.findFirst({
    where: { id, userId: auth.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Address not found." }, { status: 404 });
  }

  const address = await prisma.$transaction(async (tx) => {
    if (d.isDefault) {
      await tx.address.updateMany({
        where: { userId: auth.user.id },
        data: { isDefault: false },
      });
    }
    return tx.address.update({
      where: { id },
      data: {
        label: d.label?.trim() || "Home",
        fullName: d.fullName.trim(),
        mobile: normalizePakistaniMobile(d.mobile) ?? d.mobile.replace(/\D/g, ""),
        address: d.address.trim(),
        city: d.city.trim(),
        province: d.province,
        postalCode: d.postalCode?.trim() || null,
        isDefault: d.isDefault ?? false,
      },
    });
  });

  return NextResponse.json({ address });
}

/** DELETE /api/account/addresses?id= — delete an own address. */
export async function DELETE(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Address id is required." }, { status: 400 });
  }

  const existing = await prisma.address.findFirst({
    where: { id, userId: auth.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Address not found." }, { status: 404 });
  }

  await prisma.address.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
