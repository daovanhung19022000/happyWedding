import './firebase-config.js';
import { initFirebaseClient, isFirebaseConfigured } from './firebase-config.js';

const SEED_WISHES = [
  { name: 'Tùng', text: '💕 Mãi mãi hạnh phúc bên nhau!' },
  { name: 'Erik', text: '✨ Chúc hai bạn trăm năm hạnh phúc!' },
  { name: 'Tuấn Anh', text: '💖 Chúc mừng hạnh phúc!' },
  { name: 'Nam', text: '❤️ Chúc hai bạn trăm năm hạnh phúc!' },
  { name: 'Duy', text: '🌸 Chúc đôi trẻ mãi yêu thương!' },
];

const SCROLL_SPEED_PX = 42;
const TICKER_REBUILD_DEBOUNCE_MS = 300;
const TICKER_WISH_LIMIT = 200;

let tickerWishes = [];
let tickerListSignature = '';
let tickerRebuildTimer = null;
let tickerHasRendered = false;
let tickerRaf = null;
let tickerOffsetPx = 0;
let tickerSegmentPx = 0;
let tickerLastTs = 0;
let tickerPaused = false;

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatWishTime(iso) {
  if (!iso) return 'Vừa xong';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Vừa xong';
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')} ${d.getDate()}/${d.getMonth() + 1}`;
}

function orderedWishList(list) {
  const merged = list.length ? list : SEED_WISHES;
  return merged
    .slice()
    .sort((a, b) => {
      const ta = String(a.timestamp || '');
      const tb = String(b.timestamp || '');
      if (ta !== tb) return ta.localeCompare(tb);
      return String(a.id || '').localeCompare(String(b.id || ''));
    })
    .slice(-TICKER_WISH_LIMIT);
}

function createTickerBubbleEl(wish) {
  const el = document.createElement('div');
  el.className = 'wish-ticker-bubble';
  el.innerHTML = `<span class="wish-ticker-bubble__name">${escapeHtml(wish.name || 'Khách')}:</span> ${escapeHtml(wish.text)}`;
  return el;
}

function buildTickerGroup(items) {
  const group = document.createElement('div');
  group.className = 'wish-ticker-group';
  items.forEach((wish) => group.appendChild(createTickerBubbleEl(wish)));
  return group;
}

function wishesSignature(list) {
  return list
    .map((w) => w.id || `${w.timestamp || ''}\t${w.name || ''}\t${w.text || ''}`)
    .join('\n');
}

function measureSegmentHeight(groupEl) {
  if (!groupEl) return 0;
  return Math.round(groupEl.offsetHeight);
}

function applyTickerTransform(track) {
  track.style.transform = `translate3d(0, ${-tickerOffsetPx}px, 0)`;
}

function tickerReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function tickerFrame(ts) {
  const track = document.getElementById('wish-ticker-track');
  if (!track) {
    tickerRaf = requestAnimationFrame(tickerFrame);
    return;
  }
  if (tickerReducedMotion() || tickerPaused || !tickerSegmentPx) {
    tickerLastTs = ts;
    tickerRaf = requestAnimationFrame(tickerFrame);
    return;
  }
  if (!tickerLastTs) tickerLastTs = ts;
  const dt = Math.min(0.05, (ts - tickerLastTs) / 1000);
  tickerLastTs = ts;
  tickerOffsetPx += SCROLL_SPEED_PX * dt;
  while (tickerSegmentPx > 0 && tickerOffsetPx >= tickerSegmentPx) {
    tickerOffsetPx -= tickerSegmentPx;
  }
  applyTickerTransform(track);
  tickerRaf = requestAnimationFrame(tickerFrame);
}

function startTickerEngine() {
  if (tickerRaf) return;
  tickerLastTs = 0;
  tickerRaf = requestAnimationFrame(tickerFrame);
}

function stopTickerEngine() {
  if (tickerRaf) cancelAnimationFrame(tickerRaf);
  tickerRaf = null;
  tickerLastTs = 0;
}

