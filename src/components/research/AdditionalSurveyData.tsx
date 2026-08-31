"use client";

import React from "react";
import { SurveyItem } from "@/types/research";

function SurveyAnswerDisplay({
  answer,
  colorClass = "text-zinc-900 dark:text-zinc-200",
}: {
  answer: string | number | Record<string, number | string> | null | undefined;
  colorClass?: string;
}) {
  if (answer === null || answer === undefined || answer === "") {
    return <div className="text-zinc-400 dark:text-zinc-500 italic">—</div>;
  }

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

  return <div className={`whitespace-pre-wrap ${colorClass}`}>{answer}</div>;
}

interface AdditionalSurveyDataProps {
  data?: {
    pre?: SurveyItem[];
    post?: SurveyItem[];
  };
}

export function AdditionalSurveyData({ data }: AdditionalSurveyDataProps) {
  const preItems = data?.pre || [];
  const postItems = data?.post || [];

  if (preItems.length === 0 && postItems.length === 0) {
    return null;
  }

  return (
    <div className="mt-10 rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-6 flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Additional Survey Data
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Non-comparable background, literacy, and context responses (reference only).
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          Context only
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Post-Only Data */}
        {postItems.length > 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Post-Only Data
            </h3>
            <div className="flex flex-col gap-3">
              {postItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
                >
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.label}
                  </div>
                  {item.questionText && (
                    <div className="mt-0.5 text-[11px] italic text-zinc-500 dark:text-zinc-400">
                      {item.questionText}
                    </div>
                  )}
                  <div className="mt-2 text-xs font-medium">
                    <SurveyAnswerDisplay
                      answer={item.answer}
                      colorClass="text-indigo-950 dark:text-indigo-200"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pre-Only Data */}
        {preItems.length > 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Pre-Only Data
            </h3>
            <div className="flex flex-col gap-3">
              {preItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
                >
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.label}
                  </div>
                  {item.questionText && (
                    <div className="mt-0.5 text-[11px] italic text-zinc-500 dark:text-zinc-400">
                      {item.questionText}
                    </div>
                  )}
                  <div className="mt-2 text-xs font-medium">
                    <SurveyAnswerDisplay
                      answer={item.answer}
                      colorClass="text-zinc-900 dark:text-zinc-200"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
