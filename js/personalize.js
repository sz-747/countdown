// Personalization: Monkeytype-style colour themes, plus an editable header
// title and footer quote. Everything is saved to this browser only.

const THEME_KEY = 'countdown.theme.v1';
const TITLE_KEY = 'countdown.title.v1';

const DEFAULT_THEME = 'long-road';
const DEFAULT_TITLE = 'Year 12 — the long road';

// Footer quotes cycle on their own every few minutes — no longer editable.
const QUOTE_ROTATE_MS = 2 * 60 * 1000;
const QUOTES = [
  'The best time was yesterday. The next best is now.',
  'Discipline is choosing what you want most over what you want now.',
  'Small steps every day add up to big results.',
  'You don’t have to be great to start, but you have to start to be great.',
  'The expert in anything was once a beginner.',
  'Success is the sum of small efforts repeated day in and day out.',
  'Don’t watch the clock; do what it does. Keep going.',
  'The secret of getting ahead is getting started.',
  'Your future is created by what you do today, not tomorrow.',
  'It always seems impossible until it’s done.',
  'Focus on progress, not perfection.',
  'Motivation gets you going; habit keeps you growing.',
];

// Each theme maps to the CSS custom properties the app reads. `accent` drives
// the primary highlight (Trials number, focus rings); `accent2` the secondary
// (HSC); `accent3` the cool accent (defaults to accent2). `line` is the hairline
// border tint — kept legible against each background.
const THEMES = [
  { id: 'long-road', name: 'Long Road',  bg: '#0b0c10', bg1: '#11131a', fg: '#f4f1ea', muted: '#8a8578', accent: '#e8b86b', accent2: '#c97b5a', accent3: '#8ab4d8', line: 'rgba(244,241,234,0.08)' },
  { id: 'serika',    name: 'Serika Dark', bg: '#323437', bg1: '#3a3c40', fg: '#d1d0c5', muted: '#646669', accent: '#e2b714', accent2: '#e2b714', accent3: '#e2b714', line: 'rgba(209,208,197,0.10)' },
  { id: 'dracula',   name: 'Dracula',    bg: '#282a36', bg1: '#343746', fg: '#f8f8f2', muted: '#6272a4', accent: '#bd93f9', accent2: '#ff79c6', accent3: '#8be9fd', line: 'rgba(248,248,242,0.09)' },
  { id: 'nord',      name: 'Nord',       bg: '#2e3440', bg1: '#3b4252', fg: '#d8dee9', muted: '#677791', accent: '#88c0d0', accent2: '#81a1c1', accent3: '#a3be8c', line: 'rgba(216,222,233,0.09)' },
  { id: 'rose-pine', name: 'Rosé Pine',  bg: '#191724', bg1: '#1f1d2e', fg: '#e0def4', muted: '#6e6a86', accent: '#ebbcba', accent2: '#c4a7e7', accent3: '#9ccfd8', line: 'rgba(224,222,244,0.09)' },
  { id: 'lavender',  name: 'Lavender',   bg: '#1d1f2b', bg1: '#262936', fg: '#e6e6fa', muted: '#6c6f93', accent: '#b48ead', accent2: '#a3a7e0', accent3: '#88c0d0', line: 'rgba(230,230,250,0.09)' },
  { id: 'coral',     name: 'Coral',      bg: '#1c1c28', bg1: '#262636', fg: '#ffe8e0', muted: '#8a6f6f', accent: '#ff7e6b', accent2: '#ffb86b', accent3: '#ff7e6b', line: 'rgba(255,232,224,0.09)' },
  { id: 'carbon',    name: 'Carbon',     bg: '#313131', bg1: '#3a3a3a', fg: '#f5f5f5', muted: '#616161', accent: '#f66e0d', accent2: '#ffb86b', accent3: '#f66e0d', line: 'rgba(245,245,245,0.10)' },
  { id: 'matrix',    name: 'Matrix',     bg: '#000000', bg1: '#0a140a', fg: '#15ff00', muted: '#0c7c00', accent: '#15ff00', accent2: '#15ff00', accent3: '#15ff00', line: 'rgba(21,255,0,0.14)' },
  { id: 'aurora',    name: 'Aurora',     bg: '#011627', bg1: '#0a2238', fg: '#d6deeb', muted: '#5f7e97', accent: '#21c7a8', accent2: '#82aaff', accent3: '#c792ea', line: 'rgba(214,222,235,0.09)' },
  { id: 'sand',      name: 'Sand',       bg: '#ece5d8', bg1: '#f3ede2', fg: '#3a352c', muted: '#8a8071', accent: '#c06b3e', accent2: '#9a8047', accent3: '#5a7d8b', line: 'rgba(58,53,44,0.12)' },
  { id: 'botanical', name: 'Botanical',  bg: '#d6e0d5', bg1: '#e0e8df', fg: '#2f3e36', muted: '#5e7565', accent: '#3f7d56', accent2: '#7a9e6e', accent3: '#4a7d8b', line: 'rgba(47,62,54,0.12)' },
  { id: 'paper',     name: 'Paper',      bg: '#fafaf7', bg1: '#ffffff', fg: '#222222', muted: '#9a9a93', accent: '#444444', accent2: '#c97b5a', accent3: '#5a7d8b', line: 'rgba(34,34,34,0.10)' },
];

