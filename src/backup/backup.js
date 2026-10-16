import { levelInfo } from "../logic/xp.js";
import { sortedDays } from "../logic/streak.js";

export const BACKUP_FORMAT = "solo-leveling-fitness-backup";

export function buildExport(state, now = new Date()) {
  return JSON.stringify({ format: BACKUP_FORMAT, version: 1, exportedAt: now.toISOString(), soloState: state }, null, 2);
}

function looksLikeState(o) {
  return !!o && typeof o === "object" && !Array.isArray(o) &&
    ["xp", "hp", "questDays", "sessions", "done", "reps"].some(k => k in o);
}

// Accepts either an exported backup file or the raw soloState JSON
// (e.g. copied with localStorage.getItem("soloState")).
export function parseImport(text) {
  let data;
  try { data = JSON.parse(String(text).trim()); } catch { return { ok: false, error: "Μη έγκυρο JSON." }; }
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch { return { ok: false, error: "Μη έγκυρο JSON." }; }
  }
  const state = data && data.format === BACKUP_FORMAT ? data.soloState : data;
  if (!looksLikeState(state)) return { ok: false, error: "Δεν βρέθηκαν δεδομένα soloState." };
  if ("xp" in state && !Number.isFinite(Number(state.xp))) return { ok: false, error: "Μη έγκυρο XP." };
  return { ok: true, state, summary: summarize(state) };
}

export function summarize(state) {
  const xp = Math.max(0, Number(state.xp) || 0);
  const days = sortedDays(state.questDays);
  return {
    xp,
    level: levelInfo(xp).level,
    hp: Number.isFinite(Number(state.hp)) ? Number(state.hp) : 100,
    workoutDays: days.length,
    lastWorkout: days.length ? days[days.length - 1] : null
  };
}
