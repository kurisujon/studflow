import { StudyWorkspace } from "@/components/study/StudyWorkspace";
import { fetchStudyDocument } from "@/lib/server-api";

type StudyPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function StudyPage({
  params,
  searchParams,
}: StudyPageProps) {
  const { id } = await params;
  const { tab = "summary" } = await searchParams;
  const document = await fetchStudyDocument(id);

  return (
    <section
      className="px-4 py-6 md:px-6 md:py-8 lg:py-12"
      style={{
        minHeight: "calc(100dvh - var(--nav-height))",
        background:
          "radial-gradient(circle at top left, var(--theme-shadow), transparent 24%), linear-gradient(180deg, var(--background), color-mix(in srgb, var(--background) 82%, var(--theme-soft)))",
      }}
    >
      <div className="container mx-auto">
        <div className="flex flex-wrap items-center gap-4 mb-6 md:mb-8">
          <div>
            <p
              style={{
                fontSize: "0.75rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--theme-primary)",
                marginBottom: "0.5rem",
              }}
            >
              Study View
            </p>
            <h1 style={{ marginBottom: "0.35rem", maxWidth: "20ch" }}>{document.filename}</h1>
            <p style={{ color: "var(--muted-foreground)", maxWidth: "56ch" }}>
              Status: {document.status}. Read, annotate, and review in one workspace.
            </p>
          </div>
        </div>

        <StudyWorkspace document={document} initialTab={tab} />
      </div>
    </section>
  );
}
