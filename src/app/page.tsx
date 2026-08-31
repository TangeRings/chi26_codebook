"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { StudentRecord } from "@/types/research";
import { listStudents } from "@/lib/firebase/studentService";
import { UploadStudentForm } from "@/components/research/UploadStudentForm";

export default function Home() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const list = await listStudents();
      setStudents(list);
    } catch (err) {
      console.error("Failed to load student workspaces:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleStudentAdded = (newStudent: StudentRecord) => {
    setStudents((prev) => {
      const exists = prev.some(
        (s) => s.studentId.toLowerCase() === newStudent.studentId.toLowerCase()
      );
      if (exists) {
        return prev.map((s) =>
          s.studentId.toLowerCase() === newStudent.studentId.toLowerCase() ? newStudent : s
        );
      }
      return [...prev, newStudent];
    });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-12">
        {/* Header Header */}
        <div className="mb-8">
          <span className="rounded-full bg-indigo-50 px-3 py-1 font-mono text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/20 dark:bg-indigo-950/60 dark:text-indigo-300">
            CHI 2026 Research Tool
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Artifact Coding & Comparison Interface
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Qualitative research platform for comparing student pre-survey and post-survey artifacts, assigning structural & semantic codes, and annotating learner agency.
          </p>
        </div>

        {/* Active Student Workspaces Section */}
        <div className="mb-8 rounded-xl border border-zinc-200 bg-zinc-50/70 p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Active Student Workspaces ({students.length})
            </h2>
            <button
              type="button"
              onClick={fetchStudents}
              className="text-[11px] text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              title="Refresh list"
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-xs text-zinc-400">
              <span className="inline-block h-4 w-4 mr-2 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              Loading workspaces…
            </div>
          ) : students.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              No students added yet. Upload a pre-survey and post-survey PDF below to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {students.map((student) => {
                const comparisonCount = student.comparisons?.length || 0;
                const codedCount =
                  student.comparisons?.filter(
                    (c) =>
                      c.artifactCoding?.structuralDevelopment ||
                      (c.artifactCoding?.semanticChanges && c.artifactCoding.semanticChanges.length > 0) ||
                      (c.artifactCoding?.learnerAgency && c.artifactCoding.learnerAgency.length > 0) ||
                      (c.coderNotes && c.coderNotes.trim().length > 0)
                  ).length || 0;

                return (
                  <Link
                    key={student.studentId}
                    href={`/students/${student.studentId}`}
                    className="group flex flex-col justify-between rounded-lg border border-zinc-200 bg-white p-4 shadow-2xs transition hover:border-indigo-400 hover:shadow-xs dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-indigo-500"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
                          {student.name}
                        </div>
                        <span className="font-mono text-[11px] text-zinc-400">
                          {student.studentId}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {comparisonCount} comparison items
                        {codedCount > 0 && (
                          <span className="ml-2 inline-flex items-center text-emerald-600 dark:text-emerald-400">
                            • {codedCount} coded
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-end">
                      <span className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-indigo-500">
                        Open Coding →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Upload Form Component */}
        <UploadStudentForm onStudentAdded={handleStudentAdded} />

        {/* Footer Navigation */}
        <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            Quick Navigation:
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Any student ID can also be loaded directly at{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              /students/[studentId]
            </code>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
