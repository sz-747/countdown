// Assessment cards (Assessments / UA / HSC tabs) + custom assessment CRUD,
// plus the generic card renderer shared with categories.

import { daysBetween, fmtAssessDate, urgencyColor, fmtExamDate, fmtTimeStr } from './utils.js';
import { now } from './time.js';
import { createDatePicker, createTimePicker } from './pickers.js';
import { switchTo } from './tabs.js';
import { loadExams } from './exams.js';
import { buildCategoryEditCard, removeCard } from './categories.js';
import { update } from './refresh.js';
import { breakdown } from './countdown.js';

// New visitors start with an empty Assessments grid — no demo cards seeded.
const DEFAULT_ASSESSMENTS = [];
const ASSESSMENTS_SEED_KEY = 'countdown.assessments.seeded.v1';

// UA cards are not shown by default — empty for all visitors.
export const UA = [];

const CUSTOM_ASSESS_KEY = 'countdown.customAssessments.v1';

export function buildAssessCards(list, gridId = 'assess-grid', opts = {}) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = '';
  list.forEach(a => {
    const card = document.createElement('section');
    card.className = 'card assess-card';
    card.innerHTML = `
      <div class="label"><span></span></div>
      <div class="name"></div>
      <div class="display">
        <div class="number" id="assess-num-${a.id}">—</div>
        <div class="unit" id="assess-unit-${a.id}">days</div>
      </div>
      <div class="meta"></div>
      <div class="ticker" id="assess-ticker-${a.id}">
        <div class="cell"><span class="v" data-u="days">—</span><span class="k">Days</span></div>
        <div class="cell"><span class="v" data-u="hours">—</span><span class="k">Hours</span></div>
        <div class="cell"><span class="v" data-u="minutes">—</span><span class="k">Mins</span></div>
        <div class="cell"><span class="v live" data-u="seconds">—</span><span class="k">Secs</span></div>
      </div>
    `;
    card.querySelector('.label span').textContent = a.label;
    card.querySelector('.name').textContent = a.name;
    card.querySelector('.meta').textContent = fmtAssessDate(a.date, a.noTime);
    if (opts.withActions) {
      const actions = document.createElement('div');
      actions.className = 'card-actions';
      actions.innerHTML = `
        <button type="button" class="btn ghost card-edit">Edit</button>
        <button type="button" class="btn ghost card-remove">Remove</button>
      `;
      actions.querySelector('.card-edit').addEventListener('click', () => {
        card.replaceWith(buildCategoryEditCard(a._catId, a._cardId, gridId));
      });
      actions.querySelector('.card-remove').addEventListener('click', () => {
        removeCard(a._catId, a._cardId);
      });
      card.appendChild(actions);
    }
    grid.appendChild(card);
  });
  if (!list.length && gridId === 'assess-grid') {
    const empty = document.createElement('div');
    empty.className = 'assess-empty';
    empty.innerHTML = `
      <p>No assessment cards yet.</p>
      <button type="button" class="btn" id="assess-empty-cta">Create your first in Settings</button>
    `;
    empty.querySelector('#assess-empty-cta').addEventListener('click', () => switchTo('settings'));
    grid.appendChild(empty);
  }
}

export function updateAssessments(list) {
  const current = now();
  list.forEach(a => {
    const days = daysBetween(current, a.date);
    const numEl = document.getElementById('assess-num-' + a.id);
    const unitEl = document.getElementById('assess-unit-' + a.id);
    if (!numEl || !unitEl) return;
    if (days > 0) {
      const b = breakdown(current, a.date);
      if (b.months >= 1) {
        // Far out: read as "2 months 1 week" instead of a big raw day count.
        numEl.textContent = b.months;
        let unit = b.months === 1 ? 'month' : 'months';
        if (b.weeks > 0) unit += ` ${b.weeks} week${b.weeks === 1 ? '' : 's'}`;
        unitEl.textContent = unit;
      } else {
        numEl.textContent = days;
        unitEl.textContent = days === 1 ? 'day' : 'days';
      }
    }
    else if (days === 0) { numEl.textContent = '0'; unitEl.textContent = 'today'; }
    else { numEl.textContent = Math.abs(days); unitEl.textContent = 'days ago'; }

    numEl.closest('.assess-card').style.setProperty('--card-accent', urgencyColor(days));
  });
}

export function loadCustomAssessmentsRaw() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_ASSESS_KEY) || '[]'); }
  catch (_) { return []; }
}
export function saveCustomAssessmentsRaw(list) {
  localStorage.setItem(CUSTOM_ASSESS_KEY, JSON.stringify(list));
}
function customAssessmentObjects() {
  return loadCustomAssessmentsRaw().map(a => {
    const [y, m, d] = a.dateStr.split('-').map(Number);
    if (a.timeStr) {
      const [hh, mm] = a.timeStr.split(':').map(Number);
      return { id: a.id, label: a.label, name: a.name, date: new Date(y, m - 1, d, hh, mm), noTime: false };
    }
    return { id: a.id, label: a.label, name: a.name, date: new Date(y, m - 1, d), noTime: true };
  });
}
export function allAssessments() {
  return customAssessmentObjects().sort((a, b) => a.date - b.date);
}

