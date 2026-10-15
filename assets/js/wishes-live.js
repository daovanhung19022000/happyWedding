import './firebase-config.js';
import { initFirebaseClient, isFirebaseConfigured } from './firebase-config.js';

const SEED_WISHES = [
  { name: 'Tùng', text: '💕 Mãi mãi hạnh phúc bên nhau!' },
  { name: 'Erik', text: '✨ Chúc hai bạn trăm năm hạnh phúc!' },
  { name: 'Tuấn Anh', text: '💖 Chúc mừng hạnh phúc!' },
  { name: 'Nam', text: '❤️ Chúc hai bạn trăm năm hạnh phúc!' },
  { name: 'Duy', text: '🌸 Chúc đôi trẻ mãi yêu thương!' },
];

const SCROLL_SPEED_PX = 120;

let tickerWishes = [];

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
    .sort((a, b) => String(a.timestamp || '').localeCompare(String(b.timestamp || '')))
    .slice(-80);
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

function applyScrollDuration(track) {
  const halfHeight = track.scrollHeight / 2;
  if (!halfHeight) return;
  const seconds = Math.max(8, halfHeight / SCROLL_SPEED_PX);
  track.style.setProperty('--wish-scroll-duration', `${seconds.toFixed(2)}s`);
  track.style.animation = 'none';
  void track.offsetHeight;
  track.style.animation = '';
}

function rebuildTickerTrack() {
  const track = document.getElementById('wish-ticker-track');
  if (!track) return;

  const items = orderedWishList(tickerWishes);
  track.replaceChildren();
  if (!items.length) return;

  track.appendChild(buildTickerGroup(items));
  track.appendChild(buildTickerGroup(items));

  requestAnimationFrame(() => applyScrollDuration(track));
}

function setTickerWishes(list) {
  tickerWishes = list;
  rebuildTickerTrack();
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
  const apply = (docs) => {
    const rows = docs.map((d) => ({ id: d.id, ...d.data() }));
    onList(rows);
  };

  try {
    col
      .orderBy('timestamp', 'desc')
      .limit(80)
      .onSnapshot(
        (snap) => apply(snap.docs),
        () => col.limit(80).onSnapshot((snap) => apply(snap.docs)),
      );
  } catch {
    col.limit(80).onSnapshot((snap) => apply(snap.docs));
  }
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

  subscribeWishes((rows) => setTickerWishes(rows));

  if (!isFirebaseConfigured() || !window.firebaseDb) {
    const local = JSON.parse(localStorage.getItem('wedding_wishes') || '[]');
    setTickerWishes(local);
  }
}
