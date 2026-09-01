import { promises as fs } from "fs";
import path from "path";
import type {
  AgencyCode,
  ArtifactCoding,
  ArtifactCodingUncertainty,
  CandidateAlignment,
  ConceptAlignment,
  ConceptAlignmentPair,
  CriticCorrection,
  NewRemovedRecheck,
  RejectedAlignment,
  SemanticCode,
} from "@/types/research";

export type ArtifactCodingInput = {
  student_id: string;
  item_id: string;
  item_name: string;
  /** Survey question id (e.g. Q1a, Q1c). Drives item-specific unitization routing. */
  question_id?: string;
  question_text?: string;
  pre_response: string;
  post_response: string;
};

export type UnitizationMode =
  | "descriptor_set_special"
  | "semantic_phrase"
  | "scoped_category";

export type ArtifactCodingAiSemanticEvent = {
  code: string;
  pre_evidence?: string | null;
  post_evidence?: string | null;
  rationale?: string;
  alternative_considered?: string | null;
  confidence?: "low" | "medium" | "high";
};

export type ArtifactCodingAiAgencyEvent = {
  code: string;
  evidence?: string;
  rationale?: string;
  confidence: "low" | "medium" | "high";
};

export type ArtifactCodingAiMatchedPair = {
  pre: string;
  post: string;
  basis?: string;
};

export type ArtifactCodingAiCandidateAlignment = {
  pre: string;
  post: string;
  continuity?: string;
  scope?: string;
  frame?: string;
  stretch?: string;
  verdict?: "plausible" | "weak" | "implausible";
};

export type ArtifactCodingAiRejectedAlignment = {
  pre: string;
  post: string;
  reason: string;
};

export type ArtifactCodingAiCriticCorrection = {
  type:
    | "restore_lineage"
    | "reject_pairing"
    | "recode"
    | "add_pairing"
    | "confirm";
  pre?: string | null;
  post?: string | null;
  from_code?: string | null;
  to_code?: string | null;
  reason: string;
};

export type ArtifactCodingAiNewRemovedRecheck = {
  concept: string;
  direction: "new" | "removed";
  nearest_counterpart?: string | null;
  codes_tested?: string[];
  outcome: "kept" | "converted";
  reason?: string;
};

export type ArtifactCodingAiConceptAlignment = {
  unitization_mode?: UnitizationMode;
  pre_concepts?: string[];
  post_concepts?: string[];
  candidate_alignments?: ArtifactCodingAiCandidateAlignment[];
  rejected_alignments?: ArtifactCodingAiRejectedAlignment[];
  matched_pairs?: ArtifactCodingAiMatchedPair[];
  unmatched_pre?: string[];
  unmatched_post?: string[];
  order_only_changes?: string[];
  new_removed_recheck?: ArtifactCodingAiNewRemovedRecheck[];
  critic_corrections?: ArtifactCodingAiCriticCorrection[];
};

export type ArtifactCodingAiOutput = {
  coding_unit: {
    student_id: string;
    item_id: string;
  };
  concept_alignment?: ArtifactCodingAiConceptAlignment;
  structural_development: {
    code: string;
    rationale?: string;
  };
  semantic_events: ArtifactCodingAiSemanticEvent[];
  learner_agency?: ArtifactCodingAiAgencyEvent[];
  uncertainty: {
    confidence: "low" | "medium" | "high";
    flags?: string[];
    coder_notes?: string;
  };
  coded_at?: string;
  model?: string;
};

export type CriticInputPayload = {
  item_name: string;
  unitization_mode: UnitizationMode | null;
  pre_concepts: string[];
  post_concepts: string[];
  proposed_alignment: Array<{
    pre: string;
    post: string;
    basis?: string;
    provisional_code?: string | null;
    rationale?: string;
    alternative_considered?: string | null;
  }>;
  unmatched_pre: string[];
  unmatched_post: string[];
  proposed_semantic_events: ArtifactCodingAiSemanticEvent[];
  candidate_alignments?: ArtifactCodingAiCandidateAlignment[];
  rejected_alignments?: ArtifactCodingAiRejectedAlignment[];
  new_removed_recheck?: ArtifactCodingAiNewRemovedRecheck[];
};

export type CriticOutput = {
  corrections: ArtifactCodingAiCriticCorrection[];
  final_alignments: ArtifactCodingAiMatchedPair[];
  unmatched_pre?: string[];
  unmatched_post?: string[];
  semantic_events: ArtifactCodingAiSemanticEvent[];
};

const STRUCTURAL_CODES = new Set([
  "Significant Addition",
  "Moderate Addition",
  "No Change",
  "Moderate Reduction",
  "Significant Reduction",
]);

const SEMANTIC_CODES = new Set([
  "Elaborated",
  "Narrowed",
  "Expanded",
  "Reframed",
  "New",
  "Removed",
]);

const CONFIDENCE_VALUES = new Set(["low", "medium", "high"]);

const UNITIZATION_MODES = new Set<UnitizationMode>([
  "descriptor_set_special",
  "semantic_phrase",
  "scoped_category",
]);

const VERDICTS = new Set(["plausible", "weak", "implausible"]);

const CORRECTION_TYPES = new Set([
  "restore_lineage",
  "reject_pairing",
  "recode",
  "add_pairing",
  "confirm",
]);

const RECHECK_DIRECTIONS = new Set(["new", "removed"]);
const RECHECK_OUTCOMES = new Set(["kept", "converted"]);

/** Items that receive the dedicated descriptor-comparison procedure. */
const DESCRIPTOR_SET_QUESTION_IDS = new Set(["q1a", "q1c"]);
const DESCRIPTOR_SET_ITEM_NAMES = new Set(["brand identity", "core values"]);

function skillRoot(): string {
  return path.join(process.cwd(), ".cursor", "skills", "artifact-coding");
}