function rebuildTickerTrack() {
  const track = document.getElementById('wish-ticker-track');
  const layer = document.getElementById('wish-ticker-layer');
  if (!track) return;

  const items = orderedWishList(tickerWishes);
  const prevRatio =
    tickerSegmentPx > 0 ? (tickerOffsetPx % tickerSegmentPx) / tickerSegmentPx : 0;

  if (!items.length) {
    track.replaceChildren();
    tickerSegmentPx = 0;
    track.classList.remove('is-ready');
    return;
  }

  track.replaceChildren();
  const groupA = buildTickerGroup(items);
  const groupB = buildTickerGroup(items);
  groupB.setAttribute('aria-hidden', 'true');
  track.append(groupA, groupB);
  track.dataset.wishCount = String(items.length);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      tickerSegmentPx = measureSegmentHeight(groupA);
      tickerOffsetPx = tickerSegmentPx && prevRatio > 0 ? prevRatio * tickerSegmentPx : 0;
      applyTickerTransform(track);
      track.classList.add('is-ready');
      if (layer) layer.classList.add('is-ready');
      startTickerEngine();
    });
  });
}

function setTickerWishes(list, { force = false, fromCache = false } = {}) {
  const prevCount = tickerWishes.length;
  if (
    !force &&
    fromCache &&
    list.length > 0 &&
    prevCount > 0 &&
    list.length < prevCount
  ) {
    return;
  }
  const sig = wishesSignature(list);
  if (!force && sig === tickerListSignature && tickerHasRendered) return;
  tickerListSignature = sig;
  tickerWishes = list;
  if (tickerRebuildTimer) window.clearTimeout(tickerRebuildTimer);
  const grew = list.length > prevCount;
  const delay = tickerHasRendered && !grew ? TICKER_REBUILD_DEBOUNCE_MS : 0;
  tickerRebuildTimer = window.setTimeout(() => {
    tickerRebuildTimer = null;
    tickerHasRendered = true;
    rebuildTickerTrack();
  }, delay);
}

function mapWishDocs(docs) {
  return docs.map((d) => ({ id: d.id, ...d.data() }));
}

function mergeWishDocsIntoMap(map, docs) {
  docs.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
}

function applyWishSnapshotToMap(map, snap) {
  if (typeof snap.docChanges === 'function') {
    snap.docChanges().forEach((change) => {
      if (change.type === 'removed') map.delete(change.doc.id);
      else map.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
    });
  }
  if (!map.size && snap.docs?.length) {
    mergeWishDocsIntoMap(map, snap.docs);
  }
}

async function subscribeWishes(onList) {
  if (!isFirebaseConfigured()) {
    onList([]);
    return;
  }
  initFirebaseClient();
  if (!window.firebaseDb) {
    onList([]);
    return;
  }

  const col = window.firebaseDb.collection('wishes');
  const wishById = new Map();

  const emit = (fromCache = false) => {
    const rows = [...wishById.values()];
    if (!rows.length && tickerWishes.length) return;
    onList(rows, { fromCache });
  };

  let query = col.orderBy('timestamp', 'asc').limit(TICKER_WISH_LIMIT);

  try {
    const first = await query.get();
    mergeWishDocsIntoMap(wishById, first.docs);
    emit(false);
  } catch (err) {
    console.warn('Không tải được danh sách lời chúc (orderBy):', err);
    query = col.limit(TICKER_WISH_LIMIT);
    try {
      const fallback = await query.get();
      mergeWishDocsIntoMap(wishById, fallback.docs);
      emit(false);
    } catch {
      onList([]);
      return;
    }
  }

  let unsub = null;
  const listen = (q) => {
    if (unsub) unsub();
    unsub = q.onSnapshot(
      (snap) => {
        applyWishSnapshotToMap(wishById, snap);
        emit(Boolean(snap.metadata?.fromCache));
      },
      (err) => {
        console.warn('Listen lời chúc lỗi, dùng query không sort:', err);
        listen(col.limit(TICKER_WISH_LIMIT));
      },
    );
  };

  listen(query);
}

