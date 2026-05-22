// The 365/366-cell calendar grid on the Year tab.

import { isLeap, dayOfYear } from './utils.js';
import { now } from './time.js';
import { TRIALS, HSC } from './countdown.js';
import { loadExams } from './exams.js';

const YEAR = 2026;

export function buildYearGrid() {
  const grid = document.getElementById('year-grid');
  grid.innerHTML = '';
  const total = isLeap(YEAR) ? 366 : 365;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let idx = 0;
  for (let m = 0; m < 12; m++) {
    const label = document.createElement('div');
    label.className = 'month-label';
    label.textContent = months[m];
    grid.appendChild(label);
    const daysInMonth = new Date(YEAR, m + 1, 0).getDate();
    for (let d = 1; d <= 31; d++) {
      const cell = document.createElement('div');
      if (d > daysInMonth) {
        cell.className = 'day empty';
      } else {
        cell.className = 'day';
        cell.dataset.idx = idx;
        cell.dataset.label = `${months[m]} ${d} · day ${idx + 1}`;
        idx++;
      }
      grid.appendChild(cell);
    }
  }
  document.getElementById('year-total').textContent = total;
}

export function paintYearGrid() {
  const current = now();
  const total = isLeap(YEAR) ? 366 : 365;
  const trialsIdx = dayOfYear(TRIALS) - 1;
  const hscIdx    = dayOfYear(HSC) - 1;
  const todayIdx  = current.getFullYear() === YEAR ? dayOfYear(current) - 1 : (current.getFullYear() < YEAR ? -1 : total);

  const examsByIdx = new Map();
  loadExams().forEach(exam => {
    const [y, m, d] = exam.date.split('-').map(Number);
    if (y !== YEAR) return;
    const idx = dayOfYear(new Date(y, m - 1, d)) - 1;
    if (!examsByIdx.has(idx)) examsByIdx.set(idx, []);
    examsByIdx.get(idx).push(exam.subject);
  });

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const cells = document.querySelectorAll('#year-grid .day:not(.empty)');
  let passed = 0;
  cells.forEach((cell, i) => {
    cell.classList.remove('past','today','trials','hsc','exam');
    if (i < todayIdx) { cell.classList.add('past'); passed++; }
    if (i === todayIdx) cell.classList.add('today');
    if (i === trialsIdx) cell.classList.add('trials');
    if (i === hscIdx)    cell.classList.add('hsc');
    if (examsByIdx.has(i)) cell.classList.add('exam');

    const d = new Date(YEAR, 0, 1 + i);
    let label = `${months[d.getMonth()]} ${d.getDate()} · day ${i+1}`;
    if (examsByIdx.has(i)) label += ' · ' + examsByIdx.get(i).join(', ');
    cell.dataset.label = label;
  });

  document.getElementById('year-passed').textContent = passed;
  document.getElementById('year-left').textContent = total - passed;
  document.getElementById('year-pct').textContent = (passed / total * 100).toFixed(1);
}
