/** Nhạc nền — file trong thư mục `/nhac/` (thêm file rồi khai báo url tại đây) */
export function resolveMusicUrl(relativePath) {
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  const inSubpage = /\/(album|view|customer)(\/|$)/.test(window.location.pathname);
  const path = `${inSubpage ? '../' : ''}${relativePath}`;
  return new URL(path, window.location.href).href;
}

export const playlist = [
  {
    title: 'Alex Warren — Ordinary',
    artist: 'Alex Warren',
    url: 'nhac/Alex-Warren-SnapYT.App.webm',
  },
  {
    title: 'Ed Sheeran',
    artist: 'Ed Sheeran',
    url: 'nhac/ed-sheeran-snapytapp_6r1w2rUm.mp3',
  },
];
