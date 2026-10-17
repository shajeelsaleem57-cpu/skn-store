export const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
  "Islamabad Capital Territory",
] as const;

export const ORDER_STATUSES = [
  "NEW",
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "DISPATCHED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: "Order Received",
  PENDING_CONFIRMATION: "Pending Confirmation",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  DISPATCHED: "Dispatched",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
};

/** Ordered timeline steps shown on the Track Order page */
export const ORDER_TIMELINE = [
  "NEW",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "DISPATCHED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/categories" },
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "Best Sellers", href: "/shop?filter=best-sellers" },
  { label: "Deals", href: "/shop?filter=sale" },
  { label: "Track Order", href: "/track-order" },
  { label: "Contact", href: "/contact" },
];

export const MOBILE_BOTTOM_NAV = [
  { label: "Home", href: "/" },
  { label: "Categories", href: "/categories" },
  { label: "Search", href: "/search" },
  { label: "Cart", href: "/cart" },
  { label: "Account", href: "/account" },
];

export const DELIVERY_FEE_FLAT = 250;
export const FREE_DELIVERY_THRESHOLD: number | null = null; // set to e.g. 5000 to enable
