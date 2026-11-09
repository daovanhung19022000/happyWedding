import { KIMONO_ALBUM_PAGE_FULL_WIDTH, kimonoAlbumPageFiles } from './album-store.js';
import {
  MODERN_ALBUM_CONCEPT_SECTIONS,
  MODERN_GALLERY_FINALE_FILE,
  modernImagePath,
} from './modern-album-store.js';

/** Xen kẽ hàng 2 và 3 — không dùng hàng 1 (trừ `fullWidth` chỉ định). */
export const ALBUM_ROW_COL_CYCLE = [2, 3];

function countRegularRemaining(files, startIndex, fullWidthSet) {
  let n = 0;
  for (let j = startIndex; j < files.length; j += 1) {
    if (!fullWidthSet.has(files[j])) n += 1;
  }
  return n;
}

function appendOrphanToPreviousRow(rows, file) {
  const prev = rows[rows.length - 1];
  if (prev && !prev.fullBleed && prev.files.length === 2) {
    prev.files.push(file);
    prev.cols = 3;
    return true;
  }
  return false;
}

function buildInterleavedRows(files, fullWidthSet = new Set(), startCycle = 0) {
  const rows = [];
  let cycleIdx = startCycle;
  let i = 0;

  while (i < files.length) {
    const file = files[i];
    if (fullWidthSet.has(file)) {
      rows.push({ cols: 1, files: [file], fullBleed: true });
      i += 1;
      continue;
    }

    const remaining = countRegularRemaining(files, i, fullWidthSet);

    if (remaining === 1) {
      if (!appendOrphanToPreviousRow(rows, file)) {
        rows.push({ cols: 2, files: [file] });
      }
      i += 1;
      continue;
    }

    let targetCols = ALBUM_ROW_COL_CYCLE[cycleIdx % ALBUM_ROW_COL_CYCLE.length];
    cycleIdx += 1;

    if (remaining === 4) targetCols = 2;
    else if (remaining === 2) targetCols = 2;
    else if (targetCols > remaining) targetCols = remaining;

    const chunk = [];
    while (chunk.length < targetCols && i < files.length) {
      const f = files[i];
      if (fullWidthSet.has(f)) break;
      chunk.push(f);
      i += 1;
    }
    if (chunk.length) {
      rows.push({ cols: chunk.length, files: chunk });
    }
  }

  return { rows, nextCycle: cycleIdx };
}

function modernUrlFromFile(fileName) {
  return `../${modernImagePath(fileName)}`;
}

function kimonoUrlFromFile(fileName) {
  return `../kimono_image/${encodeURI(fileName)}`;
}

function mapRowsToUrls(rows, urlFn) {
  return rows.map((row) => ({
    cols: row.cols,
    fullBleed: Boolean(row.fullBleed),
    urls: row.files.map(urlFn),
  }));
}

/** Cấu trúc trang /album/ — kimono đầu, concept hiện đại, ảnh kết. */
export function buildAlbumPagePlan() {
  let cycle = 0;

  const kimonoFull = new Set(KIMONO_ALBUM_PAGE_FULL_WIDTH);
  const kimonoBuilt = buildInterleavedRows(kimonoAlbumPageFiles(), kimonoFull, cycle);
  cycle = kimonoBuilt.nextCycle;

  const kimono = {
    rows: mapRowsToUrls(kimonoBuilt.rows, kimonoUrlFromFile),
  };

  const modernSections = MODERN_ALBUM_CONCEPT_SECTIONS.map((section) => {
    const fullSet = new Set(section.fullWidth || []);
    const built = buildInterleavedRows(section.files, fullSet, cycle);
    cycle = built.nextCycle;
    return {
      rows: mapRowsToUrls(built.rows, modernUrlFromFile),
    };
  });

  return {
    kimono,
    modernSections,
    finale: {
      rows: [
        {
          cols: 1,
          fullBleed: true,
          urls: [modernUrlFromFile(MODERN_GALLERY_FINALE_FILE)],
        },
      ],
    },
  };
}

/** Một danh sách hàng theo thứ tự album (kimono → hiện đại → cuối). */
export function flattenAlbumPageRows(plan) {
  const parts = [plan.kimono, ...(plan.modernSections || []), plan.finale].filter(Boolean);
  const rows = [];
  parts.forEach((part, partIndex) => {
    const isFinale = partIndex === parts.length - 1 && plan.finale === part;
    part.rows?.forEach((row) => {
      if (!row.urls?.length) return;
      rows.push({ ...row, isFinale: isFinale && row.fullBleed });
    });
  });
  return rows;
}
