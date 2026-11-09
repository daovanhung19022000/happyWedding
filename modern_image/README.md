# Ảnh cưới hiện đại (`modern_image/`)

Thư mục này dùng cho **phiên bản hiện đại** (~70% khách mở link sẽ thấy).

1. Copy ảnh studio / Việt Nam vào đây.
2. Thêm tên file mới vào `MODERN_STATIC_ALBUM_FILES` trong `assets/js/modern-album-store.js`.
3. Đổi ảnh từng vị trí: sửa `MODERN_CORE_DEFAULTS` hoặc dùng `/view2/`.
3. Polaroid: thêm `crop_image/trang.png`, `crop_image/hung.png` (cùng cấu trúc kimono).
4. Gán từng vị trí trên thiệp qua **http://…/view2/** (Firestore `invite_images_modern`).

Ảnh kimono giữ nguyên trong `kimono_image/` và quản lý tại **/view/**.
