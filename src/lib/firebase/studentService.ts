import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./config";
import { StudentRecord, ComparisonItem } from "@/types/research";
import { getLocalStudent, getAllLocalStudents } from "@/data/students";

const LOCAL_STORAGE_KEY_PREFIX = "research_student_record_";

export async function listStudents(): Promise<StudentRecord[]> {
  const studentMap = new Map<string, StudentRecord>();

  // 1. Add registered local seed students first as default baseline
  try {
    const localSeeds = getAllLocalStudents();
    for (const s of localSeeds) {
      studentMap.set(s.studentId.toLowerCase(), s);
    }
  } catch (err) {
    console.warn("Could not read local seeds in listStudents:", err);
  }

  // 2. Fetch all student records from Firestore
  if (isFirebaseConfigured && db) {
    try {
      const querySnapshot = await getDocs(collection(db, "students"));
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as StudentRecord;
        if (data && data.studentId) {
          studentMap.set(data.studentId.toLowerCase(), data);
          // Sync to localStorage
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(
                `${LOCAL_STORAGE_KEY_PREFIX}${data.studentId.toLowerCase()}`,
                JSON.stringify(data)
              );
            } catch {
              // Ignore localStorage write error
            }
          }
        }
      });
    } catch (err) {
      console.warn("Firestore listStudents error, falling back to cache/seeds:", err);
    }
  }

  // 3. Supplement with any additional students found in localStorage
  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LOCAL_STORAGE_KEY_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as StudentRecord;
              if (parsed && parsed.studentId && !studentMap.has(parsed.studentId.toLowerCase())) {
                studentMap.set(parsed.studentId.toLowerCase(), parsed);
              }
            } catch {
              // Ignore JSON parse error
            }
          }
        }
      }
    } catch (err) {
      console.warn("localStorage scan in listStudents error:", err);
    }
  }

  return Array.from(studentMap.values());
}

