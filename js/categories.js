// User-created category tabs, each holding its own countdown cards.

import { createDatePicker, createTimePicker } from './pickers.js';
import { buildAssessCards } from './assessments.js';
import { switchTo } from './tabs.js';
import { update } from './refresh.js';

const CATEGORIES_KEY = 'countdown.categories.v1';

// Which category views are currently in "editing" mode (add-form + per-card
// actions visible). A fresh/empty category starts editing; once saved it shows
// a clean grid until the user reopens it via the bottom "Edit countdowns" button.
const editingCats = new Set();

export function loadCategories() {
  try {
    const arr = JSON.parse(localStorage.getItem(CATEGORIES_KEY) || '[]');
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(c => c && c.id)
      .map(c => ({ id: c.id, name: c.name || 'Category', cards: Array.isArray(c.cards) ? c.cards : [] }));
  } catch (_) { return []; }
}
export function saveCategories(list) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(list));
}

export function categoryCardObjects(cat) {
  return cat.cards.map(c => {
    const [y, m, d] = c.dateStr.split('-').map(Number);
    let date, noTime;
    if (c.timeStr) {
      const [hh, mm] = c.timeStr.split(':').map(Number);
      date = new Date(y, m - 1, d, hh, mm); noTime = false;
    } else {
      date = new Date(y, m - 1, d); noTime = true;
    }
    return {
      id: 'cat-' + cat.id + '-' + c.id,
      label: cat.name, name: c.name, date, noTime,
      _catId: cat.id, _cardId: c.id,
    };
  }).sort((a, b) => a.date - b.date);
}

function populateCategoryGrid(cat) {
  const gridId = 'cat-grid-' + cat.id;
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const editing = editingCats.has(cat.id);
  if (!cat.cards.length) {
    grid.innerHTML = editing
      ? '<div class="exam-empty">No countdowns yet. Add one above.</div>'
      : '<div class="exam-empty">No countdowns yet.</div>';
    return;
  }
  buildAssessCards(categoryCardObjects(cat), gridId, { withActions: editing });
}

// Flip a category view between editing (form + per-card actions) and the clean
// saved view, then repaint its grid so the per-card actions follow suit.
function setCategoryEditing(catId, editing) {
  if (editing) editingCats.add(catId);
  else editingCats.delete(catId);
  const view = document.getElementById('view-cat-' + catId);
  if (view) {
    view.classList.toggle('editing', editing);
    view.classList.toggle('saved', !editing);
  }
  const cat = loadCategories().find(c => c.id === catId);
  if (cat) populateCategoryGrid(cat);
  update(); // repaint the freshly-built cards' day counts
}

function rebuildCategory(catId) {
  const cat = loadCategories().find(c => c.id === catId);
  if (!cat) return;
  populateCategoryGrid(cat);
  update();
}

function addCard(catId, card) {
  const cats = loadCategories();
  const cat = cats.find(c => c.id === catId);
  if (!cat) return;
  card.id = 'cd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  cat.cards.push(card);
  saveCategories(cats);
  rebuildCategory(catId);
}
export function removeCard(catId, cardId) {
  const cats = loadCategories();
  const cat = cats.find(c => c.id === catId);
  if (!cat) return;
  cat.cards = cat.cards.filter(c => c.id !== cardId);
  saveCategories(cats);
  rebuildCategory(catId);
}
function updateCard(catId, cardId, fields) {
  const cats = loadCategories();
  const cat = cats.find(c => c.id === catId);
  if (!cat) return;
  const card = cat.cards.find(c => c.id === cardId);
  if (!card) return;
  Object.assign(card, fields);
  saveCategories(cats);
  rebuildCategory(catId);
}

