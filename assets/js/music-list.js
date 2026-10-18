/** Nhạc nền — file trong thư mục `/nhac/` (thêm file git + khai báo tên file ở đây) */
export function resolveMusicUrl(relativePath) {
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  const inSubpage = /\/(album|view|customer)(\/|$)/.test(window.location.pathname);
  const prefix = inSubpage ? '../' : '';
  const segments = String(relativePath).split('/').filter(Boolean);
  const encoded = segments
    .map((seg, i) => (i === 0 ? seg : encodeURIComponent(decodeURIComponent(seg))))
    .join('/');
  return new URL(`${prefix}${encoded}`, window.location.href).href;
}

function titleFromFilename(fileName) {
  return fileName.replace(/\.(mp3|webm|m4a|ogg)$/i, '').trim();
}

/** Thêm tên file mới vào đây sau khi copy vào `/nhac/` và `git add`. */
const NHAC_FILENAMES = [
  'Alex-Warren-SnapYT.App.webm',
  'Benson Boone - Beautiful Things (Official Music Video).mp3',
  'Bruno Mars - Marry You (Official Lyric Video).mp3',
  'Christina Perri - A Thousand Years [Official Music Video].mp3',
  'Dua Lipa - Training Season (Lyrics⧸Tiktok).mp3',
  'Frank Sinatra   I Love You Baby.mp3',
  'Indila - Love Story (Lyrics).mp3',
  'JVKE - golden hour (Lyrics).mp3',
  'Lady Gaga, Bruno Mars - Die With A Smile (Lyrics).mp3',
  "Lana Del Rey - You're in the wind I'm in the water (Chemtrail Over The Country Club) (Lyrics).mp3",
  'Lana Del Rey - Young And Beautiful (Lyrics).mp3',
  'Lỡ Thương Nhau (Bò Sữa Bay Original Soundtrack).mp3',
  'My Love.mp3',
  'Stephen Sanchez - Until I Found You (Official Video).mp3',
  'Westlife - My Love (Lyrics).mp3',
  'ed-sheeran-snapytapp_6r1w2rUm.mp3',
  'Đức Phúc - Em Đồng Ý (I Do) (feat. 911 & Khắc Hưng) (Official Music Video) ｜ Valentine 2023.mp3',
];

export const playlist = NHAC_FILENAMES.map((fileName) => {
  const title = titleFromFilename(fileName);
  return {
    title,
    artist: '',
    url: `nhac/${fileName}`,
  };
});
