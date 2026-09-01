# Decision Rules

**Version:** v2 (order-invariant revision)
**Status:** Updated after MiniMax run-1 review. Rules carry a `[STABLE]`, `[PROVISIONAL]`, or `[FLAGGED]` status marker.

Decision rules are operational tools for resolving ambiguous coding boundaries. They are distinct from the codebook (which defines what codes mean) and from boundary cases (which document specific hard examples).

When a rule is applied during coding, name it explicitly in the event's `rationale` field.

---

## Rule index

| Rule ID | Boundary | Status |
|---|---|---|
| ORDER-vs-SEMANTIC | Ordering / position change vs semantic change | STABLE |
| GLOBAL-ALIGNMENT | How PRE and POST units are matched before classification | STABLE |
| STYLE-vs-SEMANTIC | Stylistic rewrite vs any semantic change | STABLE |
| ELAB-vs-REFRAME | Elaborated vs Reframed | PROVISIONAL |
| ELAB-vs-NARROW | Elaborated vs Narrowed | PROVISIONAL |
| EXPAND-vs-NEW | Expanded vs New | PROVISIONAL |
| REMOVE-vs-REFRAME | Removed vs Reframed | PROVISIONAL |
| VAGUE-vs-SPECIFIC | Vague PRE concretised in POST | PROVISIONAL |
| LAST-RESORT-NEW-REMOVED | When New / Removed may be assigned | STABLE |
| STRUCT-THRESHOLD | Moderate vs Significant (structural) | FLAGGED |
| AGENCY-EVIDENCE | Learner Agency evidence threshold | PROVISIONAL |
| NUMERIC-ITEMS | Exclusion of numeric/grid items | STABLE |

---

## ORDER-vs-SEMANTIC
**Boundary:** Ordering / position change vs semantic change.
**Status:** STABLE

**Rule:** A change in ordering, sequencing, formatting, or placement does not constitute a semantic change if the same concepts and relationships are preserved. Position carries no semantic authority.

**Diagnostic question:**
"If the PRE and POST units were reordered into the same sequence, would their meaning still differ?"

- **NO** → the difference is order-only. Do not emit a semantic event.
- **YES** → continue semantic classification on the residual difference. The order change itself is never the evidence.

**Order-only examples (no semantic event):**
- PRE `"Authentic, Theory-Based"` / POST `"Theory-Based, Authentic"`
- PRE `"connection, self-expression, and community"` / POST `"community, connection, and self-expression"`
- A clause moved from sentence 1 to sentence 3 with unchanged content.

**Never triggered by order alone:** Reframed, Removed, New, Expanded, Elaborated.

**Prohibited rationale patterns.** None of these are semantic evidence:
- "the concept now appears first"
- "the order was rearranged"
- "the response was restructured / reorganised / polished"

**Flag:** `order_change_only` when reordering was observed and deliberately not coded.

---

## GLOBAL-ALIGNMENT
**Boundary:** How PRE and POST units are matched before classification.
**Status:** STABLE

**Rule:** Alignment is global and set-based, never positional. Never map PRE item #1 → POST item #1 by index.

**Procedure:**
1. Inventory all PRE concepts as an UNORDERED set.
2. Inventory all POST concepts as an UNORDERED set.
3. For each PRE concept, evaluate conceptual lineage against EVERY POST concept, not only the one in the same position.
4. Select the strongest lineage across the full cross-product. Cross-position matches are expected and normal.
5. Fix the alignment BEFORE classifying anything.
6. Unmatched PRE → Removed candidates. Unmatched POST → New candidates.

**Evidence strength ordering:**
conceptual role > semantic function > lexical overlap > position

Position is the weakest evidence and may never be the sole basis for a match or a non-match.

**Worked illustration (Core Values):**
PRE `{Customer-Centricity, Emotion-Appealing}`
POST `{Authentic, Theory-Based}`

Do NOT assume Customer-Centricity→Authentic and Emotion-Appealing→Theory-Based because of index. Evaluate all four pairings. One defensible alignment:
- Emotion-Appealing → Authentic (Reframed)
- Customer-Centricity → unmatched (Removed)
- unmatched → Theory-Based (New)

The specific answer is not fixed. The requirement is that index has no authority.

**No double-counting:** never emit a Removed event for a concept already accounted for inside a matched pair.

---

## STYLE-vs-SEMANTIC
**Boundary:** Distinguishing stylistic rewrites from semantic change events.
**Status:** STABLE

**Rule:** A change is semantic only if the propositional content of the statement changes — that is, if a different idea, claim, or concept is expressed after the change than before. Rewording, paraphrasing, reordering, or reformatting that preserves the same propositional content is stylistic and does not constitute a semantic event.