export function seedDefaultAssessments() {
  if (localStorage.getItem(ASSESSMENTS_SEED_KEY)) return;
  const existing = loadCustomAssessmentsRaw();
  const merged = [...existing];
  DEFAULT_ASSESSMENTS.forEach(d => {
    if (!merged.some(m => m.id === d.id)) merged.push(d);
  });
  saveCustomAssessmentsRaw(merged);
  localStorage.setItem(ASSESSMENTS_SEED_KEY, '1');
}
export function hscAssessments() {
  return loadExams().map(e => {
    const [y, m, d] = e.date.split('-').map(Number);
    if (e.time) {
      const [hh, mm] = e.time.split(':').map(Number);
      return { id: 'hsc-' + e.id, label: e.subject, name: e.subject, date: new Date(y, m - 1, d, hh, mm), noTime: false };
    }
    return { id: 'hsc-' + e.id, label: e.subject, name: e.subject, date: new Date(y, m - 1, d), noTime: true };
  }).sort((a, b) => a.date - b.date);
}
export function rebuildAssessments() {
  buildAssessCards(allAssessments(), 'assess-grid');
  update();
}
export function rebuildHsc() {
  buildAssessCards(hscAssessments(), 'hsc-grid');
  update();
}

export function renderCustomAssessList() {
  const list = loadCustomAssessmentsRaw().slice().sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  const root = document.getElementById('assess-list');
  if (!list.length) {
    root.innerHTML = '<div class="exam-empty">No custom assessments added.</div>';
    return;
  }
  root.innerHTML = '';
  list.forEach(a => root.appendChild(buildCustomAssessRow(a)));
}

function buildCustomAssessRow(a) {
  const row = document.createElement('div');
  row.className = 'exam-row';
  const dateLabel = fmtExamDate(a.dateStr) + (a.timeStr ? ' · ' + fmtTimeStr(a.timeStr) : '');
  row.innerHTML = `
    <span class="date">${dateLabel}</span>
    <span class="subject"></span>
    <div class="actions">
      <button class="btn ghost row-edit">Edit</button>
      <button class="btn ghost row-remove">Remove</button>
    </div>
  `;
  row.querySelector('.subject').textContent = a.name;
  row.querySelector('.row-edit').addEventListener('click', () => {
    row.replaceWith(buildCustomAssessEditRow(a));
  });
  row.querySelector('.row-remove').addEventListener('click', () => {
    saveCustomAssessmentsRaw(loadCustomAssessmentsRaw().filter(e => e.id !== a.id));
    renderCustomAssessList();
    rebuildAssessments();
  });
  return row;
}

function buildCustomAssessEditRow(a) {
  const row = document.createElement('div');
  row.className = 'exam-row editing';
  const dateCell = document.createElement('div');
  const datePicker = createDatePicker(a.dateStr);
  dateCell.appendChild(datePicker);
  row.appendChild(dateCell);
  const timeCell = document.createElement('div');
  const timePicker = createTimePicker(a.timeStr || '');
  timeCell.appendChild(timePicker);
  row.appendChild(timeCell);
  const subjectInput = document.createElement('input');
  subjectInput.type = 'text';
  subjectInput.className = 'edit-subject';
  subjectInput.placeholder = 'Subject';
  subjectInput.autocomplete = 'off';
  subjectInput.required = true;
  subjectInput.value = a.name;
  row.appendChild(subjectInput);
  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.innerHTML = `
    <button type="button" class="btn ghost row-save">Save</button>
    <button type="button" class="btn ghost row-cancel">Cancel</button>
  `;
  row.appendChild(actions);
  actions.querySelector('.row-save').addEventListener('click', () => {
    const dateStr = datePicker.getValue();
    const timeStr = timePicker.getValue();
    const subject = subjectInput.value.trim();
    if (!dateStr || !subject) return;
    const updated = loadCustomAssessmentsRaw().map(e =>
      e.id === a.id ? { ...e, dateStr, timeStr, label: subject, name: subject } : e
    );
    saveCustomAssessmentsRaw(updated);
    renderCustomAssessList();
    rebuildAssessments();
  });
  actions.querySelector('.row-cancel').addEventListener('click', () => {
    row.replaceWith(buildCustomAssessRow(a));
  });
  return row;
}

export function setupAssessForm() {
  const form = document.getElementById('assess-form');
  const datePicker = createDatePicker('');
  const timePicker = createTimePicker('');
  document.getElementById('assess-date-host').appendChild(datePicker);
  document.getElementById('assess-time-host').appendChild(timePicker);
  form.addEventListener('submit', e => {
    e.preventDefault();
    const dateStr = datePicker.getValue();
    const timeStr = timePicker.getValue();
    const subject = document.getElementById('assess-subject').value.trim();
    if (!dateStr || !subject) return;
    const id = 'custom-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const list = loadCustomAssessmentsRaw();
    list.push({ id, label: subject, name: subject, dateStr, timeStr });
    saveCustomAssessmentsRaw(list);
    document.getElementById('assess-subject').value = '';
    datePicker.setValue('');
    timePicker.setValue('');
    renderCustomAssessList();
    rebuildAssessments();
  });
}

