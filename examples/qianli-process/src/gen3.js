const CW=185, PW=4000, SW=CW+PW, SH=500, VW=930, VH=500, MMH=Math.round(VW/SW*SH), GAP=12, CH=VH+GAP+MMH, YW=332;
const C={silk:[170,146,102], silkDk:[124,98,62], paper:[204,186,148], ink:[42,39,33], ochre:[176,130,80], ochre2:[150,104,60], zhilv:[108,138,82], shilv:[78,134,104], shilv2:[104,158,126],
  shiqing:[48,86,146], shiqing2:[78,118,176], shiqing3:[34,60,110], huaqing:[72,103,124], waterInk:[48,62,63], far:[112,132,156], red:[182,50,36], tree:[38,62,40], tree2:[58,92,54], trunk:[74,54,32]};
const STAGES=[
 ['矾绢','silk ground · 胶矾水','先在细绢上刷胶矾水(矾绢),使绢面不洇。绢本身是暖黄色,九百年氧化后偏深褐,这层底色会透过之后所有薄染的颜色。左端另接一段拖尾纸,留给题跋。'],
 ['勾勒','ink outline · 淡墨起稿','用淡墨勾出山石轮廓、峰峦脉络与曲折的岸线。线条瘦劲,山头尖峭、一面陡一面缓,是全卷的骨架;之后每一层颜色都顺着这些线来。'],
 ['皴擦','texture strokes · 披麻皴','从每个峰头向两侧分"道"向下放射短线,皴出山石的结构与向背:左侧背阴一面皴得密而重,右侧向阳一面留得空。近披麻皴一路,笔触松秀。'],
 ['赭石打底','ochre underpainting','山体普遍薄罩一层赭石,坡脚与峰瓣之间的谷口再加一遍;沙洲也在这一步铺赭。矿物色直接上绢会飘,先有赭石打底,青绿才沉得住、有暖意。'],
 ['汁绿·水色','vegetation green & water tint · 花青','用植物性的汁绿(花青调藤黄)统罩山体中下部,与赭石过渡;江面先薄罩花青,再罩一遍极淡汁绿,把黄绢压成冷灰绿的水色。'],
 ['石绿','malachite · 矿物石绿','矿物石绿分几次积染在每个峰瓣的下半面,颜料有颗粒,越积越厚、越亮。峰与峰之间的谷口只到半山就停,留着赭石。'],
 ['石青','azurite · 头青、二青','头青、二青沿每个峰头的脊线向下敷,主峰脊线可下到四成,向阳一面比背阴多敷一分。青与绿的边界跟着峰瓣走,不是一条水平线。'],
 ['水纹·远山','water lines & distant hills','以细笔勾网巾纹:一行行连续的波线,相邻两行错开半个波长,结成网;近处略密而重,远处略疏而淡,遇岸即止、近岸微弯。远山分三层,只用淡花青染出,无轮廓。'],
 ['复勾·点景','re-outline, moss dots & staffage','青绿上完后用淡墨把轮廓重新提一遍(复勾),沿山脊、脉络疏疏点苔;树分点叶、夹叶、松、柳四种,岸边柳与点叶为主,山腰夹叶,松只在岩脊高处;村落是有院墙的院落,门前小径爬向山腰;桥两端落在岸上;江上有篷船与渔舟。'],
 ['云气·题跋','mist as blank silk, seals & colophon','云气不是白颜料,是留白:在两峰鞍部和大山脚下以绢色薄罩,把山与山之间松开。画心之后的拖尾纸上录蔡京跋,记王希孟十八岁作此卷、徽宗亲授其法;最后钤印。']];
const COLOPHON='政和三年閏四月八日賜希孟年十八歲昔在畫學為生徒召入禁中文書庫數以畫獻未甚工上知其性可教遂誨諭之親授其法不踰半歲乃以此圖進上嘉之因以賜臣京謂天下士在作之而已';

