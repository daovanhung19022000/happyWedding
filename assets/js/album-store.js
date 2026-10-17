/** Ảnh gốc trong repo + ảnh upload qua Firebase */

export const STATIC_ALBUM_FILES = [
  'THA_3400.JPG', 'THA_3524.JPG', 'THA_3557.JPG', 'THA_4408.JPG', 'THA_3637.JPG',
  'THA_3681.JPG', 'THA_3696.JPG', 'THA_3566.JPG', 'THA_3859.JPG', 'THA_3862.JPG',
  'THA_3880.JPG', 'THA_3942.JPG', 'THA_3965.JPG', 'THA_4057.JPG', 'THA_4082.JPG',
  'THA_4123.JPG', 'THA_4188.JPG', 'THA_4343.JPG', 'THA_4382.JPG', 'THA_3802.JPG',
];

export function staticAlbumUrls(basePath = '../kimono_image/') {
  return STATIC_ALBUM_FILES.map((name) => `${basePath}${name}`);
}

export async function fetchUploadedAlbumUrls() {
  if (!window.firebaseDb) return [];
  const snap = await window.firebaseDb.collection('album_photos').get();
  const rows = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
  rows.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
  return rows.map((r) => r.url).filter(Boolean);
}

const UPLOAD_FETCH_TIMEOUT_MS = 2500;

export async function loadAllAlbumImageUrls(basePath = '../kimono_image/') {
  const urls = staticAlbumUrls(basePath);
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
