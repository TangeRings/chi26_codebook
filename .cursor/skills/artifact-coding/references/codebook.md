# Artifact Coding Codebook

**Version:** v1 (pre-calibration)
**Scope:** Artifact coding only — PRE/POST open-text survey responses.

This codebook defines the normative meaning of each code. For operational rules about how to distinguish codes from each other, see `decision-rules.md`. For specific hard cases, see `boundary-cases.md`.

---

## Part 1: Structural Development

Structural Development is a **single whole-response judgment** about how much the artifact as a whole structurally expanded or contracted between pre and post.

**Unit of analysis:** the entire response, not individual phrases.

**What counts as structural change:** additions or removals at the phrase, clause, sentence, or explanation level that carry meaningful content. Purely cosmetic changes (punctuation, capitalization, formatting symbols) do not count.

**What does not count:** word count alone. A response can become longer through stylistic inflation with no structural development, or shorter through compression without structural reduction.

### Codes

| Code | Definition |
|---|---|
| Significant Addition | The post-response contains substantially more content than the pre-response. Multiple new clauses, sentences, or explanatory passages have been added. The overall scope or depth of the response is meaningfully larger. |
| Moderate Addition | The post-response contains somewhat more content than the pre-response. One or two meaningful clauses or sentences have been added, or existing ideas are noticeably elaborated. |
| No Change | The post-response is structurally equivalent to the pre-response. Any differences are stylistic or minor. |
| Moderate Reduction | The post-response contains somewhat less content than the pre-response. One or two meaningful clauses or sentences have been removed, or existing ideas are condensed. |
| Significant Reduction | The post-response contains substantially less content than the pre-response. Multiple ideas, explanations, or sentence-level elements have been removed. |

**Note on thresholds:** "Significant" vs "Moderate" is a judgment call that will be refined during calibration. The key question is whether the structural change is extensive enough to meaningfully alter the scope of the response, or whether it is a contained adjustment. Flag threshold uncertainty in `uncertainty.flags` using `boundary_case_structural_threshold`.

---

## Part 2: Semantic Change Events

Semantic Change Events are **event-level judgments**. One pre/post pair may produce multiple semantic events. The same code may appear more than once.

Each event captures one discrete change in what is expressed — a shift in meaning at the level of a concept, claim, or framing.

**Key principle:** Semantic coding describes what changed in the text. It does not describe why the student changed it.

### Codes

---

#### Elaborated

**Definition:** An existing concept or claim in the pre-response is retained in the post-response and has been made more specific, detailed, or qualified without shifting the conceptual frame.

The core idea remains the same. The post version adds attributes, descriptors, modifiers, or explanatory detail within the same semantic frame.

**Illustrative pattern:**
- Pre contains a concept X.
- Post contains X + additional attributes or qualifications.
- The frame of X has not changed.

**Key question:** Does the post version stay within the same conceptual frame and add detail, or does it shift what X fundamentally refers to?

---

#### Narrowed

**Definition:** An existing concept or claim in the pre-response is retained in the post-response but its scope has been reduced — it now refers to a more specific or restricted set of cases, audiences, features, or conditions.

The concept still exists; its boundaries have been tightened.

**Illustrative pattern:**
- Pre: a broad claim about X.
- Post: the same claim, but now qualified to a specific subset of X, or a condition is added that limits when it applies.

**Key question:** Has scope been restricted, or has detail merely been added? See `NARROW-vs-ELAB` in `decision-rules.md`.

---

#### Expanded

**Definition:** An existing concept or claim in the pre-response is retained and has grown in scope — it now encompasses more cases, audiences, features, or dimensions than before, while remaining recognizably the same concept.

**Illustrative pattern:**
- Pre: concept X addresses audience A.
- Post: concept X now addresses audiences A, B, and C.
- X itself has not been reconceived; it has been broadened.

**Key question:** Is there an identifiable pre-antecedent that has broadened, or is this an entirely new concept? See `EXPAND-vs-NEW` in `decision-rules.md`.

---

#### Reframed

**Definition:** An existing concept or claim in the pre-response is reconceived in the post-response — the same underlying subject matter is approached from a different conceptual angle, emphasis, or interpretive frame. The topic persists but what is said about it, or how it is conceptualized, has meaningfully shifted.

This is not merely adding detail (that would be Elaborated). The conceptual emphasis, framing, or value orientation has changed.

**Illustrative pattern:**
- Pre: concept X is framed in terms of property P.
- Post: concept X is now framed in terms of property Q, where P and Q represent different conceptual angles on the same subject.

**Key question:** Does the post version shift the conceptual lens through which the subject is viewed, or does it stay within the same frame and add to it? See `ELAB-vs-REFRAME` in `decision-rules.md`.

---

#### New

**Definition:** The post-response introduces a concept, claim, or idea that has no meaningful antecedent in the pre-response.

**Key criterion:** There is no semantic unit in the pre-response that could plausibly be read as the same idea at an earlier or less developed state.

`pre_evidence` is `null` for New events.

**Key question:** Is there any pre-response element that could be an antecedent? Even a loose antecedent would shift the classification toward Expanded or Elaborated. See `EXPAND-vs-NEW` in `decision-rules.md`.

---

#### Removed

**Definition:** A concept, claim, or idea present in the pre-response is absent from the post-response. It has not been replaced, reframed, or absorbed into another concept — it is simply no longer there.

`post_evidence` is `null` for Removed events.

**Key question:** Is the concept truly absent, or has it been reconceived under a different expression? See `REMOVE-vs-REFRAME` in `decision-rules.md`.

---

## Part 3: Learner Agency / Metacognition

> **Status: exploratory.** This layer is less stable than Structural Development and Semantic Events. The codes below are current working concepts, not a finalized taxonomy. Do not treat this list as exhaustive or closed.

Learner Agency coding captures moments in the artifact text where the student explicitly draws on personal agency, reflection, or self-positioning in relation to their brand work.

**Critical constraint:** Agency coding requires direct textual evidence. Do not infer agency from content alone. If the student writes about their brand without explicitly invoking themselves, their background, or their reasoning process, no agency code is warranted.

### Current working codes

| Code | Working definition |
|---|---|
| Personal Background | The student explicitly references their own prior experience, personal history, or biographical context as relevant to their brand thinking. |
| Metacognition | The student explicitly reflects on their own thinking process, strategy, or approach — not just what they think, but how or why they are thinking it. |

### Emerging concepts (not yet operationalized)

The following concepts have been noted as potentially relevant but do not yet have stable definitions. Flag any instances encountered during calibration for discussion.

- **Synthesis** — explicit integration of multiple inputs or ideas by the student
- **Ownership / Personal Relation** — explicit language of personal identification with or investment in the brand

### Confidence requirement

Every learner-agency event must carry a `confidence` rating (`low` / `medium` / `high`). If confidence is `low`, consider omitting the event and noting it in `uncertainty.coder_notes` instead.

---

## Appendix: Items excluded from artifact coding

The following survey item types are not coded for semantic change. Numeric or structured-grid answers cannot produce semantic events.

- Likert-scale confidence ratings (e.g., Q1.1, Q2.1, Q4.1)
- Structured grid influence ratings (e.g., Q4.2)
- Numeric scales in additional survey items

If such an item is submitted as input, return `semantic_events: []`, `structural_development.code: "No Change"`, and record the exclusion reason in `uncertainty.coder_notes`.
