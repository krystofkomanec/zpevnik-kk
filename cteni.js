(function(){
'use strict';
function el(id){return document.getElementById(id)}
function make(tag,text,cls){var e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e}
function clear(e){while(e.firstChild)e.removeChild(e.firstChild)}
function get(k,f){try{return localStorage.getItem('zpevnik.'+k)||f}catch(e){return f}}
function save(k,v){try{localStorage.setItem('zpevnik.'+k,v)}catch(e){}}
function fold(s){s=s.toLowerCase();return s.normalize?s.normalize('NFD').replace(/[\u0300-\u036f]/g,''):s}
var noSong={file:'',title:'',artist:'',cho:''};
var size=Math.min(40,Math.max(14,Number(get('text','21'))||21)),dark=get('dark','0')==='1',current,shift=0;
var order=el('library-order');
var savedOrder=get('order','title');
order.value=savedOrder==='added'?'source':savedOrder;if(!order.value)order.value='title';
function songDate(song){
 if(order.value==='source')return song.sourceTimestamp||song.sourceDate||'';
 if(order.value==='imported'){
  if(song.addedAt)return song.addedAt;
  var first=(song.changes||[]).filter(function(c){return c.revision===1})[0];
  return first?first.date:'';
 }
 return '';
}
function sortLibrary(){
 songs.sort(function(a,b){
  var x=Date.parse(songDate(a)),y=Date.parse(songDate(b));
  if(isFinite(x)!==isFinite(y))return isFinite(x)?-1:1;
  return (y-x)||a.title.localeCompare(b.title,'cs')||a.file.localeCompare(b.file,'cs');
 });
}
sortLibrary();
order.onchange=function(){save('order',order.value);sortLibrary();el('list').scrollTop=0;list();rememberLibrary()};
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
 el('language').lang=t('en','cs');reportCount();
}
el('language').onclick=function(){
 english=!english;save('language',english?'en':'cs');translatePage();
 if(current===noSong || !visible(current)){current=songs.find(visible)||noSong;loadSongSettings()}
 list();render();
};
function theme(){document.body.classList.toggle('dark',dark);el('theme').textContent=dark?'☾':'☀';el('theme').setAttribute('aria-pressed',String(dark));save('dark',dark?'1':'0')}
el('theme').onclick=function(){dark=!dark;theme()};
var libraryView={query:'',file:'',top:0,page:0,browse:false};
try{var previousView=JSON.parse(sessionStorage.getItem('zpevnik.library-view'));
 if(previousView && typeof previousView.query==='string')libraryView=previousView;
}catch(ignore){}
function rememberLibrary(){
 libraryView.query=el('search').value;
 if(current)libraryView.file=songKey(current);
 libraryView.browse=document.body.classList.contains('browse');
 if(el('library').offsetWidth)libraryView.top=el('list').scrollTop;
 if(libraryView.browse)libraryView.page=window.pageYOffset;
 try{sessionStorage.setItem('zpevnik.library-view',JSON.stringify(libraryView))}catch(ignore){}
}
window.addEventListener('pagehide',rememberLibrary);
el('toggle').onclick=function(){
 rememberLibrary();
 var opened=document.body.classList.toggle('browse');el('toggle').setAttribute('aria-expanded',String(opened));
 if(opened)el('list').scrollTop=libraryView.top||0;
 window.scrollTo(0,opened?libraryView.page||0:0);
 rememberLibrary();
};
function formatLibraryDate(song){
 var stamp=songDate(song);
 var hasTime=stamp.indexOf('T')!==-1;
 var day=new Date(hasTime?stamp:stamp+'T12:00:00');
 if(!isFinite(day.getTime()))return t('Datum neznámé','Date unknown');
 var locale=t('cs-CZ','en-GB');
 var label=day.toLocaleDateString(locale);
 if(!hasTime)return label;
 var time=order.value==='source'?stamp.slice(11,16):day.toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit',hour12:false});
 return label+' · '+time;
}
function list(){
 var box=el('list');
 var query=fold(el('search').value.trim());
 var top=box.scrollTop;
 var rows=document.createDocumentFragment();
 var count=0;
 songs.forEach(function(song){
  if(!visible(song)||fold(song.title+' '+song.artist).indexOf(query)<0)return;
  var button=make('button',song.title,'item');
  button.appendChild(make('small',song.artist||''));
  if(order.value!=='title')button.appendChild(make('small',formatLibraryDate(song)));
  button.dataset.file=song.file;
  button.setAttribute('aria-current',String(song===current));
  button.onclick=function(){openSong(song,button)};
  rows.appendChild(button);
  count++;
 });
 clear(box);
 box.appendChild(rows);
 box.scrollTop=top;
 var noun=count===1?' skladba':(count>=2&&count<=4?' skladby':' skladeb');
 el('count').textContent=count+t(noun,count===1?' song':' songs');
 el('empty-search').hidden=count!==0;
 el('clear-search').hidden=!query;
}
el('clear-search').onclick=function(){
 el('search').value='';
 list();
 el('search').focus();
};
function openSong(s,button){
 rememberLibrary();
 current=s;loadSongSettings();
 var active=el('list').querySelector('[aria-current="true"]');
 if(active)active.setAttribute('aria-current','false');
 button.setAttribute('aria-current','true');document.body.classList.remove('browse');
 el('toggle').setAttribute('aria-expanded','false');render();window.scrollTo(0,0);rememberLibrary();
}
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
  var lastMark=null,offset=0;
  if(i)row.appendChild(document.createTextNode(' '));
  var w=make('span',undefined,'word'),rx=/\[([^\]]+)\]([^\[]*)/g,m,first=word.indexOf('[');
  if(first!==0)w.appendChild(document.createTextNode(first<0?word:word.slice(0,first)));
  if(first>0)offset+=first;
  if(first<0)offset+=word.length;
  while((m=rx.exec(word))){
   var chunk=make('span',undefined,'chunk'),c=transpose(m[1],lang);
   if(c!=='N.C.'&&seen.indexOf(c)<0)seen.push(c);
   if(lastMark){
    var missing=lastMark.width-(offset-lastMark.offset);
    if(missing>0){
     lastMark.chunk.style.paddingRight=missing+'ch';
    }
   }
   lastMark={offset:offset,width:c.length*.96+.9,chunk:chunk};
   offset+=m[2].length;
   var lane=make('span',undefined,'chord-lane');
   lane.appendChild(make('span',c,'ch'));chunk.appendChild(lane);
   chunk.appendChild(document.createTextNode(m[2]||'\u200b'));w.appendChild(chunk);
  }
  if(lastMark && offset-lastMark.offset<lastMark.width)w.style.paddingRight=(lastMark.width-offset+lastMark.offset)+'ch';
  if(word.replace(/\[[^\]]+\]/g,'').length>20)w.className+=' long-word';
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
var shapeCache=Object.create(null),voicingCache=new Map(),tuning=[40,45,50,55,59,64];
var chordPattern=/^([A-H](?:is|es|s(?!us)|#|b|♭|♯)?)([^/]*)(?:\/([A-H](?:is|es|s|#|b|♭|♯)?))?$/;
function chordSpec(symbol){
 var match=chordPattern.exec(symbol);
 if(!match)return null;
 var quality=match[2].replace(/^(?:min|mi)/,'m').replace(/^\+$/,'aug').replace(/^(4|sus|4sus)$/,'sus4').replace(/^7sus$/,'7sus4');
 var tones=intervals[quality],root=note(match[1],'cz'),bass=match[3]?note(match[3],'cz'):root;
 if(!Array.isArray(tones)||root===null||bass===null)return null;
 return {name:match[1],quality:quality,root:root,bass:bass,slash:match[3],
  tones:tones.map(function(n){return (n+root)%12})};
}
function guitarShape(symbol){
 if(Object.prototype.hasOwnProperty.call(shapeCache,symbol))return shapeCache[symbol];
 var spec=chordSpec(symbol);
 if(!spec)return null;
 var preset=openShapes[spec.name+spec.quality+(spec.slash?'/'+spec.slash:'')];
 if(preset)return (shapeCache[symbol]=preset.split('').map(function(c){return c==='x'?-1:Number(c)}));
 var required=spec.tones,bass=spec.bass;
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
// A barre saves one finger per extra string if the lowest fret can be
// held across the intervening strings without muting a ringing open note.
function fingerCount(frets){
 var pressed=frets.filter(function(fret){return fret>0}),base=Math.min.apply(null,pressed);
 var span=frets.slice(frets.indexOf(base),frets.lastIndexOf(base)+1);
 var barre=span.length>1 && !span.includes(0);
 return {count:pressed.length-(barre?span.filter(function(fret){return fret===base}).length-1:0),barre:barre};
}
function guitarVoicings(symbol,spec){
 if(voicingCache.has(symbol))return voicingCache.get(symbol);
 var candidates=new Map();
 for(var start=1;start<=12;start++){
  for(var first=0;first<=3;first++)visit(first,first,[]);
 }
 function visit(first,string,frets){
  if(frets.length>=3){
   var pitches=frets.map(function(fret,i){return fret+tuning[first+i]});
   var bass=Math.min.apply(null,pitches)%12;
   var fingers=fingerCount(frets),butNotBass=pitches.slice(1);
   if(fingers.count<=4 && (!spec.slash || bass===spec.bass) &&
      butNotBass.every(function(pitch){return spec.tones.includes(pitch%12)}) &&
      spec.tones.every(function(tone){return pitches.some(function(pitch){return pitch%12===tone})})){
    var shape=Array(6).fill(-1);
    frets.forEach(function(fret,i){shape[first+i]=fret});
    var top=Math.max.apply(null,frets),base=top?Math.min.apply(null,frets.filter(function(fret){return fret>0})):0;
    var cost=(6-frets.length)*1.1+fingers.count*.9+top*.22+(top-base)*.55;
    var group=bass!==spec.bass?'inversion':frets.includes(0)?'open':fingers.barre?'barre':'higher';
    var key=shape.join(',');
    candidates.set(key,{shape:shape,bass:bass,group:group,position:base,cost:cost});
   }
  }
  if(string===6)return;
  var options=[0,start,start+1,start+2,start+3];
  options.forEach(function(fret){
   var tone=(tuning[string]+fret)%12;
   if(spec.tones.includes(tone) || (string===first && spec.slash && tone===spec.bass)){
    visit(first,string+1,frets.concat(fret));
   }
  });
 }
 var sorted=Array.from(candidates.values()).sort(function(a,b){return a.cost-b.cost});
 voicingCache.set(symbol,sorted);
 return sorted;
}
var czechNotes='C C# D Eb E F F# G Ab A B H'.split(' ');
function sameChordOptions(symbol,spec,defaultShape){
 var used=new Set(),options=[],defaultKey=defaultShape?defaultShape.join(','):'';
 var defaultPosition=defaultShape?Math.min.apply(null,defaultShape.filter(function(fret){return fret>0})):1;
 guitarVoicings(symbol,spec).forEach(function(option){
  if(options.length===4 || used.has(option.group) || option.shape.join(',')===defaultKey)return;
  if(option.group==='higher' && Math.abs(option.position-defaultPosition)<2)return;
  used.add(option.group);
  var descriptions={
   open:t('Doznívající otevřené struny','Ringing open strings'),
   barre:t('Barré hmat','Barre shape'),
   higher:t('Jiná poloha na hmatníku','Different neck position'),
   inversion:t('Obrat · bas ','Inversion · bass ')+czechNotes[option.bass]
  };
  options.push({symbol:symbol,shape:option.shape,description:descriptions[option.group]});
 });
 return options;
}
function likelyScale(symbols){
 var triads=symbols.map(chordSpec).filter(function(spec){return spec && ['','maj','m'].includes(spec.quality)});
 if(triads.length<3)return null;
 var scores=czechNotes.map(function(_,root){
  var notes=[0,2,4,5,7,9,11].map(function(interval){return (root+interval)%12});
  var matching=triads.filter(function(spec){return spec.tones.every(function(tone){return notes.includes(tone)})});
  return {root:root,notes:notes,count:matching.length};
 }).sort(function(a,b){return b.count-a.count});
 return scores[0].count>scores[1].count && scores[0].count>=triads.length*.75?scores[0]:null;
}
function harmonicOptions(spec,scale){
 if(spec.slash || !['','maj','m'].includes(spec.quality))return [];
 var major=spec.quality!=='m',fifth=czechNotes[(spec.root+7)%12];
 var candidates=major?[
  ['add9',t('Jasnější zvuk s přidanou nónou','Brighter sound with an added ninth')],
  ['maj7',t('Jemné napětí velké septimy','Soft major-seventh tension')],
  ['/'+fifth,t('Jiný bas pro plynulý přechod','Different bass for a smoother transition')],
  ['6',t('Měkčí zvuk s velkou sextou','Softer sound with a major sixth')],
  ['sus2',t('Otevřený zvuk bez tercie','Open sound without the third')],
  ['sus4',t('Průchod s napětím kvarty','Suspended fourth for a passing chord')]
 ]:[
  ['m7',t('Měkčí mollový doprovod','Softer minor accompaniment')],
  ['madd9',t('Moll s doznívající nónou','Minor with a ringing ninth')],
  ['/'+fifth,t('Jiný bas pro plynulý přechod','Different bass for a smoother transition')]
 ];
 if(major && scale){
  var degree=(spec.root-scale.root+12)%12;
  var priorities={5:['sus2','maj7','6'],7:['sus4','add9','/'+fifth]}[degree];
  if(priorities)candidates.sort(function(a,b){
   var rank=function(entry){var index=priorities.indexOf(entry[0]);return index<0?priorities.length:index};
   return rank(a)-rank(b);
  });
 }
 var playable=[];
 candidates.some(function(candidate){
  var suffix=candidate[0],symbol=spec.name+(suffix[0]==='/'?spec.quality:'')+suffix;
  var variation=chordSpec(symbol);
  if(scale && !variation.tones.every(function(tone){return scale.notes.includes(tone)}))return false;
  if(!scale && suffix==='maj7')return false;
  var shape=guitarShape(symbol);
  if(shape)playable.push({symbol:symbol,shape:shape,description:candidate[1]});
  return playable.length===3;
 });
 return playable;
}
function chartCard(symbol,shape,description){
 var card=make('div',undefined,'chart');
 card.appendChild(make('b',symbol));
 if(shape){
  card.appendChild(guitarDiagram(shape));
  card.appendChild(make('small',shape.map(function(n){return n<0?'×':n}).join(' ')));
 }else card.appendChild(make('small',t('Hmat neurčen','Unknown shape')));
 if(description)card.appendChild(make('p',description));
 return card;
}
var chartSymbols=[], selectedChart='', chartMode='basic';
function showCharts(){
 var box=el('charts');
 clear(box);
 if(!el('chart-dialog').open || !chartSymbols.length)return;
 var picker=make('div',undefined,'chart-picker');
 var modes=make('div',undefined,'chart-modes');
 var panel=make('div',undefined,'chart-options');
 box.appendChild(picker);box.appendChild(modes);box.appendChild(panel);
 if(chartSymbols.indexOf(selectedChart)<0)selectedChart=chartSymbols[0];
 function draw(){
  var spec=chordSpec(selectedChart),shape=guitarShape(selectedChart);
  var modesAvailable=[
   ['basic',t('Základní hmat','Basic shape')],
   ['other',t('Další hmaty','Other shapes')],
   ['variation',t('Obměny akordu','Chord variations')]
  ].filter(function(mode){
   return mode[0]==='basic'||(spec&&(mode[0]==='other'||(!spec.slash&&['','maj','m'].includes(spec.quality))));
  });
  if(!modesAvailable.some(function(mode){return mode[0]===chartMode}))chartMode='basic';
  clear(modes);clear(panel);explanation.textContent='';
  modesAvailable.forEach(function(mode){
   var b=make('button',mode[1]);b.setAttribute('aria-pressed',String(chartMode===mode[0]));
   b.onclick=function(){chartMode=mode[0];draw();modes.querySelector('[aria-pressed=true]').focus({preventScroll:true})};
   modes.appendChild(b);
  });
  if(chartMode==='basic'){panel.appendChild(chartCard(selectedChart,shape));return}
  var other=chartMode==='other';
  explanation.textContent=other?t('Stejný akord v jiné poloze na hmatníku.','The same chord elsewhere on the fretboard.'):t('Jiný souzvuk k vyzkoušení. Zápis skladby zůstává stejný.','Try a different sound. The written arrangement stays the same.');
  var options=other?sameChordOptions(selectedChart,spec,shape):harmonicOptions(spec,likelyScale(chartSymbols));
  options.forEach(function(opt){panel.appendChild(chartCard(opt.symbol,opt.shape,opt.description))});
  if(!options.length)panel.appendChild(make('small',t('Další vhodný hmat nenalezen.','No suitable alternative found.')));
 }
 var explanation=make('p',undefined,'chart-explanation');
 box.insertBefore(explanation,panel);
 chartSymbols.forEach(function(symbol){
  var b=make('button',symbol);
  b.setAttribute('aria-pressed',String(selectedChart===symbol));
  b.onclick=function(){
   picker.querySelector('[aria-pressed=true]').setAttribute('aria-pressed','false');
   selectedChart=symbol;b.setAttribute('aria-pressed','true');draw();
  };
  picker.appendChild(b);
 });
 draw();
}
var chartDialog=el('chart-dialog');
el('guitar').onclick=function(){
 selectedChart=chartSymbols[0];chartMode='basic';
 chartDialog.showModal();
 document.body.classList.add('chart-open');
 showCharts();
};
el('chart-close').onclick=function(){chartDialog.close()};
chartDialog.addEventListener('close',function(){
 document.body.classList.remove('chart-open');
});
chartDialog.addEventListener('click',function(event){
 if(event.target!==chartDialog)return;
 var rect=chartDialog.getBoundingClientRect();
 if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)chartDialog.close();
});

function songLabel(value){
 if(!english || !value)return value;
 var labels={'Text s akordy':'Lyrics and chords','Text bez akordů':'Lyrics only','Akordový doprovod':'Chord accompaniment','Refrén':'Chorus','Sloka':'Verse','Mezihra':'Interlude','PDF uvádí 3. pražec, původní název souboru uvádí 2.':'The PDF specifies fret 3; the original filename specifies fret 2.','Umístění doplněných akordů ve slokách je odvozené podle předchozí sloky.':'Added verse chord positions follow the preceding verse.'};
 return labels[value] || value.replace(/^(\d+)\. sloka$/i,'Verse $1');
}
function render(){var s=current,score=el('score'),ch=[];clear(score);el('title').textContent=s.title;el('artist').textContent=s.artist;el('status').textContent=songLabel(s.note)||'';el('chords').textContent='';el('cap').textContent='';el('tools').style.display=s.cho?'flex':'none';score.style.fontSize=size+'px';el('play').hidden=!s.cho;
 if(!s.cho){el('guitar').hidden=true;if(document.body.classList.contains('playing'))playMode(false)}
 var harmonicas=['C','','D','','E','F','','G','','A','','H'];
 var sourceCapo=Number(meta(s.cho||'','capo'))||0;
 var capo=capoSetting(sourceCapo);
 var harp=typeof s.minor==='number'?harmonicas[(s.minor+shift+capo-sourceCapo+27)%12]:'';
 el('harp').textContent=harp?t('Foukací harmonika · ','Harmonica · ')+harp+t(' dur (4. poloha)',' major (4th position)'):'';
 el('harp').hidden=!harp;
 if(s.cho){if(capo>0)el('cap').textContent=t('Kapodastr · '+capo+'. pražec','Capo · fret '+capo);
 var rows=s.cho.split(/\r?\n/), verseLabel=false,sectionName='',tab=null;
 rows.forEach(function(line,i){
  var d=directive(line);
  if(d && d[1]==='image'){
   var source=/^src="(tabs\/[a-z0-9-]+\.png)"$/.exec(d[2]||'');
   if(source && s.tabImages && s.tabImages[source[1]]){
    var panel=make('details'),pic=make('img');panel.appendChild(make('summary',t('Tabulatura','Guitar tab')));
    pic.alt=t('Prstoklad z předlohy','Fingering from the source arrangement');
    pic.src='data:image/png;base64,'+s.tabImages[source[1]];pic.style.maxWidth='100%';panel.appendChild(pic);score.appendChild(panel);
   }
   return;
  }
  if(d && /^(start_of_tab|sot)$/.test(d[1])){
   var details=make('details');details.appendChild(make('summary',t('Tabulatura','Guitar tab')));
   tab=make('pre');tab.style.overflowX='auto';details.appendChild(tab);score.appendChild(details);return;
  }
  if(d && /^(end_of_tab|eot)$/.test(d[1])){tab=null;return}
  if(tab){tab.appendChild(document.createTextNode(line+'\n'));return}
  if(!line.trim()||/^\s*#/.test(line))return;
  if(d){
   var lbl={start_of_chorus:'Refrén',soc:'Refrén',start_of_verse:'Sloka',sov:'Sloka',start_of_bridge:'Mezihra'};
   if(d[1]==='comment'||d[1]==='c'||lbl[d[1]]){
    var heading=d[2]||lbl[d[1]]||'';sectionName=heading;verseLabel=/sloka|verse/i.test(heading);
    score.appendChild(make('div',songLabel(heading),'section'));
   }
   return;
  }
  var row=drawLine(line,s.lang||'en',ch),next=rows[i+1]||'';
  row.dataset.sourceLine=i;row.dataset.section=sectionName;row.tabIndex=0;
  if(verseLabel && /^\s*(?:\[[^\]]+\]\s*)+$/.test(line) && next.trim() && !/[{}\[\]]/.test(next) && !/^\s*#/.test(next)){
   row.className+=' progression';
   var lyric=make('div',next.trim(),'progression-text');lyric.dataset.sourceLine=i+1;lyric.dataset.section=sectionName;lyric.tabIndex=0;row.appendChild(lyric);
  }else if(i && score.lastChild && score.lastChild.classList.contains('progression') && /^\s*(?:\[[^\]]+\]\s*)+$/.test(rows[i-1]))return;
  // Respect stanza breaks between sung lines without detaching a chord-only line.
  if(i && !rows[i-1].trim() && score.lastChild && score.lastChild.classList.contains('line')){
   var previous=i-1;
   while(previous>=0 && !rows[previous].trim())previous--;
   function hasLyric(value){return /[A-Za-zÀ-ž]/.test(value.replace(/\[[^\]]*\]/g,''))}
   if(previous>=0 && hasLyric(rows[previous]) && hasLyric(line))row.style.marginTop='.9em';
  }
  score.appendChild(row);
 });
 groupStanzas(score);schedulePages();markReports(score);chartSymbols=ch;el('guitar').hidden=!ch.length;el('chords').textContent=ch.join(' · ');showCharts();el('pitch').textContent=pitchText(shift);el('pitch-hint').hidden=!shift;el('pitch-hint').textContent=pitchText(shift);el('small').disabled=size<=14;el('big').disabled=size>=40;el('down').disabled=shift<=-12;el('up').disabled=shift>=12}
}
var settingKinds=['capo','pitch','zoom'],songAliases=new Map();
function songKey(song){return song.id?'id:'+song.id:song.file}
function resolveSongKey(key){return songAliases.get(key)||key}
function indexSongSettings(){
 songAliases=new Map();
 // An earlier filename still identifies its original arrangement if the name is reused.
 songs.forEach(function(song){
  (song.legacyFiles||[]).forEach(function(file){songAliases.set(file,songKey(song))});
 });
 songs.forEach(function(song){
  if(!songAliases.has(song.file))songAliases.set(song.file,songKey(song));
 });
 try{
  songAliases.forEach(function(key,file){
   if(key===file)return;
   settingKinds.forEach(function(kind){
    var legacy='zpevnik.'+kind+'.'+file, target='zpevnik.'+kind+'.'+key;
    var value=localStorage.getItem(legacy);
    if(value===null)return;
    if(localStorage.getItem(target)===null)localStorage.setItem(target,value);
    localStorage.removeItem(legacy);
   });
  });
 }catch(ignore){}
}
function capoSetting(original){
 var select=el('capo-fret'),stored=get('capo.'+songKey(current),'');
 clear(select);
 function option(value,label){
  var item=make('option',label);item.value=value;select.appendChild(item);
 }
 option('',t('Dle předlohy','As written')+' ('+original+')');
 option('0',t('Bez kapodastru','No capo'));
 for(var fret=1;fret<=12;fret++)option(String(fret),String(fret));
 select.value=/^(?:[0-9]|1[0-2])$/.test(stored)?stored:'';
 return select.value===''?original:Number(select.value);
}
el('capo-fret').onchange=function(){
 try{
  var key='zpevnik.capo.'+songKey(current);
  if(this.value==='')localStorage.removeItem(key);
  else localStorage.setItem(key,this.value);
  render();
 }catch(error){
  render();el('status').textContent=t('Kapodastr se nepodařilo uložit.','Could not save the capo setting.');
 }
};
function storedPitch(){
 var value=get('pitch.'+songKey(current),null);
 return value!==null && /^-?\d+$/.test(value) && Math.abs(Number(value))<=12?Number(value):null;
}
function pitchText(n){return (n>0?'+':'')+n}
function showSongSettings(open){
 el('song-settings').hidden=!open;
 el('song-settings-button').setAttribute('aria-expanded',String(open));
}
el('song-settings-button').onclick=function(){showSongSettings(el('song-settings').hidden)};
function setPitch(value){
 var next=Math.max(-12,Math.min(12,value));
 try{
  var key='zpevnik.pitch.'+songKey(current);
  if(next===0)localStorage.removeItem(key);else localStorage.setItem(key,String(next));
 }catch(error){el('status').textContent=t('Transpozici se nepodařilo uložit.','Could not save transposition.');return}
 shift=next;render();
}
function loadSongSettings(){
 showSongSettings(false);
 shift=storedPitch()||0;
 size=Math.min(40,Math.max(14,Number(get('zoom.'+songKey(current),get('text','21')))||21));
}
var pages=[],pageTail,layoutFrame=0;
function pageState(){
 if(!document.body.classList.contains('playing'))return;
 var area=el('score'),position=area.scrollTop;
 var page=!scrollFrame && pages.find(function(page){return Math.abs(Math.floor(page.start)-position)<.5});
 var gap=page?Math.max(0,area.clientHeight-(page.end-position)):0;
 var frame=el('score-frame');
 frame.style.setProperty('--page-gap',gap+'px');
 frame.style.setProperty('--page-top-gap',(page?Math.max(0,page.start-position):0)+'px');
 el('prev-page').disabled=position<=0;
 el('next-page').disabled=!pages.length || position>=Math.floor(pages[pages.length-1].start)-.5;
}
function scoreBreaks(area){
 var origin=area.getBoundingClientRect().top-area.scrollTop;
 var breaks=[0],keepHeading=false;
 area.querySelectorAll('.stanza-block > *').forEach(function(row,index){
  var top=row.getBoundingClientRect().top-origin;
  if(index && !keepHeading)breaks.push(top);
  keepHeading=row.classList.contains('section');
  if(!row.classList.contains('line'))return;
  // Inline-block words keep a chord with its lyric. Words in the same visual
  // row can have different heights, so combine their overlapping rectangles.
  var bands=[];
  row.querySelectorAll(':scope > .word').forEach(function(word){
   var rect=word.getBoundingClientRect(),last=bands[bands.length-1];
   if(last && rect.top<last.bottom-.5){
    last.top=Math.min(last.top,rect.top);last.bottom=Math.max(last.bottom,rect.bottom);
   }else bands.push({top:rect.top,bottom:rect.bottom});
  });
  bands.slice(1).forEach(function(band){breaks.push(band.top-origin)});
  var lyric=row.querySelector('.progression-text');
  if(lyric){
   // Keep the opening lyric with the progression. Later wraps can start a page.
   var range=document.createRange();range.selectNodeContents(lyric);
   var leading=(parseFloat(getComputedStyle(lyric).lineHeight)-parseFloat(getComputedStyle(lyric).fontSize))/2;
   Array.from(range.getClientRects()).slice(1).forEach(function(rect){breaks.push(rect.top-origin-leading)});
  }
 });
 return Array.from(new Set(breaks)).sort(function(a,b){return a-b});
}
function measurePages(){
 layoutFrame=0;
 if(!document.body.classList.contains('playing'))return;
 var area=el('score'),position=area.scrollTop,height=area.clientHeight;
 if(!height)return;
 var wasPaged=pages.some(function(page){return Math.abs(Math.floor(page.start)-position)<.5});
 if(pageTail)pageTail.remove();
 var breaks=scoreBreaks(area),end=area.scrollHeight,index=0,start=0;
 pages=[];
 // Fit as many visual rows as possible. An oversized item such as a tab image
 // gets consecutive viewports with overlap so its entire content is reachable.
 while(Math.floor(start)+height<end){
  var limit=Math.floor(start)+height;
  while(index+1<breaks.length && breaks[index+1]<=limit)index++;
  var fits=Math.floor(breaks[index])>Math.floor(start);
  var boundary=fits?breaks[index]:limit;
  pages.push({start:start,end:boundary});
  var overlap=Math.min(24,Math.floor(height/4));
  start=fits?boundary:boundary-overlap;
 }
 pages.push({start:start,end:end});
 pageTail=make('div');
 pageTail.setAttribute('aria-hidden','true');
 pageTail.style.height=Math.max(0,Math.ceil(start)+height-end)+'px';
 area.appendChild(pageTail);
 el('score-frame').style.setProperty('--score-scrollbar',(area.offsetWidth-area.clientWidth)+'px');
 if(wasPaged){
  var containing=pages.find(function(page,i){return !pages[i+1] || Math.floor(pages[i+1].start)>position});
  area.scrollTop=Math.floor(containing.start);
 }else area.scrollTop=position;
 pageState();
}
function schedulePages(){
 if(document.body.classList.contains('playing') && !layoutFrame)layoutFrame=requestAnimationFrame(measurePages);
}
var scrollFrame=0, previousTick=0, scrollRemainder=0, touchingScore=false, resumeAfter=0;
var scrollArea=el('score');
function configureSlider(id,unit,onChange){
 var input=el(id),output=document.querySelector('output[for="'+id+'"]');
 input.value=get(id,input.value);
 function update(){
  output.textContent=input.value+' '+unit;
  if(onChange)onChange(Number(input.value));
 }
 input.oninput=function(){update();save(id,input.value)};
 update();
}
configureSlider('scroll-speed','px/s');
configureSlider('beat-tempo','BPM',function(bpm){el('beat').style.setProperty('--beat-period',(60000/bpm)+'ms')});
function setAutoScroll(on){
 cancelAnimationFrame(scrollFrame);
 previousTick=0;scrollRemainder=0;resumeAfter=0;
 scrollFrame=on?requestAnimationFrame(scrollTick):0;
 el('auto-scroll').setAttribute('aria-pressed',String(on));
 pageState();
}
function scrollTick(now){
 var elapsed=previousTick?Math.min(80,now-previousTick):0;
 previousTick=now;
 if(!touchingScore && now>=resumeAfter && !selectedLine && !document.hidden){
  resumeAfter=0;
  var bottom=scrollArea.scrollHeight-(pageTail?pageTail.offsetHeight:0)-scrollArea.clientHeight;
  if(scrollArea.scrollTop>=bottom-0.5){setAutoScroll(false);return}
  scrollRemainder+=Number(el('scroll-speed').value)*elapsed/1000;
  var step=Math.floor(scrollRemainder);
  if(step){scrollArea.scrollTop=Math.min(bottom,scrollArea.scrollTop+step);scrollRemainder-=step}
 }
 scrollFrame=requestAnimationFrame(scrollTick);
}
function yieldToScroll(){if(scrollFrame)resumeAfter=performance.now()+700}
scrollArea.addEventListener('touchstart',function(){touchingScore=true;yieldToScroll()},{passive:true});
function releaseTouch(e){touchingScore=e.touches.length>0;yieldToScroll()}
scrollArea.addEventListener('touchend',releaseTouch);
scrollArea.addEventListener('touchcancel',releaseTouch);
scrollArea.addEventListener('wheel',yieldToScroll,{passive:true});
scrollArea.addEventListener('scroll',function(){if(resumeAfter)yieldToScroll()});
function setMetronome(on){
 el('metronome').setAttribute('aria-pressed',String(on));
 el('beat').hidden=!on;
}
el('auto-scroll').onclick=function(){setAutoScroll(!scrollFrame)};
el('metronome').onclick=function(){setMetronome(el('beat').hidden)};
el('play-controls-toggle').onclick=function(){
 var controls=el('play-controls');
 controls.hidden=!controls.hidden;
 this.setAttribute('aria-expanded',String(!controls.hidden));
 schedulePages();
};
function playMode(on){
 if(!on){
  setAutoScroll(false);setMetronome(false);touchingScore=false;
  el('play-controls').hidden=true;el('play-controls-toggle').setAttribute('aria-expanded','false');
 }
 document.body.classList.toggle('playing',on);
 el('play').setAttribute('aria-pressed',String(on));
 el('play').textContent=on?t('Zavřít hraní','Exit play mode'):t('Režim hraní','Play mode');
 el('score').scrollTop=0;
 pages=[];
 if(on){schedulePages();el('exit-play').focus()}
 else if(pageTail){pageTail.remove();pageTail=null}
 el('playing-title').textContent=current.title;
 window.scrollTo(0,0);
}
el('play').onclick=function(){playMode(!document.body.classList.contains('playing'))};
el('exit-play').onclick=function(){playMode(false);el('play').focus()};
function turnPage(direction){
 yieldToScroll();
 var area=el('score');
 if(layoutFrame){cancelAnimationFrame(layoutFrame);measurePages()}
 var position=area.scrollTop,ordered=direction>0?pages:pages.slice().reverse();
 var target=ordered.find(function(page){return (Math.floor(page.start)-position)*direction>.5});
 if(target)area.scrollTop=Math.floor(target.start);
 pageState();
}
el('score').addEventListener('scroll',pageState);
el('score').addEventListener('toggle',schedulePages,true);
el('score').addEventListener('load',schedulePages,true);
window.addEventListener('resize',function(){
 if(layoutFrame)cancelAnimationFrame(layoutFrame);
 measurePages();
});
if(window.ResizeObserver)new ResizeObserver(schedulePages).observe(el('score-frame'));
el('prev-page').onclick=function(){turnPage(-1)};
el('next-page').onclick=function(){turnPage(1)};
function groupStanzas(score){
 var nodes=Array.prototype.slice.call(score.children),group=null,number=0;
 nodes.forEach(function(row){
  if(!group||row.classList.contains('section')||row.style.marginTop){
   group=make('div',undefined,'stanza-block');group.dataset.block=++number;score.appendChild(group);
  }
  group.appendChild(row);
 });
}
var notePrefix='zpevnik.line-note.',selectedLine=null,triggerRow=null;
function openReport(row){
 if(!row)return;
 var index=Number(row.dataset.sourceLine),lines=current.cho.split(/\r?\n/);
 selectedLine={song:current.title,artist:current.artist,file:current.file,id:current.id,revision:current.revision||1,
  libraryVersion:libraryVersion,line:index+1,section:row.dataset.section||'',block:Number(row.closest('.stanza-block').dataset.block),source:lines[index],displayShift:shift};
 triggerRow=row;
 el('report-context').textContent=[current.title,selectedLine.section||t('Blok ','Block ')+selectedLine.block,t('řádek ','line ')+(index+1)].filter(Boolean).join(' · ');
 el('report-text').textContent=lines[index];el('report-detail').value='';el('report-error').textContent='';
 el('report-overlay').hidden=false;el('report-kind').focus();
}
function closeReport(){
 el('report-overlay').hidden=true;selectedLine=null;
 if(triggerRow){triggerRow.focus();triggerRow=null}
}
el('report-cancel').onclick=closeReport;
el('report-form').onsubmit=function(event){
 event.preventDefault();if(!selectedLine)return;
 var record=selectedLine;record.type=el('report-kind').value;record.detail=el('report-detail').value;record.created=new Date().toISOString();
 try{localStorage.setItem(notePrefix+Date.now()+'.'+Math.random().toString(36).slice(2),JSON.stringify(record))}
 catch(error){el('report-error').textContent=t('Připomínku se nepodařilo uložit.','Could not save this report.');return}
 triggerRow.classList.add('reported');closeReport();reportCount();
};
function reports(){
 var items=[];
 for(var i=0;i<localStorage.length;i++){
  var key=localStorage.key(i);
  if(!key || key.indexOf(notePrefix)!==0)continue;
  var record=JSON.parse(localStorage.getItem(key));
  var resolved=resolveSongKey(record.file);
  if(!record.id && resolved && resolved.indexOf('id:')===0){
   record.id=resolved.slice(3);
   try{localStorage.setItem(key,JSON.stringify(record))}catch(ignore){}
  }
  items.push(record);
 }
 return items.sort(function(a,b){return a.created.localeCompare(b.created)});
}
function markReports(score){
 try{
  reports().forEach(function(r){
   if((r.id?'id:'+r.id:resolveSongKey(r.file))!==songKey(current) || r.revision!==(current.revision||1) || !Number.isInteger(r.line))return;
   var row=score.querySelector('[data-source-line="'+(r.line-1)+'"]');
   if(row)row.classList.add('reported');
  });
 }catch(ignore){}
}
function reportCount(){
 var button=el('export-notes');
 try{var n=reports().length;button.disabled=!n;button.textContent=t('Export připomínek','Export reports')+' ('+n+')'}
 catch(error){button.disabled=true}
}
function downloadJson(filename,data){
 var url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 var link=make('a');link.download=filename;link.href=url;document.body.appendChild(link);link.click();link.remove();
 setTimeout(function(){URL.revokeObjectURL(url)},30000);
}
el('export-notes').onclick=function(){downloadJson('songbook-reports.json',reports())};
function settingsMessage(message){
 var status=el('settings-status');status.hidden=false;status.textContent=message;
}
function validSetting(kind,n){
 return typeof n==='number' && Math.floor(n)===n && (kind==='zoom'?n>=14 && n<=40:n<=12 && n>=(kind==='pitch'?-12:0));
}
el('export-settings').onclick=function(){
 try{
  var entries=Object.create(null);
  for(var i=0;i<localStorage.length;i++){
   var key=localStorage.key(i),match=/^zpevnik\.(capo|pitch|zoom)\.(.+)$/.exec(key);
   if(!match)continue;
   var raw=localStorage.getItem(key),n=Number(raw);
   if(raw!==String(n)||!validSetting(match[1],n))throw Error();
   var file=resolveSongKey(match[2]);
   if(!entries[file])entries[file]={};
   entries[file][match[1]]=n;
  }
  downloadJson('songbook-settings.json',{format:'kk-songbook-settings',version:2,songs:entries});
  settingsMessage(t('Exportováno skladeb: ','Songs exported: ')+Object.keys(entries).length);
 }catch(error){settingsMessage(t('Nastavení se nepodařilo exportovat.','Could not export settings.'))}
};
function importSettings(data){
 if(!data || data.format!=='kk-songbook-settings' || [1,2].indexOf(data.version)<0 || !data.songs ||
    typeof data.songs!=='object' || Array.isArray(data.songs))throw Error();
 var files=Object.keys(data.songs),changes=new Map();
 files.forEach(function(file){
  var entry=data.songs[file];
  if(!file || !entry || typeof entry!=='object' || Array.isArray(entry) || !Object.keys(entry).length)throw Error();
  Object.keys(entry).forEach(function(kind){
   if((kind!=='pitch' && kind!=='capo' && kind!=='zoom') || !validSetting(kind,entry[kind]))throw Error();
   var resolved=resolveSongKey(file),key='zpevnik.'+kind+'.'+resolved;
   if(file===resolved || !changes.has(key)){
    changes.set(key,{key:key,value:String(entry[kind]),previous:localStorage.getItem(key)});
   }
  });
 });
 changes=Array.from(changes.values());
 var written=0;
 try{
  for(;written<changes.length;written++)localStorage.setItem(changes[written].key,changes[written].value);
 }catch(error){
  while(written){
   var old=changes[--written];
   if(old.previous===null)localStorage.removeItem(old.key);else localStorage.setItem(old.key,old.previous);
  }
  throw error;
 }
 var active=songKey(current);
 if(settingKinds.some(function(kind){return changes.some(function(change){return change.key==='zpevnik.'+kind+'.'+active})})){
  shift=storedPitch()||0;
  size=Math.min(40,Math.max(14,Number(get('zoom.'+active,get('text','21')))||21));
  render();
 }
 return files.length;
}
el('import-settings').onclick=function(){el('settings-file').click()};
el('settings-file').onchange=function(){
 var file=this.files[0];if(!file)return;
 this.value='';
 var reader=new FileReader();
 function failed(){settingsMessage(t('Import se nezdařil. Vyber soubor s exportovaným nastavením skladeb.','Import failed. Choose a song settings backup.'))}
 reader.onload=function(){
  try{var count=importSettings(JSON.parse(reader.result));settingsMessage(t('Importováno skladeb: ','Songs imported: ')+count)}
  catch(error){failed()}
 };
 reader.onerror=failed;reader.readAsText(file);
};
function reportRow(target){
 var row=target.closest('.line');if(!row)return null;
 if(target.closest('.progression-text'))return target.closest('.progression-text');
 return row;
}
var holdTimer,holdX,holdY;
function cancelHold(){clearTimeout(holdTimer)}
function startHold(e){
 cancelHold();var r=reportRow(e.target);if(!r)return;
 var point=e.touches?e.touches[0]:e;holdX=point.clientX;holdY=point.clientY;
 holdTimer=setTimeout(function(){openReport(r)},550);
}
var scoreBox=el('score');
scoreBox.addEventListener('touchstart',startHold);
scoreBox.addEventListener('touchmove',function(e){var p=e.touches[0];if(Math.abs(p.clientX-holdX)+Math.abs(p.clientY-holdY)>12)cancelHold()});
['touchend','touchcancel'].forEach(function(type){scoreBox.addEventListener(type,cancelHold)});
scoreBox.oncontextmenu=function(e){var r=reportRow(e.target);if(r){e.preventDefault();cancelHold();if(!selectedLine)openReport(r)}};
scoreBox.onkeydown=function(e){if(e.key==='Enter'){var r=reportRow(e.target);if(r){e.preventDefault();openReport(r)}}};
document.addEventListener('keydown',function(e){
 if(selectedLine){
  if(e.key==='Escape'){closeReport();return}
  if(e.key==='Tab'){
   var first=el('report-kind'),last=el('report-cancel');
   if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus()}
   if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus()}
  }
  return;
 }
 if(!document.body.classList.contains('playing'))return;
 if(e.key==='Escape')playMode(false);
 if(['PageDown','PageUp','ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].indexOf(e.key)>=0){e.preventDefault();turnPage(['PageDown','ArrowRight','ArrowDown'].indexOf(e.key)>=0?1:-1)}
});

