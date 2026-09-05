  function targetIndex(t){ const n=STAGES.length, st=Math.min(n-1,Math.floor(t*n)), fr=t*n-st; return Math.round(stageStart[st]+fr*(stageStart[st+1]-stageStart[st])); }
  function syncTo(t){ const tgt=targetIndex(t);
    if(tgt<drawn){ let start=0; for(const i of checkpoints.keys())if(i<=tgt&&i>start)start=i; base(); if(start){ g.push(); g.image(checkpoints.get(start),0,0,SW,SH); g.pop(); } drawn=start; }
    if(tgt>drawn){ g.push(); while(drawn<tgt){ strokes[drawn++].f(g); if(boundaries.has(drawn)&&!checkpoints.has(drawn)){ g.pop(); checkpoints.set(drawn,g.get()); g.push(); } } g.pop(); }
    lastPos=drawn?strokes[drawn-1].x:null; }
  const stageOf=t=>Math.min(STAGES.length-1,Math.floor(t*STAGES.length));
  // ---------- UI ----------
  const $=s=>document.querySelector(s); const playBtn=$('#play'), prog=$('#prog'), pct=$('#pct'), stepsEl=$('#steps');
  STAGES.forEach((s,i)=>{ const b=document.createElement('button'); b.innerHTML=`<b>${String(i+1).padStart(2,'0')}</b>${s[0]}`; b.addEventListener('click',()=>{ progress=(i+0.001)/STAGES.length; playing=false; dirty=true; ui(); }); stepsEl.appendChild(b); });
  let uiStage=-1;
  function ui(){ prog.value=Math.round(progress*1000); pct.textContent=Math.round(progress*100)+'%'; playBtn.textContent=playing?'❚❚ 暂停':'▶ 播放';
    const st=stageOf(progress); if(st!==uiStage){ uiStage=st; [...stepsEl.children].forEach((b,i)=>b.classList.toggle('on',i===st)); $('#dname').textContent=STAGES[st][0]; $('#dsub').textContent=STAGES[st][1]; $('#dtext').textContent=STAGES[st][2]; } }
  playBtn.addEventListener('click',()=>{ if(progress>=1)progress=0; playing=!playing; dirty=true; ui(); });
  prog.addEventListener('input',()=>{ progress=prog.value/1000; playing=false; dirty=true; ui(); });
  $('#speed').addEventListener('change',e=>speed=+e.target.value); $('#follow').addEventListener('change',e=>follow=e.target.checked);
  $('#rec').addEventListener('click',()=>{ if(rec){ stopRec(); return; } if(!p.canvas.captureStream||!window.MediaRecorder){ alert('此浏览器不支持 MediaRecorder'); return; }
    const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm'; chunks=[];
    rec=new MediaRecorder(p.canvas.captureStream(30),{mimeType:mime,videoBitsPerSecond:8e6}); rec.ondataavailable=e=>chunks.push(e.data);
    rec.onstop=async()=>{ const blob=new Blob(chunks,{type:'video/webm'}); rec=null; $('#rec').textContent='● 一键录制 WebM';
      const dl=(window.claude&&window.claude.use)?await window.claude.use('downloads').catch(()=>null):null;
      if(dl){ try{ await dl.save({filename:'qianli-jiangshan-process.webm',data:blob}); }catch(e){ if(e&&e.code!=='declined')alert('保存失败:'+(e.message||e.code)); } }
      else { const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='qianli-jiangshan-process.webm'; a.click(); } };
    progress=0; drawn=0; base(); camX=SW-VW; follow=true; $('#follow').checked=true; playing=true; dirty=true; rec.start(); $('#rec').textContent='■ 停止录制'; ui(); });
  const stopRec=()=>{ if(rec&&rec.state!=='inactive')rec.stop(); };
  window.addEventListener('keydown',e=>{ if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return; if(e.code==='Space'){e.preventDefault();playBtn.click();} if(e.code==='ArrowLeft'){camX=Math.max(0,camX-80);dirty=true;} if(e.code==='ArrowRight'){camX=Math.min(SW-VW,camX+80);dirty=true;} });
  // ---------- p5 ----------
  p.setup=()=>{ p.createCanvas(VW,CH).parent('stage'); p.pixelDensity(2); p.frameRate(30); g=p.createGraphics(SW,SH); g.pixelDensity(2); base();
    const hp=new URLSearchParams(location.hash.slice(1)); if(hp.has('p'))progress=Math.max(0,Math.min(1,+hp.get('p'))); if(hp.has('cam'))camX=Math.max(0,Math.min(1,+hp.get('cam')))*(SW-VW); if(hp.has('seq'))window.__seq=hp.get('seq').split(',').map(Number);
    Promise.all([document.fonts.load('13px "Ma Shan Zheng"',COLOPHON+'千里江山圖過程珍藏審定神品蔡京元長')]).catch(()=>{}).finally(()=>{ bakeSilk(); build(); if(window.__seq){ for(const v of window.__seq)syncTo(v); progress=window.__seq[window.__seq.length-1]; } ui(); }); ui(); };
  p.mousePressed=()=>{ if(p.mouseX<0||p.mouseX>VW||p.mouseY<0||p.mouseY>CH)return; if(p.mouseY>VH+GAP){ dragging='mm'; camX=Math.max(0,Math.min(SW-VW,p.mouseX/VW*SW-VW/2)); dirty=true; } else { dragging='v'; dragX0=p.mouseX; camX0=camX; } };
  p.mouseDragged=()=>{ if(dragging==='v'){ camX=Math.max(0,Math.min(SW-VW,camX0-(p.mouseX-dragX0))); dirty=true; } else if(dragging==='mm'){ camX=Math.max(0,Math.min(SW-VW,p.mouseX/VW*SW-VW/2)); dirty=true; } if(dragging)return false; };
  p.mouseReleased=()=>{ dragging=null; };
  p.touchStarted=()=>p.mousePressed(); p.touchMoved=()=>p.mouseDragged(); p.touchEnded=()=>p.mouseReleased();
  let lastT=0;
  p.draw=()=>{ const now=p.millis(), dt=Math.min(0.1,(now-lastT)/1000); lastT=now; if(!built)return;
    if(playing){ progress=Math.min(1,progress+dt*speed/T); if(follow)camX=(1-progress)*(SW-VW); if(progress>=1){ playing=false; stopRec(); } dirty=true; ui(); }
    if(!dirty)return; dirty=false; syncTo(progress);
    p.background('#14161B'); p.image(g,0,0,VW,VH,camX,0,VW,VH);
    p.image(g,0,VH+GAP,VW,MMH,0,0,SW,SH); p.noFill(); p.stroke(C.red[0],C.red[1],C.red[2]); p.strokeWeight(1.5); p.rect(camX/SW*VW,VH+GAP,VW/SW*VW,MMH);
    if(lastPos!==null&&progress<1){ p.noStroke(); p.fill(...C.red); p.circle(lastPos/SW*VW,VH+GAP-4,6); } };
});


