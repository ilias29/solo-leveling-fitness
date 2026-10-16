import test from "node:test";
import assert from "node:assert/strict";
import { migrate, SCHEMA_VERSION, SEED_DAYS } from "../src/state/migrations.js";
import { prepareState } from "../src/state/state.js";
import { workouts } from "../src/data/workouts.js";
import { legacy, clone } from "./fixtures.js";

const TODAY = "2026-10-17";

test("every legacy shape migrates to the current schema", () => {
  for (const [name, fx] of Object.entries(legacy)) {
    const s = prepareState(clone(fx), workouts, TODAY);
    assert.equal(s.schemaVersion, SCHEMA_VERSION, name);
    assert.equal(s.xp, fx.xp, name + " xp");
    for (const d of SEED_DAYS) assert.ok(s.questDays.includes(d), name + " seed " + d);
    for (const m of ["kb", "wall", "stretch"]) {
      assert.equal(workouts[m].items.length, Object.keys(s.sessions[m].values).length, name + " " + m);
    }
    assert.equal(s.sessionDate, TODAY);
    assert.deepEqual(s.lastXpDate, {});
  }
});

test("legacy fields are preserved, never deleted", () => {
  const s = migrate(clone(legacy.v_current), TODAY);
  assert.equal(s.hpDecayEnabled, true);
  assert.deepEqual(s.done, []);
  assert.deepEqual(s.reps, {});
  const r = migrate(clone(legacy.v_reps), TODAY);
  assert.deepEqual(r.reps, { 0: 15, 3: 12 });
  assert.deepEqual(r.done, [0]);
});

test("first-version kb progress and reps move into sessions.kb", () => {
  const s = prepareState(clone(legacy.v_reps), workouts, TODAY);
  assert.equal(s.sessions.kb.values[0], 15);
  assert.equal(s.sessions.kb.values[3], 12);
  assert.ok(s.sessions.kb.done.includes(0));
  assert.equal(s.sessions.kb.setProgress[0], 2);
});

test("current main state keeps every user setting", () => {
  const fx = legacy.v_current;
  const s = prepareState(clone(fx), workouts, TODAY);
  assert.equal(s.hp, 100);
  assert.equal(s.activeMode, "stretch");
  assert.deepEqual(s.questDays, fx.questDays);
  for (const m of ["kb", "wall", "stretch"]) {
    const a = fx.sessions[m], b = s.sessions[m];
    for (const k of Object.keys(a.values)) assert.equal(b.values[k], a.values[k], m + " values " + k);
    for (const k of Object.keys(a.sets)) assert.equal(b.sets[k], a.sets[k], m + " sets " + k);
    for (const k of Object.keys(a.setProgress)) assert.equal(b.setProgress[k], a.setProgress[k], m + " progress " + k);
    assert.deepEqual(b.alternatives, a.alternatives);
  }
  for (const k of Object.keys(fx.sessions.kb.weights)) assert.equal(s.sessions.kb.weights[k], fx.sessions.kb.weights[k]);
  assert.deepEqual(s.sessions.kb.done, [0]);
});

test("HP-toggle era state keeps HP, penalty counter, weights, sets and alternatives", () => {
  const s = prepareState(clone(legacy.v_hp_toggle), workouts, TODAY);
  assert.equal(s.hp, 90);
  assert.equal(s.hpPenaltyWeeksApplied, 1);
  assert.equal(s.sessions.kb.weights[1], 32);
  assert.equal(s.sessions.kb.sets[0], 3);
  assert.equal(s.sessions.kb.alternatives[1], true);
  assert.ok(s.questDays.includes("2026-10-01"));
});

test("migration is idempotent", () => {
  const once = prepareState(clone(legacy.v_current), workouts, TODAY);
  const twice = prepareState(clone(once), workouts, TODAY);
  assert.deepEqual(twice, once);
});

test("numeric strings are coerced instead of being reset", () => {
  const s = migrate({ xp: "320", hp: "70", hpPenaltyWeeksApplied: "1" }, TODAY);
  assert.equal(s.xp, 320);
  assert.equal(s.hp, 70);
  assert.equal(s.hpPenaltyWeeksApplied, 1);
});

test("fresh install starts with defaults and the seed days", () => {
  const s = prepareState({}, workouts, TODAY);
  assert.equal(s.xp, 0);
  assert.equal(s.hp, 100);
  assert.equal(s.activeMode, "kb");
  assert.deepEqual(s.questDays, SEED_DAYS);
  assert.equal(s.sessions.kb.weights[0], 8);
});

test("progress of a previous day is cleared, settings and history are kept", () => {
  const fx = clone(legacy.v_current);
  const first = prepareState(fx, workouts, TODAY);
  const next = prepareState(clone(first), workouts, "2026-10-18");
  assert.equal(next.sessionDate, "2026-10-18");
  for (const m of ["kb", "wall", "stretch"]) {
    assert.deepEqual(next.sessions[m].done, []);
    assert.ok(Object.values(next.sessions[m].setProgress).every(v => v === 0));
    assert.deepEqual(next.sessions[m].values, first.sessions[m].values);
    assert.deepEqual(next.sessions[m].sets, first.sessions[m].sets);
    assert.deepEqual(next.sessions[m].alternatives, first.sessions[m].alternatives);
  }
  assert.deepEqual(next.sessions.kb.weights, first.sessions.kb.weights);
  assert.deepEqual(next.questDays, first.questDays);
  assert.equal(next.xp, first.xp);
});
