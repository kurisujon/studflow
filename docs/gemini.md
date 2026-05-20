# AI Integration Rules (Gemini API)

## Strict Structured Output Rules
- The Gemini API must be forced to return strict JSON using structured output features (`response_mime_type="application/json"` and `response_schema`).
- **NO Markdown Blocks:** The AI must not wrap the JSON in ```json ... ``` blocks.
- **NO Conversational Text:** The AI must not output introductory or concluding remarks (e.g., "Here is your quiz..."). Return ONLY the JSON object.

## Required JSON Schemas

### Flashcard Schema
```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "front": {
        "type": "string",
        "description": "The question or concept to recall."
      },
      "back": {
        "type": "string",
        "description": "The answer or explanation."
      }
    },
    "required": ["front", "back"]
  }
}
```

### Quiz Schema
```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "question": {
        "type": "string",
        "description": "The multiple-choice question."
      },
      "options": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Exactly 4 distinct options."
      },
      "correct_answer_index": {
        "type": "integer",
        "description": "The zero-based index of the correct option."
      },
      "explanation": {
        "type": "string",
        "description": "Brief explanation of why the answer is correct."
      }
    },
    "required": ["question", "options", "correct_answer_index", "explanation"]
  }
}
```

## Context Window Management Strategy
To prevent token explosions and ensure high-quality outputs from long documents:
1. **Chunking Logic:** Split large PDFs/DOCX files into manageable semantic chunks (e.g., overlapping text windows of 3000-5000 tokens).
2. **Independent Processing:** Extract key concepts and summaries from each chunk independently to maintain detail.
3. **Aggregation:** Combine the chunked outputs in a final AI pass to generate the unified 15 flashcards and 10-question quiz, ensuring no duplication and balanced coverage of the entire document.
