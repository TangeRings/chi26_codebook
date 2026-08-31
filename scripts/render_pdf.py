#!/usr/bin/env python3
import sys
import os
import json
import base64

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No PDF path provided"}))
        sys.exit(1)

    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        print(json.dumps({"error": f"File not found: {pdf_path}"}))
        sys.exit(1)

    try:
        import pymupdf
    except ImportError:
        try:
            import fitz as pymupdf
        except ImportError:
            print(json.dumps({"error": "pymupdf not installed"}))
            sys.exit(1)

    dpi = int(sys.argv[2]) if len(sys.argv) > 2 else 120
    doc = pymupdf.open(pdf_path)
    pages = []
    matrix = pymupdf.Matrix(dpi / 72, dpi / 72)
    for page in doc:
        pix = page.get_pixmap(matrix=matrix)
        png_bytes = pix.tobytes("png")
        pages.append(base64.b64encode(png_bytes).decode("utf-8"))
    doc.close()

    print(json.dumps({"pages": pages}))

if __name__ == "__main__":
    main()
