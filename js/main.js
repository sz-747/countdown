// Entry point: wires every feature module together and bootstraps the page.

import { now, syncTime } from './time.js';
import { update, tick } from './refresh.js';
import { buildYearGrid, paintYearGrid } from './yeargrid.js';
import { setupTabs, applyTabOrder } from './tabs.js';
import { initCategories } from './categories.js';
import { setupPersonalize } from './personalize.js';
import { seedDefaultExams, setupExamForm, renderExamList } from './exams.js';
import {
  seedDefaultAssessments, allAssessments, UA, buildAssessCards, hscAssessments,
  renderCustomAssessList, setupAssessForm,
} from './assessments.js';
import { setupCassettePlayer } from './player.js';

(async () => {
  buildYearGrid();
  seedDefaultAssessments();
  buildAssessCards(allAssessments(), 'assess-grid');
  buildAssessCards(UA, 'ua-grid');
  setupTabs();
  initCategories();
  applyTabOrder();
  seedDefaultExams();
  setupExamForm();
  renderExamList();
  setupAssessForm();
  renderCustomAssessList();
  buildAssessCards(hscAssessments(), 'hsc-grid');
  setupPersonalize();
  setupCassettePlayer();
  await syncTime();
  update();
  paintYearGrid();
  scheduleNextMidnight();
  setInterval(tick, 1000);
})();

function scheduleNextMidnight() {
  const current = now();
  const next = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, 0, 0, 5);
  setTimeout(async () => { await syncTime(); update(); scheduleNextMidnight(); }, next - current);
}

setInterval(async () => { await syncTime(); update(); }, 60 * 60 * 1000);

// ---- Fullscreen toggle ----
const fsBtn = document.getElementById('fs-toggle');
function fsElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
}
function updateFsState() {
  document.body.classList.toggle('is-fullscreen', !!fsElement());
}
fsBtn.addEventListener('click', () => {
  if (fsElement()) {
    (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document);
  } else {
    const el = document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen).call(el);
  }
});
document.addEventListener('fullscreenchange', updateFsState);
document.addEventListener('webkitfullscreenchange', updateFsState);
document.addEventListener('msfullscreenchange', updateFsState);
document.addEventListener('keydown', (e) => {
  if (e.key === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
    fsBtn.click();
  }
});
