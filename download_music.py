#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script tải nhạc MP3 chất lượng cao nhất (320kbps / best audio) từ YouTube
- Tự động tích hợp static-ffmpeg và yt-dlp
- Tự động nhúng metadata (Title, Artist) và ảnh bìa bài hát (Thumbnail)
- Tự động lọc tham số playlist/radio để chỉ tải đúng bài hát được chọn
"""

import os
import sys
import subprocess
from urllib.parse import urlparse, parse_qs

# Thư mục lưu nhạc mặc định
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "nhac")

# Danh sách toàn bộ các link YouTube cần tải
DEFAULT_URLS = [
    # Đợt 1
    "https://www.youtube.com/watch?v=N5SsbNh5thA",
    "https://www.youtube.com/watch?v=JuPHXpEsF-Y",
    "https://www.youtube.com/watch?v=zgaCZOQCpp8",
    "https://www.youtube.com/watch?v=WikAeXGsmHY",
    "https://www.youtube.com/watch?v=KeUwSx_RCfc",
    # Đợt 2
    "https://www.youtube.com/watch?v=_MWEapW4PaE",
    "https://www.youtube.com/watch?v=GxldQ9eX2wo",
    "https://www.youtube.com/watch?v=rtOvBOTyX00",
    "https://www.youtube.com/watch?v=jYEp86vn9EM",
    "https://www.youtube.com/watch?v=AiIBKcd4m5Q",
    "https://www.youtube.com/watch?v=Oa_RSwwpPaA",
    "https://www.youtube.com/watch?v=dElRVQFqj-k",
    "https://www.youtube.com/watch?v=xEIf1aIfXYQ",
    # Đợt 3 (Mới thêm)
    "https://www.youtube.com/watch?v=-lcVA_rn-7s",
    "https://www.youtube.com/watch?v=IOe0tNoUGv8",
]

def get_ffmpeg_dir():
    """Lấy đường dẫn ffmpeg tự động qua static_ffmpeg"""
    try:
        import static_ffmpeg
        ffmpeg_exe, _ = static_ffmpeg.run.get_or_fetch_platform_executables_else_raise()
        return os.path.dirname(ffmpeg_exe)
    except Exception as e:
        print(f"[!] Không tìm thấy static-ffmpeg: {e}")
        return None

def clean_youtube_url(url):
    """Lọc sạch tham số thừa như &list=RD...&start_radio=1 để tránh tải nhầm cả playlist vô tận"""
    parsed = urlparse(url.strip())
    qs = parse_qs(parsed.query)
    if 'v' in qs:
        return f"https://www.youtube.com/watch?v={qs['v'][0]}"
    if 'youtu.be' in parsed.netloc:
        video_id = parsed.path.lstrip('/')
        return f"https://www.youtube.com/watch?v={video_id}"
    return url.strip()

def download_audio(urls, output_dir=OUTPUT_DIR):
    os.makedirs(output_dir, exist_ok=True)
    ffmpeg_dir = get_ffmpeg_dir()

    # Tìm đường dẫn yt-dlp
    yt_dlp_candidates = [
        "/Users/daohung/Library/Python/3.14/bin/yt-dlp",
        os.path.expanduser("~/Library/Python/3.14/bin/yt-dlp"),
    ]
    import shutil
    which_yt = shutil.which("yt-dlp")
    if which_yt:
        yt_dlp_candidates.insert(0, which_yt)

    yt_dlp_bin = "yt-dlp"
    for c in yt_dlp_candidates:
        if os.path.exists(c):
            yt_dlp_bin = c
            break

    print("=" * 64)
    print(" 🎵 YOUTUBE TO MP3 DOWNLOADER (CHẤT LƯỢNG CAO NHẤT 320KBPS)")
    print(f" 📂 Thư mục xuất: {output_dir}")
    print(f" ⚙️ Công cụ: yt-dlp ({yt_dlp_bin})")
    if ffmpeg_dir:
        print(f" 🎬 Bộ chuyển đổi ffmpeg: {ffmpeg_dir}")
    print("=" * 64)

    success_count = 0
    total = len(urls)

    for i, raw_url in enumerate(urls, 1):
        clean_url = clean_youtube_url(raw_url)
        print(f"\n[{i}/{total}] ⏳ Đang tải và trích xuất MP3:")
        print(f"      Link: {clean_url}")

        cmd = [
            yt_dlp_bin,
            "--no-playlist",                     # Không tải cả playlist radio
            "--no-overwrites",                   # Nếu file đã tồn tại thì bỏ qua không tải lại
            "-x",                                 # Trích xuất riêng audio
            "--audio-format", "mp3",              # Đổi đuôi thành MP3
            "--audio-quality", "0",               # Chất lượng tốt nhất (VBR 0 / 320kbps)
            "--add-metadata",                     # Gắn thông tin tên bài hát, nghệ sĩ
            "--embed-thumbnail",                  # Nhúng ảnh bìa bài hát vào file MP3
            "--extractor-args", "youtube:player_client=android,web",  # Chống lỗi 403 Forbidden
            "-o", os.path.join(output_dir, "%(title)s.%(ext)s"),
            "--no-warnings"
        ]

        if ffmpeg_dir:
            cmd.extend(["--ffmpeg-location", ffmpeg_dir])

        cmd.append(clean_url)

        try:
            subprocess.run(cmd, check=True)
            print(f"[✓] Hoàn thành bài {i}!")
            success_count += 1
        except subprocess.CalledProcessError as err:
            print(f"[✗] Lỗi khi xử lý {clean_url}: {err}")

    print("\n" + "=" * 64)
    print(f" 🎉 HOÀN THÀNH: {success_count}/{total} bài hát đã được xử lý xong!")
    print(f" 📁 Xem các file MP3 tại: {output_dir}")
    print("=" * 64)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_urls = sys.argv[1:]
    else:
        target_urls = DEFAULT_URLS

    download_audio(target_urls)
