import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ORDER_TIMELINE, ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatPKR, buildWhatsAppLink, normalizePakistaniMobile } from "@/lib/utils";
import { getSetting } from "@/lib/settings";
import {
  Breadcrumbs,
  Card,
  PageHeader,
  Price,
  StatusBadge,
  TableShell,
  Thumb,
  btnSecondary,
} from "../../_components/ui";
import { PrintButton } from "../../_components/client";
import { IconDownload } from "../../_components/icons";
import { OrderStatusForm } from "../_components/OrderStatusForm";
import { OrderConfirmationCard } from "../_components/OrderConfirmationCard";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function fillTemplate(tpl: string, order: { orderNumber: string; fullName: string; total: number }) {
  return tpl
    .replaceAll("{order_id}", order.orderNumber)
    .replaceAll("{name}", order.fullName)
    .replaceAll("{total}", order.total.toLocaleString("en-PK"));
}

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, user: { select: { id: true, name: true, email: true } } },
  });
  if (!order) notFound();

  const adminMsgTemplate = await getSetting(
    "confirm_msg_admin",
    "Assalam-o-Alaikum {name}! SKN Store here. Please reply YES to confirm your order {order_id} (Rs. {total} COD) for dispatch."
  );
  const customerPhone = normalizePakistaniMobile(order.mobile) ?? order.mobile.replace(/\D/g, "");
  const adminWhatsAppHref = buildWhatsAppLink(customerPhone, fillTemplate(adminMsgTemplate, order));

  const timelineIndex = (ORDER_TIMELINE as readonly string[]).indexOf(order.status);
  const isTerminal = ["CANCELLED", "RETURNED", "REFUNDED"].includes(order.status);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Orders", href: "/admin/orders" }, { label: order.orderNumber }]} />
      <PageHeader
        title={`Order ${order.orderNumber}`}
        subtitle={`Placed ${order.createdAt.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={order.status} />
            <PrintButton />
            <Link href={`/admin/orders/${order.id}/print`} className={btnSecondary}>
              Invoice view
            </Link>
            <a href={`/api/admin/orders/export?id=${order.id}`} className={btnSecondary}>
              <IconDownload className="h-4 w-4" /> CSV
            </a>
          </div>
        }
      />

      {/* timeline */}
      <Card title="Status timeline" className="mb-4">
        {isTerminal ? (
          <p className="text-sm">
            This order is <StatusBadge status={order.status} /> — no further fulfillment steps apply.
          </p>
        ) : (
          <ol className="flex flex-wrap items-center gap-1">
            {ORDER_TIMELINE.map((s, i) => {
              const done = timelineIndex >= 0 && i <= timelineIndex;
              const current = i === timelineIndex;
              return (
                <li key={s} className="flex items-center">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      current
                        ? "bg-gray-900 text-white"
                        : done
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-500"
                    )}
                    title={ORDER_STATUS_LABELS[s]}
                  >
                    {ORDER_STATUS_LABELS[s]}
                  </span>
                  {i < ORDER_TIMELINE.length - 1 ? <span className="mx-1 text-gray-300">→</span> : null}
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Items">
            <TableShell headers={["Item", "Price", "Qty", "Total"]}>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <Thumb src={item.image} alt={item.title} />
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        {item.variant ? <p className="text-xs text-gray-500">{item.variant}</p> : null}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-gray-600">{formatPKR(item.price)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-gray-600">{item.qty}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium">
                    <Price value={item.price * item.qty} />
                  </td>
                </tr>
              ))}
            </TableShell>
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd className="font-medium">{formatPKR(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Delivery fee</dt><dd className="font-medium">{formatPKR(order.deliveryFee)}</dd></div>
              {order.discount > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                  <dd className="font-medium text-green-700">−{formatPKR(order.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-gray-100 pt-2 text-base">
                <dt className="font-semibold">Total</dt><dd className="font-bold"><Price value={order.total} /></dd>
              </div>
            </dl>
          </Card>

          <Card title="Customer & delivery">
            <dl className="grid gap-x-6 gap-y-2 text-sm md:grid-cols-2">
              <div><dt className="text-gray-500">Name</dt><dd className="font-medium text-gray-900">{order.fullName}</dd></div>
              <div><dt className="text-gray-500">Mobile</dt><dd className="font-medium text-gray-900">{order.mobile}</dd></div>
              {order.whatsapp ? <div><dt className="text-gray-500">WhatsApp</dt><dd className="font-medium text-gray-900">{order.whatsapp}</dd></div> : null}
              <div><dt className="text-gray-500">City</dt><dd className="font-medium text-gray-900">{order.city}</dd></div>
              <div><dt className="text-gray-500">Province</dt><dd className="font-medium text-gray-900">{order.province}</dd></div>
              {order.postalCode ? <div><dt className="text-gray-500">Postal code</dt><dd className="font-medium text-gray-900">{order.postalCode}</dd></div> : null}
              <div className="md:col-span-2"><dt className="text-gray-500">Address</dt><dd className="font-medium text-gray-900">{order.address}</dd></div>
              {order.notes ? <div className="md:col-span-2"><dt className="text-gray-500">Customer notes</dt><dd className="text-gray-900">{order.notes}</dd></div> : null}
              {order.user ? (
                <div className="md:col-span-2">
                  <dt className="text-gray-500">Account</dt>
                  <dd className="text-gray-900">{order.user.name ?? order.user.email} ({order.user.email})</dd>
                </div>
              ) : (
                <div><dt className="text-gray-500">Account</dt><dd className="text-gray-900">Guest checkout</dd></div>
              )}
            </dl>
          </Card>
        </div>

        <div className="space-y-4">
          <OrderConfirmationCard
            orderId={order.id}
            orderNumber={order.orderNumber}
            status={order.status}
            riskFlagsJson={order.riskFlags}
            customerMobile={order.mobile}
            adminWhatsAppHref={adminWhatsAppHref}
            address={order.address}
            city={order.city}
          />
          <Card title="Fulfillment">
            <OrderStatusForm order={order} />
          </Card>
          {order.trackingUrl ? (
            <Card title="Tracking">
              <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-700 hover:underline">
                Open tracking link
              </a>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
