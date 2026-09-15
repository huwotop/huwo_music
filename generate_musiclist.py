#!/usr/bin/env python3
"""扫描本地 music 目录，生成 musiclist.json"""

import json
import os
import sys
from urllib.parse import quote

AUDIO_EXTS = {'.flac', '.mp3', '.m4a', '.aac'}
COVER_EXTS = ['.jpg', '.png', '.webp', '.svg']


def parse_filename(filename):
    base = os.path.splitext(filename)[0]
    parts = base.split(' - ', 1)
    if len(parts) == 2:
        return parts[0], parts[1]
    return base, '未知'


def find_file(music_dir, base_name, extensions):
    for ext in extensions:
        path = os.path.join(music_dir, base_name + ext)
        if os.path.exists(path):
            return base_name + ext
    return None


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    music_dir = os.path.join(script_dir, 'music')

    if not os.path.isdir(music_dir):
        print(f'错误: 音乐目录不存在: {music_dir}')
        sys.exit(1)

    audio_files = sorted(
        f for f in os.listdir(music_dir)
        if os.path.splitext(f)[1].lower() in AUDIO_EXTS
    )

    print(f'扫描目录: {music_dir}')
    print(f'找到 {len(audio_files)} 个音频文件')
    print()

    songs = []
    missing_covers = []
    missing_lrcs = []

    for audio_file in audio_files:
        name, artist = parse_filename(audio_file)
        base_name = os.path.splitext(audio_file)[0]

        url = './music/' + quote(audio_file)

        cover_file = find_file(music_dir, base_name, COVER_EXTS)
        if cover_file:
            cover = './music/' + quote(cover_file)
        else:
            cover = ''
            missing_covers.append(f'{name} - {artist}')

        lrc_file = find_file(music_dir, base_name, ['.lrc'])
        if lrc_file:
            lrc = './music/' + quote(lrc_file)
        else:
            lrc = ''
            missing_lrcs.append(f'{name} - {artist}')

        songs.append({
            'name': name,
            'artist': artist,
            'url': url,
            'cover': cover,
            'lrc': lrc,
        })

    output_path = os.path.join(script_dir, 'musiclist.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(songs, f, ensure_ascii=False, indent=2)

    print(f'已生成 musiclist.json，共 {len(songs)} 首歌曲')

    if missing_covers:
        print(f'\n缺少封面 ({len(missing_covers)}):')
        for s in missing_covers:
            print(f'  {s}')

    if missing_lrcs:
        print(f'\n缺少歌词 ({len(missing_lrcs)}):')
        for s in missing_lrcs:
            print(f'  {s}')

    if not missing_covers and not missing_lrcs:
        print('\n所有文件完整，无缺失。')


if __name__ == '__main__':
    main()
