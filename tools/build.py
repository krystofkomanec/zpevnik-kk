"""Import new inbox PDFs and build the offline library from individual ChordPro files."""
import base64
import hashlib
import html
import os
import json
import re
import subprocess
import unicodedata
import uuid
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


def song_change(path, revision):
    # PDF imports belong to the commit that supplied the PDF, not the publishing bot.
    info = subprocess.check_output(
        ['git', 'log', '-1', '--format=%an%x00%aI', '--', str(path)],
        cwd=ROOT, text=True).strip()
    if not info:
        raise ValueError(f'Commit the song source before building its revision history: {path}')
    author, date = info.split('\0')
    return dict(revision=revision, author=author, date=date)


def activity_report(songs):
    english = sum(s.get('lyricsLanguage') == 'en' for s in songs)
    events = [(c,s) for s in songs for c in s.get('changes', [])]
    added = sum(c['revision'] == 1 for c,s in events)
    result = [f"**{len(songs)} songs** · {added} added · {len(events)-added} revisions since tracking began.",
              "", "```mermaid", "pie showData", "    title Library by lyrics language",
              f'    "English" : {english}', f'    "Other or undetermined" : {len(songs)-english}', "```", "",
              "The initial 600 arrangements form the baseline. Each subsequent entry records the author and date of the source commit."]
    if events:
        months={}
        for change,_ in events:
            month=change['date'][:7]
            counts=months.setdefault(month,[0,0])
            counts[0 if change['revision']==1 else 1]+=1
        result+=['', '### Published changes by month', '', '```text']
        peak=max(sum(counts) for counts in months.values())
        for month,(adds,updates) in sorted(months.items()):
            bar='█'*max(1,round(24*(adds+updates)/peak))
            result.append(f'{month}  {bar}  {adds} added · {updates} updated')
        result+=['```']
        result += ["", "| Date | Song | Change | Revision | Contributor |", "|---|---|---|---:|---|"]
        def cell(value):
            return html.escape(value).replace('|', '&#124;').replace('\n',' ')
        for c,s in sorted(events, key=lambda e:e[0]['date'], reverse=True):
            song=cell(' – '.join(filter(None,[s['artist'],s['title']])))
            action='Added' if c['revision']==1 else 'Updated'
            result.append(f"| {c['date'][:10]} | {song} | {action} | {c['revision']} | {cell(c['author'])} |")
    return '\n'.join(result)


def update_readme(catalog,songs):
    path = ROOT/'README.md'
    start, end = '<!-- pending:start -->', '<!-- pending:end -->'
    before, rest = path.read_text().split(start)
    _, after = rest.split(end)
    items = ''.join('<li>'+html.escape(r['name'])+'</li>\n' for r in catalog)
    report = f'{len(catalog)} source files awaiting conversion.'
    if items:
        report += '\n\n<ul>\n'+items+'</ul>'
    readme=before+start+'\n'+report+'\n'+end+after
    prefix, rest=readme.split('<!-- statistics:start -->')
    _, suffix=rest.split('<!-- statistics:end -->')
    path.write_text(prefix+'<!-- statistics:start -->\n'+activity_report(songs)+'\n<!-- statistics:end -->'+suffix)


ID_DIRECTIVE = re.compile(r'^\{x-arrangement-id: ([0-9a-f-]{36})\}$', re.M)
REVISION_FIELDS = ('tabImages', 'cho', 'lang', 'lyricsLanguage', 'title', 'artist',
                   'minor', 'kind', 'note', 'keyBasis')


def read_arrangement(path):
    text = path.read_text()
    markers = list(ID_DIRECTIVE.finditer(text))
    if not markers:
        if '{x-arrangement-id:' in text:
            raise ValueError(f'Malformed arrangement ID in {path}')
        return None, text.rstrip() + '\n'
    marker = markers[0]
    if len(markers) != 1 or text[marker.end():].strip():
        raise ValueError(f'Keep one arrangement ID on the last line of {path}')
    return str(uuid.UUID(marker[1])), text[:marker.start()].rstrip() + '\n'


def new_id(file, source, legacy):
    origin = 'legacy' if legacy else subprocess.check_output(
        ['git', 'log', '-1', '--format=%H', '--', str(source)], cwd=ROOT, text=True
    ).strip()
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f'kk-songbook/{origin}/{file}'))


