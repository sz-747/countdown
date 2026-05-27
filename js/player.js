const PLAYER_VOLUME_KEY = 'countdown.cassette.volume.v1';
const PLAYER_TRACK_KEY = 'countdown.cassette.track.v1';
const PLAYER_MINIMIZED_KEY = 'countdown.cassette.minimized.v1';
const PLAYER_POS_KEY = 'countdown.cassette.pos.v1';

const BUILT_IN_TAPES = [
  {
    title: 'Rain sound calm piano',
    src: 'music/2-HOUR STUDY WITH ME _ Rain sound🌧️ Calm Piano ️🎹  _ Pomodoro 50_10 _ Sunrise.mp4',
  },
  {
    title: 'Peaceful piano covers',
    src: 'music/Piano Covers Mix 2021 - Peaceful Piano Music to Study_Sleep_Read to by Ambient Fruits.mp4',
  },
];

export function setupCassettePlayer() {
  const player = document.getElementById('cassette-player');
  const audio = document.getElementById('cassette-audio');
  const shell = document.getElementById('cassette-shell');
  const label = document.getElementById('cassette-label');
  const title = document.getElementById('cassette-title');
  const miniTitle = document.getElementById('cassette-mini-title');
  const fileBtn = document.getElementById('cassette-file-btn');
  const fileInput = document.getElementById('cassette-file-input');
  const minBtn = document.getElementById('cassette-min');
  const expandBtn = document.getElementById('cassette-mini-expand');
  const playBtn = document.getElementById('cassette-play');
  const miniPlayBtn = document.getElementById('cassette-mini-play');
  const prevBtn = document.getElementById('cassette-prev');
  const nextBtn = document.getElementById('cassette-next');
  const shuffleBtn = document.getElementById('cassette-shuffle');
  const repeatBtn = document.getElementById('cassette-repeat');
  const muteBtn = document.getElementById('cassette-mute');
  const progress = document.getElementById('cassette-progress');
  const volume = document.getElementById('cassette-volume');
  const current = document.getElementById('cassette-current');
  const duration = document.getElementById('cassette-duration');
  const list = document.getElementById('cassette-list');

  if (!player || !audio || !shell) return;

  let tapes = [...BUILT_IN_TAPES];
  let currentIndex = restoreTrackIndex(tapes);
  let shuffle = false;
  let repeat = false;
  let seeking = false;
  let positioned = false;
  let justDragged = false;

  audio.volume = restoreVolume();
  volume.value = audio.volume;
  paintRange(volume);
  paintRange(progress);
  // Default to the compact widget so it stays out of the way until summoned.
  const savedMin = localStorage.getItem(PLAYER_MINIMIZED_KEY);
  if (savedMin === null || savedMin === '1') player.classList.add('minimized');
  renderPlaylist();
  loadTape(currentIndex, false);
  updateMuteButton();
  setupDragAndDock();

  fileBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    revokeLocalTapes(tapes);
    const localTapes = [...fileInput.files].map(file => ({
      title: cleanTitle(file.name),
      src: URL.createObjectURL(file),
      local: true,
    }));
    tapes = [...BUILT_IN_TAPES, ...localTapes];
    currentIndex = BUILT_IN_TAPES.length;
    renderPlaylist();
    loadTape(currentIndex, true);
  });

  minBtn.addEventListener('click', () => setMinimized(true));
  expandBtn.addEventListener('click', () => {
    if (justDragged) return;
    setMinimized(false);
  });

  playBtn.addEventListener('click', togglePlay);
  miniPlayBtn.addEventListener('click', togglePlay);

  prevBtn.addEventListener('click', () => {
    if (!tapes.length) return;
    if (audio.currentTime > 4) {
      audio.currentTime = 0;
      return;
    }
    loadTape(wrapIndex(currentIndex - 1), true);
  });

  nextBtn.addEventListener('click', () => {
    if (!tapes.length) return;
    loadTape(nextIndex(), true);
  });

  shuffleBtn.addEventListener('click', () => {
    shuffle = !shuffle;
    shuffleBtn.classList.toggle('active', shuffle);
    shuffleBtn.setAttribute('aria-pressed', String(shuffle));
  });

  repeatBtn.addEventListener('click', () => {
    repeat = !repeat;
    repeatBtn.classList.toggle('active', repeat);
    repeatBtn.setAttribute('aria-pressed', String(repeat));
  });

  muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    updateMuteButton();
  });

  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value);
    audio.muted = audio.volume === 0;
    localStorage.setItem(PLAYER_VOLUME_KEY, String(audio.volume));
    paintRange(volume);
    updateMuteButton();
  });

  progress.addEventListener('input', () => {
    seeking = true;
    paintRange(progress);
    current.textContent = formatTime((Number(progress.value) / 1000) * (audio.duration || 0));
  });

  progress.addEventListener('change', () => {
    if (Number.isFinite(audio.duration)) {
      audio.currentTime = (Number(progress.value) / 1000) * audio.duration;
    }
    seeking = false;
  });

  audio.addEventListener('loadstart', () => {
    player.classList.remove('error');
    player.classList.add('loading');
  });
  audio.addEventListener('canplay', () => player.classList.remove('loading'));
  audio.addEventListener('playing', () => {
    player.classList.remove('loading', 'error');
    player.classList.add('playing');
    setPlayLabels('Pause');
    setLabel('Now playing');
  });
  audio.addEventListener('pause', () => {
    player.classList.remove('playing');
    setPlayLabels('Play');
    if (!player.classList.contains('error')) setLabel('Study tapes');
  });
  audio.addEventListener('error', () => {
    if (audio.src) showError();
  });
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('durationchange', updateProgress);
  audio.addEventListener('ended', () => {
    if (repeat) {
      audio.currentTime = 0;
      playCurrent();
      return;
    }
    loadTape(nextIndex(), true);
  });

  window.addEventListener('beforeunload', () => revokeLocalTapes(tapes));

  function togglePlay() {
    if (!tapes.length) {
      fileInput.click();
      return;
    }
    if (audio.paused) playCurrent();
    else audio.pause();
  }

  function setMinimized(min) {
    player.classList.toggle('minimized', min);
    localStorage.setItem(PLAYER_MINIMIZED_KEY, min ? '1' : '0');
    clampIntoView();
  }

  function setupDragAndDock() {
    applySavedPosition();

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let baseLeft = 0;
    let baseTop = 0;

    player.addEventListener('pointerdown', e => {
      if (!isDesktop() || e.button !== 0) return;
      if (e.target.closest('input, .cassette-control, .cassette-mini-play, .cassette-icon-btn, .cassette-track')) return;
      const rect = player.getBoundingClientRect();
      baseLeft = rect.left;
      baseTop = rect.top;
      startX = e.clientX;
      startY = e.clientY;
      dragging = true;
      moved = false;
      player.setPointerCapture(e.pointerId);
    });

    player.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      moved = true;
      positioned = true;
      player.classList.add('dragging');
      setPos(baseLeft + dx, baseTop + dy);
    });

    player.addEventListener('pointerup', e => {
      if (!dragging) return;
      dragging = false;
      player.classList.remove('dragging');
      try { player.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      if (!moved) return;
      clampIntoView();
      const rect = player.getBoundingClientRect();
      localStorage.setItem(PLAYER_POS_KEY, JSON.stringify({ left: rect.left, top: rect.top }));
      justDragged = true;
      setTimeout(() => { justDragged = false; }, 0);
    });

    // Auto-dock: collapse to the widget when interacting anywhere else.
    document.addEventListener('pointerdown', e => {
      if (player.classList.contains('minimized')) return;
      if (player.contains(e.target)) return;
      setMinimized(true);
    });

    window.addEventListener('resize', clampIntoView);
  }

  function applySavedPosition() {
    if (!isDesktop()) return;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(PLAYER_POS_KEY) || 'null'); } catch { /* ignore */ }
    if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
      positioned = true;
      setPos(saved.left, saved.top);
      clampIntoView();
    }
  }

  function setPos(left, top) {
    player.style.left = `${left}px`;
    player.style.top = `${top}px`;
    player.style.right = 'auto';
    player.style.bottom = 'auto';
  }

  function clampIntoView() {
    if (!positioned || !isDesktop()) return;
    const rect = player.getBoundingClientRect();
    const pad = 8;
    const left = Math.min(Math.max(pad, rect.left), window.innerWidth - rect.width - pad);
    const top = Math.min(Math.max(pad, rect.top), window.innerHeight - rect.height - pad);
    setPos(left, top);
  }

  function isDesktop() {
    return window.innerWidth > 900;
  }

  function loadTape(index, autoplay) {
    if (!tapes.length) {
      setTitles('Load a tape');
      list.innerHTML = '<div class="cassette-empty">No tapes loaded.</div>';
      return;
    }

    currentIndex = wrapIndex(index);
    const tape = tapes[currentIndex];
    setTitles(tape.title);
    player.classList.remove('error');
    audio.src = tape.src;
    localStorage.setItem(PLAYER_TRACK_KEY, String(currentIndex));
    renderPlaylist();
    updateProgress();
    if (autoplay) playCurrent();
  }

  function playCurrent() {
    const attempt = audio.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => showError());
    }
  }

  function showError() {
    player.classList.remove('loading', 'playing');
    player.classList.add('error');
    setLabel('Tape unavailable');
  }

  function setLabel(text) {
    label.textContent = text;
  }

  function setTitles(text) {
    title.textContent = text;
    miniTitle.textContent = text;
  }

  function setPlayLabels(state) {
    [playBtn, miniPlayBtn].forEach(btn => {
      btn.setAttribute('aria-label', state);
      btn.title = state;
    });
  }

  function renderPlaylist() {
    if (!tapes.length) {
      list.innerHTML = '<div class="cassette-empty">No tapes loaded.</div>';
      return;
    }

    list.replaceChildren(...tapes.map((tape, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cassette-track';
      button.classList.toggle('active', index === currentIndex);
      button.innerHTML = `<span>${escapeHtml(tape.title)}</span><strong>${String(index + 1).padStart(2, '0')}</strong>`;
      button.addEventListener('click', () => loadTape(index, true));
      return button;
    }));
  }

  function updateProgress() {
    const total = Number.isFinite(audio.duration) ? audio.duration : 0;
    const position = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    const played = total ? position / total : 0;
    if (!seeking) progress.value = Math.round(played * 1000);
    paintRange(progress);
    player.style.setProperty('--played', played.toFixed(4));
    current.textContent = formatTime(position);
    duration.textContent = formatTime(total);
  }

  function updateMuteButton() {
    const silenced = audio.muted || audio.volume === 0;
    muteBtn.classList.toggle('active', silenced);
    muteBtn.setAttribute('aria-pressed', String(silenced));
    muteBtn.setAttribute('aria-label', silenced ? 'Unmute' : 'Mute');
  }

  function nextIndex() {
    if (!shuffle || tapes.length < 2) return wrapIndex(currentIndex + 1);
    let next = currentIndex;
    while (next === currentIndex) next = Math.floor(Math.random() * tapes.length);
    return next;
  }

  function wrapIndex(index) {
    return (index + tapes.length) % tapes.length;
  }
}

function restoreTrackIndex(tapes) {
  if (!tapes.length) return 0;
  const saved = Number(localStorage.getItem(PLAYER_TRACK_KEY));
  return Number.isInteger(saved) && saved >= 0 && saved < tapes.length ? saved : 0;
}

function restoreVolume() {
  const saved = Number(localStorage.getItem(PLAYER_VOLUME_KEY));
  return Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : 0.8;
}

function paintRange(input) {
  const min = Number(input.min) || 0;
  const max = Number(input.max) || 100;
  const pct = max > min ? ((Number(input.value) - min) / (max - min)) * 100 : 0;
  input.style.setProperty('--fill', `${pct}%`);
}

function cleanTitle(name) {
  return name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim() || name;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function revokeLocalTapes(tapes) {
  tapes.filter(tape => tape.local).forEach(tape => URL.revokeObjectURL(tape.src));
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}
