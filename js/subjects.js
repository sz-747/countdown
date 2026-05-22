// Subject list (powers datalist suggestions and the Settings chips).

const SUBJECTS_KEY = 'countdown.subjects.v1';
const SUBJECTS_SEED_KEY = 'countdown.subjects.seeded.v1';
const DEFAULT_SUBJECTS = [
  'English Advanced', 'English Extension 1', 'Mathematics Advanced', 'Mathematics Extension 1',
  'Chemistry', 'Legal Studies', 'Software Engineering',
];

export function loadSubjects() {
  try { return JSON.parse(localStorage.getItem(SUBJECTS_KEY) || '[]'); }
  catch (_) { return []; }
}
export function saveSubjects(list) {
  localStorage.setItem(SUBJECTS_KEY, JSON.stringify(list));
}
export function seedDefaultSubjects() {
  if (localStorage.getItem(SUBJECTS_SEED_KEY)) return;
  if (!loadSubjects().length) saveSubjects(DEFAULT_SUBJECTS.slice());
  localStorage.setItem(SUBJECTS_SEED_KEY, '1');
}
export function renderSubjectDatalist() {
  const dl = document.getElementById('subjects-list');
  dl.innerHTML = loadSubjects().map(s => `<option value="${s.replace(/"/g, '&quot;')}"></option>`).join('');
}
export function renderSubjectChips() {
  const root = document.getElementById('subject-chips');
  root.innerHTML = '';
  loadSubjects().forEach(s => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    const txt = document.createElement('span');
    txt.textContent = s;
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.textContent = '×';
    rm.setAttribute('aria-label', 'Remove ' + s);
    rm.addEventListener('click', () => {
      saveSubjects(loadSubjects().filter(x => x !== s));
      renderSubjectChips();
      renderSubjectDatalist();
    });
    chip.appendChild(txt);
    chip.appendChild(rm);
    root.appendChild(chip);
  });
}
export function setupSubjectForm() {
  const form = document.getElementById('subject-form');
  const input = document.getElementById('subject-input');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) return;
    const list = loadSubjects();
    if (!list.some(x => x.toLowerCase() === v.toLowerCase())) {
      list.push(v);
      saveSubjects(list);
      renderSubjectChips();
      renderSubjectDatalist();
    }
    input.value = '';
  });
}
