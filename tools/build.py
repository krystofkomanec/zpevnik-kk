"""Import new inbox PDFs and build the offline library from individual ChordPro files."""
import base64
import hashlib
import html
import os
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


def build():
    library = ROOT/'knihovna.js'
    source, overview = library.read_text().strip().removesuffix(';').split(';\nvar catalog=')
    songs = json.loads(source.removeprefix('var songs='))
    catalog = load(ROOT/'tools/pending-sources.json', [])
    provenance = {}
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
            provenance[file]=key
            state[key]={'sha256':digest,'file':file,'generated':True}
        except (ValueError,subprocess.CalledProcessError) as error:
            print(f'Review required: {key}: {error}')
            catalog.append(dict(name=path.name,title=title,artist=artist,format='PDF',inbox=key,lyricsLanguage=language))
    payload=ROOT/'library.json'
    old=load(payload,{})
    previous={s['file']:s for s in old.get('songs',[])}
    for path in sorted((ROOT/'ChordPro').glob('*.cho')):
        file=unicodedata.normalize('NFC',path.name)
        if file not in by_file:
            cho=path.read_text()
            def directive(field):
                m=re.search(r'^\{'+field+r':\s*([^}]+)\}',cho,re.M|re.I)
                return m[1].strip() if m else ''
            language=lyrics_language(cho)
            by_file[file]=dict(file=file,title=directive('title') or path.stem,
                               artist=directive('artist'),lyricsLanguage=language,
                               lang='cz' if language=='cs' else 'en')
    for file,song in by_file.items():
        path=ROOT/'ChordPro'/file
        song['cho']=path.read_text().rstrip()+'\n'
        tab_files = re.findall(r'^\{image: src="(tabs/[a-z0-9-]+\.png)"\}$', song['cho'], re.M)
        if tab_files:
            song['tabImages'] = {name: base64.b64encode((path.parent/name).read_bytes()).decode('ascii')
                                 for name in sorted(set(tab_files))}
        else:
            song.pop('tabImages', None)
        prior=previous.get(file)
        revision=prior.get('revision',1) if prior else 0
        changes=list(prior.get('changes',[])) if prior else []
        fields=('tabImages','cho','lang','lyricsLanguage','title','artist','minor','kind','note')
        if not prior or any(prior.get(key)!=song.get(key) for key in fields):
            revision+=1
            changes.append(song_change(provenance.get(file,path.relative_to(ROOT)), revision))
        added = (prior or {}).get('addedAt') or song.get('addedAt')
        if not added:
            added = next((event['date'] for event in changes if event['revision'] == 1), None)
        if added:
            song['addedAt'] = added
        if prior and prior.get('sourceDate'):
            song['sourceDate'] = prior['sourceDate']
            if prior.get('sourceTimestamp'):
                song['sourceTimestamp'] = prior['sourceTimestamp']
        song.update(revision=revision,changes=changes)
    songs=list(by_file.values())
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
    head,sep,_=page.read_text().partition('<script>var songs=')
    if not sep:
        raise ValueError('Missing library script in index.html')
    visibility=os.environ.get('REPOSITORY_PRIVATE','true').lower()
    if visibility not in ('true','false'):
        raise ValueError('Invalid repository visibility')
    page.write_text(head+'<script>'+data.replace('<','\\u003c')+'\nvar libraryVersion='+str(version)+';var privateRepository='+visibility+';</script><script>'+(ROOT/'cteni.js').read_text()+'</script></html>\n')
    print(f'Library {version}: {len(songs)} songs')


if __name__=='__main__':
    build()
