const STORAGE_KEY = "proof:addressed";

function load(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function save(data: Record<string, string[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getAddressed(auditId: string): Set<string> {
  return new Set(load()[auditId] ?? []);
}

export function toggleAddressed(auditId: string, flagKey: string): Set<string> {
  const all = load();
  const current = new Set(all[auditId] ?? []);
  if (current.has(flagKey)) {
    current.delete(flagKey);
  } else {
    current.add(flagKey);
  }
  all[auditId] = Array.from(current);
  save(all);
  return current;
}

export function clearAddressed(auditId: string) {
  const all = load();
  delete all[auditId];
  save(all);
}
