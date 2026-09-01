import { NextRequest, NextResponse } from "next/server";
import {
  applyCriticCorrections,
  buildArtifactCodingPrompt,
  buildCriticInputFromPass1,
  buildCriticPrompt,
  enforceEventConsistency,
  mapOutputToArtifactCoding,
  parseAiOutput,
  parseCriticOutput,
  type ArtifactCodingAiOutput,
  type ArtifactCodingInput,
  type CriticOutput,
} from "@/lib/research/artifactCodingPrompt";

const MINIMAX_MESSAGES_URL =
  "https://api.minimaxi.com/anthropic/v1/messages";
const MINIMAX_MODEL = "MiniMax-M3";

type RequestBody = {
  studentId?: unknown;
  itemId?: unknown;
  itemName?: unknown;
  /** Survey question id (e.g. Q1a, Q1c). Drives item-specific unitization routing. */
  questionId?: unknown;
  questionText?: unknown;
  preResponse?: unknown;
  postResponse?: unknown;
  /** When true, skip the lightweight pass-2 critic. Default: run critic. */
  skipCritic?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function callMiniMaxText(prompt: string): Promise<string> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    throw new Error("MINIMAX_API_KEY is not set in environment");
  }

  const res = await fetch(MINIMAX_MESSAGES_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`MiniMax API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text?.trim() || "";
  if (!text) {
    throw new Error("MiniMax returned an empty response.");
  }
  return text;
}

function normalizeCodingUnit(
  rawOutput: ArtifactCodingAiOutput,
  input: ArtifactCodingInput
): ArtifactCodingAiOutput {
  let next = rawOutput;
  if (
    next.coding_unit.student_id !== input.student_id ||
    next.coding_unit.item_id !== input.item_id
  ) {
    next = {
      ...next,
      coding_unit: {
        student_id: input.student_id,
        item_id: input.item_id,
      },
    };
  }
  if (!next.model) {
    next = { ...next, model: MINIMAX_MODEL };
  }
  if (!next.coded_at) {
    next = { ...next, coded_at: new Date().toISOString() };
  }
  return next;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;

    if (
      !isNonEmptyString(body.studentId) ||
      !isNonEmptyString(body.itemId) ||
      !isNonEmptyString(body.itemName)
    ) {
      return NextResponse.json(
        {
          error:
            "studentId, itemId, and itemName are required non-empty strings.",
        },
        { status: 400 }
      );
    }

    if (!isNonEmptyString(body.preResponse) || !isNonEmptyString(body.postResponse)) {
      return NextResponse.json(
        {
          error:
            "preResponse and postResponse must be non-empty open-text strings. Numeric or missing answers cannot be coded.",
        },
        { status: 400 }
      );
    }

    const skipCritic = body.skipCritic === true;

    const input: ArtifactCodingInput = {
      student_id: body.studentId.trim(),
      item_id: body.itemId.trim(),
      item_name: body.itemName.trim(),
      question_id:
        typeof body.questionId === "string" && body.questionId.trim()
          ? body.questionId.trim()
          : undefined,
      question_text:
        typeof body.questionText === "string" && body.questionText.trim()
          ? body.questionText.trim()
          : undefined,
      pre_response: body.preResponse.trim(),
      post_response: body.postResponse.trim(),
    };

    let prompt: string;
    try {
      prompt = await buildArtifactCodingPrompt(input);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load coding references.";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    let rawTextPass1: string;
    try {
      rawTextPass1 = await callMiniMaxText(prompt);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "MiniMax API request failed.";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    let pass1Output: ArtifactCodingAiOutput;
    try {
      pass1Output = normalizeCodingUnit(parseAiOutput(rawTextPass1), input);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid MiniMax output.";
      return NextResponse.json(
        {
          error: message,
          rawResponse: rawTextPass1.slice(0, 2000),
        },
        { status: 422 }
      );
    }

    let criticOutput: CriticOutput | null = null;
    let criticRawText: string | null = null;
    let finalOutput = pass1Output;

    if (!skipCritic) {
      try {
        const criticInput = buildCriticInputFromPass1(input, pass1Output);
        const criticPrompt = await buildCriticPrompt(criticInput);
        criticRawText = await callMiniMaxText(criticPrompt);
        criticOutput = parseCriticOutput(criticRawText);
        finalOutput = applyCriticCorrections(pass1Output, criticOutput);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Critic pass failed.";
        // Fall back to pass-1 so calibration is not blocked; surface the critic error.
        return NextResponse.json(
          {
            success: true,
            criticFailed: true,
            criticError: message,
            coding: mapOutputToArtifactCoding(
              enforceEventConsistency(pass1Output)
            ),
            rawOutput: enforceEventConsistency(pass1Output),
            pass1Output,
            criticRawResponse: criticRawText?.slice(0, 2000) ?? null,
          },
          { status: 200 }
        );
      }
    }

    finalOutput = enforceEventConsistency(finalOutput);
    const coding = mapOutputToArtifactCoding(finalOutput);

    return NextResponse.json({
      success: true,
      coding,
      rawOutput: finalOutput,
      pass1Output,
      criticOutput,
      skipCritic,
    });
  } catch (err: unknown) {
    console.error("AI code item error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error during AI coding.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
