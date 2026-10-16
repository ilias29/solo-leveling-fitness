import { MAX_HP } from "../logic/hp.js";
import { isDayKey } from "../logic/dates.js";

export const SCHEMA_VERSION = 1;

// Workout days that must always remain in the history.
export const SEED_DAYS = ["2026-10-14", "2026-10-15", "2026-10-16"];

const MODES = ["kb", "wall", "stretch"];

function toNum(v, fallback) {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  return Number.isFinite(n) ? n : fallback;
}

function isObj(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

// Pre-schema normalisation, identical in effect to the original inline code.
// Never deletes fields: unknown/legacy keys (done, reps, hpDecayEnabled, ...) are kept as-is.
function migrateLegacy(state) {
  state.xp = Math.max(0, toNum(state.xp, 0));
  state.hp = Math.max(0, Math.min(MAX_HP, toNum(state.hp, MAX_HP)));
  state.hpPenaltyWeeksApplied = Math.max(0, toNum(state.hpPenaltyWeeksApplied, 0));
  state.questDays = Array.isArray(state.questDays) ? state.questDays : [];
  if (!isObj(state.sessions)) state.sessions = {};
  if (!isObj(state.sessions.kb)) state.sessions.kb = { done: Array.isArray(state.done) ? state.done : [], values: isObj(state.reps) ? state.reps : {} };
  for (const m of MODES) if (!isObj(state.sessions[m])) state.sessions[m] = { done: [], values: {} };
  state.activeMode = MODES.includes(state.activeMode) ? state.activeMode : "kb";
  return state;
}

const steps = {
  // v0 -> v1: adds schemaVersion, per-mode daily XP tracking and the session date.
  // Existing set progress is kept for the day of the migration.
  1(state, today) {
    state.lastXpDate = isObj(state.lastXpDate) ? state.lastXpDate : {};
    state.sessionDate = isDayKey(state.sessionDate) ? state.sessionDate : today;
  }
};

export function migrate(input, today) {
  const state = isObj(input) ? input : {};
  const from = Math.max(0, Math.floor(toNum(state.schemaVersion, 0)));
  migrateLegacy(state);
  for (let v = from + 1; v <= SCHEMA_VERSION; v++) steps[v](state, today);
  state.schemaVersion = Math.max(from, SCHEMA_VERSION);
  state.questDays = [...new Set([...state.questDays, ...SEED_DAYS])].sort();
  return state;
}

export function needsMigration(input) {
  return !isObj(input) || toNum(input.schemaVersion, 0) < SCHEMA_VERSION;
}
