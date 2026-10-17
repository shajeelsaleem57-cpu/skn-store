import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// ---------------------------------------------------------------- categories
const CATEGORY_TREE: { name: string; description: string; subs: string[] }[] = [
  {
    name: "Home & Living",
    description: "Practical products for a better organized home.",
    subs: ["Storage", "Organization", "Kitchen", "Cleaning", "Home Accessories"],
  },
  {
    name: "Modern Tech",
    description: "Smart gadgets and everyday tech accessories.",
    subs: ["Gadgets", "Mobile Accessories", "Desk Accessories", "Smart Devices"],
  },
  {
    name: "Electronics",
    description: "Useful electronics and accessories for home and work.",
    subs: ["Accessories", "Utility Electronics", "Lighting"],
  },
  {
    name: "Beauty & Personal Care",
    description: "Beauty tools and personal care essentials.",
    subs: ["Beauty Tools", "Personal Care", "Accessories"],
  },
  {
    name: "Lifestyle",
    description: "Everyday essentials for travel, fitness and life.",
    subs: ["Travel", "Fitness", "Everyday Essentials"],
  },
];

// ------------------------------------------------------------------- products
type SeedProduct = {
  title: string;
  price: number;
  salePrice?: number;
  stock: number;
  images: string[];
  shortDescription: string;
  description: string;
  specifications: Record<string, string>;
  category: string; // subcategory name
  isBestSeller?: boolean;
  isFeatured?: boolean;
  sku: string;
};

