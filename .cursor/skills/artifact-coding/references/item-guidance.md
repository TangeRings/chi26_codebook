# Item-Type Guidance

**Version:** v4 (subsumption test + transformation ladder)
**Status:** Guidance by item type. Two items receive a dedicated procedure; all others use the general modes. Apply alongside the codebook and decision rules.

## General principle

Every item type is aligned globally. Position never carries semantic meaning.

- Match by semantic function and conceptual continuity across the full PRE and POST sets.
- Reordering alone produces no semantic event (ORDER-vs-SEMANTIC).
- Complete one-to-one matching is NOT required. NULL alignments are permitted (NULL-ALIGNMENT-PERMITTED).
- New and Removed require a mandatory nearest-counterpart search before they may be finalized (MANDATORY-NEW-REMOVED-RECHECK).
- Concepts sharing a semantic neighborhood must have lineage **tested** via the transformation ladder; the ladder may still end at Removed + New (NEIGHBORHOOD-PROTECTS-LINEAGE).
- Narrowed requires subsumption, not mere relatedness (NARROW-REQUIRES-SUBSUMPTION).

---

## Unitization modes

Determine the mode from `question_id` first, then `item_name`, then response shape.

| Mode | Items | Segmentation rule |
|---|---|---|
| `descriptor_set_special` | **Q1a Brand Identity, Q1c Core Values only** | One short descriptor = one atomic concept |
| `semantic_phrase` | Brand Vision, Product Offering, narrative items | Segment by clause / proposition |
| `scoped_category` | Target Customer, audience items | Prioritize category / audience scope |

**Routing:**
1. `question_id` is `Q1a` or `Q1c` → `descriptor_set_special`.
2. `item_name` is `Brand Identity` or `Core Values` → `descriptor_set_special`.
3. Audience / demographic items → `scoped_category`.
4. Everything else → `semantic_phrase`.

**Do not** route other items into `descriptor_set_special` merely because their answer happens to be short or comma-joined. This mode is intentionally item-specific because these two questions have a distinct response structure: adjective set → adjective set. Other open-text items are phrase/clause structured and must not be atomized this way.

Record the chosen mode in `concept_alignment.unitization_mode`.

---

## Mode A — `descriptor_set_special` (Q1a Brand Identity, Q1c Core Values ONLY)

These two items are structurally different from every other survey item. Students answer them as short adjective / descriptor sets, so they get a dedicated descriptor-comparison procedure rather than general phrase alignment.

### Procedure

1. Split PRE into atomic descriptors.
2. Split POST into atomic descriptors.
3. Treat both lists as unordered sets.
4. Compare EACH PRE descriptor against EACH POST descriptor (full cross-product).
5. Never bundle the entire list into one semantic event.
6. Never align by list position.
7. Do not force complete matching.
8. Unmatched PRE may become Removed.
9. Unmatched POST may become New.
10. New / Removed may only be assigned after the nearest semantic relationship has been explicitly tested (MANDATORY-NEW-REMOVED-RECHECK).

Output for these items must be **descriptor-level**, never whole-list-level.

### Atomization

- Split on commas, `&`, `and`, bullets, and newlines.
- Preserve hyphenated / multi-word descriptors as one unit (`Community-Building`, `Theory-Based`, `Customer-Centricity`, `Emotion-Appealing`, `Lifestyle-Oriented`).
- Do not split compounds that function as a single descriptor.
- **ONE DESCRIPTOR = ONE ATOMIC CONCEPT.**

### Prohibited output

For this input:

```
PRE:  Fun, Community-Building, & Lifestyle-Oriented
POST: Relatable, Interactive, and Expressive
```

The following is NEVER acceptable:

```
[Fun, Community-Building, Lifestyle-Oriented] → [Relatable, Interactive, Expressive] = Reframed
```

The system must instead evaluate descriptor-level relationships across the cross-product, for example:

- Fun ↔ Interactive
- Community-Building ↔ Relatable
- Lifestyle-Oriented ↔ Expressive

These are **candidate relationships to evaluate, not hard-coded answers.** Any PRE descriptor may pair with any POST descriptor, or with none.

### Pairwise code comparison (required — run the ladder in order)

For every candidate descriptor pair, walk the tiers in order and stop at the first that holds:

| Tier | Diagnostic | Code |
|---|---|---|
| 1 | Is POST **a specific way of being** PRE? (subsumption / 从属) | Narrowed |
| 2 | No subsumption, but same semantic territory with a shifted frame? | Reframed |
| 3 | Does POST keep PRE intact and add detail? | Elaborated |
| 4 | Does POST broaden an identifiable PRE seed? | Expanded |
| 5 | Is the adjacency only topical, with no tier above defensible? | Removed + New |

Record the runner-up in `alternative_considered`. Do not default to any tier — including tier 5.

### The subsumption test decides Narrowed vs Reframed

This is the single most error-prone judgment on these items. Say the sentence out loud:

> "**POST** is a specific way of being **PRE**."

- TRUE → **Narrowed**
- FALSE, same territory → **Reframed**
- FALSE, territory not shared → **Removed + New**

| Test sentence | Verdict | Code |
|---|---|---|
| "Interactive is a specific way of being Fun." | TRUE | Narrowed |
| "Authentic is a specific way of being Emotion-Appealing." | TRUE | Narrowed |
| "Relatable is a specific way of being Community-Building." | FALSE — sibling quality, not a subtype | Reframed |
| "Expressive is a specific way of being Lifestyle-Oriented." | FALSE, territory not shared | Removed + New |

