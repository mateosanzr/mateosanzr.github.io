/* ===== tormenta (live a/v) =====
   Indietrónica en directo a partir de una noche de tormenta.
   La imagen manda: el vídeo recorre los tramos con relámpagos y cada destello del material dispara la música
   (acento, golpe, cambio de acorde, tartamudeo). Debajo, una superficie (intensidad ↔ / tormenta ↕), un botón de rayo
   y el volumen. Todo el material es de esa noche: vídeos, fotos y el sonido de la lluvia. */
(function(){
var BASE=(document.currentScript&&document.currentScript.src||'tormenta/tormenta.js').replace(/tormenta\.js[^\/]*$/,'');
var DAT=null,ac=null,on=false,L,cv,cx,vA,vB,onB,tocar,pad,dot,bolt,volI,osc,ox;
var M={x:.18,y:.45};          /* intensidad, tormenta */
var VOL=.8;

/* ---------- interfaz ---------- */
function monta(){
 var css=document.createElement('style');css.textContent=
 '#torm{position:fixed;top:0;bottom:0;left:16px;right:16px;z-index:46;background:var(--papel);display:flex;flex-direction:column}'+
 '#torm[hidden]{display:none}'+
 '#torm .vh{display:flex;justify-content:space-between;align-items:baseline;gap:6px 14px;padding:14px 0 10px;border-bottom:1px solid var(--linea);margin-bottom:8px;color:var(--gris)}'+
 '#torm .vh b{font-weight:400;color:var(--tinta)}#torm button{color:var(--gris)}#torm button:hover{color:var(--tinta)}'+
 '#torm .escena{position:relative;flex:1;min-height:160px}'+
 '#torm canvas.cv{position:absolute;inset:0;width:100%;height:100%;display:block}'+
 '#torm .tocar{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--gris);font-style:italic}'+
 '#torm .tocar[hidden]{display:none}'+
 '#torm .ctl{display:flex;align-items:center;justify-content:center;gap:22px;padding:12px 0 16px}'+
 '#torm .pad{position:relative;width:132px;height:99px;border:1px solid var(--linea);touch-action:none;cursor:crosshair}'+
 '#torm .pad i{position:absolute;width:9px;height:9px;margin:-5px 0 0 -5px;border-radius:50%;background:var(--tinta)}'+
 '#torm .pad::before,#torm .pad::after{content:"";position:absolute;background:var(--linea)}'+
 '#torm .pad::before{left:50%;top:0;bottom:0;width:1px}#torm .pad::after{top:50%;left:0;right:0;height:1px}'+
 '#torm .rayo{width:46px;height:46px;border:1px solid var(--linea);border-radius:50%;font-size:20px;line-height:1}'+
 '#torm .rayo.ya{background:var(--tinta);color:var(--papel)}'+
 '#torm .vol{width:8px;height:99px;border:1px solid var(--linea);position:relative;touch-action:none;cursor:ns-resize}'+
 '#torm .vol i{position:absolute;left:0;right:0;bottom:0;background:var(--tinta)}'+
 '#torm canvas.osc{width:72px;height:54px;border:1px solid var(--linea)}'+
 '@media(max-width:820px){#torm{left:0;right:0;padding:env(safe-area-inset-top,0px) 16px 0}#torm .ctl{gap:14px}#torm .pad{width:110px;height:82px}#torm canvas.osc{display:none}}';
 document.head.appendChild(css);
 L=document.createElement('div');L.id='torm';L.hidden=true;
 L.innerHTML='<div class="vh"><b>tormenta</b><span><button class="on">(empezar)</button> &nbsp; <button class="x">(cerrar)</button></span></div>'+
  '<div class="escena"><canvas class="cv"></canvas><div class="tocar">(tocar para empezar)</div></div>'+
  '<div class="ctl"><div class="pad" title=""><i></i></div><button class="rayo" aria-label="rayo">ϟ</button><div class="vol"><i></i></div><canvas class="osc" width="144" height="108"></canvas></div>';
 document.body.appendChild(L);
 cv=L.querySelector('canvas.cv');cx=cv.getContext('2d');onB=L.querySelector('.on');tocar=L.querySelector('.tocar');
 pad=L.querySelector('.pad');dot=pad.querySelector('i');bolt=L.querySelector('.rayo');volI=L.querySelector('.vol i');
 osc=L.querySelector('canvas.osc');ox=osc.getContext('2d');
 vA=document.createElement('video');vB=document.createElement('video');
 [vA,vB].forEach(function(v){v.muted=true;v.playsInline=true;v.preload='auto';v.crossOrigin='anonymous'});
 onB.onclick=function(){on?apaga():enciende()};tocar.onclick=enciende;
 L.querySelector('.x').onclick=cierra;
 bolt.onclick=function(){if(!on)enciende();rayo(1,true)};
 arrastra(pad,function(px,py){M.x=px;M.y=1-py;pinta()});
 arrastra(L.querySelector('.vol'),function(px,py){VOL=1-py;pinta();if(G.out)G.out.gain.setTargetAtTime(VOL,ac.currentTime,.05)});
 document.addEventListener('keydown',function(e){if(L.hidden)return;if(e.key==='Escape'){cierra();e.stopImmediatePropagation()}if(e.key===' '){rayo(1,true);e.preventDefault()}},true);
 cv.addEventListener('pointerdown',function(){if(on)rayo(.8,true)});
 pinta();
}
function arrastra(el,fn){var down=false;function mv(e){var r=el.getBoundingClientRect();fn(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)))}
 el.addEventListener('pointerdown',function(e){down=true;el.setPointerCapture(e.pointerId);mv(e)});el.addEventListener('pointermove',function(e){if(down)mv(e)});
 el.addEventListener('pointerup',function(){down=false});el.addEventListener('pointercancel',function(){down=false})}
