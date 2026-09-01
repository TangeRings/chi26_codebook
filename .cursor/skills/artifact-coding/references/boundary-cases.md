# Boundary Cases

**Version:** v3 (calibration round 1 — run-004 human review, run-005 verification)
**Status:** Five resolved cases (BC-001 to BC-005). BC-P005 resolved.

This file documents specific difficult coding cases encountered during human coding or calibration, with the resolution that was applied and the reasoning behind it. It grows over time.

Each case is a concrete example of an ambiguous judgment, identified by a boundary type and a resolution status.

---

## How to use this file

During coding: if you encounter a change that matches a case documented here, apply the same resolution and reference the case ID in your `rationale` (e.g., `"see BC-001"`).

During calibration: when a disagreement reveals a recurring ambiguity, add a new case entry here and update the relevant rule in `decision-rules.md`.

---

## Case format

```
### BC-NNN: [Short description]
**Boundary:** [Rule ID(s) involved]
**Item type:** [e.g., Brand Vision, Target Customer]
**Status:** RESOLVED / UNRESOLVED / FLAGGED-FOR-CALIBRATION
**Pre span:** "..."
**Post span:** "..."
**Resolution:** [Code applied]
**Reasoning:** [Why this resolution was chosen]
**Notes:** [Anything that should trigger a rule update]
```

---

## Known boundary patterns (pre-calibration)

The following patterns have been identified as likely sources of difficulty based on the codebook and initial item review. Cases documenting actual instances will be added during calibration.

---

### BC-P001: Descriptor addition to a noun phrase
**Boundary:** ELAB-vs-REFRAME
**Status:** FLAGGED-FOR-CALIBRATION
**Pattern:** Pre contains noun phrase X. Post contains X with one or more adjectives or modifiers added (e.g., "products" → "cute merchandised products").
**Expected resolution:** Elaborated, provided the added descriptors do not shift the fundamental category of the concept.
**Calibration note:** Confirm whether added descriptors ever cross the threshold into reframing (e.g., "products" → "luxury artisanal products" may carry frame-level implications beyond mere detail addition).

---

### BC-P002: Brand framing shift — relational to experiential
**Boundary:** ELAB-vs-REFRAME
**Status:** FLAGGED-FOR-CALIBRATION
**Pattern:** Pre frames the brand in terms of interpersonal connection or community. Post frames the same brand in terms of shared experience or a collective event/outcome.
**Expected resolution:** Reframed, if the conceptual emphasis has shifted from relational (about the bond between people) to experiential (about what people undergo together). These are distinct conceptual frames even if their subject matter overlaps.
**Calibration note:** Boundary is close. Needs human-coded examples before finalizing. Some instances may be Elaborated if the connection framing persists underneath.

---

### BC-P003: Entirely new secondary audience
**Boundary:** EXPAND-vs-NEW
**Status:** FLAGGED-FOR-CALIBRATION
**Pattern:** Pre describes one target audience. Post introduces a second, entirely distinct audience segment with no antecedent in pre.
**Expected resolution:** New (for the additional audience segment), not Expanded of the original segment. The original audience may itself be coded separately if it also changed.
**Calibration note:** Distinguish from cases where the original audience definition is broadened in place (→ Expanded).

---

### BC-P004: Concept present in pre but absent in post without explicit negation
**Boundary:** REMOVE-vs-REFRAME
**Status:** FLAGGED-FOR-CALIBRATION
**Pattern:** Pre contains concept X. Post does not contain X or anything obviously about X, but the post does contain a new concept Y that is superficially related.
**Expected resolution:** Depends on whether Y can be read as a reconception of X (→ Reframed) or whether X and Y are genuinely about different subjects (→ Removed + New pair).
**Calibration note:** Requires calibration to establish how much semantic overlap is required to count as Reframed vs a Removed/New pair.

---

### BC-P005: Core values / identity keywords — label swap
**Boundary:** ELAB-vs-REFRAME, REMOVE-vs-REFRAME
**Status:** RESOLVED (run-004 review) — superseded by the `descriptor_set_special` procedure
**Pattern:** Brand identity or core values items where pre and post each contain a list of keywords (e.g., "Fun, Community-Building, Lifestyle-Oriented" → "Relatable, Interactive, Expressive"). The lists share no overlapping terms and it is unclear whether individual items have been replaced or the entire framing has been reconceived.
**Resolution:** **Descriptor-level coding, always.** Q1a and Q1c use the `descriptor_set_special` unitization mode: one descriptor = one atomic concept, full cross-product evaluation, descriptor-level events. A single whole-list event such as `[Fun, Community-Building, Lifestyle-Oriented] → [Relatable, Interactive, Expressive] = Reframed` is **forbidden output**.
**Reasoning:** The earlier open question — whether keyword lists warrant a single whole-item code — is now answered no. Human review of this exact case produced three different codes across the three descriptor pairs (Narrowed, Reframed, Removed+New; see BC-001, BC-002, BC-003), which a whole-list code would have erased entirely.
**Notes:** Do not cite this case to justify collapsing a descriptor list. Different pairs in one set routinely land on different tiers of the transformation ladder.

---

