import { getSetting, getWhatsAppNumber } from "@/lib/settings";
import { buildWhatsAppLink } from "@/lib/utils";
import { IconChat } from "./Icons";

export default async function WhatsAppFloat() {
  const [storeName, whatsapp] = await Promise.all([
    getSetting("store_name", "SKN Store"),
    getWhatsAppNumber(),
  ]);

  const href = buildWhatsAppLink(
    whatsapp,
    "Hello SKN Store, I need help with my order."
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${storeName} on WhatsApp`}
      className="no-print fixed bottom-24 right-4 z-40 flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 md:bottom-6 md:right-6"
      style={{ height: 52, width: 52 }}
    >
      <IconChat className="h-6 w-6" />
    </a>
  );
}
