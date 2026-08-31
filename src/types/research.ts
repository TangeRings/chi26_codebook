export type SemanticCode = {
  instanceId: string;
  code: string;
  reason?: string;
};

export type AgencyCode = {
  instanceId: string;
  code: string;
  reason?: string;
};

export type ArtifactCoding = {
  structuralDevelopment?: string | null;
  semanticChanges?: SemanticCode[];
  learnerAgency?: AgencyCode[];
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