### BC-P006: Metacognition vs content statement about AI use
**Boundary:** AGENCY-EVIDENCE
**Status:** FLAGGED-FOR-CALIBRATION
**Pattern:** Post-survey or post-response items where a student describes what AI helped them do. This is a content statement about a tool's function, not a metacognitive statement about the student's own reasoning process.
**Expected resolution:** Do not code as Metacognition unless the student explicitly reflects on their own thinking strategy (e.g., "I deliberately chose to ask narrow questions because broad questions gave me useless answers").
**Calibration note:** The distinction between "AI did X for me" and "I reflected on how I was using AI" is central to the agency layer. Calibration cases needed.

---

## Cases added post-calibration

### BC-001: Generic PRE descriptor specified in POST
**Boundary:** NARROW-REQUIRES-SUBSUMPTION, NARROW-ABSTRACT
**Item type:** Q1a Brand Identity (`descriptor_set_special`)
**Status:** RESOLVED (human-confirmed, run-004 review)
**Pre span:** "Fun"
**Post span:** "Interactive"
**Resolution:** Narrowed
**Reasoning:** The subsumption test passes — "Interactive is a specific way of being Fun" is true. `Fun` is a generic filler descriptor of the kind students use before thinking a concept through, so POST reads as a specific realization of the same vague idea rather than a different idea.
**Notes:** Establishes the PRE-genericness signal. Generic PRE + substantive POST usually means subsumption holds.

---

### BC-002: Related sibling descriptors with no subsumption
**Boundary:** NARROW-REQUIRES-SUBSUMPTION, ELAB-vs-REFRAME
**Item type:** Q1a Brand Identity (`descriptor_set_special`)
**Status:** RESOLVED (human-confirmed, run-004 review)
**Pre span:** "Community-Building"
**Post span:** "Relatable"
**Resolution:** Reframed
**Reasoning:** The two concepts are genuinely related within the social-connection territory, but there is no 从属 / subsumption relation between them — "Relatable is a specific way of being Community-Building" is false. Relatability is a sibling quality, not a subtype. `Community-Building` is also already a substantive, specific concept rather than a generic filler, which further argues against Narrowed.
**Notes:** This is the canonical Narrowed-vs-Reframed discriminator. Run-004 initially coded this Narrowed; human review corrected it to Reframed. Relatedness alone must never produce Narrowed.

---

### BC-003: Topically adjacent descriptors with no defensible lineage
**Boundary:** NEIGHBORHOOD-PROTECTS-LINEAGE, LAST-RESORT-NEW-REMOVED
**Item type:** Q1a Brand Identity (`descriptor_set_special`)
**Status:** PROVISIONAL (human lean, run-004 review; coder expressed some uncertainty)
**Pre span:** "Lifestyle-Oriented"
**Post span:** "Expressive"
**Resolution:** Removed (Lifestyle-Oriented) + New (Expressive)
**Reasoning:** Aspirational lifestyle positioning and individual expressiveness are adjacent only topically. No tier of the transformation ladder is defensible: subsumption fails, the semantic territory is not genuinely shared, POST does not elaborate or broaden PRE. The human coder noted the student themselves likely had no clear conception of "Lifestyle-Oriented," which weakens any claimed lineage.
**Notes:** Establishes that a shared-neighborhood claim can be rejected after honest testing. Neighborhood makes lineage mandatory to *test*, not mandatory to *assign*. Marked PROVISIONAL because the human coder was not fully certain; revisit if a similar pair appears in another student.

---

### BC-004: Population restriction inside a rewritten clause
**Boundary:** NARROW-REQUIRES-SUBSUMPTION, ELAB-vs-REFRAME
**Item type:** Q1b Brand Vision (`semantic_phrase`)
**Status:** RESOLVED (run-005)
**Pre span:** "uniting individuals under a shared passion"
**Post span:** "uniting enthusiasts under a common passion"
**Resolution:** Narrowed
**Reasoning:** Enthusiasts are a proper subset of individuals, which is the clearest possible subsumption relation. The surrounding wording was also rewritten ("shared" → "common"), but that is a stylistic change and does not convert the event into Reframed. Scope restriction outranks Reframed.
**Notes:** The critic recoded this to Reframed during run-005 while over-correcting away from Narrowed. Scope restriction now explicitly outranks Reframed in both the rules and the critic guard. Note that `shared passion → common passion` alone is style-only and produces no event.

---

### BC-005: Coordinated PRE phrase whose successors diverge
**Boundary:** UNITIZATION (`semantic_phrase`)
**Item type:** Q1b Brand Vision (`semantic_phrase`)
**Status:** RESOLVED (run-005)
**Pre span:** "focus on connection and self-expression"
**Post span:** "celebrates individuality" AND "transform personality theory into a shared experience"
**Resolution:** Split the PRE span into two atomic units, then code two events: `self-expression → celebrates individuality` (Reframed) and `connection → transform personality theory into a shared experience` (Reframed).
**Reasoning:** A single PRE unit may be the antecedent of at most one semantic event. When the two halves of a coordinated span track to different POST concepts, leaving the span bundled forces one unit to serve two antecedent roles, which is invalid output.
**Notes:** Establishes the one-PRE-unit-one-event invariant. Also enforced structurally in code: a critic `restore_lineage` may only pair units that pass 1 left in `unmatched_pre` / `unmatched_post`.

---
