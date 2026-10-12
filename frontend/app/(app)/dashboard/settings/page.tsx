import { fetchUserPreferences } from "@/lib/server-api";
import { SettingsForm } from "@/components/settings-form";
import { DashboardFeatureShell } from "@/components/dashboard/DashboardFeatureShell";

export default async function SettingsPage() {
  const preferences = await fetchUserPreferences();

  return (
    <DashboardFeatureShell
      tone="settings"
      eyebrow="Preferences"
      title="Settings"
      description="Manage appearance and the study preferences supported by your account."
    >
      <SettingsForm preferences={preferences} />
    </DashboardFeatureShell>
  );
}