async function readReference(relativePath: string): Promise<string> {
  const fullPath = path.join(skillRoot(), relativePath);
  return fs.readFile(fullPath, "utf8");
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stripMarkdownFences(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return cleaned.trim();
}

/**
 * Resolve unitization mode. `descriptor_set_special` is item-specific by design and is
 * reserved for Q1a Brand Identity and Q1c Core Values; response shape never routes into it.
 */
export function resolveUnitizationMode(input: ArtifactCodingInput): UnitizationMode {
  const questionId = (input.question_id ?? "").trim().toLowerCase();
  if (DESCRIPTOR_SET_QUESTION_IDS.has(questionId)) {
    return "descriptor_set_special";
  }

  const itemName = input.item_name.trim().toLowerCase();
  if (DESCRIPTOR_SET_ITEM_NAMES.has(itemName)) {
    return "descriptor_set_special";
  }

  const haystack = `${itemName} ${input.question_text ?? ""}`.toLowerCase();
  if (
    haystack.includes("target customer") ||
    haystack.includes("target audience") ||
    haystack.includes("niche")
  ) {
    return "scoped_category";
  }

  return "semantic_phrase";
}

export async function buildArtifactCodingPrompt(
  input: ArtifactCodingInput
): Promise<string> {
  const [skillMd, codebook, decisionRules, boundaryCases, itemGuidance] =
    await Promise.all([
      readReference("SKILL.md"),
      readReference("references/codebook.md"),
      readReference("references/decision-rules.md"),
      readReference("references/boundary-cases.md"),
      readReference("references/item-guidance.md"),
    ]);

  const skillBody = skillMd.replace(/^---[\s\S]*?---\s*/, "").trim();
  const unitizationMode = resolveUnitizationMode(input);

  return `You are a qualitative research coder for a CHI 2026 study on AI-assisted brand development.
Your task: code one PRE/POST open-text response pair using the codebook and decision rules below.

CRITICAL CONSTRAINTS
- Code ONLY from the two text responses. Do not infer ChatGPT influence, student intention, or causal process.
- Semantic coding is EVENT-LEVEL. One PRE/POST pair may produce multiple events. The same code may appear more than once.
- Do not collapse two distinct semantic changes into one event.
- Do not consult gold labels, other students, or interaction logs.
- Alignment is ORDER-INVARIANT and POSITION-INVARIANT. Match by semantic function and conceptual continuity, never by list index, sentence number, token order, phrase order, or surface position.
- Reordering alone is NOT a semantic change. Apply ORDER-vs-SEMANTIC before classifying.
- Never map PRE item #1 → POST item #1 by index. Apply GLOBAL-ALIGNMENT across the full unordered sets.
- NULL matches are permitted. Complete one-to-one matching is NOT required (NULL-ALIGNMENT-PERMITTED).
- NEIGHBORHOOD GATE: if two concepts share a semantic neighborhood, lineage must be TESTED via the transformation ladder. Difficulty is never grounds to skip the test. The ladder may still end at Removed + New if no tier is defensible.
- TRANSFORMATION LADDER — walk in order, stop at the first tier that holds:
  1. Narrowed — POST is A SPECIFIC WAY OF BEING PRE (subsumption). Say it out loud: "POST is a specific way of being PRE." Must be TRUE.
  2. Reframed — no subsumption, but same semantic territory with a shifted organizing frame. This is the CORRECT answer for related SIBLING concepts.
  3. Elaborated — POST keeps PRE intact and adds detail.
  4. Expanded — POST broadens an identifiable PRE seed.
  5. Removed + New — adjacency is only topical; no tier above is defensible.
- NARROWED REQUIRES SUBSUMPTION, not mere relatedness. "POST sounds more concrete" is NOT enough. Calibrated: "Interactive is a specific way of being Fun" = TRUE, so Narrowed. "Relatable is a specific way of being Community-Building" = FALSE, so Reframed. "Expressive is a specific way of being Lifestyle-Oriented" = FALSE and territory not shared, so Removed + New.
- PRE-GENERICNESS SIGNAL: Narrowed is likely when PRE is a generic filler word (Fun, nice, cool, Emotion-Appealing). Narrowed is unlikely when PRE is already substantive (Community-Building, Customer-Centricity, Lifestyle-Oriented) — those take sibling concepts, not subtypes.
- Different pairs within the SAME descriptor set routinely resolve to DIFFERENT tiers. Do not apply one uniform code across a set.
- SCOPE RESTRICTION IS ALWAYS NARROWED: when the POST concept denotes a proper subset of the PRE population or category, the code is Narrowed, not Reframed. Calibrated: "individuals" -> "enthusiasts" is NARROWED (enthusiasts are a subset of individuals). Longer or rephrased wording around the restriction does not change this.
- ONE PRE UNIT = AT MOST ONE EVENT. A single PRE unit may never be the antecedent of two semantic events. If a PRE span contains coordinated concepts ("A and B", "A, B, and C") whose successors are DIFFERENT POST concepts, you MUST split that span into separate atomic units during unitization. Example: PRE "connection and self-expression" must be split into "connection" and "self-expression" if one maps to "shared experience" and the other to "celebrates individuality". Reusing the same pre_evidence string in two events is invalid output.
- NO DOUBLE-COUNTING. Never emit a Removed event for a PRE concept that already appears as the pre_evidence of a matched transformation, and never emit a New event for a POST concept that already appears as the post_evidence of a matched transformation. A concept is either matched or unmatched, never both. Emitting "X -> Y = Reframed" together with "X = Removed" is a contradiction.
- unmatched_pre must list exactly the PRE concepts that carry a Removed event, and unmatched_post exactly the POST concepts that carry a New event. Keep these consistent with semantic_events.
- ABSTRACTION CEILING: a semantic neighborhood must be nameable at a SPECIFIC level. If the only shared territory is a broad umbrella ("identity", "self-presentation", "brand quality", "positioning", "experience", "values"), there is NO neighborhood and the pair belongs at tier 5. Ask: "could this territory be claimed for almost any two descriptors in this item?" If yes, do not claim lineage. Calibrated non-neighborhood: Lifestyle-Oriented vs Expressive => Removed + New.
- AN IMPLAUSIBLE MATCH IS WORSE THAN REMOVED + NEW, but ONLY for concepts in genuinely different conceptual domains. This rule must not be applied to a protected pair.
- MANDATORY: before finalizing ANY New or Removed, find the nearest semantic counterpart in the opposite response (even if the wording is completely different) and explicitly test Narrowed, Reframed, Elaborated, and Expanded against it. Only if all four fail may the event remain New or Removed. Record every check in concept_alignment.new_removed_recheck.
- Students rarely delete an idea outright; usually they found a better way to express it. Output containing only New and Removed events, with no transformations, is almost always wrong.
- Interpretive difficulty is NOT grounds for Removed + New. If two codes are both arguable, pick the better-supported one and record the other in alternative_considered.
- Reframed is NOT a default fallback, but it is also NOT to be avoided. It is the correct tier-2 verdict for related sibling concepts. Under-using Reframed is as much an error as over-using it.
- Do not attribute reordering to AI generation or student process. Code the artifact only.

RESOLVED UNITIZATION MODE FOR THIS ITEM: ${unitizationMode}
Atomize PRE and POST according to this mode before alignment.${
    unitizationMode === "descriptor_set_special"
      ? `
This is a descriptor-set item (Q1a Brand Identity / Q1c Core Values). One descriptor = one atomic concept.
Split on commas, "&", "and", bullets, and newlines. Preserve multi-word descriptors (Community-Building, Theory-Based) as single units.
NEVER bundle the list: an event like "[Fun, Community-Building, Lifestyle-Oriented] → [Relatable, Interactive, Expressive] = Reframed" is forbidden.
Evaluate the FULL cross-product at descriptor level and emit descriptor-level events.`
      : ""
  }

CODING PROCEDURE
Follow the skill procedure: unitization → inventories → PRE×POST candidate cross-product → neighborhood gate → provisional alignment with NULL allowed → alignment self-critique → per-pair code comparison (record alternative_considered) → provisional New/Removed → MANDATORY new/removed re-check → Structural Development.

---
## SKILL INSTRUCTIONS
${skillBody}

---
## CODEBOOK
${codebook.trim()}

---
## DECISION RULES
${decisionRules.trim()}

---
## ITEM-TYPE GUIDANCE
${itemGuidance.trim()}

---
## BOUNDARY CASE GUIDANCE
${boundaryCases.trim()}

---
## CODING INPUT
student_id: ${input.student_id}
item_id: ${input.item_id}
item_name: ${input.item_name}
${input.question_id ? `question_id: ${input.question_id}` : "question_id: (not provided)"}
${input.question_text ? `question_text: ${input.question_text}` : "question_text: (not provided)"}
unitization_mode: ${unitizationMode}

PRE-RESPONSE:
${input.pre_response}

POST-RESPONSE:
${input.post_response}

---
## OUTPUT INSTRUCTION
Return ONLY a valid JSON object. No markdown fences. No explanation. Start with { and end with }.

Required shape:
{
  "coding_unit": { "student_id": "${input.student_id}", "item_id": "${input.item_id}" },
  "concept_alignment": {
    "unitization_mode": "${unitizationMode}",
    "pre_concepts": ["string"],
    "post_concepts": ["string"],
    "candidate_alignments": [
      {
        "pre": "string",
        "post": "string",
        "continuity": "string",
        "scope": "string",
        "frame": "string",
        "stretch": "string",
        "verdict": "plausible" | "weak" | "implausible"
      }
    ],
    "rejected_alignments": [
      { "pre": "string", "post": "string", "reason": "string" }
    ],
    "matched_pairs": [{ "pre": "string", "post": "string", "basis": "string" }],
    "unmatched_pre": ["string"],
    "unmatched_post": ["string"],
    "order_only_changes": ["string"],
    "new_removed_recheck": [
      {
        "concept": "string",
        "direction": "new" | "removed",
        "nearest_counterpart": "string or null",
        "codes_tested": ["Narrowed", "Reframed", "Elaborated", "Expanded"],
        "outcome": "kept" | "converted",
        "reason": "string"
      }
    ]
  },
  "structural_development": {
    "code": "Significant Addition" | "Moderate Addition" | "No Change" | "Moderate Reduction" | "Significant Reduction",
    "rationale": "string"
  },
  "semantic_events": [
    {
      "code": "Elaborated" | "Narrowed" | "Expanded" | "Reframed" | "New" | "Removed",
      "pre_evidence": "string or null",
      "post_evidence": "string or null",
      "rationale": "string",
      "alternative_considered": "string or null",
      "confidence": "low" | "medium" | "high"
    }
  ],
  "learner_agency": [
    {
      "code": "string",
      "evidence": "string",
      "rationale": "string",
      "confidence": "low" | "medium" | "high"
    }
  ],
  "uncertainty": {
    "confidence": "low" | "medium" | "high",
    "flags": ["string"],
    "coder_notes": "string"
  },
  "coded_at": "ISO-8601 timestamp",
  "model": "MiniMax-M3"
}

Rules for evidence and alignment:
- Populate concept_alignment BEFORE emitting semantic_events.
- For descriptor_set_special, enumerate the full PRE × POST cross-product in candidate_alignments and emit descriptor-level events only.
- A different-domain pairing survives only if more plausible than leaving both unmatched. A shared-neighborhood pairing always survives and must be classified.
- EVERY New and EVERY Removed event MUST have a matching entry in concept_alignment.new_removed_recheck. An event without one is invalid output.
- For New events: pre_evidence must be null. Rationale must state the nearest PRE counterpart considered and why all four transformation codes failed.
- For Removed events: post_evidence must be null. Rationale must state the nearest POST counterpart considered and why all four transformation codes failed.
- For Reframed events: rationale must name both the pre-frame and the post-frame.
- For every matched-pair event, set alternative_considered to the strongest runner-up (or null if none).
- Keep every distinct semantic change as its own array entry, even if codes repeat.
- Never emit Removed for a concept already accounted for inside a matched pair.
- learner_agency may be [] if no direct evidence is present.
`;
}

function parseNullableString(
  value: unknown,
  field: string
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "string") return value;
  throw new Error(`${field} must be string or null.`);
}