export function buildCategoryEditCard(catId, cardId, gridId) {
  const section = document.createElement('section');
  section.className = 'card assess-card cat-edit-card';
  const cat = loadCategories().find(c => c.id === catId);
  const card = cat && cat.cards.find(c => c.id === cardId);
  if (!card) return section;

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'cat-name';
  nameInput.value = card.name;
  nameInput.placeholder = 'Name';
  nameInput.autocomplete = 'off';
  nameInput.required = true;
  const dp = createDatePicker(card.dateStr);
  const tp = createTimePicker(card.timeStr || '');
  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.innerHTML = `
    <button type="button" class="btn ghost cat-save">Save</button>
    <button type="button" class="btn ghost cat-cancel">Cancel</button>
  `;
  section.appendChild(nameInput);
  section.appendChild(dp);
  section.appendChild(tp);
  section.appendChild(actions);

  actions.querySelector('.cat-save').addEventListener('click', () => {
    const dateStr = dp.getValue();
    const timeStr = tp.getValue();
    const name = nameInput.value.trim();
    if (!dateStr || !name) return;
    updateCard(catId, cardId, { name, dateStr, timeStr });
  });
  actions.querySelector('.cat-cancel').addEventListener('click', () => rebuildCategory(catId));
  return section;
}

function buildCategoryView(cat) {
  const editing = editingCats.has(cat.id);
  const section = document.createElement('section');
  section.className = 'view assess-view cat-view ' + (editing ? 'editing' : 'saved');
  section.id = 'view-cat-' + cat.id;
  section.innerHTML = `
    <div class="cat-head">
      <div class="cat-title"></div>
      <div class="cat-head-actions">
        <button type="button" class="btn cat-save">Save</button>
        <button type="button" class="btn ghost cat-rename">Rename</button>
        <button type="button" class="btn ghost cat-delete">Delete</button>
      </div>
    </div>
    <form class="cat-add-form">
      <div class="cat-date-host"></div>
      <div class="cat-time-host"></div>
      <input type="text" class="cat-name" placeholder="What are you counting down to?" autocomplete="off" required>
      <button type="submit" class="btn">Add</button>
    </form>
    <div class="assess-grid" id="cat-grid-${cat.id}"></div>
    <div class="cat-foot">
      <button type="button" class="btn ghost cat-edit-toggle">Edit countdowns</button>
    </div>
  `;
  section.querySelector('.cat-title').textContent = cat.name;

  const dp = createDatePicker('');
  const tp = createTimePicker('');
  section.querySelector('.cat-date-host').appendChild(dp);
  section.querySelector('.cat-time-host').appendChild(tp);
  const nameInput = section.querySelector('.cat-add-form .cat-name');

  section.querySelector('.cat-add-form').addEventListener('submit', e => {
    e.preventDefault();
    const dateStr = dp.getValue();
    const timeStr = tp.getValue();
    const name = nameInput.value.trim();
    if (!dateStr || !name) return;
    addCard(cat.id, { name, dateStr, timeStr });
    nameInput.value = '';
    dp.setValue('');
    tp.setValue('');
  });
  section.querySelector('.cat-save').addEventListener('click', () => setCategoryEditing(cat.id, false));
  section.querySelector('.cat-edit-toggle').addEventListener('click', () => setCategoryEditing(cat.id, true));
  section.querySelector('.cat-rename').addEventListener('click', () => startRenameCategory(cat.id));
  section.querySelector('.cat-delete').addEventListener('click', () => {
    const current = loadCategories().find(c => c.id === cat.id);
    const label = current ? current.name : 'this';
    if (confirm(`Delete the "${label}" category and its countdowns?`)) deleteCategory(cat.id);
  });
  return section;
}

function insertCategoryTab(cat) {
  const btn = document.createElement('button');
  btn.className = 'tab';
  btn.draggable = true;
  btn.dataset.view = 'cat-' + cat.id;
  btn.textContent = cat.name;
  // Sit before Settings (which stays near the end); the "+" stays truly last.
  const anchor = document.querySelector('.tab[data-view="settings"]') || document.querySelector('.tab-add');
  anchor.parentNode.insertBefore(btn, anchor);
}
function insertCategoryView(cat) {
  if (!cat.cards.length) editingCats.add(cat.id); // a fresh category opens ready to add
  const footer = document.querySelector('.page > footer');
  footer.parentNode.insertBefore(buildCategoryView(cat), footer);
  populateCategoryGrid(cat);
}

