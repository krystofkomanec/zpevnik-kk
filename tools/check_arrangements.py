"""Publish a line-level review queue for suspicious ChordPro conversions."""
import re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
TAG = re.compile(r'\[[^\]]+\]')
VERSE = re.compile(r'\{(?:start_of_verse|sov)(?:[:}])|\{(?:comment|c):\s*(?:\d+\.\s*sloka|sloka\b|verse\b)', re.I)


def issues(text):
    rows = text.splitlines()
    problems = []
    sections = []
    verse = None
    for number, row in enumerate(rows, 1):
        if row.startswith('{'):
            if VERSE.match(row):
                verse = []
                sections.append(verse)
            else:
                verse = None
            continue
        if not row.strip() or row.startswith('#'):
            continue
        if re.match(r'^\s*(?:\[[^\]]+\]\s*){4,}(?=[^\W\d_])', row):
            problems.append((number, 'Four or more chords before the first lyric word'))
        if re.fullmatch(r'\s*\d\s+[A-H](?:m|mi|7|#|b)?\s*', row):
            problems.append((number, 'Possible OCR substitution in chord line'))
        if verse is not None:
            verse.append((number, row))
    if not sections:
        # Unlabelled arrangements often use a blank line as the stanza boundary.
        block = []
        for number, row in enumerate(rows + [''], 1):
            if not row.strip() or row.startswith('{'):
                if block:
                    sections.append(block)
                    block = []
            elif not row.startswith('#'):
                block.append((number, row))
    templates = set()
    for group in sections:
        lyrics = [r for _,r in group if re.search(r'[^\W\d_]{2}', TAG.sub('',r))]
        with_chords = sum(bool(TAG.search(r)) for _,r in group)
        if len(lyrics) >= 2 and with_chords >= len(lyrics) * .75:
            templates.add(len(lyrics))
        elif len(lyrics) in templates and not with_chords:
            problems.append((group[0][0], 'Verse has no chords; an earlier verse of the same length has chords'))
    return sorted(problems)


def main():
    entries = []
    for path in sorted((ROOT/'ChordPro').glob('*.cho')):
        for number, message in issues(path.read_text()):
            name = path.stem.replace('[', r'\[').replace(']', r'\]')
            url = 'https://github.com/krystofkomanec/zpevnik-kk/blob/main/'+quote('ChordPro/'+path.name)
            entries.append(f'- [{name}, line {number}]({url}#L{number}) — {message}')
    lines = ['# Arrangement checks', '', 'Automatically generated review candidates. Check the linked line against the source arrangement.', '', f'Candidate lines: {len(entries)}', '']
    (ROOT/'ARRANGEMENT-CHECKS.md').write_text('\n'.join(lines+entries)+'\n')


if __name__ == '__main__':
    main()