def chord_notation(cho, language):
    symbols = re.findall(r'\[([^\]]+)\]', cho)
    czech_notes = any(re.match(r'^H|^[A-H](?:is|es|[#b])?mi(?!n)', c) for c in symbols)
    return 'cz' if czech_notes or language == 'cs' else 'en'


def import_pdfs(state, arrangements, previous, catalog):
    provenance = {}
    by_id = {identifier: file for file, (_, identifier, _) in arrangements.items() if identifier}
    imported_digests = {entry['sha256']: entry for entry in state.values()}
    for path in sorted((ROOT/'inbox').rglob('*')):
        if not path.is_file() or path.suffix.lower() != '.pdf':
            continue
        key = unicodedata.normalize('NFC', path.relative_to(ROOT).as_posix())
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        entry = state.get(key)
        if not entry and digest in imported_digests:
            # A copy of an imported PDF cannot recreate an arrangement. Preserve
            # the deletion record under the copy's name in case it is edited later.
            prior_import = imported_digests[digest]
            prior_file = by_id.get(prior_import['id']) if prior_import.get('id') else prior_import['file']
            if prior_file not in arrangements:
                state[key] = dict(prior_import)
            continue
        name = unicodedata.normalize('NFC', path.stem)
        file = (by_id.get(entry['id']) if entry.get('id') else entry['file']) if entry else name+'.cho'
        if entry:
            # Keep the import record even after the arrangement is deliberately removed.
            if file not in arrangements:
                continue
            target, identifier, current = arrangements[file]
            if identifier:
                entry.update(id=identifier, file=file)
            generated = entry.get('generatedHash')
            if entry.get('generated') and ((generated and generated != digest_text(current)) or (
                    not generated and previous.get(file, {}).get('cho') != current)):
                entry['generated'] = False
            if entry['sha256'] == digest:
                if entry.get('generated'):
                    entry['generatedHash'] = digest_text(current)
                continue
        else:
            target, identifier = ROOT/'ChordPro'/file, None

        artist, sep, title = name.partition(' - ')
        language = 'und'
        try:
            if not sep or not artist.strip() or not title.strip():
                raise ValueError('Use inbox and name the file Artist - Title.pdf')
            if any(c in name for c in '{}\r\n'):
                raise ValueError('Unsupported characters in filename')
            if not entry and file in arrangements:
                raise ValueError('A song with this name already exists; use a distinct arrangement name')
            if entry and not entry.get('generated'):
                raise ValueError('Revised source for a manually edited arrangement; review before replacing')
            cho = convert(path, artist, title).rstrip() + '\n'
            arrangements[file] = (target, identifier, cho)
            provenance[file] = path.relative_to(ROOT)
            state[key] = dict(sha256=digest, file=file, generated=True, generatedHash=digest_text(cho))
            imported_digests[digest] = state[key]
        except (ValueError, subprocess.CalledProcessError) as error:
            print(f'Review required: {key}: {error}')
            catalog.append(dict(name=path.name, title=title, artist=artist, format='PDF',
                                inbox=key, lyricsLanguage=language))
    return provenance


def digest_text(text):
    return hashlib.sha256(text.encode()).hexdigest()