**Application:**
- Capitalization, punctuation, emoji additions, or formatting changes: not semantic.
- Splitting one sentence into two sentences with identical content: not semantic.
- Replacing a word with a near-synonym where no meaningful difference in meaning exists: not semantic.
- Replacing a word or phrase where the new term carries a meaningfully different implication, scope, or frame: potentially semantic — check ELAB-vs-REFRAME.
- Same content rearranged into a different order or sentence structure: not semantic (also apply ORDER-vs-SEMANTIC).

**Tie-break:** When uncertain whether a change is purely stylistic, ask: "Would a researcher analyzing the brand concept reach a different understanding of the student's position after reading the post version vs the pre version?" If yes, treat as semantic. If no, treat as stylistic.

---

## ELAB-vs-REFRAME
**Boundary:** Distinguishing Elaborated from Reframed.
**Status:** PROVISIONAL — may be refined after calibration round 1.

**Rule:** A change is **Elaborated** if the post-response adds detail, qualification, or specificity *within* the same conceptual frame. A change is **Reframed** if the post-response shifts *which conceptual frame* the subject is viewed through.

The key diagnostic question is: **Does the post version reconceive what X is, or does it just say more about X as previously conceived?**

**Heuristic tests:**
1. *Frame persistence:* Does the pre-version's framing still accurately describe the post-version, or does the post-version require a different frame to capture it?
2. *Value/emphasis shift:* Has what is considered important or central about the concept changed, or has only more detail been added?
3. *Substitution test:* If you replaced the pre-expression with the post-expression, would the surrounding text need to change to remain coherent? (If yes, the frame has likely shifted.)

**Naming requirement for Reframed:** The rationale MUST name both the pre-frame and the post-frame (e.g. "relational frame → experiential frame"). If both frames cannot be named, it is not Reframed.

**Reframed is explicitly NOT:**
- same content in a different order;
- same descriptors rearranged;
- same sentence content reorganised;
- a phrase moved from one part of the answer to another;
- fluent rewriting or polishing without propositional change.

Do not use Reframed as a catch-all label for rewritten text.

**Default:** When genuinely uncertain between Elaborated and Reframed, prefer Elaborated and flag `boundary_case_elab_vs_reframe` in uncertainty.

---

## ELAB-vs-NARROW
**Boundary:** Distinguishing Elaborated from Narrowed.
**Status:** PROVISIONAL

**Rule:** A change is **Elaborated** if detail is added without restricting the scope of the concept. A change is **Narrowed** if the scope of the concept is restricted — the post-response refers to fewer cases, a more specific subset, or a more limited application than the pre-response.

**Application:**
- Adding an adjective that is purely descriptive (e.g., "cute") without restricting which instances qualify → Elaborated.
- Adding a qualifier that limits the concept to specific conditions or subsets (e.g., "for women aged 18-25 specifically") → Narrowed.
- Adding detail that simultaneously elaborates and restricts: record the dominant direction. Flag `boundary_case_elab_vs_narrow` if genuinely ambiguous.

---

## EXPAND-vs-NEW
**Boundary:** Distinguishing Expanded from New.
**Status:** PROVISIONAL — expected to be refined after calibration.

**Rule:** A change is **Expanded** if there is an identifiable antecedent in the pre-response that the post-response builds on by broadening its scope. A change is **New** if no meaningful antecedent exists in the pre-response.

**Key test:** Can the coder point to a specific span in the pre-response and say "this is the seed from which the post-version grew by expanding"? If yes → Expanded. If no reasonable seed exists → New.

**Loose antecedent principle:** Even a loosely related idea in the pre-response may constitute an antecedent. The threshold question is: would a reasonable second coder, reading the pre-response without the post, recognize the antecedent? If yes, lean toward Expanded. If the connection requires significant interpretive effort, lean toward New.

**Default:** When genuinely uncertain, prefer New and flag `boundary_case_expand_vs_new`. Always apply LAST-RESORT-NEW-REMOVED before assigning New.

---

## REMOVE-vs-REFRAME
**Boundary:** Distinguishing Removed from Reframed.
**Status:** PROVISIONAL

**Rule:** A change is **Removed** if a concept present in the pre-response is entirely absent from the post-response with no post-response element serving as its successor. A change is **Reframed** if the same underlying subject matter persists in the post-response but under a different conceptual framing.

**Application:**
- If concept X in pre has no counterpart in post → Removed.
- If concept X in pre has a counterpart in post that is clearly about the same subject matter but expressed differently → Reframed (not Removed + New).
- Reframed takes priority over a Removed + New pair when the coder can identify that the pre and post elements are about the same underlying subject.

**Note:** A Removed + New pair is appropriate only when the pre element and the post element are genuinely about different subjects and their co-occurrence in the same position of the response is coincidental. Position must never drive this judgment — apply GLOBAL-ALIGNMENT first.

---

## VAGUE-vs-SPECIFIC
**Boundary:** Vague PRE concept concretised in POST.
**Status:** PROVISIONAL