function addCategory(name) {
  const cats = loadCategories();
  const cat = { id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name, cards: [] };
  cats.push(cat);
  saveCategories(cats);
  insertCategoryTab(cat);
  insertCategoryView(cat);
  switchTo('cat-' + cat.id);
  const view = document.getElementById('view-cat-' + cat.id);
  const ni = view && view.querySelector('.cat-add-form .cat-name');
  if (ni) ni.focus();
  return cat;
}

function deleteCategory(id) {
  saveCategories(loadCategories().filter(c => c.id !== id));
  const tab = document.querySelector('.tab[data-view="cat-' + id + '"]');
  if (tab) tab.remove();
  const view = document.getElementById('view-cat-' + id);
  const wasActive = view && view.classList.contains('active');
  if (view) view.remove();
  if (wasActive) switchTo('countdown');
}

function renameCategory(id, name) {
  const cats = loadCategories();
  const cat = cats.find(c => c.id === id);
  if (!cat) return;
  cat.name = name;
  saveCategories(cats);
  const tab = document.querySelector('.tab[data-view="cat-' + id + '"]');
  if (tab) tab.textContent = name;
  const view = document.getElementById('view-cat-' + id);
  if (view) {
    const existing = view.querySelector('.cat-title, .cat-title-input');
    const titleEl = document.createElement('div');
    titleEl.className = 'cat-title';
    titleEl.textContent = name;
    if (existing) existing.replaceWith(titleEl);
    populateCategoryGrid(cat); // labels reflect the new name
  }
  update();
}

function startRenameCategory(id) {
  const view = document.getElementById('view-cat-' + id);
  if (!view) return;
  const titleEl = view.querySelector('.cat-title, .cat-title-input');
  if (!titleEl) return;
  const cur = (loadCategories().find(c => c.id === id) || {}).name || '';
  const input = document.createElement('input');
  input.className = 'cat-title-input';
  input.value = cur;
  input.maxLength = 24;
  titleEl.replaceWith(input);
  input.focus();
  input.select();
  let done = false;
  const commit = () => { if (done) return; done = true; renameCategory(id, input.value.trim() || cur); };
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    else if (e.key === 'Escape') { e.preventDefault(); done = true; renameCategory(id, cur); }
  });
  input.addEventListener('blur', commit);
}

function startNewCategory() {
  const add = document.querySelector('.tab-add');
  if (!add || add.style.display === 'none') return;
  const input = document.createElement('input');
  input.className = 'tab-new-input';
  input.placeholder = 'Category name';
  input.maxLength = 24;
  add.style.display = 'none';
  add.parentNode.insertBefore(input, add);
  input.focus();
  let done = false;
  const cleanup = () => { input.remove(); add.style.display = ''; };
  const commit = () => { if (done) return; done = true; const v = input.value.trim(); cleanup(); if (v) addCategory(v); };
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    else if (e.key === 'Escape') { e.preventDefault(); done = true; cleanup(); }
  });
  input.addEventListener('blur', commit);
}

function ensureAddButton() {
  if (document.querySelector('.tab-add')) return;
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'tab-add';
  add.title = 'Add category';
  add.setAttribute('aria-label', 'Add category');
  add.textContent = '+';
  document.querySelector('.tabs').appendChild(add); // always last, anchors drag-reorder
  add.addEventListener('click', startNewCategory);
}

export function initCategories() {
  ensureAddButton();
  loadCategories().forEach(cat => {
    insertCategoryTab(cat);
    insertCategoryView(cat);
  });
}

export function refreshAllCategories() {
  document.querySelectorAll('.tab[data-view^="cat-"]').forEach(t => t.remove());
  document.querySelectorAll('.view[id^="view-cat-"]').forEach(v => v.remove());
  loadCategories().forEach(cat => {
    insertCategoryTab(cat);
    insertCategoryView(cat);
  });
  update();
}
