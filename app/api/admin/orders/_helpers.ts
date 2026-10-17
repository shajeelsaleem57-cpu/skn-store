import { Prisma } from "@prisma/client";
import { ORDER_STATUSES } from "@/lib/constants";

export const PAGE_SIZE = 20;


export function buildOrderWhere(sp: URLSearchParams): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};
  const q = sp.get("q")?.trim();
  if (q) {
    where.OR = [
      { orderNumber: { contains: q } },
      { fullName: { contains: q } },
      { mobile: { contains: q } },
    ];
  }
  const status = sp.get("status")?.trim();
  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) {
    where.status = status;
  }
  const date = sp.get("date")?.trim();
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T00:00:00`);
    end.setDate(end.getDate() + 1);
    where.createdAt = { gte: start, lt: end };
  }
  const id = sp.get("id")?.trim();
  if (id) where.id = id;
  return where;
}
