# Calibration Gold Data

**Status:** Empty. Human coding has not yet been performed.

---

## Purpose

This directory holds authoritative human-coded ground truth for the calibration set. Gold data is the reference standard against which AI coding outputs are evaluated.

## Isolation protocol

**Gold labels in this directory must never be loaded into a coding prompt.**

The artifact-coding skill runs blind — it receives only the input (pre/post responses) and the codebook + decision rules. It must not see the gold output for the item it is coding.

After an AI coding run is complete and stored in `calibration/runs/`, the gold labels are consulted only for comparison purposes, never before.

Violation of this rule invalidates the calibration round for the affected items.

## Directory structure

```
gold/
  {student_id}/
    {item_id}.json     (one file per coded item)
```

Example:
```
gold/
  jason/
    comp-1b.json
    comp-2.json
    comp-3.json
```

## Gold file format

Each file corresponds to one `ComparisonItem` and follows the `ArtifactCodingOutput` schema from `.cursor/skills/artifact-coding/schemas/output.schema.json`, with additional calibration metadata.

```json
{
  "_meta": {
    "student_id": "jason",
    "item_id": "comp-1b",
    "item_name": "Brand Vision",
    "coded_by": "human-researcher",
    "coded_at": "YYYY-MM-DD",
    "decision_rules_version": "v1",
    "calibration_round": 1
  },
  "input": {
    "question_text": "...",
    "pre_response": "...",
    "post_response": "..."
  },
  "coding": {
    "structural_development": {
      "code": "...",
      "rationale": "..."
    },
    "semantic_events": [
      {
        "code": "...",
        "pre_evidence": "...",
        "post_evidence": "...",
        "rationale": "..."
      }
    ],
    "learner_agency": [],
    "uncertainty": {
      "confidence": "...",
      "flags": [],
      "coder_notes": "..."
    }
  },
  "calibration_notes": "Free text: what was ambiguous, which rules were applied, what remains uncertain."
}
```

## Which items to code first

Prioritize items that are:
- Open-text responses (exclude numeric Likert and grid items)
- Rich enough to contain multiple semantic events
- Representative of likely boundary cases

Recommended starting set: comp-1b (Brand Vision), comp-3 (Target Customer), comp-5 (Niche), comp-8 (Product Offerings).

## Versioning

If a gold item is revised after a calibration round (e.g., due to a rule update), increment `calibration_round` and add a note to `calibration_notes` explaining what changed and why.

## Current contents

*(Empty. Human coding has not yet been performed.)*
