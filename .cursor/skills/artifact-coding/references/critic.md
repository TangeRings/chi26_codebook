# Alignment & Code Critic (Pass 2)

**Version:** v3 (transformation ladder + anti-over-correction guard)
**Status:** Lightweight second-pass critic. Loaded only by the critic prompt — not the full artifact-coding prompt.

This critic receives atomic concepts, proposed alignments, and provisional codes. It does NOT re-read the full codebook, boundary cases, or raw PRE/POST prose. It does not redo the coding task.

Return **corrections only** plus corrected final arrays.

---

## The critic has TWO duties, not one

A previous version of this critic could only reject pairings, which pushed every hard case toward Removed + New. That was wrong. The critic must be able to move in both directions:

1. **Recover lineage** that pass 1 split too eagerly into New + Removed. *(primary duty)*
2. **Reject pairings** that pass 1 forced between unrelated concepts.

A semantic-neighborhood gate decides which duty applies to any given pair, so the two duties can never fight over the same concepts.

---

## Stage 1 — Apply the neighborhood gate

For every proposed pair, and for every provisional New and Removed, determine: **do the two concepts share a semantic neighborhood?**

A shared neighborhood means the concepts occupy a related conceptual role — identity/expression, social connection, engagement/experience, affective resonance, audience, and so on. Strict synonymy is NOT required.

- **Shared neighborhood** → lineage must be TESTED via the ladder in Stage 4. Route to Stage 2.
- **Different conceptual domains** → route to Stage 3.

Neighborhood presence decides which path applies. Do not decide based on how hard the pair is to classify.

**Neighborhood does not guarantee a transformation code.** It guarantees the analysis is performed. A neighborhood pair that fails every tier of the ladder may still resolve to Removed + New.

### Abstraction ceiling — do NOT invent a neighborhood

A neighborhood must be nameable at a **specific** level. If the only way to state the shared territory is to climb to a broad umbrella category, there is NO neighborhood and the pair belongs at tier 5.

**Umbrella labels that do NOT establish a neighborhood** (every brand descriptor fits these, so they prove nothing):
- "identity" / "self-presentation" / "identity and expression"
- "brand quality" / "brand attribute" / "positioning"
- "experience" / "engagement" (when used loosely)
- "audience-facing characteristic"
- "values" / "aspiration"

Test: **could this same shared territory be claimed for almost any two descriptors in this item?** If yes, you have hit the abstraction ceiling. Do not recover lineage. Leave Removed + New.

**Confirmed non-neighborhood (human-verified, BC-003):**
`Lifestyle-Oriented ↔ Expressive` — aspirational lifestyle positioning and individual expressiveness are topically adjacent only. Claiming an "identity / self-presentation" territory for this pair is exactly the abstraction-ceiling error. **Correct output: Removed + New. Do NOT restore lineage on this pair.**

---

## Stage 2 — Lineage recovery (primary duty)

Inspect every provisional `New` and every provisional `Removed`.

For each one ask:

- For a **New**: "Which PRE concept is the nearest semantic antecedent, even if the wording differs?"
- For a **Removed**: "Which POST concept is the nearest semantic successor, even if the wording differs?"

Then explicitly test whether that relationship is instead **Narrowed**, **Reframed**, **Elaborated**, or **Expanded**.

If any of the four is defensible, emit a `restore_lineage` correction: remove the New and Removed events and replace them with a single matched transformation event. Add the pair to `final_alignments` and drop both concepts from `unmatched_pre` / `unmatched_post`.

Only if all four fail, across genuinely different conceptual domains, may the New or Removed stand.

**Cases this stage exists to catch:**

| Provisional | Correct action |
|---|---|
| Removed `self-expression` + New `individuality` | `restore_lineage` → one Reframed or Narrowed event |
| Removed `Emotion-Appealing` + New `Authentic` | `restore_lineage` → Narrowed (subsumption holds) |
| Removed `Fun` + New `Interactive` | `restore_lineage` → Narrowed (subsumption holds) |
| Removed `Community-Building` + New `Relatable` | `restore_lineage` → **Reframed** (related, but no subsumption) |
| Removed `Lifestyle-Oriented` + New `Expressive` | **leave as-is.** Topical adjacency only; "identity/self-presentation" is above the abstraction ceiling |
| Removed `Customer-Centricity` + New `Theory-Based` | leave as-is; different conceptual domains |

Students rarely delete an idea outright. Usually they found a better way to say it. Weight your judgment accordingly — but do not manufacture lineage where the ladder finds none.

---

## Stage 3 — Forced-pairing rejection (gated)

Applies **only** to pairs that failed the Stage 1 gate, meaning the two concepts occupy genuinely different conceptual domains.

For each such pair ask:

- **A.** What conceptual continuity supports this pairing?
- **B.** Is there another POST concept that is a stronger successor?
- **C.** Do the concepts belong to different conceptual domains with no shared semantic role?
- **D.** Is position or set-exhaustion the *sole* justification — that is, the only reason to keep the pair is that both concepts needed somewhere to go, **and** no neighborhood relation exists?

Reject only when C is yes, or when D is yes under both of its conditions.

**Question D must not fire on a protected pair.** "These were the last two unmatched concepts" is not grounds to split concepts that share a neighborhood. If a pair survived Stage 1, it is not eligible here at all.

**Valid rejection:** `Customer-Centricity → Theory-Based` — customer orientation and theoretical grounding are unrelated domains, so Removed + New is more defensible.

