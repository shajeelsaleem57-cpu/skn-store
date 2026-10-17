# SKN Store — Build Log

## 2026-10-11 — Foundation layer (layout shell, chrome, shared UI primitives)

Built the site foundation per spec: design tokens, root + shop layouts, header/footer
chrome, cart/toast providers, and shared UI components. All business content
(store name, WhatsApp, announcement, colors) reads from `SiteSetting` via
`lib/settings` — nothing hard-coded. No emojis in UI; SVG icons only.
Mobile-first, no horizontal overflow; Tailwind classes only.

Files written:
- `app/globals.css` — CSS var defaults, Tailwind directives, body base styles,
  smooth-scroll (prefers-reduced-motion guarded), skeleton shimmer, `.no-scrollbar`,
  focus-visible, print `.no-print` hiding.
- `app/layout.tsx` — server root layout; inline CSS vars from `getColors()`,
  metadata (title template/description from settings), wraps children in
  `CartProvider` + `ToastProvider`. System font stack, no next/font.
- `app/(shop)/layout.tsx` — storefront chrome: `SiteHeader`, `main`, `SiteFooter`,
  `WhatsAppFloat`, `MobileBottomNav`, `CartDrawer` (+ mobile bottom spacer).
- `components/Icons.tsx` — 35 named inline-SVG icons (stroke currentColor).
- `components/SiteHeader.tsx` (+ `CartButton.tsx`, `MobileMenu.tsx` client helpers) —
  async server component: announcement bar, utility bar, wordmark, SearchBar,
  account/wishlist/cart actions, desktop nav from NAV_LINKS, mobile slide-in menu.
- `components/SiteFooter.tsx` — 4 columns + bottom bar (copyright, COD badge,
  WhatsApp display number); socials render only when URLs are set in settings.
- `components/WhatsAppFloat.tsx`, `components/MobileBottomNav.tsx` (client,
  safe-area padding, cart badge), `components/CartDrawer.tsx` (client slide-in).
- `components/CartProvider.tsx` (`useCart`, localStorage-persisted),
  `components/Toast.tsx` (`ToastProvider`/`useToast`).
- `components/Rating.tsx`, `Price.tsx` (formatPKR + % badge), `ProductCard.tsx`
  (client: hover image swap, wishlist POST /api/wishlist → /login on 401,
  Add to Cart / Buy Now), `components/SearchBar.tsx` (debounced
  `/api/search/suggest` dropdown; documented expected response contract in file),
  `components/Breadcrumbs.tsx`, `components/Pagination.tsx`,
  `components/Skeletons.tsx`, `components/EmptyState.tsx`,
  `components/QuantitySelector.tsx`, `components/Countdown.tsx`.
- `components/JsonLd.tsx` — Organization / WebSite / Product / Breadcrumb / FAQ
  JSON-LD builders (site URL from NEXT_PUBLIC_SITE_URL).
- `app/sitemap.ts`, `app/robots.ts` (disallows /admin, /api, /account),
  `app/not-found.tsx`, `app/error.tsx` (client), `app/(shop)/loading.tsx`.

