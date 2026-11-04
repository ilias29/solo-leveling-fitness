const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDayKey(key) {
  return typeof key === "string" && DAY_RE.test(key);
}

export function todayKey(date = new Date()) {
  const p = n => String(n).padStart(2, "0");
  return date.getFullYear() + "-" + p(date.getMonth() + 1) + "-" + p(date.getDate());
}

export function dayNumber(key) {
  const a = String(key).split("-").map(Number);
  return Math.floor(Date.UTC(a[0], a[1] - 1, a[2]) / 86400000);
}

// Monday-based week index (1970-01-05 was a Monday, dayNumber 4).
export function weekNumber(key) {
  return Math.floor((dayNumber(key) - 4) / 7);
}