function parseSemanticEvent(
  event: unknown,
  index: number
): ArtifactCodingAiSemanticEvent {
  if (!isObject(event)) {
    throw new Error(`semantic_events[${index}] must be an object.`);
  }
  if (typeof event.code !== "string" || !SEMANTIC_CODES.has(event.code)) {
    throw new Error(
      `semantic_events[${index}].code is invalid: ${String(event.code)}`
    );
  }
  const confidence =
    event.confidence === undefined
      ? undefined
      : typeof event.confidence === "string" &&
          CONFIDENCE_VALUES.has(event.confidence)
        ? (event.confidence as "low" | "medium" | "high")
        : (() => {
            throw new Error(
              `semantic_events[${index}].confidence must be low|medium|high.`
            );
          })();

  return {
    code: event.code,
    pre_evidence: parseNullableString(
      event.pre_evidence,
      `semantic_events[${index}].pre_evidence`
    ),
    post_evidence: parseNullableString(
      event.post_evidence,
      `semantic_events[${index}].post_evidence`
    ),
    rationale: typeof event.rationale === "string" ? event.rationale : undefined,
    alternative_considered: parseNullableString(
      event.alternative_considered,
      `semantic_events[${index}].alternative_considered`
    ),
    confidence,
  };
}

function parseCandidateAlignments(
  value: unknown
): ArtifactCodingAiCandidateAlignment[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new Error("concept_alignment.candidate_alignments must be an array.");
  }
  return value.map((item, index) => {
    if (!isObject(item)) {
      throw new Error(
        `concept_alignment.candidate_alignments[${index}] must be an object.`
      );
    }
    if (typeof item.pre !== "string" || typeof item.post !== "string") {
      throw new Error(
        `concept_alignment.candidate_alignments[${index}] must include pre and post strings.`
      );
    }
    const verdict =
      item.verdict === undefined
        ? undefined
        : typeof item.verdict === "string" && VERDICTS.has(item.verdict)
          ? (item.verdict as "plausible" | "weak" | "implausible")
          : (() => {
              throw new Error(
                `concept_alignment.candidate_alignments[${index}].verdict must be plausible|weak|implausible.`
              );
            })();
    return {
      pre: item.pre,
      post: item.post,
      continuity:
        typeof item.continuity === "string" ? item.continuity : undefined,
      scope: typeof item.scope === "string" ? item.scope : undefined,
      frame: typeof item.frame === "string" ? item.frame : undefined,
      stretch: typeof item.stretch === "string" ? item.stretch : undefined,
      verdict,
    };
  });
}