Notes / issues (all resolved):
- `npx tsc --noEmit` initially failed repo-wide because the Prisma client had never
  been generated. `prisma generate` hung in this sandbox: (1) the CLI's bundled
  `https-proxy-agent` stalls on TLS-upgrade through the egress proxy (curl and
  node's native fetch work fine), so engine downloads never completed; (2) Prisma
  5.22 also runs an update-checkpoint at startup that hangs the same way.
  Fixed by: downloading `schema-engine` + `libquery_engine.so.node` for
  `debian-openssl-3.0.x` (commit 605197351a3c8bdd595af2d2a9bc3025bca48ea2) via curl
  into `~/.cache/prisma` (with bare-hex `.sha256` files, no trailing newline) and
  `node_modules/@prisma/engines/`, then running
  `CHECKPOINT_DISABLE=1 node node_modules/prisma/build/index.js generate`.
  Client generated successfully; `tsc --noEmit` now passes with zero errors.
  NOTE: on machines/Vercel with normal internet, plain `npx prisma generate`
  works — the curl/checkpoint workarounds are sandbox-specific.
- `app/(shop)/product/[slug]/page.tsx` (other agent) initially passed `{name, url}`
  items to `Breadcrumbs` (contract: `{label, href?}`); the page agent has since
  aligned it — tsc is clean.
- `SearchBar` assumes `/api/search/suggest?q=` returns
  `{ products: [{id,title,slug,image,price,salePrice}], categories: [{name,slug}] }`;
  missing arrays are tolerated. API route not yet implemented (other agent).
- `ProductCard` wishlist uses `POST`/`DELETE /api/wishlist` (401 → redirect /login);
  route not yet implemented (other agent).

## 2026-10-11 — Storefront pages + storefront API routes (subagent)

Built all 16 page groups under `app/(shop)/` and 12 storefront API routes under
`app/api/`. `npx tsc --noEmit` is fully clean (exit 0).

### Pages (`app/(shop)/`)
- `page.tsx` — Homepage: server component rendering visible `HomepageSection`
  rows in `sortOrder` (hero, trust_strip, categories, best_sellers, flash_deal,
  why_us, reviews). Flash deal renders ONLY when countdown is enabled, endsAt
  is in the future, and the product exists — no fake urgency. Reviews show
  approved (featured first) with verified-buyer badges. OrganizationJsonLd +
  WebSiteJsonLd included; metadata from `meta_title`/`meta_description`.
- `shop/page.tsx` + `shop/filters.tsx` — listing with q/category/price/rating/
  inStock/sale filters, `filter=best-sellers|sale` support, 6 sort orders,
  grid/list toggle, 12/page `Pagination`, breadcrumbs, product count.
  `FilterDrawer` = desktop sidebar + mobile slide-over (client).
- `product/[slug]/page.tsx` + `ProductGallery.tsx` (thumbs + hover zoom) +
  `BuyBox.tsx` (variant groups with priceAdjust, QuantitySelector, Add to
  Cart / Buy Now / Order on WhatsApp via `buildWhatsAppLink`) +
  `ReviewForm.tsx` (POST /api/reviews). Delivery/COD/returns accordions from
  settings, SafeHtml description, specs table, approved reviews, global FAQs,
  related products. `notFound()` for missing/unpublished; ProductJsonLd +
  BreadcrumbJsonLd; SEO metadata.
- `cart/page.tsx` — client cart: lines, qty, remove, coupon (POST
  /api/coupons/validate), delivery estimate, totals, checkout CTA.
- `checkout/page.tsx` — client COD checkout: Pakistani mobile validation
  (`isValidPakistaniMobile`, normalized to 92…), province select, coupon,
  delivery fee (250 flat / free over threshold), POST /api/checkout →
  clearCart + redirect to success. "You pay when your order arrives."
- `checkout/success/page.tsx` — `?order=` lookup; order number, items, totals,
  delivery estimate, customer info, WhatsApp support button, track-order link.
- `track-order/page.tsx` — order number + mobile → `/api/track-order`;
  ORDER_TIMELINE stepper, terminal states (CANCELLED/RETURNED/REFUNDED) shown
  as banner; friendly error on mismatch.
- `search/page.tsx` — `?q=` title/description search; popular-search chips
  derived from live category names when empty; EmptyState on no results.
- `wishlist/page.tsx` + `wishlist/WishlistGrid.tsx` — shared client grid used
  by both /wishlist and /account/wishlist; 401 → login prompt; remove buttons.
- `categories/page.tsx` — visible parents + visible children chips.
- `login/page.tsx`, `register/page.tsx` — next-auth credentials; honor
  `?callbackUrl` and `?admin=1` (→ /admin). Wrapped in Suspense (Next 14
  useSearchParams prerender requirement).
- `forgot-password/page.tsx`, `reset-password/[token]/page.tsx` — always-ok
  responses (no user enumeration).
- `account/` — dashboard (recent orders, wishlist/address counts),
  `orders/`, `orders/[id]/` (ownership-checked, timeline), `addresses/` (CRUD
  via AddressesManager), `wishlist/` (reuses WishlistGrid), `reviews/`.
  Double session check via `account/_session.ts` (middleware also guards).
- `contact/page.tsx` + `ContactForm.tsx` — CMS "contact" page content +
  contact info from settings + form → POST /api/contact.
- `[slug]/page.tsx` — generic CMS pages; `faq` slug also renders Faq table +
  FaqJsonLd; SEO metadata from page fields.
- `blog/page.tsx`, `blog/[slug]/page.tsx` — listing cards + post with
  SafeHtml, author/date, related posts, SEO metadata.
- Shared: `SafeHtml.tsx` (admin-authored HTML), `_helpers.ts`
  (`toCardData`, `parseConfig`); `lib/coupons.ts` (`validateCoupon` shared by
  checkout + coupon API).

### API routes (`app/api/`)
- `POST /api/checkout` — zod-validated; re-fetches products, verifies stock,
  validates variants belong to product, recomputes prices server-side (never
  trusts client), validates coupon, `generateOrderNumber()`, transaction:
  order + items, stock decrement, soldCount++, coupon usedCount++. Returns
  `{orderNumber}`. Cart line ids are `productId::variantId,variantId`.
- `POST /api/coupons/validate` — `{code, subtotal}` → `{valid, discount, message}`.
- `GET /api/track-order` — orderNumber + mobile (normalized compare); 404
  without distinguishing missing vs mismatch; public fields only.
- `GET /api/search/suggest` — 6 products + 4 categories.
- `/api/wishlist` — GET/POST(toggle)/DELETE, `requireUser`.
- `POST /api/reviews` — creates UNAPPROVED review; attaches userId + verified
  badge if they bought it; recalcs ratingAvg/ratingCount from approved.
- `POST /api/auth/register|forgot-password|reset-password` — bcrypt hash,
  crypto token + 1h expiry, reset link logged to console (dev), always-ok.
- `GET /api/account/orders`; `/api/account/addresses` GET/POST/PUT/DELETE
  (user-scoped, default-address handling).
- `POST /api/contact` — validates, logs, `{ok:true}`.

### Cross-cutting fixes (blocking for the whole project)
- `prisma/schema.prisma`: native `enum Role` / `enum OrderStatus` are NOT
  supported by Prisma's SQLite connector, so no client could ever be
  generated. Converted to `String` fields (`role` default "customer",
  `status` default "NEW"). Seed + all consumers use string literals, so this
  is behavior-preserving.
- Fixed now-stale `OrderStatus` imports in sibling files:
  `app/api/admin/orders/[id]/route.ts`, `app/api/admin/orders/route.ts`,
  `app/admin/page.tsx` (type → `string`, values → literals).
- `prisma/seed.ts`: two `.entries()` iterations → `Array.from(...)` (TS
  downlevelIteration target).
- `npx prisma generate` hangs in this environment: Prisma's built-in
  downloader stalls behind the egress proxy (curl works fine). Downloaded
  both engines manually into `prisma/engines/` (persistent, survives
  `npm install`) and appended `PRISMA_QUERY_ENGINE_LIBRARY` /
  `PRISMA_SCHEMA_ENGINE_BINARY` to `.env`. `prisma generate` now completes
  in ~2s (also fixed `~/.cache/prisma` sha256 for the query engine).
- Removed `mode: "insensitive"` from all Prisma `contains` filters (SQLite
  connector rejects it; SQLite LIKE is ASCII case-insensitive anyway).

### Notes for other agents
- Cart line identity = `keyOf` = `id::variant-label`; variant ids are encoded
  in the item `id` as `productId::vId1,vId2` by `BuyBox`, and the checkout API
  splits on `::` to re-validate variants/prices server-side.
- `useSearchParams` in client pages (`login`, `register`, `track-order`) is
  wrapped in `<Suspense>`; `/shop` is dynamic via the `searchParams` prop so
  its filter components are fine unwrapped.
- No emojis in UI; all business content (name, WhatsApp, policies, fees)
  comes from DB settings / constants.

## 2026-10-11 — Admin panel (complete)

Built the entire `/admin` area: shell layout + 14 sections + 20 API route
modules. All `/api/admin/*` routes start with `requireAdmin()` (401/403 on
failure); the admin layout double-checks the session server-side (defense in
depth; middleware already gates `/admin`). No storefront chrome in admin.
Shared admin-only UI lives in `app/admin/_components/` (icons, toast, ui,
client, ImageInput) so there is zero coupling to the sibling's
`@/components/*` set.

### Shell & shared
- `app/admin/layout.tsx` — dark fixed sidebar (Dashboard, Products,
  Categories, Orders, Coupons, Reviews, Homepage, Appearance, Pages, Blog,
  FAQs, Settings, View Store, Logout), mobile hamburger top bar, desktop
  topbar with store name + admin email + logout (signOut → /login).
  `ToastProvider` wraps everything; `.no-print` on chrome.
- `app/admin/_components/icons.tsx` — 30 named stroke SVG icons.
- `app/admin/_components/toast.tsx` — `ToastProvider` + `useToast`
  (success/error/info, auto-dismiss).
- `app/admin/_components/ui.tsx` — server components: `PageHeader`, `Card`,
  `StatCard`, `Field`, `Price` (formatPKR), `StatusBadge` (order-status
  colors), `Pill`, `EmptyState`, `Breadcrumbs`, `Pagination`
  ({page,totalPages,basePath,params}), `TableShell`, `Skeleton(s)`, `Thumb`,
  `Stars`, plus `inputCls`/`labelCls`/`btnPrimary`/`btnSecondary`/`btnDanger`.
- `app/admin/_components/client.tsx` — `AdminNav` (active-link highlight via
  usePathname, mobile menu), `LogoutButton`, `DeleteButton`
  (confirm → DELETE → toast + router.refresh), `PrintButton`
  (window.print), `ToggleSwitch`.
- `app/admin/_components/ImageInput.tsx` — upload via `/api/admin/upload`
  plus paste-URL, with preview and remove.

### Pages
- `app/admin/page.tsx` — dashboard: revenue (excl. cancelled/returned/
  refunded), today's sales, total/pending orders, customers, products,
  low-stock count, AOV, per-status counts, best sellers by soldCount, SVG
  7-day revenue chart, recent orders, low-stock alerts table.
- `app/admin/products/` — list (q/category/status filters, 20/page,
  thumbnail/price/stock/status, edit, delete-with-confirm); `new/` and
  `[id]/` share `ProductForm` (title→slug auto, SKU, price/sale, stock/
  threshold, nested category select, image manager with upload + URL +
  set-main + reorder + remove, short/full description incl. HTML, key/value
  specifications, variant rows, published/featured/bestSeller flags,
  scheduled publishedAt, SEO fields; validation + toasts + redirect).
- `app/admin/categories/` — nested tree with visibility toggle, up/down
  reorder (PATCH), edit, delete (confirm warns about detaching products and
  cascade-deleting children); `new/` + `[id]/` form (parent select guards
  against self/descendant cycles).
- `app/admin/orders/` — list (q/status/date filters, 20/page, CSV export of
  filtered set); `[id]/` detail (customer, items, totals, status timeline,
  fulfillment form: status/courier/tracking/internal notes, print + CSV
  buttons); `[id]/print/` invoice with `@media print` rules.
- `app/admin/coupons/` — list + `CouponForm` (code/type/value/minOrder/
  maxDiscount/expiresAt/usageLimit/perUserLimit/isActive).
- `app/admin/reviews/` — pending-first, filter pills, approve/reject,
  feature toggle, delete; product rating aggregates re-synced on
  approve/delete.
- `app/admin/homepage/` — `HomepageManager`: visibility toggle, up/down
  reorder, per-section config editor with validated JSON textarea plus
  friendly fields for `hero` (heading/description/CTAs/image/background/
  alignment) and `flash_deal` (product select, countdown toggle, endsAt).
- `app/admin/appearance/` — all 14 color tokens (color input + hex field),
  live preview mock (announcement/header/card/buttons/badges/footer),
  logo/favicon (upload or URL), announcement toggle, socials
  (facebook/instagram/tiktok/youtube), WhatsApp number + display. Saves via
  PUT /api/admin/settings (clears settings cache).
- `app/admin/pages/`, `app/admin/blog/`, `app/admin/faqs/` (inline CRUD),
  `app/admin/settings/` (general settings form) — full CRUD as specced.

### API routes (`app/api/admin/`)
- `products` (GET list w/ filters / POST), `products/[id]` (GET/PUT/DELETE;
  PUT replaces variants transactionally; slug auto-uniquified).
- `categories` (GET/POST), `categories/[id]` (GET/PUT/DELETE; products
  SetNull, children cascade — confirmed in UI), `categories/reorder`
  (PATCH {orderedIds}).
- `orders` (GET w/ q/status/date filters), `orders/[id]` (GET/PUT),
  `orders/export` (CSV download, same filters + `id`).
- `coupons` + `coupons/[id]`, `reviews` (GET w/ filter) +
  `reviews/[id]` (PUT approve/feature, DELETE), `homepage` (GET) +
  `homepage/[id]` (PUT) + `homepage/reorder` (PATCH),
  `settings` (GET map / PUT {key:value} upserts + clearSettingsCache),
  `pages`, `blog`, `faqs` (+ `[id]`) CRUD.
- `upload` (POST multipart): jpeg/png/webp/gif, ≤5MB, saved to
  `public/uploads/<ts>-<rand>.<ext>`, returns `{url}`.

### Notes
- Product images/specs stored as JSON strings (`parseImages`/JSON.parse).
- TS strict, no `any`; `npx tsc --noEmit` passes for the whole project.
- Prisma native enums were converted to String fields by the foundation
  agent (SQLite limitation); admin code uses string literals validated
  against `ORDER_STATUSES`.
- Prisma CLI `generate` stalls in this sandbox until engines are cached;
  engines were downloaded manually and `generate` now completes.

## 2026-10-11 — QA pass: build fix, slug fix, 404-status fix, end-to-end checkout test

### 1. `npm run build` failure — stale `.next` (`PageNotFoundError: /_document`)
The earlier build's `.next` was partial (interrupted; no `BUILD_ID`) and a rebuild
on top of it crashed during "Collecting page data". Fix: `rm -rf .next` then a
clean `npm run build` — passes with zero TS/ESLint errors, `BUILD_ID` present.

### 2. Slug bug — `ÉCLAT NOIR` seeded as `clat-noir-eau-de-parfum-100ml`
`slugify()` stripped the leading `É` entirely. Fixed in both `lib/utils.ts` and
`prisma/seed.ts` via `.normalize("NFD").replace(/[\u0300-\u036f]/g, "")` (É → E),
and the existing product row was updated to `eclat-noir-eau-de-parfum-100ml`.
The flash-deal homepage section config already referenced the `eclat-…` slug,
so it now resolves to the real product.

### 3. `notFound()` returned HTTP 200 instead of 404 (SEO soft-404s)
Root cause: `app/(shop)/loading.tsx` made Next.js stream the shop shell with
status 200 before the page segment resolved; when the page then called
`notFound()`, headers were already sent so the status stayed 200 (not-found UI
rendered, but only in flight data — never SSR'd to HTML). Verified by bisection:
bare `(shop)` layout still 200; removing `loading.tsx` → correct 404.
Fix: **deleted `app/(shop)/loading.tsx`**. Trade-off accepted: correct 404
statuses (SEO) over the route-level skeleton shimmer. `Skeletons.tsx` components
remain and are still used in `wishlist/WishlistGrid.tsx` and admin UI.
After the fix: bogus product/blog/CMS slugs → 404; real pages → 200;
`/admin` → 307 → `/login`.

### 4. End-to-end COD checkout test (dev server, then cleaned up)
POST `/api/checkout` (necklace, qty 1, WELCOME10, mobile `03001234567`) →
order `SKN-20261011-1482` created: status NEW, mobile normalized to
`923001234567`, subtotal 1499, discount 150, deliveryFee 250, total 1599.
GET `/api/track-order?orderNumber=…&mobile=…` returned the order; wrong mobile
returned the privacy-safe "could not find" error. Admin credentials verified
(`admin@sknstore.online` / `ChangeMe123!`, role admin, bcrypt match).
Test order + items deleted afterwards — DB ships with zero orders.

### QA results (dev server)
`/` 200 · `/product/eclat-noir-eau-de-parfum-100ml` 200 (title, Rs. 3,799, wa.me
button present) · `/shop` 200 · `/track-order` 200 · `/login` 200 ·
`/admin` 307 · `/api/search/suggest?q=noir` 200 (returns ÉCLAT NOIR) ·
POST `/api/coupons/validate` 200 (`{valid:true, discount:200}`).
`npx tsc --noEmit` clean. Final `npm run build` clean (exit 0).