function pinta(){dot.style.left=(M.x*100)+'%';dot.style.top=((1-M.y)*100)+'%';volI.style.height=(VOL*100)+'%'}

/* ---------- material ---------- */
var FOT={},GR=[];
function carga(cb){if(DAT){cb&&cb();return}
 fetch(BASE+'datos.json').then(function(r){return r.json()}).then(function(d){DAT=d;
  GR=d.grupos;d.fotos.forEach(function(f,i){if(i%2===0)foto(f)});cb&&cb()})}
function foto(f){if(FOT[f])return FOT[f];var im=new Image();im.crossOrigin='anonymous';im.src=BASE+'f/'+f+'.jpg';FOT[f]=im;return im}

/* ---------- audio ---------- */
var G={},T={step:0,next:0,bar:0,chord:0},BPM=96,SPB=60/BPM/4;
/* re mayor triste: Bm7 – Gmaj7 – D(add9) – A(add9)  y una vuelta alternativa */
var PROG=[[47,54,57,62,66],[43,50,54,59,62],[38,50,54,57,64],[45,52,57,61,64]];
var PROG2=[[47,54,57,62,64],[40,52,55,59,62],[43,50,57,59,66],[45,52,57,59,64]];
var ESC=[62,64,66,69,71,74,76,78,81,83];
function mtof(m){return 440*Math.pow(2,(m-69)/12)}
function init(){
 ac=new (window.AudioContext||window.webkitAudioContext)();
 var t=ac.currentTime;
 G.out=ac.createGain();G.out.gain.value=VOL;
 var comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=3.5;comp.attack.value=.004;comp.release.value=.18;
 G.ana=ac.createAnalyser();G.ana.fftSize=1024;
 G.out.connect(comp);comp.connect(G.ana);G.ana.connect(ac.destination);
 G.mix=ac.createGain();G.mix.connect(G.out);
 /* reverb grande + delay con filtro */
 G.rev=ac.createConvolver();G.rev.buffer=ir(3.8,2.2);var rg=ac.createGain();rg.gain.value=.55;G.rev.connect(rg);rg.connect(G.mix);
 G.dl=ac.createDelay(2);G.dl.delayTime.value=SPB*3;var fb=ac.createGain();fb.gain.value=.38;var dlf=ac.createBiquadFilter();dlf.type='lowpass';dlf.frequency.value=2600;
 G.dl.connect(dlf);dlf.connect(fb);fb.connect(G.dl);var dg=ac.createGain();dg.gain.value=.5;dlf.connect(dg);dg.connect(G.mix);dg.connect(G.rev);
 /* bus de música que se agacha con el bombo */
 G.duck=ac.createGain();G.duck.connect(G.mix);
 G.padF=ac.createBiquadFilter();G.padF.type='lowpass';G.padF.frequency.value=900;G.padF.Q.value=.7;G.padG=ac.createGain();G.padG.gain.value=.0;
 G.padF.connect(G.padG);G.padG.connect(G.duck);G.padG.connect(G.rev);
 G.drum=ac.createGain();G.drum.gain.value=.9;G.drum.connect(G.mix);
 G.crush=bitcrush();G.crushG=ac.createGain();G.crushG.gain.value=0;G.crush.connect(G.crushG);G.crushG.connect(G.mix);
 /* lluvia: el sonido real de esa noche */
 G.rain=ac.createGain();G.rain.gain.value=0;G.rainF=ac.createBiquadFilter();G.rainF.type='lowpass';G.rainF.frequency.value=2200;
 G.rainF.connect(G.rain);G.rain.connect(G.out);G.rain.connect(G.rev);
 G.au=new Audio();G.au.crossOrigin='anonymous';G.au.loop=false;var src=ac.createMediaElementSource(G.au);src.connect(G.rainF);
 var ai=0;function sig(){G.au.src=BASE+'a/'+DAT.audios[ai%DAT.audios.length]+'.m4a';ai++;G.au.play().catch(function(){})}G.au.onended=sig;sig();
 /* susurros: ruido por formantes */
 G.noise=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);var nd=G.noise.getChannelData(0);for(var i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
 G.wh=ac.createGain();G.wh.gain.value=0;var ns=ac.createBufferSource();ns.buffer=G.noise;ns.loop=true;ns.start();
 [[750,9,.6],[1180,10,.4],[2600,14,.25]].forEach(function(f){var b=ac.createBiquadFilter();b.type='bandpass';b.frequency.value=f[0];b.Q.value=f[1];var g=ac.createGain();g.gain.value=f[2];ns.connect(b);b.connect(g);g.connect(G.wh)});
 G.wh.connect(G.duck);G.wh.connect(G.rev);
 T.next=ac.currentTime+.08;
}
function ir(dur,dec){var n=ac.sampleRate*dur,b=ac.createBuffer(2,n,ac.sampleRate);for(var c=0;c<2;c++){var d=b.getChannelData(c);for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,dec)}return b}
function bitcrush(){var ws=ac.createWaveShaper(),c=new Float32Array(4096);for(var i=0;i<4096;i++){var x=i/2048-1;c[i]=Math.round(x*6)/6}ws.curve=c;return ws}
function env(g,t,a,p,r,v){g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.setTargetAtTime(0.0001,t+a+p,r)}

