# UI Design Direction

Last updated: 2026-07-03

## Overview

This document defines the approved visual design language for Studflow based on the reference design samples provided by the product owner. All agents must use this as the visual reference when building or refining UI.

The design is best described as: **clean, informational, and lively** — structured clarity with warm purposeful color, clear hierarchy, and motion tied to product state.

---

## Color System

| Context | Color |
|---|---|
| Summary / AI features | Orange / warm amber |
| Flashcards / interactive elements | Purple / indigo |
| Correct states / progress / streaks | Green |
| Incorrect / error states | Red |
| Notes / bookmarks | Yellow / amber |
| General UI surface | Off-white / light lavender (#F5F5FF range) |
| Primary text | Near-black (#1a1a2e or similar dark navy) |
| Secondary / helper text | Medium gray |

Accent colors are used intentionally to communicate **meaning and hierarchy**, not decoration.

---

## Typography

- **Headings:** Bold, high-contrast, large. Use dark navy or near-black.
- **Accent word in heading:** Color it with the feature accent (e.g., "AI-Powered **Summary**" — "Summary" in orange).
- **Body text:** Medium weight, slightly muted, easy to scan.
- **Helper / meta text:** Small, light gray. Used for page numbers, timestamps, labels.
- **Section labels:** Uppercase or small-caps style, subtle.

---

## Cards & Surfaces

- Rounded corners (12px–20px radius).
- Subtle box shadows to create elevation without heaviness.
- Soft fills: light lavender, off-white, or near-white backgrounds.
- Borders: very light (1px, low-opacity gray or lavender).
- Cards for different content types (summary highlights, quiz options, flashcards) have their own soft background tints to distinguish them.

---

## Icons

- Always paired with a label — never icon-only for primary actions.
- Colored to match their feature context (orange for document/AI, purple for flashcards, green for progress).
- Rounded icon containers with soft background fills (e.g., a light orange square with rounded corners for the summary icon).

---

## Motion & Liveliness

Purposeful animation is **approved and expected**:

- Progress bar fills (document progress, quiz score, streak tracker).
- Card state transitions (flashcard flip, answer reveal).
- Feedback indicators (correct answer highlight turns green, incorrect turns red).
- Subtle sparkle / star accents near key UI moments (streak, completion).
- Dashed arrow connectors between feature callouts on landing/marketing sections.

Motion must always be tied to a product state change. Pure decorative animation without meaning is still discouraged.

---

## Dashboard

The dashboard is a **first-class product surface** — not a stripped-down list view.

It must include:
- **Continue Studying cards** with per-document progress bars and "Continue" CTAs.
- **Study Overview stats** (total documents, flashcards, quizzes taken, avg score) with week-over-week deltas.
- **Study Streak tracker** with a daily dot indicator (Mon–Sun).
- **Review Queue** showing due flashcards, quiz retries, and notes to revisit with a "Start Review Session" CTA.
- **Recent Activity feed** with timestamped actions (quiz completed, flashcards reviewed, note added).
- **Study Progress chart** (line chart showing weekly study time or score trend).
- **Topic Breakdown** (donut chart by subject/tag).
- **Quick Actions** panel (Upload Document, Generate Flashcards, Create Quiz, Ask AI).

---

## Study Workspace

Each tab has a distinct visual identity:

### Summary Tab
- Two-pane layout: document viewer on the left, AI Summary panel on the right.
- Document viewer shows section headings and text with inline highlights.
- AI Summary panel shows bulleted key points with colored dot markers (orange, blue, green, purple, yellow).
- "Key Takeaway" callout card at the bottom with a light orange background.

### Flashcards Tab
- Large centered card showing "Question" label + question text + "Tap to reveal answer" hint.
- Progress indicator: "Card X of Y" with a progress bar.
- Study Mode toggle in the top-right.
- Bottom row: Known / Review / Unknown counters with color coding (green / orange / red).

### Quiz Tab
- Question text with A/B/C/D options as selectable rows.
- Selected correct answer highlights green with a checkmark.
- Immediate feedback panel on the right: "Correct!" or "Incorrect" with explanation.
- Score and accuracy stats below the feedback.
- "Retry Incorrect" CTA button at the bottom.
- Timer shown in the top-right.

### AI Chat Tab
- Left panel: Document Highlights (chunks from the document with page/paragraph references).
- Right panel: Chat interface with user messages (right-aligned, light purple bubble) and AI responses (left-aligned with bot avatar).
- AI responses include inline source references as chips (e.g., "Page 3 (¶2)").
- Input bar at the bottom with a send button.
- "Using your document" status indicator in the top-right.

---

## Reference Images

The following approved design samples were provided by the product owner and live at:

- `C:\Users\CJK_LAPTOP\Downloads\studflow_images\ai_summary.png` — AI-Powered Summary view
- `C:\Users\CJK_LAPTOP\Downloads\studflow_images\interactive.png` — Interactive Flashcards & Quizzes view
- `C:\Users\CJK_LAPTOP\Downloads\studflow_images\contextual.png` — Contextual AI Chat view
- `C:\Users\CJK_LAPTOP\Downloads\studflow_images\dashboard.png` — Dashboard & Review Workflow view

All future UI work should align with the patterns established in these images.
