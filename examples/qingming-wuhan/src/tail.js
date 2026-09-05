/* tail.js — page runtime. Concatenated after main.js; closes the shared script element.

   Split with main.js (the integrator's file):

     main.js   new p5(function(p){
                 var ctx=makeCtx(p), A=newApp(p,ctx);
                 function build(){ ...phase A: specs, masks.stampWater, masks.stampZ(footprints), CROWD.place;
                                   phase B: every build(), TEXT.sign / TEXT.colophon / seals...; finishBuild(A); }
                 attachApp(A,build);
               });
               main.js holds the composition only. It never touches the DOM, p.setup/p.draw, fonts, silk or ordering.

     tail.js   newApp(p,ctx)       the state record the page runs on: g, silkImg, strokes, stageStart, drawn, progress,
                                   playing, dirty, camX, follow, speed, T, built, drag state, lastPos, rec, chunks,
                                   checkpoints (index → image), boundaries (index → true)
               finishBuild(A)      the ordering loop: sorts every ctx.S[stage] right→left, concatenates into A.strokes,
                                   fills A.stageStart, sets the two checkpoint boundaries at ST.TREES and ST.OCHRE, marks built
               attachApp(A,build)  p.setup (canvas VW×CH, g SW×SH at pd 2, deep links #p/#cam/#seq/#full, the fonts.load gate on
                                   ALL_TEXT, then bakeSilk → revealSilk → build → #seq replay), p.draw, mouse/touch drag,
                                   steps/play/speed/progress/follow UI, keyboard, WebM recording, syncTo/targetIndex/stageOf
               title instance      second p5 sketch writing the page title with the brush engine
               the closing script tag */

function newApp(p,ctx){ return {p:p,ctx:ctx,g:null,silkImg:null,strokes:[],stageStart:[],drawn:0,progress:0,playing:false,dirty:true,camX:SW-VW,follow:true,speed:1,T:120,built:false,dragging:null,dragX0:0,camX0:0,lastPos:null,rec:null,chunks:[],checkpoints:{},boundaries:{}}; }

function finishBuild(A){ var S=A.ctx.S, idx=0, i, j; A.strokes=[]; A.stageStart=[];
  for(i=0;i<S.length;i++){ S[i].sort(function(a,b){ return b.x-a.x; }); A.stageStart[i]=idx; for(j=0;j<S[i].length;j++)A.strokes.push(S[i][j]); idx+=S[i].length; }
  A.stageStart.push(idx); A.boundaries={}; A.boundaries[A.stageStart[ST.TREES]]=true; A.boundaries[A.stageStart[ST.OCHRE]]=true;
  A.built=true; A.dirty=true; }

