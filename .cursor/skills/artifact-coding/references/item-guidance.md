# Item-Type Guidance

**Version:** v2 (unitization modes)
**Status:** General conceptual guidance by item type. Not a per-question skill. Apply alongside the codebook and decision rules.

## General principle

Every item type is aligned globally. Position never carries semantic meaning.

- Treat list items, descriptors, values, clauses, and sentences as members of unordered conceptual sets.
- Match by semantic function and conceptual continuity across the full PRE and POST sets.
- Reordering alone produces no semantic event (ORDER-vs-SEMANTIC).
- Complete one-to-one matching is NOT required. NULL alignments are permitted (NULL-ALIGNMENT-PERMITTED).
- An implausible match is worse than Removed + New (IMPLAUSIBLE-MATCH-WORSE-THAN-NEW-REMOVED).
- New and Removed are last-resort classifications after a full-response lineage search (LAST-RESORT-NEW-REMOVED), but only after weak pairings have been rejected.

---

## Unitization modes

Before inventorying concepts, determine the unitization mode from `item_name` / `question_text`, then fall back to response shape.

| Mode | Typical items | Segmentation rule |
|---|---|---|
| `atomic_descriptor_set` | Brand Identity, Core Values | One short descriptor = one atomic concept |
| `semantic_phrase` | Brand Vision, Product Offering, narrative items | Segment by clause / proposition |
| `scoped_category` | Target Customer | Prioritize category / audience scope |

**Routing:**
1. Match on `item_name` first (see sections below).
2. If `item_name` is ambiguous, inspect response shape: short comma-/`&`-/`and`-joined fragments → `atomic_descriptor_set`; multi-sentence prose → `semantic_phrase`; audience/demographic language → `scoped_category`.

Record the chosen mode in `concept_alignment.unitization_mode`.

---

## Mode A — `atomic_descriptor_set`

Applies to Brand Identity, Core Values, and other short keyword / descriptor-list responses.

### Atomization

- Split on commas, `&`, `and`, bullets, and newlines.
- Preserve hyphenated / multi-word descriptors as one unit (`Community-Building`, `Theory-Based`, `Customer-Centricity`, `Emotion-Appealing`).
- Do **not** split compounds that function as a single descriptor.
- Default: **ONE DESCRIPTOR = ONE ATOMIC CONCEPT**.
- Do **not** treat the entire PRE list as one concept and the entire POST list as one concept.
- A whole-list event is acceptable only if the entire list genuinely functions as one inseparable concept (rare).

Example:

```
PRE:  Customer-Centricity Emotion-Appealing
POST: Authentic Theory-Based
```

Must atomize into four concepts:
- PRE: `Customer-Centricity`, `Emotion-Appealing`
- POST: `Authentic`, `Theory-Based`

### Alignment constraints

1. Inventory each descriptor separately.
2. Evaluate the full PRE × POST cross-product.
3. For each candidate pair, assess: conceptual continuity, semantic role similarity, scope relationship, frame relationship, interpretive stretch.
4. Choose the strongest non-conflicting alignment.
5. Allow cross-position alignment.
6. Do **not** require every PRE concept to match.
7. Do **not** require every POST concept to match.
8. A pairing survives only if it is more plausible than leaving both concepts unmatched.
9. Unmatched PRE → candidate Removed; unmatched POST → candidate New.
10. Never pair leftovers merely to exhaust the sets.

### Do not

- Bundle the whole list as one Reframed / Elaborated event.
- Align by list index or order.
- Force `Customer-Centricity → Theory-Based` (or similar) just because both are leftovers.

---

## Mode B — `semantic_phrase`

Applies to Brand Vision, Product Offering, strategy descriptions, and other narrative / sentence-based items.

- Segment by meaningful phrase / clause / proposition, not by individual words.
- Only split concepts that can independently participate in semantic change.
- Do not mechanically split every noun.
- Sentence order may change; align by concept, not sentence number.
- Moved clauses can still be semantically continuous.
- Reorganisation without change in propositional content is not Reframed.

**Example pattern:**
PRE sentence 1 contains concept A; PRE sentence 2 contains concept B.
POST sentence 1 contains B'; POST sentence 3 contains A'.
Align A→A' and B→B' if conceptual continuity is stronger than positional similarity.

---

## Mode C — `scoped_category`

Applies to Target Customer and similar audience / demographic / psychographic items.

- Give high priority to scope relationships.
- `individuals` → `enthusiasts` = Narrowed (POST restricts the PRE category).
- Longer wording does not imply Elaborated.
- Order of demographic or psychographic details does not matter.
- Vague audience labels that become more concrete should be checked under VAGUE-vs-SPECIFIC and NARROW-ABSTRACT before Removed + New.

---

## Cross-mode reminders

- Vague descriptors may become more concrete in POST (VAGUE-vs-SPECIFIC / NARROW-ABSTRACT).
- Conceptual refinement may be Narrowed or Reframed depending on whether scope or frame changes (REFRAME-NOT-DEFAULT).
- Semantic neighborhood keeps lineage open for consideration; it does not by itself pick a code (SEMANTIC-NEIGHBORHOOD-LINEAGE).