// ---------- page title, written with the same brush engine; follows the page theme
new p5(q=>{ let inkC=[34,32,28]; const readInk=()=>{ const v=getComputedStyle(document.documentElement).getPropertyValue('--ink').trim(); const m=/^#([0-9a-f]{6})$/i.exec(v); if(m)inkC=[parseInt(m[1].slice(0,2),16),parseInt(m[1].slice(2,4),16),parseInt(m[1].slice(4,6),16)]; };
  q.setup=()=>{ q.createCanvas(470,74).parent('ttl'); q.pixelDensity(2); q.noLoop(); readInk(); document.fonts.load('40px "Ma Shan Zheng"','千里江山圖過程').catch(()=>{}).finally(()=>q.redraw()); matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{ readInk(); q.redraw(); }); };
  q.draw=()=>{ q.clear(); let sd=4242; const R2=()=>{ sd|=0; sd=sd+0x6D2B79F5|0; let t=Math.imul(sd^sd>>>15,1|sd); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
    const B=makeBrushText(R2); const T=B.brushText({text:'千里江山圖 · 過程',x:24,y:40,size:40,font:'"Kaiti SC","STKaiti","KaiTi","Ma Shan Zheng"',horizontal:true,lineH:1.1,over:9,ink:0.95,dry:0.3,warp:0,tilt:0,wander:0}); for(const it of T)for(const c of it.comps)B.stampDabs(q,c,inkC); }; });
</script>