const PRODUCTS: SeedProduct[] = [
  {
    title: "ÉCLAT NOIR Eau de Parfum 100ml",
    price: 4499,
    salePrice: 3799,
    stock: 48,
    images: ["/images/eclat-noir.jpg"],
    shortDescription:
      "A bold, long-lasting eau de parfum in a black bottle with a gold cap. Made for evenings that matter.",
    description:
      "<p>ÉCLAT NOIR is our signature fragrance — a deep, confident eau de parfum presented in a glossy black bottle with a textured gold cap and gold label.</p><p>Designed for long wear: a few sprays in the morning carry you through the day and into the night. The 100ml bottle is generous enough for daily use and elegant enough for your shelf.</p><p>Cash on delivery available across Pakistan.</p>",
    specifications: {
      Volume: "100 ml / 3.4 fl. oz.",
      Type: "Eau de Parfum",
      "Bottle finish": "Glossy black glass, gold cap",
      "Suitable for": "Daily wear and evenings",
    },
    category: "Personal Care",
    isBestSeller: true,
    isFeatured: true,
    sku: "SKN-EN-100",
  },
  {
    title: "Rose Gold Heart Pendant Necklace",
    price: 1899,
    salePrice: 1499,
    stock: 120,
    images: ["/images/necklace.jpg"],
    shortDescription:
      "A delicate rose-gold heart pendant set with sparkling stones. An everyday piece that dresses up anything.",
    description:
      "<p>This rose-gold heart pendant necklace pairs a fine chain with a crystal-set open heart pendant — light enough for daily wear, polished enough for evenings out.</p><p>Tarnish-resistant finish and a secure clasp. Arrives in a gift-ready box, so it works as well as a present as it does a treat for yourself.</p>",
    specifications: {
      Material: "Rose gold plated alloy",
      Pendant: "Open heart, crystal set",
      "Chain length": "Adjustable 40–45 cm",
      "Box included": "Yes",
    },
    category: "Accessories",
    isBestSeller: true,
    isFeatured: true,
    sku: "SKN-NK-201",
  },
  {
    title: "Stainless Steel Vacuum Flask 1L",
    price: 1499,
    salePrice: 1199,
    stock: 85,
    images: ["https://picsum.photos/seed/skn1/800/800"],
    shortDescription: "Keeps chai hot for 12 hours and water cold for 24. Leak-proof 1 litre flask.",
    description:
      "<p>Double-wall vacuum insulation keeps drinks hot or cold for hours. The 1-litre size suits families and offices, and the leak-proof lid means it travels safely in a bag.</p>",
    specifications: { Capacity: "1 litre", Material: "304 stainless steel", "Hot retention": "Up to 12 hours", "Cold retention": "Up to 24 hours" },
    category: "Kitchen",
    sku: "SKN-HL-301",
  },
  {
    title: "LED Desk Lamp with Wireless Charger",
    price: 2999,
    salePrice: 2499,
    stock: 40,
    images: ["https://picsum.photos/seed/skn2/800/800"],
    shortDescription: "Dimmable LED desk lamp with a built-in 10W wireless charging pad.",
    description:
      "<p>Study or work late with eye-friendly dimmable light, and charge your phone by simply resting it on the lamp base — no cables on the desk.</p>",
    specifications: { "Charging": "10W Qi wireless", "Brightness": "3 levels, dimmable", Power: "USB-C powered", "Arm": "Adjustable gooseneck" },
    category: "Desk Accessories",
    isFeatured: true,
    sku: "SKN-MT-302",
  },
  {
    title: "Bluetooth Earbuds Pro",
    price: 3499,
    salePrice: 2999,
    stock: 65,
    images: ["https://picsum.photos/seed/skn3/800/800"],
    shortDescription: "Noise-reducing Bluetooth earbuds with 30-hour case battery.",
    description:
      "<p>Clear calls, deep bass and a pocketable charging case that stretches total playtime to 30 hours. Touch controls for music, calls and voice assistant.</p>",
    specifications: { Bluetooth: "5.3", "Playtime": "6h + 24h case", "Charging": "USB-C", "Water resistance": "IPX4" },
    category: "Accessories",
    isBestSeller: true,
    sku: "SKN-EL-303",
  },
  {
    title: "Electric Lint Remover",
    price: 1299,
    salePrice: 999,
    stock: 150,
    images: ["https://picsum.photos/seed/skn4/800/800"],
    shortDescription: "Rechargeable fabric shaver that refreshes sweaters, coats and upholstery.",
    description:
      "<p>Bring pilling sweaters and winter coats back to life in minutes. USB rechargeable with a large lint container and gentle-on-fabric blades.</p>",
    specifications: { Power: "USB rechargeable", "Blades": "3-blade rotary", "Container": "Large detachable", "Use on": "Sweaters, coats, sofas" },
    category: "Cleaning",
    sku: "SKN-HL-304",
  },
  {
    title: "Facial Ice Roller & Stone Set",
    price: 999,
    salePrice: 749,
    stock: 200,
    images: ["https://picsum.photos/seed/skn5/800/800"],
    shortDescription: "Cooling facial roller and massage stone set for a fresh morning routine.",
    description:
      "<p>A two-piece skincare tool set: a cooling ice roller to de-puff mornings and a smooth massage stone for evening routines. Chill the roller for extra effect.</p>",
    specifications: { Pieces: "2 (roller + stone)", Material: "Stainless roller, stone", Care: "Rinse after use" },
    category: "Beauty Tools",
    sku: "SKN-BT-305",
  },
  {
    title: "Foldable Storage Box Organizer",
    price: 1799,
    salePrice: 1449,
    stock: 90,
    images: ["https://picsum.photos/seed/skn6/800/800"],
    shortDescription: "Sturdy foldable storage boxes — wardrobes, toys and clutter, sorted.",
    description:
      "<p>Set of foldable fabric storage boxes with reinforced sides and easy-pull handles. Folds flat when not in use; wipes clean.</p>",
    specifications: { Material: "Non-woven fabric, reinforced", "Foldable": "Yes", Handles: "2 side handles", Care: "Wipe clean" },
    category: "Storage",
    sku: "SKN-HL-306",
  },
  {
    title: "USB Rechargeable Mini Fan",
    price: 1599,
    salePrice: 1299,
    stock: 110,
    images: ["https://picsum.photos/seed/skn7/800/800"],
    shortDescription: "Quiet handheld mini fan with 3 speeds — for load-shedding days and commutes.",
    description:
      "<p>A pocket-sized fan with three speed settings and a long-lasting rechargeable battery. Folds flat, fits in a handbag, and runs quietly.</p>",
    specifications: { Speeds: "3", Battery: "USB rechargeable", Noise: "Low-noise motor", Design: "Foldable handle" },
    category: "Gadgets",
    sku: "SKN-MT-307",
  },
  {
    title: "Posture Corrector Belt",
    price: 1199,
    salePrice: 899,
    stock: 140,
    images: ["https://picsum.photos/seed/skn8/800/800"],
    shortDescription: "Adjustable posture support belt for desk workers — comfortable under clothes.",
    description:
      "<p>Gentle, adjustable support that reminds your shoulders to sit back during long desk hours. Breathable straps, discreet under clothing, unisex sizing.</p>",
    specifications: { Sizes: "Adjustable, unisex", Material: "Breathable neoprene blend", "Wear time": "Start with 30 min/day", Care: "Hand wash" },
    category: "Fitness",
    sku: "SKN-LS-308",
  },
];

