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


def build():
    library = ROOT/'knihovna.js'
    source, overview = library.read_text().strip().removesuffix(';').split(';\nvar catalog=')
    songs = json.loads(source.removeprefix('var songs='))
    catalog = [entry for entry in json.loads(overview) if 'inbox' not in entry]
    state_path = ROOT/'inbox/imports.json'
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
        language = path.parent.name
        try:
            if not sep or not artist.strip() or not title.strip() or language not in ('cs','en'):
                raise ValueError('Use inbox/en or inbox/cs and name the file Artist - Title.pdf')
            if any(c in name for c in '{}\r\n'):
                raise ValueError('Unsupported characters in filename')
            file = name+'.cho'
            target = ROOT/'ChordPro'/file
            if target.exists() and entry.get('file')!=file:
                raise ValueError('A song with this name already exists; use a distinct arrangement name')
            if entry.get('file') and not entry.get('generated'):
                raise ValueError('Revised source for a manually edited arrangement; review before replacing')
            cho = convert(path,artist,title)
            target.write_text(cho)
            song = dict(title=title,artist=artist,file=file,lang='en' if language=='en' else 'cz',cho=cho,lyricsLanguage=language)
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
