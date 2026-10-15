import { buildGuestKey, buildInviteUrl } from './invite-config.js';

const STORAGE_KEY = 'wedding_guest_invites';

export function loadGuestInvites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveGuestInvites(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function createGuestInvite(name, role, modeCode) {
  const trimmedName = String(name || '').trim();
  const trimmedRole = String(role || '').trim();
  const mode = String(modeCode ?? '0');
  return {
    id: crypto.randomUUID(),
    name: trimmedName,
    role: trimmedRole,
    mode,
    url: buildInviteUrl(mode, trimmedName, trimmedRole),
    guestKey: buildGuestKey(mode, trimmedName, trimmedRole),
    createdAt: new Date().toISOString(),
  };
}

/** Thêm mới; trùng guestKey thì bỏ qua. Trả về { added, skipped } */
export function upsertGuestInvites(entries) {
  const existing = loadGuestInvites();
  const keys = new Set(existing.map((g) => g.guestKey));
  let added = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (!entry?.guestKey || keys.has(entry.guestKey)) {
      skipped += 1;
      continue;
    }
    existing.push(entry);
    keys.add(entry.guestKey);
    added += 1;
  }

  if (added > 0) saveGuestInvites(existing);
  return { added, skipped, list: existing };
}

export function replaceGuestInvites(list) {
  saveGuestInvites(list);
}

function guestKeyToDocId(guestKey) {
  return encodeURIComponent(guestKey);
}

export async function syncGuestInvitesToFirestore(list) {
  if (!window.firebaseDb) return;
  const batch = window.firebaseDb.batch();
  const col = window.firebaseDb.collection('guest_invites');
  list.forEach((guest) => {
    const ref = col.doc(guestKeyToDocId(guest.guestKey));
    batch.set(ref, {
      name: guest.name,
      role: guest.role,
      mode: guest.mode,
      url: guest.url,
      guestKey: guest.guestKey,
      createdAt: guest.createdAt,
    }, { merge: true });
  });
  await batch.commit();
}

export function subscribeRsvpUpdates(onUpdate) {
  const mergeLocal = () => {
    try {
      return JSON.parse(localStorage.getItem('wedding_rsvps') || '[]');
    } catch {
      return [];
    }
  };

  const emit = (docs) => onUpdate(docs);

  if (window.firebaseDb) {
    return window.firebaseDb.collection('rsvps').onSnapshot(
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit(rows);
      },
      () => emit(mergeLocal()),
    );
  }

  emit(mergeLocal());
  const onStorage = (e) => {
    if (e.key === 'wedding_rsvps') emit(mergeLocal());
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

/** RSVP mới nhất theo guestKey */
export function mapLatestRsvpByGuestKey(rsvps) {
  const map = new Map();
  const sorted = [...rsvps].sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });

  for (const row of sorted) {
    if (row.guestKey && !map.has(row.guestKey)) {
      map.set(row.guestKey, row);
    }
  }
  return map;
}

export function formatRsvpConfirm(attendance) {
  if (attendance === 'attending') return 'Tham dự';
  if (attendance === 'declined') return 'Không tham dự';
  return attendance ? String(attendance) : '—';
}
