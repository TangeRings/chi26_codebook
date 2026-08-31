"use client";

import React from "react";
import { ComparisonItem } from "@/types/research";
import { ArtifactComparisonRow } from "./ArtifactComparisonRow";

interface ArtifactComparisonTableProps {
  items: ComparisonItem[];
  onUpdateItem: (itemId: string, patch: Partial<ComparisonItem>) => void;
}

export function ArtifactComparisonTable({
  items,
  onUpdateItem,
}: ArtifactComparisonTableProps) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        No comparable survey items found for this student.
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-zinc-300 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] table-fixed border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-zinc-300 text-[11px] font-bold uppercase tracking-wider dark:border-zinc-700">
              {/* Item */}
              <th scope="col" className="w-[12%] bg-zinc-100 p-4 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                Item
              </th>
              {/* Pre-Survey — sky blue */}
              <th scope="col" className="w-[25%] border-l-2 border-sky-200 bg-sky-50 p-4 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-400">
                Pre-Survey
              </th>
              {/* Post-Survey — violet */}
              <th scope="col" className="w-[25%] border-l-2 border-violet-200 bg-violet-50 p-4 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-400">
                Post-Survey
              </th>
              {/* Artifact Coding — dark slate */}
              <th scope="col" className="w-[23%] border-l-2 border-slate-600 bg-slate-800 p-4 text-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                Artifact Coding
              </th>
              {/* Coder Notes — neutral */}
              <th scope="col" className="w-[15%] border-l-2 border-zinc-200 bg-zinc-50 p-4 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                Coder Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <ArtifactComparisonRow
                key={item.id}
                item={item}
                rowIndex={idx}
                onUpdate={onUpdateItem}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