### PRE-genericness signal

Narrowed is likely when the PRE descriptor is a **generic filler word** students reach for before thinking a concept through — `Fun`, `nice`, `cool`, `interesting`, `Emotion-Appealing`. A generic PRE can plausibly contain a more specific POST.

Narrowed is unlikely when the PRE descriptor is **already substantive** — `Community-Building`, `Customer-Centricity`, `Lifestyle-Oriented`, `Theory-Based`. A different POST term is then usually a sibling concept (Reframed) or unrelated (Removed + New), not a subtype.

Ask: **"Was the PRE word generic enough that POST could be a version of it?"** If PRE was already specific, Narrowed is probably wrong.

### Worked reasoning pattern (Q1c Core Values)

```
PRE:  Customer-Centricity, Emotion-Appealing
POST: Authentic, Theory-Based
```

Do not align by position. Evaluate the full cross-product. Intended reasoning:

- `Emotion-Appealing ↔ Authentic` — same affect / brand-experience neighborhood. Subsumption test passes ("Authentic is a specific way of being Emotion-Appealing"), and PRE is generic, so tier 1: **Narrowed**.
- `Customer-Centricity ↔ Theory-Based` — audience-orientation vs epistemic grounding are different conceptual domains. Tier 5: Customer-Centricity = Removed, Theory-Based = New.

This illustrates the intended reasoning. Do not hard-code the outcome.

### Worked reasoning pattern (Q1a Brand Identity)

```
PRE:  Fun, Community-Building, Lifestyle-Oriented
POST: Relatable, Interactive, Expressive
```

Human-confirmed outcomes from the run-004 review:

- `Fun → Interactive` — tier 1, **Narrowed**. PRE is a generic filler word; interactivity is a specific way of being fun.
- `Community-Building → Relatable` — tier 2, **Reframed**. Genuinely related, but relatability is not a subtype of community-building. No 从属 relation, and PRE is already substantive.
- `Lifestyle-Oriented → Expressive` — tier 5, **Removed + New**. Topical adjacency only; no defensible transformation.

Note that all three pairs sit in the same item and resolve to three different tiers. Do not apply a uniform code across a descriptor set.

---

## Mode B — `semantic_phrase`

Applies to Brand Vision, Product Offering, strategy descriptions, and other narrative / sentence-based items.

- Segment by meaningful phrase / clause / proposition, not by individual words.
- Only split concepts that can independently participate in semantic change.
- Do not mechanically split every noun.
- Sentence order may change; align by concept, not sentence number.

**Coordinated phrases MUST be split when their successors diverge.** A single PRE unit may be the antecedent of at most one semantic event. If a coordinated span ("A and B") has one concept tracking to one POST unit and the other tracking to a different POST unit, atomize the span.

Worked example: PRE `focus on connection and self-expression`, with POST containing both `celebrates individuality` and `transform personality theory into a shared experience`. Split PRE into `connection` and `self-expression`, then align each separately — `self-expression → celebrates individuality` and `connection → shared experience`. Leaving the span bundled forces one PRE unit to serve as the antecedent of two events, which is invalid output.
- Moved clauses can still be semantically continuous.
- Reorganisation without change in propositional content is not Reframed.

**Example pattern:**
PRE sentence 1 contains concept A; PRE sentence 2 contains concept B.
POST sentence 1 contains B'; POST sentence 3 contains A'.
Align A→A' and B→B' if conceptual continuity is stronger than positional similarity.

**Neighborhood lineage still applies here.** For Brand Vision:

```
PRE:  connection and self-expression
POST: celebrates individuality
```

`self-expression → individuality` occupies a shared identity / self-expression neighborhood. The system must explicitly test this lineage before allowing `self-expression = Removed` and `individuality = New`. Those two events survive only if the coder can explain why lineage is not defensible.

---

## Mode C — `scoped_category`

Applies to Target Customer and similar audience / demographic / psychographic items.

- Give high priority to scope relationships.
- `individuals` → `enthusiasts` = Narrowed (POST restricts the PRE category).
- **Scope restriction always outranks Reframed.** A proper-subset relation is the clearest possible subsumption, so Narrowed is correct even when the phrasing around the restriction was also rewritten. This applies in `semantic_phrase` items too: `uniting individuals under a shared passion → uniting enthusiasts under a common passion` is Narrowed.
- Longer wording does not imply Elaborated.
- Order of demographic or psychographic details does not matter.
- Vague audience labels that become more concrete should be checked under VAGUE-vs-SPECIFIC and NARROW-ABSTRACT before Removed + New.

---

## Cross-mode reminders

- Vague descriptors may become more concrete in POST (VAGUE-vs-SPECIFIC / NARROW-ABSTRACT), but "more concrete" alone does not make it Narrowed — subsumption must hold.
- Narrowed requires subsumption; Reframed is the correct verdict for related sibling concepts (NARROW-REQUIRES-SUBSUMPTION).
- Shared semantic neighborhood requires running the ladder; it does not guarantee a transformation code (NEIGHBORHOOD-PROTECTS-LINEAGE).
- Rejection of a pairing as implausible fires immediately only for concepts in genuinely different conceptual domains (IMPLAUSIBLE-MATCH-WORSE-THAN-NEW-REMOVED).
