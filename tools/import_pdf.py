"""Convert single-song chord-over-lyric sheets using PDF or OCR word positions."""
import csv
import io
import re
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

from check_arrangements import notation_issue

CHORD = re.compile(r'(?:[A-H](?:#|b|is|es)?(?:maj|min|mi|dim|aug|sus|add|m|[0-9+#()-])*(?:/[A-H][#b]?)?|N\.C\.)')
SECTION = re.compile(r'\[(.{1,48})\]|((?:intro|verse|chorus|bridge|outro|sloka|refrén)(?:\s+\d+)?)\s*:?', re.I)


def reading_order(words, width, tolerance):
    """Keep simultaneous lines in separate columns when both have a stable left margin."""
    rows = []
    for y, x, end, text in sorted(words):
        if not rows or y - rows[-1][0] > tolerance:
            rows.append((y, []))
        rows[-1][1].append((x, end, text))
    lines = [sorted(row) for _, row in rows]
    # A chorus aligned at the right of one line is insufficient evidence of two columns.
    # Look for a repeated right-column start on text rows, with an empty gutter before it.
    starts = []
    for row in lines:
        for i in range(1, len(row)):
            x = row[i][0]
            if (.47 * width <= x <= .60 * width and x-row[i-1][1] > width*.025
                    and any(len(w[2]) >= 3 for w in row[:i])
                    and any(len(w[2]) >= 3 for w in row[i:])):
                starts.append(x)
    if not starts:
        return lines
    margin = max(starts, key=lambda x: sum(abs(x-y)<width*.009 for y in starts))
    if sum(abs(x-margin)<width*.009 for x in starts) < 3:
        return lines
    cut = margin-width*.012
    body = [line for line in lines if line[-1][1] > margin]
    if sum(any(x < cut < end for x,end,_ in row) for row in body) > max(2, len(body)*.10):
        return lines
    columns = []
    for right in (False, True):
        for row in lines:
            part = [w for w in row if (w[0] >= cut) == right]
            if part:
                columns.append(part)
    return columns


def read_pages(path):
    xml = subprocess.check_output(['pdftotext', '-bbox-layout', str(path), '-'])
    root = ET.fromstring(xml)
    pages = []
    with tempfile.TemporaryDirectory() as tmp:
        for number, page in enumerate(root.findall('.//{*}page'), 1):
            lines = [[(float(w.get('xMin')), float(w.get('xMax')), w.text or '')
                      for w in line.findall('{*}word')] for line in page.findall('.//{*}line')]
            # Block extraction can separate chords and lyrics. Regroup by printed row.
            if sum(len(line) for line in lines) >= 5:
                words = sorted((float(w.get('yMax')), float(w.get('xMin')), float(w.get('xMax')), w.text or '')
                               for w in page.findall('.//{*}word'))
                pages.append(reading_order(words, float(page.get('width')), 3))
            else:
                prefix = str(Path(tmp) / 'page')
                subprocess.run(['pdftoppm','-f',str(number),'-l',str(number),'-singlefile','-r','220','-gray','-png',str(path),prefix],check=True)
                with open(prefix+'.png','rb') as image:
                    data = subprocess.check_output(['tesseract','stdin','stdout','-l','eng+ces','--psm','6','tsv'],stdin=image)
                words = []
                width = 0
                for w in csv.DictReader(io.StringIO(data.decode()),delimiter='\t',quoting=csv.QUOTE_NONE):
                    if w['level']=='1':
                        width = int(w['width'])
                    if w['level']=='5' and w['text'].strip():
                        x = int(w['left'])
                        y = int(w['top']) + int(w['height'])
                        words.append((y, x, x+int(w['width']), w['text']))
                pages.append(reading_order(words, width, max(4,width*.004)))
    return pages


def chord_row(words):
    result = []
    for x, end, word in words:
        word = word.strip('|')
        if not word:
            continue
        if word in ('c','Cc'):
            word = 'C'
        if not CHORD.fullmatch(word):
            return []
        result.append((x,word))
    return result


def grid(chords):
    return ' '.join('['+chord+']' for _,chord in chords)


def align(words, chords):
    text = ' '.join(w for _,_,w in words)
    coords = []
    for x,end,w in words:
        coords.extend(x+(end-x)*i/len(w) for i in range(len(w)))
        coords.append(end)
    # Chords to the right of the last word are instrumental beats.
    lyric_length = len(text)
    for x,chord in reversed(chords):
        pos = lyric_length if x >= coords[-1] else min(range(len(coords)),key=lambda i:abs(coords[i]-x))
        text = text[:pos]+'['+chord+']'+text[pos:]
    return text


def convert(path, artist, title):
    lines = [line for page in read_pages(path) for line in page if line]
    joined = [' '.join(w for _,_,w in line) for line in lines]
    starts = [i for i,s in enumerate(joined) if SECTION.fullmatch(s) and not chord_row(lines[i])]
    if not starts:
        starts = [i for i,line in enumerate(lines[:-1]) if chord_row(line) and len(re.findall(r'\b[^\W\d_]{2,}\b',joined[i+1]))>=2]
    if not starts:
        raise ValueError('No chord-over-lyric section found')
    header = ['{title: '+title+'}', '{artist: '+artist+'}']
    capo = re.search(r'(?im)\b(?:capo|kapodastr)\s*[:?]?\s*(\d+)','\n'.join(joined[:starts[0]]))
    if capo and 0<int(capo[1])<=12:
        header.append('{capo: '+capo[1]+'}')
    out, pending, pairs = [], [], 0
    for line,s in zip(lines[starts[0]:],joined[starts[0]:]):
        if re.fullmatch(r'(?:Page|Strana)\s*\d+(?:\s*/\s*\d+)?',s,re.I):
            continue
        chords = chord_row(line)
        heading = SECTION.fullmatch(s)
        if chords or heading:
            if pending:
                out.append(grid(pending))
            pending = chords
            if heading and not chords:
                out.extend(['','{comment: '+(heading[1] or heading[2])+'}'])
        else:
            if notation_issue(s) or not re.search(r'[^\W\d_]{2}',s) or re.search(r'\{.*\}',s):
                raise ValueError('Unrecognized notation; check this sheet manually')
            if pending:
                pairs += 1
            out.append(align(line,pending))
            pending = []
    if pending:
        out.append(grid(pending))
    if pairs < 2:
        raise ValueError('Fewer than two aligned chord and lyric lines')
    return '\n'.join(header+['']+out)+'\n'
