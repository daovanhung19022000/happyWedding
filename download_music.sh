#!/bin/bash
# Script chạy tải nhạc MP3 chất lượng cao
cd "$(dirname "$0")" || exit
python3 download_music.py "$@"
