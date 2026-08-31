"use client";

import React, { useState, useRef, useEffect } from "react";
import { AgencyCode } from "@/types/research";
import { learnerAgencyOptions } from "@/lib/research/artifactCodebook";

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

interface AgencyCodeSelectorProps {
  codes: AgencyCode[];
  onChange: (updatedCodes: AgencyCode[]) => void;
}

export function AgencyCodeSelector({ codes, onChange }: AgencyCodeSelectorProps) {
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
    onChange([...codes, { instanceId: makeId(), code: trimmed, reason: "" }]);
    setIsOpen(false);
    setShowCustomInput(false);
    setCustomInput("");
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddCode(customInput);
  };

  const handleReasonChange = (instanceId: string, reason: string) => {
    onChange(codes.map((c) => (c.instanceId === instanceId ? { ...c, reason } : c)));
  };

  const handleRemove = (instanceId: string) => {
    onChange(codes.filter((c) => c.instanceId !== instanceId));
  };

  return (
    <div className="flex flex-col gap-2 text-xs">
      {codes.map((item) => (
        <div
          key={item.instanceId}
          className="rounded-md border border-emerald-400 bg-emerald-800"
        >
          <div className="flex items-center justify-between px-2.5 pt-2">
            <span className="font-semibold text-emerald-100">
              {item.code}
            </span>
            <button
              type="button"
              onClick={() => handleRemove(item.instanceId)}
              title="Remove this code"
              className="rounded px-1 text-emerald-300 hover:bg-red-700 hover:text-red-100"
            >
              ×
            </button>
          </div>
          <div className="px-2.5 pb-2 pt-1">
            <textarea
              value={item.reason || ""}
              onChange={(e) => handleReasonChange(item.instanceId, e.target.value)}
              placeholder="Reasoning for this code..."
              rows={2}
              className="w-full resize-none rounded border border-emerald-600 bg-emerald-900 px-2 py-1 text-xs leading-relaxed text-emerald-100 placeholder:text-emerald-500 focus:border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-300"
            />
          </div>
        </div>
      ))}

      {/* Add code dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => { setIsOpen(!isOpen); setShowCustomInput(false); setCustomInput(""); }}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-500 bg-slate-700/50 px-2.5 py-1.5 font-medium text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
        >
          + Add agency code
          <span className="text-[10px] opacity-60">▼</span>
        </button>

        {isOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[180px] rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            {learnerAgencyOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleAddCode(opt)}
                className="flex w-full items-center px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-emerald-50 hover:text-emerald-900 dark:text-zinc-200 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-200"
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
                  className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800 focus:border-emerald-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <div className="mt-1 flex gap-1">
                  <button
                    type="submit"
                    className="flex-1 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-emerald-500"
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
