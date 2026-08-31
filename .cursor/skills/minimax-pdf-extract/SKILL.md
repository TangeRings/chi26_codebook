---
name: minimax-pdf-extract
description: Extract structured research data (Likert scores, text answers, grid responses) from Google Form PDF exports using MiniMax M3 multimodal vision API. Use when the user needs to read scores or answers from a survey PDF, wants to update student JSON files from PDF data, or asks to "read the PDF" for research data extraction.
---

# MiniMax PDF Data Extraction

Extracts all answers — including visual Likert slider positions — from Google Form PDF exports using MiniMax-M3 vision. Outputs structured JSON ready to merge into `src/data/students/<id>.json`.

## Setup (first time only)

```bash
python3 -m venv /tmp/mmenv
/tmp/mmenv/bin/pip install anthropic pymupdf -q
```

If pymupdf times out, install only anthropic and use the qlmanage fallback in the script.

## Run extraction

```bash
cd /path/to/CHI26_codebook
python3 scripts/extract_pdf_data.py \
  --pdf "data/jason/Jason pre.pdf" \
  --type pre \
  --student jason

python3 scripts/extract_pdf_data.py \
  --pdf "data/jason/Jason post.pdf" \
  --type post \
  --student jason
```

The script outputs a JSON block. Merge the values into the student's JSON file.

## Script behaviour

1. **Render pages**: Uses `pymupdf` (fitz) to render each PDF page at 150 DPI → PNG. Falls back to `qlmanage` (page 1 only) if fitz is unavailable.
2. **Call MiniMax M3**: Sends all page images via the Anthropic-compatible endpoint (`https://api.minimaxi.com/anthropic`) with `MINIMAX_API_KEY` from `.env.local`.
3. **Structured extraction prompt**: Asks the model to return a JSON object with every question's answer, paying special attention to slider radio-button positions (the filled circle = selected value).
4. **Output**: Prints extracted JSON to stdout.

## API details

- Base URL: `https://api.minimaxi.com/anthropic`
- Model: `MiniMax-M3` (native multimodal, supports base64 PNG)
- Auth: `MINIMAX_API_KEY` from `.env.local`
- Image format: base64 PNG, `detail: "high"` for accurate slider reading

## Adding a new student PDF

1. Drop PDFs into `data/<studentId>/`
2. Run `extract_pdf_data.py` with `--student <studentId>`
3. The script creates `src/data/students/<studentId>.json` if it doesn't exist, or prints a diff to merge manually.

## Notes

- Likert sliders in Google Form PDFs are rendered as radio buttons; M3 can see which circle is filled.
- Grid questions (Q4.2 style, 1-5 per row) are returned as an object `{ "row label": score }`.
- Always bump `_seedVersion` in the JSON after updating scores so Firestore auto-refreshes.
