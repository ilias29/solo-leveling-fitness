import { migrate } from "./migrations.js";
import { isDayKey } from "../logic/dates.js";

export const ALLOWED_WEIGHTS = [8, 16, 32];
export const ALLOWED_SETS = [1, 2, 3, 4];

const clampSets = v => Math.max(1, Math.min(4, parseInt(v) || 1));

export function maxValue(item) {
  return item.control === "ΧΡΟΝΟΣ" ? 180 : 50;
}

export function normalizeWeight(v) {
  const n = parseFloat(v);
  if (!Number.isFinite(n)) return 8;
  return ALLOWED_WEIGHTS.reduce((a, b) => Math.abs(b - n) < Math.abs(a - n) ? b : a, 8);
}

// Fills per-exercise defaults and keeps done/setProgress consistent.
// Data is keyed by exercise index, exactly as stored by previous versions.
export function normalizeSessions(state, workouts) {
  if (!state.lastXpDate || typeof state.lastXpDate !== "object") state.lastXpDate = {};
  for (const [mode, w] of Object.entries(workouts)) {
    const s = state.sessions[mode];
    s.done = Array.isArray(s.done) ? s.done : [];
    s.values = s.values || {};
    s.weights = s.weights || {};
    s.sets = s.sets || {};
    s.alternatives = s.alternatives || {};
    s.setProgress = s.setProgress || {};
    w.items.forEach((e, i) => {
      if (!Number.isFinite(+s.values[i])) s.values[i] = e.value;
      if (mode === "kb" && !Number.isFinite(+s.weights[i])) s.weights[i] = parseFloat(e.load) || 8;
      if (!Number.isFinite(+s.sets[i])) s.sets[i] = clampSets(e.sets);
      const target = clampSets(parseInt(s.sets[i]) || parseInt(e.sets));
      if (!Number.isFinite(+s.setProgress[i])) s.setProgress[i] = s.done.includes(i) ? target : 0;
      s.setProgress[i] = Math.max(0, Math.min(target, parseInt(s.setProgress[i]) || 0));
      if (s.setProgress[i] >= target && !s.done.includes(i)) s.done.push(i);
      if (s.setProgress[i] < target) s.done = s.done.filter(x => x !== i);
    });
  }
  return state;
}

// On a new calendar day, clear set progress of every mode.
// Reps, weights, set counts, alternatives and workout history are kept.
export function resetDailyProgress(state, workouts, today) {
  if (state.sessionDate === today) return false;
  for (const mode of Object.keys(workouts)) clearProgress(state.sessions[mode]);
  state.sessionDate = isDayKey(today) ? today : state.sessionDate;
  return true;
}

export function prepareState(raw, workouts, today) {
  const state = normalizeSessions(migrate(raw, today), workouts);
  resetDailyProgress(state, workouts, today);
  return state;
}

export function clearProgress(s) {
  s.done = [];
  s.setProgress = {};
}

export function setCount(s, item, i) {
  return Math.max(1, Math.min(4, parseInt(s.sets[i]) || parseInt(item.sets) || 1));
}

export function setProgress(s, item, i) {
  const target = setCount(s, item, i);
  if (s.done.includes(i)) return target;
  return Math.max(0, Math.min(target, parseInt(s.setProgress[i]) || 0));
}

export function changeSetCount(s, item, i, v) {
  const oldProgress = setProgress(s, item, i), target = clampSets(v);
  s.sets[i] = target;
  s.setProgress[i] = Math.min(oldProgress, target);
  if (s.setProgress[i] >= target) { if (!s.done.includes(i)) s.done.push(i); }
  else s.done = s.done.filter(x => x !== i);
}

export function advanceSet(s, item, i) {
  const target = setCount(s, item, i), next = Math.min(target, setProgress(s, item, i) + 1);
  s.setProgress[i] = next;
  if (next >= target && !s.done.includes(i)) s.done.push(i);
}

export function resetExercise(s, i) {
  s.done = s.done.filter(x => x !== i);
  s.setProgress[i] = 0;
}

export function value(s, item, i) {
  return Math.max(1, Math.min(maxValue(item), parseInt(s.values[i]) || item.value));
}

export function changeValue(s, item, i, v) {
  s.values[i] = Math.max(1, Math.min(maxValue(item), parseInt(v) || 1));
}

export function weight(s, i) {
  return normalizeWeight(s.weights[i]);
}

export function changeWeight(s, i, v) {
  s.weights[i] = ALLOWED_WEIGHTS.includes(+v) ? +v : normalizeWeight(v);
}
