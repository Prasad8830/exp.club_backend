export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function startOfWeek(date = new Date()) {
  const d = startOfDay(date);
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // make Monday the first day
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

export function periodStartForFrequency(date = new Date(), frequency = "daily") {
  return frequency === "weekly" ? startOfWeek(date) : startOfDay(date);
}

export function computeStreak(checkIns = [], frequency = "daily") {
  if (!checkIns.length) return 0;
  const sorted = [...checkIns].sort((a, b) => b.periodStart - a.periodStart);
  let streak = 0;
  let current = periodStartForFrequency(new Date(), frequency).getTime();
  for (const ci of sorted) {
    const ts = new Date(ci.periodStart).getTime();
    if (ts === current) {
      streak += 1;
      current -= frequency === "weekly" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    } else if (ts < current) {
      break;
    }
  }
  return streak;
}