// ------------------------------------------------------------------ settings
const SETTINGS: [string, string][] = [
  ["store_name", "SKN Store"],
  ["site_url", "https://sknstore.online"],
  ["whatsapp_number", "923287533227"],
  ["whatsapp_display", "0328 7533227"],
  ["announcement_bar", "Cash on Delivery available across Pakistan — 2–4 working day delivery"],
  ["announcement_visible", "true"],
  ["confirm_require", "1"],
  ["confirm_msg_customer", "Assalam-o-Alaikum! I confirm my COD order {order_id}. Name: {name}, Total: Rs. {total}."],
  ["confirm_msg_admin", "Assalam-o-Alaikum {name}! SKN Store here. Please reply YES to confirm your order {order_id} (Rs. {total} COD) for dispatch."],
  ["riskflag_invalid_phone", "1"],
  ["riskflag_dup_cancelled", "1"],
  ["riskflag_refused_address", "1"],
  ["currency", "PKR"],
  ["delivery_info", "2–4 working days across Pakistan"],
  ["return_info", "15-day return service"],
  ["contact_email", "support@sknstore.online"],
  ["contact_address", "Karachi, Pakistan"],
  ["colors", JSON.stringify({
    primary: "#111111", secondary: "#2B2B2B", background: "#FFFFFF",
    softBg: "#F7F7F7", accent: "#C8A96B", success: "#16803C", sale: "#C62828",
    text: "#171717", mutedText: "#6B7280", border: "#E5E5E5",
    warning: "#B45309", error: "#B91C1C", cardBg: "#FFFFFF", radius: "12px",
  })],
  ["social_facebook", ""],
  ["social_instagram", ""],
  ["social_tiktok", ""],
  ["social_youtube", ""],
  ["meta_title", "SKN Store — Smart Products. Better Living."],
  ["meta_description", "Shop practical, modern and affordable products delivered across Pakistan with Cash on Delivery."],
];

// ---------------------------------------------------------- homepage sections
const SECTIONS = [
  {
    name: "Hero",
    type: "hero",
    sortOrder: 1,
    config: {
      heading: "Smart Products. Better Living.",
      description: "Discover practical, modern and affordable products delivered across Pakistan.",
      ctaText: "Shop Now",
      ctaUrl: "/shop",
      secondaryCtaText: "Explore Categories",
      secondaryCtaUrl: "/categories",
      image: "https://picsum.photos/seed/sknhero/1600/800",
      background: "#F7F7F7",
      alignment: "left",
    },
  },
  {
    name: "Trust Strip",
    type: "trust_strip",
    sortOrder: 2,
    config: {
      items: [
        { title: "Fast Delivery", text: "2–4 Working Days" },
        { title: "Cash on Delivery", text: "Available Across Pakistan" },
        { title: "Parcel Inspection", text: "Check Before Acceptance Where Applicable" },
        { title: "15-Day Returns", text: "Easy Return Service" },
        { title: "WhatsApp Support", text: "Quick Customer Assistance" },
      ],
    },
  },
  { name: "Category Showcase", type: "categories", sortOrder: 3, config: { heading: "Shop by Category", limit: 5 } },
  { name: "Best Sellers", type: "best_sellers", sortOrder: 4, config: { heading: "Best Sellers", limit: 8 } },
  {
    name: "Flash Deal",
    type: "flash_deal",
    sortOrder: 5,
    config: {
      heading: "Deal of the Week",
      description: "ÉCLAT NOIR Eau de Parfum at a special price — this week only.",
      productSlug: "eclat-noir-eau-de-parfum-100ml",
      countdownEnabled: false,
      endsAt: "",
      ctaText: "Grab the Deal",
    },
  },
  {
    name: "Why SKN Store",
    type: "why_us",
    sortOrder: 6,
    config: {
      heading: "Why Shop With SKN Store?",
      items: [
        { title: "Quality Products", text: "Carefully selected products for everyday use." },
        { title: "Fast Delivery", text: "Orders delivered within approximately 2–4 working days." },
        { title: "Cash on Delivery", text: "Shop conveniently and pay when your order arrives." },
        { title: "Customer Support", text: "Get assistance through WhatsApp." },
        { title: "15-Day Return Service", text: "Return eligible products according to our return policy." },
      ],
    },
  },
  { name: "Customer Reviews", type: "reviews", sortOrder: 7, config: { heading: "What Customers Say", limit: 6 } },
];

