import { needsMigration } from "../state/migrations.js";

export const STATE_KEY = "soloState";
// Untouched copy of the data as it was before the first schema migration. Written once, never overwritten.
export const BACKUP_V0_KEY = "soloState.backup.v0";
// Raw text found in soloState when it could not be parsed as JSON.
export const CORRUPT_KEY = "soloState.corrupt";
// Copy of soloState taken right before an Import replaced it.
export const PRE_IMPORT_KEY = "soloState.backup.preImport";

function safeSet(storage, key, value) {
  try { storage.setItem(key, value); return true; } catch { return false; }
}

// Reads soloState without ever destroying existing data.
// Returns { data, raw, corrupt } where data is the parsed object (or {} for a fresh install).
export function loadRaw(storage) {
  let raw = null;
  try { raw = storage.getItem(STATE_KEY); } catch { raw = null; }
  if (raw === null || raw === "") return { data: {}, raw, corrupt: false };
  let data;
  try { data = JSON.parse(raw); } catch { data = undefined; }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    const prev = storage.getItem(CORRUPT_KEY);
    if (prev !== raw) safeSet(storage, prev === null ? CORRUPT_KEY : CORRUPT_KEY + "." + Date.now(), raw);
    return { data: {}, raw, corrupt: true };
  }
  if (needsMigration(data) && storage.getItem(BACKUP_V0_KEY) === null) safeSet(storage, BACKUP_V0_KEY, raw);
  return { data, raw, corrupt: false };
}

export function saveState(storage, state) {
  return safeSet(storage, STATE_KEY, JSON.stringify(state));
}

export function backupBeforeImport(storage) {
  const raw = storage.getItem(STATE_KEY);
  return raw === null ? true : safeSet(storage, PRE_IMPORT_KEY, raw);
}
