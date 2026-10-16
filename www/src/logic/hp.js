import { dayNumber } from "./dates.js";
import { latestWorkoutDay } from "./streak.js";

export const MAX_HP = 100;
export const HP_PENALTY = 10;
export const INACTIVITY_DAYS = 7;

// Last workout 16/10 -> -10 HP on 23/10, another -10 on 30/10, etc.
export function applyHpDecay(state, today) {
  const last = latestWorkoutDay(state.questDays);
  if (!last) return false;
  const periods = Math.floor(Math.max(0, dayNumber(today) - dayNumber(last)) / INACTIVITY_DAYS);
  if (periods <= state.hpPenaltyWeeksApplied) return false;
  state.hp = Math.max(0, state.hp - (periods - state.hpPenaltyWeeksApplied) * HP_PENALTY);
  state.hpPenaltyWeeksApplied = periods;
  return true;
}
