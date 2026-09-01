# Decision Rules

**Version:** v5 (subsumption / transformation-ladder revision)
**Status:** Updated after MiniMax run-3 review. Rules carry a `[STABLE]`, `[PROVISIONAL]`, or `[FLAGGED]` status marker.

Decision rules are operational tools for resolving ambiguous coding boundaries. They are distinct from the codebook (which defines what codes mean) and from boundary cases (which document specific hard examples).

When a rule is applied during coding, name it explicitly in the event's `rationale` field.

---

## Rule index

| Rule ID | Boundary | Status |
|---|---|---|
| ORDER-vs-SEMANTIC | Ordering / position change vs semantic change | STABLE |
| GLOBAL-ALIGNMENT | How PRE and POST units are matched before classification | STABLE |
| NULL-ALIGNMENT-PERMITTED | Incomplete / one-to-null matching is allowed | STABLE |
| NEIGHBORHOOD-PROTECTS-LINEAGE | What neighborhood guarantees; the transformation ladder | STABLE |
| NARROW-REQUIRES-SUBSUMPTION | Narrowed vs Reframed — the decisive test | STABLE |
| IMPLAUSIBLE-MATCH-WORSE-THAN-NEW-REMOVED | Forced pairing vs Removed + New (different domains only) | STABLE |
| MANDATORY-NEW-REMOVED-RECHECK | Required search before finalizing New / Removed | STABLE |
| SEMANTIC-NEIGHBORHOOD-LINEAGE | Lineage without synonymy | PROVISIONAL |
| STYLE-vs-SEMANTIC | Stylistic rewrite vs any semantic change | STABLE |
| ELAB-vs-REFRAME | Elaborated vs Reframed | PROVISIONAL |
| REFRAME-NOT-DEFAULT | When Reframed may not be used as fallback | STABLE |
| ELAB-vs-NARROW | Elaborated vs Narrowed | PROVISIONAL |
| NARROW-ABSTRACT | Narrowed for abstract / qualitative attributes | PROVISIONAL |
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
- Emotion-Appealing → Authentic (possible Narrowed or Reframed — compare codes)
- Customer-Centricity → NULL (Removed)
- NULL → Theory-Based (New)

The specific answer is not fixed. The requirement is that index has no authority and NULL is allowed.

**No double-counting:** never emit a Removed event for a concept already accounted for inside a matched pair.

---

## NULL-ALIGNMENT-PERMITTED
**Boundary:** Incomplete / one-to-null matching is allowed.
**Status:** STABLE

**Rule:** Matching need not be complete or one-to-one. A PRE concept may map to:

- one plausible POST successor, OR
- NULL → candidate Removed

A POST concept may map from:

- one plausible PRE antecedent, OR
- NULL → candidate New

Never pair two leftovers merely to exhaust the sets. Complete matching is not a goal.

**Flag:** `alignment_null_by_choice` when a concept is deliberately left unmatched after candidate comparison.

**Limit:** NULL is only available to concepts that fail MANDATORY-NEW-REMOVED-RECHECK. NULL is not a convenience for hard pairs.

---

## NEIGHBORHOOD-PROTECTS-LINEAGE
**Boundary:** What a shared semantic neighborhood does and does not guarantee.
**Status:** STABLE — revised after run-004 human review

**Rule:** A shared semantic neighborhood makes lineage **mandatory to test**. It does NOT make a transformation code mandatory to assign.

Neighborhood forbids skipping the analysis. It does not forbid the conclusion that no defensible transformation exists.

**A pairing may NOT be split merely because:**
- the wording differs;
- lexical overlap is weak;
- the two terms are not synonyms;
- both concepts happened to be the last unmatched items;
- the coder prefers to avoid a difficult code choice.

**A pairing MAY still resolve to Removed + New if,** after running the ladder below, none of the four transformation codes is defensible — even when the two concepts are topically adjacent.

### The transformation ladder

Apply in order. Stop at the first tier that holds.

| Tier | Condition | Code |
|---|---|---|
| 1 | POST is a **specific way of being / doing** PRE (subsumption holds) | **Narrowed** |
| 2 | No subsumption, but both concepts occupy the **same semantic territory** and the organizing frame shifts | **Reframed** |
| 3 | POST keeps PRE intact and adds detail | **Elaborated** |
| 4 | POST **broadens** an identifiable PRE seed | **Expanded** |
| 5 | Adjacency is only **topical**; no tier above is defensible | **Removed + New** |

Tier 5 is a legitimate destination. Reaching it after honest testing is correct coding, not laziness. What is forbidden is jumping to tier 5 without running tiers 1 through 4.

**Calibrated examples (human-confirmed, run-004 review):**

