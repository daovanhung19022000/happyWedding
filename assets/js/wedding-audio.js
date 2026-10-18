import { playlist, resolveMusicUrl } from './music-list.js';

const SESSION_KEY = 'wedding_audio_state_v1';

let currentTrackIndex = 0;
let isAudioPlaying = false;
let audioElement = new Audio();
let audioUnlocked = false;
let saveTimer = null;

function getAudioUi() {
  return {
    btn: document.getElementById('audio-toggle-btn'),
    disk: document.getElementById('audio-disk'),
  };
}

function pickRandomTrackIndex(except = -1) {
  if (!playlist.length) return 0;
  if (playlist.length === 1) return 0;
  let idx = except;
  while (idx === except) {
    idx = Math.floor(Math.random() * playlist.length);
  }
  return idx;
}

function loadTrack(index) {
  const track = playlist[index];
  if (!track?.url) return;
  currentTrackIndex = index;
  audioElement.src = resolveMusicUrl(track.url);
}

function persistState() {
  try {
    if (!audioElement.src) return;
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        src: audioElement.src,
        time: audioElement.currentTime,
        playing: isAudioPlaying && !audioElement.paused,
        index: currentTrackIndex,
      }),
    );
  } catch {
    /* ignore */
  }
}

function schedulePersist() {
  if (saveTimer) return;
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    persistState();
  }, 400);
}

function readSavedState() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function markPlaying() {
  isAudioPlaying = true;
  const { btn, disk } = getAudioUi();
  btn?.classList.remove('is-paused');
  disk?.classList.add('spinning');
}

function markPaused() {
  isAudioPlaying = false;
  const { btn, disk } = getAudioUi();
  btn?.classList.add('is-paused');
  disk?.classList.remove('spinning');
}

async function startPlayback(unmute = false) {
  if (unmute) {
    audioElement.muted = false;
    audioUnlocked = true;
  }
  try {
    await audioElement.play();
    markPlaying();
    return true;
  } catch {
    return false;
  }
}

function unlockAudioWithSound() {
  if (audioUnlocked && isAudioPlaying && !audioElement.muted) return;
  audioUnlocked = true;
  audioElement.muted = false;
  if (audioElement.paused) {
    startPlayback(true);
  } else {
    markPlaying();
  }
}

async function bootstrapMutedAutoplay() {
  audioElement.muted = true;
  const ok = await startPlayback(false);
  if (ok) {
    audioElement.muted = false;
    audioUnlocked = true;
  } else {
    markPaused();
  }
}

function restoreFromSession() {
  const saved = readSavedState();
  if (!saved?.src || !saved.playing) return false;

  audioElement.src = saved.src;
  currentTrackIndex =
    typeof saved.index === 'number' && saved.index >= 0 ? saved.index : currentTrackIndex;

  const seek = () => {
    if (typeof saved.time === 'number' && saved.time > 0) {
      try {
        audioElement.currentTime = saved.time;
      } catch {
        /* ignore */
      }
    }
  };

  if (audioElement.readyState >= 1) seek();
  else audioElement.addEventListener('loadedmetadata', seek, { once: true });

  audioUnlocked = true;
  audioElement.muted = false;
  startPlayback(true);
  return true;
}

/**
 * @param {{ enableIntroAutoplay?: boolean }} options
 */
export function initWeddingAudio(options = {}) {
  const { enableIntroAutoplay = false } = options;
  const { btn } = getAudioUi();
  if (!btn) return;

  if (!restoreFromSession()) {
    loadTrack(pickRandomTrackIndex());
    if (enableIntroAutoplay) {
      bootstrapMutedAutoplay();
    }
  }

  audioElement.preload = 'auto';

  audioElement.addEventListener('ended', () => {
    loadTrack(pickRandomTrackIndex(currentTrackIndex));
    if (isAudioPlaying) {
      audioElement.play().catch(() => {});
    }
    schedulePersist();
  });

  audioElement.addEventListener('timeupdate', schedulePersist);

  window.addEventListener('pagehide', persistState);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persistState();
  });

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isAudioPlaying) {
      audioElement.pause();
      markPaused();
      persistState();
    } else {
      unlockAudioWithSound();
      persistState();
    }
  });

  if (enableIntroAutoplay) {
    window.addEventListener('wedding:first-open', unlockAudioWithSound);
    window.addEventListener('wedding:intro-complete', unlockAudioWithSound, { once: true });

    const onFirstGesture = () => unlockAudioWithSound();
    ['pointerdown', 'touchstart', 'click', 'keydown'].forEach((evt) => {
      window.addEventListener(evt, onFirstGesture, { once: true, passive: true });
    });

    window.setTimeout(() => unlockAudioWithSound(), 400);
    window.setTimeout(() => unlockAudioWithSound(), 2600);
  } else if (readSavedState()?.playing) {
    unlockAudioWithSound();
  }
}