**Invalid rejection:** `Emotion-Appealing → Authentic` — shared affective neighborhood. Rejecting this pair is an error even though the code choice is difficult.

---

## Stage 4 — The transformation ladder

For each matched pair, walk the tiers in order and stop at the first that holds:

| Tier | Condition | Code |
|---|---|---|
| 1 | POST is **a specific way of being / doing** PRE (subsumption / 从属) | Narrowed |
| 2 | No subsumption, but same semantic territory with a shifted organizing frame | Reframed |
| 3 | POST keeps PRE intact and adds detail | Elaborated |
| 4 | POST broadens an identifiable PRE seed | Expanded |
| 5 | Adjacency is only topical; no tier above is defensible | Removed + New |

Record the strongest runner-up in `alternative_considered`.

### The subsumption test decides tier 1 vs tier 2

Say it out loud: **"POST is a specific way of being PRE."**

- TRUE → Narrowed
- FALSE, same territory → Reframed
- FALSE, territory not shared → Removed + New

| Test sentence | Verdict | Code |
|---|---|---|
| "Interactive is a specific way of being Fun." | TRUE | Narrowed |
| "Authentic is a specific way of being Emotion-Appealing." | TRUE | Narrowed |
| "Relatable is a specific way of being Community-Building." | FALSE — sibling quality | Reframed |
| "Expressive is a specific way of being Lifestyle-Oriented." | FALSE, no shared territory | Removed + New |

**PRE-genericness signal.** Subsumption usually holds when PRE is a generic filler word (`Fun`, `nice`, `cool`, `Emotion-Appealing`). It usually fails when PRE is already substantive (`Community-Building`, `Customer-Centricity`, `Lifestyle-Oriented`) — those take sibling concepts, not subtypes.

### Do not over-correct toward Narrowed

An earlier version of this critic recoded nearly every Reframed to Narrowed. That was wrong. **Only recode Reframed → Narrowed when the subsumption test actually passes.** If POST is merely a related sibling concept, Reframed is the correct verdict and must be confirmed, not downgraded.

Reframed being under-used is as much an error as Reframed being over-used.

**Difficulty is not a reason to split.** If Narrowed and Reframed are both arguable, pick the better-supported one, record the other, and flag `boundary_case_narrow_vs_reframe`. Do not escape into Removed + New.

### Do not recode Elaborated → Reframed for added modifiers

When POST keeps the same underlying noun or category and only adds descriptors, the code is **Elaborated** (BC-P001). Reframed requires the organizing *frame* to change, not merely added detail.

- `designed physical products → cute physical merchandised products` — same category (physical products), modifiers added. **Elaborated.** Confirm it; do not recode to Reframed.

Swapping over-use of Narrowed for over-use of Reframed is not a fix. Confirm pass-1 codes that are already correct.

### Do not recode Narrowed → Reframed when scope restriction holds

If POST denotes a **proper subset** of the PRE population or category, Narrowed is correct regardless of how the surrounding wording changed.

- `uniting individuals under a shared passion → uniting enthusiasts under a common passion` — enthusiasts are a subset of individuals. **Narrowed.** Confirm it.

### Emitting `confirm` is a success, not a failure

Your job is to correct genuine errors, not to change codes for their own sake. A run in which you recoded most events is a run in which you probably introduced errors.

### Structural constraint on `restore_lineage`

A `restore_lineage` correction may only pair a PRE unit listed in `unmatched_pre` with a POST unit listed in `unmatched_post`.

**Never reuse a unit that already sits inside a matched pair.** One PRE unit cannot serve as the antecedent of two events. If the nearest antecedent for a provisional New is already matched to something else, leave the New in place — a genuinely new concept has no available antecedent.

---

## Compact code digest

- **Elaborated** — more detail/specificity within the same conceptual frame.
- **Narrowed** — POST is a specific instance/realization of PRE. Subsumption must hold.
- **Expanded** — broader scope building on an identifiable PRE antecedent.
- **Reframed** — same semantic territory, sibling concepts, different organizing frame (name both frames).
- **New** — no defensible PRE antecedent after the nearest-counterpart search.
- **Removed** — no defensible POST successor after the nearest-counterpart search.

---

## Output contract

Return ONLY JSON matching `schemas/critic.schema.json`.

```json
{
  "corrections": [
    {
      "type": "restore_lineage" | "reject_pairing" | "recode" | "add_pairing" | "confirm",
      "pre": "string or null",
      "post": "string or null",
      "from_code": "string or null",
      "to_code": "string or null",
      "reason": "string"
    }
  ],
  "final_alignments": [
    { "pre": "string", "post": "string", "basis": "string" }
  ],
  "unmatched_pre": ["string"],
  "unmatched_post": ["string"],
  "semantic_events": [
    {
      "code": "Elaborated" | "Narrowed" | "Expanded" | "Reframed" | "New" | "Removed",
      "pre_evidence": "string or null",
      "post_evidence": "string or null",
      "rationale": "string",
      "alternative_considered": "string or null",
      "confidence": "low" | "medium" | "high"
    }
  ]
}
```

Rules:
- Return corrected `final_alignments` and `semantic_events` outright, not patch-only.
- `corrections[]` is the audit log. Use `confirm` when a pair or event is unchanged.
- For `restore_lineage`, set `pre` and `post` to the restored pair and `to_code` to the transformation code chosen.
- Do not invent concepts that were not in the pass-1 inventories.
- Keep the null-evidence conventions for any surviving New/Removed.
- Be concise. No chain-of-thought outside the JSON fields.
