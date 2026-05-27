// HSC exam timetable: localStorage CRUD + Settings list UI.

import { fmtExamDate, fmtTimeStr } from './utils.js';
import { createDatePicker, createTimePicker } from './pickers.js';
import { paintYearGrid } from './yeargrid.js';
import { rebuildHsc } from './assessments.js';

const EXAMS_KEY = 'countdown.exams.v1';
const SEED_KEY  = 'countdown.exams.seeded.v2';
const DEFAULT_EXAMS = [
  { date: '2026-10-13', subject: 'English Advanced Paper 1' },
  { date: '2026-10-14', subject: 'English Advanced Paper 2' },
];

export function seedDefaultExams() {
  if (localStorage.getItem(SEED_KEY)) return;
  const existing = (() => {
    try { return JSON.parse(localStorage.getItem(EXAMS_KEY) || '[]'); }
    catch (_) { return []; }
  })();
  const seeded = DEFAULT_EXAMS.map(e => ({
    ...e,
    id: 'seed-' + e.date,
  }));
  const merged = [...existing];
  seeded.forEach(s => {
    if (!merged.some(m => m.date === s.date && m.subject === s.subject)) merged.push(s);
  });
  localStorage.setItem(EXAMS_KEY, JSON.stringify(merged));
  localStorage.setItem(SEED_KEY, '1');
}

export function loadExams() {
  try { return JSON.parse(localStorage.getItem(EXAMS_KEY) || '[]'); }
  catch (_) { return []; }
}
export function saveExams(list) {
  localStorage.setItem(EXAMS_KEY, JSON.stringify(list));
}

export function renderExamList() {
  const list = loadExams().sort((a, b) => a.date.localeCompare(b.date));
  const root = document.getElementById('exam-list');
  if (!list.length) {
    root.innerHTML = '<div class="exam-empty">No exams added yet. Add your first above.</div>';
    return;
  }
  root.innerHTML = '';
  list.forEach(exam => root.appendChild(buildExamRow(exam)));
}

function buildExamRow(exam) {
  const row = document.createElement('div');
  row.className = 'exam-row';
  const dateLabel = fmtExamDate(exam.date) + (exam.time ? ' · ' + fmtTimeStr(exam.time) : '');
  row.innerHTML = `
    <span class="date">${dateLabel}</span>
    <span class="subject"></span>
    <div class="actions">
      <button class="btn ghost row-edit">Edit</button>
      <button class="btn ghost row-remove">Remove</button>
    </div>
  `;
  row.querySelector('.subject').textContent = exam.subject;
  row.querySelector('.row-edit').addEventListener('click', () => {
    row.replaceWith(buildExamEditRow(exam));
  });
  row.querySelector('.row-remove').addEventListener('click', () => {
    saveExams(loadExams().filter(e => e.id !== exam.id));
    renderExamList();
    paintYearGrid();
    rebuildHsc();
  });
  return row;
}

function buildExamEditRow(exam) {
  const row = document.createElement('div');
  row.className = 'exam-row editing';
  const dateCell = document.createElement('div');
  const datePicker = createDatePicker(exam.date);
  dateCell.appendChild(datePicker);
  row.appendChild(dateCell);
  const timeCell = document.createElement('div');
  const timePicker = createTimePicker(exam.time || '');
  timeCell.appendChild(timePicker);
  row.appendChild(timeCell);
  const subjectInput = document.createElement('input');
  subjectInput.type = 'text';
  subjectInput.className = 'edit-subject';
  subjectInput.placeholder = 'Subject';
  subjectInput.setAttribute('list', 'subjects-list');
  subjectInput.autocomplete = 'off';
  subjectInput.required = true;
  subjectInput.value = exam.subject;
  row.appendChild(subjectInput);
  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.innerHTML = `
    <button type="button" class="btn ghost row-save">Save</button>
    <button type="button" class="btn ghost row-cancel">Cancel</button>
  `;
  row.appendChild(actions);
  actions.querySelector('.row-save').addEventListener('click', () => {
    const date = datePicker.getValue();
    const time = timePicker.getValue();
    const subject = subjectInput.value.trim();
    if (!date || !subject) return;
    const updated = loadExams().map(e => e.id === exam.id ? { ...e, date, subject, time } : e);
    saveExams(updated);
    renderExamList();
    paintYearGrid();
    rebuildHsc();
  });
  actions.querySelector('.row-cancel').addEventListener('click', () => {
    row.replaceWith(buildExamRow(exam));
  });
  return row;
}

export function setupExamForm() {
  const form = document.getElementById('exam-form');
  const datePicker = createDatePicker('');
  const timePicker = createTimePicker('');
  document.getElementById('exam-date-host').appendChild(datePicker);
  document.getElementById('exam-time-host').appendChild(timePicker);
  form.addEventListener('submit', e => {
    e.preventDefault();
    const date = datePicker.getValue();
    const time = timePicker.getValue();
    const subject = document.getElementById('exam-subject').value.trim();
    if (!date || !subject) return;
    const exams = loadExams();
    exams.push({ id: Date.now() + '-' + Math.random().toString(36).slice(2, 7), date, subject, time });
    saveExams(exams);
    document.getElementById('exam-subject').value = '';
    datePicker.setValue('');
    timePicker.setValue('');
    renderExamList();
    paintYearGrid();
    rebuildHsc();
  });
}