/* pad: dos sierras desafinadas por nota, cambian con el acorde */
var PADV=[];
function padChord(ch,t){PADV.forEach(function(o){o.g.gain.setTargetAtTime(0,t,.8);o.a.stop(t+4);o.b.stop(t+4)});PADV=[];
 ch.forEach(function(m,k){var a=ac.createOscillator(),b=ac.createOscillator(),g=ac.createGain();a.type='sawtooth';b.type='sawtooth';
  a.frequency.value=mtof(m+12*(k===0?0:0));b.frequency.value=mtof(m)*1.006;a.detune.value=-7;g.gain.value=0;
  a.connect(g);b.connect(g);g.connect(G.padF);a.start(t);b.start(t);g.gain.setTargetAtTime(k===0?.05:.035,t,.9);PADV.push({a:a,b:b,g:g})})}
/* campanita FM (la melodía twee) */
function bell(m,t,v,dur){var c=ac.createOscillator(),md=ac.createOscillator(),mg=ac.createGain(),g=ac.createGain(),pan=ac.createStereoPanner?ac.createStereoPanner():null;
 c.frequency.value=mtof(m);md.frequency.value=mtof(m)*3.5;mg.gain.setValueAtTime(mtof(m)*2.2,t);mg.gain.exponentialRampToValueAtTime(1,t+.6);
 md.connect(mg);mg.connect(c.frequency);c.connect(g);if(pan){pan.pan.value=Math.random()*1.2-.6;g.connect(pan);pan.connect(G.duck);pan.connect(G.dl)}else{g.connect(G.duck);g.connect(G.dl)}
 env(g,t,.004,.02,dur||.5,v);c.start(t);md.start(t);c.stop(t+3);md.stop(t+3)}