el('search').oninput=list;
function saveZoom(){
 save('text',size);save('zoom.'+songKey(current),size);
}
function resize(d){size=Math.max(14,Math.min(40,size+d));saveZoom();render()}
var pinch=null;
function fingerDistance(points){
 var x=points[0].clientX-points[1].clientX,y=points[0].clientY-points[1].clientY;
 return Math.sqrt(x*x+y*y);
}
scoreBox.addEventListener('touchstart',function(e){
 if(e.touches.length!==2)return;
 cancelHold();var distance=fingerDistance(e.touches);
 if(distance>0){pinch={distance:distance,size:size};e.preventDefault()}
},{passive:false});
scoreBox.addEventListener('touchmove',function(e){
 if(!pinch||e.touches.length!==2)return;
 e.preventDefault();size=Math.max(14,Math.min(40,Math.round(pinch.size*fingerDistance(e.touches)/pinch.distance)));
 scoreBox.style.fontSize=size+'px';schedulePages();
},{passive:false});
function endPinch(e){
 if(pinch && e.touches.length<2){pinch=null;saveZoom();el('small').disabled=size<=14;el('big').disabled=size>=40;schedulePages()}
}
scoreBox.addEventListener('touchend',endPinch);
scoreBox.addEventListener('touchcancel',endPinch);
el('small').onclick=function(){resize(-2)};el('big').onclick=function(){resize(2)};
el('up').onclick=function(){setPitch(shift+1)};el('down').onclick=function(){setPitch(shift-1)};el('pitch').onclick=function(){setPitch(0)};
var cacheKey='zpevnik.library.v1';
function validateLibrary(data){
 if(!data || data.schema!==1 || typeof data.version!=='number' || data.version<1 ||
    data.version%1!==0 || !Array.isArray(data.songs) || !Array.isArray(data.catalog))throw Error('format');
 if(!data.songs.every(function(s){return s && typeof s.title==='string' && typeof s.artist==='string' &&
    typeof s.file==='string' && s.file.length>0 &&
    (s.id===undefined || (typeof s.id==='string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(s.id))) &&
    (s.legacyFiles===undefined || (Array.isArray(s.legacyFiles) &&
     s.legacyFiles.every(function(file){return typeof file==='string' && file.length>0}))) && typeof s.cho==='string' && s.cho.length>0 &&
    (!s.changes || (Array.isArray(s.changes) && s.changes.every(function(c){
     return c && typeof c.author==='string' && typeof c.revision==='number' && isFinite(Date.parse(c.date));
    })))}) ||
    new Set(data.songs.map(songKey)).size!==data.songs.length ||
    new Set(data.songs.map(function(s){return s.file})).size!==data.songs.length ||
    !data.catalog.every(function(r){return r && typeof r.name==='string'}))throw Error('format');
}
function useLibrary(data){
 var known=new Map(songs.map(function(song){return [song.file,song]}));
 songs=data.songs.map(function(song){
  var previous=known.get(song.file);
  if(song.id || !previous || !previous.id)return song;
  return Object.assign({},song,{id:previous.id,legacyFiles:previous.legacyFiles});
 });
 catalog=data.catalog;libraryVersion=data.version;
 sortLibrary();indexSongSettings();
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
 var selected=songKey(current);
 useLibrary(data);
 current=songs.find(function(s){return songKey(s)===resolveSongKey(selected) && visible(s)}) || songs.find(visible) || noSong;
 loadSongSettings();list();render();el('update-fallback').hidden=true;
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

indexSongSettings();translatePage();theme();
el('search').value=libraryView.query;
current=songs.filter(function(song){return visible(song)&&songKey(song)===resolveSongKey(libraryView.file)})[0] ||
 songs.filter(function(song){return visible(song)&&song.title==='Runaway'})[0] || songs.find(visible) || noSong;
loadSongSettings();
document.body.classList.toggle('browse',!!libraryView.browse);
el('toggle').setAttribute('aria-expanded',String(!!libraryView.browse));
list();render();el('list').scrollTop=libraryView.top||0;
if(libraryView.browse)window.scrollTo(0,libraryView.page||0);
})();
