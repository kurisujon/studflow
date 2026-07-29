import { fetchMixedQuiz } from "@/lib/server-api";
import { DashboardFeatureShell } from "@/components/dashboard/DashboardFeatureShell";
import { ChallengeModeHub } from "@/components/study/ChallengeModeHub";

export default async function QuizzesPage() {
  const quiz = await fetchMixedQuiz();

  return (
    <DashboardFeatureShell
      tone="quizzes"
      eyebrow="Challenge mode"
      title="Test what you know"
      description="Work through a mixed set of generated questions and get immediate feedback after every answer."
      count={{ value: quiz.length, label: quiz.length === 1 ? "question" : "questions" }}
    >
      <ChallengeModeHub questions={quiz} />
    </DashboardFeatureShell>
  );
}
