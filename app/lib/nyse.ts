/** US equity (NYSE) session calculator: ET time zone, weekends, official NYSE holidays & early closes. */
// Source: NYSE holiday calendar (nyse.com/markets/hours-calendars). Extend yearly.
const HOLIDAYS = new Set([
  "2025-01-01","2025-01-09","2025-01-20","2025-02-17","2025-04-18","2025-05-26","2025-06-19","2025-07-04","2025-09-01","2025-11-27","2025-12-25",
  "2026-01-01","2026-01-19","2026-02-16","2026-04-03","2026-05-25","2026-06-19","2026-07-03","2026-09-07","2026-11-26","2026-12-25",
]);
const EARLY = new Set(["2025-07-03","2025-11-28","2025-12-24","2026-11-27","2026-12-24"]);

export function etParts(now = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false });
  const p = Object.fromEntries(fmt.formatToParts(now).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, weekday: p.weekday, hm: Number(p.hour) * 60 + Number(p.minute) };
}
export function session(now = new Date()): { status: "open" | "early" | "closed" | "holiday"; label: string } {
  const { date, weekday, hm } = etParts(now);
  if (HOLIDAYS.has(date) || weekday === "Sat" || weekday === "Sun") return { status: "holiday", label: "Market closed" };
  if (EARLY.has(date)) return hm >= 570 && hm < 780 ? { status: "early", label: "Early close" } : { status: "closed", label: "Market closed" };
  if (hm >= 570 && hm < 960) return { status: "open", label: "US market open" };
  return { status: "closed", label: "Market closed" };
}