// --------------------------------------------------------------------- pages
const PAGES: { slug: string; title: string; content: string; seoDescription: string }[] = [
  {
    slug: "about",
    title: "About Us",
    seoDescription: "Learn about SKN Store — a Pakistani online store for practical, modern products with Cash on Delivery.",
    content: `<h2>About SKN Store</h2><p>SKN Store is a Pakistani online store built around one simple idea: everyday products should be easy to buy. We select practical, modern and affordable items — from home essentials to tech accessories and personal care — and deliver them across Pakistan.</p><p>Every order is Cash on Delivery, so you pay only when your parcel arrives. Our support team is reachable on WhatsApp for quick help with orders, tracking and returns.</p><h3>What we stand for</h3><ul><li>Honest pricing in PKR — no hidden charges</li><li>Carefully checked products before they go live</li><li>Delivery in 2–4 working days across Pakistan</li><li>15-day return service on eligible items</li></ul><p>Thank you for shopping with us.</p>`,
  },
  {
    slug: "contact",
    title: "Contact Us",
    seoDescription: "Contact SKN Store — WhatsApp support, email and answers to common questions.",
    content: `<h2>Contact Us</h2><p>The fastest way to reach us is WhatsApp — we reply during working hours, 7 days a week.</p><p><strong>WhatsApp:</strong> 0328 7533227<br><strong>Email:</strong> support@sknstore.online</p><p>For order questions, please keep your order number ready (it looks like SKN-20261011-0001) so we can help you faster.</p>`,
  },
  {
    slug: "shipping-policy",
    title: "Shipping Policy",
    seoDescription: "SKN Store shipping policy — delivery times, charges and coverage across Pakistan.",
    content: `<h2>Shipping Policy</h2><p>We deliver to all major cities and towns across Pakistan.</p><h3>Delivery time</h3><p>Orders are delivered within approximately <strong>2–4 working days</strong>. Remote areas may take a little longer.</p><h3>Delivery charges</h3><p>A flat delivery fee applies per order and is shown clearly at checkout before you place your order. Orders are dispatched within 24 hours of confirmation.</p><h3>Parcel inspection</h3><p>Where the courier permits, you may check your parcel before accepting it, according to our inspection and return policy.</p>`,
  },
  {
    slug: "return-refund-policy",
    title: "Return & Refund Policy",
    seoDescription: "SKN Store 15-day return service — terms, process and refunds.",
    content: `<h2>Return & Refund Policy</h2><p>We offer a <strong>15-day return service</strong> from the date of delivery, subject to the terms below.</p><h3>Eligible for return</h3><ul><li>Item is unused, unwashed and in original packaging</li><li>Item arrived damaged, defective or different from what was ordered</li></ul><h3>Not eligible</h3><ul><li>Items damaged by misuse after delivery</li><li>Final-sale items marked as non-returnable on the product page</li></ul><h3>How to request a return</h3><p>Message us on WhatsApp (0328 7533227) with your order number and a photo of the item. We will confirm pickup or exchange instructions.</p><h3>Refunds</h3><p>For Cash on Delivery orders, approved refunds are sent via bank transfer, JazzCash or Easypaisa within 7 working days of receiving the returned item.</p>`,
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    seoDescription: "How SKN Store collects, uses and protects your personal information.",
    content: `<h2>Privacy Policy</h2><p>We collect only the information needed to run your order: your name, phone number, delivery address and order details.</p><h3>How we use it</h3><ul><li>To confirm, deliver and support your orders</li><li>To contact you about delivery or returns</li><li>To improve our store and product selection</li></ul><p>We never sell your personal information. Payment on delivery means we never see or store your card or bank details.</p><h3>Your rights</h3><p>You may ask us to correct or delete your personal information at any time by contacting support@sknstore.online.</p>`,
  },
  {
    slug: "terms-conditions",
    title: "Terms & Conditions",
    seoDescription: "Terms and conditions for shopping at SKN Store.",
    content: `<h2>Terms & Conditions</h2><p>By placing an order at SKN Store, you agree to the following terms.</p><h3>Orders</h3><p>All orders are confirmed by phone or WhatsApp before dispatch. We may cancel orders with incorrect contact details or undeliverable addresses.</p><h3>Pricing</h3><p>All prices are in Pakistani Rupees (PKR) and include applicable taxes. Prices may change; the price at checkout is final.</p><h3>Delivery</h3><p>Estimated delivery is 2–4 working days. Delays caused by couriers, weather or public holidays are outside our control but we will keep you informed.</p><h3>Fair use</h3><p>Accounts or orders showing abuse of the return policy or COD system may be restricted.</p>`,
  },
  {
    slug: "cod-policy",
    title: "Cash on Delivery Policy",
    seoDescription: "How Cash on Delivery works at SKN Store.",
    content: `<h2>Cash on Delivery Policy</h2><p>Cash on Delivery (COD) is our primary payment method — simple and trusted.</p><ul><li>Pay in cash when your parcel arrives at your doorstep.</li><li>Please keep the exact amount ready where possible.</li><li>Our team confirms every order by phone or WhatsApp before dispatch — please answer so your order ships on time.</li><li>Repeated refusal of confirmed COD parcels may lead to advance-payment requirements on future orders.</li></ul>`,
  },
  {
    slug: "cancellation-policy",
    title: "Order Cancellation Policy",
    seoDescription: "How to cancel an order at SKN Store.",
    content: `<h2>Order Cancellation Policy</h2><p>You may cancel your order free of charge before it is dispatched. Message us on WhatsApp (0328 7533227) with your order number.</p><p>Once a parcel is dispatched, cancellation is no longer possible — you may refuse delivery or use the 15-day return service instead.</p>`,
  },
  {
    slug: "faq",
    title: "Frequently Asked Questions",
    seoDescription: "Answers to common questions about ordering, delivery, payment and returns at SKN Store.",
    content: `<h2>Frequently Asked Questions</h2><p>Quick answers to the questions we hear most. For anything else, WhatsApp us at 0328 7533227.</p>`,
  },
];

