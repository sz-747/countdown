// Personalization: a Monkeytype-style named-theme picker, an editable header
// title and a rotating footer quote. Everything is saved to this browser only.
//
// Each theme is described with Monkeytype's own colour tokens — bg, main, caret,
// sub, subAlt, text — so a card can paint itself in its own scheme (just like
// the theme list on monkeytype.com). `applyTheme` maps those tokens onto the CSS
// custom properties the rest of the app reads.

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

// Curated palettes. "Long Road" is the app's own scheme; the rest are
// faithful Monkeytype themes (colours lifted straight from their theme list).
const THEMES = [
  { id: 'long-road',   name: 'Long Road',   bg: '#0b0c10', main: '#e8b86b', caret: '#c97b5a', sub: '#8a8578', subAlt: '#11131a', text: '#f4f1ea' },
  { id: 'serika-dark', name: 'Serika Dark', bg: '#323437', main: '#e2b714', caret: '#e2b714', sub: '#646669', subAlt: '#2c2e31', text: '#d1d0c5' },
  { id: 'dracula',     name: 'Dracula',     bg: '#282a36', main: '#bd93f9', caret: '#bd93f9', sub: '#6272a4', subAlt: '#20222c', text: '#f8f8f2' },
  { id: 'nord',        name: 'Nord',        bg: '#242933', main: '#88c0d0', caret: '#eceff4', sub: '#929aaa', subAlt: '#2e3440', text: '#d8dee9' },
  { id: 'rose-pine',   name: 'Rosé Pine',   bg: '#1f1d27', main: '#9ccfd8', caret: '#f6c177', sub: '#c4a7e7', subAlt: '#282533', text: '#e0def4' },
  { id: 'sonokai',     name: 'Sonokai',     bg: '#2c2e34', main: '#9ed072', caret: '#f38c71', sub: '#e7c664', subAlt: '#232429', text: '#e2e2e3' },
  { id: 'comfy',       name: 'Comfy',       bg: '#4a5b6e', main: '#f8cdc6', caret: '#9ec1cc', sub: '#9ec1cc', subAlt: '#425366', text: '#f5efee' },
  { id: 'moonlight',   name: 'Moonlight',   bg: '#191f28', main: '#c69f68', caret: '#8f744b', sub: '#4b5975', subAlt: '#141a22', text: '#ccccb5' },
  { id: 'bento',       name: 'Bento',       bg: '#2d394d', main: '#ff7a90', caret: '#ff7a90', sub: '#4a768d', subAlt: '#263041', text: '#fffaf8' },
  { id: 'bushido',     name: 'Bushido',     bg: '#242933', main: '#ec4c56', caret: '#ec4c56', sub: '#596172', subAlt: '#1c222d', text: '#f6f0e9' },
  { id: 'olivia',      name: 'Olivia',      bg: '#1c1b1d', main: '#deaf9d', caret: '#deaf9d', sub: '#4e3e3e', subAlt: '#262223', text: '#f2efed' },
  { id: 'carbon',      name: 'Carbon',      bg: '#313131', main: '#f66e0d', caret: '#f66e0d', sub: '#616161', subAlt: '#2b2b2b', text: '#f5e6c8' },
  { id: 'grand-prix',  name: 'Grand Prix',  bg: '#36475c', main: '#c0d036', caret: '#c0d036', sub: '#5c6c80', subAlt: '#42536b', text: '#c1c7d7' },
  { id: 'nautilus',    name: 'Nautilus',    bg: '#132237', main: '#ebb723', caret: '#ebb723', sub: '#0b4c6c', subAlt: '#0e1a29', text: '#1cbaac' },
  { id: 'aurora',      name: 'Aurora',      bg: '#011926', main: '#00e980', caret: '#00e980', sub: '#245c69', subAlt: '#000c13', text: '#ffffff' },
  { id: 'cyberspace',  name: 'Cyberspace',  bg: '#181c18', main: '#00ce7c', caret: '#00ce7c', sub: '#9578d3', subAlt: '#131613', text: '#c2fbe1' },
  { id: 'matrix',      name: 'Matrix',      bg: '#000000', main: '#15ff00', caret: '#15ff00', sub: '#006500', subAlt: '#032000', text: '#d1ffcd' },
  { id: 'milkshake',   name: 'Milkshake',   bg: '#ffffff', main: '#212b43', caret: '#212b43', sub: '#62cfe6', subAlt: '#ddeff3', text: '#212b43' },
  { id: 'modern-ink',  name: 'Modern Ink',  bg: '#ffffff', main: '#ff360d', caret: '#ff0000', sub: '#b7b7b7', subAlt: '#ececec', text: '#000000' },
  { id: 'mizu',        name: 'Mizu',        bg: '#afcbdd', main: '#fcfbf6', caret: '#fcfbf6', sub: '#85a5bb', subAlt: '#9fc1d4', text: '#1a2633' },
  { id: 'lavender',    name: 'Lavender',    bg: '#ada6c2', main: '#e4e3e9', caret: '#e4e3e9', sub: '#8b84a3', subAlt: '#a19bb9', text: '#2f2a41' },
];

