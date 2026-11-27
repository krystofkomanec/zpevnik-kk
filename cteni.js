(function(){
'use strict';
function el(id){return document.getElementById(id)}
function make(tag,text,cls){var e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e}
function clear(e){while(e.firstChild)e.removeChild(e.firstChild)}
function get(k,f){try{return localStorage.getItem('zpevnik.'+k)||f}catch(e){return f}}
function save(k,v){try{localStorage.setItem('zpevnik.'+k,v)}catch(e){}}
function fold(s){s=s.toLowerCase();return s.normalize?s.normalize('NFD').replace(/[\u0300-\u036f]/g,''):s}
var size=Math.min(40,Math.max(14,Number(get('text','21'))||21)),dark=get('dark','0')==='1',current,shift=0;
songs.sort(function(a,b){return Number(!!b.cho)-Number(!!a.cho)||a.title.localeCompare(b.title,'cs')});
var english = get('language','cs') === 'en';
function t(cs,en){return english ? en : cs}
function visible(song){return !english || song.lyricsLanguage === 'en'}
function translatePage(){
 document.documentElement.lang=t('cs','en');
 document.title=t('Zpěvník KK','KK Songbook');
 ['textContent','title','aria-label','placeholder'].forEach(function(attr){
  var key=attr==='textContent'?'data-en':'data-en-'+attr;
  var nodes=document.querySelectorAll('['+key+']');
  for(var i=0;i<nodes.length;i++){
   var node=nodes[i],text=attr==='textContent',cs=key.replace('data-en','data-cs');
   if(!node.hasAttribute(cs))node.setAttribute(cs,text?node.textContent:node.getAttribute(attr));
   var value=node.getAttribute(english?key:cs);
   if(text)node.textContent=value;else node.setAttribute(attr,value);
  }
 });
 el('language').textContent=t('English','Čeština');
 el('language').lang=t('en','cs');
}
el('language').onclick=function(){
 english=!english;save('language',english?'en':'cs');translatePage();
 if(!visible(current)){current=songs.filter(visible)[0];shift=0}
 list();render();
};
function theme(){document.body.classList.toggle('dark',dark);el('theme').textContent=dark?'☾':'☀';el('theme').setAttribute('aria-pressed',String(dark));save('dark',dark?'1':'0')}
el('theme').onclick=function(){dark=!dark;theme()};
el('toggle').onclick=function(){
 var opened=document.body.classList.toggle('browse');el('toggle').setAttribute('aria-expanded',String(opened));
 window.scrollTo(0,0);
};
function list(){var box=el('list'),q=fold(el('search').value),count=0;clear(box);
 songs.forEach(function(s){if(!visible(s)||fold(s.title+' '+s.artist).indexOf(q)<0)return;var b=make('button',s.title,'item');b.appendChild(make('small',[s.artist].filter(Boolean).join(' · ')));b.setAttribute('aria-current',s===current?'true':'false');b.onclick=function(){openSong(s)};box.appendChild(b);count++});el('count').textContent=count+t(' položek',count===1?' song':' songs');}
function openSong(s){
 current=s;shift=0;document.body.classList.remove('browse');el('toggle').setAttribute('aria-expanded','false');list();render();window.scrollTo(0,0)}
function note(n,lang){
 var m=/^([A-H])(is|es|s(?!us)|#|b|♭|♯)?$/.exec(n);if(!m)return null;
 var p={C:0,D:2,E:4,F:5,G:7,A:9,B:lang==='cz'&&!m[2]?10:11,H:11}[m[1]];
 if(m[2])p+=/^(is|#|♯)$/.test(m[2])?1:-1;
 return (p+12)%12;
}
function transpose(symbol,lang){

 var m=/^([A-H](?:is|es|s(?!us)|#|b|♯|♭)?)([^/]*)(?:\/([A-H](?:is|es|s(?!us)|#|b|♯|♭)?))?$/.exec(symbol);if(!m)return symbol;
 function move(n){
 if(!shift){
  if(lang==='en' && n==='B')return 'H';
  if(/^B[b♭]$/.test(n))return 'B';
  return n;
 }
 var flat=/b|es|♭/.test(n)||shift<0,p=(note(n,lang)+shift+24)%12;
 var names=(flat?'C Db D Eb E F Gb G Ab A Bb B':'C C# D D# E F F# G G# A A# B').split(' ');names[10]='B';names[11]='H';return names[p]}
 return move(m[1])+m[2]+(m[3]?'/'+move(m[3]):'');
}
function directive(line){return /^\{\s*([^}:]+?)(?:\s*:\s*([^}]*))?\s*\}$/.exec(line.trim())}
function meta(text,key){var lines=text.split(/\r?\n/);for(var k=0;k<lines.length;k++){var d=directive(lines[k]);if(d&&d[1]===key)return (d[2]||'').trim()}return ''}
function drawLine(line,lang,seen){
 var row=make('div',undefined,line.indexOf('[')<0?'line lyrics-only':'line');
 line=line.trim().replace(/^(\[[^\]]+\])\s+(?=[A-Za-zÀ-ž])/, '$1').replace(/\](?=\[)/g,'] ');
 line.split(/\s+/).forEach(function(word,i){
  if(i)row.appendChild(document.createTextNode(' '));
  var w=make('span',undefined,'word'),rx=/\[([^\]]+)\]([^\[]*)/g,m,first=word.indexOf('[');
  if(first!==0)w.appendChild(document.createTextNode(first<0?word:word.slice(0,first)));
  while((m=rx.exec(word))){
   var chunk=make('span',undefined,'chunk'),c=transpose(m[1],lang);
   if(c!=='N.C.'&&seen.indexOf(c)<0)seen.push(c);
   var lane=make('span',undefined,'chord-lane');
   lane.appendChild(make('span',c,'ch'));chunk.appendChild(lane);
   chunk.appendChild(document.createTextNode(m[2]||'\u200b'));w.appendChild(chunk);
  }
  row.appendChild(w);
 });
 return row;
}
// Frets run from the low E string to the high E string. -1 mutes a string.
var openShapes={
 'C':'x32010','D':'xx0232','E':'022100','F':'133211','G':'320003','A':'x02220',
 'Am':'x02210','Em':'022000','Dm':'xx0231','Cmaj7':'x32000','Fmaj7':'xx3210',
 'G7':'320001','E7':'020100','D7':'xx0212','A7':'x02020','H7':'x21202',
 'Am7':'x02010','Em7':'022030','Dm7':'xx0211','Dsus4':'xx0233','Dsus2':'xx0230',
 'Asus2':'x02200','Asus4':'x02230','Cadd9':'x32033','D/F#':'200232','G/H':'x20033'
};
var intervals={'':[0,4,7],m:[0,3,7],maj:[0,4,7],5:[0,7],7:[0,4,7,10],
 m7:[0,3,7,10],maj7:[0,4,7,11],6:[0,4,7,9],m6:[0,3,7,9],dim:[0,3,6],
 dim7:[0,3,6,9],aug:[0,4,8],sus2:[0,2,7],sus4:[0,5,7],'7sus4':[0,5,7,10],
 add9:[0,2,4,7],madd9:[0,2,3,7],add11:[0,4,5,7],add4:[0,4,5,7],
 '6add9':[0,2,4,7,9],'6add11':[0,4,5,7,9],9:[0,2,4,7,10],m9:[0,2,3,7,10],
 maj9:[0,2,4,7,11],m7b5:[0,3,6,10],'m7#5':[0,3,8,10]};
var shapeCache=Object.create(null);
function guitarShape(symbol){
 if(Object.prototype.hasOwnProperty.call(shapeCache,symbol))return shapeCache[symbol];
 var match=/^([A-H](?:is|es|s(?!us)|#|b|♭|♯)?)([^/]*)(?:\/([A-H](?:is|es|s|#|b|♭|♯)?))?$/.exec(symbol);
 if(!match)return null;
 var quality=match[2].replace(/^(?:min|mi)/,'m').replace(/^\+$/,'aug').replace(/^(4|sus|4sus)$/,'sus4');
 var tones=intervals[quality],root=note(match[1],'cz'),bass=match[3]?note(match[3],'cz'):root;
 if(!Array.isArray(tones)||root===null||bass===null)return null;
 var preset=openShapes[match[1]+quality+(match[3]?'/'+match[3]:'')];
 if(preset)return preset.split('').map(function(c){return c==='x'?-1:Number(c)});
 var tuning=[4,9,2,7,11,4],required=tones.map(function(n){return (n+root)%12});
 var best=null,bestCost=Infinity;
 // Search contiguous strings in a four-fret window; the lowest pitch must be the requested bass.
 for(var start=1;start<=9;start++){
  for(var first=0;first<=3;first++)visit(first,[],[],0,0);
 }
 function visit(string,frets,pitches,fingers,sum){
  if(frets.length>=3 && required.every(function(n){return pitches.indexOf(n)>=0})){
   var cost=(6-frets.length)*3+Math.max.apply(null,frets)*1.7+sum*.16+fingers*.4;
   if(cost<bestCost){
    bestCost=cost;best=[-1,-1,-1,-1,-1,-1];
    frets.forEach(function(f,i){best[first+i]=f});
   }
  }
  if(string===6)return;
  for(var f=0;f<=start+3;f++){
   if(f && f<start)continue;
   var pitch=(tuning[string]+f)%12;
   if((!frets.length && pitch!==bass)||(frets.length && required.indexOf(pitch)<0))continue;
   if(f && fingers>=4)continue;
   visit(string+1,frets.concat(f),pitches.concat(pitch),fingers+(f?1:0),sum+f);
  }
 }
 shapeCache[symbol]=best;return best;
}
function guitarDiagram(frets){
 var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 100 94');svg.setAttribute('aria-hidden','true');
 function draw(tag,attrs){
  var item=document.createElementNS(svg.namespaceURI,tag);
  Object.keys(attrs).forEach(function(k){item.setAttribute(k,attrs[k])});svg.appendChild(item);return item;
 }
 function line(x,y,end,bottom,width){draw('line',{x1:x,y1:y,x2:end,y2:bottom,stroke:'currentColor','stroke-width':width})}
 var positive=frets.filter(function(n){return n>0});
 var base=Math.max.apply(null,positive)>4?Math.min.apply(null,positive):1;
 if(base>1)draw('text',{x:1,y:33,fill:'currentColor','font-size':10}).textContent=base;
 for(var r=0;r<=4;r++)line(20,20+r*16,85,20+r*16,r===0 && base===1?3:1);
 frets.forEach(function(f,i){
  var x=20+i*13;line(x,20,x,84,1);
  if(f===-1){line(x-3,7,x+3,13,1.3);line(x+3,7,x-3,13,1.3)}
  else draw('circle',{cx:x,cy:f?28+(f-base)*16:10,r:f?4.8:3,fill:f?'currentColor':'none',stroke:'currentColor'});
 });
 return svg;
}
var chartSymbols=[];
function showCharts(){
 var box=el('charts');clear(box);
 if(!el('guitar').open)return;
 chartSymbols.forEach(function(symbol){
  var card=make('div',undefined,'chart'),shape=guitarShape(symbol);
  card.appendChild(make('b',symbol));
  if(shape){
   card.appendChild(guitarDiagram(shape));
   card.appendChild(make('small',shape.map(function(n){return n<0?'×':n}).join(' ')));
  }else card.appendChild(make('small',t('Hmat neurčen','Unknown shape')));
  box.appendChild(card);
 });
}
el('guitar').ontoggle=showCharts;

function songLabel(value){
 if(!english || !value)return value;
 var labels={'Text s akordy':'Lyrics and chords','Text bez akordů':'Lyrics only','Akordový doprovod':'Chord accompaniment','Refrén':'Chorus','Sloka':'Verse','Mezihra':'Interlude','PDF uvádí 3. pražec, původní název souboru uvádí 2.':'The PDF specifies fret 3; the original filename specifies fret 2.','Umístění doplněných akordů ve slokách je odvozené podle předchozí sloky.':'Added verse chord positions follow the preceding verse.'};
 return labels[value] || value.replace(/^(\d+)\. sloka$/i,'Verse $1');
}
function render(){var s=current,score=el('score'),ch=[];clear(score);el('title').textContent=s.title;el('artist').textContent=s.artist;el('status').textContent=songLabel(s.note)||'';el('chords').textContent='';el('cap').textContent='';el('tools').style.display=s.cho?'flex':'none';score.style.fontSize=size+'px';
 var harmonicas=['C','','D','','E','F','','G','','A','','H'];
 var harp=typeof s.minor==='number'?harmonicas[(s.minor+shift+15)%12]:'';
 el('harp').textContent=harp?t('Foukací harmonika · ','Harmonica · ')+harp+t(' dur (4. poloha)',' major (4th position)'):'';
 el('harp').hidden=!harp;
 if(s.cho){var c=meta(s.cho,'capo');if(/^\d+$/.test(c)&&+c>0)el('cap').textContent=t('Kapodastr · '+c+'. pražec','Capo · fret '+c);
 var rows=s.cho.split(/\r?\n/), verseLabel=false;
 rows.forEach(function(line,i){
  if(!line.trim()||/^\s*#/.test(line))return;
  var d=directive(line);
  if(d){
   var lbl={start_of_chorus:'Refrén',soc:'Refrén',start_of_verse:'Sloka',sov:'Sloka',start_of_bridge:'Mezihra'};
   if(d[1]==='comment'||d[1]==='c'||lbl[d[1]]){
    var heading=d[2]||lbl[d[1]]||'';verseLabel=/sloka|verse/i.test(heading);
    score.appendChild(make('div',songLabel(heading),'section'));
   }
   return;
  }
  var row=drawLine(line,s.lang||'en',ch),next=rows[i+1]||'';
  if(verseLabel && /^\s*(?:\[[^\]]+\]\s*)+$/.test(line) && next.trim() && !/[{}\[\]]/.test(next) && !/^\s*#/.test(next)){
   row.className+=' progression';
   row.appendChild(make('div',next.trim(),'progression-text'));
  }else if(i && score.lastChild && score.lastChild.classList.contains('progression') && /^\s*(?:\[[^\]]+\]\s*)+$/.test(rows[i-1]))return;
  score.appendChild(row);
 });
 chartSymbols=ch;el('guitar').hidden=!ch.length;el('chords').textContent=ch.join(' · ');showCharts();el('pitch').textContent=(shift>0?'+':'')+shift;el('small').disabled=size<=14;el('big').disabled=size>=40;el('down').disabled=shift<=-12;el('up').disabled=shift>=12}
}
el('search').oninput=list;
function resize(d){size=Math.max(14,Math.min(40,size+d));save('text',size);render()}
el('small').onclick=function(){resize(-2)};el('big').onclick=function(){resize(2)};
el('up').onclick=function(){shift=Math.min(12,shift+1);render()};el('down').onclick=function(){shift=Math.max(-12,shift-1);render()};el('pitch').onclick=function(){shift=0;render()};
var cacheKey='zpevnik.library.v1';
function validateLibrary(data){
 if(!data || data.schema!==1 || typeof data.version!=='number' || data.version<1 ||
    data.version%1!==0 || !Array.isArray(data.songs) || !data.songs.length || !Array.isArray(data.catalog))throw Error('format');
 if(!data.songs.every(function(s){return s && typeof s.title==='string' && typeof s.artist==='string' &&
    typeof s.file==='string' && typeof s.cho==='string' && s.cho.length>0 &&
    (!s.changes || (Array.isArray(s.changes) && s.changes.every(function(c){
     return c && typeof c.author==='string' && typeof c.revision==='number' && isFinite(Date.parse(c.date));
    })))}) ||
    !data.catalog.every(function(r){return r && typeof r.name==='string'}))throw Error('format');
}
function useLibrary(data){
 songs=data.songs;catalog=data.catalog;libraryVersion=data.version;
 songs.sort(function(a,b){return a.title.localeCompare(b.title,'cs')});
}
try{
 var stored=JSON.parse(localStorage.getItem(cacheKey));
 if(stored && stored.version>libraryVersion){validateLibrary(stored);useLibrary(stored)}
}catch(ignore){}
function updateMessage(cs,en){
 var status=el('update-status');status.hidden=false;status.textContent=t(cs,en);
}
function installLibrary(data){
 validateLibrary(data);
 el('update-library').hidden=true;
 if(data.version<=libraryVersion){
  el('update-fallback').hidden=true;
  updateMessage('Už máš nejnovější dostupná data.','Your library is already up to date.');return;
 }
 // Write the complete replacement before changing the current view.
 try{localStorage.setItem(cacheKey,JSON.stringify(data))}
 catch(error){updateMessage('Data se nepodařilo uložit. Stáhni si nové vydání aplikace.','Unable to save offline data. Download the latest app release.');return}
 var selected=current.file;
 useLibrary(data);
 current=songs.filter(function(s){return s.file===selected && visible(s)})[0] || songs.filter(visible)[0] || songs[0];
 list();render();el('update-fallback').hidden=true;
 updateMessage('Aktualizováno. Skladeb v knihovně: '+songs.length,'Updated. Songs in the library: '+songs.length);
}
var sessionToken='',lastWasCheck=true;
el('private-update').onclick=function(){
 sessionToken=el('library-token').value.trim();el('library-token').value='';
 if(sessionToken)requestLibrary(lastWasCheck);
};
el('check-library').onclick=function(){requestLibrary(true)};
el('update-library').onclick=function(){requestLibrary(false)};
function requestLibrary(check){
 lastWasCheck=check;
 function accessRequired(cs,en){
  el('update-fallback').hidden=false;
  el('private-access').open=true;
  updateMessage(cs,en);
 }
 if(privateRepository && !sessionToken){
  accessRequired('Pro kontrolu soukromé knihovny zadej token s přístupem pro čtení, nebo stáhni a načti library.json.',
   'To check this private library, enter a read-only token or download and load library.json.');
  return;
 }
 function busy(value){
  el('check-library').disabled=value;el('update-library').disabled=value;el('private-update').disabled=value;
 }
 busy(true);
 if(check)el('update-library').hidden=true;
 updateMessage(check?'Kontroluji verzi knihovny…':'Stahuji skladby…',check?'Checking library version…':'Downloading songs…');
 var request=new XMLHttpRequest();
 function failed(){
  busy(false);el('update-fallback').hidden=false;
  updateMessage('Aktuálnost nelze ověřit. Místní verze: '+libraryVersion+'. Zkontroluj připojení nebo otevři možnosti níže.',
   'Could not verify the latest version. Local version: '+libraryVersion+'. Check your connection or use the options below.');
 }
 request.onload=function(){
  busy(false);
  if(sessionToken && [401,403,404].indexOf(request.status)>=0){
   sessionToken='';
   accessRequired('GitHub přístup odmítl. Ověř, že token má pro tento repozitář oprávnění Contents: Read.',
    'GitHub denied access. Check that the token has Contents: Read for this repository.');
   return;
  }
  if(request.status!==200){failed();return}
  try{
   var data=JSON.parse(request.responseText);
   if(!check){installLibrary(data);return}
   if(typeof data.version!=='number'||data.version<1||data.version%1!==0)throw Error('version');
   var newer=data.version>libraryVersion;
   el('update-library').hidden=!newer;el('update-fallback').hidden=true;
   var versions=t('Místní verze ','Local version ')+libraryVersion+t(' · GitHub ',' · GitHub ')+data.version;
   updateMessage((newer?'Je dostupná aktualizace. ':'Data jsou aktuální. ')+versions,
    (newer?'Update available. ':'Library is up to date. ')+versions);
  }catch(error){failed()}
 };
 request.onerror=request.ontimeout=failed;
 var file=check?'version.json':'library.json';
 var url=sessionToken?'https://api.github.com/repos/krystofkomanec/zpevnik-kk/contents/'+file+'?ref=main&v=':'https://raw.githubusercontent.com/krystofkomanec/zpevnik-kk/main/'+file+'?v=';
 request.open('GET',url+Date.now(),true);
 if(sessionToken){
  request.setRequestHeader('Accept','application/vnd.github.raw+json');
  request.setRequestHeader('Authorization','Bearer '+sessionToken);
 }
 request.timeout=20000;request.send();
}
el('update-file').onchange=function(){
 var input=this,file=input.files[0];if(!file)return;
 var reader=new FileReader();
 function failed(){updateMessage('Soubor knihovny se nepodařilo načíst.','Could not load the library file.')}
 reader.onload=function(){try{installLibrary(JSON.parse(reader.result))}catch(error){failed()}};
 reader.onerror=failed;reader.readAsText(file);input.value='';
};

translatePage();theme();openSong(songs.filter(function(s){return s.title==='Runaway'})[0]);
})();
