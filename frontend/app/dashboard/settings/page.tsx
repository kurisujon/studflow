import { fetchUserPreferences } from "@/lib/server-api";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const preferences = await fetchUserPreferences();

  return (
    <section
      style={{
        minHeight: "calc(100dvh - var(--nav-height))",
        padding: "2rem 1.5rem 3rem",
        background:
          "radial-gradient(circle at top left, var(--theme-shadow), transparent 24%), linear-gradient(180deg, var(--background), color-mix(in srgb, var(--background) 82%, var(--theme-soft)))",
      }}
    >
      <div className="container" style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
          Study Preferences
        </h1>
        <p style={{ color: "var(--distill-text-secondary)", marginBottom: "2rem" }}>
          Customize your spaced repetition algorithm and daily study goals.
        </p>

        <SettingsForm preferences={preferences} />
      </div>
    </section>
  );
}