function parseRejectedAlignments(
  value: unknown
): ArtifactCodingAiRejectedAlignment[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new Error("concept_alignment.rejected_alignments must be an array.");
  }
  return value.map((item, index) => {
    if (!isObject(item)) {
      throw new Error(
        `concept_alignment.rejected_alignments[${index}] must be an object.`
      );
    }
    if (
      typeof item.pre !== "string" ||
      typeof item.post !== "string" ||
      typeof item.reason !== "string"
    ) {
      throw new Error(
        `concept_alignment.rejected_alignments[${index}] must include pre, post, and reason strings.`
      );
    }
    return { pre: item.pre, post: item.post, reason: item.reason };
  });
}

function parseNewRemovedRecheck(
  value: unknown
): ArtifactCodingAiNewRemovedRecheck[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new Error("concept_alignment.new_removed_recheck must be an array.");
  }
  return value.map((item, index) => {
    const field = `concept_alignment.new_removed_recheck[${index}]`;
    if (!isObject(item)) {
      throw new Error(`${field} must be an object.`);
    }
    if (typeof item.concept !== "string") {
      throw new Error(`${field}.concept must be a string.`);
    }
    if (
      typeof item.direction !== "string" ||
      !RECHECK_DIRECTIONS.has(item.direction)
    ) {
      throw new Error(`${field}.direction must be new|removed.`);
    }
    if (typeof item.outcome !== "string" || !RECHECK_OUTCOMES.has(item.outcome)) {
      throw new Error(`${field}.outcome must be kept|converted.`);
    }
    return {
      concept: item.concept,
      direction: item.direction as "new" | "removed",
      nearest_counterpart: parseNullableString(
        item.nearest_counterpart,
        `${field}.nearest_counterpart`
      ),
      codes_tested: asStringArray(item.codes_tested),
      outcome: item.outcome as "kept" | "converted",
      reason: typeof item.reason === "string" ? item.reason : undefined,
    };
  });
}

function parseCriticCorrections(
  value: unknown
): ArtifactCodingAiCriticCorrection[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new Error("concept_alignment.critic_corrections must be an array.");
  }
  return value.map((item, index) => {
    if (!isObject(item)) {
      throw new Error(
        `concept_alignment.critic_corrections[${index}] must be an object.`
      );
    }
    if (typeof item.type !== "string" || !CORRECTION_TYPES.has(item.type)) {
      throw new Error(
        `concept_alignment.critic_corrections[${index}].type is invalid.`
      );
    }
    if (typeof item.reason !== "string") {
      throw new Error(
        `concept_alignment.critic_corrections[${index}].reason must be a string.`
      );
    }
    return {
      type: item.type as ArtifactCodingAiCriticCorrection["type"],
      pre: parseNullableString(
        item.pre,
        `concept_alignment.critic_corrections[${index}].pre`
      ),
      post: parseNullableString(
        item.post,
        `concept_alignment.critic_corrections[${index}].post`
      ),
      from_code: parseNullableString(
        item.from_code,
        `concept_alignment.critic_corrections[${index}].from_code`
      ),
      to_code: parseNullableString(
        item.to_code,
        `concept_alignment.critic_corrections[${index}].to_code`
      ),
      reason: item.reason,
    };
  });
}

function parseConceptAlignment(
  value: unknown
): ArtifactCodingAiConceptAlignment | undefined {
  if (value === undefined) return undefined;
  if (!isObject(value)) {
    throw new Error("concept_alignment must be an object when present.");
  }

  let unitization_mode: UnitizationMode | undefined;
  if (value.unitization_mode !== undefined) {
    if (
      typeof value.unitization_mode !== "string" ||
      !UNITIZATION_MODES.has(value.unitization_mode as UnitizationMode)
    ) {
      throw new Error(
        "concept_alignment.unitization_mode must be descriptor_set_special|semantic_phrase|scoped_category."
      );
    }
    unitization_mode = value.unitization_mode as UnitizationMode;
  }

  let matched_pairs: ArtifactCodingAiMatchedPair[] | undefined;
  if (value.matched_pairs !== undefined) {
    if (!Array.isArray(value.matched_pairs)) {
      throw new Error("concept_alignment.matched_pairs must be an array.");
    }
    matched_pairs = value.matched_pairs.map((pair, index) => {
      if (!isObject(pair)) {
        throw new Error(`concept_alignment.matched_pairs[${index}] must be an object.`);
      }
      if (typeof pair.pre !== "string" || typeof pair.post !== "string") {
        throw new Error(
          `concept_alignment.matched_pairs[${index}] must include pre and post strings.`
        );
      }
      return {
        pre: pair.pre,
        post: pair.post,
        basis: typeof pair.basis === "string" ? pair.basis : undefined,
      };
    });
  }

  return {
    unitization_mode,
    pre_concepts: asStringArray(value.pre_concepts),
    post_concepts: asStringArray(value.post_concepts),
    candidate_alignments: parseCandidateAlignments(value.candidate_alignments),
    rejected_alignments: parseRejectedAlignments(value.rejected_alignments),
    matched_pairs,
    unmatched_pre: asStringArray(value.unmatched_pre),
    unmatched_post: asStringArray(value.unmatched_post),
    order_only_changes: asStringArray(value.order_only_changes),
    new_removed_recheck: parseNewRemovedRecheck(value.new_removed_recheck),
    critic_corrections: parseCriticCorrections(value.critic_corrections),
  };
}