| Pair | Tier | Code | Why |
|---|---|---|---|
| `Fun → Interactive` | 1 | Narrowed | "Interactive" is a specific way of being fun; PRE is generic |
| `Emotion-Appealing → Authentic` | 1 | Narrowed | "Authentic" is a specific affective register; PRE is generic |
| `Community-Building → Relatable` | 2 | Reframed | Genuinely related, but relatability is NOT a subtype of community-building — no 从属 relation |
| `Lifestyle-Oriented → Expressive` | 5 | Removed + New | Adjacency is topical only; no defensible transformation |
| `Customer-Centricity → Theory-Based` | 5 | Removed + New | Different conceptual domains entirely |

**Interaction with IMPLAUSIBLE-MATCH-WORSE-THAN-NEW-REMOVED:** that rule fires immediately for different-domain concepts. For same-neighborhood concepts, the ladder runs first and may still arrive at tier 5.

**Flag:** `neighborhood_protected` when a pairing was preserved under tiers 1–4. Flag `neighborhood_tested_no_lineage` when a neighborhood pair ran the ladder and still resolved to tier 5.

---

## NARROW-REQUIRES-SUBSUMPTION
**Boundary:** Narrowed vs Reframed — the decisive test.
**Status:** STABLE — added after run-004 human review

**Rule:** Narrowed requires a **subsumption relation (从属)**. The POST concept must be a specific instance, realization, or mode of the PRE concept. Mere relatedness, adjacency, or "POST feels more concrete" is NOT enough.

**The decisive test — say it out loud:**

> "**POST** is a specific way of being / doing **PRE**."

- If that sentence is TRUE → **Narrowed**.
- If it is FALSE but both concepts occupy the same semantic territory → **Reframed**.
- If it is FALSE and the territory is not shared → **Removed + New**.

**Worked applications:**

| Test sentence | Verdict | Code |
|---|---|---|
| "Interactive is a specific way of being Fun." | TRUE | Narrowed |
| "Authentic is a specific way of being Emotion-Appealing." | TRUE | Narrowed |
| "Enthusiasts are a specific kind of individuals." | TRUE | Narrowed |
| "Relatable is a specific way of being Community-Building." | FALSE — relatability is a sibling quality, not a subtype | Reframed |
| "Expressive is a specific way of being Lifestyle-Oriented." | FALSE — and territory is not shared | Removed + New |

### PRE-genericness signal

Narrowed is far more likely when the PRE term is a **generic filler descriptor** — the kind of loose word students reach for before they have thought the concept through. `Fun`, `nice`, `cool`, `good`, `interesting`, `Emotion-Appealing` are generic in this sense. When PRE is generic and POST is substantive, the student has usually specified the same vague idea, so subsumption typically holds.

When the PRE term is **already substantive and specific** — `Community-Building`, `Customer-Centricity`, `Lifestyle-Oriented`, `Theory-Based` — a different POST term is usually a *sibling* concept, not a subtype. Prefer Reframed, or tier 5 if the territory is not shared.

Ask: **"Was the PRE word generic enough that POST could be a version of it?"** If PRE was already specific, Narrowed is probably wrong.

**Flag:** `boundary_case_narrow_vs_reframe` whenever the subsumption test is arguable in either direction.

---

## IMPLAUSIBLE-MATCH-WORSE-THAN-NEW-REMOVED
**Boundary:** Forced pairing vs Removed + New, for DIFFERENT-DOMAIN concepts only.
**Status:** STABLE

**Rule:** AN IMPLAUSIBLE MATCH IS WORSE THAN REMOVED + NEW — **but only when the two concepts occupy genuinely different conceptual domains.**

**Scope test (apply first):** Do the two concepts share a semantic neighborhood?
- **YES** → this rule does not fire immediately. Run the transformation ladder first (NEIGHBORHOOD-PROTECTS-LINEAGE). If every tier fails, Removed + New is still available at tier 5.
- **NO** → this rule applies immediately. Prefer Removed + New over a stretched pairing.

**Positive example (rule applies):**
`Customer-Centricity → Theory-Based`
- audience-orientation and epistemic grounding are different conceptual domains;
- no shared neighborhood exists;
- Removed + New is more defensible.

Therefore: Customer-Centricity = Removed; Theory-Based = New.

**Counter-example (rule must NOT be applied):**
`Emotion-Appealing → Authentic`
- both concern how the brand is affectively experienced and received;
- a shared neighborhood exists, so the pair is protected;
- splitting this into Removed + New is an ERROR.

Correct handling is to compare Narrowed against Reframed and select the better-supported code. `Authentic` as a more specific manifestation of emotional appeal supports Narrowed.

**Flag:** `forced_pairing_rejected` when a different-domain pairing is rejected for this reason.

---

## MANDATORY-NEW-REMOVED-RECHECK
**Boundary:** Required search before finalizing New / Removed.
**Status:** STABLE

