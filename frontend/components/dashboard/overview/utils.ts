import { DocumentListItem, UserQueue } from "@/lib/types";

export function getPrimaryAction(documents: DocumentListItem[], queue: UserQueue) {
  const firstTask = queue.tasks[0];
  if (firstTask) {
    return {
      href:
        firstTask.badge === "Review"
          ? "/dashboard/flashcards"
          : "/dashboard/quizzes",
      label: firstTask.badge === "Review" ? "Start today’s reviews" : "Practice a quiz",
    };
  }
  const completedDocument = documents.find(
    (document) => document.status === "COMPLETED",
  );
  if (completedDocument) {
    return {
      href: `/dashboard/study/${completedDocument.id}`,
      label: "Continue studying",
    };
  }
  return { href: "/dashboard/docs", label: "Browse documents" };
}

export function getStreakDays(activity: boolean[]) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (6 - index));
    return {
      key: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("en", {
        weekday: "narrow",
        timeZone: "UTC",
      }).format(date),
      fullLabel: new Intl.DateTimeFormat("en", {
        weekday: "long",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(date),
      active: activity[index] ?? false,
    };
  });
}

export function stripExtension(filename: string) {
  return filename.replace(/\.[^/.]+$/, "");
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value.endsWith('Z') ? value : value + 'Z'));
}