new p5(p=>{
  let g, silkImg, strokes=[], stageStart=[], drawn=0, progress=0, playing=false, dirty=true, camX=SW-VW, follow=true, speed=1, T=120, built=false;
  let dragging=null, dragX0=0, camX0=0, lastPos=null, rec=null, chunks=[];
  const checkpoints=new Map(); let boundaries=new Set();
  let seed=20230904; const R=()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  const rr=(a,b)=>a+R()*(b-a), ri=(a,b)=>Math.floor(rr(a,b+1)), col=(c,a)=>[c[0],c[1],c[2],a], clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), smoothstep=(a,b,v)=>{ const t=clamp((v-a)/(b-a),0,1); return t*t*(3-2*t); };
  const M=[], BARS=[], VILL=[];
  const S=STAGES.map(()=>[]);
  const add=(st,x,f)=>S[st].push({x,f});
  const poly=(g,pts,close)=>{ g.beginShape(); for(const q of pts)g.vertex(q[0],q[1]); g.endShape(close?g.CLOSE:undefined); };

  // ---------------------------------------------------------------- mountains
  function mkMountain(x0,x1,yb,hmax,far){
    hmax=Math.min(hmax,yb-26); const Wd=x1-x0, top=yb-hmax; let crest=null, peaks=[];
    if(far){ const n=ri(1,2); for(let i=0;i<n;i++){ const w=rr(0.22,0.42), asym=rr(0.55,0.9), flip=R()<0.5; peaks.push({u:rr(0.14,0.86),h:rr(0.55,1)*hmax,wl:flip?w:w*asym,wr:flip?w*asym:w}); } peaks.sort((a,b)=>a.u-b.u); }
    else {
      // crest walk: 15–45 px segments, ledges, notches, secondary peaks — no ruler-straight slope longer than ~45 px
      const asym=R()<0.45; const sX=x0+Wd*(asym?(R()<0.5?rr(0.2,0.35):rr(0.65,0.8)):rr(0.35,0.65)); const pts=[[x0,yb]]; let x=x0,y=yb; let shoulderDone=!asym, lastStep=x0;
      let guard=0; while(x<sX-6&&guard++<300){ const rem=sX-x; let L=Math.min(rem,rr(15,45)); const mean=(top-y)/Math.max(1,rem); let sl; const k=R();
        if(x-lastStep>rr(55,95)&&rem>30&&y<yb-hmax*0.15){ lastStep=x; const dp=rr(8,20); pts.push([x+rr(2,5),y+rr(-1,1),0]); x+=rr(4,10); y=clamp(y-dp,top,yb-1); pts.push([x,y,0]); continue; }
        if(!shoulderDone&&sX>x0+Wd*0.5&&x>x0+Wd*0.12){ shoulderDone=true; L=Math.min(rem*0.6,rr(60,120)); sl=mean*rr(0.12,0.3); } else if(k<0.2){ sl=mean*rr(0.02,0.25); L=Math.min(rem,rr(8,24)); } else if(k<0.32&&y<yb-hmax*0.2){ sl=Math.abs(mean)*rr(0.3,1.1); L=Math.min(rem,rr(6,16)); } else sl=mean*(guard%2?rr(0.3,0.9):rr(1.1,2.3));
        x+=L; y=clamp(y+sl*L,top,yb-1); pts.push([x,y,rr(-0.14,0.14)]); }
      const cap=rr(16,32); pts.push([sX-cap/2,top+rr(3,7),rr(-0.08,0.08)]); pts.push([sX-cap/5,top+rr(0,2),0]); pts.push([sX+cap/5,top+rr(0,2),0]); pts.push([sX+cap/2,top+rr(3,8),rr(-0.08,0.08)]); x=sX+cap/2; y=top+4; lastStep=x;
      let spurLeft=ri(1,3); guard=0;
      while(x<x1-6&&guard++<400){ const rem=x1-x; let L=Math.min(rem,rr(15,45)); const mean=(yb-y)/Math.max(1,rem); let sl; const k=R();
        if(x-lastStep>rr(55,95)&&rem>30&&y<yb-hmax*0.15){ lastStep=x; const dp=rr(8,20); pts.push([x+rr(2,5),y+rr(0,3),0]); x+=rr(4,10); y=clamp(y+dp,top,yb-1); pts.push([x,y,0]); continue; }
        if(!shoulderDone&&sX<x0+Wd*0.5&&x>sX+Wd*0.1){ shoulderDone=true; L=Math.min(rem*0.6,rr(60,120)); sl=mean*rr(0.12,0.3); x+=L; y=clamp(y+sl*L,top,yb-1); pts.push([x,y,rr(-0.1,0.1)]); continue; }
        if(spurLeft>0&&k<0.2&&rem>90&&y>top+hmax*0.3){ const ph=rr(0.12,0.3)*hmax; let climbed=0; while(climbed<ph&&x<x1-40){ const l=Math.min(rr(10,30),x1-40-x); const sg=-rr(0.4,1.2); x+=l; y=clamp(y+sg*l,top+hmax*0.12,yb-1); climbed+=-sg*l; pts.push([x,y,rr(-0.1,0.1)]); } spurLeft--; continue; }
        if(k<0.2){ sl=mean*rr(0.02,0.25); L=Math.min(rem,rr(8,24)); } else if(k<0.3&&y<yb-hmax*0.25){ sl=-Math.abs(mean)*rr(0.3,1.1); L=Math.min(rem,rr(6,16)); } else sl=mean*(guard%2?rr(0.3,0.9):rr(1.1,2.3));
        x+=L; y=clamp(y+sl*L,top,yb-1); pts.push([x,y,rr(-0.14,0.14)]); }
      pts.push([x1,yb,0]);
      // inflections: split every segment longer than 18 px into 2–4 pieces with ±(3–8 px) offsets, and give V-notches a small floor
      const fine=[pts[0]]; for(let i=1;i<pts.length;i++){ const a=pts[i-1], b=pts[i], L=b[0]-a[0]; const n=L>18?ri(2,4):1;
        for(let j=1;j<n;j++){ const t=j/n; fine.push([a[0]+L*t, a[1]+(b[1]-a[1])*t+rr(-1,1)*Math.min(8,3+L*0.08), rr(-0.1,0.1)]); } fine.push(b); }
      for(let i=1;i<fine.length-1;i++){ if(fine[i][1]>fine[i-1][1]&&fine[i][1]>fine[i+1][1]&&fine[i][1]<yb-10&&R()<0.6){ const w=rr(4,10); fine.splice(i,1,[fine[i][0]-w/2,fine[i][1],0],[fine[i][0]+w/2,fine[i][1]+rr(-1,1),0]); i++; } }
      fine.sort((a,b)=>a[0]-b[0]);
      const sm2=[fine[0]]; for(let i=0;i<fine.length-1;i++){ const a=fine[i],b=fine[i+1]; const steep=Math.abs(b[1]-a[1])>Math.abs(b[0]-a[0])*1.2; if(steep){ sm2.push(a); continue; } sm2.push([a[0]*0.75+b[0]*0.25,a[1]*0.75+b[1]*0.25,a[2]||0]); sm2.push([a[0]*0.25+b[0]*0.75,a[1]*0.25+b[1]*0.75,b[2]||0]); } sm2.push(fine[fine.length-1]); crest=sm2; }
    const len=Math.ceil(Wd/2)+1, step=Wd/(len-1), ridge=new Float32Array(len), ns=rr(0,1000);
    let ci=0; for(let i=0;i<len;i++){ const x=x0+i*step,u=i/(len-1); let yv;
      if(far){ let h=0; for(const pk of peaks){ const w=u<pk.u?pk.wl:pk.wr; h=Math.max(h,pk.h*Math.pow(Math.max(0,1-Math.abs(u-pk.u)/w),0.9)); } h=Math.max(h,0.58*hmax*Math.pow(Math.sin(Math.PI*u),0.7)); h*=Math.max(0,Math.min(1,u/0.07,(1-u)/0.07)); h*=1+0.06*(p.noise(x*0.01+ns)-0.5)*2; yv=yb-Math.max(0,h); }
      else { while(ci<crest.length-2&&crest[ci+1][0]<x)ci++; const a=crest[ci],b=crest[ci+1]; const t=clamp((x-a[0])/Math.max(0.01,b[0]-a[0]),0,1); yv=a[1]+(b[1]-a[1])*t+(b[2]||0)*(b[0]-a[0])*Math.sin(Math.PI*t)+hmax*0.012*(p.noise(x*0.08+ns)-0.5)*2; }
      ridge[i]=Math.min(yb,yv); }
    const m={x0,x1,yb,hmax,far,ridge,step,len,top:Math.min(...ridge),front:[],veins:[],crest,spurs:[],planes:{},bundles:[]}; m.relief=yb-m.top;
    m.r=x=>{ if(x<x0||x>x1)return yb; const f=(x-x0)/step,i=Math.floor(f),a=ridge[Math.min(i,len-1)],b=ridge[Math.min(i+1,len-1)]; return a+(b-a)*(f-i); };
    const bs=rr(0,1000);
    m.bank=far?()=>yb:x=>{ const u=clamp((x-x0)/(x1-x0),0,1), t=Math.sin(Math.PI*u); const raw=yb+Math.pow(t,0.9)*(2.4*Math.sin(x*0.025+bs)+8*(p.noise(x*0.012+bs)-0.5)); return Math.max(raw,m.r(x)+0.35*t); };
    m.inside=(x,y)=>x>=x0&&x<=x1&&y>=m.r(x)&&y<=m.bank(x);
    m.d=(x,y)=>{const q=m.r(x); return (y-q)/Math.max(1,m.bank(x)-q);};
    m.slope=x=>(m.r(x+4)-m.r(x-4))/8;
    const sm=new Float32Array(len); for(let i=0;i<len;i++){ if(i<2||i>=len-2){sm[i]=ridge[i];continue;} sm[i]=(ridge[i-2]+2*ridge[i-1]+3*ridge[i]+2*ridge[i+1]+ridge[i+2])/9; }
    let raw=[]; const need=Math.max(5,hmax*0.025); for(let i=20;i<len-20;i++){ if(!(sm[i]<sm[i-1]&&sm[i]<=sm[i+1]))continue; let left=-1e9,right=-1e9; for(let j=6;j<=20;j++){ left=Math.max(left,sm[i-j]); right=Math.max(right,sm[i+j]); } if(Math.min(left,right)-sm[i]>need)raw.push(x0+i*step); }
    const pk=[]; for(const x of raw){ const j=pk.length-1; if(j>=0&&x-pk[j]<26){ if(m.r(x)<m.r(pk[j]))pk[j]=x; } else pk.push(x); }
    if(!pk.length){ let best=x0; for(let x=x0;x<=x1;x+=2)if(m.r(x)<m.r(best))best=x; pk.push(best); }
    const cutp=[x0]; for(let i=0;i<pk.length-1;i++){ let vx=pk[i],vy=-1e9; for(let x=pk[i];x<=pk[i+1];x+=2)if(m.r(x)>vy){vx=x;vy=m.r(x);} cutp.push(vx); } cutp.push(x1);
    m.pk=pk; m.lobes=pk.map((px,i)=>({px,L:cutp[i],R:cutp[i+1]}));
    m.field=x=>{ const L=m.lobes.find(v=>x>=v.L&&x<=v.R)||m.lobes[0]; const span=x<L.px?L.px-L.L:L.R-L.px; const u=Math.min(1,Math.abs(x-L.px)/Math.max(1,span));
      const peakness=Math.pow(Math.cos(u*Math.PI*0.5),1.15), spine=Math.exp(-0.5*Math.pow((x-L.px)/Math.max(8,(L.R-L.L)*0.1),2));
      return {lobe:L,peakness,spine,sun:x>=L.px?1:0.64,shadow:x<L.px?1:0.38}; };
    // folds: ink lines descending from peaks and ledges that cut the mass into faces. The region right of a fold is one face.
    m.tone=1;
    if(!far){ const cand=pk.slice(); for(const [cx,cy] of crest){ if(R()<0.22&&cy<yb-hmax*0.3&&cy>top+6&&!cand.some(px=>Math.abs(px-cx)<18))cand.push(cx); }
      for(const px of cand){ const py=m.r(px); const sides=pk.includes(px)?[-1,1]:[R()<0.5?-1:1]; for(const side of sides){ if(!pk.includes(px)&&R()<0.3)continue; m.spurs.push({px,py,side,k:rr(0.2,0.8),A:rr(2,9),w:rr(0.025,0.07),ph:rr(0,6.3),id:0}); } }
      m.spurs.forEach((sp,i)=>{ sp.id=i; sp.cap=rr(0.14,0.42); sp.greenEnd=rr(0.55,0.9); sp.ochre=rr(0.35,0.75); sp.dens=rr(0.85,1.15); sp.blue=1; });
      m.planes[-1]={cap:rr(0.14,0.42),greenEnd:rr(0.55,0.9),ochre:rr(0.35,0.75),dens:rr(0.85,1.15),blue:1,id:99,side:1}; }
    m.spurX=(sp,y)=>{ const dy=y-sp.py; return sp.px+sp.side*(dy*sp.k+sp.A*Math.sin(dy*sp.w+sp.ph)); };
    m.planeAt=(x,y)=>{ let best=null,bx=-1e9; for(const sp of m.spurs){ if(y<sp.py)continue; const sx=m.spurX(sp,y)+(p.noise(sp.id*7.1,y*0.05)-0.5)*4; if(sx<x&&sx>bx){bx=sx;best=sp;} } return best||m.planes[-1]; };
    m.foldDist=(x,y)=>{ let d=1e9; for(const sp of m.spurs){ if(y<sp.py)continue; const sx=m.spurX(sp,y); if(sx<=x)d=Math.min(d,x-sx); } return d; };
    m.colour=(x,y)=>{ const f=m.field(x), d=m.d(x,y), pl=far?(m.planes[-1]||{cap:0.3,greenEnd:0.75,ochre:0.6,dens:1,id:0,side:1}):m.planeAt(x,y);
      const lit=x>=f.lobe.px, mineral=smoothstep(42,135,m.relief), n1=p.noise(x*0.014+pl.id*11.7,y*0.016), fd=far?1e9:m.foldDist(x,y);
      const cap=pl.cap*(0.55+0.55*f.spine)*(0.3+0.7*mineral)*(lit?1:1.25);
      const capBlue=d<cap*(0.6+0.8*n1), foldBlue=!lit&&fd<(3+6*(1-Math.min(1,d/0.8)))*(0.7+0.6*p.noise(y*0.03,pl.id))&&d<0.8&&d>0.03;
      return {f,d,cap,lit,fd,isBlue:capBlue||foldBlue,foldBlue,blob:n1-0.5,side:pl.side||(lit?1:-1),greenTop:cap*0.9,greenEnd:pl.greenEnd+(n1-0.5)*0.1,ochreFoot:pl.ochre+(n1-0.5)*0.1,dens:pl.dens}; };
    return m; }
  const hiddenBy=(k,x,y)=>{ const f=M[k].front; for(let j=0;j<f.length;j++)if(f[j].inside(x,y))return true; return false; };
  let MASK_NEAR=null, MASK_WATER=null;
  function raster(mask,m){ for(let x=Math.max(0,Math.floor(m.x0));x<=Math.min(SW-1,Math.ceil(m.x1));x++){ const y0=Math.max(0,Math.floor(m.r(x))), y1=Math.min(SH-1,Math.ceil(m.bank(x))); for(let y=y0;y<=y1;y++)mask[y*SW+x]=1; } }
  function buildMask(){ MASK_NEAR=new Uint8Array(SW*SH); MASK_WATER=new Uint8Array(SW*SH); for(const m of M){ raster(MASK_WATER,m); if(!m.far)raster(MASK_NEAR,m); }
    for(const b of BARS){ for(let x=Math.floor(b.cx-b.rx);x<=Math.ceil(b.cx+b.rx);x++)for(let y=Math.floor(b.cy-b.ry-6);y<=Math.ceil(b.cy+b.ry+6);y++)if(b.inside(x,y)){ MASK_NEAR[y*SW+x]=1; MASK_WATER[y*SW+x]=1; } } }
  const maskAt=(mask,x,y)=>{ if(x<CW)return true; if(x>=SW||y<0||y>=SH)return false; if(mask)return mask[(y|0)*SW+(x|0)]===1; for(const m of M)if(!m.far&&m.inside(x,y))return true; for(const b of BARS)if(b.inside(x,y))return true; return false; };
  const landAt=(x,y)=>maskAt(MASK_NEAR,x,y), waterLandAt=(x,y)=>maskAt(MASK_WATER,x,y);
  const clearAround=(fn,x,y,r)=>!fn(x,y)&&!fn(x-r,y)&&!fn(x+r,y)&&!fn(x,y-r)&&!fn(x,y+r);
  const clearWater=(x,y,r)=>clearAround(waterLandAt,x,y,r), clearStaffWater=(x,y,r)=>clearAround(landAt,x,y,r);
  function makeBar(cx,cy,rx,ry,skew){ return {cx,cy,rx,ry,skew,inside(x,y){ const u=(x-cx)/rx; if(Math.abs(u)>=1)return false; const mid=cy+skew*u+1.2*Math.sin(u*Math.PI*2); return Math.abs(y-mid)<ry*Math.sqrt(1-u*u); }}; }

  // ---------------------------------------------------------------- stroke helpers (all randomness resolved here, at build time)
  const line=(st,x,c,al,w,x1,y1,x2,y2)=>add(st,x,g=>{ g.stroke(...col(c,al)); g.strokeWeight(w); g.strokeCap(g.ROUND); g.line(x1,y1,x2,y2); });
  const pline=(st,x,c,al,w,pts,curve)=>{ if(pts.length<2)return; add(st,x,g=>{ g.noFill(); g.stroke(...col(c,al)); g.strokeWeight(w); g.strokeCap(g.ROUND); g.beginShape(); if(curve){ g.curveVertex(pts[0][0],pts[0][1]); for(const q of pts)g.curveVertex(q[0],q[1]); const l=pts[pts.length-1]; g.curveVertex(l[0],l[1]); } else for(const q of pts)g.vertex(q[0],q[1]); g.endShape(); }); };
  // a horizontal colour run split into brush-length strokes
  function colourRun(st,c,al,w,a,b,y){ let x=a; while(x<b){ const L=rr(35,80), e=Math.min(b,x+L), y1=y+rr(-0.45,0.45), ym=y+rr(-1,1), y2=y+rr(-0.45,0.45), xm=(x+e)/2, x0=x;
      add(st,xm,g=>{ g.noFill(); g.stroke(...col(c,al)); g.strokeWeight(w); g.strokeCap(g.ROUND); g.bezier(x0,y1,xm-8,ym,xm+8,ym,e,y2); }); if(e>=b)break; x=e-rr(2,6); } }
  // pigment laid as soft dabs on a jittered grid: no scanlines, granular like mineral colour. ink = target coverage 0..1
  function dabsIf(m,k,st,c0,ink,step,rad,pred){ const T=m.tone===undefined?1:m.tone, c=T>=0.99?c0:c0.map((v,i)=>Math.round(v*T+[150,150,140][i]*(1-T))); ink=ink*(0.5+0.5*T); const OVER=Math.PI*rad*rad/(step*step), a=1-Math.pow(1-ink,1/Math.max(1,OVER)); let group=[];
    const flush=()=>{ if(!group.length)return; const ds=group, cc=c; add(st,ds[0][0],g=>{ const ctx=g.drawingContext; for(const d of ds){ const gr=ctx.createRadialGradient(d[0],d[1],0,d[0],d[1],d[2]); gr.addColorStop(0,`rgba(${cc[0]},${cc[1]},${cc[2]},${d[3]})`); gr.addColorStop(0.6,`rgba(${cc[0]},${cc[1]},${cc[2]},${(d[3]*0.85).toFixed(3)})`); gr.addColorStop(1,`rgba(${cc[0]},${cc[1]},${cc[2]},0)`); ctx.fillStyle=gr; ctx.beginPath(); if(d[4]!==undefined)ctx.ellipse(d[0],d[1],d[2]*1.7,d[2]*0.75,d[4],0,Math.PI*2); else ctx.arc(d[0],d[1],d[2],0,Math.PI*2); ctx.fill(); } }); group=[]; };
    for(let y=Math.floor(m.top)-2;y<=m.yb+4;y+=step){ for(let x=m.x0;x<=m.x1;x+=step){ const xx=x+rr(-step*0.5,step*0.5), yy=y+rr(-step*0.5,step*0.5); if(!m.inside(xx,yy)||hiddenBy(k,xx,yy))continue; const F=m.colour(xx,yy); if(!pred(F,xx,yy))continue;
        if(st!==6&&p.noise(xx*0.02+st*5,yy*0.02)<0.3&&R()<0.6)continue; const edge=Math.min(yy-m.r(xx),m.bank(xx)-yy); const rr_=Math.min(rad*Math.exp(rr(-0.6,0.55)),Math.max(1.2,edge*0.9+0.5)); const dab=[xx,yy,rr_,(st===6?a*rr(0.9,1.1):a*rr(0.75,1.25)*(0.8+0.5*p.noise(xx*0.05,yy*0.05))).toFixed(3)]; if(st===5||st===6){ if(st===6&&!F.foldBlue&&R()<0.6*Math.pow(F.d/Math.max(0.01,F.cap*1.5),2))continue; dab.push(Math.atan2(1,(F.lit?1:-1)*rr(0.4,0.9))+rr(-0.2,0.2)); } group.push(dab); if(group.length>=8)flush(); } flush(); } }
  function build(){ const t0=Date.now();
    p.noiseSeed(7);
    // ---------------- composition: designed segments across the painting, colophon paper at the left
    const X0=CW+90, X1=SW-110;
    const clusters=[]; let cx=X0+120; while(cx<X1-380){ const w=rr(420,700); clusters.push({cx:cx+w/2,w}); cx+=w+rr(140,360); }
    const bigA=Math.floor(clusters.length*0.4), bigB=Math.min(clusters.length-1,Math.floor(clusters.length*0.8));
    const pushM=(x0,w,yb,h,far,tone)=>{ x0=clamp(x0,far?CW-80:X0,(far?SW+80:X1)-w); const m=mkMountain(x0,x0+w,yb,h,far); m.tone=tone; M.push(m); return m; };
    clusters.forEach((c,ci)=>{ const big=ci===bigA||ci===bigB, sc=big?1.3:1;
      for(let i=0;i<(big?2:1);i++){ const mm=pushM(c.cx-c.w*rr(0.25,0.4)+rr(-0.2,0.2)*c.w,c.w*rr(0.5,0.8),rr(314,334),rr(200,285)*sc,false,0.9); if(R()<0.75)pushM(mm.x0+(mm.x1-mm.x0)*rr(0.1,0.5),(mm.x1-mm.x0)*rr(0.35,0.6),rr(346,366),rr(40,90),false,1); }
      for(let i=0;i<ri(4,6);i++){ const mm=pushM(c.cx+rr(-0.55,0.55)*c.w-c.w*0.2,c.w*rr(0.28,0.55),rr(324,344),rr(80,190)*sc,false,1); if(R()<0.5)pushM(mm.x0+(mm.x1-mm.x0)*rr(0,0.5),(mm.x1-mm.x0)*rr(0.3,0.6),rr(348,370),rr(30,70),false,1); }
      for(let i=0;i<ri(3,5);i++)pushM(c.cx+rr(-0.6,0.6)*c.w-c.w*0.12,c.w*rr(0.14,0.32),rr(340,362),rr(30,85),false,1);
      for(let i=0;i<ri(1,2);i++)pushM(c.cx+rr(-0.5,0.5)*c.w,rr(120,260),rr(362,384),rr(24,50),false,1);
      for(const sd of [-1,1]){ for(let i=0;i<ri(1,3);i++){ const w=c.w*rr(0.25,0.5); pushM(c.cx+sd*c.w*rr(0.45,0.95)-w/2,w,rr(322,334),rr(60,150),false,rr(0.45,0.65)); } }
      const farL=[[rr(322,328),rr(18,38)],[rr(332,340),rr(28,58)]];
      farL.forEach(([yb,h],li)=>{ if(R()<0.35)return; const w=c.w*rr(0.6,1.1)+li*40; const m=pushM(c.cx-w/2+rr(-0.3,0.3)*c.w,w,yb,h,true,1); m.layer=li; }); });
    for(let i=0;i<7;i++){ const w=rr(110,240), x0=rr(X0,X1-w); M.push(mkMountain(x0,x0+w,rr(376,412),rr(22,48),false)); }
    M.sort((a,b)=>(b.far?1:0)-(a.far?1:0)||a.yb-b.yb);
    M.forEach((m,k)=>{ for(let j=k+1;j<M.length;j++){ const n=M[j]; if(!n.far&&n.x1>m.x0&&n.x0<m.x1)m.front.push(n); } });
    for(let i=0;i<12;i++){ const rx=rr(35,110), ry=rr(3,9), cx=rr(X0+60,X1-60), cy=rr(YW+24,SH-26), b=makeBar(cx,cy,rx,ry,rr(-4,4)); let ok=true; for(let x=cx-rx-8;x<=cx+rx+8;x+=8)if(landAt(x,cy-ry-4)||landAt(x,cy+ry+4))ok=false; if(ok)BARS.push(b); }
    buildMask();
    // ---------------- stage 0: silk revealed in 50-px columns
    for(let x=0;x<SW;x+=50){ const a=x,w=Math.min(50,SW-x); add(0,a+25,g=>g.image(silkImg,a,0,w,SH,a,0,w,SH)); }
    // ---------------- stages 1–6 per mountain
    M.forEach((m,k)=>{
      const W=m.x1-m.x0, depthA=1;
      if(m.far){ const ik=[0.08,0.12,0.16][m.layer||0]; dabsIf(m,k,7,C.far,ik,6,7,F=>true); dabsIf(m,k,7,C.far,ik*0.6,6,6,F=>F.d>0.45); return; }
      // ---- 勾勒: broken contour with pressure; bank line; folds as ink
      const T=m.tone, inkA=v=>Math.round(v*(0.55+0.45*T));
      const outline=(st,pts,w,al)=>{ if(pts.length<2)return; const q=pts.map(v=>[v[0]+(R()-0.5)*0.6,v[1]+(R()-0.5)*0.6]); const n=q.length; if(n<5){ pline(st,q[0][0],C.ink,al,w,q); return; } const a=Math.floor(n*0.35), b=Math.floor(n*0.72); pline(st,q[0][0],C.ink,al*0.8,w*0.6,q.slice(0,a+1)); pline(st,q[0][0],C.ink,al,w*1.25,q.slice(a,b+1)); pline(st,q[0][0],C.ink,al*0.85,w*0.7,q.slice(b)); };
      const bone=m.yb>=338?1.35:1; let run=[], want=rr(8,15); for(let x=m.x0;x<=m.x1;x+=4){ const y=m.r(x); if(hiddenBy(k,x,y+0.5)){ if(run.length>3)outline(1,run,rr(0.9,1.9)*bone,inkA(rr(130,185))); run=[]; continue; } run.push([x,y]); if(run.length>=want){ if(R()<0.82)outline(1,run,rr(0.9,2.0)*bone,inkA(rr(130,185))); run=[[x,y]]; want=rr(8,15); } } if(run.length>3)outline(1,run,1.2*bone,inkA(160));
      run=[]; for(let x=m.x0;x<=m.x1;x+=5){ const y=m.bank(x); if(hiddenBy(k,x,y-0.5)||y<YW-6||R()<0.06){ outline(1,run,0.55,inkA(110)); run=[]; continue; } run.push([x,y]); if(run.length>=12){ outline(1,run,0.55,inkA(110)); run=[[x,y]]; } } outline(1,run,0.55,inkA(110));
      for(let x=m.x0;x<m.x1;x+=30){ const a=x,b=Math.min(m.x1,x+30),y=m.bank((a+b)/2); if(y>=YW-6&&!hiddenBy(k,(a+b)/2,y+1))line(3,a,C.ochre,45,0.9,a,m.bank(a)+1,b,m.bank(b)+1); }
      for(const sp of m.spurs){ const pts=[]; for(let y=sp.py+3;y<m.bank(sp.px)-4;y+=rr(4,7)){ const x=m.spurX(sp,y); if(!m.inside(x,y)||hiddenBy(k,x,y))break; pts.push([x,y]); }
        if(pts.length>3){ m.veins.push(pts); sp.pts=pts;
          let seg=[]; for(let i=0;i<pts.length;i++){ seg.push(pts[i]); if(seg.length>=ri(4,8)||i===pts.length-1){ if(R()<0.8)pline(1,sp.px,C.ink,inkA(rr(100,150)),rr(0.7,1.4),seg,true); seg=[pts[i]]; } } } }
      for(const L of m.lobes){ L.visible=false; for(let x=L.L;x<=L.R;x+=6)if(!hiddenBy(k,x,m.r(x)+2)){ L.visible=true; break; } }
      // ---- 皴 grown from the folds: on the shaded side short tapered strokes leave the fold and run downhill; sparse on the lit side
      if(m.relief>=40) for(const sp of m.spurs){ if(!sp.pts)continue; const pts=sp.pts;
        for(let i=1;i<pts.length;i++){ const [fx,fy]=pts[i];
          for(const side of [-1,1]){ const shaded=side===-1; if(!shaded&&R()<0.7)continue; if(shaded&&R()<0.25)continue;
            const n=shaded?ri(2,5):1, hairs=[]; for(let h=0;h<n;h++){ const sx=fx+side*rr(0.5,5), sy=fy+rr(-2,3); if(!m.inside(sx,sy)||hiddenBy(k,sx,sy))continue;
              const ang=Math.atan2(1,side*rr(0.5,1.4))+rr(-0.2,0.2), L=rr(4,15)*(0.6+0.4*smoothstep(40,140,m.relief)), w=rr(0.35,0.75), wv=rr(-1.1,1.1); const ex=sx+Math.cos(ang)*L, ey=sy+Math.sin(ang)*L; if(!m.inside(ex,ey)||hiddenBy(k,ex,ey))continue;
              hairs.push([sx,sy,(sx+ex)/2-Math.sin(ang)*wv,(sy+ey)/2+Math.cos(ang)*wv,ex,ey,w]); }
            if(!hairs.length)continue; const al=inkA((shaded?80:50)*rr(0.8,1.15)); m.bundles.push({x:fx,y:fy,hairs,d:m.d(fx,fy)});
            add(2,fx,g=>{ g.noFill(); g.stroke(...col(C.ink,al)); for(const h of hairs){ g.strokeWeight(h[6]); g.line(h[0],h[1],h[2],h[3]); g.strokeWeight(h[6]*0.5); g.line(h[2],h[3],h[4],h[5]); } }); } } }
      if(m.relief>=40) for(let x=m.x0+6;x<m.x1-6;x+=rr(6,12)){ const lit=x>=m.field(x).lobe.px; if(lit&&R()<0.75)continue; const y=m.r(x)+rr(2,5); if(!m.inside(x,y)||hiddenBy(k,x,y))continue; const ang=Math.atan2(1,(lit?1:-1)*rr(0.3,1))+rr(-0.25,0.25), L=rr(3,9), w=rr(0.4,0.8), ex=x+Math.cos(ang)*L, ey=y+Math.sin(ang)*L; if(!m.inside(ex,ey))continue; const al=inkA(rr(70,110)); add(2,x,g=>{ g.stroke(...col(C.ink,al)); g.strokeWeight(w); g.line(x,y,ex,ey); }); }
      // ---- colour per face: ochre preparation everywhere, malachite on the middle of each face, azurite thick on caps and along shaded folds thinning downhill
      dabsIf(m,k,3,C.ochre,0.5,5,4.6,F=>true); dabsIf(m,k,3,C.ochre2,0.3,5,4.4,F=>F.d>F.ochreFoot);
      dabsIf(m,k,4,C.zhilv,0.36,5,4.8,(F,x,y)=>F.d>0.2&&F.d<F.greenEnd+0.1&&p.noise(x*0.012+3,y*0.015)>0.3);
      dabsIf(m,k,5,C.shilv,0.7,3.5,4,(F,x,y)=>!F.isBlue&&F.d>F.greenTop&&F.d<F.greenEnd&&p.noise(x*0.012,y*0.016)>0.3); dabsIf(m,k,5,C.shilv,0.45,4.5,4,(F,x,y)=>!F.isBlue&&F.d>F.greenTop+0.05&&F.d<F.greenEnd-0.05&&p.noise(x*0.018+9,y*0.02)>0.45&&F.lit); dabsIf(m,k,5,C.shilv2,0.3,5,4.2,(F,x,y)=>!F.isBlue&&F.lit&&F.d>F.greenTop&&F.d<F.greenTop+0.45*(F.greenEnd-F.greenTop)&&p.noise(x*0.015+20,y*0.02)>0.42);
      dabsIf(m,k,6,C.shiqing,0.86,2.8,3.4,F=>F.isBlue); dabsIf(m,k,6,C.shiqing3,0.42,3,3,F=>F.foldBlue||(F.isBlue&&!F.lit&&F.d<F.cap*0.5)); dabsIf(m,k,6,C.shiqing2,0.3,4,3.2,F=>F.isBlue&&F.lit&&F.d>F.cap*0.4);
      for(let i=0;i<W*(m.yb-m.top)/2000;i++){ const x=m.x0+R()*W, y=m.top+R()*(m.yb-m.top); if(!m.inside(x,y)||hiddenBy(k,x,y))continue; const F=m.colour(x,y), r=rr(0.5,1.2);
        if(F.isBlue){ const dark=R()<0.04, gc=dark?C.ink:C.shiqing2, ga=dark?35:rr(65,105); add(6,x,g=>{ g.noStroke(); g.fill(...col(gc,ga)); g.circle(x,y,r*2); }); }
        else if(F.d<F.greenEnd)add(5,x,g=>{ g.noStroke(); g.fill(...col(C.shilv2,100)); g.circle(x,y,r*2); }); }
      // ---- 复勾 (stage 8): re-trace the contour thinly after colour, a quarter of it left off
      run=[]; want=rr(8,15); for(let x=m.x0;x<=m.x1;x+=4){ const y=m.r(x); if(hiddenBy(k,x,y+0.5)){ if(run.length>3&&R()<0.75)outline(8,run,rr(0.5,0.8),rr(70,110)); run=[]; continue; } run.push([x+(R()-0.5)*0.5,y+(R()-0.5)*0.5]); if(run.length>=want){ if(R()<0.75)outline(8,run,rr(0.5,0.8),rr(70,110)); run=[run[run.length-1]]; want=rr(8,15); } } if(run.length>3)outline(8,run,0.6,90);
      // ---- 复皴 (stage 8): a third of the bundles restated over the green and ochre
      for(const b of m.bundles){ if(b.d<0.3||R()<0.65)continue; const hairs=b.hairs; add(8,b.x,g=>{ g.noFill(); g.stroke(...col(C.ink,55)); for(const h of hairs){ g.strokeWeight(h[6]*0.9); g.line(h[0],h[1],h[2],h[3]); g.strokeWeight(h[6]*0.5); g.line(h[2],h[3],h[4],h[5]); } }); }
    });
    // sandbars: ochre short strokes (stage 3) and grass (stage 8)
    for(const b of BARS){ for(let y=b.cy-b.ry;y<=b.cy+b.ry;y+=2.2){ let sx=null; for(let x=b.cx-b.rx;x<=b.cx+b.rx+2;x+=2){ const ok=b.inside(x,y); if(ok&&sx===null)sx=x; if(!ok&&sx!==null){ if(x-sx>4)colourRun(3,C.ochre,rr(44,60),2.8,sx,x,y); sx=null; } } }
      for(let x=b.cx-b.rx*0.8;x<b.cx+b.rx*0.8;x+=rr(6,14)){ const u=(x-b.cx)/b.rx, half=b.ry*Math.sqrt(Math.max(0,1-u*u)), y=b.cy+b.skew*u+1.2*Math.sin(u*Math.PI*2)-half*0.55; const n=ri(2,4); add(8,x,g=>{ g.stroke(...col(C.tree2,150)); g.strokeWeight(0.5); for(let i=0;i<n;i++)g.line(x+i*1.3,y,x+i*1.3+(i-1)*0.8,y-3); }); } }
    // ---------------- water tint (stage 4) then 网巾纹 (stage 7)
    const nearLand=(x,y)=>{ for(const k of [8,14,22,30]){ if(waterLandAt(x,y-k)||waterLandAt(x,y+k)||waterLandAt(x-k,y)||waterLandAt(x+k,y))return true; } return false; };
    function shoreBend(x,y){ let v=0; for(let dx=-18;dx<=18;dx+=6){ const w=Math.exp(-dx*dx/120); if(waterLandAt(x+dx,y-6))v+=w; if(waterLandAt(x+dx,y+6))v-=w; } return clamp(v*0.58,-1.8,1.8); }
    function chunks(st,pts,c,al,sw,len){ let a=0; while(a<pts.length-1){ const want=len||rr(70,190); let b=a+1; while(b+1<pts.length&&pts[b][0]-pts[a][0]<want)b++;
        const seg=pts.slice(a,b+1); add(st,(seg[0][0]+seg[seg.length-1][0])/2,g=>{ g.noFill(); g.stroke(...col(c,al)); g.strokeWeight(sw); g.strokeCap(g.PROJECT); g.beginShape(); for(let i=seg.length-1;i>=0;i--)g.vertex(seg[i][0],seg[i][1]); g.endShape(); });
        if(b===pts.length-1)break; a=b; } }
    for(let y=YW+10;y<SH-2;y+=5){ const q=(y-YW-10)/(SH-YW-10), al=(5+4*q)*Math.min(1,0.3+q*4); let run=[]; const fl=()=>{ if(run.length>3)chunks(4,run,C.huaqing,al,16,1e9); run=[]; }; for(let x=CW;x<=SW;x+=4){ if(clearWater(x,y,6))run.push([x,y+0.25*Math.sin(x*0.1)]); else fl(); } fl(); }
    for(let y=YW+15;y<SH-2;y+=8){ let run=[]; for(let x=CW;x<=SW;x+=4){ if(clearWater(x,y,6))run.push([x,y]); else { if(run.length>3)chunks(4,run,C.zhilv,3,16,1e9); run=[]; } } if(run.length>3)chunks(4,run,C.zhilv,3,16,1e9); }
    { let y=YW+8,row=0; while(y<SH-3){ const q=clamp((y-YW-8)/(SH-YW-8),0,1), lam=24+16*Math.pow(q,0.75), amp=0.28+0.45*Math.pow(q,0.8), ph=row*Math.PI+0.12*Math.sin(row*0.79), al=(14+14*Math.pow(q,0.82))*(0.3+0.7*smoothstep(0,0.26,q)), sw=0.32+0.14*q;
        let run=[]; const flush=()=>{ if(run.length>2&&R()>0.08)chunks(7,run,C.waterInk,al,sw); run=[]; };
        for(let x=CW+2;x<=SW-2;x+=2){ const y0=y+amp*Math.sin(2*Math.PI*x/lam+ph)+amp*0.16*Math.sin(2*Math.PI*x/(3.7*lam)+row*0.31), yy=y0+shoreBend(x,y0); if(clearWater(x,yy,2)&&nearLand(x,yy)&&p.noise(x*0.012,row*0.9)>0.48)run.push([x,yy]); else flush(); }
        flush(); y+=(1.7+0.9*Math.pow(q,0.7))*rr(0.92,1.1); row++; } }
    // ---------------- stage 8: moss, trees, compounds, paths, bridges, boats, waterfalls
    const dianYe=(x,y,h,flip)=>{ const s=h/12, leaf=[[-4,-8],[-2,-10],[1,-9],[4,-7],[-3,-6],[0,-6],[3,-5]].map(v=>[x+v[0]*flip*s+(R()-0.5)*s,y+v[1]*s+(R()-0.5)*s,(R()<0.3?1.65:1.25)*s]);
      add(8,x,g=>{ g.noFill(); g.stroke(...col(C.ink,225)); g.strokeWeight(0.55); g.bezier(x,y,x+flip,y-4*s,x-2*flip*s,y-7*s,x,y-10*s); g.line(x,y-6*s,x-4*flip*s,y-8*s); g.line(x,y-7*s,x+4*flip*s,y-7*s); g.stroke(...col(C.ink,230)); for(const v of leaf){ g.strokeWeight(v[2]); g.point(v[0],v[1]); } }); };
    const jiaYe=(x,y,h,flip)=>{ const s=h/12, leaf=[[-4,-8],[-1,-10],[2,-9],[4,-7],[-2,-6],[1,-6]].map(v=>[x+v[0]*flip*s+(R()-0.5)*s,y+v[1]*s]);
      add(8,x,g=>{ g.noFill(); g.stroke(...col(C.ink,215)); g.strokeWeight(0.5); g.line(x,y,x,y-10*s); g.line(x,y-6*s,x-4*flip*s,y-8*s); g.line(x,y-7*s,x+4*flip*s,y-9*s); g.stroke(...col(C.tree,175)); g.strokeWeight(0.42); g.fill(...col(C.shilv2,90)); for(const v of leaf)g.ellipse(v[0],v[1],2.5*s,1.35*s); }); };
    const song=(x,y,h,flip)=>{ const s=h/15, lean=rr(-1.5,1.5), crown=rr(0.84,1.16), missing=ri(0,3); add(8,x,g=>{ g.noFill(); g.stroke(...col(C.ink,230)); g.strokeWeight(0.65); g.bezier(x,y,x-2*flip*s+lean,y-5*s,x+2*flip*s+lean,y-10*s,x+lean,y-14*s); g.stroke(...col(C.ink,215)); g.strokeWeight(0.45);
      for(let j=0;j<4;j++){ if(j===missing)continue; const yy=y-(5+j*2.5)*s, w=(6-j*0.75)*s*crown, cx=x+lean*(j+1)/4; for(let n=-2;n<=2;n++)g.line(cx,yy,cx+flip*(n*w/2.4),yy-(1+Math.abs(n)*0.45)*s); } }); };
    const liu=(x,y,h,flip)=>{ const s=h/15, nb=ri(5,8), drops=[]; for(let i=0;i<nb;i++)drops.push([(i-(nb-1)/2)*1.15*s,rr(0.75,1.2)]); add(8,x,g=>{ g.noFill(); g.stroke(...col(C.trunk,180)); g.strokeWeight(0.68); g.bezier(x,y,x-2*flip*s,y-6*s,x+1*flip*s,y-10*s,x,y-14*s); g.stroke(...col(C.tree2,150)); g.strokeWeight(0.42);
      for(const [o,dr] of drops){ const sx=x+o; g.bezier(sx,y-11*s,sx+3*flip*s,y-8*s,sx+2*flip*s,y-(11-7*dr)*s,sx+4*flip*s,y-(11-10*dr)*s); g.line(sx+2*flip*s,y-6*s,sx+3.2*flip*s,y-6.7*s); } }); };
    const SIZES=[6,8,10,13,16]; const pick=()=>SIZES[ri(0,4)], flip=()=>R()<0.5?1:-1;
    const shoreTree=(x,y)=>(R()<0.45?liu:dianYe)(x,y,pick(),flip()), slopeTree=(x,y)=>(R()<0.7?jiaYe:dianYe)(x,y,pick(),flip()), ridgeTree=(x,y)=>(R()<0.75?song:jiaYe)(x,y,pick(),flip());
    const compound=(x,y,s,dir)=>{ VILL.push([x,y]); add(8,x,g=>{ g.push(); g.translate(x,y); g.scale(dir,1); g.stroke(...col(C.ink,215)); g.strokeWeight(0.5); g.noFill();
      g.line(-16*s,-1*s,15*s,-1*s); g.line(-16*s,-1*s,-12*s,-7*s); g.line(15*s,-1*s,12*s,-6*s); for(let px=-15;px<=15;px+=5)g.line(px*s,-1*s,px*s,-3*s);
      const hall=(ox,oy,w,h)=>{ g.fill(...col(C.silk,220)); g.quad(ox,oy-h,ox+w,oy-h,ox+w,oy,ox,oy); g.fill(62,58,48,175); g.quad(ox-2*s,oy-h,ox+w+2*s,oy-h,ox+w-1*s,oy-h-3*s,ox+1*s,oy-h-3*s); g.line(ox+w*0.5,oy-h,ox+w*0.5,oy); };
      hall(-11*s,-2*s,10*s,6*s); hall(2*s,-1*s,9*s,5*s); g.pop(); }); };
    const footpath=(m,k,footX,peakX)=>{ const pts=[]; for(let i=0;i<=18;i++){ const t=i/18, d=0.93-0.66*t, x=footX+(peakX-footX)*t+Math.sin(t*Math.PI*5)*6*(1-t), y=m.r(x)+d*(m.bank(x)-m.r(x)); if(m.inside(x,y)&&!hiddenBy(k,x,y))pts.push([x,y]); }
      if(pts.length>6&&R()<0.5){ const xm=(footX+peakX)/2; const keep=pts.slice(0,Math.ceil(pts.length*rr(0.4,0.7))); for(let i=0;i+2<keep.length;i+=2){ if(R()<0.45)continue; const seg=keep.slice(i,i+3); pline(8,xm,C.paper,rr(80,120),rr(0.9,1.3),seg,true); } } };
    M.forEach((m,k)=>{ if(m.far)return; const W=m.x1-m.x0;
      for(let x=m.x0+8;x<m.x1-8;x+=rr(10,16)){ const y=m.r(x); if(hiddenBy(k,x,y+1)||R()<0.35)continue; const ds=[]; for(let i=0;i<ri(2,4);i++)ds.push([x+(R()-0.5)*5,y+1+R()*3,rr(0.8,1.5),rr(155,205)]); add(8,x,g=>{ g.noStroke(); for(const d of ds){ g.fill(...col(C.tree,d[3])); g.circle(d[0],d[1],d[2]); } }); }
      for(const vein of m.veins){ for(let i=2;i<vein.length-2;i+=ri(2,4)){ if(R()<0.45)continue; const [x,y]=vein[i]; const ds=[]; for(let j=0;j<ri(2,4);j++)ds.push([x+rr(-2.2,2.2),y+rr(-1.2,1.8),rr(0.75,1.25)]); add(8,x,g=>{ g.noStroke(); g.fill(...col(C.tree,170)); for(const q of ds)g.circle(q[0],q[1],q[2]); }); } }
      for(let gv=0;gv<W/110;gv++){ const gx=m.x0+R()*W, gd=rr(0.5,0.9), n=ri(3,9), far=m.yb<330; for(let i=0;i<n;i++){ const x=gx+rr(-24,24), d=gd+rr(-0.07,0.07), y=m.r(x)+d*(m.bank(x)-m.r(x)); if(!m.inside(x,y)||hiddenBy(k,x,y))continue; const h=far?rr(5,9):rr(7,15); (R()<0.65?jiaYe:dianYe)(x,y,h,flip()); } }
      for(let i=0;i<W/120;i++){ const x=m.x0+R()*W, d=rr(0.45,0.9), y=m.r(x)+d*(m.bank(x)-m.r(x)); if(!m.inside(x,y)||hiddenBy(k,x,y))continue; slopeTree(x,y); }
      if(m.hmax>120){ for(const L of m.lobes){ if(!L.visible)continue; const x=L.px+rr(-14,14), y=m.r(x)+2; if(m.inside(x,y+2)&&!hiddenBy(k,x,y)&&R()<0.7)ridgeTree(x,y); } }
      if(m.yb>=YW-6){ let x=m.x0+6; while(x<m.x1-6){ const y=m.bank(x)-1; if(!hiddenBy(k,x,y-1)&&R()<0.55)shoreTree(x,y); x+=rr(7,15); } }
      if(m.hmax<80){ for(let x=m.x0+10;x<m.x1-10;x+=rr(12,22)){ const y=m.r(x)+1; if(!hiddenBy(k,x,y)&&R()<0.7)(R()<0.5?dianYe:jiaYe)(x,y,pick(),flip()); } }
      // compounds on terraces, with a path climbing toward the nearest peak
      if(W>140&&R()<0.65){ for(let tries=0;tries<30;tries++){ const x=m.x0+W*rr(0.15,0.85), d=rr(0.82,0.95), y=m.r(x)+d*(m.bank(x)-m.r(x)); if(!m.inside(x,y)||hiddenBy(k,x-20,y)||hiddenBy(k,x+20,y)||Math.abs(m.slope(x))>0.18)continue;
          const n=ri(1,2), dir=flip(), sites=[]; for(let i=0;i<n;i++){ const xi=x+i*36*dir, yi=m.r(xi)+d*(m.bank(xi)-m.r(xi)); const ok=xi>m.x0+18&&xi<m.x1-18&&m.inside(xi,yi)&&Math.abs(m.slope(xi))<0.22&&!hiddenBy(k,xi-16,yi)&&!hiddenBy(k,xi+16,yi); if(!ok){ sites.length=0; break; } sites.push([xi,yi]); }
          if(!sites.length)continue; sites.forEach(v=>compound(v[0],v[1],rr(0.82,1.08),dir)); for(let i=0;i<ri(6,11);i++)shoreTree(x+rr(-30,30+n*36),y+rr(-3,4)); footpath(m,k,x-14*dir,m.field(x).lobe.px); break; } }
    });
    // waterfalls: blank silk core with two faint ink edges, then a stream to the bank
    M.filter(m=>!m.far&&m.lobes.length>=2&&m.hmax>110).slice(0,7).forEach(m=>{ const k=M.indexOf(m), i=ri(0,m.lobes.length-2), vx=m.lobes[i].R, vy=m.r(vx); const fallH=m.bank(vx)-vy; if(!m.lobes[i].visible||fallH<24||hiddenBy(k,vx,vy+8))return; const yEnd=vy+fallH*rr(0.45,0.7);
      const pts=[]; for(let y=vy+3;y<yEnd;y+=4){ const xx=vx+Math.sin(y*0.2)*0.8; if(hiddenBy(k,xx,y))break; pts.push([xx,y]); } if(pts.length<3)return; const s2=[[vx,yEnd],[vx+4,yEnd+6],[vx-5,yEnd+13],[vx+2,m.bank(vx)-2]];
      pline(8,vx,C.silk,200,2,pts); pline(8,vx,C.ink,90,0.5,pts.map(v=>[v[0]-1.8,v[1]])); pline(8,vx,C.ink,80,0.45,pts.map(v=>[v[0]+1.8,v[1]])); pline(8,vx,C.silk,140,0.9,s2,true); });
    // bridges: land – water gap of 80–170 px – land
    { const found=[]; for(let y=YW+12;y<YW+60&&found.length<3;y+=6){ let land=landAt(X0,y), start=null; for(let x=X0;x<X1;x+=4){ const l=landAt(x,y); if(land&&!l)start=x; if(!land&&l&&start!==null){ const L=x-start; if(L>=80&&L<=170&&!found.some(f=>Math.abs(f[0]-start)<300&&Math.abs(f[1]-y)<40)){ let ok=landAt(start-8,y)&&landAt(x+8,y); for(let t=start+6;t<x-6;t+=6)if(landAt(t,y-8)||landAt(t,y+8))ok=false; if(ok)found.push([start-8,y,L+16]); } start=null; } land=l; } }
      found.forEach(([x,y,L],bi)=>{ for(let s=0;s<L;s+=50){ const a=x+s,b=Math.min(x+L,a+50); add(8,a,g=>{ g.stroke(...col(C.ink,190)); g.strokeWeight(0.75); g.line(a,y,b,y); g.line(a,y-3,b,y-3); for(let t=a;t<b;t+=24)if(t>x+4&&t<x+L-4){ g.line(t-2,y,t-3,y+6); g.line(t+2,y,t+3,y+6); g.line(t-3,y+6,t+3,y+6); } for(let t=a;t<b;t+=12){ g.line(t,y-3,t,y-6); } }); }
        if(bi===0){ const cx=x+L/2; add(8,cx,g=>{ g.stroke(...col(C.ink,190)); g.strokeWeight(0.6); g.fill(...col(C.silk,225)); g.rect(cx-8,y-10,16,7); g.noStroke(); g.fill(62,58,48,190); g.quad(cx-11,y-10,cx+11,y-10,cx+7,y-14,cx-7,y-14); g.quad(cx-6,y-14,cx+6,y-14,cx+3,y-18,cx-3,y-18); }); } }); }
    // boats: a third near villages, the rest on open water
    { const boat=(x,y,s,dir,fisher)=>add(8,x,g=>{ g.push(); g.translate(x,y); g.scale(dir,1); g.noFill(); g.stroke(...col(C.ink,205)); g.strokeWeight(0.62); g.bezier(-11*s,0,-7*s,4*s,8*s,4*s,12*s,0); g.line(-11*s,0,12*s,0);
        if(!fisher){ g.fill(...col(C.silk,210)); g.quad(-4*s,-1*s,5*s,-1*s,4*s,-5*s,-3*s,-5*s); g.noFill(); g.line(-5*s,-5*s,6*s,-5*s); g.line(-3*s,-7*s,4*s,-7*s); g.line(-3*s,-7*s,-5*s,-5*s); g.line(4*s,-7*s,6*s,-5*s); g.line(9*s,-1*s,15*s,-6*s); }
        else { g.strokeWeight(1.1); g.point(-3*s,-3*s); g.strokeWeight(0.55); g.line(-3*s,-2*s,-1*s,-6*s); g.line(-1*s,-6*s,-14*s,-3*s); g.line(6*s,0,10*s,-5*s); }
        g.stroke(...col(C.far,80)); g.strokeWeight(0.42); g.bezier(-14*s,3*s,-8*s,5*s,-3*s,4*s,1*s,4*s); g.bezier(5*s,4*s,10*s,4*s,14*s,3*s,18*s,2*s); g.pop(); });
      let n=0,tries=0; while(n<13&&tries<400){ tries++; let x,y; if(n<5&&VILL.length){ const v=VILL[ri(0,VILL.length-1)]; x=v[0]+rr(-160,160); y=v[1]+rr(14,60); } else { x=rr(X0,X1); y=rr(YW+26,SH-14); }
        if(y<YW+20||y>SH-8||!clearStaffWater(x,y,16))continue; boat(x,y,rr(0.45,1.25),flip(),R()<0.5); n++; } }
    // ---------------- stage 9: mist as silk, seals, colophon
    const silkMist=(m,k,x0,x1,y,phase,foot)=>{ const spec=foot?[[18,18],[12,23],[6,28]]:[[15,20],[9,25],[4.5,30]]; for(const [sw,al] of spec){ let run=[]; const fl=()=>{ if(run.length>2)pline(9,(run[0][0]+run[run.length-1][0])/2,C.silk,al,sw,run,true); run=[]; };
      for(let x=x0;x<=x1;x+=8){ const u=(x-x0)/(x1-x0), taper=Math.pow(Math.sin(Math.PI*u),0.65), yy=y+Math.sin(u*Math.PI*2+phase)*3*taper+Math.sin(u*Math.PI*5+phase*0.6)*0.8; if(hiddenBy(k,x,yy)||hiddenBy(k,x,yy-sw*0.55)||hiddenBy(k,x,yy+sw*0.55))fl(); else run.push([x,yy]); } fl(); } };
    M.forEach((m,k)=>{ if(m.far)return; for(let i=0;i<m.lobes.length-1;i++){ if(R()<0.4)continue; const sx=m.lobes[i].R, L=rr(70,180); silkMist(m,k,sx-L/2,sx+L/2,m.r(sx)+rr(8,18),rr(0,6),false); }
      if(m.hmax>150&&R()<0.8){ const L=rr(140,300), cx=m.x0+(m.x1-m.x0)*rr(0.25,0.75); silkMist(m,k,cx-L/2,cx+L/2,m.bank(cx)-rr(4,10),rr(0,6),true); } });
    const sealStamp=(st,x,y,sz,text)=>{ const rot=rr(-3,3)*Math.PI/180, offs=[[0,0],[rr(-0.8,0.8),rr(-0.8,0.8)],[rr(-0.8,0.8),rr(-0.8,0.8)]], chips=[]; for(let i=0;i<30;i++){ const px=rr(-0.5,0.5)*sz, py=rr(-0.5,0.5)*sz; if(Math.abs(px)>sz*0.4||Math.abs(py)>sz*0.4)chips.push([px,py,rr(0.5,1.6)]); }
      const chars=[...text], cell=sz/2; add(st,x,g=>{ const c=g.drawingContext; c.save(); c.translate(x+sz/2,y+sz/2); c.rotate(rot);
        offs.forEach((o,i)=>{ c.fillStyle=`rgba(178,52,40,${i===0?0.8:0.22})`; c.beginPath(); c.roundRect(-sz/2+o[0],-sz/2+o[1],sz,sz,2); c.fill(); });
        c.fillStyle='rgba(241,231,210,0.92)'; c.font=`bold ${Math.round(sz*(chars.length>2?0.42:0.5))}px "Ma Shan Zheng","Kaiti SC",serif`; c.textAlign='center'; c.textBaseline='middle';
        chars.forEach((ch,i)=>{ const cx=chars.length>2?(i%2===0?0.5:-0.5)*cell:0, cy=chars.length>2?(i<2?-0.5:0.5)*cell:(i===0?-0.5:0.5)*cell; c.fillText(ch,cx,cy+1); });
        c.fillStyle='rgba(214,196,160,0.75)'; for(const q of chips){ c.beginPath(); c.arc(q[0],q[1],q[2],0,Math.PI*2); c.fill(); } c.restore(); }); };
    // colophon paper (left): Cai Jing's colophon written stroke by stroke with the brush engine, right to left
    { const B=makeBrushText(R), per=14, colGap=24, x0=CW-32;   // 78 characters → 6 columns of 14, 6×24 = 144 px inside a 185 px sheet
      const items=B.brushText({text:COLOPHON,x:x0,y:50,size:18,font:'"Xingkai SC","Ma Shan Zheng"',colGap,perCol:per,dir:-1,over:6,ink:0.82,wander:0.3});
      for(const it of items)add(9,it.x,g=>{ for(const c of it.comps)B.stampDabs(g,c,C.ink); });
      const xl=x0-(Math.ceil(COLOPHON.length/per)-1)*colGap, yEnd=50+(COLOPHON.length-(Math.ceil(COLOPHON.length/per)-1)*per)*18*1.08; sealStamp(9,xl-10,yEnd+14,20,'蔡京'); sealStamp(9,xl-8,yEnd+42,16,'元長');
      add(9,CW-2,g=>{ g.stroke(...col(C.silkDk,120)); g.strokeWeight(1); g.line(CW,0,CW,SH); }); }
    // collector seals at the right end of the painting
    sealStamp(9,SW-36,30,16,'珍藏'); sealStamp(9,SW-36,52,16,'審定'); sealStamp(9,SW-62,SH-48,20,'神品');
    // ---------------- ordering: right to left within each stage
    let idx=0; S.forEach((arr,i)=>{ arr.sort((a,b)=>b.x-a.x); stageStart[i]=idx; for(const s of arr)strokes.push(s); idx+=arr.length; }); stageStart.push(idx);
    boundaries=new Set([4,8].map(i=>stageStart[i]));
    built=true; dirty=true; console.log('strokes',strokes.length,'build ms',Date.now()-t0);
  }
  function bakeSilk(){ silkImg=p.createGraphics(SW,SH); silkImg.pixelDensity(2); const s=silkImg; s.background(...C.silk);
    s.noStroke(); s.fill(...col(C.paper,255)); s.rect(0,0,CW,SH);
    const ctx=s.drawingContext, pd=2, w=SW*pd, h=SH*pd; const img=ctx.getImageData(0,0,w,h), d=img.data; let sd=99; const rn=()=>{ sd|=0; sd=sd+0x6D2B79F5|0; let t=Math.imul(sd^sd>>>15,1|sd); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
    for(let i=0;i<d.length;i+=4){ const n=(rn()-0.5)*3; d[i]+=n; d[i+1]+=n*0.95; d[i+2]+=n*0.8; } ctx.putImageData(img,0,0);
    s.strokeWeight(0.3); s.stroke(...col(C.silkDk,7)); for(let x=0;x<SW;x+=1.3)s.line(x+(x%2.6<1.3?0.15:0),0,x,SH); s.stroke(...col(C.silkDk,4)); for(let y=0;y<SH;y+=1.6)s.line(0,y,SW,y+rr(-0.3,0.3));
    s.stroke(...col(C.silkDk,3)); s.strokeWeight(0.3); for(let i=0;i<12000;i++){ const x=R()*SW, y=R()*SH, L=rr(8,40); s.line(x,y,x+L,y); }
    for(let i=0;i<9;i++){ const x=R()*SW, y=R()*SH, r=rr(400,900); const g0=ctx.createRadialGradient(x*pd,y*pd,0,x*pd,y*pd,r*pd); const tn=R()<0.6?'90,70,40':'230,210,170'; g0.addColorStop(0,`rgba(${tn},0.09)`); g0.addColorStop(1,`rgba(${tn},0)`); ctx.fillStyle=g0; ctx.fillRect((x-r)*pd,(y-r)*pd,r*2*pd,r*2*pd); }
    for(let i=0;i<40;i++){ const x=R()*SW, y=R()*SH, r=rr(100,300); const g=ctx.createRadialGradient(x*pd,y*pd,0,x*pd,y*pd,r*pd); const tone=R()<0.5?'120,100,70':'255,250,235'; g.addColorStop(0,`rgba(${tone},0.05)`); g.addColorStop(1,`rgba(${tone},0)`); ctx.fillStyle=g; ctx.fillRect((x-r)*pd,(y-r)*pd,r*2*pd,r*2*pd); }
    s.stroke(...col(C.silkDk,60)); s.strokeWeight(1); s.line(CW,0,CW,SH); }
  const base=()=>{ g.push(); g.background(...C.silk); g.pop(); };
