import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSetting, getWhatsAppNumber } from "@/lib/settings";
import { buildWhatsAppLink } from "@/lib/utils";
import Breadcrumbs from "@/components/Breadcrumbs";
import { IconMail, IconChat, IconMapPin } from "@/components/Icons";
import SafeHtml from "../SafeHtml";
import ContactForm from "./ContactForm";

export async function generateMetadata(): Promise<Metadata> {
  const page = await prisma.page.findUnique({ where: { slug: "contact" } });
  return {
    title: page?.seoTitle || "Contact Us",
    description: page?.seoDescription || undefined,
  };
}

export default async function ContactPage() {
  const [page, contactEmail, contactAddress, whatsappNumber, whatsappDisplay, storeName] =
    await Promise.all([
      prisma.page.findUnique({ where: { slug: "contact" } }),
      getSetting("contact_email", "support@sknstore.online"),
      getSetting("contact_address", "Karachi, Pakistan"),
      getWhatsAppNumber(),
      getSetting("whatsapp_display", "0328 7533227"),
      getSetting("store_name", "SKN Store"),
    ]);

  if (page && !page.isPublished) notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
      <h1 className="mb-6 mt-2 text-2xl font-bold text-ink md:text-3xl">
        {page?.title || "Contact Us"}
      </h1>

      {page?.content ? (
        <div className="mb-8 max-w-3xl">
          <SafeHtml html={page.content} className="space-y-3 text-sm leading-relaxed text-muted" />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ContactForm />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded border border-border bg-card p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-soft-bg text-primary">
              <IconChat />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">WhatsApp</p>
              <a
                href={buildWhatsAppLink(whatsappNumber, `Hello ${storeName}, I have a question.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {whatsappDisplay}
              </a>
              <p className="text-xs text-muted">Fastest way to reach us</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded border border-border bg-card p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-soft-bg text-primary">
              <IconMail />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Email</p>
              <a
                href={`mailto:${contactEmail}`}
                className="break-all text-sm text-primary hover:underline"
              >
                {contactEmail}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded border border-border bg-card p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-soft-bg text-primary">
              <IconMapPin />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Address</p>
              <p className="text-sm text-muted">{contactAddress}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
