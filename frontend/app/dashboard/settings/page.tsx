import { fetchUserPreferences } from "@/lib/server-api";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const preferences = await fetchUserPreferences();

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Study Preferences
      </h1>
      <p style={{ color: "var(--distill-text-secondary)", marginBottom: "2rem" }}>
        Customize your spaced repetition algorithm and daily study goals.
      </p>

      <SettingsForm preferences={preferences} />
    </div>
  );
}
