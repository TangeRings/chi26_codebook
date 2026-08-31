"use client";

import React from "react";
import { ArtifactCoding, SemanticCode, AgencyCode } from "@/types/research";
import { structuralDevelopmentOptions } from "@/lib/research/artifactCodebook";
import { SemanticCodeSelector } from "./SemanticCodeSelector";
import { AgencyCodeSelector } from "./AgencyCodeSelector";

interface ArtifactCodingCellProps {
  coding: ArtifactCoding | null | undefined;
  onChange: (updatedCoding: ArtifactCoding) => void;
}

export function ArtifactCodingCell({
  coding,
  onChange,
}: ArtifactCodingCellProps) {
  const currentStructural = coding?.structuralDevelopment ?? "";
  const semanticChanges: SemanticCode[] = coding?.semanticChanges ?? [];
  const learnerAgency: AgencyCode[] = coding?.learnerAgency ?? [];

  const handleStructuralChange = (value: string) => {
    onChange({
      structuralDevelopment: value || null,
      semanticChanges,
      learnerAgency,
    });
  };

  const handleSemanticChange = (updatedSemantic: SemanticCode[]) => {
    onChange({
      structuralDevelopment: currentStructural || null,
      semanticChanges: updatedSemantic,
      learnerAgency,
    });
  };

  const handleAgencyChange = (updatedAgency: AgencyCode[]) => {
    onChange({
      structuralDevelopment: currentStructural || null,
      semanticChanges,
      learnerAgency: updatedAgency,
    });
  };

  return (
    <div className="flex flex-col gap-2.5 text-xs">
      {/* 1. Structural Development */}
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-300">
          Structural Development
        </label>
        <select
          value={currentStructural}
          onChange={(e) => handleStructuralChange(e.target.value)}
          className="w-full rounded-md border border-slate-500 bg-slate-700 px-2.5 py-1.5 text-xs text-slate-100 shadow-xs focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          <option value="">-- Select Structural Code --</option>
          {structuralDevelopmentOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Semantic Changes */}
      <div className="border-t border-slate-600 pt-2">
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-300">
          Semantic Changes
        </label>
        <SemanticCodeSelector
          codes={semanticChanges}
          onChange={handleSemanticChange}
        />
      </div>

      {/* 3. Learner Agency / Metacognition */}
      <div className="border-t border-slate-600 pt-2">
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-300">
          Learner Agency / Metacognition
        </label>
        <AgencyCodeSelector
          codes={learnerAgency}
          onChange={handleAgencyChange}
        />
      </div>
    </div>
  );
}
