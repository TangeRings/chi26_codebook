# Examples — Usage Guide

**Version:** v1 (pre-calibration)
**Status:** Empty. No examples are loaded in the current skill version.

---

## Purpose

This directory will eventually hold a small curated set of representative coding examples for use as few-shot context in the coding prompt. These examples are **not** gold calibration data — they are distilled, pedagogically chosen illustrations selected to help the model distinguish difficult code boundaries.

## Isolation rule

**Examples in this directory may only be added after calibration.**

Specifically:
- At least one full calibration round must have been completed.
- The example must be drawn from (or consistent with) a gold item in `calibration/gold/`.
- The example must have been reviewed and confirmed by the human researcher, not just output by the AI.
- Examples must be chosen for their boundary-clarifying value, not for being easy or typical.

Do not add examples here during calibration. Doing so would allow the AI to see a gold case in its prompt context, violating the blind-coding requirement.

## Format

When examples are added, each file represents one coded case and follows this structure:

```json
{
  "_meta": {
    "source_item": "student_id / item_id",
    "added_after_round": 1,
    "boundary_illustrated": "ELAB-vs-REFRAME",
    "added_by": "human-researcher"
  },
  "input": {
    "item_name": "string",
    "question_text": "string",
    "pre_response": "string",
    "post_response": "string"
  },
  "coding": {
    "structural_development": { "code": "...", "rationale": "..." },
    "semantic_events": [
      {
        "code": "...",
        "pre_evidence": "...",
        "post_evidence": "...",
        "rationale": "..."
      }
    ],
    "learner_agency": [],
    "uncertainty": { "confidence": "high", "flags": [], "coder_notes": "" }
  },
  "example_note": "Explains why this case was selected and what boundary it illustrates."
}
```

## Naming convention

Files are named `{boundary-type}--{item-name-slug}.json`, e.g.:

```
elab-vs-reframe--brand-vision.json
expand-vs-new--target-customer.json
```

## Current contents

*(Empty. Add examples only after calibration round 1 is complete.)*