**Rule:** New and Removed may NEVER be finalized directly from an alignment gap. Every provisional New and every provisional Removed MUST first pass a nearest-counterpart search. This check is mandatory, not discretionary.

Students rarely delete an idea outright. Far more often they find a better way to express the same idea. Treat New/Removed as the rare case it is.

### Before New

Ask: **"Which PRE concept is the nearest semantic antecedent, even if the wording is different?"**

Identify the nearest candidate, then explicitly test whether the relationship is instead:
- Narrowed
- Reframed
- Elaborated
- Expanded

Only if none of those four is defensible may the POST concept remain New.

### Before Removed

Ask: **"Which POST concept is the nearest semantic successor, even if the wording is different?"**

Identify the nearest candidate, then test the same four relationships.

Only if none is defensible may the PRE concept remain Removed.

### Recording

Record every re-check in `concept_alignment.new_removed_recheck` with the concept, direction, nearest counterpart, codes tested, and outcome (`kept` or `converted`). A New or Removed event with no corresponding re-check entry is an incomplete coding.

**Worked examples:**
- `self-expression` = Removed and `individuality` = New must NOT be finalized without testing `self-expression → individuality`. These share an identity/expression neighborhood, so the correct outcome is `converted` to Reframed or Narrowed depending on context.
- `Emotion-Appealing` = Removed and `Authentic` = New must NOT be finalized without testing `Emotion-Appealing → Authentic`. Shared affect neighborhood, so `converted`, most plausibly Narrowed.
- `Customer-Centricity` = Removed with nearest counterpart `Theory-Based`: all four relationships fail across different conceptual domains, so outcome is `kept`.

**Flag:** `new_removed_recheck_passed` when a New/Removed survived the re-check.

---

## SEMANTIC-NEIGHBORHOOD-LINEAGE
**Boundary:** Conceptual lineage without requiring synonymy.
**Status:** PROVISIONAL

**Rule:** Conceptual lineage may exist when PRE and POST belong to the same broader conceptual neighborhood even when wording differs substantially. A successor does NOT need to be a synonym, lexically similar, or propositionally equivalent. It may continue, reinterpret, concretize, redirect, or transform the semantic role played by the PRE concept.

Strict synonymy is NOT required and must never be used as the lineage threshold.

**Diagnostic question:**
"Does the POST concept plausibly continue, reinterpret, concretize, redirect, or transform the semantic role played by this PRE concept?"

If yes, the lineage **must be tested** against every tier of the transformation ladder before any split is considered (NEIGHBORHOOD-PROTECTS-LINEAGE). If every tier fails, or the concepts occupy different conceptual domains, Removed + New is the correct outcome.

**Example neighborhoods in this dataset (reasoning examples, NOT a synonym dictionary):**
- self-expression / individuality / identity
- community-building / relatability / social connection
- fun / interactivity / engagement
- emotion-appealing / authentic / affective resonance
- customers / users / enthusiasts / audience
- community / community-driven space

**Not a neighborhood:** `lifestyle-oriented ↔ expressive`. Aspirational lifestyle positioning and individual expressiveness are only topically adjacent; human review confirmed these resolve to Removed + New (BC-003).

### Abstraction ceiling

A neighborhood must be nameable at a **specific** level. If the shared territory can only be stated by climbing to a broad umbrella — "identity", "self-presentation", "brand quality", "positioning", "experience", "values" — there is NO neighborhood, and the pair belongs at tier 5.

Diagnostic: **"Could this same shared territory be claimed for almost any two descriptors in this item?"** If yes, the neighborhood is an artifact of over-abstraction. Do not use it to justify lineage.

`Lifestyle-Oriented ↔ Expressive` claimed via "identity / self-presentation" is the canonical instance of this error.

Neighborhood does not by itself pick a code. Run the ladder in NEIGHBORHOOD-PROTECTS-LINEAGE and the subsumption test in NARROW-REQUIRES-SUBSUMPTION. Neighborhood presence makes lineage mandatory to *test*; it does not guarantee that a transformation code will be assigned.

**Flag:** `neighborhood_lineage_only` when the match rests on neighborhood role rather than closer lexical/propositional continuity.

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

## REFRAME-NOT-DEFAULT
**Boundary:** When Reframed may not be used as a fallback.
**Status:** STABLE

**Rule:** Reframed is only valid when ALL THREE hold:
1. there is clear conceptual lineage, AND
2. the same underlying semantic territory persists, AND
3. the organizing frame / emphasis / interpretation changes.

**Reframed is the correct middle tier.** It is the right answer when two concepts are genuinely related but neither subsumes the other — sibling concepts within one territory. Do not force such pairs into Narrowed just because POST sounds more concrete. `Community-Building → Relatable` is the canonical case: related, but no subsumption, therefore Reframed.

