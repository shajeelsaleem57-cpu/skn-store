import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { formatPKR } from "@/lib/utils";
import { PrintButton } from "../../../_components/client";

export const dynamic = "force-dynamic";

export default async function OrderPrintPage({ params }: { params: { id: string } }) {
  const [order, storeName, contactEmail, contactAddress, whatsappDisplay] = await Promise.all([
    prisma.order.findUnique({ where: { id: params.id }, include: { items: true } }),
    getSetting("store_name", "SKN Store"),
    getSetting("contact_email", ""),
    getSetting("contact_address", ""),
    getSetting("whatsapp_display", ""),
  ]);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl bg-white p-6 md:p-10">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="no-print mb-6 flex items-center gap-3">
        <PrintButton label="Print invoice" />
        <Link href={`/admin/orders/${order.id}`} className="text-sm text-gray-600 hover:underline">
          Back to order
        </Link>
      </div>

      <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4">
        <div>
          <h1 className="text-2xl font-bold">{storeName}</h1>
          {contactAddress ? <p className="mt-1 text-sm text-gray-600">{contactAddress}</p> : null}
          <p className="text-sm text-gray-600">
            {[contactEmail, whatsappDisplay].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">INVOICE</p>
          <p className="text-sm text-gray-600">{order.orderNumber}</p>
          <p className="text-sm text-gray-600">
            {order.createdAt.toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="font-semibold uppercase tracking-wide text-gray-500">Bill to</p>
          <p className="mt-1 font-medium">{order.fullName}</p>
          <p>{order.address}</p>
          <p>{order.city}, {order.province}{order.postalCode ? ` ${order.postalCode}` : ""}</p>
          <p>{order.mobile}</p>
        </div>
        <div>
          <p className="font-semibold uppercase tracking-wide text-gray-500">Payment</p>
          <p className="mt-1">Cash on Delivery</p>
          {order.couponCode ? <p>Coupon: {order.couponCode}</p> : null}
        </div>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-gray-300 text-left">
            <th className="py-2 pr-4">Item</th>
            <th className="py-2 pr-4 text-right">Price</th>
            <th className="py-2 pr-4 text-right">Qty</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-2 pr-4">
                {item.title}
                {item.variant ? <span className="text-gray-500"> ({item.variant})</span> : null}
              </td>
              <td className="py-2 pr-4 text-right">{formatPKR(item.price)}</td>
              <td className="py-2 pr-4 text-right">{item.qty}</td>
              <td className="py-2 text-right font-medium">{formatPKR(item.price * item.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <dl className="w-64 space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd>{formatPKR(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-600">Delivery</dt><dd>{formatPKR(order.deliveryFee)}</dd></div>
          {order.discount > 0 ? (
            <div className="flex justify-between"><dt className="text-gray-600">Discount</dt><dd>−{formatPKR(order.discount)}</dd></div>
          ) : null}
          <div className="flex justify-between border-t border-gray-900 pt-2 text-base font-bold">
            <dt>Total</dt><dd>{formatPKR(order.total)}</dd>
          </div>
        </dl>
      </div>

      {order.notes ? (
        <p className="mt-6 text-sm text-gray-600"><span className="font-semibold">Customer notes:</span> {order.notes}</p>
      ) : null}

      <p className="mt-10 text-center text-xs text-gray-400">Thank you for shopping with {storeName}.</p>
    </div>
  );
}