function attachApp(A,build){ var p=A.p, RECNAME='qingming-wuhan-process.webm';
  function base(){ A.g.push(); A.g.background(C.silk[0],C.silk[1],C.silk[2]); A.g.pop(); }
  function targetIndex(t){ var n=STAGES.length, st=Math.min(n-1,Math.floor(t*n)), fr=t*n-st; return Math.round(A.stageStart[st]+fr*(A.stageStart[st+1]-A.stageStart[st])); }
  function syncTo(t){ var tgt=targetIndex(t), g=A.g;
    if(tgt<A.drawn){ var start=0; for(var k in A.checkpoints){ var ki=+k; if(ki<=tgt&&ki>start)start=ki; } base(); if(start){ g.push(); g.image(A.checkpoints[start],0,0,SW,SH); g.pop(); } A.drawn=start; }
    if(tgt>A.drawn){ g.push(); while(A.drawn<tgt){ A.strokes[A.drawn++].f(g); if(A.boundaries[A.drawn]&&!A.checkpoints[A.drawn]){ g.pop(); A.checkpoints[A.drawn]=g.get(); g.push(); } } g.pop(); }
    A.lastPos=A.drawn?A.strokes[A.drawn-1].x:null; }
  function stageOf(t){ return Math.min(STAGES.length-1,Math.floor(t*STAGES.length)); }
  // ---------- UI ----------
  function $(s){ return document.querySelector(s); }
  var playBtn=$('#play'), prog=$('#prog'), pct=$('#pct'), stepsEl=$('#steps'), recBtn=$('#rec');
  STAGES.forEach(function(s,i){ var b=document.createElement('button'); b.innerHTML='<b>'+(i<9?'0':'')+(i+1)+'</b>'+s[0]; b.addEventListener('click',function(){ A.progress=(i+0.001)/STAGES.length; A.playing=false; A.dirty=true; ui(); }); stepsEl.appendChild(b); });
  var uiStage=-1;
  function ui(){ prog.value=Math.round(A.progress*1000); pct.textContent=Math.round(A.progress*100)+'%'; playBtn.textContent=A.playing?'❚❚ 暂停':'▶ 播放';
    var st=stageOf(A.progress); if(st!==uiStage){ uiStage=st; var kids=stepsEl.children; for(var i=0;i<kids.length;i++)kids[i].classList.toggle('on',i===st); $('#dname').textContent=STAGES[st][0]; $('#dsub').textContent=STAGES[st][1]; $('#dtext').textContent=STAGES[st][2]; } }
  playBtn.addEventListener('click',function(){ if(A.progress>=1)A.progress=0; A.playing=!A.playing; A.dirty=true; ui(); });
  prog.addEventListener('input',function(){ A.progress=prog.value/1000; A.playing=false; A.dirty=true; ui(); });
  $('#speed').addEventListener('change',function(e){ A.speed=+e.target.value; }); $('#follow').addEventListener('change',function(e){ A.follow=e.target.checked; });
  function stopRec(){ if(A.rec&&A.rec.state!=='inactive')A.rec.stop(); }
  recBtn.addEventListener('click',function(){ if(A.rec){ stopRec(); return; } if(!p.canvas.captureStream||!window.MediaRecorder){ alert('此浏览器不支持 MediaRecorder'); return; }
    var mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm'; A.chunks=[];
    var rec=new MediaRecorder(p.canvas.captureStream(30),{mimeType:mime,videoBitsPerSecond:8e6}); A.rec=rec; rec.ondataavailable=function(e){ A.chunks.push(e.data); };
    rec.onstop=function(){ var blob=new Blob(A.chunks,{type:'video/webm'}); A.rec=null; recBtn.textContent='● 一键录制 WebM';
      var anchor=function(){ var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=RECNAME; a.click(); };
      if(window.claude&&window.claude.use)window.claude.use('downloads').then(function(dl){ return dl.save({filename:RECNAME,data:blob}).catch(function(e){ if(!e||e.code!=='declined')alert('保存失败:'+(e&&(e.message||e.code))); }); },anchor); else anchor(); };
    A.progress=0; A.drawn=0; base(); A.camX=SW-VW; A.follow=true; $('#follow').checked=true; A.playing=true; A.dirty=true; rec.start(); recBtn.textContent='■ 停止录制'; ui(); });
  window.addEventListener('keydown',function(e){ if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return; if(e.code==='Space'){ e.preventDefault(); playBtn.click(); } if(e.code==='ArrowLeft'){ A.camX=Math.max(0,A.camX-80); A.dirty=true; } if(e.code==='ArrowRight'){ A.camX=Math.min(SW-VW,A.camX+80); A.dirty=true; } });
  // ---------- p5 ----------
  // #full=1: the visible canvas is the whole scroll at 1:1 and the page chrome is hidden, so one screenshot holds every pixel
  var hp=new URLSearchParams(location.hash.slice(1)), full=hp.has('full');
  p.setup=function(){ if(full){ var m=$('main'); m.style.maxWidth='none'; m.style.padding='0'; $('#stage').style.border='none'; ['header','.bar','#steps','.desc','.note'].forEach(function(s){ var el=$(s); if(el)el.style.display='none'; }); p.createCanvas(SW,SH).parent('stage'); p.pixelDensity(1); A.progress=1; }
    else { p.createCanvas(VW,CH).parent('stage'); p.pixelDensity(2); }
    p.frameRate(30); A.g=p.createGraphics(SW,SH); A.g.pixelDensity(2); base();
    var seq=null; if(hp.has('p'))A.progress=Math.max(0,Math.min(1,+hp.get('p'))); if(hp.has('cam'))A.camX=Math.max(0,Math.min(1,+hp.get('cam')))*(SW-VW); if(hp.has('seq'))seq=hp.get('seq').split(',').map(Number);
    var loads=[document.fonts.load('13px "Ma Shan Zheng"',ALL_TEXT),document.fonts.load('13px "Noto Serif SC"',ALL_TEXT),document.fonts.load('13px "Kaiti SC"',ALL_TEXT)];
    Promise.all(loads).catch(function(){}).then(function(){ A.silkImg=bakeSilk(p,A.ctx); revealSilk(A.ctx,A.silkImg); build(); if(seq){ for(var i=0;i<seq.length;i++)syncTo(seq[i]); A.progress=seq[seq.length-1]; } ui(); }); ui(); };
  p.mousePressed=function(){ if(p.mouseX<0||p.mouseX>VW||p.mouseY<0||p.mouseY>CH)return; if(p.mouseY>VH+GAP){ A.dragging='mm'; A.camX=Math.max(0,Math.min(SW-VW,p.mouseX/VW*SW-VW/2)); A.dirty=true; } else { A.dragging='v'; A.dragX0=p.mouseX; A.camX0=A.camX; } };
  p.mouseDragged=function(){ if(A.dragging==='v'){ A.camX=Math.max(0,Math.min(SW-VW,A.camX0-(p.mouseX-A.dragX0))); A.dirty=true; } else if(A.dragging==='mm'){ A.camX=Math.max(0,Math.min(SW-VW,p.mouseX/VW*SW-VW/2)); A.dirty=true; } if(A.dragging)return false; };
  p.mouseReleased=function(){ A.dragging=null; };
  p.touchStarted=function(){ return p.mousePressed(); }; p.touchMoved=function(){ return p.mouseDragged(); }; p.touchEnded=function(){ return p.mouseReleased(); };
  var lastT=0;
  p.draw=function(){ var now=p.millis(), dt=Math.min(0.1,(now-lastT)/1000); lastT=now; if(!A.built)return;
    if(A.playing){ A.progress=Math.min(1,A.progress+dt*A.speed/A.T); if(A.follow)A.camX=(1-A.progress)*(SW-VW); if(A.progress>=1){ A.playing=false; stopRec(); } A.dirty=true; ui(); }
    if(!A.dirty)return; A.dirty=false; syncTo(A.progress);
    if(full){ p.image(A.g,0,0,SW,SH); return; }
    p.background('#14161B'); p.image(A.g,0,0,VW,VH,A.camX,0,VW,VH);
    p.image(A.g,0,VH+GAP,VW,MMH,0,0,SW,SH); p.noFill(); p.stroke(C.red[0],C.red[1],C.red[2]); p.strokeWeight(1.5); p.rect(A.camX/SW*VW,VH+GAP,VW/SW*VW,MMH);
    if(A.lastPos!==null&&A.progress<1){ p.noStroke(); p.fill(C.red[0],C.red[1],C.red[2]); p.circle(A.lastPos/SW*VW,VH+GAP-4,6); } };
}

