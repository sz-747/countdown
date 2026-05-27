// Personalization: an editable header title and a rotating footer quote.
// Everything is saved to this browser only. (Colour-theme picker removed for
// now — the single Long Road palette below is always applied.)

const TITLE_KEY = 'countdown.title.v1';

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

// The single palette the app uses. Maps to the CSS custom properties the app
// reads: `accent` drives the primary highlight (Trials number, focus rings),
// `accent2` the secondary (HSC), `accent3` the cool accent, `line` the hairline
// border tint.
const THEME = { bg: '#0b0c10', bg1: '#11131a', fg: '#f4f1ea', muted: '#8a8578', accent: '#e8b86b', accent2: '#c97b5a', accent3: '#8ab4d8', line: 'rgba(244,241,234,0.08)' };

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
  applyTheme(THEME);
  const brand = brandEl();
  if (brand) brand.textContent = localStorage.getItem(TITLE_KEY) || DEFAULT_TITLE;
  startQuoteRotation();
}

export function setupPersonalize() {
  applyPersonalization();

  const titleInput = document.getElementById('title-input');
  titleInput.value = localStorage.getItem(TITLE_KEY) || DEFAULT_TITLE;
  titleInput.addEventListener('input', () => {
    const v = titleInput.value.trim();
    localStorage.setItem(TITLE_KEY, v);
    brandEl().textContent = v || DEFAULT_TITLE;
  });
}
