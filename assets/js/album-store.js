/** Ảnh gốc trong repo + ảnh upload qua Firebase */

import { INVITE_LOOK_MODERN } from './invite-look.js';
import { MODERN_STATIC_ALBUM_FILES, modernStaticAlbumUrls } from './modern-album-store.js';

export const STATIC_ALBUM_FILES = [
  'THA_3400.JPG', 'THA_3524.JPG', 'THA_3557.JPG', 'THA_4408.JPG', 'THA_3637.JPG',
  'THA_3681.JPG', 'THA_3696.JPG', 'THA_3566.JPG', 'THA_3859.JPG', 'THA_3862.JPG',
  'THA_3880.JPG', 'THA_3942.JPG', 'THA_3965.JPG', 'THA_4057.JPG', 'THA_4082.JPG',
  'THA_4123.JPG', 'THA_4188.JPG', 'THA_4343.JPG', 'THA_4382.JPG', 'THA_3802.JPG',
];

/** Thứ tự & ảnh full-width trên trang `/album/`. */
export const KIMONO_ALBUM_PAGE_OPENING = ['THA_3524.JPG', 'THA_4343.JPG'];
export const KIMONO_ALBUM_PAGE_CLOSING = 'THA_3802.JPG';
/** Hàng 1 ảnh — có thể nằm giữa album (vd. THA_3566). */
export const KIMONO_ALBUM_PAGE_FULL_WIDTH = [
  ...KIMONO_ALBUM_PAGE_OPENING,
  'THA_3566.JPG',
  KIMONO_ALBUM_PAGE_CLOSING,
];

export function kimonoAlbumPageFiles() {
  const pinned = new Set([...KIMONO_ALBUM_PAGE_OPENING, KIMONO_ALBUM_PAGE_CLOSING]);
  const middle = STATIC_ALBUM_FILES.filter((name) => !pinned.has(name));
  return [...KIMONO_ALBUM_PAGE_OPENING, ...middle, KIMONO_ALBUM_PAGE_CLOSING];
}

export function staticAlbumUrls(basePath = '../kimono_image/') {
  return STATIC_ALBUM_FILES.map((name) => `${basePath}${name}`);
}

/** Đường dẫn trang album — đúng cả khi mở thiệp qua `/0/tên` hoặc GitHub project page. */
export function resolveAlbumPageHref() {
  try {
    return new URL('album/index.html', window.location.href).href;
  } catch {
    return 'album/index.html';
  }
}

/** Khóa so khớp tên file (bỏ khoảng trắng, hoa/thường) — lọc upload trùng ảnh repo. */
export function photoAssetFingerprint(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';
  let base = raw;
  if (/^https?:/i.test(raw)) {
    try {
      base = decodeURIComponent(new URL(raw).pathname.split('/').pop() || '');
    } catch {
      base = raw;
    }
  } else if (raw.includes('/')) {
    base = decodeURIComponent(raw.split('/').pop().split('?')[0] || '');
  }
  base = base.replace(/^\d+_/, '');
  return base.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const REPO_PHOTO_FINGERPRINTS = new Set(
  [...MODERN_STATIC_ALBUM_FILES, ...STATIC_ALBUM_FILES].map(photoAssetFingerprint).filter(Boolean),
);

export function isRepoDuplicateUpload(entry) {
  if (!entry) return true;
  const parts = [entry.fileName, entry.storagePath, entry.url];
  return parts.some((part) => {
    const fp = photoAssetFingerprint(part);
    return fp && REPO_PHOTO_FINGERPRINTS.has(fp);
  });
}

export async function fetchUploadedAlbumEntries() {
  if (!window.firebaseDb) return [];
  const snap = await window.firebaseDb.collection('album_photos').get();
  const rows = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
  rows.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
  return rows.filter((r) => r.url);
}

export async function fetchUploadedAlbumUrls() {
  const rows = await fetchUploadedAlbumEntries();
  return rows.map((r) => r.url);
}

/** Upload thật sự mới — không trùng modern/kimono trong repo. */
export function filterNovelUploadUrls(entries) {
  return entries.filter((row) => !isRepoDuplicateUpload(row)).map((r) => r.url);
}

const UPLOAD_FETCH_TIMEOUT_MS = 2500;

async function mergeUploadedAlbumUrls(urls) {
  try {
    const uploaded = await Promise.race([
      fetchUploadedAlbumUrls(),
      new Promise((resolve) => setTimeout(() => resolve([]), UPLOAD_FETCH_TIMEOUT_MS)),
    ]);
    if (!uploaded.length) return urls;
    const seen = new Set(urls);
    uploaded.forEach((url) => {
      if (url && !seen.has(url)) {
        seen.add(url);
        urls.push(url);
      }
    });
    return urls;
  } catch (err) {
    console.warn('Không tải được ảnh upload:', err);
    return urls;
  }
}

export async function loadAllAlbumImageUrls(basePath = '../kimono_image/') {
  const urls = staticAlbumUrls(basePath);
  return mergeUploadedAlbumUrls(urls);
}

/** Trang /view & /view2 — ảnh để chọn (view2: kimono + upload, không liệt kê MOD_ ảo 404). */
export async function loadAlbumPickerUrlsForAdmin(look) {
  const kimonoUrls = staticAlbumUrls('../kimono_image/');
  const seen = new Set();

  function addList(list) {
    const out = [];
    list.forEach((url) => {
      const key = String(url).split('?')[0];
      if (seen.has(key)) return;
      seen.add(key);
      out.push(url);
    });
    return out;
  }

  let urls = addList(kimonoUrls);
  if (look === INVITE_LOOK_MODERN) {
    urls = addList([...urls, ...modernStaticAlbumUrls('../modern_image/web/')]);
  }
  return mergeUploadedAlbumUrls(urls);
}

export function shuffle(list) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function pickRowSize(remaining) {
  const options = [1, 2, 3].filter((n) => n <= remaining);
  if (!options.length) return 1;
  let size = options[Math.floor(Math.random() * options.length)];
  const left = remaining - size;
  if (left === 1 && size < 3 && remaining > 1) {
    size = Math.min(2, remaining - 1);
  }
  return size;
}

export function buildMosaicRows(urlList) {
  const ordered = shuffle(urlList);
  const rows = [];
  let i = 0;
  while (i < ordered.length) {
    const remaining = ordered.length - i;
    const count = pickRowSize(remaining);
    rows.push(ordered.slice(i, i + count));
    i += count;
  }
  return rows;
}

export function sanitizeFileName(name) {
  return String(name || 'photo')
    .replace(/[^\w.\-() ]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}
