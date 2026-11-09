# Hai bộ ảnh trên một link thiệp

## Ý tưởng

- **Một link** khách (`/0/tên`, `?to=…`) — không tách “thiệp kimono” / “thiệp hiện đại”.
- Nội dung chữ, lịch, RSVP, nhạc **giữ nguyên**.
- Chỉ **ảnh** đổi theo “look”:
  - **kimono** ~30%
  - **hiện đại** ~70%

Tránh trộn hai bộ ảnh trên cùng một trang (tạp).

## Cách chọn look (tự động)

| Ưu tiên | Điều kiện | Kết quả |
|--------|-----------|---------|
| 1 | `?look=kimono` hoặc `?look=modern` | Ép xem thử (admin) |
| 2 | `?look=reset` | Xóa bộ nhớ, bốc lại 30/70 |
| 3 | Có `?to=tên-khách` | **Băm tên** → look cố định cho đúng khách đó |
| 4 | `localStorage` | Lần mở trước (cùng trình duyệt) |
| 5 | Random | 30% / 70% rồi lưu |

**Link cá nhân** (`?to=`): cùng tên → cùng bộ ảnh mỗi lần mở, kể cả điện thoại khác.

## Quản lý ảnh

| Trang | Look | Thư mục | Firestore |
|-------|------|---------|-----------|
| `/view/` | kimono 30% | `kimono_image/` | `invite_images` |
| `/view2/` | hiện đại 70% | `modern_image/` | `invite_images_modern` |

Sửa tỷ lệ: `assets/js/invite-look.js` → `INVITE_LOOK_KIMONO_RATE = 0.3`.

## Việc bạn cần làm

1. Copy ảnh hiện đại vào `modern_image/` (xem `modern_image/README.md`).
2. Cập nhật `assets/js/modern-album-store.js` nếu tên file khác list mẫu `MOD_*.JPG`.
3. Mở `/view2/`, PIN, gán từng slot (hoặc chỉ repo nếu không cần Firebase).
4. Deploy Firestore rules (đã thêm `invite_images_modern`).

## Thử nhanh (local)

- http://127.0.0.1:8080/?look=kimono  
- http://127.0.0.1:8080/?look=modern  
- http://127.0.0.1:8080/0/ten-khach?look=reset  

OG / link share Facebook vẫn dùng ảnh kimono mặc định (ổn định preview).
