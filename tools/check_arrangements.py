"""Publish a line-level review queue for suspicious ChordPro conversions."""
import re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
TAG = re.compile(r'\[[^\]]+\]')
VERSE = re.compile(r'\{(?:start_of_verse|sov)(?:[:}])|\{(?:comment|c):\s*(?:\d+\.\s*sloka|sloka\b|verse\b)', re.I)


# These are review signals. Keep chord runs in tablature and instrumental grids valid.
SOURCE_NOISE = re.compile(r'https?://|www\.|(?:%[0-9a-f]{2}){2}|\b(?:view=detail|mid=[a-f0-9]{12,}|Page \d+ of \d+)|^\d{1,2}/\d{1,2}/20\d\d.+(?:akord|chords)|[\w.+-]+@[\w.-]+\.[a-z]{2,}', re.I)
RAW_CHORD = re.compile(r'[A-H](?:#|b|is|es)?(?:maj|min|mi|m|sus|add|dim|aug|[0-9+#])*(?:/[A-H][#b]?)?')
SECTION_TOKEN = re.compile(r'\[(?:(?:pre-|post-)?chorus|verse|intro|outro|solo|instrumental|bridge|middle 8)(?:\s+\d+)?\]',re.I)


def notation_issue(row):
    if SOURCE_NOISE.search(row):
        return 'Possible source link, credit or page header inside the arrangement'
    if SECTION_TOKEN.search(row):
        return 'Section name appears among chord or lyric tokens'
    bare = TAG.sub(' ', row).split()
    if any(all(RAW_CHORD.fullmatch(x) for x in bare[i:i+3]) for i in range(len(bare)-2)):
        return 'Sequence of unmarked chords in lyrics'
    if re.search(r'[-=|]{5,}', row) and re.search(r'[0-9]|[-=|]{10,}',row):
        return 'Possible tablature outside a tab block'
    if any(len(word) >= 28 for word in re.findall(r'[^\W\d_]+',TAG.sub('',row))):
        return 'Possible joined lyric words'
    return None


def issues(text):
    rows = text.splitlines()
    problems = []
    sections = []
    verse = None
    in_tab = False
    for number, row in enumerate(rows, 1):
        if row.strip() in ('{start_of_tab}', '{sot}'):
            in_tab = True
        if row.strip() in ('{end_of_tab}', '{eot}'):
            in_tab = False
        if in_tab:
            continue
        if row.startswith('{'):
            if VERSE.match(row):
                verse = []
                sections.append(verse)
            else:
                verse = None
            continue
        if not row.strip() or row.startswith('#'):
            continue
        signal = notation_issue(row)
        if signal:
            problems.append((number, signal))
        if re.match(r'^\s*(?:\[[^\]]+\]\s*){4,}(?!x\d+\s*$)(?=[^\W\d_])', row):
            problems.append((number, 'Four or more chords before the first lyric word'))
        if re.fullmatch(r'\s*\d\s+[A-H](?:m|mi|7|#|b)?\s*', row):
            problems.append((number, 'Possible OCR substitution in chord line'))
        if re.match(r'^\s*(?:p?age)\s+\d+\s*/\s*\d+\s*$', row, re.I):
            problems.append((number, 'Page footer in lyrics'))
        if re.fullmatch(r'\s*=\s*\d+\.?\s*', row):
            problems.append((number, 'Unexpanded verse reference'))
        if re.search(r'\w {2,}\w', row):
            problems.append((number, 'Repeated spaces between lyric characters'))
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
