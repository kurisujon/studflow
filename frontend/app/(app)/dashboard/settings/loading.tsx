export default function SettingsLoading() {
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

        <div aria-hidden="true" className="space-y-8 mt-8 animate-pulse motion-reduce:animate-none">
          <div className="space-y-4">
            <div className="h-6 w-32 rounded bg-muted" />
            <div className="h-20 w-full rounded-xl bg-muted" />
          </div>
          <div className="space-y-4">
            <div className="h-6 w-48 rounded bg-muted" />
            <div className="h-20 w-full rounded-xl bg-muted" />
          </div>
          <div className="space-y-4">
            <div className="h-6 w-40 rounded bg-muted" />
            <div className="h-20 w-full rounded-xl bg-muted" />
          </div>
          <div className="flex justify-end pt-4">
            <div className="h-11 w-32 rounded-xl bg-muted" />
          </div>
        </div>
        <span className="sr-only">Loading study preferences...</span>
      </div>
    </section>
  );
}
