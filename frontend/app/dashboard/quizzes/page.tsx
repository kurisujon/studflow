import { fetchMixedQuiz } from "@/lib/server-api";
import { ChallengeModeHub } from "@/components/study/ChallengeModeHub";

export default async function QuizzesPage() {
  const quiz = await fetchMixedQuiz();

  return (
    <div style={{ padding: "2rem", minHeight: "calc(100vh - 64px)" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1.5rem", textAlign: "center" }}>
        Challenge Mode
      </h1>
      <ChallengeModeHub questions={quiz} />
    </div>
  );
}
