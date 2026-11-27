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
function theme(){document.body.classList.toggle('dark',dark);el('theme').textContent=dark?'☾':'☀';el('theme').setAttribute('aria-pressed',String(dark));save('dark',dark?'1':'0')}
el('theme').onclick=function(){dark=!dark;theme()};
el('toggle').onclick=function(){
 document.body.classList.add('browse');
 window.scrollTo(0,0);
};
var eventPrefix='zpevnik.open.',temporaryEvents=[],storageAvailable=true;
function events(){
 var result=temporaryEvents.slice();
 try{
  for(var i=0;i<localStorage.length;i++){
   var key=localStorage.key(i);
   if(key&&key.indexOf(eventPrefix)===0){
    var record;
    try{record=JSON.parse(localStorage.getItem(key))}catch(invalid){continue}
    if(record&&typeof record.name==='string'&&typeof record.time==='number')result.push(record);
   }
  }
 }catch(error){storageAvailable=false}
 return result.sort(function(a,b){return b.time-a.time});
}
function recordOpen(song,kind){
 var name=kind==='ChordPro'?[song.artist,song.title].filter(Boolean).join(' - '):song.src.split('/').pop();
 var record={name:name,kind:kind,time:Date.now()};
 var key=eventPrefix+record.time+'.'+Math.random().toString(36).slice(2);
 try{localStorage.setItem(key,JSON.stringify(record))}
 catch(error){storageAvailable=false;temporaryEvents.push(record)}
 if(!el('usage-panel').hidden)showUsage();
}
function openedAt(timestamp){
 var date=new Date(timestamp);
 function two(value){return ('0'+value).slice(-2)}
 return date.getDate()+'. '+(date.getMonth()+1)+'. '+date.getFullYear()+' · '+two(date.getHours())+':'+two(date.getMinutes());
}
function showUsage(){
 var data=events(),counts=Object.create(null),pdfs=el('pdf-log'),rank=el('file-counts');
 clear(pdfs);clear(rank);
 data.forEach(function(r){
  var id=r.kind+'|'+r.name;
  if(!counts[id])counts[id]={record:r,n:0};
  counts[id].n++;
  if(r.kind==='PDF'){
   var item=make('li',r.name),time=make('small',openedAt(r.time));
   item.appendChild(time);pdfs.appendChild(item);
  }
 });
 var ids=Object.keys(counts).sort(function(a,b){return counts[b].n-counts[a].n||counts[b].record.time-counts[a].record.time});
 ids.forEach(function(id){
  var entry=counts[id],item=make('li'),label=make('span',entry.record.name);
  label.appendChild(make('small','Naposledy otevřeno: '+openedAt(entry.record.time)));item.appendChild(label);item.appendChild(make('strong',entry.n+'×'));rank.appendChild(item);
 });
 el('usage-total').textContent='Celkem otevření: '+data.length+' · Různých souborů: '+ids.length;
 el('no-pdf').hidden=pdfs.children.length>0;el('reset-usage').disabled=!data.length;
 el('storage-warning').hidden=storageAvailable;
}
el('usage').onclick=function(){
 var panel=el('usage-panel');panel.hidden=!panel.hidden;
 el('usage').setAttribute('aria-expanded',String(!panel.hidden));
 if(!panel.hidden)showUsage();
};
el('reset-usage').onclick=function(){
 if(!window.confirm('Vymazat historii otevření i statistiky v tomto prohlížeči?'))return;
 try{
  var keys=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf(eventPrefix)===0)keys.push(k)}
  keys.forEach(function(k){localStorage.removeItem(k)});
 }catch(error){storageAvailable=false}
 temporaryEvents=[];showUsage();
};
function refreshUsage(){if(!el('usage-panel').hidden)showUsage()}
window.addEventListener('pageshow',refreshUsage);window.addEventListener('storage',refreshUsage);
function list(){var box=el('list'),q=fold(el('search').value),count=0;clear(box);
 songs.forEach(function(s){if(fold(s.title+' '+s.artist).indexOf(q)<0)return;var b=make('button',s.title,'item');b.appendChild(make('small',[s.artist].filter(Boolean).join(' · ')));b.setAttribute('aria-current',s===current?'true':'false');b.onclick=function(){openSong(s)};box.appendChild(b);count++});el('count').textContent=count+' položek';}
function openSong(s,initial){
 if(!initial)recordOpen(s,'ChordPro');
 current=s;shift=0;document.body.classList.remove('browse');list();render();window.scrollTo(0,0)}
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
function render(){var s=current,score=el('score'),ch=[];clear(score);el('title').textContent=s.title;el('artist').textContent=[s.artist,s.kind].filter(Boolean).join(' · ');el('status').textContent=s.note||'';el('chords').textContent='';el('cap').textContent='';el('tools').style.display=s.cho?'flex':'none';score.style.fontSize=size+'px';
 var harmonicas=['C','','D','','E','F','','G','','A','','H'];
 var harp=typeof s.minor==='number'?harmonicas[(s.minor+shift+15)%12]:'';
 el('harp').textContent=harp?'Foukací harmonika · '+harp+' dur (4. poloha)':'';
 el('harp').hidden=!harp;
 if(s.cho){var c=meta(s.cho,'capo');if(/^\d+$/.test(c)&&+c>0)el('cap').textContent='Kapodastr · '+c+'. pražec';
 var rows=s.cho.split(/\r?\n/), verseLabel=false;
 rows.forEach(function(line,i){
  if(!line.trim()||/^\s*#/.test(line))return;
  var d=directive(line);
  if(d){
   var lbl={start_of_chorus:'Refrén',soc:'Refrén',start_of_verse:'Sloka',sov:'Sloka',start_of_bridge:'Mezihra'};
   if(d[1]==='comment'||d[1]==='c'||lbl[d[1]]){
    var heading=d[2]||lbl[d[1]]||'';verseLabel=/sloka|verse/i.test(heading);
    score.appendChild(make('div',heading,'section'));
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
 el('chords').textContent=ch.join(' · ');el('pitch').textContent=(shift>0?'+':'')+shift;el('small').disabled=size<=14;el('big').disabled=size>=40;el('down').disabled=shift<=-12;el('up').disabled=shift>=12}
}
el('search').oninput=list;
function updateOverview(){
 var query=fold(el('catalog-search').value),box=el('catalog-list'),count=0;clear(box);
 catalog.forEach(function(r){
  if(query&&fold([r.name,r.artist,r.title].join(' ')).indexOf(query)<0)return;
  var item=make('li');item.appendChild(make('strong',r.name));box.appendChild(item);count++;
 });
 el('catalog-count').textContent='Počet skladeb: '+count;
}
el('catalog-toggle').onclick=function(){
 var panel=el('catalog-panel');panel.hidden=!panel.hidden;el('catalog-toggle').setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)updateOverview();
};
el('catalog-search').oninput=updateOverview;
function resize(d){size=Math.max(14,Math.min(40,size+d));save('text',size);render()}
el('small').onclick=function(){resize(-2)};el('big').onclick=function(){resize(2)};
el('up').onclick=function(){shift=Math.min(12,shift+1);render()};el('down').onclick=function(){shift=Math.max(-12,shift-1);render()};el('pitch').onclick=function(){shift=0;render()};
theme();openSong(songs.filter(function(s){return s.title==='Runaway'})[0],true);
})();
