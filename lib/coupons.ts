import { prisma } from "./prisma";
import { formatPKR } from "./utils";

export type CouponCheck = {
  valid: boolean;
  discount: number;
  message: string;
};

/**
 * Server-side coupon validation shared by /api/coupons/validate and /api/checkout.
 * Code lookup is case-insensitive (codes stored uppercased).
 */
export async function validateCoupon(code: string, subtotal: number): Promise<CouponCheck> {
  const clean = code.trim().toUpperCase();
  if (!clean) {
    return { valid: false, discount: 0, message: "Please enter a coupon code." };
  }
  const coupon = await prisma.coupon.findUnique({ where: { code: clean } });
  if (!coupon || !coupon.isActive) {
    return { valid: false, discount: 0, message: "This coupon code is not valid." };
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { valid: false, discount: 0, message: "This coupon has expired." };
  }
  if (coupon.minOrder != null && subtotal < coupon.minOrder) {
    return {
      valid: false,
      discount: 0,
      message: `This coupon needs a minimum order of ${formatPKR(coupon.minOrder)}.`,
    };
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, discount: 0, message: "This coupon has reached its usage limit." };
  }
  let discount =
    coupon.type === "PERCENT" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount != null && discount > coupon.maxDiscount) {
    discount = coupon.maxDiscount;
  }
  if (discount > subtotal) discount = subtotal;
  if (discount <= 0) {
    return { valid: false, discount: 0, message: "This coupon gives no discount on this order." };
  }
  return { valid: true, discount, message: "Coupon applied successfully." };
}
