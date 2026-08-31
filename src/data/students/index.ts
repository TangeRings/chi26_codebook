import jasonData from "./jason.json";
import aliyahData from "./aliyah.json";
import sophiaData from "./sophia.json";
import type { StudentRecord } from "@/types/research";

const registry: Record<string, StudentRecord> = {
  jason: jasonData as StudentRecord,
  aliyah: aliyahData as StudentRecord,
  sophia: sophiaData as StudentRecord,
};

export function getLocalStudent(id: string): StudentRecord | null {
  if (!id) return null;
  return registry[id.toLowerCase()] ?? null;
}

export function getAllLocalStudents(): StudentRecord[] {
  return Object.values(registry);
}
