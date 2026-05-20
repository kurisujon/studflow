"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { askAIAboutSelection } from "@/lib/api/annotations";
import type { AIExplanation, AIToolMode } from "@/types/annotations";

export function AIStudyAssistantPanel({
  selectedText,
  initialQuestion,
  mode,
}: {
  selectedText: string;
  initialQuestion?: string;
  mode: AIToolMode;
}) {
  const [question, setQuestion] = useState(initialQuestion ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AIExplanation | null>(null);

  useEffect(() => {
    if (initialQuestion !== undefined) {
      setQuestion(initialQuestion);
    }
  }, [initialQuestion]);

  async function submit(customQuestion: string) {
    if (!selectedText) return;

    setLoading(true);
    setError(null);
    try {
      const payload = await askAIAboutSelection(
        selectedText,
        customQuestion || "Explain this clearly and simply for a student.",
      );
      setResponse(payload);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "AI explanation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ padding: "1rem", borderRadius: "18px", backgroundColor: "rgba(255,255,255,0.84)", border: "1px solid rgba(251,146,60,0.18)" }}>
        <p style={{ fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#c2410c", marginBottom: "0.45rem" }}>
          Context
        </p>
        <p style={{ color: "#7c2d12" }}>
          {selectedText ? `“${selectedText}”` : "Select text in the reader to ask the AI tool."}
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
        <Button variant={mode === "ask-ai" ? "default" : "outline"} onClick={() => submit(question || "Explain this clearly and simply for a student.")} disabled={!selectedText || loading} style={{ minHeight: "42px", paddingInline: "16px", borderRadius: "14px" }}>
          Ask AI
        </Button>
        <Button variant={mode === "simplify" ? "default" : "outline"} onClick={() => submit("Explain this in simpler terms.")} disabled={!selectedText || loading} style={{ minHeight: "42px", paddingInline: "16px", borderRadius: "14px" }}>
          Simplify
        </Button>
        <Button variant={mode === "define-term" ? "default" : "outline"} onClick={() => submit("Define this term clearly and explain how it is used in this study topic.")} disabled={!selectedText || loading} style={{ minHeight: "42px", paddingInline: "16px", borderRadius: "14px" }}>
          Define Term
        </Button>
      </div>

      <label style={{ display: "grid", gap: "0.45rem" }}>
        <span style={{ fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#9a3412" }}>
          Ask your question
        </span>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={4}
          placeholder="Ask something about this text..."
          style={{
            width: "100%",
            borderRadius: "16px",
            border: "1px solid rgba(251,146,60,0.18)",
            padding: "0.95rem",
            resize: "vertical",
            backgroundColor: "rgba(255,255,255,0.86)",
          }}
        />
      </label>

      <Button onClick={() => submit(question)} disabled={!selectedText || loading} style={{ minHeight: "42px", paddingInline: "18px", borderRadius: "14px" }}>
        {loading ? "Running AI..." : "Run AI"}
      </Button>

      {error ? <p style={{ color: "#b42318", fontSize: "0.92rem" }}>{error}</p> : null}

      {response ? (
        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={{ padding: "1rem", borderRadius: "18px", backgroundColor: "rgba(255,255,255,0.84)", border: "1px solid rgba(251,146,60,0.18)" }}>
            <p style={{ fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#c2410c", marginBottom: "0.45rem" }}>
              {mode === "define-term" ? "Definition and Usage" : mode === "simplify" ? "Simplified Explanation" : "Response"}
            </p>
            <p style={{ color: "#3f2a14", lineHeight: 1.8 }}>
              {mode === "define-term" ? response.simplifiedExplanation : response.simplifiedExplanation}
            </p>
          </div>

          {mode === "ask-ai" ? (
            <>
              <div style={{ padding: "1rem", borderRadius: "18px", backgroundColor: "rgba(255,255,255,0.84)", border: "1px solid rgba(251,146,60,0.18)" }}>
                <p style={{ fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#c2410c", marginBottom: "0.45rem" }}>
                  Example
                </p>
                <p style={{ color: "#3f2a14", lineHeight: 1.8 }}>{response.example}</p>
              </div>

              <div style={{ padding: "1rem", borderRadius: "18px", backgroundColor: "rgba(255,247,237,0.92)", border: "1px solid rgba(251,191,36,0.18)" }}>
                <p style={{ fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#c2410c", marginBottom: "0.45rem" }}>
                  Related Terms
                </p>
                <ul style={{ display: "grid", gap: "0.55rem", paddingLeft: "1rem" }}>
                  {response.relatedTerms.map((term, index) => (
                    <li key={`related-${index}`} style={{ color: "#4a2d1c" }}>
                      {term}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
