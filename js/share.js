// Shareable setup links: encode subjects/assessments/exams/categories into the
// URL hash, and offer to import them on the receiving browser.

import {
  loadCustomAssessmentsRaw, saveCustomAssessmentsRaw,
  renderCustomAssessList, rebuildAssessments, rebuildHsc,
} from './assessments.js';
import { loadExams, saveExams, renderExamList } from './exams.js';
import {
  loadSubjects, saveSubjects, renderSubjectChips, renderSubjectDatalist,
} from './subjects.js';
import { loadCategories, saveCategories, refreshAllCategories } from './categories.js';
import { paintYearGrid } from './yeargrid.js';

function encodeShare(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}
function decodeShare(str) {
  return JSON.parse(decodeURIComponent(escape(atob(str))));
}
function buildSharePayload() {
  return { v: 1, a: loadCustomAssessmentsRaw(), e: loadExams(), s: loadSubjects(), c: loadCategories() };
}
export function setupShare() {
  const btn = document.getElementById('share-btn');
  const status = document.getElementById('share-status');
  btn.addEventListener('click', async () => {
    const url = location.origin + location.pathname + '#data=' + encodeShare(buildSharePayload());
    let ok = false;
    try { await navigator.clipboard.writeText(url); ok = true; } catch (_) { ok = false; }
    status.textContent = ok ? 'Link copied to clipboard' : 'Copy failed — check console';
    if (!ok) console.log('Share link:', url);
    status.classList.add('show');
    setTimeout(() => status.classList.remove('show'), 2600);
  });
}
export function checkImport() {
  const m = location.hash.match(/data=([^&]+)/);
  if (!m) return;
  let data;
  try { data = decodeShare(m[1]); } catch (_) { return; }
  if (!data || typeof data !== 'object') return;
  const banner = document.getElementById('import-banner');
  const text = document.getElementById('import-text');
  const counts = [];
  if (Array.isArray(data.a) && data.a.length) counts.push(data.a.length + ' assessment' + (data.a.length === 1 ? '' : 's'));
  if (Array.isArray(data.e) && data.e.length) counts.push(data.e.length + ' exam' + (data.e.length === 1 ? '' : 's'));
  if (Array.isArray(data.s) && data.s.length) counts.push(data.s.length + ' subject' + (data.s.length === 1 ? '' : 's'));
  if (Array.isArray(data.c) && data.c.length) counts.push(data.c.length + ' categor' + (data.c.length === 1 ? 'y' : 'ies'));
  text.textContent = counts.length
    ? `Someone shared ${counts.join(', ')} with you. Import into this browser?`
    : 'Someone shared a study setup with you. Import into this browser?';
  banner.hidden = false;

  document.getElementById('import-accept').addEventListener('click', () => {
    if (Array.isArray(data.a)) {
      const cur = loadCustomAssessmentsRaw();
      data.a.forEach(inc => {
        const i = cur.findIndex(x => x.id === inc.id);
        if (i >= 0) cur[i] = inc; else cur.push(inc);
      });
      saveCustomAssessmentsRaw(cur);
    }
    if (Array.isArray(data.e)) {
      const cur = loadExams();
      data.e.forEach(inc => {
        const i = cur.findIndex(x => x.id === inc.id);
        if (i >= 0) cur[i] = inc; else cur.push(inc);
      });
      saveExams(cur);
    }
    if (Array.isArray(data.s)) {
      const cur = loadSubjects();
      data.s.forEach(s => { if (!cur.some(x => x.toLowerCase() === String(s).toLowerCase())) cur.push(s); });
      saveSubjects(cur);
    }
    if (Array.isArray(data.c)) {
      const cur = loadCategories();
      data.c.forEach(inc => {
        if (!inc || !inc.id) return;
        const norm = { id: inc.id, name: inc.name || 'Category', cards: Array.isArray(inc.cards) ? inc.cards : [] };
        const i = cur.findIndex(x => x.id === inc.id);
        if (i >= 0) cur[i] = norm; else cur.push(norm);
      });
      saveCategories(cur);
    }
    history.replaceState(null, '', location.pathname);
    banner.hidden = true;
    renderSubjectChips();
    renderSubjectDatalist();
    renderCustomAssessList();
    renderExamList();
    rebuildAssessments();
    rebuildHsc();
    refreshAllCategories();
    paintYearGrid();
  }, { once: true });

  document.getElementById('import-dismiss').addEventListener('click', () => {
    history.replaceState(null, '', location.pathname);
    banner.hidden = true;
  }, { once: true });
}
