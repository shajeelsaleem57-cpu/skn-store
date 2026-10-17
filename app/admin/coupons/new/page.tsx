import { Breadcrumbs, PageHeader } from "../../_components/ui";
import { CouponForm } from "../_components/CouponForm";

export default function NewCouponPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Coupons", href: "/admin/coupons" }, { label: "New coupon" }]} />
      <PageHeader title="New coupon" />
      <CouponForm coupon={null} />
    </div>
  );
}
