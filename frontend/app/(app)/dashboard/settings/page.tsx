import { fetchUserPreferences } from "@/lib/server-api";
import { SettingsForm } from "@/components/settings-form";
import { DashboardFeatureShell } from "@/components/dashboard/DashboardFeatureShell";

export default async function SettingsPage() {
  const preferences = await fetchUserPreferences();

  return (
    <DashboardFeatureShell
      tone="settings"
      eyebrow="Preferences"
      title="Study Settings"
      description="Customize your spaced repetition algorithm and daily study goals."
    >
      <SettingsForm preferences={preferences} />
    </DashboardFeatureShell>
  );
}
