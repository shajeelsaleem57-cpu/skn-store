import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateCoupon } from "@/lib/coupons";

const schema = z.object({
  code: z.string().min(1),
  subtotal: z.number().min(0),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, discount: 0, message: "Invalid request." });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      valid: false,
      discount: 0,
      message: "Invalid request.",
    });
  }
  const result = await validateCoupon(parsed.data.code, parsed.data.subtotal);
  return NextResponse.json(result);
}
