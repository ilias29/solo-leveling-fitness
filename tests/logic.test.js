import test from "node:test";
import assert from "node:assert/strict";
import { levelInfo, awardQuestXp, xpClaimedToday } from "../src/logic/xp.js";
import { applyHpDecay } from "../src/logic/hp.js";
import { currentStreak, daysThisWeek, recordWorkoutDay } from "../src/logic/streak.js";
import { weekNumber } from "../src/logic/dates.js";
import { workouts } from "../src/data/workouts.js";

test("300 XP = 1 level", () => {
  assert.deepEqual(levelInfo(0), { level: 1, rem: 0 });
  assert.deepEqual(levelInfo(299), { level: 1, rem: 299 });
  assert.deepEqual(levelInfo(300), { level: 2, rem: 0 });
  assert.deepEqual(levelInfo(650), { level: 3, rem: 50 });
});

test("XP values per mode are unchanged", () => {
  assert.equal(workouts.kb.xp, 50);
  assert.equal(workouts.wall.xp, 20);
  assert.equal(workouts.stretch.xp, 15);
});

test("XP once per day per mode; different modes the same day all give XP", () => {
  const s = { xp: 0, lastXpDate: {} };
  assert.equal(awardQuestXp(s, "kb", 50, "2026-10-17"), 50);
  assert.equal(awardQuestXp(s, "kb", 50, "2026-10-17"), 0);
  assert.equal(awardQuestXp(s, "wall", 20, "2026-10-17"), 20);
  assert.equal(awardQuestXp(s, "stretch", 15, "2026-10-17"), 15);
  assert.equal(s.xp, 85);
  assert.ok(xpClaimedToday(s, "kb", "2026-10-17"));
  assert.equal(awardQuestXp(s, "kb", 50, "2026-10-18"), 50);
  assert.equal(s.xp, 135);
});

test("HP: last workout 16/10 -> -10 on 23/10, -20 on 30/10", () => {
  const s = { hp: 100, hpPenaltyWeeksApplied: 0, questDays: ["2026-10-16"] };
  for (const d of ["2026-10-17", "2026-10-20", "2026-10-22"]) { applyHpDecay(s, d); assert.equal(s.hp, 100, d); }
  applyHpDecay(s, "2026-10-23"); assert.equal(s.hp, 90);
  applyHpDecay(s, "2026-10-23"); assert.equal(s.hp, 90, "applied once per period");
  applyHpDecay(s, "2026-10-29"); assert.equal(s.hp, 90);
  applyHpDecay(s, "2026-10-30"); assert.equal(s.hp, 80);
});

test("HP: catching up after a long absence applies all missed periods once", () => {
  const s = { hp: 100, hpPenaltyWeeksApplied: 0, questDays: ["2026-10-16"] };
  applyHpDecay(s, "2026-11-13"); // 28 days
  assert.equal(s.hp, 60);
  applyHpDecay(s, "2026-11-13");
  assert.equal(s.hp, 60);
});

test("HP: a workout restarts the inactivity counter; rest days do not cost HP", () => {
  const s = { hp: 100, hpPenaltyWeeksApplied: 0, questDays: ["2026-10-16"] };
  applyHpDecay(s, "2026-10-23"); assert.equal(s.hp, 90);
  recordWorkoutDay(s, "2026-10-24");
  assert.equal(s.hpPenaltyWeeksApplied, 0);
  applyHpDecay(s, "2026-10-30"); assert.equal(s.hp, 90);
  applyHpDecay(s, "2026-10-31"); assert.equal(s.hp, 80);
});

test("HP never drops below 0", () => {
  const s = { hp: 15, hpPenaltyWeeksApplied: 0, questDays: ["2026-01-01"] };
  applyHpDecay(s, "2026-10-17");
  assert.equal(s.hp, 0);
});

test("streak counts consecutive days ending today or yesterday", () => {
  const days = ["2026-10-14", "2026-10-15", "2026-10-16"];
  assert.equal(currentStreak(days, "2026-10-16"), 3);
  assert.equal(currentStreak(days, "2026-10-17"), 3);
  assert.equal(currentStreak(days, "2026-10-18"), 0);
  assert.equal(currentStreak([...days, "2026-10-17"], "2026-10-17"), 4);
  assert.equal(currentStreak([], "2026-10-17"), 0);
});

test("DAYS = unique workout days of the current Monday–Sunday week", () => {
  assert.equal(weekNumber("2026-10-12"), weekNumber("2026-10-18")); // Mon..Sun
  assert.notEqual(weekNumber("2026-10-18"), weekNumber("2026-10-19"));
  const days = ["2026-10-09", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-16"];
  assert.equal(daysThisWeek(days, "2026-10-17"), 3);
  assert.equal(daysThisWeek(days, "2026-10-19"), 0);
  assert.equal(daysThisWeek(["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17"], "2026-10-18"), 6);
});

test("recordWorkoutDay adds today once and keeps history", () => {
  const s = { questDays: ["2026-10-14", "2026-10-16", "2026-10-15"], hpPenaltyWeeksApplied: 2 };
  recordWorkoutDay(s, "2026-10-17");
  recordWorkoutDay(s, "2026-10-17");
  assert.deepEqual(s.questDays, ["2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17"]);
  assert.equal(s.hpPenaltyWeeksApplied, 0);
});