Under-using Reframed is as much an error as over-using it. The guard below is against Reframed as a *fallback for unanalyzed pairs*, not against Reframed as a considered tier-2 verdict.

**Reframed must NOT be used simply because:**
- two words are different;
- two abstract values are loosely related;
- neither Narrowed nor Expanded seems obvious;
- the system wants to avoid Removed + New.

If the pairing itself is weak, prefer NULL alignment and New/Removed (apply IMPLAUSIBLE-MATCH-WORSE-THAN-NEW-REMOVED).

Prefer Narrowed over Reframed **only when the subsumption test passes** (NARROW-REQUIRES-SUBSUMPTION). If POST is merely a related sibling concept, Reframed is correct and must not be downgraded. Flag `reframe_downgraded` only when subsumption genuinely holds.

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

## NARROW-ABSTRACT
**Boundary:** Narrowed for abstract / qualitative attributes (beyond literal set-subset).
**Status:** PROVISIONAL

**Rule:** Narrowed is not limited to literal set-subset relationships. A vague or broad qualitative attribute may become a more specific manifestation of that attribute.

**Diagnostic question:**
"Does the POST concept represent a more specific, concrete, or constrained manifestation of the broader PRE idea?"

**This is not sufficient on its own.** It must be backed by the subsumption test in NARROW-REQUIRES-SUBSUMPTION: POST must be *a specific way of being* PRE. "More concrete" without subsumption is Reframed, not Narrowed.

This rule matters most for short descriptor / value items (`descriptor_set_special`), where PRE terms are often generic.

**Worked examples (subsumption holds → Narrowed):**
- `Emotion-Appealing → Authentic` — "Authentic" is a specific register of emotional appeal, and PRE is generic.
- `Fun → Interactive` — "Interactive" concretizes a vague "Fun" experience into a specific mode of engagement.
- `individuals → enthusiasts` — population restriction; enthusiasts are a kind of individual.

**Counter-example (subsumption fails → NOT Narrowed):**
- `Community-Building → Relatable` — relatability is a sibling social quality, not a subtype of community-building. Code Reframed.

Always compare Narrowed against Reframed and Removed+New before locking the code (pairwise counterfactual critique).

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

**Rule:** New and Removed are last-resort classifications. "Last resort" means *after lineage failure* — and lineage failure is the ONLY justification.

**Before assigning New:**
Run MANDATORY-NEW-REMOVED-RECHECK. Search the entire PRE response for any defensible conceptual lineage or semantic-role antecedent (not merely a similar phrase). Ignore ordering and position. Different wording, different order, or different location are not sufficient evidence of absence. The rationale must state that a full-response search was performed.

**Before assigning Removed:**
Run MANDATORY-NEW-REMOVED-RECHECK. Search the entire POST response for any defensible conceptual lineage or semantic-role successor. Same conditions.

**Key test (not similarity):**
"Is there any defensible conceptual lineage or semantic-role successor anywhere in the opposite response?"

Only if the answer is genuinely NO should New or Removed be assigned.

**Interpretive difficulty is NOT a justification.** A pairing that is hard to classify is still a pairing. Difficulty choosing between Narrowed and Reframed must be resolved by choosing one and recording the other in `alternative_considered` — never by falling back to Removed + New. Only a genuine absence of lineage, across different conceptual domains, licenses these codes.

**Examples:**
- `self-expression` → `individuality`: do NOT assign Removed + New. Shared neighborhood; classify as Reframed or Narrowed.
- `Emotion-Appealing` → `Authentic`: do NOT assign Removed + New. Shared neighborhood; compare Narrowed against Reframed.
- `Customer-Centricity` vs `Theory-Based`: different conceptual domains, no defensible lineage → Removed + New is correct.

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
| `forced_pairing_rejected` | A different-domain pairing was rejected as implausible / positionally forced |
| `alignment_null_by_choice` | A concept was deliberately left unmatched after candidate comparison |
| `reframe_downgraded` | Reframed was considered but a stronger alternative (often Narrowed) was selected |
| `neighborhood_lineage_only` | Match rests on semantic-neighborhood role rather than closer continuity |
| `new_removed_recheck_passed` | A New/Removed survived the mandatory nearest-counterpart re-check |
| `lineage_restored_by_critic` | The critic converted a provisional New+Removed pair back into a matched transformation |
| `neighborhood_protected` | A pairing was preserved under tiers 1-4 of the transformation ladder |
| `neighborhood_tested_no_lineage` | A neighborhood pair ran the full ladder and still resolved to Removed + New |
| `boundary_case_narrow_vs_reframe` | The subsumption test was arguable in either direction |
| `double_counted_event_dropped` | A Removed/New event contradicted a matched pair and was dropped by the consistency check |
| `duplicate_pre_antecedent` | One PRE unit served as the antecedent of more than one event; the span likely needs splitting |
