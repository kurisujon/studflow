"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ThemeSettings } from "@/components/theme/ThemeSettings";
import { API_BASE_URL, buildAPIError } from "@/lib/api";
import type { UserPreferences } from "@/lib/types";

export function SettingsForm({ preferences }: { preferences: UserPreferences }) {
  const { getToken } = useAuth();
  const [dailyGoal, setDailyGoal] = useState(preferences.daily_review_goal);
  const [sm2, setSm2] = useState(preferences.sm2_aggressiveness);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Your session is unavailable. Please sign in again.");
      const res = await fetch(`${API_BASE_URL}/api/user/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ daily_review_goal: dailyGoal, sm2_aggressiveness: sm2 }),
      });
      if (!res.ok) throw await buildAPIError(res, "Failed to save preferences");
      setMessage("Preferences saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Preferences could not be saved.");
    }
    setSaving(false);
  };

  return (
    <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--card)] p-5 sm:p-6 lg:col-span-2">
        <div className="flex items-center justify-between gap-4">
          <div><h3 className="text-base font-bold text-[var(--foreground)]">Appearance</h3><p className="mt-1 text-sm text-[var(--muted-foreground)]">Choose light or dark mode and an interface accent.</p></div>
          <ThemeSettings />
        </div>
      </div>
      <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--card)] p-5 sm:p-6">
        <h3 id="daily-goal-label" className="text-base font-bold text-[var(--foreground)]">Daily Review Goal</h3>
        <p id="daily-goal-description" className="mt-1 text-sm text-[var(--muted-foreground)]">
          Save a personal target for how many flashcards you want to review. This preference does not currently change scheduling or queue size.
        </p>
        <div className="mt-5 flex items-center gap-4">
          <input
            type="range"
            aria-labelledby="daily-goal-label"
            aria-describedby="daily-goal-description"
            aria-valuetext={`${dailyGoal} cards per day`}
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
        <h3 id="sm2-label" className="text-base font-bold text-[var(--foreground)]">SM-2 Aggressiveness</h3>
        <p id="sm2-description" className="mt-1 text-sm text-[var(--muted-foreground)]">
          Save your preferred review aggressiveness. The current scheduler does not yet apply this preference to card intervals.
        </p>
        <div className="mt-5 flex items-center gap-4">
          <input
            type="range"
            aria-labelledby="sm2-label"
            aria-describedby="sm2-description"
            aria-valuetext={sm2.toFixed(1)}
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

      <div className="flex items-center gap-4 lg:col-span-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--theme-primary)] px-6 text-sm font-semibold text-[var(--theme-on-primary)] transition hover:bg-[var(--theme-primary-hover)] disabled:pointer-events-none disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
        {message && (
          <span role="status" aria-live="polite" className={`text-sm font-medium ${message === "Preferences saved." ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
