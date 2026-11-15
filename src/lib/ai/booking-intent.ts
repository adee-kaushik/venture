/**
 * Conservative IST booking parser for the Jaipur pilot.
 * Never interprets a date-less "4 pm" as a confirmed or pending slot.
 * Returns an explicit UTC ISO timestamp, or null when information is incomplete.
 */
export function parsePreferredTime(input: string, now: Date = new Date()): string | null {
  const text = input.toLowerCase();
  const inIst = new Date(now.getTime() + 330 * 60_000);
  let year = inIst.getUTCFullYear();
  let month = inIst.getUTCMonth() + 1;
  let day = inIst.getUTCDate();

  const iso = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  const indian = !iso && text.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d{2})\b/);
  const relatives = text.match(/\b(day after tomorrow|tomorrow|today)\b/);
  const weekday = text.match(/\b(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (iso) {
    year = Number(iso[1]); month = Number(iso[2]); day = Number(iso[3]);
  } else if (indian) {
    day = Number(indian[1]); month = Number(indian[2]); year = Number(indian[3]);
  } else if (relatives) {
    const extra = relatives[1] === "day after tomorrow" ? 2 : relatives[1] === "tomorrow" ? 1 : 0;
    const date = new Date(Date.UTC(year, month - 1, day + extra));
    year = date.getUTCFullYear(); month = date.getUTCMonth() + 1; day = date.getUTCDate();
  } else if (weekday) {
    const names = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
    const target = names.indexOf(weekday[2]);
    const days = (target - inIst.getUTCDay() + 7) % 7 || 7;
    const date = new Date(Date.UTC(year, month - 1, day + days));
    year = date.getUTCFullYear(); month = date.getUTCMonth() + 1; day = date.getUTCDate();
  } else {
    return null;
  }

  const ampm = text.match(/\b(?:at|around|by)?\s*(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b/);
  const clock24 = !ampm && text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (!ampm && !clock24) return null;
  let hour = Number(ampm ? ampm[1] : clock24![1]);
  const minute = Number(ampm ? (ampm[2] || "0") : clock24![2]);
  if (ampm) hour = (hour % 12) + (ampm[3] === "pm" ? 12 : 0);
  const localWallClock = Date.UTC(year, month - 1, day, hour, minute);
  const validated = new Date(localWallClock);
  if (validated.getUTCFullYear() !== year || validated.getUTCMonth() + 1 !== month ||
      validated.getUTCDate() !== day || validated.getUTCHours() !== hour) return null;
  const utc = new Date(localWallClock - 330 * 60_000);
  return utc.getTime() > now.getTime() + 60_000 ? utc.toISOString() : null;
}

export function collectContactDetails(texts: string[]): { name: string | null; phone: string | null } {
  const input = texts.slice(-8).join("\n");
  const phone = input.match(/(?:\+91[\s-]?)?[6-9]\d{9}\b/);
  let name: string | null = null;
  for (const text of [...texts].reverse()) {
    const match = text.match(/\b(?:my name is|i am|i'm|mera naam(?: hai)?|name(?: is|:)?|this is)\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})/i);
    if (match) {
      name = match[1].replace(/\s+(?:and|my|phone|contact|number|for|please|want|need)\b.*$/i, "").trim();
      if (name.length >= 2) break;
    }
    const compact = text.match(/^\s*([A-Za-z]{2,25}(?:\s+[A-Za-z]{2,25})?)\s*[,;:]?\s*(?:\+91[\s-]?)?[6-9]\d{9}\b/);
    if (compact) { name = compact[1].trim(); break; }
  }
  return {name: name || null, phone: phone ? phone[0].replace(/[\s-]/g, "") : null};
}
