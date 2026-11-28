#!/usr/bin/env python3
"""Sửa UTF-8 bị đọc nhầm CP1252 theo từng cụm byte. Dùng: python3 scripts/fix-mojibake.py [--write] file..."""
import re, sys

CP = {}
for b in range(256):
    try:
        CP[bytes([b]).decode('cp1252')] = b
    except UnicodeDecodeError:
        pass
for b in (0x81, 0x8d, 0x8f, 0x90, 0x9d):
    CP[chr(b)] = b

def cls(lo, hi):
    return '[' + ''.join(re.escape(c) for c, b in CP.items() if lo <= b <= hi) + ']'

cont, l2, l3, l4 = cls(0x80, 0xBF), cls(0xC2, 0xDF), cls(0xE0, 0xEF), cls(0xF0, 0xF4)
pat = re.compile(f'{l4}{cont}{{3}}|{l3}{cont}{{2}}|{l2}{cont}')

def fix_text(s):
    def rep(m):
        try:
            return bytes(CP[c] for c in m.group(0)).decode('utf-8')
        except Exception:
            return m.group(0)
    for _ in range(2):
        n = pat.sub(rep, s)
        if n == s:
            break
        s = n
    return s

write = '--write' in sys.argv
for f in [a for a in sys.argv[1:] if a != '--write']:
    raw = open(f, 'rb').read()
    bom = raw.startswith(b'\xef\xbb\xbf')
    s = raw.decode('utf-8-sig')
    t = fix_text(s)
    changed = (t != s) or bom
    print(('FIX ' if changed else 'ok  ') + f + ('  (bom)' if bom else ''))
    if write and changed:
        open(f, 'wb').write(t.encode('utf-8'))
