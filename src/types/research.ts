export type SemanticCode = {
  instanceId: string;
  code: string;
  /** Quoted or paraphrased span from the pre-response. Null for New events. */
  preEvidence?: string | null;
  /** Quoted or paraphrased span from the post-response. Null for Removed events. */
  postEvidence?: string | null;
  /** Concise coding rationale. Names any decision rule applied. */
  rationale?: string;
  /** Optional per-event coder confidence. */
  confidence?: "low" | "medium" | "high";
  /** Strongest runner-up interpretation (e.g. Reframed, Narrowed, Removed+New). */
  alternativeConsidered?: string | null;
  /** Legacy free-text field. Kept for backward compatibility. */
  reason?: string;
};

export type ConceptAlignmentPair = {
  pre: string;
  post: string;
  basis?: string;
};

export type CandidateAlignment = {
  pre: string;
  post: string;
  continuity?: string;
  scope?: string;
  frame?: string;
  stretch?: string;
  verdict?: "plausible" | "weak" | "implausible";
};

export type RejectedAlignment = {
  pre: string;
  post: string;
  reason: string;
};

export type CriticCorrection = {
  type:
    | "restore_lineage"
    | "reject_pairing"
    | "recode"
    | "add_pairing"
    | "confirm";
  pre?: string | null;
  post?: string | null;
  fromCode?: string | null;
  toCode?: string | null;
  reason: string;
};

/** One mandatory nearest-counterpart search performed before finalizing a New or Removed. */
export type NewRemovedRecheck = {
  concept: string;
  direction: "new" | "removed";
  nearestCounterpart?: string | null;
  codesTested?: string[];
  outcome: "kept" | "converted";
  reason?: string;
};

export type ConceptAlignment = {
  unitizationMode?:
    | "descriptor_set_special"
    | "semantic_phrase"
    | "scoped_category";
  preConcepts?: string[];
  postConcepts?: string[];
  candidateAlignments?: CandidateAlignment[];
  rejectedAlignments?: RejectedAlignment[];
  matchedPairs?: ConceptAlignmentPair[];
  unmatchedPre?: string[];
  unmatchedPost?: string[];
  orderOnlyChanges?: string[];
  newRemovedRecheck?: NewRemovedRecheck[];
  criticCorrections?: CriticCorrection[];
};

export type AgencyCode = {
  instanceId: string;
  code: string;
  /** Direct textual evidence from the artifact supporting this agency event. */
  evidence?: string;
  /** Concise rationale for the agency classification. */
  rationale?: string;
  /** Coder confidence in this agency judgment. */
  confidence?: "low" | "medium" | "high";
  /** Legacy free-text field. Kept for backward compatibility. */
  reason?: string;
};

export type ArtifactCodingUncertainty = {
  confidence?: "low" | "medium" | "high";
  /** Named boundary flags from the decision-rules controlled vocabulary. */
  flags?: string[];
  coderNotes?: string;
};

export type ArtifactCoding = {
  structuralDevelopment?: string | null;
  /** Concise rationale for the structural development judgment. */
  structuralRationale?: string;
  /** Global PRE/POST concept inventory and alignment produced before classification. */
  conceptAlignment?: ConceptAlignment;
  semanticChanges?: SemanticCode[];
  learnerAgency?: AgencyCode[];
  uncertainty?: ArtifactCodingUncertainty;
};

export type ComparisonItem = {
  id: string;
  questionId: string;
  label: string;
  // Keep the full original survey question in the data, but do not show prominently in the table
  questionText?: string;
  pre: {
    answer: string | number | Record<string, number | string> | null;
  };
  post: {
    answer: string | number | Record<string, number | string> | null;
  };
  artifactCoding?: ArtifactCoding | null;
  coderNotes?: string;
};

export type SurveyItem = {
  id: string;
  questionId?: string;
  label: string;
  questionText?: string;
  answer: string | number | Record<string, number | string> | null;
};

export type StudentRecord = {
  studentId: string;
  name: string;
  /** Bump this string whenever the seed JSON's question set changes, to auto-invalidate stale localStorage caches. */
  _seedVersion?: string;
  comparisons: ComparisonItem[];
  additionalSurveyData?: {
    pre?: SurveyItem[];
    post?: SurveyItem[];
  };
};