/* bajo cuadrado que «chapotea» */
function bass(m,t,v,len){var o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o.type='square';o.frequency.value=mtof(m);
 f.type='lowpass';f.Q.value=11;var top=500+2400*M.x;f.frequency.setValueAtTime(top,t);f.frequency.exponentialRampToValueAtTime(140,t+.18);
 o.connect(f);f.connect(g);g.connect(G.duck);if(M.y>.7)g.connect(G.crush);env(g,t,.005,len*.6,.06,v);o.start(t);o.stop(t+len+.4)}
function kick(t,v){var o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(44,t+.12);
 o.connect(g);g.connect(G.drum);env(g,t,.002,.04,.12,v);o.start(t);o.stop(t+.6);
 G.duck.gain.cancelScheduledValues(t);G.duck.gain.setValueAtTime(.35,t);G.duck.gain.setTargetAtTime(1,t+.02,.09)}
function noiseHit(t,v,type,f,q,d,dest){var s=ac.createBufferSource();s.buffer=G.noise;var b=ac.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q||.7;var g=ac.createGain();
 s.connect(b);b.connect(g);g.connect(dest||G.drum);env(g,t,.001,.005,d,v);s.start(t,Math.random()*1.5);s.stop(t+d*6+.1);return g}
function snare(t,v){noiseHit(t,v*.8,'bandpass',1900,.8,.07);var g=noiseHit(t,v*.25,'highpass',3000,.5,.05);g.connect(G.rev);
 var o=ac.createOscillator(),og=ac.createGain();o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(170,t+.05);o.connect(og);og.connect(G.drum);env(og,t,.001,.01,.05,v*.4);o.start(t);o.stop(t+.3)}
function hat(t,v,open){noiseHit(t,v,'highpass',7800,.4,open?.09:.018)}
function rim(t,v){var o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=1650;o.connect(g);g.connect(G.drum);g.connect(G.dl);env(g,t,.001,.003,.02,v);o.start(t);o.stop(t+.2)}
function sigh(t,v){G.wh.gain.cancelScheduledValues(t);G.wh.gain.setValueAtTime(G.wh.gain.value,t);G.wh.gain.linearRampToValueAtTime(v,t+.5);G.wh.gain.setTargetAtTime(0,t+.9,.6)}
/* trueno: ruido grave que rueda + golpe */
function trueno(t,v){var s=ac.createBufferSource();s.buffer=G.noise;s.loop=true;var f=ac.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(900,t);f.frequency.exponentialRampToValueAtTime(70,t+3.5);
 var g=ac.createGain();s.connect(f);f.connect(g);g.connect(G.out);g.connect(G.rev);g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v*.9,t+.03);g.gain.setTargetAtTime(0.0001,t+.25,1.1);s.start(t);s.stop(t+6);
 var o=ac.createOscillator(),og=ac.createGain();o.frequency.setValueAtTime(70,t);o.frequency.exponentialRampToValueAtTime(32,t+1.2);o.connect(og);og.connect(G.out);env(og,t,.005,.1,.5,v*.7);o.start(t);o.stop(t+3)}

