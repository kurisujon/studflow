export default function HomePage() {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100dvh - var(--nav-height))",
        textAlign: "center",
        padding: "4rem 1.5rem",
      }}
    >
      {/* Badge */}
      <span
        style={{
          display: "inline-block",
          padding: "0.25rem 0.875rem",
          borderRadius: "99px",
          border: "1px solid var(--color-border)",
          fontSize: "0.75rem",
          fontWeight: 500,
          color: "var(--color-text-muted)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          marginBottom: "1.75rem",
        }}
      >
        Powered by Gemini AI
      </span>

      {/* Heading */}
      <h1
        style={{
          maxWidth: "720px",
          marginBottom: "1.25rem",
        }}
      >
        Turn any document into an{" "}
        <span style={{ color: "var(--color-text-muted)" }}>
          active study session.
        </span>
      </h1>

      {/* Subtext */}
      <p
        style={{
          maxWidth: "480px",
          fontSize: "1.0625rem",
          marginBottom: "2.5rem",
          color: "var(--color-text-secondary)",
        }}
      >
        Upload a PDF or DOCX. Distill generates a concise summary, 15
        flashcards, and a 10-question quiz — in seconds.
      </p>

      {/* CTA group */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <a href="/upload" className="btn-primary" id="hero-upload-cta">
          Upload a Document
        </a>
        <a href="/dashboard" className="btn-ghost" id="hero-dashboard-link">
          View Dashboard
        </a>
      </div>

      {/* Subtle feature strip */}
      <div
        style={{
          display: "flex",
          gap: "2rem",
          marginTop: "4rem",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {[
          { icon: "◈", label: "1 Summary" },
          { icon: "⬡", label: "15 Flashcards" },
          { icon: "◇", label: "10-Question Quiz" },
        ].map(({ icon, label }) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
            }}
          >
            <span style={{ fontSize: "0.9rem" }}>{icon}</span>
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}