async function submitWish(name, text) {
  const payload = {
    name: name.trim(),
    text: text.trim(),
    time: formatWishTime(new Date().toISOString()),
    timestamp: new Date().toISOString(),
  };

  if (window.firebaseDb && isFirebaseConfigured()) {
    await window.firebaseDb.collection('wishes').add(payload);
    return;
  }

  const local = JSON.parse(localStorage.getItem('wedding_wishes') || '[]');
  local.unshift(payload);
  localStorage.setItem('wedding_wishes', JSON.stringify(local));
}

function openComposeSheet() {
  const sheet = document.getElementById('wish-compose-sheet');
  const backdrop = document.getElementById('wish-compose-backdrop');
  if (!sheet || !backdrop) return;
  sheet.hidden = false;
  backdrop.hidden = false;
  document.body.style.overflow = 'hidden';
  document.getElementById('wish-message')?.focus();
}

function closeComposeSheet() {
  const sheet = document.getElementById('wish-compose-sheet');
  const backdrop = document.getElementById('wish-compose-backdrop');
  if (!sheet || !backdrop) return;
  sheet.hidden = true;
  backdrop.hidden = true;
  if (!document.getElementById('gift-dialog')?.classList.contains('is-open')) {
    document.body.style.overflow = '';
  }
}

function setTickerLayerVisible(visible) {
  const layer = document.getElementById('wish-ticker-layer');
  if (!layer) return;
  layer.classList.toggle('wish-ticker-layer--hidden', !visible);
  tickerPaused = !visible;
  if (visible) startTickerEngine();
}

function bindTickerToggle() {
  const input = document.getElementById('wish-ticker-toggle');
  if (!input) return;

  input.checked = true;
  setTickerLayerVisible(true);

  input.addEventListener('change', () => {
    setTickerLayerVisible(input.checked);
  });
}

function bindGiftDockButton() {
  const btn = document.getElementById('wish-dock-gift');
  if (!btn || btn.dataset.bound === '1') return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', () => {
    if (typeof window.openGiftDialog === 'function') window.openGiftDialog();
  });
}

function bindComposeForm() {
  const form = document.getElementById('wish-form');
  const statusEl = document.getElementById('wish-compose-status');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('wish-name')?.value?.trim() || '';
    const text = document.getElementById('wish-message')?.value?.trim() || '';
    if (!name || !text) {
      if (statusEl) {
        statusEl.textContent = 'Vui lòng nhập tên và lời chúc.';
        statusEl.classList.add('is-error');
      }
      return;
    }
    const submitBtn = form.querySelector('.wish-compose-submit');
    submitBtn.disabled = true;
    if (statusEl) {
      statusEl.textContent = 'Đang gửi…';
      statusEl.classList.remove('is-error');
    }
    try {
      await submitWish(name, text);
      form.reset();
      const guestPreset = document.getElementById('wish-name')?.dataset?.guestPreset;
      if (guestPreset) document.getElementById('wish-name').value = guestPreset;
      if (statusEl) statusEl.textContent = 'Đã gửi lời chúc — cảm ơn bạn!';
      window.setTimeout(closeComposeSheet, 700);
    } catch (err) {
      console.error(err);
      if (statusEl) {
        statusEl.textContent = 'Gửi thất bại, thử lại sau.';
        statusEl.classList.add('is-error');
      }
    } finally {
      submitBtn.disabled = false;
    }
  });
}

export function setWishGuestName(fullGreeting) {
  const input = document.getElementById('wish-name');
  if (!input || !fullGreeting) return;
  input.value = fullGreeting;
  input.dataset.guestPreset = fullGreeting;
}

export function initWishesLive() {
  const dock = document.getElementById('wish-dock');
  if (!dock) return;

  document.body.classList.add('has-wish-dock');

  document.getElementById('wish-dock-compose-open')?.addEventListener('click', openComposeSheet);
  document.getElementById('wish-compose-backdrop')?.addEventListener('click', closeComposeSheet);
  document.querySelector('.wish-compose-cancel')?.addEventListener('click', closeComposeSheet);

  bindComposeForm();
  bindTickerToggle();
  bindGiftDockButton();

  subscribeWishes((rows, meta = {}) => setTickerWishes(rows, meta));

  if (!isFirebaseConfigured()) {
    const local = JSON.parse(localStorage.getItem('wedding_wishes') || '[]');
    setTickerWishes(local, { force: true });
  }
}
