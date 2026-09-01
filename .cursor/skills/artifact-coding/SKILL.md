---
name: artifact-coding
description: >
  Code a single PRE/POST open-text artifact pair from the CHI26 research dataset.
  Use when given a student_id, item_id, and pre/post responses and asked to produce
  structured artifact coding (Structural Development, Semantic Change Events,
  optional Learner Agency / Metacognition). Alignment is order- and position-invariant;
  unitization is item-type-specific; New/Removed require lineage failure, not forced matches.
---

# Artifact Coding Skill

## Overview

This skill produces structured qualitative coding of a single PRE/POST survey response pair.

The unit of analysis is one matched pre/post response pair for the same survey item from the same student. The coder analyzes what changed between the two responses at a semantic level.

**This is artifact-only coding.**
The coder reads only the two text responses. It does not read ChatGPT interaction logs, infer student intention, assess whether text was copied from AI, or reason about causal process. Evidence must come from the artifact text itself.

**Alignment is order-invariant and position-invariant.**
Concepts are matched by semantic function and conceptual continuity, never by list index, sentence number, token order, phrase order, or surface position. Reordering alone is not a semantic change.

**NULL matches are permitted.** Complete one-to-one matching is not required. An implausible match is worse than Removed + New.

## Reference materials

Read these files before coding. They are authoritative.

1. [`references/codebook.md`](references/codebook.md) — normative definitions of every code
2. [`references/decision-rules.md`](references/decision-rules.md) — operational rules for ambiguous boundaries
3. [`references/boundary-cases.md`](references/boundary-cases.md) — specific difficult cases with guidance
4. [`references/item-guidance.md`](references/item-guidance.md) — unitization modes and item-type guidance
5. [`references/critic.md`](references/critic.md) — pass-2 lightweight critic instructions (used by the runtime critic call, not loaded into pass 1)

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

Pipeline:
`QUESTION TYPE → UNITIZATION MODE → PRE inventory → POST inventory → candidate cross-product → provisional alignment (NULL allowed) → alignment critique → code comparison → Structural Development`

A separate lightweight critic pass (see `references/critic.md`) runs downstream on the provisional output. Pass 1 should still perform alignment and code self-critique so the critic has clean candidates.

### Step 0 — Determine unitization mode

Route using `question_id` first, then `item_name`, per `references/item-guidance.md`:
- `descriptor_set_special` — **Q1a Brand Identity and Q1c Core Values only**
- `semantic_phrase` (Brand Vision, Product Offering, narratives)
- `scoped_category` (Target Customer, audience items)

Then atomize PRE and POST according to that mode. The concept inventory must contain **atomic** semantic units suitable for one-to-one or one-to-null lineage analysis.

For `descriptor_set_special`:
- split comma-separated / `&`-joined / `and`-joined / bulleted / newline-separated descriptors;
- preserve multi-word descriptors (`Community-Building`, `Theory-Based`) as one unit;
- **never** bundle the entire list into one concept or one event;
- **never** align by order;
- output must be descriptor-level, not whole-list-level.

Do not route other items into `descriptor_set_special` just because their answer is short. It is item-specific by design.

Record `unitization_mode` in `concept_alignment`.

### Step 1 — Read in full

Read both the pre-response and post-response completely before analyzing anything.

### Step 2 — PRE concept inventory

List every distinct atomic concept in PRE as an **unordered set**. Do not look at POST yet. Ignore list position, sentence number, and token order.

### Step 3 — POST concept inventory

List every distinct atomic concept in POST as an **unordered set**. Ignore list position, sentence number, and token order.

### Step 4 — Candidate alignment cross-product

Apply `GLOBAL-ALIGNMENT`, `NULL-ALIGNMENT-PERMITTED`, `SEMANTIC-NEIGHBORHOOD-LINEAGE`, and `NEIGHBORHOOD-PROTECTS-LINEAGE`.

For `descriptor_set_special` (and prefer for all modes when sets are small):
1. Enumerate the full PRE × POST cross-product as candidate alignments.
2. For each candidate, briefly assess: conceptual continuity, semantic role similarity, scope relationship, frame relationship, interpretive stretch.
3. Record candidates in `concept_alignment.candidate_alignments` with a `verdict` (`plausible` / `weak` / `implausible`).

