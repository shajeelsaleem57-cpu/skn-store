import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs, PageHeader } from "../../_components/ui";
import { CouponForm } from "../_components/CouponForm";

export default async function EditCouponPage({ params }: { params: { id: string } }) {
  const coupon = await prisma.coupon.findUnique({ where: { id: params.id } });
  if (!coupon) notFound();

  return (
    <div>
      <Breadcrumbs items={[{ label: "Coupons", href: "/admin/coupons" }, { label: "Edit coupon" }]} />
      <PageHeader title="Edit coupon" subtitle={coupon.code} />
      <CouponForm coupon={coupon} />
    </div>
  );
}
