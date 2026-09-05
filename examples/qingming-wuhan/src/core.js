/* core.js — shared constants, palette, stage texts, ctx factory, silk.
   Everything here is a global (var). Modules receive a ctx and never touch p5 or the DOM. */
var SW=5220, SH=500, CW=220, PW=5000, VW=930, VH=500, MMH=Math.round(VW/SW*SH), GAP=12, CH=VH+GAP+MMH;
var Y_FAR=140, Y_NEAR=480, OBL=[-0.45,-0.55];

// D-19(2): the ground sits 5–8 % darker and warmer, toward 赭黄褐 (was [160,140,106]); silkDk and paper move in proportion,
// the paper sheet for x<CW stays paler than the silk. D-19(3): 汁绿 / 石绿 for the colour owners (石绿 local only, never a slope).
var C={silk:[151,129,95], silkDk:[110,86,56], paper:[190,170,132], ink:[40,37,32],
  ochre:[172,120,72], ochre2:[146,98,56], huaqing:[70,95,120], huaqing2:[96,120,146], danmo:[60,58,52],
  zhusha:[175,55,40], tenghuang:[190,160,80], tree:[46,60,44], trunk:[86,66,40], red:[182,50,36],
  zhilv:[118,138,88], shilv:[96,150,110]};

var STAGES=[
 ['矾绢','silk ground · 胶矾水','细绢绷框,胶矾水刷三至五遍,使墨不洇、色能分染。绢经九百年氧化已成暖褐,补绢与污渍处更深;之后每一层薄染都透着这个底色。左端另接一段拖尾纸,留给题跋。'],
 ['起稿·地势','underdrawing · 淡墨起稿','柳炭或极淡的墨先把地势定下来:两江岸线、街道边缘、房基与台基、桥的轴线。线细而虚,只是骨架的骨架;界尺与毛笔都要沿着它走,所以最先落纸。'],
 ['界画','ruled architecture · 界尺界笔','笔杆靠着界尺,竹片衬托笔锋,拉出匀而挺的直线:柱网、额枋、斗拱、檐口、瓦垄、门窗、栏杆、堤石,以及大桥的桁架。张著说作者"本工其界画",这一道是全卷的骨。尺线两端略顿,平行线的间距是手排的。'],
 ['舟船','boats · 舟车','船身的舷线与板缝仍靠界尺,篷席、桅、橹、舵、缆绳换回毛笔。轮渡的两层窗列、拖轮的折桅、货驳的篷布都在这一道。船与桥的关系定了,岸上的人才知道往哪里看。'],
 ['树石','trees & banks · 鹿角蟹爪','中锋淡墨双钩树干,有瘤有节;枝分三四级,逐级变细,末梢回锋成蟹爪。初春,槐与梧桐还是枯枝,只有柳垂新条、樱开晚花。坡岸勾口、短皴顺坡,石作折带。树先于人:人要站在树前树后。'],
 ['人物','figures · 白描','细笔勾人,每人在这个尺度上只剩五到八笔:帽、脸、肩线、袍身、腰带、腿脚。衣纹是有顿挫的钉头鼠尾,与界画的匀线是同一幅画里的两种线。人成群,有共同的朝向与事件;前面的人遮住后面的线。'],
 ['水纹','water lines · 细笔水纹','近船近岸处用细笔勾短曲线,四到九道一组,组与组之间留绢;船头船尾波峰成簇,船后拖出尾流。河心与远水不画,东湖一笔不画。两江交汇处两股水纹相向。水在人和船之后,是因为要避开它们。'],
 ['淡设色·赭石','ochre wash · 赭石','赭石薄罩:木构、墙面、船身、土坡、树干、面与手。每片薄染有浓淡,积水处略深,永远在墨线之内、比线淡。这是除墨之外分布最广的颜色,先上,后面的花青才有得比。'],
 ['淡设色·花青·朱砂','indigo & cinnabar · 花青朱砂','花青罩屋面、篷檐、三分之一的衣服,水面只在岸边一两条淡带;淡墨分染檐下与树干背阴。朱砂最后,只点灯笼、幌子边、船旗、春联、冬泳的浮球——全卷几十处,是唯一饱和的颜色,所以必须稀。'],
 ['复勾·招牌·题跋','re-outline, signs & colophon · 复勾题跋','颜色干后,重墨把檐口、翘角、船舷、人物外形再提一次;招牌与幌子写上字,大字可读,小字成团;樱花点上。画心内不落款。拖尾纸上以行书写这卷武汉图自己的跋,最后钤印:印泥半透明,边缘有破。']];
var ST={SILK:0,DRAFT:1,JIEHUA:2,BOATS:3,TREES:4,FIGURES:5,WATER:6,OCHRE:7,INDIGO:8,FINISH:9};

var COLOPHON='丙午清明後一日,以張擇端筆法寫武漢兩江。東湖春水,蛇山黃鶴,戶部巷過早,大橋走車行船,龜山晴川,漢水入江,漢正街扁擔,江漢關鐘聲。取其法,不取其景。';
var SIGN_TEXTS=['戶部巷','熱乾麵','豆皮','湯包','蔡林記','老通城','四季美','葉開泰','江漢關','集家嘴','輪渡','百貨','布','藥','黃鶴樓','武漢關'];   // round 10 (D-17/D-18): 黃鶴樓 board, 武漢關 wharf post
var SEAL_TEXTS=['取法','不取景','珍藏','審定'];
var TITLE_TEXT='清明上河圖 · 武漢';
var ALL_TEXT=COLOPHON+SIGN_TEXTS.join('')+TITLE_TEXT+SEAL_TEXTS.join('');

/* ---------------------------------------------------------------- ctx
   makeCtx(p, opts) — opts.SW / opts.CW override the canvas width and paper width (the harness uses 1200 / 0).
   Modules must read ctx.SW and ctx.CW, never the globals. */
