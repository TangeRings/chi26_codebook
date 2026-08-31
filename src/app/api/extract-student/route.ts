import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import { StudentRecord, ComparisonItem, SurveyItem } from "@/types/research";
import {
  COMPARISON_QUESTIONS,
  PRE_SURVEY_ADDITIONAL_QUESTIONS,
  POST_SURVEY_ADDITIONAL_QUESTIONS,
} from "@/lib/research/surveyTemplate";

const execFileAsync = promisify(execFile);

// Helper to find Python binary
function getPythonBinary(): string {
  const venvPython = "/tmp/mmenv/bin/python3";
  return venvPython;
}

// Convert a single PDF file buffer to array of base64 PNGs via render_pdf.py
async function pdfToPngBase64(pdfBuffer: Buffer, fileName: string, dpi = 120): Promise<string[]> {
  const tmpDir = await fs.mkdtemp(path.join(/*turbopackIgnore: true*/ os.tmpdir(), "pdf-extract-"));
  const tmpPdfPath = path.join(/*turbopackIgnore: true*/ tmpDir, fileName || "input.pdf");
  const scriptPath = path.join(process.cwd(), "scripts", "render_pdf.py");

  try {
    await fs.writeFile(tmpPdfPath, pdfBuffer);

    let pythonBin = getPythonBinary();
    try {
      await fs.access(pythonBin);
    } catch {
      pythonBin = "python3";
    }

    const { stdout } = await execFileAsync(pythonBin, [scriptPath, tmpPdfPath, String(dpi)], {
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
    });

    const parsed = JSON.parse(stdout);
    if (parsed.error) {
      throw new Error(`PDF rendering error: ${parsed.error}`);
    }
    return parsed.pages as string[];
  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }
}

