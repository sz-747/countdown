// The per-second / per-update heartbeat that repaints every countdown.
// Imported widely; only calls its dependencies at runtime (no top-level calls),
// so the circular imports with assessments/categories resolve cleanly.

import { daysBetween, fmtWeekday, fmtToday } from './utils.js';
import { now } from './time.js';
import {
  TRIALS, HSC, START,
  setCountdown, setProgress, paintTicker, breakdown, simpleBreakdown,
} from './countdown.js';
import { updateAssessments, allAssessments, hscAssessments, UA } from './assessments.js';
import { loadCategories, categoryCardObjects } from './categories.js';
import { paintYearGrid } from './yeargrid.js';

export function update() {
  const current = now();
  document.getElementById('today').textContent = fmtToday(current);
  document.getElementById('trials-weekday').textContent = fmtWeekday(TRIALS);
  document.getElementById('hsc-weekday').textContent    = fmtWeekday(HSC);

  const dTrials = daysBetween(current, TRIALS);
  const dHsc    = daysBetween(current, HSC);

  setCountdown('trials', dTrials);
  setCountdown('hsc', dHsc);

  setProgress('trials-bar', current, START, TRIALS);
  setProgress('hsc-bar',    current, START, HSC);

  updateAssessments(allAssessments());
  updateAssessments(UA);
  updateAssessments(hscAssessments());
  loadCategories().forEach(c => updateAssessments(categoryCardObjects(c)));
  tick();
  if (document.getElementById('year-grid').children.length) paintYearGrid();
}

export function tick() {
  const current = now();
  paintTicker('trials-ticker', breakdown(current, TRIALS));
  paintTicker('hsc-ticker',    breakdown(current, HSC));
  allAssessments().forEach(a => paintTicker('assess-ticker-' + a.id, simpleBreakdown(current, a.date)));
  UA.forEach(a => paintTicker('assess-ticker-' + a.id, simpleBreakdown(current, a.date)));
  hscAssessments().forEach(a => paintTicker('assess-ticker-' + a.id, simpleBreakdown(current, a.date)));
  loadCategories().forEach(c => categoryCardObjects(c).forEach(a => paintTicker('assess-ticker-' + a.id, simpleBreakdown(current, a.date))));
}
