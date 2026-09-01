# Boundary Cases

**Version:** v1 (pre-calibration)
**Status:** Placeholder structure. Cases will be added after calibration round 1.

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
**Status:** FLAGGED-FOR-CALIBRATION
**Pattern:** Brand identity or core values items where pre and post each contain a list of keywords (e.g., "Fun, Community-Building, Lifestyle-Oriented" → "Relatable, Interactive, Expressive"). The lists share no overlapping terms and it is unclear whether individual items have been replaced or the entire framing has been reconceived.
**Expected resolution:** Unknown — this item type may not be well-served by event-level semantic coding in the same way that extended prose is. Flag for discussion.
**Calibration note:** Decide during calibration whether short keyword-list items warrant individual event coding or a single whole-item code.

---

### BC-P006: Metacognition vs content statement about AI use
**Boundary:** AGENCY-EVIDENCE
**Status:** FLAGGED-FOR-CALIBRATION
**Pattern:** Post-survey or post-response items where a student describes what AI helped them do. This is a content statement about a tool's function, not a metacognitive statement about the student's own reasoning process.
**Expected resolution:** Do not code as Metacognition unless the student explicitly reflects on their own thinking strategy (e.g., "I deliberately chose to ask narrow questions because broad questions gave me useless answers").
**Calibration note:** The distinction between "AI did X for me" and "I reflected on how I was using AI" is central to the agency layer. Calibration cases needed.

---

## Cases added post-calibration

*(None yet. Add cases here after calibration round 1.)*