// Call MiniMax M3 Vision API with base64 image pages
async function callMiniMaxVision(
  pagesB64: string[],
  expectedType: "pre" | "post"
): Promise<Record<string, unknown>> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    throw new Error("MINIMAX_API_KEY is not set in environment");
  }

  const content: Array<
    | { type: "image"; source: { type: "base64"; media_type: "image/png"; data: string } }
    | { type: "text"; text: string }
  > = [];

  for (let i = 0; i < pagesB64.length; i++) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: pagesB64[i],
      },
    });
    content.push({
      type: "text",
      text: `[Page ${i + 1}]`,
    });
  }

  const prompt = `You are a precision research data extraction assistant. You are analyzing a Google Form survey response PDF for the ${expectedType.toUpperCase()} survey.

IMPORTANT INSTRUCTIONS:
1. Extract the respondent's exact NAME from the "Your Name" or "Name" field on Page 1.
2. Determine if this document is a "pre" survey (e.g. "Initial Brand Concept Development") or "post" survey (e.g. "2nd Brand Concept Development").
3. For Likert / scale questions (1-10 or 1-5): Look closely at the filled/dark circle among the radio buttons to determine the exact number selected.
4. For Q1 Brand Concept Description: Parse and separate Brand Identity, Brand Vision, and Core Values.
5. For Q4.2 (Influence grid): Extract each row's rating (0 to 4) as an object { "Passion/Interest": number, ... }.
6. For text questions: Return the exact written response.

Return ONLY a valid JSON object with these exact keys:
{
  "studentName": "<Full name from the form>",
  "surveyType": "<pre or post>",
  ${
    expectedType === "pre"
      ? `
  "pre1_priorExperience": "<text>",
  "pre2_personalBrandConfidence": <number 1-10>,
  "pre3_senseOfControl": <number 1-10>,
  "pre4_independentConfidence": <number 1-10>,
  "q1a_brandIdentity": "<text>",
  "q1b_brandVision": "<text>",
  "q1c_coreValues": "<text>",
  "q1_1_brandConceptConfidence": <number 1-10>,
  "q2_targetCustomer": "<text>",
  "q2_1_targetCustomerConfidence": <number 1-10>,
  "q2_2_niche": "<text>",
  "q3_platforms": "<text>",
  "q3_3_contentStrategy": "<text>",
  "q4_productOfferings": "<text>",
  "q4_1_productOfferingsConfidence": <number 1-10>,
  "q4_2_influences": {
    "Passion/Interest": <0-4>,
    "Familiarity/Market Understanding": <0-4>,
    "Business Potential (Profit and Market Demand)": <0-4>,
    "Alignment with Personal Values": <0-4>,
    "Curiosity and Learning Opportunity": <0-4>,
    "Consumer trends, social media trends, peer trends": <0-4>,
    "Other": <0-4>
  },
  "q4_2_other": "<text if specified, or empty string>"`
      : `
  "post1_aiPromptingSkills": <number 1-10>,
  "post1_1_aiUsageFrequency": "<text option selected>",
  "post1_2_priorAiTraining": "<text>",
  "q1a_brandIdentity": "<text>",
  "q1b_brandVision": "<text>",
  "q1c_coreValues": "<text>",
  "q1_1_brandConceptConfidence": <number 1-10>,
  "q2_targetCustomer": "<text>",
  "q2_1_targetCustomerConfidence": <number 1-10>,
  "q2_2_niche": "<text>",
  "q3_platforms": "<text>",
  "q3_3_contentStrategy": "<text>",
  "q4_productOfferings": "<text>",
  "q4_1_productOfferingsConfidence": <number 1-10>,
  "q4_2_influences": {
    "Passion/Interest": <0-4>,
    "Familiarity/Market Understanding": <0-4>,
    "Business Potential (Profit and Market Demand)": <0-4>,
    "Alignment with Personal Values": <0-4>,
    "Curiosity and Learning Opportunity": <0-4>,
    "Consumer trends, social media trends, peer trends": <0-4>,
    "Other": <0-4>
  },
  "q4_2_other": "<text if specified, or empty string>",
  "q5_1_aiImpact": <number 1-10>,
  "q5_2_helpfulAspects": "<text>",
  "q5_3_challenges": "<text>",
  "q5_4_examplePrompts": <number 1-10>,
  "post2_personalBrandConfidence": <number 1-5 or 1-10>,
  "post3_independentConfidence": <number 1-5 or 1-10>`
  }
}

Do not include markdown fences or any other text, only the raw JSON object.`;

  content.push({
    type: "text",
    text: prompt,
  });

  const res = await fetch("https://api.minimaxi.com/anthropic/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "MiniMax-M3",
      max_tokens: 4096,
      messages: [{ role: "user", content }],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`MiniMax API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text?.trim() || "";

  let cleaned = text;
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse JSON response from MiniMax: ${cleaned.slice(0, 300)}`);
  }
}

