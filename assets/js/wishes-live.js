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
const WISH_TICKER_PREF_KEY = 'wedding_wish_ticker_on_v1';

let tickerWishes = [];
let tickerListSignature = '';
let tickerRebuildTimer = null;
let tickerHasRendered = false;
let tickerLayoutReady = false;
let tickerRaf = null;
/** Vị trí cuộn logic — chỉ tăng, không bị modulo ghi đè (tránh kẹt). */
let tickerScrollPx = 0;
let tickerSegmentPx = 0;
let tickerSegmentPxLast = 0;
let tickerViewportPx = 0;
let tickerLeadPx = 0;
let tickerLastTs = 0;
let tickerPaused = false;
let tickerSegmentObserver = null;

const TICKER_BUBBLE_EST_PX = 34;
const TICKER_GROUP_GAP_PX = 7;

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

function getTickerViewportEl() {
  return document.querySelector('.wish-ticker-viewport');
}

function measureTickerViewport() {
  const vp = getTickerViewportEl();
  return vp?.offsetHeight || Math.round(window.innerHeight * 0.33) || 280;
}

/** Lặp danh sách đủ cao để vòng cuộn ≥ viewport — tránh khựng khi ít lời chúc. */
function expandCycleItems(items, viewportH) {
  if (!items.length) return items;
  const minSegment = Math.ceil(viewportH * 1.12);
  const estPerItem = TICKER_BUBBLE_EST_PX + TICKER_GROUP_GAP_PX;
  const minCount = Math.max(items.length, Math.ceil(minSegment / estPerItem));
  let cycle = items.slice();
  let guard = 0;
  while (cycle.length < minCount && guard < 32) {
    cycle = cycle.concat(items);
    guard += 1;
  }
  return cycle;
}

function createTickerLeadSpacer(heightPx) {
  const el = document.createElement('div');
  el.className = 'wish-ticker-lead';
  el.style.height = `${Math.max(0, Math.round(heightPx))}px`;
  el.setAttribute('aria-hidden', 'true');
  return el;
}

function getActiveSegmentPx() {
  return tickerSegmentPx > 0 ? tickerSegmentPx : tickerSegmentPxLast;
}

function getTickerDrawOffset(scrollPx = tickerScrollPx, lead = tickerLeadPx, segment = getActiveSegmentPx()) {
  const pos = Math.max(0, scrollPx);
  if (segment <= 0 || lead <= 0) return pos;
  if (pos <= lead) return pos;
  return lead + ((pos - lead) % segment);
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
  const drawY = getTickerDrawOffset();
  track.style.transform = `translate3d(0, ${-drawY}px, 0)`;
}

function preserveScrollAcrossSegmentChange(prevScroll, prevSegment, nextSegment, lead = tickerLeadPx) {
  if (nextSegment <= 0) return Math.max(0, prevScroll);
  if (prevScroll <= lead) return Math.max(0, prevScroll);
  if (prevSegment <= 0) return prevScroll;
  const loopPos = (prevScroll - lead) % prevSegment;
  const safeLoop =
    loopPos >= 0 ? loopPos : loopPos + prevSegment * (1 + Math.ceil(-loopPos / prevSegment));
  const ratio = safeLoop / prevSegment;
  return lead + ratio * nextSegment;
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
  if (tickerReducedMotion() || tickerPaused) {
    tickerLastTs = ts;
    tickerRaf = requestAnimationFrame(tickerFrame);
    return;
  }
  if (!tickerLastTs) tickerLastTs = ts;
  const dt = Math.min(0.05, (ts - tickerLastTs) / 1000);
  tickerLastTs = ts;
  if (getActiveSegmentPx() > 0) {
    tickerScrollPx += SCROLL_SPEED_PX * dt;
    applyTickerTransform(track);
  }
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

function attachSegmentObserver(groupA) {
  if (tickerSegmentObserver) tickerSegmentObserver.disconnect();
  if (typeof ResizeObserver === 'undefined' || !groupA) return;
  tickerSegmentObserver = new ResizeObserver(() => {
    if (!groupA.isConnected) return;
    const next = measureSegmentHeight(groupA);
    if (next <= 0 || next === tickerSegmentPx) return;
    const prevScroll = tickerScrollPx;
    const prevSegment = tickerSegmentPx;
    tickerSegmentPx = next;
    tickerSegmentPxLast = next;
    tickerScrollPx = preserveScrollAcrossSegmentChange(prevScroll, prevSegment, next);
    const track = document.getElementById('wish-ticker-track');
    if (track) applyTickerTransform(track);
  });
  tickerSegmentObserver.observe(groupA);
}

function finalizeTickerLayout(track, layer, groupA, { prevScroll, prevSegment, isFirstPaint }) {
  void track.offsetHeight;
  let measured = measureSegmentHeight(groupA);
  if (measured <= 0) {
    void groupA.offsetHeight;
    measured = measureSegmentHeight(groupA);
  }
  tickerSegmentPx = measured;
  if (measured > 0) tickerSegmentPxLast = measured;

  tickerLeadPx = tickerViewportPx;

  if (isFirstPaint) {
    tickerScrollPx = 0;
  } else {
    tickerScrollPx = preserveScrollAcrossSegmentChange(prevScroll, prevSegment, measured);
  }

  applyTickerTransform(track);
  track.classList.add('is-ready');
  if (layer) layer.classList.add('is-ready');
  attachSegmentObserver(groupA);
  tickerLayoutReady = true;
  startTickerEngine();
}

function rebuildTickerTrack() {
  const track = document.getElementById('wish-ticker-track');
  const layer = document.getElementById('wish-ticker-layer');
  if (!track) return;

  const baseItems = orderedWishList(tickerWishes);
  const prevScroll = tickerScrollPx;
  const prevSegment = tickerSegmentPx;
  const isFirstPaint = !tickerLayoutReady;

  tickerViewportPx = measureTickerViewport();
  tickerLeadPx = tickerViewportPx;

  if (!baseItems.length) {
    track.replaceChildren();
    tickerSegmentPx = 0;
    track.classList.remove('is-ready');
    if (tickerSegmentObserver) tickerSegmentObserver.disconnect();
    return;
  }

  const cycleItems = expandCycleItems(baseItems, tickerViewportPx);
  if (tickerSegmentObserver) tickerSegmentObserver.disconnect();
  track.replaceChildren();
  const groupA = buildTickerGroup(cycleItems);
  const groupB = buildTickerGroup(cycleItems);
  groupB.setAttribute('aria-hidden', 'true');
  track.append(createTickerLeadSpacer(tickerLeadPx), groupA, groupB);
  track.dataset.wishCount = String(baseItems.length);

  finalizeTickerLayout(track, layer, groupA, { prevScroll, prevSegment, isFirstPaint });
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

function readWishTickerPref() {
  try {
    return sessionStorage.getItem(WISH_TICKER_PREF_KEY) === '1';
  } catch {
    return false;
  }
}

function saveWishTickerPref(on) {
  try {
    sessionStorage.setItem(WISH_TICKER_PREF_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function enableWishTicker(show = true) {
  const input = document.getElementById('wish-ticker-toggle');
  if (input) input.checked = show;
  saveWishTickerPref(show);
  setTickerLayerVisible(show);
}

function bindTickerToggle() {
  const input = document.getElementById('wish-ticker-toggle');
  if (!input) return;

  const initialOn = readWishTickerPref();
  input.checked = initialOn;
  setTickerLayerVisible(initialOn);

  input.addEventListener('change', () => {
    saveWishTickerPref(input.checked);
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
      enableWishTicker(true);
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