**Neighborhood gate.** For each candidate, first ask whether the two concepts share a semantic neighborhood.
- **Shared neighborhood** → lineage must be TESTED via the transformation ladder in Step 8. Difficulty of the code choice is never grounds to skip the test. The ladder may still end at Removed + New if no tier is defensible.
- **Different conceptual domains** → the pairing may be rejected immediately, and Removed + New is preferred over a stretched match.

An implausible match is worse than Removed + New **only for different-domain pairs**.

### Step 5 — Provisional alignment (NULL allowed)

Select the strongest non-conflicting set of matches. Cross-position matches are expected. Complete matching is NOT required.

Record:
- `matched_pairs` (final provisional alignments, with brief basis)
- `rejected_alignments` (with reasons)
- `unmatched_pre` / `unmatched_post`

### Step 6 — Alignment self-critique

Before assigning codes, critique every proposed match:

- A. What conceptual continuity supports this pairing?
- B. Is there another POST concept that is a stronger successor?
- C. Do the two concepts belong to different conceptual domains with no shared semantic role?
- D. Is position or set-exhaustion the *sole* justification, **and** is there no neighborhood relation?

Reject the pairing only when C is yes, or when both conditions of D hold (flag `forced_pairing_rejected`).

**Never reject a protected pair.** If the two concepts share a semantic neighborhood, the pairing survives this step regardless of how hard the code choice is. Difficulty is resolved in Step 8 by choosing a code and recording the runner-up, not by splitting the pair.

### Step 7 — Order-invariance screen

For every surviving matched pair, apply `ORDER-vs-SEMANTIC` and `STYLE-vs-SEMANTIC`. Discard pairs whose only difference is order, formatting, or phrasing. Do not emit a semantic event for those pairs. Flag `order_change_only` when reordering was observed and deliberately not coded.

### Step 8 — Code comparison for each matched pair

Do NOT immediately assign a code. For each surviving pair, walk the transformation ladder in order and stop at the first tier that holds:

1. **Narrowed** — is POST *a specific way of being* PRE? Subsumption (从属) must hold, not mere relatedness (NARROW-REQUIRES-SUBSUMPTION). More likely when PRE is a generic filler word.
2. **Reframed** — no subsumption, but same semantic territory with a shifted organizing frame. This is the correct verdict for related *sibling* concepts.
3. **Elaborated** — POST keeps PRE intact and adds detail.
4. **Expanded** — POST broadens an identifiable PRE seed.
5. **Removed + New** — adjacency is only topical; no tier above is defensible.

Say the subsumption sentence out loud before choosing between tiers 1 and 2: *"POST is a specific way of being PRE."* True → Narrowed. False but same territory → Reframed.

Select the best-supported interpretation. Persist:
- `code`, concise `rationale`, `alternative_considered` (strongest runner-up), optional `confidence`

If Reframed, name both the pre-frame and the post-frame. Apply `VAGUE-vs-SPECIFIC` when PRE is vague and POST concretises the same idea.

Do not collapse two distinct events into one.

### Step 9 — Unmatched PRE → provisional Removed

For each unmatched PRE concept, search the entire POST set for any defensible semantic-role successor (`LAST-RESORT-NEW-REMOVED`). Mark surviving concepts as **provisional** Removed. Rationale must state that a full-response search was performed.

Never emit Removed for a concept already accounted for inside a matched pair.

### Step 10 — Unmatched POST → provisional New

Symmetric to Step 9 for unmatched POST concepts.

### Step 11 — Mandatory New/Removed re-check

Apply `MANDATORY-NEW-REMOVED-RECHECK` to every provisional New and every provisional Removed. This step is required, not discretionary. No New or Removed may be finalized without passing through it.