/* patrones: de balada susurrada a breakbeat */
var KICK=[1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0],SNR=[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],BRK=[1,0,0,0,1,0,0,1,0,1,1,0,1,0,0,1],BRS=[0,0,0,0,1,0,0,0,0,0,0,1,0,1,1,0];
var BAS=[1,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0],stut=0,acento=0,jump=0,PR=PROG;
function paso(s,t){
 var I=Math.min(1,M.x+acento*.25),S=M.y,bar=s>>4,k=s&15,ch=PR[T.chord];
 if(k===0){if(bar%2===0||jump){if(jump){T.chord=(T.chord+1+((Math.random()*2)|0))%4;jump=0}else T.chord=(T.chord+1)%4;
   if(bar%16===0)PR=Math.random()<.5?PROG:PROG2;ch=PR[T.chord];padChord(ch,t)}
  G.padF.frequency.setTargetAtTime(500+3800*I*I+900*S,t,.4);G.padG.gain.setTargetAtTime(.5+.5*(1-I*.4),t,.6);
  G.rain.gain.setTargetAtTime(.05+S*.9,t,.8);G.rainF.frequency.setTargetAtTime(700+S*5000,t,.8);
  G.crushG.gain.setTargetAtTime(S>.7?(S-.7)*1.4:0,t,.3);G.dl.delayTime.setTargetAtTime(SPB*(I>.6?2:3),t,.2);
  if(I<.35&&Math.random()<.35)sigh(t+SPB*2,.06+.08*(1-I))}
 /* campanita: arpegio de acorde, más denso con la intensidad */
 var pB=I<.3?(k%4===0?.5:.08):(k%2===0?.55+I*.3:.12+I*.35);
 if(Math.random()<pB){var pool=ch.slice(1).map(function(m){return m+12}).concat(ESC);var m=pool[(Math.random()*pool.length)|0];bell(m+(Math.random()<.15?12:0),t,.07+.06*Math.random(),.25+.6*(1-I))}
 /* bajo */
 if(I>.33&&BAS[k]&&Math.random()<.85)bass(ch[0]-12+(k===10&&Math.random()<.4?7:0),t,.16+I*.08,SPB*(k%3===0?2:1));
 /* batería */
 var BK=I>.66?BRK:KICK,BS=I>.66?BRS:SNR;
 if(I>.42&&BK[k])kick(t,.7+.2*I);
 if(I>.5&&BS[k])snare(t,.35+.3*I);else if(I>.3&&I<=.5&&BS[k])rim(t,.12);
 if(I>.38){if(k%2===0||I>.75)hat(t,(.05+.08*I)*(k%4===2?1.4:1),k===14&&I>.6);
  if(I>.7&&Math.random()<.18){for(var r=1;r<4;r++)hat(t+SPB*r/4,.05)}}
 /* tartamudeo: repite la semicorchea en fusas (glitch) */
 if(stut>0){stut--;for(var j=0;j<4;j++){if(Math.random()<.7)snare(t+SPB*j/4,.15+.1*j);bell(ch[1+(j%4)]+24,t+SPB*j/4,.04,.08)}}
 acento*=.9;
}
function sched(){if(!on)return;while(T.next<ac.currentTime+.12){var sw=(T.step&1)?SPB*.12:0;paso(T.step,T.next+sw);T.step++;T.next+=SPB}}

/* un rayo: la imagen manda sobre la música */
var FL={v:0,t:0};
function rayo(f,manual){if(!ac)return;NR++;var t=ac.currentTime+.01;
 FL.v=Math.min(1.3,FL.v+.9*f);FL.t=performance.now();acento=Math.min(2,acento+1);
 trueno(t+(manual?0:.05),.25+.35*f);jump=1;if(M.x>.35||manual)stut=1+((Math.random()*2)|0);
 bolt.classList.add('ya');setTimeout(function(){bolt.classList.remove('ya')},140);
 if(manual)saltaVideo(true);
 if(Math.random()<.6)rafaga()}

