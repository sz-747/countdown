// Tab strip: a delegated click handler so dynamically-added category tabs work too.

export function setupTabs() {
  document.querySelector('.tabs').addEventListener('click', e => {
    const btn = e.target.closest('.tab');
    if (!btn || !btn.dataset.view) return;
    switchTo(btn.dataset.view);
  });
}

export function switchTo(view) {
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
}