// --- colour helpers --------------------------------------------------------
function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
// Blend two hex colours by `t` (0 = a, 1 = b) and return a hex string.
function mix(a, b, t) {
  const c1 = hexToRgb(a), c2 = hexToRgb(b);
  const ch = k => Math.round(c1[k] + (c2[k] - c1[k]) * t).toString(16).padStart(2, '0');
  return '#' + ch('r') + ch('g') + ch('b');
}
function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function themeById(id) { return THEMES.find(t => t.id === id) || THEMES[0]; }
function savedThemeId() { return localStorage.getItem(THEME_KEY) || DEFAULT_THEME; }
function brandEl() { return document.querySelector('.brand'); }
function quoteEl() { return document.querySelector('footer .quote'); }

// Map Monkeytype tokens onto the app's CSS custom properties.
function applyTheme(t) {
  const r = document.documentElement.style;
  r.setProperty('--bg', t.bg);
  r.setProperty('--bg-grad-1', mix(t.bg, t.text, 0.06));
  r.setProperty('--bg-grad-2', t.bg);
  r.setProperty('--fg', t.text);
  r.setProperty('--muted', t.sub);
  r.setProperty('--accent-trials', t.main);
  r.setProperty('--accent-hsc', t.caret);
  r.setProperty('--accent-assess', t.caret);
  r.setProperty('--line', rgba(t.text, 0.1));
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
  setupThemeGrid();

  const titleInput = document.getElementById('title-input');
  titleInput.value = localStorage.getItem(TITLE_KEY) || DEFAULT_TITLE;
  titleInput.addEventListener('input', () => {
    const v = titleInput.value.trim();
    localStorage.setItem(TITLE_KEY, v);
    brandEl().textContent = v || DEFAULT_TITLE;
  });
}

// Build the theme list. Each card paints itself in its own palette; hovering
// previews the theme live, clicking keeps it — the Monkeytype interaction.
function setupThemeGrid() {
  const host = document.getElementById('theme-grid');
  if (!host) return;

  const markActive = id => host.querySelectorAll('.theme-card')
    .forEach(c => c.classList.toggle('active', c.dataset.theme === id));

  THEMES.forEach(t => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'theme-card';
    card.dataset.theme = t.id;
    // Paint the card in the theme's own colours.
    card.style.setProperty('--c-bg', t.bg);
    card.style.setProperty('--c-text', t.text);
    card.style.setProperty('--c-sub', t.sub);
    card.style.setProperty('--c-line', rgba(t.text, 0.18));
    card.innerHTML = `
      <span class="theme-name">${t.name}</span>
      <span class="theme-dots">
        <span style="background:${t.main}"></span>
        <span style="background:${t.caret}"></span>
        <span style="background:${t.text}"></span>
      </span>`;
    card.addEventListener('mouseenter', () => applyTheme(t));
    card.addEventListener('focus', () => applyTheme(t));
    card.addEventListener('click', () => {
      localStorage.setItem(THEME_KEY, t.id);
      applyTheme(t); // touch devices never fire mouseenter, so apply here too
      markActive(t.id);
    });
    host.appendChild(card);
  });

  // Leaving the grid (or blurring it) snaps back to the chosen theme.
  const restore = () => applyTheme(themeById(savedThemeId()));
  host.addEventListener('mouseleave', restore);
  host.addEventListener('focusout', e => { if (!host.contains(e.relatedTarget)) restore(); });

  markActive(savedThemeId());
}
