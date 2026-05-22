// Pure date / formatting helpers. No DOM, no other-module dependencies.

export function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysBetween(a, b) {
  const ms = startOfDay(b) - startOfDay(a);
  return Math.round(ms / 86400000);
}

export function fmtWeekday(d) {
  return d.toLocaleDateString('en-AU', { weekday: 'long' });
}

export function fmtToday(d) {
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function parseISODate(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function isoDate(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
export function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.floor((startOfDay(d) - start) / 86400000) + 1;
}

export function fmtAssessDate(d, noTime) {
  const date = d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'long' });
  if (noTime) return date;
  const time = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${date} · ${time}`;
}

export function fmtExamDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function fmtTimeStr(t) {
  if (!t) return '';
  const [hh, mm] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function urgencyColor(days) {
  if (days < 0)  return '#5f6470';   // past — muted
  if (days <= 2) return '#e74c3c';   // red — imminent
  if (days <= 7) return '#f39c12';   // orange — this week
  if (days <= 14) return '#e8b86b';  // amber — next two weeks
  return '#8ab4d8';                  // blue — plenty of time
}
