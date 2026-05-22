// Core countdown maths + the two headline (Trials / HSC) displays.

export const TRIALS = new Date(2026, 7, 3);   // 3 August 2026
export const HSC    = new Date(2026, 9, 13);  // 13 October 2026
export const START  = new Date(2026, 0, 28);  // notional Year 12 start for progress bar

export function setCountdown(prefix, days) {
  const numEl = document.getElementById(prefix + '-num');
  const unitEl = document.getElementById(prefix + '-unit');
  if (days > 0) {
    numEl.textContent = days;
    unitEl.textContent = days === 1 ? 'day' : 'days';
  } else if (days === 0) {
    numEl.textContent = '0';
    unitEl.textContent = 'today';
  } else {
    numEl.textContent = Math.abs(days);
    unitEl.textContent = 'days ago';
  }
}

export function setProgress(barId, now, start, end) {
  const total = end - start;
  const elapsed = now - start;
  const pct = Math.max(0, Math.min(1, elapsed / total));
  document.getElementById(barId).style.transform = `scaleX(${pct})`;
}

export function breakdown(from, to) {
  if (to <= from) return { months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  let y = from.getFullYear(), m = from.getMonth(), d = from.getDate();
  let hh = from.getHours(), mm = from.getMinutes(), ss = from.getSeconds();

  let months = (to.getFullYear() - y) * 12 + (to.getMonth() - m);
  let cursor = new Date(y, m + months, d, hh, mm, ss);
  if (cursor > to) {
    months -= 1;
    cursor = new Date(y, m + months, d, hh, mm, ss);
  }

  let remMs = to - cursor;
  const dayMs = 86400000;
  let totalDays = Math.floor(remMs / dayMs);
  remMs -= totalDays * dayMs;
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays - weeks * 7;
  const hours = Math.floor(remMs / 3600000); remMs -= hours * 3600000;
  const minutes = Math.floor(remMs / 60000);  remMs -= minutes * 60000;
  const seconds = Math.floor(remMs / 1000);

  return { months, weeks, days, hours, minutes, seconds };
}

export function simpleBreakdown(from, to) {
  let ms = to - from;
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const days = Math.floor(ms / 86400000); ms -= days * 86400000;
  const hours = Math.floor(ms / 3600000); ms -= hours * 3600000;
  const minutes = Math.floor(ms / 60000); ms -= minutes * 60000;
  const seconds = Math.floor(ms / 1000);
  return { days, hours, minutes, seconds };
}

export function paintTicker(id, parts) {
  const root = document.getElementById(id);
  if (!root) return;
  for (const el of root.querySelectorAll('.v')) {
    el.textContent = parts[el.dataset.u];
  }
}