function themeById(id) { return THEMES.find(t => t.id === id) || THEMES[0]; }
function savedThemeId() { return localStorage.getItem(THEME_KEY) || DEFAULT_THEME; }
function brandEl() { return document.querySelector('.brand'); }
function quoteEl() { return document.querySelector('footer .quote'); }

function applyTheme(t) {
  const r = document.documentElement.style;
  r.setProperty('--bg', t.bg);
  r.setProperty('--bg-grad-1', t.bg1);
  r.setProperty('--bg-grad-2', t.bg);
  r.setProperty('--fg', t.fg);
  r.setProperty('--muted', t.muted);
  r.setProperty('--accent-trials', t.accent);
  r.setProperty('--accent-hsc', t.accent2);
  r.setProperty('--accent-assess', t.accent3 || t.accent2);
  r.setProperty('--line', t.line);
}

let quoteIdx = 0;
let quoteTimer = null;
function showQuote(i) {
  const el = quoteEl();
  if (!el) return;
  el.style.opacity = '0';
  setTimeout(() => { el.textContent = '“' + QUOTES[i] + '”'; el.style.opacity = ''; }, 400);
}
function startQuoteRotation() {
  if (quoteTimer) return;
  quoteIdx = Math.floor(Math.random() * QUOTES.length);
  const el = quoteEl();
  if (el) el.textContent = '“' + QUOTES[quoteIdx] + '”';
  quoteTimer = setInterval(() => {
    quoteIdx = (quoteIdx + 1) % QUOTES.length;
    showQuote(quoteIdx);
  }, QUOTE_ROTATE_MS);
}

// Apply saved values to the live page. Safe to call before the form exists.
export function applyPersonalization() {
  applyTheme(themeById(savedThemeId()));
  const brand = brandEl();
  if (brand) brand.textContent = localStorage.getItem(TITLE_KEY) || DEFAULT_TITLE;
  startQuoteRotation();
}

export function setupPersonalize() {
  applyPersonalization();

  const themeHost = document.getElementById('theme-grid');
  const renderActive = id => themeHost.querySelectorAll('.theme-card')
    .forEach(c => c.classList.toggle('active', c.dataset.theme === id));
  THEMES.forEach(t => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'theme-card';
    card.dataset.theme = t.id;
    card.style.setProperty('--t-bg', t.bg1);
    card.style.setProperty('--t-fg', t.fg);
    card.innerHTML = `
      <span class="theme-name">${t.name}</span>
      <span class="theme-dots">
        <span style="background:${t.accent}"></span>
        <span style="background:${t.accent2}"></span>
        <span style="background:${t.fg}"></span>
      </span>`;
    card.addEventListener('click', () => {
      localStorage.setItem(THEME_KEY, t.id);
      applyTheme(t);
      renderActive(t.id);
    });
    themeHost.appendChild(card);
  });
  renderActive(savedThemeId());

  const titleInput = document.getElementById('title-input');
  titleInput.value = localStorage.getItem(TITLE_KEY) || DEFAULT_TITLE;
  titleInput.addEventListener('input', () => {
    const v = titleInput.value.trim();
    localStorage.setItem(TITLE_KEY, v);
    brandEl().textContent = v || DEFAULT_TITLE;
  });
}
