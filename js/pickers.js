// Custom date and time picker widgets. Each returns a wrapper element
// with .getValue() / .setValue() methods.

import { parseISODate, isoDate } from './utils.js';

export function createDatePicker(initial = '') {
  const wrap = document.createElement('div');
  wrap.className = 'dp';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'dp-trigger';
  trigger.dataset.value = initial;
  trigger.innerHTML = `
    <span class="dp-trigger-text"></span>
    <svg class="dp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="17" rx="2"></rect>
      <path d="M3 9h18"></path>
      <path d="M8 2v4"></path>
      <path d="M16 2v4"></path>
    </svg>
  `;

  const popup = document.createElement('div');
  popup.className = 'dp-popup';
  popup.hidden = true;
  popup.addEventListener('click', e => e.stopPropagation());

  wrap.appendChild(trigger);
  wrap.appendChild(popup);

  const init = parseISODate(initial);
  let displayed = init
    ? { year: init.getFullYear(), month: init.getMonth() }
    : (() => { const t = new Date(); return { year: t.getFullYear(), month: t.getMonth() }; })();

  function updateTriggerLabel() {
    const v = trigger.dataset.value;
    const text = trigger.querySelector('.dp-trigger-text');
    if (v) {
      const d = parseISODate(v);
      text.textContent = d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      trigger.classList.remove('dp-empty');
    } else {
      text.textContent = 'Pick a date';
      trigger.classList.add('dp-empty');
    }
  }

  function renderPopup() {
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const weekdays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const { year, month } = displayed;
    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const selectedStr = trigger.dataset.value;
    const today = new Date();
    const todayStr = isoDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

    let html = `
      <div class="dp-header">
        <button type="button" class="dp-nav" data-dir="-1" aria-label="Previous month">‹</button>
        <div class="dp-month">${monthNames[month]} ${year}</div>
        <button type="button" class="dp-nav" data-dir="1" aria-label="Next month">›</button>
      </div>
      <div class="dp-weekdays">${weekdays.map(w => `<div>${w}</div>`).join('')}</div>
      <div class="dp-days">
    `;
    for (let i = 0; i < firstDow; i++) html += `<div class="dp-day empty"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = isoDate(year, month + 1, d);
      const cls = ['dp-day'];
      if (ds === selectedStr) cls.push('selected');
      if (ds === todayStr) cls.push('today');
      html += `<button type="button" class="${cls.join(' ')}" data-date="${ds}">${d}</button>`;
    }
    html += `</div>
      <div class="dp-footer">
        <button type="button" class="dp-today-btn">Today</button>
        <button type="button" class="dp-clear-btn">Clear</button>
      </div>`;
    popup.innerHTML = html;

    popup.querySelectorAll('.dp-nav').forEach(b => {
      b.addEventListener('click', () => {
        displayed.month += parseInt(b.dataset.dir, 10);
        if (displayed.month < 0)  { displayed.month = 11; displayed.year--; }
        if (displayed.month > 11) { displayed.month = 0;  displayed.year++; }
        renderPopup();
      });
    });
    popup.querySelectorAll('.dp-day:not(.empty)').forEach(b => {
      b.addEventListener('click', () => {
        trigger.dataset.value = b.dataset.date;
        updateTriggerLabel();
        close();
      });
    });
    popup.querySelector('.dp-today-btn').addEventListener('click', () => {
      const t = new Date();
      trigger.dataset.value = isoDate(t.getFullYear(), t.getMonth() + 1, t.getDate());
      displayed = { year: t.getFullYear(), month: t.getMonth() };
      updateTriggerLabel();
      close();
    });
    popup.querySelector('.dp-clear-btn').addEventListener('click', () => {
      trigger.dataset.value = '';
      updateTriggerLabel();
      renderPopup();
    });
  }

  function open() {
    const v = trigger.dataset.value;
    if (v) { const d = parseISODate(v); displayed = { year: d.getFullYear(), month: d.getMonth() }; }
    popup.hidden = false;
    renderPopup();
    setTimeout(() => document.addEventListener('click', onDocClick), 0);
    document.addEventListener('keydown', onKey);
  }
  function close() {
    popup.hidden = true;
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onKey);
  }
  function onDocClick(e) { if (!wrap.contains(e.target)) close(); }
  function onKey(e) { if (e.key === 'Escape') close(); }

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    if (popup.hidden) open(); else close();
  });

  wrap.getValue = () => trigger.dataset.value || '';
  wrap.setValue = (v) => {
    trigger.dataset.value = v || '';
    if (v) { const d = parseISODate(v); displayed = { year: d.getFullYear(), month: d.getMonth() }; }
    updateTriggerLabel();
  };

  updateTriggerLabel();
  return wrap;
}

export function createTimePicker(initial = '') {
  const wrap = document.createElement('div');
  wrap.className = 'tp';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'tp-trigger';
  trigger.dataset.value = initial || '';
  trigger.innerHTML = `
    <span class="tp-trigger-text"></span>
    <svg class="tp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M12 7v5l3 2"></path>
    </svg>
  `;

  const popup = document.createElement('div');
  popup.className = 'tp-popup';
  popup.hidden = true;
  popup.addEventListener('click', e => e.stopPropagation());

  wrap.appendChild(trigger);
  wrap.appendChild(popup);

  function parseTime(v) {
    if (!v) return { hour12: 9, minute: 0, ampm: 'AM' };
    const [hh, mm] = v.split(':').map(Number);
    const ampm = hh < 12 ? 'AM' : 'PM';
    let h12 = hh % 12;
    if (h12 === 0) h12 = 12;
    return { hour12: h12, minute: mm, ampm };
  }
  function to24(s) {
    let h = s.hour12 % 12;
    if (s.ampm === 'PM') h += 12;
    return `${String(h).padStart(2, '0')}:${String(s.minute).padStart(2, '0')}`;
  }
  function fmt(v) {
    const [hh, mm] = v.split(':').map(Number);
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    return d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  let state = parseTime(initial);

  function updateTriggerLabel() {
    const v = trigger.dataset.value;
    const text = trigger.querySelector('.tp-trigger-text');
    if (v) {
      text.textContent = fmt(v);
      trigger.classList.remove('tp-empty');
    } else {
      text.textContent = 'Pick a time';
      trigger.classList.add('tp-empty');
    }
  }

  function renderPopup() {
    const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    const isSet = !!trigger.dataset.value;
    const hourVal = isSet ? state.hour12 : '';
    const minuteVal = isSet ? String(state.minute).padStart(2, '0') : '';

    popup.innerHTML = `
      <div class="tp-display">
        <input type="text" class="tp-display-input tp-input-hour" inputmode="numeric" maxlength="2" placeholder="HH" value="${hourVal}" aria-label="Hour">
        <span class="tp-display-colon">:</span>
        <input type="text" class="tp-display-input tp-input-minute" inputmode="numeric" maxlength="2" placeholder="MM" value="${minuteVal}" aria-label="Minute">
      </div>
      <div class="tp-section">
        <div class="tp-section-label">Hour</div>
        <div class="tp-grid tp-hours">
          ${hours.map(h => {
            const sel = isSet && h === state.hour12 ? ' selected' : '';
            return `<button type="button" class="tp-cell${sel}" data-hour="${h}">${h}</button>`;
          }).join('')}
        </div>
      </div>
      <div class="tp-section">
        <div class="tp-section-label">Minute</div>
        <div class="tp-grid tp-minutes">
          ${minutes.map(m => {
            const sel = isSet && m === state.minute ? ' selected' : '';
            return `<button type="button" class="tp-cell${sel}" data-minute="${m}">:${String(m).padStart(2, '0')}</button>`;
          }).join('')}
        </div>
      </div>
      <div class="tp-footer">
        <div class="tp-ampm">
          <button type="button" class="tp-ampm-btn${isSet && state.ampm === 'AM' ? ' selected' : ''}" data-ampm="AM">AM</button>
          <button type="button" class="tp-ampm-btn${isSet && state.ampm === 'PM' ? ' selected' : ''}" data-ampm="PM">PM</button>
        </div>
        <button type="button" class="tp-clear-btn">Clear</button>
      </div>
    `;

    popup.querySelectorAll('[data-hour]').forEach(b => {
      b.addEventListener('click', () => {
        state.hour12 = parseInt(b.dataset.hour, 10);
        applyState(true);
      });
    });
    popup.querySelectorAll('[data-minute]').forEach(b => {
      b.addEventListener('click', () => {
        state.minute = parseInt(b.dataset.minute, 10);
        applyState(true);
      });
    });
    popup.querySelectorAll('[data-ampm]').forEach(b => {
      b.addEventListener('click', () => {
        state.ampm = b.dataset.ampm;
        applyState(true);
      });
    });
    popup.querySelector('.tp-clear-btn').addEventListener('click', () => {
      trigger.dataset.value = '';
      state = parseTime('');
      updateTriggerLabel();
      const hi = popup.querySelector('.tp-input-hour');
      const mi = popup.querySelector('.tp-input-minute');
      if (hi) hi.value = '';
      if (mi) mi.value = '';
      popup.querySelectorAll('.tp-cell').forEach(c => c.classList.remove('selected'));
      popup.querySelectorAll('.tp-ampm-btn').forEach(c => c.classList.remove('selected'));
    });

    const hi = popup.querySelector('.tp-input-hour');
    const mi = popup.querySelector('.tp-input-minute');

    hi.addEventListener('input', () => {
      hi.value = hi.value.replace(/\D/g, '').slice(0, 2);
      const h = parseInt(hi.value, 10);
      if (!isNaN(h) && h >= 1 && h <= 12) {
        state.hour12 = h;
        applyState(false);
      }
    });
    hi.addEventListener('blur', () => {
      const h = parseInt(hi.value, 10);
      if (isNaN(h) || h < 1 || h > 12) {
        hi.value = trigger.dataset.value ? state.hour12 : '';
      } else {
        state.hour12 = h;
        hi.value = h;
        applyState(false);
      }
    });
    hi.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); hi.blur(); }
    });

    mi.addEventListener('input', () => {
      mi.value = mi.value.replace(/\D/g, '').slice(0, 2);
      const m = parseInt(mi.value, 10);
      if (!isNaN(m) && m >= 0 && m <= 59) {
        state.minute = m;
        applyState(false);
      }
    });
    mi.addEventListener('blur', () => {
      const m = parseInt(mi.value, 10);
      if (isNaN(m) || m < 0 || m > 59) {
        mi.value = trigger.dataset.value ? String(state.minute).padStart(2, '0') : '';
      } else {
        state.minute = m;
        mi.value = String(m).padStart(2, '0');
        applyState(false);
      }
    });
    mi.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); mi.blur(); }
    });
  }

  function applyState(updateInputs) {
    trigger.dataset.value = to24(state);
    updateTriggerLabel();
    popup.querySelectorAll('.tp-hours .tp-cell').forEach(b => {
      b.classList.toggle('selected', parseInt(b.dataset.hour, 10) === state.hour12);
    });
    popup.querySelectorAll('.tp-minutes .tp-cell').forEach(b => {
      b.classList.toggle('selected', parseInt(b.dataset.minute, 10) === state.minute);
    });
    popup.querySelectorAll('[data-ampm]').forEach(b => {
      b.classList.toggle('selected', b.dataset.ampm === state.ampm);
    });
    if (updateInputs) {
      const hi = popup.querySelector('.tp-input-hour');
      const mi = popup.querySelector('.tp-input-minute');
      if (hi) hi.value = state.hour12;
      if (mi) mi.value = String(state.minute).padStart(2, '0');
    }
  }

  function open() {
    state = parseTime(trigger.dataset.value);
    popup.hidden = false;
    renderPopup();
    setTimeout(() => document.addEventListener('click', onDocClick), 0);
    document.addEventListener('keydown', onKey);
  }
  function close() {
    popup.hidden = true;
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onKey);
  }
  function onDocClick(e) { if (!wrap.contains(e.target)) close(); }
  function onKey(e) { if (e.key === 'Escape') close(); }

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    if (popup.hidden) open(); else close();
  });

  wrap.getValue = () => trigger.dataset.value || '';
  wrap.setValue = (v) => {
    trigger.dataset.value = v || '';
    state = parseTime(v);
    updateTriggerLabel();
  };

  updateTriggerLabel();
  return wrap;
}
