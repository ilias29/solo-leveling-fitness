export const XP_PER_LEVEL = 300;

export function levelInfo(xp) {
  return { level: Math.floor(xp / XP_PER_LEVEL) + 1, rem: xp % XP_PER_LEVEL };
}

export function xpClaimedToday(state, mode, today) {
  return state.lastXpDate?.[mode] === today;
}

// XP is granted at most once per calendar day per workout mode.
export function awardQuestXp(state, mode, amount, today) {
  if (xpClaimedToday(state, mode, today)) return 0;
  state.xp += amount;
  state.lastXpDate = { ...state.lastXpDate, [mode]: today };
  return amount;
}
