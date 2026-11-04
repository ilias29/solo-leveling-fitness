import { dayNumber, isDayKey, weekNumber } from "./dates.js";

export const WEEKLY_TARGET_DAYS = 5;

export function sortedDays(days) {
  return [...new Set((Array.isArray(days) ? days : []).filter(isDayKey))].sort();
}

export function latestWorkoutDay(days) {
  const d = sortedDays(days);
  return d.length ? d[d.length - 1] : null;
}

export function currentStreak(days, today) {
  const d = sortedDays(days);
  if (!d.length) return 0;
  let i = d.length - 1, last = dayNumber(d[i]);
  if (dayNumber(today) - last > 1) return 0;
  let streak = 1;
  while (i > 0) {
    const prev = dayNumber(d[i - 1]);
    if (last - prev !== 1) break;
    streak++; last = prev; i--;
  }
  return streak;
}

// Unique workout days in the current Monday–Sunday week.
export function daysThisWeek(days, today) {
  const week = weekNumber(today);
  return sortedDays(days).filter(d => weekNumber(d) === week && d <= today).length;
}

export function recordWorkoutDay(state, today) {
  state.questDays = sortedDays(state.questDays);
  if (!state.questDays.includes(today)) state.questDays.push(today);
  state.questDays.sort();
  state.hpPenaltyWeeksApplied = 0;
}