function makeCtx(p,opts){
  opts=opts||{};
  var W=opts.SW||SW, H=SH, CWx=opts.CW===undefined?CW:opts.CW;
  var seed=20260404;
  function R(){ seed|=0; seed=seed+0x6D2B79F5|0; var t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }
  function rr(a,b){ return a+R()*(b-a); }
  function ri(a,b){ return Math.floor(rr(a,b+1)); }
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  function smoothstep(a,b,v){ var t=clamp((v-a)/(b-a),0,1); return t*t*(3-2*t); }
  function col(c,a){ return [c[0],c[1],c[2],a]; }
  function noise(x,y,z){ return p.noise(x,y,z); }
  p.noiseSeed(7);
  function depth(y){ return 0.75+0.25*clamp((y-Y_FAR)/(Y_NEAR-Y_FAR),0,1); }

  var S=STAGES.map(function(){ return []; });
  function add(st,x,f){ S[st].push({x:x,f:f}); }

  // ---------------- masks: z raster (nearer object wins) and water raster
  var Z=new Uint16Array(W*H), WATER=new Uint8Array(W*H);
  function hidden(x,y,z){ if(x<CWx)return true; if(x>=W||y<0||y>=H||x<0)return false; return Z[(y|0)*W+(x|0)]>z+1; }
  function solidAt(x,y){ if(x<0||x>=W||y<0||y>=H)return false; return Z[(y|0)*W+(x|0)]>0; }
  function waterAt(x,y){ if(x<0||x>=W||y<0||y>=H)return false; return WATER[(y|0)*W+(x|0)]===1; }
  function stampZ(fp){ var z=clamp(Math.round(fp.z),1,65535), x0=Math.max(0,Math.floor(fp.x0)), x1=Math.min(W-1,Math.ceil(fp.x1)), y0=Math.max(0,Math.floor(fp.y0)), y1=Math.min(H-1,Math.ceil(fp.y1));
    for(var y=y0;y<=y1;y++){ var row=y*W; for(var x=x0;x<=x1;x++){ if(Z[row+x]>=z)continue; if(fp.inside(x,y))Z[row+x]=z; } } }
  function fillPoly(raster,poly,val){ var n=poly.length, ymin=1e9, ymax=-1e9, i;
    for(i=0;i<n;i++){ ymin=Math.min(ymin,poly[i][1]); ymax=Math.max(ymax,poly[i][1]); }
    for(var y=Math.max(0,Math.ceil(ymin));y<=Math.min(H-1,Math.floor(ymax));y++){ var xs=[], sy=y+0.5;
      for(i=0;i<n;i++){ var a=poly[i], b=poly[(i+1)%n]; if((a[1]<=sy)!==(b[1]<=sy))xs.push(a[0]+(sy-a[1])/(b[1]-a[1])*(b[0]-a[0])); }
      xs.sort(function(u,v){ return u-v; });
      for(i=0;i+1<xs.length;i+=2){ var xa=Math.max(0,Math.ceil(xs[i])), xb=Math.min(W-1,Math.floor(xs[i+1])); for(var x=xa;x<=xb;x++)raster[y*W+x]=val; } } }
  function stampWater(poly){ fillPoly(WATER,poly,1); }
  function clearAround(fn,x,y,r){ return !fn(x,y)&&!fn(x-r,y)&&!fn(x+r,y)&&!fn(x,y-r)&&!fn(x,y+r); }
  var masks={stampZ:stampZ,hidden:hidden,solidAt:solidAt,stampWater:stampWater,waterAt:waterAt,clearAround:clearAround};

  // ---------------- polygon helpers (wash uses them; footprints may too): even-odd inside test, distance to the nearest edge
  function polyInside(poly){ var n=poly.length; return function(x,y){ var c=false; for(var i=0,j=n-1;i<n;j=i++){ var a=poly[i], b=poly[j]; if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c; } return c; }; }
  function polyEdge(poly){ var n=poly.length; return function(x,y){ var best=1e9; for(var i=0,j=n-1;i<n;j=i++){ var ax=poly[j][0], ay=poly[j][1], bx=poly[i][0], by=poly[i][1], dx=bx-ax, dy=by-ay, L2=dx*dx+dy*dy;
        var t=L2>0?clamp(((x-ax)*dx+(y-ay)*dy)/L2,0,1):0, px=ax+dx*t-x, py=ay+dy*t-y, d=px*px+py*py; if(d<best)best=d; } return Math.sqrt(best); }; }

  // ---------------- line primitives
  function line(st,x,c,al,w,x1,y1,x2,y2){ var cc=col(c,al); add(st,x,function(g){ g.stroke(cc[0],cc[1],cc[2],cc[3]); g.strokeWeight(w); g.strokeCap(g.ROUND); g.line(x1,y1,x2,y2); }); }
  // pline: a thin (w ≤ 0.6) polyline longer than 12 px is a brush mark and takes the brushDraw profile (curve → spline samples);
  // anything else is the plain gen3 polyline.
  // With a style (optional 8th arg, one of ctx.INK.style) the polyline always takes the brush path with that material profile.
  function pline(st,x,c,al,w,pts,curve,style){ if(pts.length<2)return; var cc=col(c,al);
    if(style){ brushDraw(st,x,c,al,w,resample(pts,!!curve),undefined,style); return; }
    if(w<=0.6){ var L=0; for(var m=1;m<pts.length;m++){ var ex=pts[m][0]-pts[m-1][0], ey=pts[m][1]-pts[m-1][1]; L+=Math.sqrt(ex*ex+ey*ey); }
      if(L>12){ brushDraw(st,x,c,al,w,resample(pts,!!curve)); return; } }
    add(st,x,function(g){ g.noFill(); g.stroke(cc[0],cc[1],cc[2],cc[3]); g.strokeWeight(w); g.strokeCap(g.ROUND); g.beginShape();
      if(curve){ g.curveVertex(pts[0][0],pts[0][1]); for(var i=0;i<pts.length;i++)g.curveVertex(pts[i][0],pts[i][1]); var l=pts[pts.length-1]; g.curveVertex(l[0],l[1]); }
      else for(var k=0;k<pts.length;k++)g.vertex(pts[k][0],pts[k][1]);
      g.endShape(); }); }

  // ruler line: straight and even in width end to end (D-08: the end dwell is gone — two dwells meeting at a corner were a bead), overshoot `over` px past each true end;
  // the ink load drifts along the rule. Default alpha is whatever the caller passes — nothing here darkens it.
  // With z the line is sampled every 2 px against masks.hidden and only the visible runs are drawn; a run cut by an occluder gets no overshoot there.
  function rline(st,x,c,al,w,x1,y1,x2,y2,z,over){
    if(over===undefined)over=rr(0.5,1.5);
    var dx=x2-x1, dy=y2-y1, L=Math.sqrt(dx*dx+dy*dy); if(L<0.05)return;
    var ux=dx/L, uy=dy/L, a=al*rr(0.92,1.08), segs=[], run=null, i;
    if(z===undefined)segs.push([x1,y1,x2,y2,true,true]);
    else { var n=Math.max(1,Math.ceil(L/2));
      for(i=0;i<=n;i++){ var t=i/n, px=x1+dx*t, py=y1+dy*t, vis=!hidden(px,py,z);
        if(vis){ if(!run)run=[px,py,px,py,i===0,false]; else { run[2]=px; run[3]=py; } if(i===n)run[5]=true; }
        if(run&&(!vis||i===n)){ if(run[2]!==run[0]||run[3]!==run[1]||run[4]||run[5])segs.push(run); run=null; } } }
    if(!segs.length)return;
    var ov=over+w*0.5;   // butt caps below: the half-width PROJECT used to add goes into the overshoot
    for(i=0;i<segs.length;i++){ var s=segs[i]; if(s[4]){ s[0]-=ux*ov; s[1]-=uy*ov; } if(s[5]){ s[2]+=ux*ov; s[3]+=uy*ov; } }
    // ink load along the rule: ±15 % by one slow noise, in ~8-px pieces merged while equal; a rule > 60 px at structural/texture
    // grade may lose contact once for ~1 px (the 界笔 skipping on a silk knot)
    var ph=rr(0,300), skip=null; if(L>60&&al<=170&&R()<0.3){ var k0=rr(0.2,0.8)*L; skip=[k0,k0+rr(0.8,1.4)]; }
    var pieces=[], base='rgba('+c[0]+','+c[1]+','+c[2]+',';
    var cut=function(s,sa,sb){ // push [sa,sb] of this segment (s-measured from x1,y1) as pieces of ~8 px
      var pos=sa; while(pos<sb){ var e=Math.min(sb,pos+rr(6,10)); if(skip&&pos<skip[1]&&e>skip[0]){ if(pos<skip[0])pieces.push(mk(pos,skip[0])); pos=Math.max(e,skip[1]); if(e>skip[1])pieces.push(mk(skip[1],e)); continue; } pieces.push(mk(pos,e)); pos=e; } };
    var mk=function(sa,sb){ var nz=clamp((p.noise(ph+(sa+sb)*0.5*0.02,5.1)-0.5)/0.3,-1,1); return [x1+ux*sa,y1+uy*sa,x1+ux*sb,y1+uy*sb,Math.round(clamp(a*(1+0.15*nz),0,255)/8)*8]; };
    for(i=0;i<segs.length;i++){ var sg=segs[i]; cut(sg,(sg[0]-x1)*ux+(sg[1]-y1)*uy,(sg[2]-x1)*ux+(sg[3]-y1)*uy); }
    var merged=[]; for(i=0;i<pieces.length;i++){ var pc=pieces[i], lp=merged[merged.length-1]; if(lp&&lp[4]===pc[4]&&Math.abs(lp[2]-pc[0])<1e-6&&Math.abs(lp[3]-pc[1])<1e-6){ lp[2]=pc[2]; lp[3]=pc[3]; } else merged.push(pc.slice()); }
    for(i=0;i<merged.length;i++)merged[i].push(base+(merged[i][4]/255).toFixed(3)+')');
    add(st,x,function(g){ var cx=g.drawingContext, k,s; cx.save(); cx.lineCap='butt'; cx.lineWidth=w;
      for(k=0;k<merged.length;k++){ s=merged[k]; cx.strokeStyle=s[5]; cx.beginPath(); cx.moveTo(s[0],s[1]); cx.lineTo(s[2],s[3]); cx.stroke(); }
      cx.restore(); }); }

  // Catmull-Rom resample of a sparse polyline at ~2 px; dense input (≤3 px spacing) is used as given unless `force`.
  function resample(pts,force){ var n=pts.length, len=0, i; for(i=1;i<n;i++){ var ex=pts[i][0]-pts[i-1][0], ey=pts[i][1]-pts[i-1][1]; len+=Math.sqrt(ex*ex+ey*ey); }
    if(!force&&len/(n-1)<=3)return pts.map(function(q){ return [q[0],q[1]]; });
    var out=[];
    if(n===2){ var m=Math.max(2,Math.ceil(len/2)); for(i=0;i<=m;i++){ var t=i/m; out.push([pts[0][0]+(pts[1][0]-pts[0][0])*t,pts[0][1]+(pts[1][1]-pts[0][1])*t]); } return out; }
    for(i=0;i<n-1;i++){ var p0=pts[Math.max(0,i-1)], p1=pts[i], p2=pts[i+1], p3=pts[Math.min(n-1,i+2)], seg=Math.sqrt((p2[0]-p1[0])*(p2[0]-p1[0])+(p2[1]-p1[1])*(p2[1]-p1[1])), m2=Math.max(1,Math.ceil(seg/2));
      for(var j=0;j<m2;j++){ var s=j/m2, s2=s*s, s3=s2*s;
        out.push([0.5*(2*p1[0]+(-p0[0]+p2[0])*s+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*s2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*s3),
                  0.5*(2*p1[1]+(-p0[1]+p2[1])*s+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*s2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*s3)]); } }
    out.push([pts[n-1][0],pts[n-1][1]]); return out; }

  // ---------------- brush profile (D-08): every freehand mark goes through brushDraw.
  // The body is exactly w. 起笔: a smooth swell from W_IN·w to w over the first ENTRY of the length; 收笔: a smooth thinning to
  // W_OUT·w over the last EXIT. Nothing else at the ends — no hook, no dry lift, no dwell (D-06's endings read as beads).
  // 提按: width and ink ±12 % by one slow noise along the body. Texture grade (al ≤ 100) has no head at all, only the thinning,
  // and loses contact 1–2 times per 30 px for 1–2 px, never within 4 px of either end. Marks < 6 px are one plain piece.
  // Pieces are drawn butt-capped so they abut without doubled caps. All choices are made here, at build.
  var ENTRY=0.08, EXIT=0.10, W_IN=0.8, W_OUT=0.85, W_MAX=0.9;
  // D-10(c) style (ctx.INK.style.*): 'garment' = the profile above (default); 'branch' = width falls from w at the first point
  // (the base) to ~0.45 w at the last (the tip), no swell, no thinning tail — the stroke simply ends; 'rock' = no head, no tail,
  // constant width, contact broken along the way at any grade (皴); 'rule' = constant width, no head, no tail, no gaps.
  function brushDraw(st,x,c,al,w,q,z,style){
    var n=q.length, i, s=[0], L=0; w=Math.min(w,W_MAX); style=style||'garment';
    var branch=style==='branch', rock=style==='rock', rule=style==='rule';
    for(i=1;i<n;i++){ var ex=q[i][0]-q[i-1][0], ey=q[i][1]-q[i-1][1]; L+=Math.sqrt(ex*ex+ey*ey); s.push(L); }
    if(L<0.3)return;
    var tex=al<=100, ph=rr(0,200), tiny=L<6, gaps=[];
    if((tex||rock)&&!rule&&L>=18){ var ng=Math.max(1,Math.round(L/30*rr(1,2))); for(i=0;i<ng;i++){ var g0=rr(4,L-6), gl=rr(1,2); if(g0+gl<=L-4)gaps.push([g0,g0+gl]); } }
    var inGap=function(sv){ for(var k=0;k<gaps.length;k++)if(sv>=gaps[k][0]&&sv<gaps[k][1])return true; return false; };
    var prof=function(sv){ if(tiny)return [0.9,1];
      var t=sv/L, wm=1, x1=1-EXIT, nz;
      if(rule)return [1,1+0.08*clamp((p.noise(ph+sv*0.035,3.7)-0.5)/0.3,-1,1)];
      if(branch){ nz=clamp((p.noise(ph+sv*0.035,3.7)-0.5)/0.3,-1,1); return [(1-0.55*t)*(1+0.08*nz),1+0.1*nz]; }
      if(rock){ nz=clamp((p.noise(ph+sv*0.035,3.7)-0.5)/0.3,-1,1); return [1+0.1*nz,1+0.12*nz]; }
      if(t<ENTRY&&!tex){ var a=smoothstep(0,1,t/ENTRY); wm=W_IN+(1-W_IN)*a; }
      else if(t>x1){ var b=smoothstep(0,1,(t-x1)/EXIT); wm=1-(1-W_OUT)*b; }
      nz=clamp((p.noise(ph+sv*0.035,3.7)-0.5)/0.3,-1,1); return [wm*(1+0.12*nz),1+0.12*nz]; };
    var pieces=[], cur=null, lastK=null;
    for(i=0;i<n;i++){ var vis=(z===undefined||!hidden(q[i][0],q[i][1],z))&&!inGap(s[i]);
      if(!vis){ if(cur&&cur.pts.length>1)pieces.push(cur); cur=null; lastK=null; continue; }
      var pr=prof(s[i]), wq=Math.max(0.15,Math.round(w*pr[0]/0.06)*0.06), aq=Math.round(clamp(al*pr[1],0,255)/10)*10, key=wq*1000+aq;
      if(cur&&key!==lastK){ cur.pts.push(q[i]); if(cur.pts.length>1)pieces.push(cur); cur=null; }
      if(!cur){ cur={w:wq,a:aq,pts:[]}; lastK=key; }
      cur.pts.push(q[i]); }
    if(cur&&cur.pts.length>1)pieces.push(cur);
    if(!pieces.length)return;
    for(i=0;i<pieces.length;i++)pieces[i].css='rgba('+c[0]+','+c[1]+','+c[2]+','+(pieces[i].a/255).toFixed(3)+')';
    add(st,x,function(g){ var cx=g.drawingContext; cx.save(); cx.lineCap='butt'; cx.lineJoin='round';
      for(var r=0;r<pieces.length;r++){ var pc=pieces[r], ps=pc.pts; cx.lineWidth=pc.w; cx.strokeStyle=pc.css;
        cx.beginPath(); cx.moveTo(ps[0][0],ps[0][1]); for(var j=1;j<ps.length;j++)cx.lineTo(ps[j][0],ps[j][1]); cx.stroke(); } cx.restore(); }); }

  // 白描 line: sparse input is resampled through a spline, jittered, then drawn with the brush profile above.
  // With z, samples hidden by a nearer object are dropped and the visible runs are drawn.
  // style (optional 8th arg, one of ctx.INK.style) picks the material profile in brushDraw; 'rule' also drops the jitter.
  function bline(st,x,c,al,w,pts,z,style){
    if(pts.length<2)return;
    var q=resample(pts), sparse=q.length!==pts.length, jit=style==='rule'?0:sparse?0.36:0.6, i;
    for(i=0;i<q.length;i++){ q[i][0]+=(R()-0.5)*jit; q[i][1]+=(R()-0.5)*jit; }
    brushDraw(st,x,c,al,w,q,z,style); }

  // long marks in 70–190 px pieces sharing one point; PROJECT cap, constant alpha per row
  function chunks(st,pts,c,al,sw,len){ var a=0, cc=col(c,al);
    var piece=function(seg){ add(st,(seg[0][0]+seg[seg.length-1][0])/2,function(g){ g.noFill(); g.stroke(cc[0],cc[1],cc[2],cc[3]); g.strokeWeight(sw); g.strokeCap(g.PROJECT); g.beginShape(); for(var i=seg.length-1;i>=0;i--)g.vertex(seg[i][0],seg[i][1]); g.endShape(); }); };
    while(a<pts.length-1){ var want=len||rr(70,190), b=a+1; while(b+1<pts.length&&pts[b][0]-pts[a][0]<want)b++;
      piece(pts.slice(a,b+1)); if(b===pts.length-1)break; a=b; } }

  // pigment laid as soft dabs on a jittered grid — no scanlines, granular like mineral colour. ink = target coverage 0..1.
  // reg={x0,x1,y0,y1,z,inside(x,y),edge?(x,y),tone?}; pred(x,y)→bool optional; opts {pool:bool, angle:fn(x,y)}
  function dabs(st,reg,c0,ink,step,rad,pred,opts){ opts=opts||{};
    var T=reg.tone===undefined?1:reg.tone, c=T>=0.99?c0:c0.map(function(v,i){ return Math.round(v*T+[150,150,140][i]*(1-T)); }); ink=ink*(0.5+0.5*T);
    var OVER=Math.PI*rad*rad/(step*step), a=1-Math.pow(1-ink,1/Math.max(1,OVER)), group=[], inside=reg.inside, pool=!!opts.pool, angle=opts.angle;
    var flush=function(){ if(!group.length)return; var ds=group, cc=c; add(st,ds[0][0],function(g){ var ctx=g.drawingContext; for(var i=0;i<ds.length;i++){ var d=ds[i]; var gr=ctx.createRadialGradient(d[0],d[1],0,d[0],d[1],d[2]); gr.addColorStop(0,'rgba('+cc[0]+','+cc[1]+','+cc[2]+','+d[3]+')'); gr.addColorStop(0.6,'rgba('+cc[0]+','+cc[1]+','+cc[2]+','+(d[3]*0.85).toFixed(3)+')'); gr.addColorStop(1,'rgba('+cc[0]+','+cc[1]+','+cc[2]+',0)'); ctx.fillStyle=gr; ctx.beginPath(); if(d[4]!==undefined)ctx.ellipse(d[0],d[1],d[2]*1.7,d[2]*0.75,d[4],0,Math.PI*2); else ctx.arc(d[0],d[1],d[2],0,Math.PI*2); ctx.fill(); } }); group=[]; };
    var edgeOf=reg.edge||function(x,y){ var ds=[rad*0.35,rad*0.7,rad]; for(var k=0;k<3;k++){ var d=ds[k]; if(!(inside(x-d,y)&&inside(x+d,y)&&inside(x,y-d)&&inside(x,y+d)))return d*0.7; } return rad; };
    for(var y=reg.y0;y<=reg.y1;y+=step){ for(var x=reg.x0;x<=reg.x1;x+=step){ var xx=x+rr(-step*0.5,step*0.5), yy=y+rr(-step*0.5,step*0.5);
        if(!inside(xx,yy)||hidden(xx,yy,reg.z))continue; if(pred&&!pred(xx,yy))continue;
        if(!pool&&p.noise(xx*0.02+st*5,yy*0.02)<0.3&&R()<0.6)continue;
        var edge=edgeOf(xx,yy), r=Math.min(rad*Math.exp(rr(-0.6,0.55)),Math.max(1.2,edge*0.9+0.5));
        var dab=[xx,yy,r,(pool?a*rr(0.9,1.1):a*rr(0.75,1.25)*(0.8+0.5*p.noise(xx*0.05,yy*0.05))).toFixed(3)];
        if(angle)dab.push(angle(xx,yy)+rr(-0.2,0.2));
        group.push(dab); if(group.length>=8)flush(); } flush(); } }

  // dabs over a polygon; colour stays inside the outline (radius shrinks toward the edge)
  function wash(st,poly,c,ink,step,rad,z){ var x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for(var i=0;i<poly.length;i++){ x0=Math.min(x0,poly[i][0]); x1=Math.max(x1,poly[i][0]); y0=Math.min(y0,poly[i][1]); y1=Math.max(y1,poly[i][1]); }
    dabs(st,{x0:x0,x1:x1,y0:y0,y1:y1,z:z,inside:polyInside(poly),edge:polyEdge(poly)},c,ink,step,rad); }

  var brush=makeBrushText(R);

  // seal (D-10 tell 7): the 白文 is carved first, the 印泥 invades after. The text is rasterised at 8x in a bold song face,
  // thresholded, and closed with a 3x3 square (dilate then erode) so every corner is square; thin song horizontals are thickened
  // toward the vertical weight so the strokes read as even 篆-like bars. The white bars are drawn as that raster scaled down —
  // clean edges, square ends — inside a red margin kept between the 文 and the rim. Only then the paste: the red creeps
  // 0.5–1 px into the white bars at 4–6 points on their edges, sits unevenly in 3–4 zones and along one pressure axis,
  // and the rim has 2 nibbles and ~3 edge chips as holes in an even-odd clip (silk shows through, nothing silk-coloured painted).
  // Layout: 2 characters in one column (each wider than tall), 3–4 in a 2x2 read top-right, bottom-right, top-left, bottom-left.
  var SEAL_FONT='"Heiti SC","PingFang SC","Songti SC","Noto Serif SC","Kaiti SC",serif', SS=8;
  function sealRaster(ch,em,sy){ var px=em*SS, Wc=Math.ceil(px*1.15), Hc=Math.ceil(px*sy*1.15), c=document.createElement('canvas'); c.width=Wc; c.height=Hc;
    var q=c.getContext('2d'); q.fillStyle='#000'; q.translate(Wc/2,Hc/2); q.scale(1,sy); q.font='600 '+px+'px '+SEAL_FONT; q.textAlign='center'; q.textBaseline='middle'; q.fillText(ch,0,px*0.04);
    var d=q.getImageData(0,0,Wc,Hc).data, m=new Uint8Array(Wc*Hc), i, x, y;
    for(i=0;i<Wc*Hc;i++)m[i]=d[i*4+3]>128?1:0;
    var dil=function(src,k){ var out=new Uint8Array(Wc*Hc); for(y=0;y<Hc;y++)for(x=0;x<Wc;x++){ var v=0; for(var dy=-k;dy<=k&&!v;dy++)for(var dx=-k;dx<=k;dx++){ var xx=x+dx, yy=y+dy; if(xx>=0&&yy>=0&&xx<Wc&&yy<Hc&&src[yy*Wc+xx]){ v=1; break; } } out[y*Wc+x]=v; } return out; };
    var ero=function(src,k){ var out=new Uint8Array(Wc*Hc); for(y=0;y<Hc;y++)for(x=0;x<Wc;x++){ var v=1; for(var dy=-k;dy<=k&&v;dy++)for(var dx=-k;dx<=k;dx++){ var xx=x+dx, yy=y+dy; if(!(xx>=0&&yy>=0&&xx<Wc&&yy<Hc&&src[yy*Wc+xx])){ v=0; break; } } out[y*Wc+x]=v; } return out; };
    // even the bars: thicken by ~2 % em (song horizontals are half the weight of its verticals), then close 1 px to square the corners
    m=ero(dil(m,1),1);
    // trim to content so the 文 fills its cell
    var x0=Wc,x1=0,y0=Hc,y1=0; for(y=0;y<Hc;y++)for(x=0;x<Wc;x++)if(m[y*Wc+x]){ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
    if(x1<x0){ x0=0; x1=Wc-1; y0=0; y1=Hc-1; }
    var bw=x1-x0+1, bh=y1-y0+1, out=document.createElement('canvas'); out.width=bw; out.height=bh; var oq=out.getContext('2d'), img=oq.createImageData(bw,bh), od=img.data, edge=[];
    for(y=0;y<bh;y++)for(x=0;x<bw;x++){ var v=m[(y+y0)*Wc+x+x0]; if(!v)continue; var o=(y*bw+x)*4; od[o]=241; od[o+1]=231; od[o+2]=210; od[o+3]=255;
      var gx=x+x0, gy=y+y0; if(!m[gy*Wc+gx-1]||!m[gy*Wc+gx+1]||!m[(gy-1)*Wc+gx]||!m[(gy+1)*Wc+gx])edge.push([x/bw,y/bh]); }
    oq.putImageData(img,0,0); return {img:out,edge:edge}; }
  function sealStamp(st,x,y,sz,text){ var rot=rr(-3,3)*Math.PI/180, holes=[], i;
    for(i=0;i<3;i++){ var side=ri(0,3), t=rr(-0.45,0.45)*sz, cr=rr(0.35,0.8); holes.push(side===0?[t,-sz/2,cr]:side===1?[sz/2,t,cr]:side===2?[t,sz/2,cr]:[-sz/2,t,cr]); }
    for(i=0;i<2;i++){ var sd=ri(0,3), tt=rr(-0.4,0.4)*sz, nr=sz*rr(0.06,0.11); holes.push(sd===0?[tt,-sz/2,nr]:sd===1?[sz/2,tt,nr]:sd===2?[tt,sz/2,nr]:[-sz/2,tt,nr]); }
    var pa=rr(0,Math.PI*2), pdx=Math.cos(pa)*sz*0.5, pdy=Math.sin(pa)*sz*0.5;          // pressure axis: firm end → soft end
    var zones=[], nz=ri(3,4); for(i=0;i<nz;i++)zones.push([rr(-0.35,0.35)*sz,rr(-0.35,0.35)*sz,rr(0.22,0.4)*sz,rr(0.5,1),rr(0,Math.PI),rr(0.15,0.25)]);
    // cells: a red margin of 0.09 sz stays between the 文 and the rim, and a 0.05 sz gutter between cells
    var chars=text.split(''), n=chars.length, mg=sz*0.09, gut=sz*0.05, cells=[], k;
    if(n<=2){ var cw=sz-2*mg, ch=(sz-2*mg-gut)/2; for(k=0;k<n;k++)cells.push([-cw/2,-sz/2+mg+k*(ch+gut),cw,ch]); }
    else { var cs=(sz-2*mg-gut)/2, order=[[1,0],[1,1],[0,0],[0,1]]; for(k=0;k<n;k++){ var o=order[k]; cells.push([-sz/2+mg+o[0]*(cs+gut),-sz/2+mg+o[1]*(cs+gut),cs,cs]); } if(n===3)cells[2][1]=-cs/2; }
    var glyphs=[]; for(k=0;k<n;k++){ var cl=cells[k], g=sealRaster(chars[k],cl[2],cl[3]/cl[2]); glyphs.push({img:g.img,edge:g.edge,x:cl[0],y:cl[1],w:cl[2],h:cl[3]}); }
    // the paste invades: 4–6 points on the bar edges where the red creeps 0.5–1 px into the white
    var creep=[], nc=ri(4,6); for(i=0;i<nc;i++){ var gl=glyphs[ri(0,n-1)]; if(!gl.edge.length)continue; var e=gl.edge[ri(0,gl.edge.length-1)]; creep.push([gl.x+e[0]*gl.w,gl.y+e[1]*gl.h,rr(0.5,1)*(sz/16),rr(0.55,0.8)]); }
    add(st,x,function(g){ var c=g.drawingContext; c.save(); c.translate(x+sz/2,y+sz/2); c.rotate(rot);
      c.beginPath(); c.roundRect(-sz/2-1.5,-sz/2-1.5,sz+3,sz+3,2); for(k=0;k<holes.length;k++){ c.moveTo(holes[k][0]+holes[k][2],holes[k][1]); c.arc(holes[k][0],holes[k][1],holes[k][2],0,Math.PI*2); } c.clip('evenodd');
      var lg=c.createLinearGradient(pdx,pdy,-pdx,-pdy); lg.addColorStop(0,'rgba(178,52,40,0.95)'); lg.addColorStop(0.5,'rgba(178,52,40,0.72)'); lg.addColorStop(1,'rgba(178,52,40,0.58)');
      c.fillStyle=lg; c.beginPath(); c.roundRect(-sz/2,-sz/2,sz,sz,2); c.fill();
      for(k=0;k<zones.length;k++){ var b=zones[k]; c.save(); c.translate(b[0],b[1]); c.rotate(b[4]); c.scale(1,b[3]); var gr=c.createRadialGradient(0,0,0,0,0,b[2]); gr.addColorStop(0,'rgba(178,52,40,'+b[5].toFixed(3)+')'); gr.addColorStop(0.6,'rgba(178,52,40,'+(b[5]*0.5).toFixed(3)+')'); gr.addColorStop(1,'rgba(178,52,40,0)'); c.fillStyle=gr; c.beginPath(); c.arc(0,0,b[2],0,Math.PI*2); c.fill(); c.restore(); }
      // the carved 白文: the squared raster scaled down, clean edges
      c.imageSmoothingEnabled=true; c.imageSmoothingQuality='high'; c.globalAlpha=0.94;
      for(k=0;k<glyphs.length;k++){ var q=glyphs[k]; c.drawImage(q.img,q.x,q.y,q.w,q.h); }
      c.globalAlpha=1;
      // then the paste creeps into the bars
      for(k=0;k<creep.length;k++){ c.fillStyle='rgba(178,52,40,'+creep[k][3].toFixed(2)+')'; c.beginPath(); c.arc(creep[k][0],creep[k][1],creep[k][2],0,Math.PI*2); c.fill(); }
      c.restore(); }); }

  // ink grades (D-08, ~25 % thinner than D-06): [w, alpha] — primary silhouette / structural division / texture; ruled work stays a grade paler than freehand
  var INK={primary:[0.65,205],structural:[0.5,150],texture:[0.35,90],
    // D-10(c) stroke construction by material — pass one as the last optional arg of bline / pline
    style:{garment:'garment',branch:'branch',rock:'rock',rule:'rule'}};
  return {SW:W,SH:H,CW:CWx,PW:W-CWx,Y_FAR:Y_FAR,Y_NEAR:Y_NEAR,depth:depth,OBL:OBL,ST:ST,C:C,INK:INK,
    R:R,rr:rr,ri:ri,clamp:clamp,smoothstep:smoothstep,noise:noise,col:col,
    S:S,add:add,line:line,pline:pline,rline:rline,bline:bline,chunks:chunks,dabs:dabs,wash:wash,
    brush:brush,sealStamp:sealStamp,masks:masks,polyInside:polyInside,polyEdge:polyEdge,
    silkWear:[],   // filled by bakeSilk: the 折痕, [{x,w,a}] — main.js's FINISH pass lifts pigment along them
    reg:{buildings:[],boats:[],trees:[],figures:[],zones:[],slots:[]}};
}

/* ---------------------------------------------------------------- silk
   Warm 赭黄褐 oxidised silk: fine grain, warp/weft, short fibres, 经向丝缕, the D-19(5) aging — vertical 折痕, short 断纹, a ragged
   edge band on the top and bottom edges only. Nothing slower than a fibre: no stain, no gradient, no vignette. Paper sheet for x<CW.
   Everything new draws from the silk's own generator (rn, seed 99) so ctx.R is consumed exactly as in v9 and every module keeps its dice. */
function bakeSilk(p,ctx){ var W=ctx.SW, H=ctx.SH, CWx=ctx.CW, R=ctx.R, rr=ctx.rr, scale=W*H/(SW*SH), i, x, y;
  var s=p.createGraphics(W,H); s.pixelDensity(2); s.background(C.silk[0],C.silk[1],C.silk[2]);
  if(CWx>0){ s.noStroke(); s.fill(C.paper[0],C.paper[1],C.paper[2]); s.rect(0,0,CWx,H); }
  var c=s.drawingContext, pd=2, w=W*pd, h=H*pd, img=c.getImageData(0,0,w,h), d=img.data, sd=99, dk=C.silkDk;
  var rn=function(){ sd|=0; sd=sd+0x6D2B79F5|0; var t=Math.imul(sd^sd>>>15,1|sd); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  var rn2=function(a,b){ return a+rn()*(b-a); };
  // edge band (D-19(5)): only the outer 3–6 px of the top and bottom edges, depth ragged per column from two noises and a
  // strength that wanders 0.3–0.5 — a torn band, not a frame; the left and right ends and the corners get nothing extra.
  var top=new Float32Array(w), bot=new Float32Array(w), kk=new Float32Array(w);
  for(x=0;x<w;x++){ var u=x/pd, rag=(p.noise(u*0.31,41.7)-0.5)*2.4;
    top[x]=Math.max(0,Math.min(6,2+6*(p.noise(u*0.035,11.3)-0.32)/0.36+rag));
    bot[x]=Math.max(0,Math.min(6,2+6*(p.noise(u*0.035,27.9)-0.32)/0.36-rag));
    kk[x]=0.3+0.2*p.noise(u*0.12,63.1); }
  for(i=0,y=0;y<h;y++)for(x=0;x<w;x++,i+=4){ var n=(rn()-0.5)*3; d[i]+=n; d[i+1]+=n*0.95; d[i+2]+=n*0.8;
    var e=Math.min(y,h-1-y)/pd, dp=y<h/2?top[x]:bot[x];
    if(e<dp){ var k=Math.pow(1-e/dp,1.2)*kk[x]; d[i]+=(dk[0]-d[i])*k; d[i+1]+=(dk[1]-d[i+1])*k; d[i+2]+=(dk[2]-d[i+2])*k; } }
  c.putImageData(img,0,0);
  s.strokeWeight(0.3);
  s.stroke(dk[0],dk[1],dk[2],6); for(x=0;x<W;x+=1.3)s.line(x+(x%2.6<1.3?0.15:0),0,x,H);
  s.stroke(dk[0],dk[1],dk[2],3); for(y=0;y<H;y+=1.6)s.line(0,y,W,y+rr(-0.3,0.3));
  var nf=Math.round(12000*scale); for(i=0;i<nf;i++){ var fx=R()*W, fy=R()*H, L=rr(8,40); s.line(fx,fy,fx+L,fy); }
  // D-16 (B8 tell 6): no stains at all. The stains' 7 draws each are still taken from ctx.R so every module keeps its v8 dice.
  var nb=Math.max(1,Math.round(5*scale)); for(i=0;i<nb*7;i++)R();
  // 经向丝缕: warp bundles at irregular spacing, finer and paler than any figure line (0.28–0.35 px, alpha 8–22 — texture grade
  // is 0.35 / 90), in broken runs; a third of them a shade paler than the ground where the thread took less of the oxidation.
  var pale=[C.silk[0]+30,C.silk[1]+30,C.silk[2]+28];
  for(x=CWx+rn2(2,10);x<W;x+=rn2(4,16)){ var lit=rn()<0.35, cc=lit?pale:dk, y0=rn2(-40,H*0.5); s.strokeWeight(rn2(0.28,0.35));
    while(y0<H){ var Ls=rn2(30,170), a=rn2(8,22)*(lit?1.3:1); s.stroke(cc[0],cc[1],cc[2],a); s.line(x,Math.max(0,y0),x+rn2(-0.3,0.3),Math.min(H,y0+Ls)); y0+=Ls+rn2(4,40); } }
  // 折痕: 4–7 vertical creases across the full height at irregular x (2 in the 1200-px harness), 0.6–1 px wide, the ink of the
  // fold varying 14–40 along the height in 12–40 px runs, the line wandering ±0.6 px; half of them double for a stretch 2–3 px
  // beside; a few have 1–2 px of pale wear on one side where the silk lost its colour. Each crease (and each doubled line)
  // is exposed as ctx.silkWear {x, w, a} — a = its darkest alpha — so main.js's FINISH pass can lift pigment along it.
  ctx.silkWear=[];
  var nc=Math.max(2,Math.round(rn2(4,7.99)*W/SW)), seg=W/nc;
  for(i=0;i<nc;i++){ var xc=seg*(i+rn2(0.15,0.85)), wc=rn2(0.6,1), dbl=rn()<0.5?rn2(2,3):0, dFrom=rn2(0,0.5)*H, dTo=dFrom+rn2(0.3,0.7)*H,
      wr=rn()<0.45?rn2(1,2):0, ws=rn()<0.5?-1:1, ph=rn2(0,100), peak=0, peak2=0, yy=0;
    while(yy<H){ var Lc=rn2(12,40), y1=Math.min(H,yy+Lc), ac=14+26*Math.max(0,Math.min(1,(p.noise(ph,yy*0.02)-0.2)/0.5));
      var xa=xc+(p.noise(ph+3,yy*0.01)-0.5)*1.2, xb=xc+(p.noise(ph+3,y1*0.01)-0.5)*1.2; peak=Math.max(peak,ac);
      if(wr){ s.strokeWeight(wr); s.stroke(pale[0],pale[1],pale[2],rn2(20,40)); var wo=ws*(wc*0.5+wr*0.5+0.2); s.line(xa+wo,yy,xb+wo,y1); }
      s.strokeWeight(wc); s.stroke(dk[0],dk[1],dk[2],ac); s.line(xa,yy,xb,y1);
      if(dbl&&yy>=dFrom&&yy<dTo){ s.stroke(dk[0],dk[1],dk[2],ac*0.6); s.line(xa+dbl,yy,xb+dbl,y1); peak2=Math.max(peak2,ac*0.6); }
      yy=y1; }
    ctx.silkWear.push({x:xc,w:wc,a:Math.round(peak)}); if(dbl)ctx.silkWear.push({x:xc+dbl,w:wc,a:Math.round(peak2)}); }
  // 断纹: 20–40 short breaks per scroll (2–8 px, hairline), mostly along the warp, a few at any angle; 淡墨 or pale, slightly kinked.
  var nk=Math.round(rn2(20,40)*scale); s.strokeWeight(0.3);
  for(i=0;i<nk;i++){ var bx=CWx+rn()*(W-CWx), by=rn()*H, bl=rn2(2,8), ang=Math.PI/2+(rn()<0.75?rn2(-0.3,0.3):rn2(-1.5,1.5)), lt=rn()<0.4;
    var ck=lt?pale:dk; s.stroke(ck[0],ck[1],ck[2],lt?rn2(40,70):rn2(35,70));
    var mx=bx+Math.cos(ang)*bl*0.5+rn2(-0.5,0.5), my=by+Math.sin(ang)*bl*0.5; s.line(bx,by,mx,my); s.line(mx,my,bx+Math.cos(ang)*bl,by+Math.sin(ang)*bl); }
  if(CWx>0){ s.stroke(dk[0],dk[1],dk[2],60); s.strokeWeight(1); s.line(CWx,0,CWx,H); }
  return s; }

// stage 0: the silk revealed in 50-px columns, right to left
function revealSilk(ctx,silkImg){ var W=ctx.SW, H=ctx.SH; for(var x=0;x<W;x+=50){ (function(a,w){ ctx.add(ST.SILK,a+25,function(g){ g.image(silkImg,a,0,w,H,a,0,w,H); }); })(x,Math.min(50,W-x)); } }
