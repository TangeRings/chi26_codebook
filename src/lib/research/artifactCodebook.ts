export const structuralDevelopmentOptions: readonly string[] = [
  "Significant Addition",
  "Moderate Addition",
  "No Change",
  "Moderate Reduction",
  "Significant Reduction",
] as const;

export const semanticCodeOptions: readonly string[] = [
  "Elaborated",
  "Narrowed",
  "Expanded",
  "Reframed",
  "New",
  "Removed",
] as const;

export const learnerAgencyOptions: readonly string[] = [
  "Personal Background",
  "Metacognition",
] as const;

export type StructuralDevelopmentOption = (typeof structuralDevelopmentOptions)[number];
export type SemanticCodeOption = (typeof semanticCodeOptions)[number];
export type LearnerAgencyOption = (typeof learnerAgencyOptions)[number];
