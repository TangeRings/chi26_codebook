#!/usr/bin/env python3
"""Batch artifact coding across all students via the local /api/ai-code-item route.

IMPORTANT: the roster lives in the Firestore `students` collection, NOT in
`src/data/students/`. Those three JSON files are only a bootstrap seed. Always run
against a Firestore dump produced by `scripts/firestore_students.mjs dump <dir>`,
then push the results back with `scripts/firestore_students.mjs write <outDir>`.

Only open-text PRE/POST pairs are codeable; Likert and grid answers are skipped.
Items whose `coderNotes` are non-empty are treated as human-reviewed and skipped
unless --recode-human is passed.

Typical run:
    node scripts/firestore_students.mjs dump calibration/firestore-backup/pre
    python3 scripts/batch_artifact_coding.py \
        --source calibration/firestore-backup/pre \
        --out calibration/runs/run-008/docs \
        --run-id run-008
    node scripts/firestore_students.mjs write calibration/runs/run-008/docs
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import pathlib
import re
import sys
import threading
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
SEED_DIR = ROOT / "src" / "data" / "students"
DEFAULT_ENDPOINT = "http://localhost:3001/api/ai-code-item"

print_lock = threading.Lock()


def log(*parts: object) -> None:
    with print_lock:
        print(*parts, flush=True)


def is_codeable(value: object) -> bool:
    """Only non-numeric open text can be coded."""
    if not isinstance(value, str):
        return False
    text = value.strip()
    if not text:
        return False
    return not re.fullmatch(r"\d+(\.\d+)?", text)


def has_coding(item: dict) -> bool:
    coding = item.get("artifactCoding") or {}
    return bool(
        coding.get("structuralDevelopment")
        or coding.get("semanticChanges")
        or coding.get("learnerAgency")
    )


def load_docs(source: pathlib.Path) -> dict[str, dict]:
    docs: dict[str, dict] = {}
    for path in sorted(source.glob("*.json")):
        if path.name.startswith("_"):
            continue
        docs[path.stem] = json.loads(path.read_text())
    return docs


def collect_units(
    docs: dict[str, dict], skip: set[str], only: set[str], recode_human: bool
) -> tuple[list[dict], list[str]]:
    units: list[dict] = []
    preserved: list[str] = []
    for doc_id, record in docs.items():
        student_id = record.get("studentId") or doc_id
        if only and student_id not in only and doc_id not in only:
            continue
        for item in record.get("comparisons", []):
            pre = (item.get("pre") or {}).get("answer")
            post = (item.get("post") or {}).get("answer")
            if not (is_codeable(pre) and is_codeable(post)):
                continue
            key = f"{doc_id}:{item['id']}"
            if key in skip:
                preserved.append(f"{key} (explicitly skipped)")
                continue
            if not recode_human and str(item.get("coderNotes") or "").strip():
                preserved.append(f"{key} (human coderNotes present)")
                continue
            units.append(
                {
                    "key": key,
                    "doc_id": doc_id,
                    "student_id": student_id,
                    "item_id": item["id"],
                    "item_name": item.get("label") or item["id"],
                    "question_id": item.get("questionId"),
                    "question_text": item.get("questionText"),
                    "pre": pre.strip(),
                    "post": post.strip(),
                }
            )
    return units, preserved


def code_unit(unit: dict, endpoint: str, attempts: int = 3) -> dict:
    payload = {
        "studentId": unit["student_id"],
        "itemId": unit["item_id"],
        "itemName": unit["item_name"],
        "preResponse": unit["pre"],
        "postResponse": unit["post"],
    }
    if unit.get("question_id"):
        payload["questionId"] = unit["question_id"]
    if unit.get("question_text"):
        payload["questionText"] = unit["question_text"]

    body = json.dumps(payload).encode()
    last_error = ""
    for attempt in range(1, attempts + 1):
        request = urllib.request.Request(
            endpoint,
            data=body,
            headers={"content-type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=900) as response:
                result = json.loads(response.read())
            if "error" in result:
                last_error = str(result["error"])
            elif "coding" not in result:
                last_error = "response missing 'coding'"
            else:
                return {"ok": True, "result": result, "attempts": attempt}
        except urllib.error.HTTPError as err:
            last_error = f"HTTP {err.code}: {err.read()[:300]!r}"
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as err:
            last_error = f"{type(err).__name__}: {err}"

        log(f"  ! {unit['key']} attempt {attempt}/{attempts}: {last_error[:160]}")
        if attempt < attempts:
            time.sleep(5 * attempt)

    return {"ok": False, "error": last_error}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, help="dir of Firestore {docId}.json dumps")
    parser.add_argument("--out", required=True, help="dir to write updated docs for push")
    parser.add_argument("--run-id", default=f"run-{time.strftime('%Y%m%d-%H%M%S')}")
    parser.add_argument("--endpoint", default=DEFAULT_ENDPOINT)
    parser.add_argument("--concurrency", type=int, default=3)
    parser.add_argument("--skip", nargs="*", default=[], metavar="DOCID:ITEM")
    parser.add_argument("--only", nargs="*", default=[], metavar="STUDENT")
    parser.add_argument(
        "--recode-human",
        action="store_true",
        help="also recode items that already carry human coderNotes",
    )
    parser.add_argument("--sync-seed", action="store_true",
                        help="mirror results into src/data/students/*.json for seeded students")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    source = pathlib.Path(args.source)
    if not source.is_dir():
        log(f"source dir not found: {source}")
        return 2

    docs = load_docs(source)
    units, preserved = collect_units(
        docs, set(args.skip), set(args.only), args.recode_human
    )

    log(f"Students in dump: {len(docs)}")
    log(f"Units to code:    {len(units)}")
    if preserved:
        log(f"Preserved:        {len(preserved)}")
        for entry in preserved:
            log(f"  - {entry}")
    by_student: dict[str, int] = {}
    for unit in units:
        by_student[unit["doc_id"]] = by_student.get(unit["doc_id"], 0) + 1
    for doc_id in sorted(by_student):
        log(f"  {doc_id:<20} {by_student[doc_id]} item(s)")
    if args.dry_run:
        return 0

    run_dir = ROOT / "calibration" / "runs" / args.run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    out_dir = pathlib.Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    results: dict[str, dict] = {}
    started = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as pool:
        futures = {pool.submit(code_unit, u, args.endpoint): u for u in units}
        done = 0
        for future in concurrent.futures.as_completed(futures):
            unit = futures[future]
            outcome = future.result()
            results[unit["key"]] = outcome
            done += 1
            if outcome["ok"]:
                coding = outcome["result"]["coding"]
                events = coding.get("semanticChanges") or []
                flags = (coding.get("uncertainty") or {}).get("flags") or []
                marker = " [!]" if "duplicate_pre_antecedent" in flags else ""
                log(f"[{done}/{len(units)}] ok   {unit['key']:<28} {len(events)} event(s){marker}")
            else:
                log(f"[{done}/{len(units)}] FAIL {unit['key']:<28} {outcome['error'][:150]}")

    # Persist raw artifacts for audit.
    for unit in units:
        outcome = results.get(unit["key"])
        if not outcome or not outcome["ok"]:
            continue
        result = outcome["result"]
        stem = f"{unit['doc_id']}-{unit['item_id']}"
        (run_dir / f"{stem}.response.json").write_text(json.dumps(result, indent=2))
        for field, suffix in (
            ("pass1Output", "pass1"),
            ("criticOutput", "critic"),
            ("rawOutput", "merged"),
        ):
            if result.get(field) is not None:
                (run_dir / f"{stem}.{suffix}.json").write_text(
                    json.dumps(result[field], indent=2)
                )

    # Build updated docs for the Firestore push. Human coderNotes are carried over.
    written_items = 0
    for doc_id, record in docs.items():
        changed = False
        for item in record.get("comparisons", []):
            outcome = results.get(f"{doc_id}:{item['id']}")
            if not outcome or not outcome["ok"]:
                continue
            human_notes = item.get("coderNotes", "")
            item["artifactCoding"] = outcome["result"]["coding"]
            item["coderNotes"] = human_notes
            changed = True
            written_items += 1
        if changed:
            (out_dir / f"{doc_id}.json").write_text(
                json.dumps(record, indent=2, ensure_ascii=False) + "\n"
            )

    # Keep the three bootstrap seed files aligned so a "Reset Seed Data" click
    # reproduces the same coding instead of reverting to uncoded text.
    if args.sync_seed:
        for seed_path in sorted(SEED_DIR.glob("*.json")):
            doc_id = seed_path.stem
            record = docs.get(doc_id)
            if record is None:
                continue
            seed = json.loads(seed_path.read_text())
            coded = {i["id"]: i.get("artifactCoding") for i in record.get("comparisons", [])}
            for item in seed.get("comparisons", []):
                if item["id"] in coded and coded[item["id"]] is not None:
                    item["artifactCoding"] = coded[item["id"]]
            seed["_seedVersion"] = f"{args.run_id}-coded"
            seed_path.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n")
            log(f"synced seed {seed_path.name} (_seedVersion={seed['_seedVersion']})")

    failures = {k: v["error"] for k, v in results.items() if not v["ok"]}
    summary = {
        "runId": args.run_id,
        "source": str(source),
        "out": str(out_dir),
        "endpoint": args.endpoint,
        "studentsInDump": len(docs),
        "attempted": len(units),
        "succeeded": len(units) - len(failures),
        "failed": failures,
        "preserved": preserved,
        "itemsWritten": written_items,
        "elapsedSeconds": round(time.time() - started, 1),
    }
    (run_dir / "batch-summary.json").write_text(json.dumps(summary, indent=2))

    log("")
    log(f"Succeeded {summary['succeeded']}/{summary['attempted']} in {summary['elapsedSeconds']}s")
    log(f"Updated docs written to {out_dir} — push with:")
    log(f"  node scripts/firestore_students.mjs write {out_dir}")
    if failures:
        log("Failures:")
        for key, error in failures.items():
            log(f"  {key}: {error[:300]}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
