/**
 * Album ảnh cưới hiện đại (thư mục `modern_image/`).
 * Danh sách file có thể khác kimono — cập nhật khi bạn thêm ảnh mới.
 * Đặt tên file trong repo giống list dưới (hoặc sửa list cho khớp ảnh thật).
 */

export const MODERN_STATIC_ALBUM_FILES = [
  'MOD_3400.JPG',
  'MOD_3524.JPG',
  'MOD_3557.JPG',
  'MOD_4408.JPG',
  'MOD_3637.JPG',
  'MOD_3681.JPG',
  'MOD_3696.JPG',
  'MOD_3566.JPG',
  'MOD_3859.JPG',
  'MOD_3862.JPG',
  'MOD_3880.JPG',
  'MOD_3942.JPG',
  'MOD_3965.JPG',
  'MOD_4057.JPG',
  'MOD_4082.JPG',
  'MOD_4123.JPG',
  'MOD_4188.JPG',
  'MOD_4343.JPG',
  'MOD_4382.JPG',
  'MOD_3802.JPG',
];

export function modernStaticAlbumUrls(basePath = 'modern_image/') {
  return MODERN_STATIC_ALBUM_FILES.map((name) => `${basePath}${name}`);
}
