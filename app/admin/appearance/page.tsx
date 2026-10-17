import { getAllSettings, getColors } from "@/lib/settings";
import { Breadcrumbs, PageHeader } from "../_components/ui";
import { AppearanceForm } from "./_components/AppearanceForm";

export const dynamic = "force-dynamic";

export default async function AdminAppearancePage() {
  const [settings, colors] = await Promise.all([getAllSettings(), getColors()]);
  const initial: Record<string, string> = {};
  settings.forEach((v, k) => {
    initial[k] = v;
  });

  return (
    <div>
      <Breadcrumbs items={[{ label: "Appearance" }]} />
      <PageHeader
        title="Appearance"
        subtitle="Theme colors, branding, social links and WhatsApp. Changes apply to the storefront immediately."
      />
      <AppearanceForm initial={initial} initialColors={colors} />
    </div>
  );
}
