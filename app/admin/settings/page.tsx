import { getAllSettings } from "@/lib/settings";
import { Breadcrumbs, PageHeader } from "../_components/ui";
import { SettingsForm } from "./_components/SettingsForm";
import { ChangePasswordForm } from "./_components/ChangePasswordForm";
import { ConfirmationSettingsForm, RefusedAddressesManager } from "./_components/ConfirmationSettings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getAllSettings();
  const initial: Record<string, string> = {};
  settings.forEach((v, k) => {
    initial[k] = v;
  });

  return (
    <div>
      <Breadcrumbs items={[{ label: "Settings" }]} />
      <PageHeader title="Settings" subtitle="General store configuration." />
      <SettingsForm initial={initial} />
      <div className="mt-6 space-y-6">
        <ConfirmationSettingsForm initial={initial} />
        <RefusedAddressesManager />
        <ChangePasswordForm />
      </div>
    </div>
  );
}
