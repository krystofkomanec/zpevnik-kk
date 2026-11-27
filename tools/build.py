"""Import new inbox PDFs and build the offline library from individual ChordPro files."""
import hashlib
import json
import re
import subprocess
import unicodedata
from pathlib import Path

from import_pdf import convert

ROOT = Path(__file__).resolve().parents[1]


def dump(value):
    return json.dumps(value, ensure_ascii=False,separators=(',', ':'))


def load(path, default):
    return json.loads(path.read_text()) if path.exists() else default


# Compare lyric words only. Unknown and instrumental sheets stay in the full library.
def lyrics_language(chordpro):
    lyrics = re.sub(r'(?m)^\s*#.*$|\{[^}]*\}|\[[^\]]*\]', '', chordpro.lower())
    words = set(re.findall(r'[^\W\d_]+', lyrics))
    english = set("the you your yours i i'm my me mine is are it it's was were be been being of to through they them he she we us our their in on by with as but when where why what how this that these those all will would could should said have has had only know day night heart love never always and for from who take can don't just not".split())
    czech = set("já ty mě mně můj má moje mi se si jsme jsem jsi jsou být byl byla když jak kde kdo co že už tě tebe jeho její tak aby ale jen až na za do od pro při bez pod nad ten ta tohle který které mám máš víš proč kde zas není jako stále tvůj tvá svůj nebo pak než nás vás jí nic však jenom".split())
    en_score = len(words & english)
    cs_score = len(words & czech) + min(4, sum(bool(re.search('[ěščřžýáíéúůťďň]', w)) for w in words))
    if en_score >= 2 and en_score > cs_score:
        return 'en'
    if cs_score >= 2 and cs_score > en_score:
        return 'cs'
    return 'und'


def build():
    library = ROOT/'knihovna.js'
    source, overview = library.read_text().strip().removesuffix(';').split(';\nvar catalog=')
    songs = json.loads(source.removeprefix('var songs='))
    catalog = [entry for entry in json.loads(overview) if 'inbox' not in entry]
    state_path = ROOT/'tools/imports.json'
    state = load(state_path, {})
    by_file = {s['file']:s for s in songs}
    for path in sorted((ROOT/'inbox').rglob('*')):
        if not path.is_file() or path.suffix.lower() != '.pdf':
            continue
        key = unicodedata.normalize('NFC',path.relative_to(ROOT).as_posix())
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        name = unicodedata.normalize('NFC',path.stem)
        entry = state.get(key,{})
        if entry.get('sha256') == digest and entry.get('file') in by_file:
            continue
        artist, sep, title = name.partition(' - ')
        language = 'und'
        try:
            if not sep or not artist.strip() or not title.strip():
                raise ValueError('Use inbox and name the file Artist - Title.pdf')
            if any(c in name for c in '{}\r\n'):
                raise ValueError('Unsupported characters in filename')
            file = name+'.cho'
            target = ROOT/'ChordPro'/file
            if target.exists() and entry.get('file')!=file:
                raise ValueError('A song with this name already exists; use a distinct arrangement name')
            if entry.get('file') and not entry.get('generated'):
                raise ValueError('Revised source for a manually edited arrangement; review before replacing')
            cho = convert(path,artist,title)
            language = lyrics_language(cho)
            symbols = re.findall(r'\[([^\]]+)\]',cho)
            czech_notes = any(re.match(r'^H|^[A-H](?:is|es|[#b])?mi(?!n)', c) for c in symbols)
            target.write_text(cho)
            song = dict(title=title,artist=artist,file=file,lang='cz' if czech_notes or language=='cs' else 'en',cho=cho,lyricsLanguage=language)
            by_file[file]=song
            state[key]={'sha256':digest,'file':file,'generated':True}
        except (ValueError,subprocess.CalledProcessError) as error:
            print(f'Review required: {key}: {error}')
            catalog.append(dict(name=path.name,title=title,artist=artist,format='PDF',inbox=key,lyricsLanguage=language))
    for file,song in by_file.items():
        song['cho']=(ROOT/'ChordPro'/file).read_text().rstrip()+'\n'
    songs=list(by_file.values())
    state_path.write_text(json.dumps(state,ensure_ascii=False,sort_keys=True,indent=2)+'\n')
    payload=ROOT/'library.json'
    old=load(payload,{})
    version=old.get('version',0)+int(old.get('songs')!=songs or old.get('catalog')!=catalog)
    payload.write_text(dump(dict(schema=1,version=version,songs=songs,catalog=catalog))+'\n')
    # Escape HTML end tags inside song data before embedding it in a script element.
    data='var songs='+dump(songs)+';\nvar catalog='+dump(catalog)+';'
    library.write_text(data+'\n')
    page=ROOT/'index.html'
    head,sep,_=page.read_text().partition('<script>var songs=')
    if not sep:
        raise ValueError('Missing library script in index.html')
    page.write_text(head+'<script>'+data.replace('<','\\u003c')+'\nvar libraryVersion='+str(version)+';</script><script>'+(ROOT/'cteni.js').read_text()+'</script></html>\n')
    print(f'Library {version}: {len(songs)} songs, {len(catalog)} pending sources')


if __name__=='__main__':
    build()