// Normalize a name for matching (e.g. "Sophia Rivera" vs "sophia rivera" -> "sophia rivera")
function normalizeName(name: unknown): string {
  if (typeof name !== "string") return "";
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

// Generate studentId slug
function generateStudentId(name: string): string {
  const normalized = normalizeName(name);
  // If single name like "Sophia" -> "sophia"
  // If "Sophia Rivera" -> "sophia" or "sophia-rivera"
  const slug = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || `student-${Date.now()}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const prePdfFile = formData.get("prePdf") as File | null;
    const postPdfFile = formData.get("postPdf") as File | null;

    if (!prePdfFile || !postPdfFile) {
      return NextResponse.json(
        { error: "Please upload both a pre-survey and post-survey PDF." },
        { status: 400 }
      );
    }

    // Convert both PDFs to PNG images in parallel
    const preBuffer = Buffer.from(await prePdfFile.arrayBuffer());
    const postBuffer = Buffer.from(await postPdfFile.arrayBuffer());

    const [prePages, postPages] = await Promise.all([
      pdfToPngBase64(preBuffer, prePdfFile.name || "pre.pdf"),
      pdfToPngBase64(postBuffer, postPdfFile.name || "post.pdf"),
    ]);

    if (!prePages.length || !postPages.length) {
      return NextResponse.json(
        { error: "Failed to render PDF pages from one or both uploaded documents." },
        { status: 400 }
      );
    }

    // Helper that retries at lower DPI if MiniMax content-safety rejects an image
    const extractWithRetry = async (
      buffer: Buffer,
      fileName: string,
      surveyType: "pre" | "post"
    ): Promise<Record<string, unknown>> => {
      const dpis = [120, 80, 60];
      let lastError: Error | null = null;
      for (const dpi of dpis) {
        try {
          const pages = await pdfToPngBase64(buffer, fileName, dpi);
          return await callMiniMaxVision(pages, surveyType);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          // Code 1026 = input_sensitive from MiniMax — retry at lower resolution
          if (msg.includes("1026") || msg.includes("sensitive")) {
            console.warn(`Sensitivity error at DPI ${dpi}, retrying at lower resolution…`);
            lastError = err instanceof Error ? err : new Error(msg);
            continue;
          }
          throw err;
        }
      }
      throw lastError ?? new Error("Extraction failed after all DPI retries.");
    };

    // Call MiniMax extraction for pre and post in parallel, with sensitivity retry
    const [preData, postData] = await Promise.all([
      extractWithRetry(preBuffer, prePdfFile.name || "pre.pdf", "pre"),
      extractWithRetry(postBuffer, postPdfFile.name || "post.pdf", "post"),
    ]);

    // Validation 1: Survey type validation
    const preSurveyType = String(preData.surveyType || "").toLowerCase();
    const postSurveyType = String(postData.surveyType || "").toLowerCase();

    if (preSurveyType === "post" && postSurveyType === "pre") {
      return NextResponse.json(
        {
          error:
            "It looks like the files are swapped: the Pre input contains a Post-Survey, and the Post input contains a Pre-Survey. Please swap them and try again.",
        },
        { status: 400 }
      );
    }

    if (preSurveyType === "post" && postSurveyType === "post") {
      return NextResponse.json(
        { error: "Both uploaded files appear to be post-surveys. Please ensure you upload one pre-survey and one post-survey." },
        { status: 400 }
      );
    }

    if (preSurveyType === "pre" && postSurveyType === "pre") {
      return NextResponse.json(
        { error: "Both uploaded files appear to be pre-surveys. Please ensure you upload one pre-survey and one post-survey." },
        { status: 400 }
      );
    }

    // Validation 2: Student name matching
    const preName = String(preData.studentName || "").trim();
    const postName = String(postData.studentName || "").trim();
    const normPre = normalizeName(preName);
    const normPost = normalizeName(postName);

    // Check if names match (or one is first name of the other)
    const namesMatch =
      normPre === normPost ||
      normPre.startsWith(normPost) ||
      normPost.startsWith(normPre) ||
      normPre.split(" ")[0] === normPost.split(" ")[0];

    if (!namesMatch) {
      return NextResponse.json(
        {
          error: `Names do not match between surveys: Pre-survey says "${preName}", but Post-survey says "${postName}". Please verify that both PDFs belong to the same student.`,
        },
        { status: 400 }
      );
    }

    const displayName = postName.length >= preName.length ? postName : preName;
    const studentId = generateStudentId(displayName);

    // Build comparison items
    const comparisons: ComparisonItem[] = COMPARISON_QUESTIONS.map((q) => {
      let preAnswer: string | number | Record<string, number | string> | null = null;
      let postAnswer: string | number | Record<string, number | string> | null = null;

      switch (q.id) {
        case "comp-1a":
          preAnswer = (preData.q1a_brandIdentity as string) || null;
          postAnswer = (postData.q1a_brandIdentity as string) || null;
          break;
        case "comp-1b":
          preAnswer = (preData.q1b_brandVision as string) || null;
          postAnswer = (postData.q1b_brandVision as string) || null;
          break;
        case "comp-1c":
          preAnswer = (preData.q1c_coreValues as string) || null;
          postAnswer = (postData.q1c_coreValues as string) || null;
          break;
        case "comp-2":
          preAnswer = (preData.q1_1_brandConceptConfidence as number) ?? null;
          postAnswer = (postData.q1_1_brandConceptConfidence as number) ?? null;
          break;
        case "comp-3":
          preAnswer = (preData.q2_targetCustomer as string) || null;
          postAnswer = (postData.q2_targetCustomer as string) || null;
          break;
        case "comp-4":
          preAnswer = (preData.q2_1_targetCustomerConfidence as number) ?? null;
          postAnswer = (postData.q2_1_targetCustomerConfidence as number) ?? null;
          break;
        case "comp-5":
          preAnswer = (preData.q2_2_niche as string) || null;
          postAnswer = (postData.q2_2_niche as string) || null;
          break;
        case "comp-6":
          preAnswer = (preData.q3_platforms as string) || null;
          postAnswer = (postData.q3_platforms as string) || null;
          break;
        case "comp-7":
          preAnswer = (preData.q3_3_contentStrategy as string) || null;
          postAnswer = (postData.q3_3_contentStrategy as string) || null;
          break;
        case "comp-8":
          preAnswer = (preData.q4_productOfferings as string) || null;
          postAnswer = (postData.q4_productOfferings as string) || null;
          break;
        case "comp-9":
          preAnswer = (preData.q4_1_productOfferingsConfidence as number) ?? null;
          postAnswer = (postData.q4_1_productOfferingsConfidence as number) ?? null;
          break;
        case "comp-10": {
          const preInf = preData.q4_2_influences as Record<string, number> | undefined;
          const postInf = postData.q4_2_influences as Record<string, number> | undefined;
          if (preInf && typeof preInf === "object" && Object.keys(preInf).length > 0) {
            preAnswer = preInf;
          }
          if (postInf && typeof postInf === "object" && Object.keys(postInf).length > 0) {
            postAnswer = postInf;
          }
          break;
        }
      }

      return {
        id: q.id,
        questionId: q.questionId,
        label: q.label,
        questionText: q.questionText,
        pre: { answer: preAnswer },
        post: { answer: postAnswer },
        artifactCoding: null,
        coderNotes: "",
      };
    });

    // Build pre additional items
    const preAdditional: SurveyItem[] = PRE_SURVEY_ADDITIONAL_QUESTIONS.map((q) => {
      let answer: string | number | Record<string, number | string> | null = null;
      switch (q.id) {
        case "pre-1":
          answer = (preData.pre1_priorExperience as string) || null;
          break;
        case "pre-2":
          answer = (preData.pre2_personalBrandConfidence as number) ?? null;
          break;
        case "pre-3":
          answer = (preData.pre3_senseOfControl as number) ?? null;
          break;
        case "pre-4":
          answer = (preData.pre4_independentConfidence as number) ?? null;
          break;
      }
      return {
        id: q.id,
        questionId: q.questionId,
        label: q.label,
        questionText: q.questionText,
        answer,
      };
    });

    // Build post additional items
    const postAdditional: SurveyItem[] = POST_SURVEY_ADDITIONAL_QUESTIONS.map((q) => {
      let answer: string | number | Record<string, number | string> | null = null;
      switch (q.id) {
        case "post-1":
          answer = (postData.post1_aiPromptingSkills as number) ?? null;
          break;
        case "post-2":
          answer = (postData.post1_1_aiUsageFrequency as string) || null;
          break;
        case "post-3":
          answer = (postData.post1_2_priorAiTraining as string) || null;
          break;
        case "post-4":
          answer = (postData.q5_1_aiImpact as number) ?? null;
          break;
        case "post-5":
          answer = (postData.q5_2_helpfulAspects as string) || null;
          break;
        case "post-6":
          answer = (postData.q5_3_challenges as string) || null;
          break;
        case "post-7":
          answer = (postData.q5_4_examplePrompts as number) ?? null;
          break;
        case "post-8":
          answer = (postData.post2_personalBrandConfidence as number) ?? null;
          break;
        case "post-9":
          answer = (postData.post3_independentConfidence as number) ?? null;
          break;
      }
      return {
        id: q.id,
        questionId: q.questionId,
        label: q.label,
        questionText: q.questionText,
        answer,
      };
    });

    const studentRecord: StudentRecord = {
      studentId,
      name: displayName,
      _seedVersion: `upload-${Date.now()}`,
      comparisons,
      additionalSurveyData: {
        pre: preAdditional,
        post: postAdditional,
      },
    };

    return NextResponse.json({
      success: true,
      student: studentRecord,
    });
  } catch (err: unknown) {
    console.error("Extract student error:", err);
    const message = err instanceof Error ? err.message : "Internal server error during extraction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