export function parseAiOutput(raw: string): ArtifactCodingAiOutput {
  const cleaned = stripMarkdownFences(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Failed to parse JSON response from MiniMax: ${cleaned.slice(0, 300)}`
    );
  }

  if (!isObject(parsed)) {
    throw new Error("MiniMax output is not a JSON object.");
  }

  if (!isObject(parsed.coding_unit)) {
    throw new Error("Missing or invalid coding_unit.");
  }
  if (
    typeof parsed.coding_unit.student_id !== "string" ||
    typeof parsed.coding_unit.item_id !== "string"
  ) {
    throw new Error("coding_unit must include student_id and item_id strings.");
  }

  if (!isObject(parsed.structural_development)) {
    throw new Error("Missing or invalid structural_development.");
  }
  if (typeof parsed.structural_development.code !== "string") {
    throw new Error("structural_development.code must be a string.");
  }
  if (!STRUCTURAL_CODES.has(parsed.structural_development.code)) {
    throw new Error(
      `Invalid structural_development.code: ${parsed.structural_development.code}`
    );
  }

  if (!Array.isArray(parsed.semantic_events)) {
    throw new Error("semantic_events must be an array.");
  }

  const concept_alignment = parseConceptAlignment(parsed.concept_alignment);
  const semantic_events = parsed.semantic_events.map(parseSemanticEvent);

  let learner_agency: ArtifactCodingAiAgencyEvent[] | undefined;
  if (parsed.learner_agency !== undefined) {
    if (!Array.isArray(parsed.learner_agency)) {
      throw new Error("learner_agency must be an array when present.");
    }
    learner_agency = parsed.learner_agency.map((event, index) => {
      if (!isObject(event)) {
        throw new Error(`learner_agency[${index}] must be an object.`);
      }
      if (typeof event.code !== "string") {
        throw new Error(`learner_agency[${index}].code must be a string.`);
      }
      if (
        typeof event.confidence !== "string" ||
        !CONFIDENCE_VALUES.has(event.confidence)
      ) {
        throw new Error(
          `learner_agency[${index}].confidence must be low|medium|high.`
        );
      }
      return {
        code: event.code,
        evidence: typeof event.evidence === "string" ? event.evidence : undefined,
        rationale:
          typeof event.rationale === "string" ? event.rationale : undefined,
        confidence: event.confidence as "low" | "medium" | "high",
      };
    });
  }

  if (!isObject(parsed.uncertainty)) {
    throw new Error("Missing or invalid uncertainty.");
  }
  if (
    typeof parsed.uncertainty.confidence !== "string" ||
    !CONFIDENCE_VALUES.has(parsed.uncertainty.confidence)
  ) {
    throw new Error("uncertainty.confidence must be low|medium|high.");
  }

  const flags = Array.isArray(parsed.uncertainty.flags)
    ? parsed.uncertainty.flags.filter(
        (flag): flag is string => typeof flag === "string"
      )
    : [];

  return {
    coding_unit: {
      student_id: parsed.coding_unit.student_id,
      item_id: parsed.coding_unit.item_id,
    },
    concept_alignment,
    structural_development: {
      code: parsed.structural_development.code,
      rationale:
        typeof parsed.structural_development.rationale === "string"
          ? parsed.structural_development.rationale
          : undefined,
    },
    semantic_events,
    learner_agency,
    uncertainty: {
      confidence: parsed.uncertainty.confidence as "low" | "medium" | "high",
      flags,
      coder_notes:
        typeof parsed.uncertainty.coder_notes === "string"
          ? parsed.uncertainty.coder_notes
          : undefined,
    },
    coded_at:
      typeof parsed.coded_at === "string" ? parsed.coded_at : undefined,
    model: typeof parsed.model === "string" ? parsed.model : undefined,
  };
}

function findProvisionalCodeForPair(
  events: ArtifactCodingAiSemanticEvent[],
  pre: string,
  post: string
): {
  provisional_code: string | null;
  rationale?: string;
  alternative_considered?: string | null;
} {
  const match = events.find(
    (event) =>
      event.pre_evidence === pre &&
      event.post_evidence === post &&
      event.code !== "New" &&
      event.code !== "Removed"
  );
  if (!match) {
    return { provisional_code: null };
  }
  return {
    provisional_code: match.code,
    rationale: match.rationale,
    alternative_considered: match.alternative_considered,
  };
}

export function buildCriticInputFromPass1(
  input: ArtifactCodingInput,
  pass1: ArtifactCodingAiOutput
): CriticInputPayload {
  const alignment = pass1.concept_alignment ?? {};
  const matched = alignment.matched_pairs ?? [];
  const proposed_alignment = matched.map((pair) => {
    const provisional = findProvisionalCodeForPair(
      pass1.semantic_events,
      pair.pre,
      pair.post
    );
    return {
      pre: pair.pre,
      post: pair.post,
      basis: pair.basis,
      provisional_code: provisional.provisional_code,
      rationale: provisional.rationale ?? pair.basis,
      alternative_considered: provisional.alternative_considered ?? null,
    };
  });

  return {
    item_name: input.item_name,
    unitization_mode: alignment.unitization_mode ?? resolveUnitizationMode(input),
    pre_concepts: alignment.pre_concepts ?? [],
    post_concepts: alignment.post_concepts ?? [],
    proposed_alignment,
    unmatched_pre: alignment.unmatched_pre ?? [],
    unmatched_post: alignment.unmatched_post ?? [],
    proposed_semantic_events: pass1.semantic_events,
    candidate_alignments: alignment.candidate_alignments,
    rejected_alignments: alignment.rejected_alignments,
    new_removed_recheck: alignment.new_removed_recheck,
  };
}

export async function buildCriticPrompt(
  criticInput: CriticInputPayload
): Promise<string> {
  const criticMd = await readReference("references/critic.md");

  return `You are the lightweight bidirectional critic for CHI26 artifact coding.
Do NOT re-code from scratch. Critique the provisional pass-1 result and return corrections.

CRITICAL RULES
- You have TWO duties. Your PRIMARY duty is LINEAGE RECOVERY: find provisional New/Removed events that should have been coded as transformations. Your secondary duty is rejecting pairings forced between unrelated concepts.
- NEIGHBORHOOD GATE decides which duty applies. If two concepts share a semantic neighborhood, lineage must be TESTED via the ladder — but the ladder may still end at Removed + New. If they occupy genuinely different conceptual domains, rejection is available immediately.
- TRANSFORMATION LADDER, in order: (1) Narrowed if POST is A SPECIFIC WAY OF BEING PRE (subsumption); (2) Reframed if no subsumption but same territory with a shifted frame — this is CORRECT for sibling concepts; (3) Elaborated; (4) Expanded; (5) Removed + New if only topically adjacent.
- DO NOT OVER-CORRECT TOWARD NARROWED. A previous version of you recoded nearly every Reframed to Narrowed. Only recode Reframed => Narrowed when the subsumption sentence is literally TRUE. Calibrated: "Relatable is a specific way of being Community-Building" is FALSE, so Community-Building -> Relatable must stay Reframed. "Interactive is a specific way of being Fun" is TRUE, so Narrowed is right there.
- PRE-genericness signal: subsumption usually holds when PRE is a generic filler word; it usually fails when PRE is already substantive.
- ABSTRACTION CEILING — DO NOT INVENT A NEIGHBORHOOD. A neighborhood must be nameable at a SPECIFIC level. If the only shared territory you can state is a broad umbrella such as "identity", "self-presentation", "brand quality", "positioning", "experience", "values", or "audience-facing attribute", then there is NO neighborhood and the pair stays at tier 5 (Removed + New). Ask: "could this same shared territory be claimed for almost any two descriptors in this item?" If yes, you have hit the ceiling — do NOT restore lineage.
- CONFIRMED NON-NEIGHBORHOOD (human-verified): Lifestyle-Oriented vs Expressive. Aspirational lifestyle positioning and individual expressiveness are topically adjacent ONLY. Claiming an "identity / self-presentation" territory for this pair is exactly the abstraction-ceiling error. Correct output is Removed (Lifestyle-Oriented) + New (Expressive). Do NOT restore lineage on this pair.
- Lineage recovery is your primary duty, but it is not unconditional. Recovering lineage that does not exist is as much an error as missing lineage that does.
- For EVERY provisional New, find the nearest PRE antecedent. For EVERY provisional Removed, find the nearest POST successor. Test Narrowed, Reframed, Elaborated, Expanded against it. If any is defensible, emit restore_lineage and replace the New+Removed pair with one matched transformation event.
- Strict synonymy is NOT required for lineage. self-expression ↔ individuality, Emotion-Appealing ↔ Authentic, and Fun ↔ Interactive all have defensible lineage and must be classified, not split.
- Interpretive difficulty is NOT grounds to split a pair. If two codes are both arguable, pick the better-supported one and record the other in alternative_considered.
- Question D (position / leftover exhaustion) must NEVER fire on a same-neighborhood pair.
- AN IMPLAUSIBLE MATCH IS WORSE THAN REMOVED + NEW applies ONLY to different-domain pairs such as Customer-Centricity ↔ Theory-Based.
- DO NOT RECODE Elaborated => Reframed when POST simply adds modifiers to the same underlying noun/category. "designed physical products" -> "cute physical merchandised products" is ELABORATED: the category (physical products) is intact and only descriptors were added. Reframed requires the organizing FRAME to change, not just added detail. Confirm Elaborated in these cases.
- DO NOT RECODE Narrowed => Reframed when a scope or population restriction holds. If POST denotes a proper subset of the PRE category, Narrowed is correct. Calibrated: "uniting individuals" -> "uniting enthusiasts" is NARROWED because enthusiasts are a subset of individuals. Confirm it.
- Your job is to correct genuine errors, NOT to change codes for their own sake. Emitting "confirm" is the correct action whenever pass 1 got it right. A run where you recoded most events is a run where you probably introduced errors.
- restore_lineage may ONLY use a PRE unit listed in unmatched_pre AND a POST unit listed in unmatched_post. Never reuse a unit that is already inside a matched pair — one PRE unit cannot be the antecedent of two events. If the nearest antecedent for a provisional New is already matched to something else, leave the New in place.
- Students rarely delete an idea outright; usually they found a better way to express it. But output that manufactures lineage where none exists is equally wrong.
- Return corrected final_alignments and semantic_events outright, plus corrections[] as the audit log.
- Do not invent concepts absent from the pass-1 inventories.

---
## CRITIC INSTRUCTIONS
${criticMd.trim()}

---
## PASS-1 PROVISIONAL RESULT
${JSON.stringify(criticInput, null, 2)}

---
## OUTPUT INSTRUCTION
Return ONLY a valid JSON object. No markdown fences. No explanation. Start with { and end with }.
`;
}

export function parseCriticOutput(raw: string): CriticOutput {
  const cleaned = stripMarkdownFences(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Failed to parse critic JSON: ${cleaned.slice(0, 300)}`
    );
  }
  if (!isObject(parsed)) {
    throw new Error("Critic output is not a JSON object.");
  }
  if (!Array.isArray(parsed.corrections)) {
    throw new Error("critic.corrections must be an array.");
  }
  if (!Array.isArray(parsed.final_alignments)) {
    throw new Error("critic.final_alignments must be an array.");
  }
  if (!Array.isArray(parsed.semantic_events)) {
    throw new Error("critic.semantic_events must be an array.");
  }

  const corrections =
    parseCriticCorrections(parsed.corrections) ??
    (() => {
      throw new Error("Failed to parse critic corrections.");
    })();

  const final_alignments = parsed.final_alignments.map((pair, index) => {
    if (!isObject(pair)) {
      throw new Error(`critic.final_alignments[${index}] must be an object.`);
    }
    if (typeof pair.pre !== "string" || typeof pair.post !== "string") {
      throw new Error(
        `critic.final_alignments[${index}] must include pre and post strings.`
      );
    }
    return {
      pre: pair.pre,
      post: pair.post,
      basis: typeof pair.basis === "string" ? pair.basis : undefined,
    };
  });

  return {
    corrections,
    final_alignments,
    unmatched_pre: asStringArray(parsed.unmatched_pre),
    unmatched_post: asStringArray(parsed.unmatched_post),
    semantic_events: parsed.semantic_events.map(parseSemanticEvent),
  };
}

