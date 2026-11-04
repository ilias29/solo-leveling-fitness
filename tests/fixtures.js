// Shapes of soloState written by previous versions of the app (see git history of index.html).
export const legacy = {
  // 8d45f42: first version
  v_initial: { xp: 150, done: [0, 1] },
  // ed0bf5c: editable reps
  v_reps: { xp: 200, done: [0], reps: { 0: 15, 3: 12 } },
  // 2925da2: wall mode, sessions per mode
  v_sessions: {
    xp: 270, done: [0], reps: { 0: 15 }, activeMode: "wall",
    sessions: { kb: { done: [0], values: { 0: 15 } }, wall: { done: [1, 2], values: { 0: 45 } } }
  },
  // c0767ac: HP with ON/OFF toggle, weights, sets, alternatives
  v_hp_toggle: {
    xp: 420, hp: 90, hpDecayEnabled: false, hpPenaltyWeeksApplied: 1, questDays: ["2026-10-01"], activeMode: "kb",
    sessions: {
      kb: { done: [2], values: { 0: 14 }, weights: { 0: 16, 1: 32 }, sets: { 0: 3, 2: 1 }, alternatives: { 1: true } },
      wall: { done: [], values: {}, weights: {}, sets: {}, alternatives: {} }
    }
  },
  // ebb117f (current main): stretching + per-set progress
  v_current: {
    xp: 650, hp: 100, hpDecayEnabled: true, hpPenaltyWeeksApplied: 0,
    questDays: ["2026-10-14", "2026-10-15", "2026-10-16"], activeMode: "stretch", done: [], reps: {},
    sessions: {
      kb: { done: [0], values: { 0: 12, 1: 8, 2: 10, 3: 10, 4: 10, 5: 6, 6: 20 }, weights: { 0: 16, 1: 8, 2: 16, 3: 8, 4: 8, 5: 8, 6: 32 }, sets: { 0: 3, 1: 2, 2: 4, 3: 2, 4: 2, 5: 2, 6: 3 }, alternatives: { 2: true, 6: true }, setProgress: { 0: 3, 1: 1, 2: 0, 3: 0, 4: 0, 5: 0, 6: 2 } },
      wall: { done: [], values: { 0: 40, 1: 12 }, weights: {}, sets: { 0: 2, 1: 3 }, alternatives: {}, setProgress: { 0: 1 } },
      stretch: { done: [], values: { 0: 60 }, weights: {}, sets: { 0: 2 }, alternatives: {}, setProgress: { 0: 1 } }
    }
  }
};

export function memoryStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
    keys: () => [...m.keys()],
    map: m
  };
}

export const clone = o => JSON.parse(JSON.stringify(o));
