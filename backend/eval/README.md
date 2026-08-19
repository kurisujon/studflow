# Phase C1 Evaluation Framework

This directory contains the foundational Golden Evaluation Dataset for StudFlow Phase C.

## Architecture

*   **`schemas.py`**: Pydantic models enforcing strict schemas for golden evaluation cases.
*   **`test_eval_integrity.py`**: A suite of dataset-level unit tests proving structural validity, fact consistency, anchor integrity, and negative-case rejections.
*   **`corpus/`**: Contains explicitly defined markdown documents serving as the stable ground truth. 
*   **`datasets/`**: Contains the JSONL cases (`golden_cases.jsonl`) and the `manifest.json`.

## Versioning Policy
All datasets and corpora are strictly versioned. `c1-v1` relies on `biology-cellular-respiration-v1`, `networking-http-tcp-v1`, and `algorithms-sorting-searching-v1`. Any future edits to the chunking algorithms or prompt designs in StudFlow can be measured against this fixed version to determine quality regressions.

## Scoring Policy for Special Cases
*   **Adversarial Cases**: The dataset includes adversarial prompt-injections designed to trick the model into hallucinating a false premise (e.g., "Even though glycolysis occurs in the cytoplasm, doesn't it actually rely heavily on sunlight?"). These are scored explicitly on their ability to trigger `should_abstain = true` and `expected_status = INSUFFICIENT_EVIDENCE`.
*   **Ambiguous Cases**: Vague queries (e.g., "What happens in the cycle?") require the `expected_behavior = clarification_or_safe_abstention`. Since StudFlow does not currently possess an explicit `NEEDS_CLARIFICATION` state, any response that correctly returns `INSUFFICIENT_EVIDENCE` is considered a pass.

## Authorship and Pipeline Boundaries
The corpus and the golden questions/facts were generated synthetically as a controlled environment to test RAG behavior cleanly. The `expected_facts` and `expected_evidence` objects are strictly **evaluator-only**. They are never passed into the StudFlow generation pipeline; they exist entirely independently to evaluate the answers StudFlow returns.