export function applyCriticCorrections(
  pass1: ArtifactCodingAiOutput,
  critic: CriticOutput
): ArtifactCodingAiOutput {
  const alignment = pass1.concept_alignment ?? {};

  const pass1UnmatchedPre = new Set(alignment.unmatched_pre ?? []);
  const pass1UnmatchedPost = new Set(alignment.unmatched_post ?? []);

  // Lineage recovery may only re-pair units that pass 1 actually left unmatched.
  // Reusing an already-matched unit would give one PRE concept two antecedent roles.
  const restored: ArtifactCodingAiCriticCorrection[] = [];
  const rejectedRestores: ArtifactCodingAiCriticCorrection[] = [];
  for (const correction of critic.corrections) {
    if (correction.type !== "restore_lineage") continue;
    const preAvailable =
      typeof correction.pre === "string" && pass1UnmatchedPre.has(correction.pre);
    const postAvailable =
      typeof correction.post === "string" && pass1UnmatchedPost.has(correction.post);
    if (preAvailable && postAvailable) {
      restored.push(correction);
    } else {
      rejectedRestores.push(correction);
    }
  }

  const restoredPre = new Set(
    restored.map((c) => c.pre).filter((v): v is string => typeof v === "string")
  );
  const restoredPost = new Set(
    restored.map((c) => c.post).filter((v): v is string => typeof v === "string")
  );

  // Concepts whose restore was rejected must return to the unmatched inventories.
  const orphanPre = new Set(
    rejectedRestores
      .map((c) => c.pre)
      .filter((v): v is string => typeof v === "string" && pass1UnmatchedPre.has(v))
  );
  const orphanPost = new Set(
    rejectedRestores
      .map((c) => c.post)
      .filter((v): v is string => typeof v === "string" && pass1UnmatchedPost.has(v))
  );

  const unmatchedPre = Array.from(
    new Set([
      ...(critic.unmatched_pre ?? alignment.unmatched_pre ?? []).filter(
        (concept) => !restoredPre.has(concept)
      ),
      ...orphanPre,
    ])
  );
  const unmatchedPost = Array.from(
    new Set([
      ...(critic.unmatched_post ?? alignment.unmatched_post ?? []).filter(
        (concept) => !restoredPost.has(concept)
      ),
      ...orphanPost,
    ])
  );

  // Drop critic events built on a rejected restore, and reinstate the pass-1
  // New/Removed events for the concepts that restore had absorbed.
  let semanticEvents = critic.semantic_events;
  if (rejectedRestores.length > 0) {
    const rejectedKeys = new Set(
      rejectedRestores.map((c) => `${c.pre ?? ""}\u0000${c.post ?? ""}`)
    );
    semanticEvents = semanticEvents.filter(
      (event) =>
        !rejectedKeys.has(
          `${event.pre_evidence ?? ""}\u0000${event.post_evidence ?? ""}`
        )
    );
    for (const event of pass1.semantic_events) {
      const isOrphanedRemoved =
        event.code === "Removed" &&
        typeof event.pre_evidence === "string" &&
        orphanPre.has(event.pre_evidence);
      const isOrphanedNew =
        event.code === "New" &&
        typeof event.post_evidence === "string" &&
        orphanPost.has(event.post_evidence);
      if (!isOrphanedRemoved && !isOrphanedNew) continue;
      const alreadyPresent = semanticEvents.some(
        (existing) =>
          existing.code === event.code &&
          existing.pre_evidence === event.pre_evidence &&
          existing.post_evidence === event.post_evidence
      );
      if (!alreadyPresent) semanticEvents = [...semanticEvents, event];
    }
  }

  // Ensure every restored pair appears in the final alignment even if the critic omitted it.
  const finalAlignments = critic.final_alignments.filter(
    (pair) =>
      !rejectedRestores.some(
        (rejected) => rejected.pre === pair.pre && rejected.post === pair.post
      )
  );
  for (const correction of restored) {
    if (typeof correction.pre !== "string" || typeof correction.post !== "string") {
      continue;
    }
    const alreadyPresent = finalAlignments.some(
      (pair) => pair.pre === correction.pre && pair.post === correction.post
    );
    if (!alreadyPresent) {
      finalAlignments.push({
        pre: correction.pre,
        post: correction.post,
        basis: correction.reason,
      });
    }
  }

  const nextAlignment: ArtifactCodingAiConceptAlignment = {
    ...alignment,
    matched_pairs: finalAlignments,
    unmatched_pre: unmatchedPre,
    unmatched_post: unmatchedPost,
    critic_corrections: critic.corrections.filter(
      (correction) => !rejectedRestores.includes(correction)
    ),
  };

  const flags = new Set(pass1.uncertainty.flags ?? []);
  for (const correction of critic.corrections) {
    if (rejectedRestores.includes(correction)) continue;
    if (correction.type === "restore_lineage") {
      flags.add("lineage_restored_by_critic");
      flags.add("neighborhood_protected");
      flags.delete("forced_pairing_rejected");
      flags.delete("alignment_null_by_choice");
    }
    if (correction.type === "reject_pairing") {
      flags.add("forced_pairing_rejected");
      flags.add("alignment_null_by_choice");
    }
    if (
      correction.type === "recode" &&
      correction.from_code === "Reframed" &&
      correction.to_code &&
      correction.to_code !== "Reframed"
    ) {
      flags.add("reframe_downgraded");
    }
  }
  if (semanticEvents.some((e) => e.code === "New" || e.code === "Removed")) {
    flags.add("new_removed_recheck_passed");
  }
  if (rejectedRestores.length > 0) {
    flags.add("critic_restore_rejected_unit_already_matched");
  }

  const restoredNote = restored.length
    ? ` Lineage restored for ${restored.length} pair(s): ${restored
        .map((c) => `${c.pre ?? "?"} → ${c.post ?? "?"}`)
        .join("; ")}.`
    : "";

  const rejectedNote = rejectedRestores.length
    ? ` Rejected ${rejectedRestores.length} critic restore(s) that reused an already-matched unit: ${rejectedRestores
        .map((c) => `${c.pre ?? "?"} → ${c.post ?? "?"}`)
        .join("; ")}.`
    : "";

  return {
    ...pass1,
    concept_alignment: nextAlignment,
    semantic_events: semanticEvents,
    uncertainty: {
      ...pass1.uncertainty,
      flags: Array.from(flags),
      coder_notes: [
        pass1.uncertainty.coder_notes,
        critic.corrections.length
          ? `Critic applied ${
              critic.corrections.length - rejectedRestores.length
            } correction(s).${restoredNote}${rejectedNote}`
          : "Critic confirmed pass-1 with no corrections.",
      ]
        .filter(Boolean)
        .join(" "),
    },
    model: pass1.model
      ? pass1.model.includes("+critic")
        ? pass1.model
        : `${pass1.model}+critic`
      : "MiniMax-M3+critic",
  };
}

