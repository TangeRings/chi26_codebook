import { NextRequest, NextResponse } from "next/server";
import {
  buildArtifactCodingPrompt,
  mapOutputToArtifactCoding,
  parseAiOutput,
  type ArtifactCodingInput,
} from "@/lib/research/artifactCodingPrompt";

const MINIMAX_MESSAGES_URL =
  "https://api.minimaxi.com/anthropic/v1/messages";
const MINIMAX_MODEL = "MiniMax-M3";

type RequestBody = {
  studentId?: unknown;
  itemId?: unknown;
  itemName?: unknown;
  questionText?: unknown;
  preResponse?: unknown;
  postResponse?: unknown;
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

    const input: ArtifactCodingInput = {
      student_id: body.studentId.trim(),
      item_id: body.itemId.trim(),
      item_name: body.itemName.trim(),
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

    let rawText: string;
    try {
      rawText = await callMiniMaxText(prompt);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "MiniMax API request failed.";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    let rawOutput;
    try {
      rawOutput = parseAiOutput(rawText);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid MiniMax output.";
      return NextResponse.json(
        {
          error: message,
          rawResponse: rawText.slice(0, 2000),
        },
        { status: 422 }
      );
    }

    // Ensure identifiers match the requested unit
    if (
      rawOutput.coding_unit.student_id !== input.student_id ||
      rawOutput.coding_unit.item_id !== input.item_id
    ) {
      rawOutput = {
        ...rawOutput,
        coding_unit: {
          student_id: input.student_id,
          item_id: input.item_id,
        },
      };
    }

    if (!rawOutput.model) {
      rawOutput.model = MINIMAX_MODEL;
    }
    if (!rawOutput.coded_at) {
      rawOutput.coded_at = new Date().toISOString();
    }

    const coding = mapOutputToArtifactCoding(rawOutput);

    return NextResponse.json({
      success: true,
      coding,
      rawOutput,
    });
  } catch (err: unknown) {
    console.error("AI code item error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error during AI coding.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
