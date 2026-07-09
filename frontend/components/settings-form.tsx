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
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Daily Goal */}
      <div style={{ padding: "1.5rem", borderRadius: "16px", backgroundColor: "var(--card)", border: "1px solid var(--theme-border)" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Daily Review Goal</h3>
        <p style={{ fontSize: "0.9rem", color: "var(--distill-text-secondary)", marginBottom: "1.5rem" }}>
          How many flashcards do you want to aim to review each day?
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: "1.25rem", fontWeight: 700, width: "3rem", textAlign: "right" }}>{dailyGoal}</span>
        </div>
      </div>

      {/* SM-2 Algorithm */}
      <div style={{ padding: "1.5rem", borderRadius: "16px", backgroundColor: "var(--card)", border: "1px solid var(--theme-border)" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>SM-2 Aggressiveness</h3>
        <p style={{ fontSize: "0.9rem", color: "var(--distill-text-secondary)", marginBottom: "1.5rem" }}>
          Lower numbers make flashcards appear more frequently (harder). Standard is 2.5.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <input
            type="range"
            min="1.5"
            max="3.5"
            step="0.1"
            value={sm2}
            onChange={(e) => setSm2(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: "1.25rem", fontWeight: 700, width: "3rem", textAlign: "right" }}>{sm2.toFixed(1)}</span>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1rem" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "0.75rem 2rem",
            borderRadius: "12px",
            backgroundColor: "var(--theme-primary)",
            color: "white",
            fontWeight: 600,
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            transition: "opacity 0.2s ease"
          }}
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
        {message && (
          <span style={{ fontSize: "0.9rem", color: message.includes("success") ? "#10b981" : "#ef4444" }}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
