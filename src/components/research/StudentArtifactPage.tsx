"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { StudentRecord, ComparisonItem } from "@/types/research";
import { getStudent, updateComparisons, saveStudentRecord, resetStudentToSeed } from "@/lib/firebase/studentService";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { ArtifactComparisonTable } from "./ArtifactComparisonTable";
import { AdditionalSurveyData } from "./AdditionalSurveyData";

interface StudentArtifactPageProps {
  studentId: string;
}

export function StudentArtifactPage({ studentId }: StudentArtifactPageProps) {
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [comparisons, setComparisons] = useState<ComparisonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "unsaved" | "saving" | "saved" | "error">("idle");
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Load student on mount or when studentId changes
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getStudent(studentId);
        if (!isCancelled) {
          if (data) {
            setStudent(data);
            setComparisons(data.comparisons || []);
            setSaveStatus("idle");
          } else {
            setError(`Student "${studentId}" not found in Firestore or registered local seed data.`);
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Failed to load student record.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
          isInitialMount.current = false;
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [studentId]);

  // Debounced auto-save function
  const performSave = useCallback(
    async (itemsToSave: ComparisonItem[]) => {
      setSaveStatus("saving");
      try {
        await updateComparisons(studentId, itemsToSave);
        setSaveStatus("saved");
        setLastSavedTime(new Date());
      } catch (err) {
        console.error("Auto-save error:", err);
        setSaveStatus("error");
      }
    },
    [studentId]
  );

  // Handle single item update
  const handleUpdateItem = useCallback(
    (itemId: string, patch: Partial<ComparisonItem>) => {
      setComparisons((prev) => {
        const updated = prev.map((item) =>
          item.id === itemId ? { ...item, ...patch } : item
        );

        setSaveStatus("unsaved");

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          performSave(updated);
        }, 800);

        return updated;
      });
    },
    [performSave]
  );

  // Manual save trigger
  const handleManualSave = async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    await performSave(comparisons);
  };

  // Reset to default seed data (useful for dev/testing)
  const handleResetMock = async () => {
    if (confirm("Reset this student to initial seed data?")) {
      setLoading(true);
      const seeded = await resetStudentToSeed(studentId);
      if (seeded) {
        setStudent(seeded);
        setComparisons(seeded.comparisons);
        setSaveStatus("saved");
        setLastSavedTime(new Date());
      }
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="text-sm text-zinc-500">Loading student coding data...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <h2 className="text-lg font-bold">Student Not Found</h2>
          <p className="mt-2 text-sm">{error || "No record available."}</p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleResetMock}
              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
            >
              Seed "{studentId}" with Default Data
            </button>
            <a
              href="/"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header */}
      <header className="mb-6 flex flex-col gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {student.name}
            </h1>
            <span className="rounded-md bg-indigo-50 px-2 py-1 font-mono text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/20 dark:bg-indigo-950/60 dark:text-indigo-300">
              ID: {student.studentId}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Qualitative Artifact Comparison & Codebook Annotation
          </p>
        </div>

        {/* Save Status & Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Firestore Connection status */}
          <span
            title={
              isFirebaseConfigured
                ? "Connected to Firestore"
                : "Using local mock/storage (add Firebase keys to .env.local for cloud sync)"
            }
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
              isFirebaseConfigured
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-amber-50 text-amber-800 ring-1 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isFirebaseConfigured ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {isFirebaseConfigured ? "Firestore Live" : "Local Dev Mode"}
          </span>

          {/* Auto-save badge */}
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            {saveStatus === "saving" && (
              <>
                <span className="h-2 w-2 animate-ping rounded-full bg-indigo-500" />
                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                  Saving...
                </span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">✓</span>
                <span className="text-zinc-600 dark:text-zinc-300">
                  Saved {lastSavedTime ? `at ${lastSavedTime.toLocaleTimeString()}` : ""}
                </span>
              </>
            )}
            {saveStatus === "unsaved" && (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-amber-600 dark:text-amber-400">Unsaved changes...</span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <span className="font-bold text-red-600">⚠</span>
                <span className="text-red-600">Save failed</span>
              </>
            )}
            {saveStatus === "idle" && (
              <span className="text-zinc-400">Ready</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleManualSave}
            disabled={saveStatus === "saving"}
            className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            Save now
          </button>

          <button
            type="button"
            onClick={handleResetMock}
            title="Reset to seed data"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Reset Seed Data
          </button>
        </div>
      </header>

      {/* Main Artifact Comparison Table */}
      <main>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Comparable Pre vs Post Survey Items ({comparisons.length})
          </h2>
          <span className="text-xs text-zinc-400">
            Changes auto-save automatically
          </span>
        </div>

        <ArtifactComparisonTable
          items={comparisons}
          studentId={studentId}
          onUpdateItem={handleUpdateItem}
        />

        {/* Additional Non-Comparable Survey Data (Post-only, Pre-only) */}
        <AdditionalSurveyData data={student.additionalSurveyData} />
      </main>
    </div>
  );
}
