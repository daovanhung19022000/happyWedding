# KẾ HOẠCH & CẤU TRÚC THIỆT CƯỚI ONLINE (ĐÀO VĂN HÙNG & HOÀNG THỊ THU TRANG)

## 1. TỔNG QUAN DỰ ÁN
- **Cặp đôi:** Đào Văn Hùng & Hoàng Thị Thu Trang
- **Phong cách chủ đạo:** Sang trọng, thanh lịch Á Đông kết hợp phong vị Nhật Bản (tương thích hoàn hảo với bộ ảnh cưới Kimono), màu sắc chủ đạo: Đỏ nhung rượu vang (`#942233`), Vàng Champagne (`#BFA15F`) và Nền giấy ấm (`#FCF9F5`).
- **Mục tiêu:** Thiệp cưới online đa nền tảng (Mobile/Tablet/PC), hiệu ứng chuyển động mượt mà (cánh hoa anh đào rơi, đĩa nhạc quay, cuộn mượt), lưu trữ lời chúc và xác nhận tham dự qua Firebase.

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN
```
Thiệp cưới/
├── index.html                   # Giao diện chính của thiệp cưới
├── assets/
│   ├── css/
│   │   ├── style.css            # Hệ thống màu sắc, typography, responsive layout
│   │   └── animations.css       # Hiệu ứng cánh hoa anh đào rơi, shimmer, floating
│   ├── js/
│   │   ├── app.js               # Logic điều khiển: Countdown, 3 Mode, Audio, Gallery, RSVP, QR
│   │   ├── firebase-config.js   # Kết nối Firebase Firestore (lưu Lời chúc & RSVP)
│   │   └── music-list.js        # Danh sách bài hát cưới lãng mạn & phát ngẫu nhiên
│   └── audio/                   # Thư mục lưu file mp3 (nếu tải về máy)
├── kimono_image/                # Bộ sưu tập 20+ bức ảnh cưới Kimono chất lượng cao
│   └── crop_image/              # Ảnh chân dung cô dâu (trang.png) & chú rể (hung.png)
├── chu_ki/                      # Chữ ký tay của cô dâu (trang.png) & chú rể (Hung.png)
└── docs/
    ├── chuc_nang.md             # Danh sách tính năng yêu cầu ban đầu
    ├── thong_tin.md             # Thông tin ngày giờ, phụ mẫu hai bên, địa chỉ
    └── ke_hoach_thiet_ke.md     # Bản kế hoạch và tài liệu kiến trúc tổng thể
```

---

## 3. CÁC TÍNH NĂNG ĐÃ XÂY DỰNG KHUNG HOÀN CHỈNH

1. **Phát nhạc nền danh sách & ngẫu nhiên:**
   - Nút đĩa nhạc quay nổi ở góc màn hình.
   - Khi load trang sẽ chọn ngẫu nhiên 1 bản nhạc piano/lãng mạn.
   - Hết bài tự động chuyển sang bài kế tiếp trong playlist.

2. **Cá nhân hóa theo URL & Cách xưng hô:**
   - Link linh hoạt: `index.html?to=Anh+Nam&role=Anh&mode=trai`
   - Tự động hiển thị lời chào trang trọng: *"Kính gửi: Anh Anh Nam..."*
   - Tự động điền sẵn tên vào form RSVP và Lời chúc.

3. **Hỗ trợ 3 Mode sự kiện:**
   - **Nhà Trai (15/11/2026):** Hải Dương - 10:30 đón khách, 11:00 tiệc.
   - **Nhà Gái (15/11/2026):** Hưng Yên - 10:00 đón khách, 11:00 tiệc.
   - **Miền Nam (21/11/2026):** Biên Hoà, Đồng Nai - 15:00 đón khách, 17:00 tiệc.
   - Chuyển đổi mượt mà bằng thanh bấm hoặc truyền param `?mode=trai|gai|nam`.

4. **Lịch lồng ảnh & Đếm ngược (Countdown):**
   - Calendar tháng 11/2026 với ảnh cưới Kimono chìm tinh tế phía sau.
   - Đánh dấu trái tim ngày đặc biệt (15/11 và 21/11).
   - Bộ đếm ngược thời gian thực (Ngày : Giờ : Phút : Giây) chính xác đến giờ đón khách.

5. **Trang giới thiệu Cô Dâu & Chú Rể kèm Chữ Ký:**
   - Sử dụng ảnh chân dung crop (`hung.png`, `trang.png`).
   - Tên bố mẹ hai bên gia đình và lời nhắn nhủ lãng mạn.
   - Tích hợp ảnh chữ ký viết tay chính chủ (`Hung.png`, `trang.png`).

6. **Câu chuyện tình yêu (Love Story):**
   - Dòng thời gian 4 cột mốc: Lần đầu hạnh ngộ -> Những năm tháng thanh xuân -> Lời hứa dưới tán hoa -> Ngày chung đôi trọn vẹn 15 & 21/11/2026.

7. **Bộ sưu tập ảnh cưới Kimono (Gallery & Lightbox):**
   - Tích hợp toàn bộ bộ ảnh Kimono tuyệt đẹp.
   - Click phóng to ảnh toàn màn hình với hiệu ứng lightbox.

8. **Form RSVP (Xác nhận tham dự) & Sổ lưu bút (Wishes):**
   - Khách có thể chọn: "Chắc chắn sẽ đến" / "Rất tiếc không thể đến", chọn số lượng người đi cùng.
   - Gửi lời chúc mừng hiển thị ngay lập tức.
   - Hỗ trợ lưu trữ trực tiếp vào Firebase Firestore hoặc LocalStorage (dự phòng khi chưa nạp API key).

9. **Công cụ tạo QR Code & Link mời riêng cho từng khách:**
   - Form tiện ích cho Dâu & Rể: gõ tên khách, chọn xưng hô (Bác/Chú/Anh/Chị/Bạn...), chọn Tiệc -> Tự động sinh ra đường link riêng + ảnh mã QR sắc nét + Nút copy 1 chạm.

---

## 4. HƯỚNG DẪN KẾT NỐI FIREBASE (BACKEND)
1. Truy cập [Firebase Console](https://console.firebase.google.com/).
2. Tạo dự án mới (ví dụ: `thiep-cuoi-hung-trang`).
3. Vào **Build -> Firestore Database** -> Bấm **Create database** -> Chọn chế độ **Start in test mode** (hoặc đặt rule cho phép đọc/ghi công khai cho collection `wishes` và `rsvps`).
4. Vào **Project Settings (Cài đặt dự án)** -> Thẻ **General** -> Thêm ứng dụng **Web (`</>`)**.
5. Sao chép các thông số `apiKey`, `projectId`, `appId`... và dán vào file `assets/js/firebase-config.js`.
6. Hoàn tất! Tất cả lời chúc và RSVP sẽ tự động đồng bộ realtime lên đám mây Firebase.
