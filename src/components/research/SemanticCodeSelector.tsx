"use client";

import React, { useState, useRef, useEffect } from "react";
import { SemanticCode } from "@/types/research";
import { semanticCodeOptions } from "@/lib/research/artifactCodebook";

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

interface SemanticCodeSelectorProps {
  codes: SemanticCode[];
  onChange: (updatedCodes: SemanticCode[]) => void;
}

export function SemanticCodeSelector({ codes, onChange }: SemanticCodeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowCustomInput(false);
        setCustomInput("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showCustomInput && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [showCustomInput]);

  const handleAddCode = (codeName: string) => {
    const trimmed = codeName.trim();
    if (!trimmed) return;
    onChange([...codes, { instanceId: makeId(), code: trimmed }]);
    setIsOpen(false);
    setShowCustomInput(false);
    setCustomInput("");
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddCode(customInput);
  };

  const patchCode = (instanceId: string, patch: Partial<SemanticCode>) => {
    onChange(codes.map((c) => (c.instanceId === instanceId ? { ...c, ...patch } : c)));
  };

  const handleRemove = (instanceId: string) => {
    onChange(codes.filter((c) => c.instanceId !== instanceId));
  };

  return (
    <div className="flex flex-col gap-2 text-xs">
      {codes.map((item) => (
        <div
          key={item.instanceId}
          className="rounded-md border border-indigo-400 bg-indigo-800"
        >
          <div className="flex items-center justify-between px-2.5 pt-2">
            <span className="font-semibold text-indigo-100">
              {item.code}
            </span>
            <button
              type="button"
              onClick={() => handleRemove(item.instanceId)}
              title="Remove this code"
              className="rounded px-1 text-indigo-300 hover:bg-red-700 hover:text-red-100"
            >
              ×
            </button>
          </div>

          {(item.preEvidence || item.postEvidence) && (
            <div className="space-y-1 px-2.5 pt-1">
              {item.preEvidence != null && item.preEvidence !== "" && (
                <div className="rounded border border-indigo-600/70 bg-indigo-950/50 px-2 py-1 text-[10px] leading-relaxed text-indigo-200">
                  <span className="mr-1 font-bold uppercase tracking-wider text-indigo-400">
                    PRE
                  </span>
                  “{item.preEvidence}”
                </div>
              )}
              {item.postEvidence != null && item.postEvidence !== "" && (
                <div className="rounded border border-indigo-600/70 bg-indigo-950/50 px-2 py-1 text-[10px] leading-relaxed text-indigo-200">
                  <span className="mr-1 font-bold uppercase tracking-wider text-indigo-400">
                    POST
                  </span>
                  “{item.postEvidence}”
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5 px-2.5 pb-2 pt-1">
            {(item.rationale !== undefined || item.preEvidence || item.postEvidence) && (
              <div>
                <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-indigo-400">
                  Rationale
                </label>
                <textarea
                  value={item.rationale || ""}
                  onChange={(e) => patchCode(item.instanceId, { rationale: e.target.value })}
                  placeholder="Coding rationale..."
                  rows={2}
                  className="w-full resize-none rounded border border-indigo-600 bg-indigo-900 px-2 py-1 text-xs leading-relaxed text-indigo-100 placeholder:text-indigo-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                />
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Add code dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => { setIsOpen(!isOpen); setShowCustomInput(false); setCustomInput(""); }}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-500 bg-slate-700/50 px-2.5 py-1.5 font-medium text-slate-300 transition hover:border-indigo-400 hover:text-indigo-300"
        >
          + Add semantic code
          <span className="text-[10px] opacity-60">▼</span>
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 z-20 mb-1 min-w-[180px] rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            {semanticCodeOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleAddCode(opt)}
                className="flex w-full items-center px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-indigo-50 hover:text-indigo-900 dark:text-zinc-200 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-200"
              >
                {opt}
              </button>
            ))}
            {/* Divider */}
            <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />
            {!showCustomInput ? (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <span className="font-semibold">+</span> Custom code…
              </button>
            ) : (
              <form onSubmit={handleCustomSubmit} className="px-2 py-1.5">
                <input
                  ref={customInputRef}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Type code name…"
                  className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800 focus:border-indigo-400 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <div className="mt-1 flex gap-1">
                  <button
                    type="submit"
                    className="flex-1 rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-indigo-500"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCustomInput(false); setCustomInput(""); }}
                    className="flex-1 rounded border border-zinc-200 bg-white px-2 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