/* ---------- imagen ---------- */
var VC=null,vi=0,cola=[],ultimo=-1,RAF=[],rafI=0,rafT=0;
function siguiente(){var V=DAT.videos;var v=V[(Math.random()*V.length)|0],f=v.f[(Math.random()*v.f.length)|0];return {v:v,f:f}}
var CARG=0;function saltaVideo(ya){if(CARG&&performance.now()-CARG<4000)return;CARG=performance.now();var p=siguiente(),el=(VC===vA)?vB:vA;el.src=BASE+'v/'+p.v.v+'.mp4';el._p=p;el._fl=p.v.f.slice();el._next=0;
 var t0=Math.max(0,p.f-1.2-Math.random()*1.5);el.currentTime=0;
 el.onloadedmetadata=function(){el.currentTime=t0};el.onseeked=function(){el.onseeked=null;el.playbackRate=.9+.2*Math.random();el.play().then(function(){CARG=0;var old=VC;VC=el;if(old&&old!==el)old.pause();el._fin=performance.now()+(4500+Math.random()*5000)*(1-M.x*.5);
   el._next=el._fl.findIndex(function(x){return x>el.currentTime})}).catch(function(){})}}
function rafaga(){var g=GR[(Math.random()*GR.length)|0];if(!g)return;RAF=g.slice(0,8+((Math.random()*10)|0));rafI=0;rafT=performance.now();RAF.forEach(foto)}
function medida(){var r=cv.parentNode.getBoundingClientRect(),dp=Math.min(2,window.devicePixelRatio||1);cv.width=r.width*dp;cv.height=r.height*dp}
var GRANO=null;function grano(){var c=document.createElement('canvas');c.width=c.height=192;var g=c.getContext('2d'),d=g.createImageData(192,192);for(var i=0;i<d.data.length;i+=4){var v=(Math.random()*255)|0;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}g.putImageData(d,0,0);return c}
function frame(now){if(L.hidden)return;requestAnimationFrame(frame);if(on&&ac)sched();
 var W=cv.width,H=cv.height,sw=Math.min(W,H*4/3),sh=sw*3/4,x=(W-sw)/2,y=(H-sh)/2;
 var sala=document.documentElement.classList.contains('sala');
 cx.fillStyle=sala?'#0c0c0b':getComputedStyle(document.body).backgroundColor;cx.fillRect(0,0,W,H);
 cx.fillStyle='#050505';cx.fillRect(x,y,sw,sh);
 if(!on){if(DAT&&FOT[DAT.fotos[0]]&&FOT[DAT.fotos[0]].complete){cx.globalAlpha=.55;cx.filter='grayscale(1) brightness(.7)';cx.drawImage(FOT[DAT.fotos[40]]||FOT[DAT.fotos[0]],x,y,sw,sh);cx.filter='none';cx.globalAlpha=1}return}
 /* vídeo de fondo */
 var I=M.x,S=M.y;
 if(VC&&VC.readyState>=2){var b=.55+S*.35+FL.v*.9;cx.filter='grayscale(1) contrast('+(1.25+S*.5)+') brightness('+b+')';cx.drawImage(VC,x,y,sw,sh);cx.filter='none';
  /* el destello que viene en el propio material dispara la música */
  if(VC._fl&&VC._next>=0&&VC._next<VC._fl.length&&VC.currentTime>=VC._fl[VC._next]){VC._next++;var k=VC._p.v.k[VC._p.v.f.indexOf(VC._fl[VC._next-1])]||10;rayo(Math.min(1,.4+k/40),false)}
  if(performance.now()>VC._fin||VC.ended)saltaVideo()}
 /* ráfaga de fotos (stop motion de la misma noche) */
 if(RAF.length&&rafI<RAF.length){var per=Math.max(55,SPB*1000*(I>.6?1:2));if(now-rafT>per){rafI++;rafT=now}var im=FOT[RAF[rafI]];
  if(im&&im.complete&&im.naturalWidth){cx.globalAlpha=.55+.4*Math.min(1,FL.v);cx.filter='grayscale(1) contrast(1.4) brightness('+(1+FL.v)+')';cx.drawImage(im,x,y,sw,sh);cx.filter='none';cx.globalAlpha=1}}
 /* destello */
 if(FL.v>.01){cx.globalCompositeOperation='screen';cx.fillStyle='rgba(230,236,255,'+Math.min(.85,FL.v*.6)+')';cx.fillRect(x,y,sw,sh);cx.globalCompositeOperation='source-over';FL.v*=.86}
 /* tinte frío en los blancos (duotono) */
 cx.globalCompositeOperation='multiply';cx.fillStyle='rgb('+(205-S*30|0)+','+(214-S*20|0)+',255)';cx.fillRect(x,y,sw,sh);cx.globalCompositeOperation='source-over';
 /* grano que vibra con el sonido */
 if(!GRANO)GRANO=grano();var lv=nivel();cx.globalCompositeOperation='overlay';cx.globalAlpha=.05+S*.12+lv*.35;var gx=(Math.random()*192)|0,gy=(Math.random()*192)|0;
 cx.save();cx.beginPath();cx.rect(x,y,sw,sh);cx.clip();var sc=Math.max(1,W/700);for(var yy=y-gy*sc;yy<y+sh;yy+=192*sc)for(var xx=x-gx*sc;xx<x+sw;xx+=192*sc)cx.drawImage(GRANO,xx,yy,192*sc,192*sc);cx.restore();
 cx.globalAlpha=1;cx.globalCompositeOperation='source-over';
 osci();
}
var TD=null;function nivel(){if(!G.ana)return 0;if(!TD)TD=new Uint8Array(G.ana.fftSize);G.ana.getByteTimeDomainData(TD);var s=0;for(var i=0;i<TD.length;i+=8){var v=(TD[i]-128)/128;s+=v*v}return Math.min(1,Math.sqrt(s/(TD.length/8))*3)}
function osci(){if(!TD||osc.offsetParent===null)return;var w=osc.width,h=osc.height;ox.clearRect(0,0,w,h);ox.strokeStyle=getComputedStyle(document.body).color;ox.lineWidth=1.2;ox.beginPath();
 for(var i=0;i<TD.length;i+=4){var xx=i/TD.length*w,yy=h/2+(TD[i]-128)/128*h*.45;i?ox.lineTo(xx,yy):ox.moveTo(xx,yy)}ox.stroke()}

