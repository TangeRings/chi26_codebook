# Calibration Runs

**Status:** Empty. No calibration runs have been executed yet.

---

## Purpose

This directory stores the outputs of AI calibration runs — the blind AI coding of items that have corresponding gold labels in `calibration/gold/`. Runs also contain structured disagreement records comparing AI output to gold.

## Directory structure

```
runs/
  run-NNN-YYYY-MM-DD/
    config.json
    {student_id}-{item_id}.output.json
    {student_id}-{item_id}.comparison.json
    ...
```

Example:
```
runs/
  run-001-2026-09-15/
    config.json
    jason-comp-1b.output.json
    jason-comp-1b.comparison.json
    jason-comp-3.output.json
    jason-comp-3.comparison.json
```

## Run numbering

Runs are numbered sequentially starting at `001`. The date suffix records when the run was executed, not when coding was reviewed. Do not reuse run numbers.

---

## config.json format

```json
{
  "run_id": "run-001",
  "date": "YYYY-MM-DD",
  "model": "claude-sonnet-4-6",
  "decision_rules_version": "v1",
  "items": [
    { "student_id": "jason", "item_id": "comp-1b" },
    { "student_id": "jason", "item_id": "comp-3" }
  ],
  "notes": "First calibration run. Blind coding — gold labels not exposed."
}
```

---

## *.output.json format

The raw AI coding output, validated against `.cursor/skills/artifact-coding/schemas/output.schema.json`. Contains the `model` field identifying the AI system that produced it. Gold labels are not included in this file.

---

## *.comparison.json format

Structured disagreement record produced after comparing the AI output to the gold. Completed by the human researcher.

```json
{
  "_meta": {
    "run_id": "run-001",
    "student_id": "jason",
    "item_id": "comp-1b",
    "compared_at": "YYYY-MM-DD"
  },
  "structural_development": {
    "gold": "Moderate Addition",
    "ai": "Significant Addition",
    "agreement": false,
    "disagreement_type": "structural_threshold",
    "notes": "..."
  },
  "semantic_events": {
    "gold_count": 3,
    "ai_count": 4,
    "agreement": false,
    "matched_events": [
      {
        "event_index_gold": 0,
        "event_index_ai": 0,
        "code_agreement": true,
        "evidence_alignment": "good",
        "notes": ""
      }
    ],
    "missed_by_ai": [],
    "extra_by_ai": [
      {
        "event_index_ai": 3,
        "code": "New",
        "ai_post_evidence": "...",
        "disagreement_type": "hallucinated_event",
        "notes": "..."
      }
    ],
    "code_mismatches": []
  },
  "learner_agency": {
    "agreement": true,
    "notes": ""
  },
  "overall_agreement": false,
  "primary_disagreement_types": ["hallucinated_event"],
  "action": "update_decision_rules",
  "action_notes": "Consider tightening the EXPAND-vs-NEW rule."
}
```

---

## Disagreement type vocabulary

Use these controlled values in `disagreement_type` fields. New types may be added.

| Type | Meaning |
|---|---|
| `missed_event` | AI failed to identify a semantic event that gold labels |
| `hallucinated_event` | AI produced an event with no counterpart in gold |
| `events_collapsed` | AI merged two distinct gold events into one |
| `events_split` | AI split one gold event into two |
| `code_mismatch` | AI identified the same change but applied the wrong code |
| `structural_threshold` | AI and gold agree on direction but disagree on Moderate vs Significant |
| `wrong_structural_direction` | AI and gold disagree on the direction of structural change |
| `agency_unsupported` | AI coded learner agency with insufficient textual evidence |
| `agency_missed` | AI missed a learner agency event present in gold |
| `stylistic_as_semantic` | AI treated a stylistic change as a semantic event |

---

## Current contents

*(Empty. No runs have been executed yet.)*
