import test from "node:test";
import assert from "node:assert/strict";
import * as S from "../src/state/state.js";
import { workouts } from "../src/data/workouts.js";

const fresh = () => S.prepareState({}, workouts, "2026-10-17");

test("3 sets: SET 0/3 -> 1/3 -> 2/3 -> done 3/3", () => {
  const st = fresh(), s = st.sessions.kb, item = workouts.kb.items[0];
  S.changeSetCount(s, item, 0, 3);
  assert.equal(S.setProgress(s, item, 0), 0);
  S.advanceSet(s, item, 0); assert.equal(S.setProgress(s, item, 0), 1); assert.ok(!s.done.includes(0));
  S.advanceSet(s, item, 0); assert.equal(S.setProgress(s, item, 0), 2); assert.ok(!s.done.includes(0));
  S.advanceSet(s, item, 0); assert.equal(S.setProgress(s, item, 0), 3); assert.ok(s.done.includes(0));
  S.advanceSet(s, item, 0); assert.equal(S.setProgress(s, item, 0), 3, "never exceeds target");
  S.resetExercise(s, 0);
  assert.equal(S.setProgress(s, item, 0), 0); assert.ok(!s.done.includes(0));
});

test("all set counts 1-4 work and changing the count keeps progress consistent", () => {
  const st = fresh(), s = st.sessions.wall, item = workouts.wall.items[0];
  for (const n of S.ALLOWED_SETS) {
    S.resetExercise(s, 0);
    S.changeSetCount(s, item, 0, n);
    for (let k = 0; k < n; k++) S.advanceSet(s, item, 0);
    assert.ok(s.done.includes(0), "done with " + n);
  }
  S.resetExercise(s, 0); S.changeSetCount(s, item, 0, 4);
  S.advanceSet(s, item, 0); S.advanceSet(s, item, 0);
  S.changeSetCount(s, item, 0, 2); assert.ok(s.done.includes(0));
  S.changeSetCount(s, item, 0, 3); assert.ok(!s.done.includes(0)); assert.equal(S.setProgress(s, item, 0), 2);
  S.changeSetCount(s, item, 0, 9); assert.equal(s.sets[0], 4);
});

test("reps and time are clamped (reps 1-50, time 1-180)", () => {
  const st = fresh(), kb = st.sessions.kb, stretch = st.sessions.stretch;
  const r = workouts.kb.items[0], t = workouts.stretch.items[0];
  assert.equal(S.value(kb, r, 0), 12);
  S.changeValue(kb, r, 0, 13); assert.equal(S.value(kb, r, 0), 13);
  S.changeValue(kb, r, 0, 99); assert.equal(S.value(kb, r, 0), 50);
  S.changeValue(kb, r, 0, 0); assert.equal(S.value(kb, r, 0), 1);
  assert.equal(S.value(stretch, t, 0), 45);
  S.changeValue(stretch, t, 0, 45 + t.step); assert.equal(S.value(stretch, t, 0), 50);
  S.changeValue(stretch, t, 0, 500); assert.equal(S.value(stretch, t, 0), 180);
});

test("weight is limited to 8 / 16 / 32 kg", () => {
  const s = fresh().sessions.kb;
  assert.equal(S.weight(s, 0), 8);
  for (const w of [8, 16, 32]) { S.changeWeight(s, 0, w); assert.equal(S.weight(s, 0), w); }
  S.changeWeight(s, 0, 20); assert.equal(S.weight(s, 0), 16);
  S.changeWeight(s, 0, 30); assert.equal(S.weight(s, 0), 32);
});

test("same day keeps progress, next day resets it", () => {
  const st = fresh(), s = st.sessions.kb, item = workouts.kb.items[0];
  S.advanceSet(s, item, 0);
  assert.equal(S.resetDailyProgress(st, workouts, "2026-10-17"), false);
  assert.equal(S.setProgress(s, item, 0), 1);
  assert.equal(S.resetDailyProgress(st, workouts, "2026-10-18"), true);
  assert.equal(S.setProgress(st.sessions.kb, item, 0), 0);
});
