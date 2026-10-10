"use client";

import { useState } from "react";
import type { UserPreferences } from "@/lib/types";

export function SettingsForm({ preferences }: { preferences: UserPreferences }) {
  const [dailyGoal, setDailyGoal] = useState(preferences.daily_review_goal);
  const [sm2, setSm2] = useState(preferences.sm2_aggressiveness);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daily_review_goal: dailyGoal, sm2_aggressiveness: sm2 }),
      });
      if (res.ok) {
        setMessage("Preferences saved successfully!");
      } else {
        setMessage("Failed to save preferences.");
      }
    } catch {
      setMessage("An error occurred.");
    }
    setSaving(false);
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--card)] p-5 sm:p-6">
        <h3 className="text-base font-bold text-[var(--foreground)]">Daily Review Goal</h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          How many flashcards do you want to aim to review each day?
        </p>
        <div className="mt-5 flex items-center gap-4">
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-[var(--theme-border)] accent-[var(--theme-primary)]"
          />
          <span className="w-12 text-right text-xl font-bold text-[var(--foreground)]">{dailyGoal}</span>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--card)] p-5 sm:p-6">
        <h3 className="text-base font-bold text-[var(--foreground)]">SM-2 Aggressiveness</h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Lower numbers make flashcards appear more frequently (harder). Standard is 2.5.
        </p>
        <div className="mt-5 flex items-center gap-4">
          <input
            type="range"
            min="1.5"
            max="3.5"
            step="0.1"
            value={sm2}
            onChange={(e) => setSm2(Number(e.target.value))}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-[var(--theme-border)] accent-[var(--theme-primary)]"
          />
          <span className="w-12 text-right text-xl font-bold text-[var(--foreground)]">{sm2.toFixed(1)}</span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
        {message && (
          <span className={`text-sm font-medium ${message.includes("success") ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
