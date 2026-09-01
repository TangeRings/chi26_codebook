---
name: artifact-coding
description: >
  Code a single PRE/POST open-text artifact pair from the CHI26 research dataset.
  Use when given a student_id, item_id, and pre/post responses and asked to produce
  structured artifact coding (Structural Development, Semantic Change Events,
  optional Learner Agency / Metacognition).
---

# Artifact Coding Skill

## Overview

This skill produces structured qualitative coding of a single PRE/POST survey response pair.

The unit of analysis is one matched pre/post response pair for the same survey item from the same student. The coder analyzes what changed between the two responses at a semantic level.

**This is artifact-only coding.**
The coder reads only the two text responses. It does not read ChatGPT interaction logs, infer student intention, assess whether text was copied from AI, or reason about causal process. Evidence must come from the artifact text itself.

**Alignment is order-invariant and position-invariant.**
Concepts are matched by semantic function and conceptual continuity, never by list index, sentence number, token order, phrase order, or surface position. Reordering alone is not a semantic change.

## Reference materials

Read these four files before coding. They are authoritative.

1. [`references/codebook.md`](references/codebook.md) — normative definitions of every code
2. [`references/decision-rules.md`](references/decision-rules.md) — operational rules for ambiguous boundaries, including ORDER-vs-SEMANTIC and GLOBAL-ALIGNMENT
3. [`references/boundary-cases.md`](references/boundary-cases.md) — specific difficult cases with guidance
4. [`references/item-guidance.md`](references/item-guidance.md) — item-type guidance (descriptor lists, value lists, narratives, target customer)

**No few-shot examples are loaded in this version.**
All judgments must be derived from the codebook, decision rules, and item guidance alone.
Example cases may be added to `examples/` after the calibration phase; see [`examples/README.md`](examples/README.md).

## Input

One coding unit. Full schema: [`schemas/input.schema.json`](schemas/input.schema.json).

```json
{
  "student_id": "string",
  "item_id": "string",
  "item_name": "string",
  "question_text": "string (optional)",
  "pre_response": "string",
  "post_response": "string"
}
```

**Only open-text responses are coded.**
Numeric Likert-scale items and structured grid items (e.g. Q1.1, Q2.1, Q4.2) do not receive artifact coding. If the input contains a numeric or grid answer, return a coding result with `semantic_events: []`, `structural_development.code: "No Change"`, and a `coder_notes` entry explaining the item type.

## What NOT to infer or include in output

- Whether the student was influenced by AI
- Whether text was copied from ChatGPT
- Student intention, motivation, or process
- Causal explanation for why a change occurred
- Comparisons to other students
- Interpretations of meaning beyond what the text states
- Process attributions for reordering (e.g. "AI restructured this", "the student rearranged because…")

**Allowed artifact-only phrasing for order changes:**
- "The order changed, but the same concepts remain; no semantic event is coded for the reordering."
- "The concept appears later in POST but remains the strongest semantic successor."

## Coding procedure

Follow these steps in order. Complete each before moving to the next.
Do not jump from lexical difference to code assignment. Alignment always precedes classification.

### Step 1 — Read in full

Read both the pre-response and post-response completely before analyzing anything.

### Step 2 — PRE concept inventory

List every distinct concept in PRE as an **unordered set**. Do not look at POST yet. Ignore list position, sentence number, and token order.

### Step 3 — POST concept inventory

List every distinct concept in POST as an **unordered set**. Ignore list position, sentence number, and token order.

### Step 4 — Global conceptual alignment

Apply `GLOBAL-ALIGNMENT` from `decision-rules.md`. Match across the full cross-product by conceptual role and semantic function. Ignore order and position. Cross-position matches are expected and normal. Fix the alignment before classifying anything.

Record the alignment as:
- matched pairs (with brief basis)
- unmatched PRE concepts
- unmatched POST concepts

### Step 5 — Order-invariance screen

For every matched pair, apply `ORDER-vs-SEMANTIC` and `STYLE-vs-SEMANTIC`. Discard pairs whose only difference is order, formatting, or phrasing. Do not emit a semantic event for those pairs. Flag `order_change_only` when reordering was observed and deliberately not coded.

### Step 6 — Classify surviving matched pairs

For each surviving matched pair, classify the transformation:
- Elaborated / Narrowed / Expanded / Reframed

Apply codebook definitions and relevant decision rules. If Reframed, name both the pre-frame and the post-frame in the rationale. Apply `VAGUE-vs-SPECIFIC` when PRE is vague and POST concretises the same idea.

Do not collapse two distinct events into one; retain separate entries if two independent semantic changes occur, even if they share the same code.

### Step 7 — Unmatched PRE → Removed (last resort)

For each unmatched PRE concept, search the entire POST response for any plausible conceptual successor (apply `LAST-RESORT-NEW-REMOVED`). Ignore ordering and position. Only if conceptual continuity is genuinely absent, assign Removed. The rationale must state that a full-response search was performed.

Never emit Removed for a concept already accounted for inside a matched pair.

### Step 8 — Unmatched POST → New (last resort)

For each unmatched POST concept, search the entire PRE response for any plausible conceptual antecedent (apply `LAST-RESORT-NEW-REMOVED`). Ignore ordering and position. Only if conceptual continuity is genuinely absent, assign New. The rationale must state that a full-response search was performed.

### Step 9 — Assign Structural Development

Make one whole-response judgment about the net structural expansion or contraction of the artifact. Consider additions and removals at the phrase, clause, sentence, and explanation level across the full response. Do not use word count alone. See `codebook.md` for code definitions and `decision-rules.md` for threshold guidance.

### Step 10 — Record Learner Agency (optional)

Only record a learner-agency event if direct textual evidence is present in the artifact: an explicit invocation of personal background, an explicit metacognitive statement, an explicit synthesis across ideas, or explicit ownership/relation language. Do not infer agency from content alone. Assign confidence. If uncertain, omit.

### Step 11 — Record uncertainty

Record:
- Overall confidence in the coding (`low` / `medium` / `high`)
- Any named boundary flags triggered (from the controlled vocabulary in `decision-rules.md`)
- Any residual coder notes needed for research auditability

Do not expose verbose internal reasoning in the persisted output. Persist only concise evidence and rationale sufficient for a second coder to understand the judgment.

## Output

Full schema: [`schemas/output.schema.json`](schemas/output.schema.json).

### Key rules

- `concept_alignment` records the PRE inventory, POST inventory, matched pairs, unmatched PRE, unmatched POST, and any order-only changes. Populate this before emitting semantic events.
- `semantic_events` is an array. It may contain zero or more entries.
- The same `code` value may appear in multiple entries. Two separate `Reframed` changes in one response pair → two separate objects, each with distinct `pre_evidence` and `post_evidence`.
- `pre_evidence`: brief quoted or closely paraphrased span from the pre-response. Set to `null` for `New` events.
- `post_evidence`: brief quoted or closely paraphrased span from the post-response. Set to `null` for `Removed` events.
- Optional per-event `confidence`: `low` / `medium` / `high`.
- `structural_development` is a single object, not an array.
- `learner_agency` is optional. May be omitted or empty `[]`.
- `uncertainty` is always present. Use `confidence: "high"` and empty `flags` if no issues arose.

## Calibration isolation rule

This skill may be run on items that are also present in `calibration/gold/`.
When that occurs, the gold labels in `calibration/gold/` must NOT be consulted.
The coding output must be produced from the codebook and decision rules alone,
so that the output can later be compared against gold for calibration purposes.
See `calibration/gold/README.md` for details on the isolation protocol.