export async function getStudent(studentId: string): Promise<StudentRecord | null> {
  const normalizedId = studentId.toLowerCase();

  // 1. If Firestore is configured and ready, check if remote document exists
  if (isFirebaseConfigured && db) {
    try {
      const studentDocRef = doc(db, "students", normalizedId);
      const snapshot = await getDoc(studentDocRef);
      const localSeed = getLocalStudent(normalizedId);

      if (snapshot.exists()) {
        const data = snapshot.data() as StudentRecord;
        const firestoreVersion = data._seedVersion;
        const seedVersion = localSeed?._seedVersion;

        // If the seed has a newer version than what's in Firestore, re-seed automatically
        if (seedVersion && firestoreVersion !== seedVersion) {
          console.info(
            `Firestore data for "${normalizedId}" is outdated (v=${firestoreVersion}, seed v=${seedVersion}). Re-seeding…`
          );
          try {
            await setDoc(studentDocRef, localSeed);
          } catch (reseedErr) {
            console.warn("Could not re-seed Firestore:", reseedErr);
          }
          if (typeof window !== "undefined") {
            localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${normalizedId}`, JSON.stringify(localSeed));
          }
          return localSeed;
        }

        // Version matches — use Firestore data and sync to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${normalizedId}`, JSON.stringify(data));
        }
        return data;
      } else {
        // Document doesn't exist yet — auto-seed from local JSON
        if (localSeed) {
          try {
            await setDoc(studentDocRef, localSeed);
            console.info(`Auto-seeded student "${normalizedId}" to Firestore`);
          } catch (seedErr) {
            console.warn("Could not auto-seed to Firestore:", seedErr);
          }
          if (typeof window !== "undefined") {
            localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${normalizedId}`, JSON.stringify(localSeed));
          }
          return localSeed;
        }
      }
    } catch (error) {
      console.error("Firestore getStudent error, falling back to local storage/seed:", error);
    }
  }

  // 2. Check localStorage, but validate against current seed version to prevent stale data
  const currentSeed = getLocalStudent(normalizedId);
  if (typeof window !== "undefined") {
    try {
      const rawCached = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${normalizedId}`);
      if (rawCached) {
        const cached = JSON.parse(rawCached) as StudentRecord;
        const cachedVersion = cached._seedVersion;
        const seedVersion = currentSeed?._seedVersion;
        // If seed has a version and the cached copy doesn't match, the cache is stale — discard it
        if (seedVersion && cachedVersion !== seedVersion) {
          console.info(
            `Stale localStorage cache for "${normalizedId}" (cached v=${cachedVersion}, seed v=${seedVersion}). Refreshing from seed.`
          );
          localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${normalizedId}`);
        } else {
          return cached;
        }
      }
    } catch (e) {
      console.warn("Could not read from localStorage:", e);
    }
  }

  // 3. Fallback to registered local student JSON
  if (currentSeed) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${normalizedId}`, JSON.stringify(currentSeed));
      } catch (e) {
        console.warn("Could not save fallback to localStorage:", e);
      }
    }
    return currentSeed;
  }

  return null;
}

export async function updateComparisons(
  studentId: string,
  comparisons: ComparisonItem[]
): Promise<void> {
  const normalizedId = studentId.toLowerCase();
  let savedToFirestore = false;

  if (isFirebaseConfigured && db) {
    try {
      const studentDocRef = doc(db, "students", normalizedId);
      await updateDoc(studentDocRef, { comparisons });
      savedToFirestore = true;
    } catch (error: unknown) {
      // If doc doesn't exist yet, set it completely
      try {
        const studentDocRef = doc(db, "students", normalizedId);
        const current = await getStudent(normalizedId);
        const recordToSave: StudentRecord = current || {
          studentId: normalizedId,
          name: normalizedId.charAt(0).toUpperCase() + normalizedId.slice(1),
          comparisons,
        };
        recordToSave.comparisons = comparisons;
        await setDoc(studentDocRef, recordToSave);
        savedToFirestore = true;
      } catch (innerError) {
        console.error("Firestore updateComparisons setDoc fallback failed:", innerError);
      }
    }
  }

  // Also save to localStorage for dev persistence & fast client access
  if (typeof window !== "undefined") {
    try {
      const current = await getStudent(normalizedId);
      const seed = getLocalStudent(normalizedId);
      const updated: StudentRecord = current || {
        studentId: normalizedId,
        name: normalizedId.charAt(0).toUpperCase() + normalizedId.slice(1),
        comparisons,
      };
      updated.comparisons = comparisons;
      // Always carry the seed version forward so future version checks remain valid
      if (seed?._seedVersion) {
        updated._seedVersion = seed._seedVersion;
      }
      localStorage.setItem(
        `${LOCAL_STORAGE_KEY_PREFIX}${normalizedId}`,
        JSON.stringify(updated)
      );
    } catch (e) {
      console.warn("Could not write to localStorage:", e);
    }
  }

  if (!savedToFirestore && isFirebaseConfigured) {
    console.warn("Saved to localStorage fallback (Firestore write encountered error or is unavailable)");
  }
}

export async function saveStudentRecord(record: StudentRecord): Promise<void> {
  const normalizedId = record.studentId.toLowerCase();

  if (isFirebaseConfigured && db) {
    try {
      const studentDocRef = doc(db, "students", normalizedId);
      await setDoc(studentDocRef, record);
    } catch (e) {
      console.error("Firestore saveStudentRecord error:", e);
    }
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        `${LOCAL_STORAGE_KEY_PREFIX}${normalizedId}`,
        JSON.stringify(record)
      );
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }
}

export async function resetStudentToSeed(studentId: string): Promise<StudentRecord | null> {
  const normalizedId = studentId.toLowerCase();
  const seed = getLocalStudent(normalizedId);
  if (!seed) return null;

  await saveStudentRecord(seed);
  return seed;
}