// ------------------------------------------------------------------ blog
const BLOG = [
  {
    slug: "cod-online-shopping-pakistan-guide",
    title: "Cash on Delivery Shopping in Pakistan: A Simple Guide",
    excerpt: "How COD works, what to check at your doorstep, and how to shop safely online in Pakistan.",
    category: "Guides",
    tags: ["COD", "Pakistan", "shopping guide"],
    author: "SKN Store",
    content: `<p>Cash on Delivery remains the most trusted way to shop online in Pakistan. Here is how to make the most of it.</p><h2>How COD works</h2><p>You place an order online, the store confirms it by phone, and you pay in cash when the rider hands you the parcel. No cards, no advance payment, no risk of paying for something that never arrives.</p><h2>What to check at the doorstep</h2><ul><li>Match the parcel against your order confirmation message</li><li>Where the courier allows, inspect the item before accepting</li><li>Keep your order number until the return window closes</li></ul><h2>Shopping safely</h2><p>Order from stores with a real WhatsApp number, clear return policy and PKR pricing. A store that confirms your order by phone before dispatch is a store that takes your order seriously.</p>`,
  },
  {
    slug: "how-to-track-your-order",
    title: "How to Track Your SKN Store Order",
    excerpt: "Use the Track Order page with your order number and mobile number to follow your parcel.",
    category: "Help",
    tags: ["tracking", "orders"],
    author: "SKN Store",
    content: `<p>Every SKN Store order gets a tracking number like SKN-20261011-0001. Open the Track Order page, enter your order number and the mobile number used at checkout, and you will see exactly where your parcel is — from confirmation to dispatch to delivery.</p><p>If the status has not moved for more than 2 working days, message us on WhatsApp at 0328 7533227 with your order number and we will check with the courier.</p>`,
  },
];

