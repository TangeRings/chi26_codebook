import { promises as fs } from "fs";
import path from "path";
import type {
  AgencyCode,
  ArtifactCoding,
  ArtifactCodingUncertainty,
  ConceptAlignment,
  ConceptAlignmentPair,
  SemanticCode,
} from "@/types/research";

export type ArtifactCodingInput = {
  student_id: string;
  item_id: string;
  item_name: string;
  question_text?: string;
  pre_response: string;
  post_response: string;
};

export type ArtifactCodingAiSemanticEvent = {
  code: string;
  pre_evidence?: string | null;
  post_evidence?: string | null;
  rationale?: string;
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

export type ArtifactCodingAiConceptAlignment = {
  pre_concepts?: string[];
  post_concepts?: string[];
  matched_pairs?: ArtifactCodingAiMatchedPair[];
  unmatched_pre?: string[];
  unmatched_post?: string[];
  order_only_changes?: string[];
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

  // Strip YAML frontmatter from SKILL.md for the model prompt
  const skillBody = skillMd.replace(/^---[\s\S]*?---\s*/, "").trim();

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
- New and Removed are LAST-RESORT classifications. Search the entire opposite response before assigning them.
- Do not attribute reordering to AI generation or student process. Code the artifact only.

CODING PROCEDURE
Follow the 11-step concept-inventory-first procedure from the skill instructions below.
Inventory → global alignment → order screen → classify matched pairs → last-resort New/Removed.

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
${input.question_text ? `question_text: ${input.question_text}` : "question_text: (not provided)"}

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
    "pre_concepts": ["string"],
    "post_concepts": ["string"],
    "matched_pairs": [{ "pre": "string", "post": "string", "basis": "string" }],
    "unmatched_pre": ["string"],
    "unmatched_post": ["string"],
    "order_only_changes": ["string"]
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
- For New events: pre_evidence must be null. Rationale must state that a full-response PRE search found no antecedent.
- For Removed events: post_evidence must be null. Rationale must state that a full-response POST search found no successor.
- For Reframed events: rationale must name both the pre-frame and the post-frame.
- Keep every distinct semantic change as its own array entry, even if codes repeat.
- Never emit Removed for a concept already accounted for inside a matched pair.
- learner_agency may be [] if no direct evidence is present.
`;
}

function stripMarkdownFences(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return cleaned.trim();
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseConceptAlignment(
  value: unknown
): ArtifactCodingAiConceptAlignment | undefined {
  if (value === undefined) return undefined;
  if (!isObject(value)) {
    throw new Error("concept_alignment must be an object when present.");
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
    pre_concepts: asStringArray(value.pre_concepts),
    post_concepts: asStringArray(value.post_concepts),
    matched_pairs,
    unmatched_pre: asStringArray(value.unmatched_pre),
    unmatched_post: asStringArray(value.unmatched_post),
    order_only_changes: asStringArray(value.order_only_changes),
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

  const semantic_events: ArtifactCodingAiSemanticEvent[] =
    parsed.semantic_events.map((event, index) => {
      if (!isObject(event)) {
        throw new Error(`semantic_events[${index}] must be an object.`);
      }
      if (typeof event.code !== "string" || !SEMANTIC_CODES.has(event.code)) {
        throw new Error(
          `semantic_events[${index}].code is invalid: ${String(event.code)}`
        );
      }
      const pre =
        event.pre_evidence === undefined
          ? undefined
          : event.pre_evidence === null
            ? null
            : typeof event.pre_evidence === "string"
              ? event.pre_evidence
              : (() => {
                  throw new Error(
                    `semantic_events[${index}].pre_evidence must be string or null.`
                  );
                })();
      const post =
        event.post_evidence === undefined
          ? undefined
          : event.post_evidence === null
            ? null
            : typeof event.post_evidence === "string"
              ? event.post_evidence
              : (() => {
                  throw new Error(
                    `semantic_events[${index}].post_evidence must be string or null.`
                  );
                })();
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
        pre_evidence: pre,
        post_evidence: post,
        rationale:
          typeof event.rationale === "string" ? event.rationale : undefined,
        confidence,
      };
    });

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
    conceptAlignment = {
      preConcepts: output.concept_alignment.pre_concepts,
      postConcepts: output.concept_alignment.post_concepts,
      matchedPairs,
      unmatchedPre: output.concept_alignment.unmatched_pre,
      unmatchedPost: output.concept_alignment.unmatched_post,
      orderOnlyChanges: output.concept_alignment.order_only_changes,
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
