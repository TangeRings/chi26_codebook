"use client";

import React, { useRef, useEffect, useState } from "react";
import { ArtifactCoding, SemanticCode, AgencyCode } from "@/types/research";
import { structuralDevelopmentOptions } from "@/lib/research/artifactCodebook";
import { SemanticCodeSelector } from "./SemanticCodeSelector";
import { AgencyCodeSelector } from "./AgencyCodeSelector";

const CUSTOM_SENTINEL = "__custom__";

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
  const structuralRationale = coding?.structuralRationale;
  const uncertainty = coding?.uncertainty;

  const isPreset = !currentStructural || (structuralDevelopmentOptions as readonly string[]).includes(currentStructural);
  const [showCustomInput, setShowCustomInput] = useState(!isPreset);
  const [customDraft, setCustomDraft] = useState(!isPreset ? currentStructural : "");
  const customInputRef = useRef<HTMLInputElement>(null);

  // Keep custom-input UI in sync when AI draft replaces the coding prop
  useEffect(() => {
    const preset =
      !currentStructural ||
      (structuralDevelopmentOptions as readonly string[]).includes(currentStructural);
    setShowCustomInput(!preset);
    setCustomDraft(!preset ? currentStructural : "");
  }, [currentStructural]);

  useEffect(() => {
    if (showCustomInput && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [showCustomInput]);

  const emit = (patch: Partial<ArtifactCoding>) => {
    onChange({
      structuralDevelopment: currentStructural || null,
      structuralRationale,
      semanticChanges,
      learnerAgency,
      uncertainty,
      ...patch,
    });
  };

  const handleStructuralChange = (value: string) => {
    emit({
      structuralDevelopment: value || null,
      structuralRationale: value === currentStructural ? structuralRationale : undefined,
    });
  };

  const handleSelectChange = (value: string) => {
    if (value === CUSTOM_SENTINEL) {
      setShowCustomInput(true);
      setCustomDraft("");
    } else {
      setShowCustomInput(false);
      handleStructuralChange(value);
    }
  };

  const handleCustomConfirm = () => {
    const trimmed = customDraft.trim();
    if (trimmed) handleStructuralChange(trimmed);
    else setShowCustomInput(false);
  };

  const handleSemanticChange = (updatedSemantic: SemanticCode[]) => {
    emit({ semanticChanges: updatedSemantic });
  };

  const handleAgencyChange = (updatedAgency: AgencyCode[]) => {
    emit({ learnerAgency: updatedAgency });
  };

  return (
    <div className="flex flex-col gap-2.5 text-xs">
      {/* 1. Structural Development */}
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-300">
          Structural Development
        </label>
        {showCustomInput ? (
          <div className="flex gap-1.5">
            <input
              ref={customInputRef}
              value={customDraft}
              onChange={(e) => setCustomDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleCustomConfirm(); }
                if (e.key === "Escape") { setShowCustomInput(false); setCustomDraft(""); }
              }}
              placeholder="Type new structural code…"
              className="min-w-0 flex-1 rounded-md border border-indigo-400 bg-slate-700 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            />
            <button
              type="button"
              onClick={handleCustomConfirm}
              className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-indigo-500"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCustomInput(false);
                setCustomDraft("");
                if (!isPreset) handleStructuralChange("");
              }}
              className="rounded-md border border-slate-500 bg-slate-700 px-2 py-1.5 text-[10px] text-slate-300 hover:bg-slate-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <select
            value={currentStructural}
            onChange={(e) => handleSelectChange(e.target.value)}
            className="w-full rounded-md border border-slate-500 bg-slate-700 px-2.5 py-1.5 text-xs text-slate-100 shadow-xs focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            <option value="">-- Select Structural Code --</option>
            {structuralDevelopmentOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            <option disabled className="text-slate-400">──────────</option>
            <option value={CUSTOM_SENTINEL}>+ Add new code…</option>
          </select>
        )}
        {structuralRationale && (
          <p className="mt-1.5 rounded border border-slate-600 bg-slate-900/40 px-2 py-1 text-[10px] leading-relaxed text-slate-300">
            {structuralRationale}
          </p>
        )}
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
