"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { StudentRecord } from "@/types/research";
import { saveStudentRecord } from "@/lib/firebase/studentService";

interface UploadStudentFormProps {
  onStudentAdded?: (newStudent: StudentRecord) => void;
}

type UploadStep = "idle" | "rendering" | "extracting" | "saving" | "success" | "error";

export function UploadStudentForm({ onStudentAdded }: UploadStudentFormProps) {
  const [preFile, setPreFile] = useState<File | null>(null);
  const [postFile, setPostFile] = useState<File | null>(null);
  const [step, setStep] = useState<UploadStep>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdStudent, setCreatedStudent] = useState<StudentRecord | null>(null);

  const preInputRef = useRef<HTMLInputElement>(null);
  const postInputRef = useRef<HTMLInputElement>(null);

  const isProcessing = step === "rendering" || step === "extracting" || step === "saving";

  const handleReset = () => {
    setPreFile(null);
    setPostFile(null);
    setStep("idle");
    setErrorMessage(null);
    setCreatedStudent(null);
    if (preInputRef.current) preInputRef.current.value = "";
    if (postInputRef.current) postInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preFile || !postFile) {
      setErrorMessage("Please select both a Pre-Survey PDF and a Post-Survey PDF.");
      setStep("error");
      return;
    }

    setErrorMessage(null);
    setCreatedStudent(null);
    setStep("rendering");

    try {
      const formData = new FormData();
      formData.append("prePdf", preFile);
      formData.append("postPdf", postFile);

      setStep("extracting");
      const res = await fetch("/api/extract-student", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to extract survey data from PDFs.");
      }

      const student: StudentRecord = data.student;

      setStep("saving");
      await saveStudentRecord(student);

      setCreatedStudent(student);
      setStep("success");

      if (onStudentAdded) {
        onStudentAdded(student);
      }
    } catch (err: unknown) {
      console.error("Upload error:", err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(message);
      setStep("error");
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
          Add New Student from PDFs
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Upload a student’s Pre-Survey and Post-Survey PDF exports. MiniMax M3 vision will verify the student identity, extract all responses and slider scores, and auto-create their coding workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Pre-Survey PDF */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              1. Pre-Survey PDF <span className="text-indigo-600 dark:text-indigo-400">*</span>
            </label>
            <div className="relative flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50/60 p-4 transition hover:bg-zinc-100/60 dark:border-zinc-700 dark:bg-zinc-800/40 dark:hover:bg-zinc-800">
              <input
                ref={preInputRef}
                type="file"
                accept=".pdf,application/pdf"
                disabled={isProcessing}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setPreFile(file);
                  if (step === "error") setStep("idle");
                }}
                className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
              <div className="flex flex-col items-center text-center">
                <span className="text-lg">📄</span>
                <span className="mt-1 text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate max-w-[200px]">
                  {preFile ? preFile.name : "Choose Pre-Survey PDF"}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {preFile ? `${(preFile.size / 1024).toFixed(1)} KB` : "Click or drag file here"}
                </span>
              </div>
            </div>
          </div>

          {/* Post-Survey PDF */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              2. Post-Survey PDF <span className="text-indigo-600 dark:text-indigo-400">*</span>
            </label>
            <div className="relative flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50/60 p-4 transition hover:bg-zinc-100/60 dark:border-zinc-700 dark:bg-zinc-800/40 dark:hover:bg-zinc-800">
              <input
                ref={postInputRef}
                type="file"
                accept=".pdf,application/pdf"
                disabled={isProcessing}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setPostFile(file);
                  if (step === "error") setStep("idle");
                }}
                className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
              <div className="flex flex-col items-center text-center">
                <span className="text-lg">📑</span>
                <span className="mt-1 text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate max-w-[200px]">
                  {postFile ? postFile.name : "Choose Post-Survey PDF"}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {postFile ? `${(postFile.size / 1024).toFixed(1)} KB` : "Click or drag file here"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button & Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isProcessing || !preFile || !postFile}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>
                    {step === "rendering" && "Rendering PDF Pages…"}
                    {step === "extracting" && "MiniMax M3 Extracting & Validating…"}
                    {step === "saving" && "Saving to Firestore…"}
                  </span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Extract & Create Student Page</span>
                </>
              )}
            </button>

            {(preFile || postFile) && !isProcessing && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Clear
              </button>
            )}
          </div>

          <span className="text-[11px] text-zinc-400">
            Powered by MiniMax-M3 Vision API
          </span>
        </div>
      </form>

      {/* Error Alert */}
      {step === "error" && errorMessage && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/40">
          <div className="flex items-start gap-2.5">
            <span className="text-base text-red-600 dark:text-red-400">⚠️</span>
            <div>
              <h4 className="text-xs font-bold text-red-900 dark:text-red-200">
                Validation / Extraction Error
              </h4>
              <p className="mt-0.5 text-xs text-red-700 dark:text-red-300">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {step === "success" && createdStudent && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🎉</span>
              <div>
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
                  Student workspace created for {createdStudent.name}!
                </h4>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  All survey comparisons & scale scores successfully extracted and stored in Firestore.
                </p>
              </div>
            </div>
            <Link
              href={`/students/${createdStudent.studentId}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-500"
            >
              <span>Open Coding Workspace</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