function enciende(){carga(function(){if(!ac)init();ac.resume();on=true;onB.textContent='(parar)';tocar.hidden=true;
 G.out.gain.cancelScheduledValues(ac.currentTime);G.out.gain.setTargetAtTime(VOL,ac.currentTime,.3);if(G.au.paused)G.au.play().catch(function(){});
 T.next=ac.currentTime+.08;padChord(PR[T.chord],T.next);saltaVideo()})}
function apaga(){if(!ac)return;on=false;var t=ac.currentTime;G.out.gain.setTargetAtTime(0,t,.2);onB.textContent='(empezar)';tocar.hidden=false;[vA,vB].forEach(function(v){v.pause()});
 setTimeout(function(){if(!on){G.au.pause();ac.suspend()}},900)}
function cierra(){apaga();L.hidden=true;document.body.classList.remove('entorm')}
window.abreTormenta=function(){if(!L)monta();L.hidden=false;document.body.classList.add('entorm');carga();requestAnimationFrame(function(){medida();requestAnimationFrame(frame)})};
var NR=0;window.__torm=function(){return {on:on,vc:VC&&VC.src.split('/').pop(),rs:VC&&VC.readyState,ct:VC&&VC.currentTime,next:VC&&VC._next,rayos:NR,step:T.step,ctx:ac&&ac.state}};
window.addEventListener('resize',function(){if(L&&!L.hidden)medida()});
})();