For each provisional event:
1. Identify the **nearest semantic counterpart** in the opposite response, even if the wording is completely different. For a New, that is the nearest PRE antecedent. For a Removed, the nearest POST successor.
2. Explicitly test whether the relationship is instead **Narrowed**, **Reframed**, **Elaborated**, or **Expanded**.
3. If any of the four is defensible, convert: drop the New and Removed, and emit one matched transformation event instead.
4. Only if all four fail across genuinely different conceptual domains may the event stay as New or Removed.

Record every check in `concept_alignment.new_removed_recheck` as `{concept, direction, nearest_counterpart, codes_tested, outcome, reason}` with outcome `kept` or `converted`. Flag `new_removed_recheck_passed` for any event that survives.

Students rarely delete an idea outright; more often they found a better way to express it. A response pair that yields only New and Removed events, with no transformations, is a strong signal that this step was not performed properly.

### Step 12 — Assign Structural Development

Make one whole-response judgment about the net structural expansion or contraction of the artifact. Consider additions and removals at the phrase, clause, sentence, and explanation level across the full response. Do not use word count alone. See `codebook.md` for code definitions and `decision-rules.md` for threshold guidance.

### Step 13 — Record Learner Agency (optional)

Only record a learner-agency event if direct textual evidence is present in the artifact: an explicit invocation of personal background, an explicit metacognitive statement, an explicit synthesis across ideas, or explicit ownership/relation language. Do not infer agency from content alone. Assign confidence. If uncertain, omit.

### Step 14 — Record uncertainty

Record:
- Overall confidence in the coding (`low` / `medium` / `high`)
- Any named boundary flags triggered (from the controlled vocabulary in `decision-rules.md`)
- Any residual coder notes needed for research auditability

Do not expose verbose internal reasoning in the persisted output. Persist only concise evidence and rationale sufficient for a second coder to understand the judgment. During calibration, also persist debug alignment fields (`unitization_mode`, candidates, rejected, alternatives).

## Pass 2 — Lightweight critic (runtime)

After pass 1 produces provisional output, the application runtime calls a second MiniMax pass using `references/critic.md`. That pass receives only concepts, proposed alignments, and provisional codes.

The critic is **bidirectional**. Its primary duty is lineage recovery: for every provisional New and Removed it searches for the nearest counterpart and converts the pair into a matched transformation when defensible (`restore_lineage`). Its secondary duty is rejecting pairings forced between different-domain concepts (`reject_pairing`). A semantic-neighborhood gate decides which duty applies, so the two never contest the same concepts.

It returns corrections (`restore_lineage` / `reject_pairing` / `recode` / `add_pairing` / `confirm`) plus corrected final arrays. The runtime merges corrections into the AI draft without re-running the full artifact prompt.

## Output

Full schema: [`schemas/output.schema.json`](schemas/output.schema.json).

### Key rules

- `concept_alignment` records unitization mode, PRE/POST inventories, candidate alignments, rejected alignments, matched pairs, unmatched PRE/POST, the mandatory `new_removed_recheck` entries, and any order-only changes. Populate this before emitting semantic events.
- Every `New` and `Removed` event must have a corresponding `new_removed_recheck` entry.
- `semantic_events` is an array. It may contain zero or more entries.
- The same `code` value may appear in multiple entries. Two separate `Reframed` changes in one response pair → two separate objects, each with distinct `pre_evidence` and `post_evidence`.
- `pre_evidence`: brief quoted or closely paraphrased span from the pre-response. Set to `null` for `New` events.
- `post_evidence`: brief quoted or closely paraphrased span from the post-response. Set to `null` for `Removed` events.
- Optional per-event `confidence`: `low` / `medium` / `high`.
- Optional per-event `alternative_considered`: strongest runner-up code or `"Removed+New"`.
- `structural_development` is a single object, not an array.
- `learner_agency` is optional. May be omitted or empty `[]`.
- `uncertainty` is always present. Use `confidence: "high"` and empty `flags` if no issues arose.

## Calibration isolation rule

This skill may be run on items that are also present in `calibration/gold/`.
When that occurs, the gold labels in `calibration/gold/` must NOT be consulted.
The coding output must be produced from the codebook and decision rules alone,
so that the output can later be compared against gold for calibration purposes.
See `calibration/gold/README.md` for details on the isolation protocol.
