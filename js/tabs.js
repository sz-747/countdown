// Tab strip: a delegated click handler so dynamically-added category tabs work too,
// plus drag-to-reorder with the chosen order persisted to localStorage.

const TAB_ORDER_KEY = 'countdown.tabOrder.v1';

export function setupTabs() {
  const tabsEl = document.querySelector('.tabs');
  tabsEl.addEventListener('click', e => {
    const btn = e.target.closest('.tab');
    if (!btn || !btn.dataset.view) return;
    switchTo(btn.dataset.view);
  });
  setupTabDrag(tabsEl);
}

export function switchTo(view) {
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
}

// ---- Drag-to-reorder ----

let dragEl = null;

function setupTabDrag(tabsEl) {
  tabsEl.addEventListener('dragstart', e => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    dragEl = tab;
    tab.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', tab.dataset.view || ''); } catch (_) {}
  });

  tabsEl.addEventListener('dragover', e => {
    if (!dragEl) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const after = getDragAfterElement(tabsEl, e.clientX);
    const addBtn = tabsEl.querySelector('.tab-add');
    if (after == null) tabsEl.insertBefore(dragEl, addBtn);
    else tabsEl.insertBefore(dragEl, after);
  });

  tabsEl.addEventListener('dragend', () => {
    if (!dragEl) return;
    dragEl.classList.remove('dragging');
    dragEl = null;
    saveTabOrder(tabsEl);
  });
}

function getDragAfterElement(tabsEl, x) {
  const tabs = [...tabsEl.querySelectorAll('.tab:not(.dragging)')];
  let closest = null, closestOffset = -Infinity;
  for (const tab of tabs) {
    const box = tab.getBoundingClientRect();
    const offset = x - box.left - box.width / 2;
    if (offset < 0 && offset > closestOffset) { closestOffset = offset; closest = tab; }
  }
  return closest;
}

function saveTabOrder(tabsEl) {
  const order = [...tabsEl.querySelectorAll('.tab')].map(t => t.dataset.view).filter(Boolean);
  localStorage.setItem(TAB_ORDER_KEY, JSON.stringify(order));
}

// Reapply a previously saved order. Tabs not in the saved list keep their
// natural position; the "+" add button always stays last.
export function applyTabOrder() {
  let order;
  try { order = JSON.parse(localStorage.getItem(TAB_ORDER_KEY) || '[]'); }
  catch (_) { order = []; }
  if (!Array.isArray(order) || !order.length) return;
  const tabsEl = document.querySelector('.tabs');
  const addBtn = tabsEl.querySelector('.tab-add');
  order.forEach(view => {
    const tab = tabsEl.querySelector('.tab[data-view="' + CSS.escape(view) + '"]');
    if (tab) tabsEl.insertBefore(tab, addBtn);
  });
}
