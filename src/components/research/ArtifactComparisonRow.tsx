"use client";

import React, { useState, useRef, useEffect } from "react";
import { ComparisonItem, ArtifactCoding } from "@/types/research";
import { ArtifactCodingCell } from "./ArtifactCodingCell";

/** Displays a pre/post answer. When null, shows an inline editable input so researchers can fill in scores. */
function AnswerDisplay({
  answer,
  onChange,
}: {
  answer: string | number | Record<string, number | string> | null;
  onChange: (val: string | number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  if (answer !== null && answer !== undefined && answer !== "") {
    if (typeof answer === "object" && !Array.isArray(answer)) {
      return (
        <ul className="space-y-1 text-xs leading-relaxed">
          {Object.entries(answer).map(([key, val]) => (
            <li key={key} className="flex items-start gap-1.5">
              <span className="text-zinc-400 dark:text-zinc-500 select-none">•</span>
              <span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{key}:</span>{" "}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{val}</span>
              </span>
            </li>
          ))}
        </ul>
      );
    }
    return <div className="whitespace-pre-wrap leading-relaxed">{answer}</div>;
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setDraft(""); setEditing(true); }}
        className="italic text-zinc-400 hover:text-indigo-500 dark:text-zinc-500 dark:hover:text-indigo-400 text-left"
        title="Click to enter value"
      >
        (not entered — click to add)
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = draft.trim();
        if (!trimmed) { setEditing(false); return; }
        const num = Number(trimmed);
        onChange(isNaN(num) ? trimmed : num);
        setEditing(false);
      }}
      className="flex items-center gap-1"
    >
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Enter value…"
        className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800 focus:border-indigo-400 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      />
      <button type="submit" className="shrink-0 rounded bg-indigo-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-indigo-500">
        ✓
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="shrink-0 rounded border border-zinc-200 bg-white px-2 py-1 text-[10px] text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
      >
        ✕
      </button>
    </form>
  );
}

interface ArtifactComparisonRowProps {
  item: ComparisonItem;
  studentId?: string;
  rowIndex?: number;
  onUpdate: (itemId: string, patch: Partial<ComparisonItem>) => void;
}

export function ArtifactComparisonRow({
  item,
  rowIndex = 0,
  onUpdate,
}: ArtifactComparisonRowProps) {
  const [showQuestionText, setShowQuestionText] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(
        textareaRef.current.scrollHeight,
        72
      )}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [item.coderNotes]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(item.id, { coderNotes: e.target.value });
    adjustTextareaHeight();
  };

  const handleCodingChange = (updatedCoding: ArtifactCoding) => {
    onUpdate(item.id, { artifactCoding: updatedCoding });
  };

  const isEven = rowIndex % 2 === 0;
  const rowBg = isEven
    ? "bg-white dark:bg-zinc-950"
    : "bg-zinc-50/60 dark:bg-zinc-900/40";

  return (
    <tr className={`border-b border-zinc-200 transition-colors hover:brightness-[0.97] dark:border-zinc-800 ${rowBg}`}>
      {/* 1. Item Column (~12%) */}
      <td className="w-[12%] align-top p-4 text-xs">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
            {item.questionId}
          </span>
          <span className="font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
            {item.label}
          </span>

          {item.questionText && (
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setShowQuestionText(!showQuestionText)}
                className="inline-flex items-center gap-1 rounded text-[11px] text-zinc-400 hover:text-indigo-600 dark:text-zinc-500 dark:hover:text-indigo-400"
                title="Toggle full survey question"
              >
                <span className="text-[10px]">ℹ</span>
                <span className="underline underline-offset-2">
                  {showQuestionText ? "Hide prompt" : "Show prompt"}
                </span>
              </button>

              {showQuestionText && (
                <div className="mt-1.5 rounded-md border border-zinc-200 bg-zinc-50 p-2 text-[11px] italic leading-relaxed text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  {item.questionText}
                </div>
              )}
            </div>
          )}
        </div>
      </td>

      {/* 2. Pre Column (~25%) — sky blue tint */}
      <td className="w-[25%] align-top border-l-2 border-sky-100 p-3 text-xs text-zinc-800 dark:border-sky-900/40 dark:text-zinc-200">
        <div className="rounded-lg border border-sky-200/80 bg-sky-50/70 p-3 dark:border-sky-900/50 dark:bg-sky-950/25">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Pre-Survey
          </div>
          <AnswerDisplay
            answer={item.pre.answer}
            onChange={(val) => onUpdate(item.id, { pre: { answer: val } })}
          />
        </div>
      </td>

      {/* 3. Post Column (~25%) — violet tint */}
      <td className="w-[25%] align-top border-l-2 border-violet-100 p-3 text-xs text-zinc-800 dark:border-violet-900/40 dark:text-zinc-200">
        <div className="rounded-lg border border-violet-200/80 bg-violet-50/60 p-3 dark:border-violet-900/50 dark:bg-violet-950/25">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            Post-Survey
          </div>
          <AnswerDisplay
            answer={item.post.answer}
            onChange={(val) => onUpdate(item.id, { post: { answer: val } })}
          />
        </div>
      </td>

      {/* 4. Artifact Coding Cell (~23%) — dark slate */}
      <td className="w-[23%] align-top border-l-2 border-slate-700 bg-slate-800 p-3 dark:border-slate-600 dark:bg-slate-900">
        <div className="rounded-lg border border-slate-600/60 bg-slate-700/50 p-2 dark:border-slate-600/40 dark:bg-slate-800/60">
          <ArtifactCodingCell
            coding={item.artifactCoding}
            onChange={handleCodingChange}
          />
        </div>
      </td>

      {/* 5. Coder Notes (~15%) */}
      <td className="w-[15%] align-top border-l-2 border-zinc-200 p-3 dark:border-zinc-700">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Coder Notes
          </label>
          <textarea
            ref={textareaRef}
            value={item.coderNotes || ""}
            onChange={handleNotesChange}
            placeholder="Add reconciliation notes, rationale, or code distinctions..."
            className="w-full resize-none rounded-md border border-zinc-300 bg-white p-2 text-xs leading-relaxed text-zinc-900 shadow-xs placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-indigo-400"
            rows={3}
          />
        </div>
      </td>
    </tr>
  );
}
