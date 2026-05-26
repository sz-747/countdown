const PLAYER_VOLUME_KEY = 'countdown.cassette.volume.v1';
const PLAYER_TRACK_KEY = 'countdown.cassette.track.v1';

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
  const audio = document.getElementById('cassette-audio');
  const shell = document.getElementById('cassette-shell');
  const title = document.getElementById('cassette-title');
  const fileBtn = document.getElementById('cassette-file-btn');
  const fileInput = document.getElementById('cassette-file-input');
  const playBtn = document.getElementById('cassette-play');
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

  if (!audio || !shell) return;

  let tapes = [...BUILT_IN_TAPES];
  let currentIndex = restoreTrackIndex(tapes);
  let shuffle = false;
  let repeat = false;
  let seeking = false;

  audio.volume = restoreVolume();
  volume.value = audio.volume;
  paintRange(volume);
  paintRange(progress);
  renderPlaylist();
  loadTape(currentIndex, false);

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

  playBtn.addEventListener('click', () => {
    if (!tapes.length) {
      fileInput.click();
      return;
    }
    if (audio.paused) playCurrent();
    else audio.pause();
  });

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

  audio.addEventListener('loadstart', () => shell.classList.add('loading'));
  audio.addEventListener('canplay', () => shell.classList.remove('loading'));
  audio.addEventListener('playing', () => {
    shell.classList.remove('loading');
    shell.classList.add('playing');
    playBtn.setAttribute('aria-label', 'Pause');
    playBtn.title = 'Pause';
  });
  audio.addEventListener('pause', () => {
    shell.classList.remove('playing');
    playBtn.setAttribute('aria-label', 'Play');
    playBtn.title = 'Play';
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

  function loadTape(index, autoplay) {
    if (!tapes.length) {
      title.textContent = 'Load a tape';
      list.innerHTML = '<div class="cassette-empty">No tapes loaded.</div>';
      return;
    }

    currentIndex = wrapIndex(index);
    const tape = tapes[currentIndex];
    title.textContent = tape.title;
    audio.src = tape.src;
    localStorage.setItem(PLAYER_TRACK_KEY, String(currentIndex));
    renderPlaylist();
    updateProgress();

    shell.classList.add('loading');
    window.setTimeout(() => shell.classList.remove('loading'), 650);
    if (autoplay) playCurrent();
  }

  function playCurrent() {
    audio.play().catch(() => {
      shell.classList.remove('loading', 'playing');
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
      button.innerHTML = `<span>${escapeHtml(tape.title)}</span><strong>${index + 1}</strong>`;
      button.addEventListener('click', () => loadTape(index, true));
      return button;
    }));
  }

  function updateProgress() {
    const total = Number.isFinite(audio.duration) ? audio.duration : 0;
    const position = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    if (!seeking) progress.value = total ? Math.round((position / total) * 1000) : 0;
    paintRange(progress);
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
