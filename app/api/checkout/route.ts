import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROVINCES, DELIVERY_FEE_FLAT, FREE_DELIVERY_THRESHOLD } from "@/lib/constants";
import {
  isValidPakistaniMobile,
  normalizePakistaniMobile,
  generateOrderNumber,
  effectivePrice,
  parseImages,
} from "@/lib/utils";
import { validateCoupon } from "@/lib/coupons";

const checkoutSchema = z.object({
  customer: z.object({
    fullName: z.string().min(3, "Full name is required."),
    mobile: z
      .string()
      .refine((v) => isValidPakistaniMobile(v), "Invalid mobile number."),
    whatsapp: z.string().optional().or(z.literal("")),
    address: z.string().min(5, "Complete address is required."),
    city: z.string().min(2, "City is required."),
    province: z.enum(PROVINCES as unknown as [string, ...string[]]),
    postalCode: z.string().optional().or(z.literal("")),
    notes: z.string().max(500).optional().or(z.literal("")),
  }),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        qty: z.number().int().min(1).max(99),
        variant: z.string().optional(),
      })
    )
    .min(1, "Your cart is empty."),
  couponCode: z.string().optional().or(z.literal("")),
});

/**
 * Cart line ids are `${productId}::${variantId1},${variantId2}` when variants
 * were chosen, or just `${productId}`. Split them back apart server-side.
 */
function splitLineId(id: string): { productId: string; variantIds: string[] } {
  const [productId, variantPart] = id.split("::");
  const variantIds = variantPart
    ? variantPart.split(",").map((v) => v.trim()).filter(Boolean)
    : [];
  return { productId, variantIds };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return NextResponse.json(
      { error: first ? `${first.path.join(".")}: ${first.message}` : "Invalid order data." },
      { status: 400 }
    );
  }

  const { customer, items, couponCode } = parsed.data;
  const mobile = normalizePakistaniMobile(customer.mobile) ?? customer.mobile.replace(/\D/g, "");
  const whatsappRaw = customer.whatsapp?.trim();
  const whatsapp = whatsappRaw ? normalizePakistaniMobile(whatsappRaw) ?? whatsappRaw : null;

  // Optional: attach the order to the logged-in account.
  let userId: string | null = null;
  try {
    const session = await getServerSession(authOptions);
    const sUser = session?.user as { id?: string } | undefined;
    if (sUser?.id) userId = sUser.id;
  } catch {
    userId = null;
  }

  try {
    // Re-fetch every product server-side — never trust client prices.
    const lines: {
      productId: string;
      title: string;
      variantLabel: string | null;
      unitPrice: number;
      qty: number;
      image: string | null;
    }[] = [];
    let subtotal = 0;

    for (const item of items) {
      const { productId, variantIds } = splitLineId(item.id);
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { variants: true },
      });
      if (!product || !product.isPublished) {
        return NextResponse.json(
          { error: "One of the products in your cart is no longer available." },
          { status: 400 }
        );
      }
      if (product.stock < item.qty) {
        return NextResponse.json(
          { error: `Sorry, "${product.title}" only has ${product.stock} in stock.` },
          { status: 400 }
        );
      }

      // Validate the chosen variants belong to this product and sum price adjustments.
      let priceAdjust = 0;
      let variantLabel: string | null = null;
      if (variantIds.length > 0) {
        const chosen = product.variants.filter((v) => variantIds.includes(v.id));
        if (chosen.length !== variantIds.length) {
          return NextResponse.json(
            { error: `Invalid variant selection for "${product.title}".` },
            { status: 400 }
          );
        }
        priceAdjust = chosen.reduce((sum, v) => sum + v.priceAdjust, 0);
        variantLabel = chosen.map((v) => `${v.name}: ${v.value}`).join(", ");
      }

      const unitPrice = effectivePrice(product.price, product.salePrice) + priceAdjust;
      subtotal += unitPrice * item.qty;
      const images = parseImages(product.images);
      lines.push({
        productId: product.id,
        title: product.title,
        variantLabel,
        unitPrice,
        qty: item.qty,
        image: images[0] ?? null,
      });
    }

    // Coupon (optional).
    let discount = 0;
    const cleanCode = (couponCode || "").trim().toUpperCase();
    if (cleanCode) {
      const check = await validateCoupon(cleanCode, subtotal);
      if (!check.valid) {
        return NextResponse.json({ error: check.message }, { status: 400 });
      }
      discount = check.discount;
    }

    const deliveryFee =
      FREE_DELIVERY_THRESHOLD != null && subtotal - discount >= FREE_DELIVERY_THRESHOLD
        ? 0
        : DELIVERY_FEE_FLAT;
    const total = Math.max(0, subtotal - discount) + deliveryFee;

    const orderNumber = generateOrderNumber();

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          status: "NEW",
          userId,
          fullName: customer.fullName.trim(),
          mobile,
          whatsapp,
          address: customer.address.trim(),
          city: customer.city.trim(),
          province: customer.province,
          postalCode: customer.postalCode?.trim() || null,
          notes: customer.notes?.trim() || null,
          subtotal,
          deliveryFee,
          discount,
          total,
          couponCode: cleanCode || null,
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              title: l.title,
              variant: l.variantLabel,
              price: l.unitPrice,
              qty: l.qty,
              image: l.image,
            })),
          },
        },
      });

      for (const l of lines) {
        await tx.product.update({
          where: { id: l.productId },
          data: { stock: { decrement: l.qty }, soldCount: { increment: l.qty } },
        });
      }

      if (cleanCode) {
        await tx.coupon.update({
          where: { code: cleanCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      return order;
    });

    return NextResponse.json({ orderNumber }, { status: 201 });
  } catch (err) {
    console.error("Checkout failed:", err);
    return NextResponse.json(
      { error: "Could not place your order. Please try again." },
      { status: 500 }
    );
  }
}
