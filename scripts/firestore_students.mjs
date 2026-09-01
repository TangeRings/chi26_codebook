/**
 * Firestore student inspector / backup / writer.
 *
 * Uses the same client SDK config as the app (NEXT_PUBLIC_FIREBASE_*), so it sees
 * exactly what the UI sees. The seed JSON files in src/data/students are only a
 * 3-student bootstrap; the real roster lives in the Firestore `students` collection.
 *
 * Commands:
 *   node scripts/firestore_students.mjs dump <outDir>     read-only: back up every student doc
 *   node scripts/firestore_students.mjs report            read-only: coverage table
 *   node scripts/firestore_students.mjs write <inDir>     write coded docs back to Firestore
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  updateDoc,
} from "firebase/firestore";

function loadEnv(file = ".env.local") {
  const full = path.resolve(file);
  if (!fs.existsSync(full)) return;
  for (const line of fs.readFileSync(full, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}

loadEnv();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Missing NEXT_PUBLIC_FIREBASE_API_KEY / PROJECT_ID");
  process.exit(2);
}

const db = getFirestore(initializeApp(firebaseConfig));

function isCodeableAnswer(value) {
  if (typeof value !== "string") return false;
  const text = value.trim();
  if (!text) return false;
  return !/^\d+(\.\d+)?$/.test(text);
}

async function fetchAll() {
  const snapshot = await getDocs(collection(db, "students"));
  const out = [];
  snapshot.forEach((snap) => out.push({ docId: snap.id, data: snap.data() }));
  return out;
}

const [command, arg] = process.argv.slice(2);

if (command === "dump") {
  const outDir = arg || "calibration/firestore-backup";
  fs.mkdirSync(outDir, { recursive: true });
  const students = await fetchAll();
  for (const { docId, data } of students) {
    fs.writeFileSync(
      path.join(outDir, `${docId}.json`),
      JSON.stringify(data, null, 2) + "\n"
    );
  }
  fs.writeFileSync(
    path.join(outDir, "_manifest.json"),
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        projectId: firebaseConfig.projectId,
        count: students.length,
        docIds: students.map((s) => s.docId),
      },
      null,
      2
    ) + "\n"
  );
  console.log(`Dumped ${students.length} student doc(s) to ${outDir}`);
} else if (command === "report") {
  const students = await fetchAll();
  console.log(`Firestore students collection: ${students.length} doc(s)\n`);
  const header = [
    "docId".padEnd(22),
    "studentId".padEnd(20),
    "name".padEnd(22),
    "cmp".padEnd(5),
    "codeable".padEnd(9),
    "coded".padEnd(6),
    "humanNotes".padEnd(11),
    "seedVersion",
  ].join("");
  console.log(header);
  console.log("-".repeat(header.length));
  let totalCodeable = 0;
  let totalCoded = 0;
  let totalNotes = 0;
  for (const { docId, data } of students) {
    const comparisons = data.comparisons || [];
    let codeable = 0;
    let coded = 0;
    let notes = 0;
    for (const item of comparisons) {
      const pre = item?.pre?.answer;
      const post = item?.post?.answer;
      if (isCodeableAnswer(pre) && isCodeableAnswer(post)) codeable++;
      const ac = item?.artifactCoding;
      const hasCoding =
        ac &&
        (ac.structuralDevelopment ||
          (ac.semanticChanges && ac.semanticChanges.length) ||
          (ac.learnerAgency && ac.learnerAgency.length));
      if (hasCoding) coded++;
      if (item?.coderNotes && String(item.coderNotes).trim()) notes++;
    }
    totalCodeable += codeable;
    totalCoded += coded;
    totalNotes += notes;
    console.log(
      [
        docId.padEnd(22),
        String(data.studentId ?? "?").padEnd(20),
        String(data.name ?? "?").slice(0, 21).padEnd(22),
        String(comparisons.length).padEnd(5),
        String(codeable).padEnd(9),
        String(coded).padEnd(6),
        String(notes).padEnd(11),
        String(data._seedVersion ?? ""),
      ].join("")
    );
  }
  console.log(
    `\nTotals: codeable=${totalCodeable} alreadyCoded=${totalCoded} itemsWithHumanNotes=${totalNotes}`
  );
} else if (command === "write") {
  const inDir = arg;
  if (!inDir) {
    console.error("write requires an input directory of {docId}.json files");
    process.exit(2);
  }
  const files = fs.readdirSync(inDir).filter((f) => f.endsWith(".json") && !f.startsWith("_"));
  let written = 0;
  for (const file of files) {
    const docId = path.basename(file, ".json");
    const record = JSON.parse(fs.readFileSync(path.join(inDir, file), "utf8"));
    if (!Array.isArray(record.comparisons)) {
      console.log(`skip ${docId}: no comparisons array`);
      continue;
    }
    await updateDoc(doc(db, "students", docId), {
      comparisons: record.comparisons,
    });
    written++;
    console.log(`wrote ${docId} (${record.comparisons.length} comparisons)`);
  }
  console.log(`\nUpdated ${written} student doc(s) in Firestore`);
} else {
  console.error("usage: dump <outDir> | report | write <inDir>");
  process.exit(2);
}

process.exit(0);