**Rule:** PRE responses are often vague and POST responses may make the same underlying idea more concrete. Do not treat vague-to-specific replacement as Removed + New merely because wording differs.

**Illustrations (reasoning examples, not immutable lookup rules):**
- `Fun` → `Interactive` — may represent a narrowed/refined experiential concept rather than Fun=Removed and Interactive=New.
- `individuals` → `enthusiasts` — Narrowed, because POST restricts the population.
- `building a community` → `creating a community-driven space` — likely Reframed, because the community concept persists but its representation shifts.

**Key test:** Is there a plausible conceptual lineage from the vague PRE idea to the more concrete POST idea? If yes, classify the transformation (Narrowed / Elaborated / Reframed / Expanded). If no lineage can be defended after a full-response search, then and only then use Removed + New.

---

## LAST-RESORT-NEW-REMOVED
**Boundary:** When New / Removed may be assigned.
**Status:** STABLE

**Rule:** New and Removed are last-resort classifications.

**Before assigning New:**
Search the entire PRE response for any plausible conceptual antecedent. Ignore ordering and position. Different wording, different order, or different location are not sufficient evidence of absence. The rationale must state that a full-response search was performed.

**Before assigning Removed:**
Search the entire POST response for any plausible conceptual successor. Ignore ordering and position. Different wording, different order, or different location are not sufficient evidence of absence. The rationale must state that a full-response search was performed.

**New/Removed should only be used when conceptual continuity is genuinely absent.**

---

## STRUCT-THRESHOLD
**Boundary:** Distinguishing "Moderate" from "Significant" at either end of the Structural Development scale.
**Status:** FLAGGED — no stable threshold yet. To be calibrated.

**Current guidance (provisional):**
- *Significant Addition*: multiple new sentences or explanatory passages added; the post-response addresses dimensions not present at all in the pre-response.
- *Moderate Addition*: one or two meaningful clauses or sentences added; the new material extends rather than transforms the response.
- *No Change*: differences are stylistic or confined to phrasing.
- Apply symmetric logic for reductions.

**Flag:** Apply `boundary_case_structural_threshold` in uncertainty whenever the choice between Moderate and Significant is not clear.

**Note:** This rule requires calibration data before a stable threshold can be set. Do not treat the current guidance as final.

---

## AGENCY-EVIDENCE
**Boundary:** Determining whether a Learner Agency event is present.
**Status:** PROVISIONAL

**Rule:** An agency event requires explicit, direct textual evidence. Do not infer from the fact that a student improved their brand concept that they engaged metacognitively; only code agency if they explicitly state it.

**Minimal evidence threshold:**
- Personal Background: the student uses first-person language to connect the brand content to their personal history, biography, or prior experience (e.g., "I have experience in...", "because I grew up...").
- Metacognition: the student explicitly describes their own reasoning strategy, approach, or awareness of their thinking process (e.g., "I wanted to avoid...", "I deliberately...").

**Confidence rule:** If evidence is present but indirect or ambiguous, assign `confidence: "low"` rather than omitting the event entirely. If confidence remains low after consideration, omit and note in `uncertainty.coder_notes`.

---

## NUMERIC-ITEMS
**Boundary:** Items with numeric or structured-grid answers.
**Status:** STABLE

**Rule:** Items with numeric answers (Likert scales, confidence ratings) or structured grid answers (multi-row influence ratings) are excluded from semantic coding. Return `semantic_events: []` and `structural_development.code: "No Change"` with a note in `uncertainty.coder_notes`.

---

## Uncertainty flag vocabulary

Use these controlled flag names in `uncertainty.flags`. New flags may be added during calibration.

| Flag | Meaning |
|---|---|
| `boundary_case_elab_vs_reframe` | Event classification between Elaborated and Reframed is uncertain |
| `boundary_case_elab_vs_narrow` | Event classification between Elaborated and Narrowed is uncertain |
| `boundary_case_expand_vs_new` | Event classification between Expanded and New is uncertain |
| `boundary_case_remove_vs_reframe` | Event classification between Removed and Reframed is uncertain |
| `boundary_case_structural_threshold` | Moderate vs Significant structural threshold is uncertain |
| `possible_stylistic_rewrite` | Change may not constitute a semantic event |
| `possible_missed_event` | Coder notes uncertainty about whether another event was overlooked |
| `learner_agency_evidence_weak` | Agency evidence is present but indirect |
| `events_possibly_collapsed` | Two distinct changes may have been treated as one event |
| `order_change_only` | Reordering was observed and deliberately not coded as semantic |
| `positional_alignment_rejected` | Index-based alignment was considered and rejected in favour of global alignment |
| `vague_to_specific_lineage` | Vague PRE → concrete POST lineage was applied; alternative Removed+New remains possible |
