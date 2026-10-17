import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { ToastProvider } from "@/components/Toast";
import { getColors, getSetting, type SiteColors } from "@/lib/settings";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const revalidate = 1800; // Cache pages for 30 min, then refresh in background

const COLOR_VAR_MAP: Array<[keyof SiteColors, string]> = [
  ["primary", "--color-primary"],
  ["secondary", "--color-secondary"],
  ["background", "--color-background"],
  ["softBg", "--color-soft-bg"],
  ["cardBg", "--color-card-bg"],
  ["accent", "--color-accent"],
  ["success", "--color-success"],
  ["sale", "--color-sale"],
  ["text", "--color-text"],
  ["mutedText", "--color-muted-text"],
  ["border", "--color-border"],
  ["warning", "--color-warning"],
  ["error", "--color-error"],
  ["radius", "--radius"],
];

export async function generateMetadata(): Promise<Metadata> {
  const [storeName, metaTitle, metaDescription] = await Promise.all([
    getSetting("store_name", "SKN Store"),
    getSetting("meta_title", ""),
    getSetting("meta_description", ""),
  ]);
  const siteTitle = metaTitle || `${storeName} — Online Shopping in Pakistan`;
  const description =
    metaDescription ||
    `Shop quality products online in Pakistan at ${storeName}. Cash on delivery nationwide.`;
  return {
    title: { default: siteTitle, template: `%s | ${storeName}` },
    description,
    openGraph: {
      title: siteTitle,
      description,
      type: "website",
      siteName: storeName,
    },
    twitter: { card: "summary_large_image", title: siteTitle, description },
  };
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const colors = await getColors();
  const cssVars = Object.fromEntries(
    COLOR_VAR_MAP.map(([key, varName]) => [varName, colors[key]])
  ) as CSSProperties;

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://m.media-amazon.com" />
        <link rel="preconnect" href="https://ae01.alicdn.com" />
        <link rel="preconnect" href="https://ae04.alicdn.com" />
        <link rel="preconnect" href="https://img.darz.pk" />
      </head>
      <body className="bg-surface font-sans text-ink antialiased">
        <div style={cssVars} className="min-h-screen bg-surface text-ink">
          <CartProvider>
            <ToastProvider>{children}</ToastProvider>
          </CartProvider>
        </div>
      </body>
    </html>
  );
}