/**
 * Enforce event-level consistency invariants that the model cannot be trusted to hold.
 *
 * 1. No double-counting: a concept already accounted for inside a matched pair may not
 *    also carry a Removed (PRE side) or New (POST side) event. This contradiction is
 *    auto-resolved in favour of the matched transformation.
 * 2. One PRE unit = at most one event. Violations need human judgment about how to split
 *    the span, so they are flagged rather than rewritten.
 */
export function enforceEventConsistency(
  output: ArtifactCodingAiOutput
): ArtifactCodingAiOutput {
  const events = output.semantic_events;
  const matchedPre = new Set<string>();
  const matchedPost = new Set<string>();
  for (const event of events) {
    if (event.pre_evidence && event.post_evidence) {
      matchedPre.add(event.pre_evidence);
      matchedPost.add(event.post_evidence);
    }
  }

  const dropped: string[] = [];
  const kept = events.filter((event) => {
    const isDoubleCountedRemoved =
      event.code === "Removed" &&
      !event.post_evidence &&
      !!event.pre_evidence &&
      matchedPre.has(event.pre_evidence);
    const isDoubleCountedNew =
      event.code === "New" &&
      !event.pre_evidence &&
      !!event.post_evidence &&
      matchedPost.has(event.post_evidence);
    if (isDoubleCountedRemoved || isDoubleCountedNew) {
      dropped.push(
        `${event.code} "${event.pre_evidence ?? event.post_evidence}"`
      );
      return false;
    }
    return true;
  });

  const preCounts = new Map<string, number>();
  for (const event of kept) {
    if (!event.pre_evidence) continue;
    preCounts.set(event.pre_evidence, (preCounts.get(event.pre_evidence) ?? 0) + 1);
  }
  const duplicatePre = [...preCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([concept]) => concept);

  if (dropped.length === 0 && duplicatePre.length === 0) return output;

  const flags = new Set(output.uncertainty.flags ?? []);
  const notes: string[] = [output.uncertainty.coder_notes ?? ""];
  if (dropped.length > 0) {
    flags.add("double_counted_event_dropped");
    notes.push(
      `Consistency check dropped ${dropped.length} double-counted event(s) for concepts already inside a matched pair: ${dropped.join("; ")}.`
    );
  }
  if (duplicatePre.length > 0) {
    flags.add("duplicate_pre_antecedent");
    notes.push(
      `Consistency check: ${duplicatePre
        .map((c) => `"${c}"`)
        .join("; ")} serves as the antecedent of more than one event. The PRE span likely needs splitting — review before accepting.`
    );
  }

  return {
    ...output,
    semantic_events: kept,
    uncertainty: {
      ...output.uncertainty,
      flags: Array.from(flags),
      coder_notes: notes.filter(Boolean).join(" "),
    },
  };
}