// ---------- page title, written with the same brush engine; follows the page theme
new p5(function(q){ var inkC=[34,32,28];
  function readInk(){ var v=getComputedStyle(document.documentElement).getPropertyValue('--ink').trim(), m=/^#([0-9a-f]{6})$/i.exec(v); if(m)inkC=[parseInt(m[1].slice(0,2),16),parseInt(m[1].slice(2,4),16),parseInt(m[1].slice(4,6),16)]; }
  q.setup=function(){ q.createCanvas(470,74).parent('ttl'); q.pixelDensity(2); q.noLoop(); readInk(); document.fonts.load('40px "Ma Shan Zheng"',TITLE_TEXT).catch(function(){}).then(function(){ q.redraw(); }); matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){ readInk(); q.redraw(); }); };
  q.draw=function(){ q.clear(); var sd=4242; var R2=function(){ sd|=0; sd=sd+0x6D2B79F5|0; var t=Math.imul(sd^sd>>>15,1|sd); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
    var B=makeBrushText(R2), T=B.brushText({text:TITLE_TEXT,x:24,y:40,size:40,font:'"Kaiti SC","STKaiti","KaiTi","Ma Shan Zheng"',horizontal:true,lineH:1.1,over:9,ink:0.95,dry:0.3,warp:0,tilt:0,wander:0});
    for(var i=0;i<T.length;i++)for(var j=0;j<T[i].comps.length;j++)B.stampDabs(q,T[i].comps[j],inkC); }; });
</script>
