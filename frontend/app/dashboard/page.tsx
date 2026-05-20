import { DashboardDocumentCard } from "@/components/dashboard-document-card";
import { fetchDocuments } from "@/lib/server-api";

export default async function DashboardPage() {
  const documents = await fetchDocuments();

  return (
    <section
      style={{
        minHeight: "calc(100dvh - var(--nav-height))",
        padding: "2rem 1.5rem 3rem",
      }}
    >
      <div className="container">
        <div
          style={{
            marginBottom: "1.75rem",
            maxWidth: "760px",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--distill-text-muted)",
              marginBottom: "0.75rem",
            }}
          >
            Dashboard
          </p>
          <h1 style={{ marginBottom: "0.75rem" }}>Your study materials, organized.</h1>
          <p>
            Review completed documents, continue active recall, or jump back into the quiz.
          </p>
        </div>

        {documents.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              border: "1px solid var(--distill-border)",
              borderRadius: "24px",
              backgroundColor: "rgba(255,255,255,0.82)",
            }}
          >
            <p>No study documents have been uploaded yet.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {documents.map((document) => (
              <DashboardDocumentCard key={document.id} document={document} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
