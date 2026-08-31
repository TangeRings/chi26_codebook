#!/usr/bin/env python3
"""
Extract structured research data from Google Form PDF exports using MiniMax M3 vision.
Usage:
  python3 scripts/extract_pdf_data.py --pdf "data/jason/Jason pre.pdf" --type pre --student jason
"""

import argparse
import base64
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

# ── Load .env.local ──────────────────────────────────────────────────────────
def load_env():
    env_path = Path(__file__).parent.parent / ".env.local"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())

load_env()

MINIMAX_API_KEY = os.environ.get("MINIMAX_API_KEY", "")
MINIMAX_BASE_URL = "https://api.minimaxi.com/anthropic"

if not MINIMAX_API_KEY:
    print("ERROR: MINIMAX_API_KEY not set in .env.local", file=sys.stderr)
    sys.exit(1)

# MiniMax Anthropic-compatible endpoint reads the key from env vars
os.environ["ANTHROPIC_API_KEY"] = MINIMAX_API_KEY
os.environ["ANTHROPIC_BASE_URL"] = MINIMAX_BASE_URL

# ── PDF → PNG pages ──────────────────────────────────────────────────────────
def render_pdf_pages(pdf_path: str) -> list[str]:
    """Return list of base64-encoded PNG strings, one per page."""
    pages = []

    # Try pymupdf (fitz) first
    try:
        import fitz  # type: ignore
        doc = fitz.open(pdf_path)
        for page in doc:
            mat = fitz.Matrix(150 / 72, 150 / 72)  # 150 DPI
            pix = page.get_pixmap(matrix=mat)
            png_bytes = pix.tobytes("png")
            pages.append(base64.b64encode(png_bytes).decode())
        doc.close()
        print(f"  Rendered {len(pages)} page(s) with pymupdf", file=sys.stderr)
        return pages
    except ImportError:
        pass

    # Fallback: qlmanage (macOS, renders page 1 only as thumbnail)
    print("  pymupdf not available — falling back to qlmanage (page 1 only)", file=sys.stderr)
    with tempfile.TemporaryDirectory() as tmpdir:
        result = subprocess.run(
            ["qlmanage", "-t", "-s", "1400", "-o", tmpdir, pdf_path],
            capture_output=True
        )
        png_files = list(Path(tmpdir).glob("*.png"))
        if png_files:
            data = png_files[0].read_bytes()
            pages.append(base64.b64encode(data).decode())
        else:
            print("  qlmanage produced no output", file=sys.stderr)

    return pages

# ── MiniMax M3 call ──────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are a research data extraction assistant. You will receive images of pages from a Google Form survey response PDF.

Your job is to extract EVERY question and its answer accurately. Pay special attention to:
1. Likert / linear scale questions (1–10 or 1–5): The selected value is shown as a FILLED (solid dark) circle among empty circles. Read the position carefully and return the numeric value.
2. Grid/matrix questions (multiple rows, each rated 1–5): Return an object mapping each row label to its selected score.
3. Text answers: Return the exact text as written.
4. Multiple-choice (single or multiple select): Return selected option(s).

Return ONLY a valid JSON object. Keys should be the question ID or short label (e.g. "Pre-Survey 2", "Q1.1", "Q4.2"). Values should be:
- A number for scale questions
- A string for text answers
- An object for grid questions: { "row label": score, ... }
- An array for multi-select

Do not include any explanation or markdown — only the raw JSON object."""

def extract_with_minimax(pages_b64: list[str], survey_type: str) -> dict:
    try:
        import anthropic  # type: ignore
    except ImportError:
        print("ERROR: anthropic package not installed. Run:\n  pip install anthropic", file=sys.stderr)
        sys.exit(1)

    # Use env vars set above; do not pass api_key/base_url directly
    client = anthropic.Anthropic()

    content = []
    for i, b64 in enumerate(pages_b64):
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/png",
                "data": b64,
            }
        })
        content.append({
            "type": "text",
            "text": f"[Page {i + 1} of the {survey_type} survey PDF]"
        })

    content.append({
        "type": "text",
        "text": f"Please extract all questions and answers from this {survey_type} survey. Return only a JSON object."
    })

    response = client.messages.create(
        model="MiniMax-M3",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}],
    )

    raw = response.content[0].text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = "\n".join(raw.split("\n")[1:])
        raw = raw.rstrip("`").strip()

    return json.loads(raw)

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Extract survey data from PDF using MiniMax M3")
    parser.add_argument("--pdf", required=True, help="Path to the PDF file")
    parser.add_argument("--type", required=True, choices=["pre", "post"], help="Survey type")
    parser.add_argument("--student", required=True, help="Student ID (e.g. jason)")
    args = parser.parse_args()

    pdf_path = str(Path(args.pdf).resolve())
    print(f"Processing: {pdf_path}", file=sys.stderr)

    print("Step 1: Rendering PDF pages...", file=sys.stderr)
    pages = render_pdf_pages(pdf_path)
    if not pages:
        print("ERROR: Could not render any pages from PDF", file=sys.stderr)
        sys.exit(1)

    print(f"Step 2: Calling MiniMax M3 ({len(pages)} page image(s))...", file=sys.stderr)
    result = extract_with_minimax(pages, args.type)

    print(f"\n=== Extracted data for student={args.student}, type={args.type} ===")
    print(json.dumps(result, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