def build():
    library = ROOT/'knihovna.js'
    payload = ROOT/'library.json'
    old = load(payload, {})
    previous = {s['file']: s for s in old.get('songs', [])}
    previous_by_id = {s['id']: s for s in previous.values() if 'id' in s}
    catalog = load(ROOT/'tools/pending-sources.json', [])
    state_path = ROOT/'tools/imports.json'
    state = load(state_path, {})
    arrangements = {}
    identifiers = set()
    for path in sorted((ROOT/'ChordPro').glob('*.cho')):
        file = unicodedata.normalize('NFC', path.name)
        identifier, cho = read_arrangement(path)
        if file in arrangements or identifier in identifiers:
            raise ValueError(f'Duplicate arrangement filename or ID: {path}')
        if identifier:
            identifiers.add(identifier)
        arrangements[file] = (path, identifier, cho)
    provenance = import_pdfs(state, arrangements, previous, catalog)

    by_prior_file = {}
    new = []
    pending_sources = []
    for file, (path, identifier, cho) in arrangements.items():
        prior = previous_by_id.get(identifier)
        # Before the first ID-aware build, a previous filename is the only key.
        if prior is None and file in previous and 'id' not in previous[file]:
            prior = previous[file]
        source = provenance.get(file, path.relative_to(ROOT))
        if not identifier:
            identifier = new_id(file, source, prior is not None)
            if identifier in identifiers:
                raise ValueError(f'Duplicate arrangement ID: {path}')
            identifiers.add(identifier)
            pending_sources.append((path, cho + '{x-arrangement-id: '+identifier+'}\n'))
        elif file in provenance:
            pending_sources.append((path, cho + '{x-arrangement-id: '+identifier+'}\n'))
        song = dict(prior or {})
        def directive(field):
            match = re.search(r'^\{'+field+r':\s*([^}]+)\}', cho, re.M | re.I)
            return match[1].strip() if match else ''
        title = directive('title') or song.get('title') or path.stem
        song.update(file=file, id=identifier, cho=cho, title=title, artist=directive('artist'))
        if not prior or file in provenance:
            language = lyrics_language(cho)
            song.update(lyricsLanguage=language, lang=chord_notation(cho, language))
        if prior and prior['file'] != file:
            song['legacyFiles'] = list(dict.fromkeys([*prior.get('legacyFiles', []), prior['file']]))
        tab_files = re.findall(r'^\{image: src="(tabs/[a-z0-9-]+\.png)"\}$', cho, re.M)
        if tab_files:
            song['tabImages'] = {name: base64.b64encode((path.parent/name).read_bytes()).decode('ascii')
                                 for name in sorted(set(tab_files))}
        else:
            song.pop('tabImages', None)
        revision = prior.get('revision', 1) if prior else 0
        changes = list(prior.get('changes', [])) if prior else []
        if not prior or any(prior.get(key) != song.get(key) for key in REVISION_FIELDS):
            revision += 1
            changes.append(song_change(source, revision))
        if not song.get('addedAt'):
            added = next((event['date'] for event in changes if event['revision'] == 1), None)
            if added:
                song['addedAt'] = added
        song.update(revision=revision, changes=changes)
        if prior:
            by_prior_file[prior['file']] = song
        else:
            new.append(song)
    songs = [by_prior_file[file] for file in previous if file in by_prior_file] + new
    songs_by_file = {s['file']: s for s in songs}
    for entry in state.values():
        song = songs_by_file.get(entry['file'])
        if not entry.get('id') and song:
            entry['id'] = song['id']
    imported_paths = {arrangements[file][0] for file in provenance}
    for path, content in pending_sources:
        if path in imported_paths:
            path.write_text(content)
        else:
            # Appending the identity leaves existing source line numbers unchanged.
            newline = b'' if path.read_bytes().endswith(b'\n') else b'\n'
            with path.open('ab') as source_file:
                source_file.write(newline + (content.splitlines()[-1] + '\n').encode())
    update_readme(catalog,songs)
    state_path.write_text(json.dumps(state,ensure_ascii=False,sort_keys=True,indent=2)+'\n')
    version=old.get('version',0)+int(old.get('songs')!=songs or bool(old.get('catalog')))
    # Keep the empty catalog field for older offline readers.
    catalog=[]
    payload.write_text(dump(dict(schema=1,version=version,songs=songs,catalog=catalog))+'\n')
    (ROOT/'version.json').write_text(dump(dict(version=version,count=len(songs)))+'\n')
    # Escape HTML end tags inside song data before embedding it in a script element.
    data='var songs='+dump(songs)+';\nvar catalog='+dump(catalog)+';'
    library.write_text(data+'\n')
    page=ROOT/'index.html'
    visibility=os.environ.get('REPOSITORY_PRIVATE','true').lower()
    if visibility not in ('true','false'):
        raise ValueError('Invalid repository visibility')
    assets = ROOT / 'app'
    library_script = (data.replace('<', '\\u003c') + '\nvar libraryVersion=' + str(version)
                      + ';var privateRepository=' + visibility + ';')
    parts = {
        'styles': (assets / 'songbook.css').read_text(),
        'share_png': base64.b64encode((assets / 'share.png').read_bytes()).decode('ascii'),
        'library': library_script,
        'reader': (ROOT / 'cteni.js').read_text(),
    }
    template = (assets / 'songbook.html').read_text()
    page.write_text(re.sub(r'\{\{(\w+)\}\}', lambda match: parts[match[1]], template))
    print(f'Library {version}: {len(songs)} songs')


if __name__=='__main__':
    build()