// ------------------------------------------------------------------ faqs
const FAQS = [
  {
    question: "How long does delivery take?",
    answer: "Orders are delivered within approximately 2–4 working days across Pakistan. Remote areas may take slightly longer.",
    sortOrder: 1,
  },
  {
    question: "Do you offer Cash on Delivery?",
    answer: "Yes. Cash on Delivery is our primary payment method — you pay in cash when your parcel arrives.",
    sortOrder: 2,
  },
  {
    question: "What is your return policy?",
    answer: "We offer a 15-day return service on eligible items. See our Return & Refund Policy page for full terms.",
    sortOrder: 3,
  },
];

// -------------------------------------------------------------------- main
async function main() {
  console.log("Seeding SKN Store...");

  // Clean existing data (idempotent seed)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.homepageSection.deleteMany();
  await prisma.page.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.faq.deleteMany();

  // Categories
  const subByName = new Map<string, string>();
  for (const [i, cat] of Array.from(CATEGORY_TREE.entries())) {
    const parent = await prisma.category.create({
      data: { name: cat.name, slug: slugify(cat.name), description: cat.description, sortOrder: i, isVisible: true },
    });
    for (const [j, sub] of Array.from(cat.subs.entries())) {
      const s = await prisma.category.create({
        data: { name: sub, slug: slugify(`${cat.name}-${sub}`), parentId: parent.id, sortOrder: j, isVisible: true },
      });
      subByName.set(sub, s.id);
    }
  }
  console.log(`Created ${CATEGORY_TREE.length} parent categories with subcategories`);

  // Products
  for (const p of PRODUCTS) {
    await prisma.product.create({
      data: {
        title: p.title,
        slug: slugify(p.title),
        sku: p.sku,
        price: p.price,
        salePrice: p.salePrice ?? null,
        stock: p.stock,
        lowStockThreshold: 5,
        images: JSON.stringify(p.images),
        shortDescription: p.shortDescription,
        description: p.description,
        specifications: JSON.stringify(p.specifications),
        isPublished: true,
        isFeatured: p.isFeatured ?? false,
        isBestSeller: p.isBestSeller ?? false,
        publishedAt: new Date(),
        categoryId: subByName.get(p.category) ?? null,
        seoTitle: `${p.title} — SKN Store`,
        seoDescription: p.shortDescription,
        ratingAvg: 0,
        ratingCount: 0,
        soldCount: 0,
      },
    });
  }
  console.log(`Created ${PRODUCTS.length} products`);

  // Admin user
  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);
  await prisma.user.create({
    data: { name: "Store Admin", email: "admin@sknstore.online", passwordHash, role: "admin" },
  });
  console.log("Created admin user admin@sknstore.online");

  // Settings
  for (const [key, value] of SETTINGS) {
    await prisma.siteSetting.create({ data: { key, value } });
  }
  console.log(`Created ${SETTINGS.length} site settings`);

  // Homepage sections
  for (const s of SECTIONS) {
    await prisma.homepageSection.create({
      data: { name: s.name, type: s.type, sortOrder: s.sortOrder, isVisible: true, config: JSON.stringify(s.config) },
    });
  }
  console.log(`Created ${SECTIONS.length} homepage sections`);

  // Pages
  for (const p of PAGES) {
    await prisma.page.create({
      data: { slug: p.slug, title: p.title, content: p.content, seoTitle: `${p.title} — SKN Store`, seoDescription: p.seoDescription, isPublished: true },
    });
  }
  console.log(`Created ${PAGES.length} pages`);

  // Blog
  for (const b of BLOG) {
    await prisma.blogPost.create({
      data: { ...b, tags: JSON.stringify(b.tags), seoTitle: `${b.title} — SKN Store Blog`, isPublished: true, publishedAt: new Date() },
    });
  }
  console.log(`Created ${BLOG.length} blog posts`);

  // FAQs
  for (const f of FAQS) {
    await prisma.faq.create({ data: { ...f, isVisible: true } });
  }
  console.log(`Created ${FAQS.length} FAQs`);

  // Coupon
  await prisma.coupon.create({
    data: { code: "WELCOME10", type: "PERCENT", value: 10, minOrder: 1000, maxDiscount: 500, isActive: true, usageLimit: 500 },
  });
  console.log("Created coupon WELCOME10");

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