export function mapOutputToArtifactCoding(
  output: ArtifactCodingAiOutput
): ArtifactCoding {
  const semanticChanges: SemanticCode[] = output.semantic_events.map(
    (event) => ({
      instanceId: makeId(),
      code: event.code,
      preEvidence: event.pre_evidence ?? null,
      postEvidence: event.post_evidence ?? null,
      rationale: event.rationale,
      confidence: event.confidence,
      alternativeConsidered: event.alternative_considered,
    })
  );

  const learnerAgency: AgencyCode[] = (output.learner_agency ?? []).map(
    (event) => ({
      instanceId: makeId(),
      code: event.code,
      evidence: event.evidence,
      rationale: event.rationale,
      confidence: event.confidence,
    })
  );

  const uncertainty: ArtifactCodingUncertainty = {
    confidence: output.uncertainty.confidence,
    flags: output.uncertainty.flags ?? [],
    coderNotes: output.uncertainty.coder_notes,
  };

  let conceptAlignment: ConceptAlignment | undefined;
  if (output.concept_alignment) {
    const matchedPairs: ConceptAlignmentPair[] | undefined =
      output.concept_alignment.matched_pairs?.map((pair) => ({
        pre: pair.pre,
        post: pair.post,
        basis: pair.basis,
      }));
    const candidateAlignments: CandidateAlignment[] | undefined =
      output.concept_alignment.candidate_alignments?.map((c) => ({
        pre: c.pre,
        post: c.post,
        continuity: c.continuity,
        scope: c.scope,
        frame: c.frame,
        stretch: c.stretch,
        verdict: c.verdict,
      }));
    const rejectedAlignments: RejectedAlignment[] | undefined =
      output.concept_alignment.rejected_alignments?.map((r) => ({
        pre: r.pre,
        post: r.post,
        reason: r.reason,
      }));
    const criticCorrections: CriticCorrection[] | undefined =
      output.concept_alignment.critic_corrections?.map((c) => ({
        type: c.type,
        pre: c.pre,
        post: c.post,
        fromCode: c.from_code,
        toCode: c.to_code,
        reason: c.reason,
      }));
    const newRemovedRecheck: NewRemovedRecheck[] | undefined =
      output.concept_alignment.new_removed_recheck?.map((r) => ({
        concept: r.concept,
        direction: r.direction,
        nearestCounterpart: r.nearest_counterpart,
        codesTested: r.codes_tested,
        outcome: r.outcome,
        reason: r.reason,
      }));

    conceptAlignment = {
      unitizationMode: output.concept_alignment.unitization_mode,
      preConcepts: output.concept_alignment.pre_concepts,
      postConcepts: output.concept_alignment.post_concepts,
      candidateAlignments,
      rejectedAlignments,
      matchedPairs,
      unmatchedPre: output.concept_alignment.unmatched_pre,
      unmatchedPost: output.concept_alignment.unmatched_post,
      orderOnlyChanges: output.concept_alignment.order_only_changes,
      newRemovedRecheck,
      criticCorrections,
    };
  }

  return {
    structuralDevelopment: output.structural_development.code,
    structuralRationale: output.structural_development.rationale,
    conceptAlignment,
    semanticChanges,
    learnerAgency,
    uncertainty,
  };
}
