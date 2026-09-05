/* mod-ground.js — ground, roads, fields, quays, walls, railings, the 凌波門 pier.
   GROUND.footprint(ctx,{zone}) is pure; GROUND.build(ctx,{zone}) draws through ctx primitives only and returns {fp,slots}.
   zone.kind ∈ ground | road | field | crossing | treepit | busstop | railing | quay | floodwall | wall | pier.
   Flat kinds return an empty footprint (never block placement, never hide anything) and their marks carry z=0, so any
   stamped object breaks them. Solid kinds stamp with z = their ground contact: quay face z = top edge (the platform),
   floodwall / wall z = nearest base y, pier z = the near deck end, bus stop z = the pole foot.
   Polylines given to quay.front, wall.pts, floodwall.pts must be x-monotonic (a front seen from the water/street side). */
var GROUND=(function(){
  var EMPTY={x0:0,x1:-1,y0:0,y1:-1,z:0,inside:function(){ return false; }};

  // ---------------------------------------------------------------- geometry helpers
  function bbox(P){ var x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for(var i=0;i<P.length;i++){ x0=Math.min(x0,P[i][0]); x1=Math.max(x1,P[i][0]); y0=Math.min(y0,P[i][1]); y1=Math.max(y1,P[i][1]); } return {x0:x0,x1:x1,y0:y0,y1:y1}; }
  function maxX(pts){ var m=-1e9; for(var i=0;i<pts.length;i++)if(pts[i][0]>m)m=pts[i][0]; return m; }
  function maxY(pts){ var m=-1e9; for(var i=0;i<pts.length;i++)if(pts[i][1]>m)m=pts[i][1]; return m; }
  function shift(F,dx,dy){ return F.map(function(q){ return [q[0]+dx,q[1]+dy]; }); }
  function ascending(F){ var G=F.map(function(q){ return [q[0],q[1]]; }); if(G[0][0]>G[G.length-1][0])G.reverse(); return G; }
  function yAt(F,x){ if(x<=F[0][0])return F[0][1]; for(var i=1;i<F.length;i++){ if(x<=F[i][0]){ var a=F[i-1], b=F[i]; return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]); } } return F[F.length-1][1]; }
  function facePoly(top,h){ return top.concat(shift(top,0,h).reverse()); }
  // walk an x-ascending polyline at depth cy below it; emit maximal runs [x0,y0,x1,y1] not rejected by skip(x,y)
  function alongF(F,cy,skip,cb){ for(var e=1;e<F.length;e++){ var a=F[e-1], b=F[e], L=b[0]-a[0]; if(L<=0)continue; var n=Math.max(1,Math.ceil(L/2)), run=null;
      for(var i=0;i<=n;i++){ var xx=a[0]+L*i/n, y=a[1]+(b[1]-a[1])*i/n+cy, sk=skip?skip(xx,y):false;
        if(!sk){ if(!run)run=[xx,y,xx,y]; else { run[2]=xx; run[3]=y; } }
        if(run&&(sk||i===n)){ if(run[2]-run[0]>=3)cb(run); run=null; } } } }
  // cut a run into 30–60 px pieces, keep a fraction, small gaps between
  function pieces(ctx,run,keep,cb){ var rr=ctx.rr, R=ctx.R, dx=run[2]-run[0], dy=run[3]-run[1], L=Math.sqrt(dx*dx+dy*dy), s=rr(0,6);
    while(s<L-3){ var seg=Math.min(rr(30,60),L-s); if(R()<keep){ var t0=s/L, t1=(s+seg)/L; cb([run[0]+dx*t0,run[1]+dy*t0,run[0]+dx*t1,run[1]+dy*t1]); } s+=seg+rr(2,7); } }

  // ---------------------------------------------------------------- mark helpers
  // 起稿 line: each edge of the polyline in 30–60 px brush segments, `keep` of them present, ±0.7 px waver, z-clipped
  function broken(ctx,pts,al,w,z,keep){ var rr=ctx.rr, R=ctx.R, ST=ctx.ST, C=ctx.C; keep=keep===undefined?0.8:keep;
    for(var e=1;e<pts.length;e++){ var a=pts[e-1], b=pts[e], dx=b[0]-a[0], dy=b[1]-a[1], L=Math.sqrt(dx*dx+dy*dy); if(L<3)continue; var ux=dx/L, uy=dy/L, s=rr(0,8);
      while(s<L-3){ var seg=Math.min(rr(30,60),L-s);
        if(R()<keep){ var q=[], n=Math.max(2,Math.round(seg/4)); for(var i=0;i<=n;i++){ var t=s+seg*i/n, wv=(ctx.noise(t*0.07+e*3.7,a[0]*0.013)-0.5)*1.4; q.push([a[0]+ux*t-uy*wv,a[1]+uy*t+ux*wv]); }
          ctx.bline(ST.DRAFT,maxX(q),C.ink,rr(al*0.8,al*1.15),w*rr(0.9,1.1),q,z); }
        s+=seg+rr(2,7); } } }
  // 赭石 over a ground polygon with large noise holes; never on water; pred(x,y,edgeFn) may refuse more cells
  function groundWash(ctx,P,ink,tone,pred){ var b=bbox(P), ins=ctx.polyInside(P), ed=ctx.polyEdge(P), M=ctx.masks;
    ctx.dabs(ctx.ST.OCHRE,{x0:b.x0,x1:b.x1,y0:b.y0,y1:b.y1,z:0,inside:ins,edge:ed,tone:tone},ctx.C.ochre,ink,3.4,3.2,function(x,y){ if(M.waterAt(x,y))return false; if(pred&&!pred(x,y,ed))return false; return ctx.R()<ctx.smoothstep(0.34,0.5,ctx.noise(x*0.008+7,y*0.008+3)); }); }
  // 点苔: a cluster of 1–3 heavy dots
  function moss(ctx,x,y){ var rr=ctx.rr, ri=ctx.ri, C=ctx.C, n=ri(1,3), ds=[]; for(var k=0;k<n;k++)ds.push([x+rr(-2.5,2.5),y+rr(-1.2,1.2),rr(0.6,1.05),ri(150,205)]);
    ctx.add(ctx.ST.FINISH,x+3,function(g){ g.noStroke(); for(var i=0;i<ds.length;i++){ g.fill(C.ink[0],C.ink[1],C.ink[2],ds[i][3]); g.ellipse(ds[i][0],ds[i][1],ds[i][2]*2,ds[i][2]*1.7); } }); }
  // stone courses on a face hung from the x-ascending polyline `top`: course lines every ~6 px, joints every ~14 px staggered, a quarter missing
  function courses(ctx,top,h,z,skip,al){ var rr=ctx.rr, R=ctx.R, ST=ctx.ST, C=ctx.C, cs=[0], k, zf=typeof z==='function'?z:function(){ return z; };
    for(var cy=rr(4.5,7);cy<h-2.5;cy+=rr(5.4,6.6))cs.push(cy);
    // D-08 (d): the courses are drawn only in the front fifth of the face, then fade — fewer pieces, paler, more joints missing
    for(k=1;k<cs.length;k++){ var cyk=cs[k], stag=(k%2)*7+rr(-1.5,1.5), prev=cs[k-1], tf=cyk/h, f=tf<0.2?1:Math.max(0,1-(tf-0.2)/0.6); if(f<=0)continue;
      alongF(top,cyk,skip,function(r){ pieces(ctx,r,0.85*f,function(q){ ctx.rline(ST.JIEHUA,q[2],C.ink,rr(al*0.65,al)*(0.5+0.5*f),rr(0.5,0.6),q[0],q[1],q[2],q[3],zf((q[0]+q[2])/2),rr(0.3,1.2)); }); });
      for(var jx=top[0][0]+stag+rr(2,10);jx<top[top.length-1][0]-2;jx+=rr(16,30)){ var jy=yAt(top,jx); if(skip&&skip(jx,jy+(prev+cyk)/2))continue; if(R()<0.45+0.5*(1-f))continue;
        ctx.rline(ST.JIEHUA,jx,C.ink,rr(al*0.6,al*0.85)*(0.5+0.5*f),0.5,jx,jy+prev,jx,jy+cyk,zf(jx),rr(0.2,0.6)); } }
    return cs; }
  // railing standing on the polylines in `runs` (each [x0,y0,x1,y1]): posts every 7.4–8.6 px, a 望柱 every 4–6, top rail and a lighter mid rail
  function railing(ctx,runs,h,zOff){ var rr=ctx.rr, R=ctx.R, ri=ctx.ri, ST=ctx.ST, C=ctx.C, next=ri(3,5), cnt=0;
    for(var e=0;e<runs.length;e++){ var r=runs[e], dx=r[2]-r[0], dy=r[3]-r[1], L=Math.sqrt(dx*dx+dy*dy), s=rr(1.5,4.5);
      while(s<=L-1){ var t=s/L, px=r[0]+dx*t, py=r[1]+dy*t, big=cnt===next; if(big)next=cnt+ri(4,6);
        var ph=big?h*1.18:h*rr(0.96,1.04), w=big?0.9:0.7, al=big?rr(170,200):rr(140,185);
        ctx.rline(ST.JIEHUA,px,C.ink,al,w,px,py,px,py-ph,py+zOff,rr(0.3,1));
        if(big)ctx.line(ST.JIEHUA,px,C.ink,200,1.7,px,py-ph-0.9,px,py-ph-0.7);
        cnt++; s+=rr(7.4,8.6); }
      var zr=Math.max(r[1],r[3])+zOff, mx=Math.max(r[0],r[2]);
      ctx.rline(ST.JIEHUA,mx,C.ink,190,0.8,r[0],r[1]-h,r[2],r[3]-h,zr);
      if(R()<0.85)ctx.rline(ST.JIEHUA,mx,C.ink,130,0.55,r[0],r[1]-h*0.55,r[2],r[3]-h*0.55,zr);
      else { var c=rr(0.3,0.7), g=rr(0.04,0.08); ctx.rline(ST.JIEHUA,mx,C.ink,130,0.55,r[0],r[1]-h*0.55,r[0]+dx*(c-g),r[1]+dy*(c-g)-h*0.55,zr); ctx.rline(ST.JIEHUA,mx,C.ink,130,0.55,r[0]+dx*(c+g),r[1]+dy*(c+g)-h*0.55,r[2],r[3]-h*0.55,zr); } } }
  // gate opening in a wall face: jambs (line pairs) and a double lintel, 淡墨 in the opening
  function gate(ctx,B,g,z){ var rr=ctx.rr, ST=ctx.ST, C=ctx.C, x0=g.x-g.w/2, x1=g.x+g.w/2, yb0=yAt(B,x0), yb1=yAt(B,x1), yt=g.top;
    var Rl=function(al,w,a,b,c,d){ ctx.rline(ST.JIEHUA,Math.max(a,c),C.ink,al,w,a,b,c,d,z,rr(0.5,1.5)); };
    Rl(190,0.85,x0,yb0,x0,yt); Rl(150,0.6,x0+2,yb0,x0+2,yt+2); Rl(190,0.85,x1,yb1,x1,yt); Rl(150,0.6,x1-2,yb1,x1-2,yt+2);
    Rl(195,0.9,x0-2,yt,x1+2,yt); Rl(160,0.65,x0-1,yt+2.6,x1+1,yt+2.6);
    ctx.wash(ST.INDIGO,[[x0+2.5,yt+3.2],[x1-2.5,yt+3.2],[x1-2.5,yb1-0.5],[x0+2.5,yb0-0.5]],C.danmo,0.09,2.5,2.4,z); }

  // ---------------------------------------------------------------- D-07 continuous ground primitives
  // resample a polyline at ~2 px so bline gets a dense hand line; then cut it into `nb` gaps of 4–8 px
  function dense(pts,step){ var q=[]; for(var e=1;e<pts.length;e++){ var a=pts[e-1], b=pts[e], dx=b[0]-a[0], dy=b[1]-a[1], L=Math.sqrt(dx*dx+dy*dy), n=Math.max(1,Math.round(L/step)); for(var i=(e===1?0:1);i<=n;i++)q.push([a[0]+dx*i/n,a[1]+dy*i/n]); } return q; }
  function withBreaks(ctx,q,nb){ var rr=ctx.rr, n=q.length, cuts=[], k, i, out=[], cur=[]; for(k=0;k<nb;k++)cuts.push([Math.floor(n*(k+0.5+rr(-0.3,0.3))/nb),Math.round(rr(2,4))]);
    for(i=0;i<n;i++){ var inCut=false; for(k=0;k<cuts.length;k++)if(i>=cuts[k][0]&&i<cuts[k][0]+cuts[k][1])inCut=true; if(inCut){ if(cur.length>=2)out.push(cur); cur=[]; } else cur.push(q[i]); } if(cur.length>=2)out.push(cur); return out; }
  // (c) bank line: one primary-grade brush line along the water edge with 2–3 breaks, a 淡墨 shadow 2 px below it in INDIGO
  function bankLine(ctx,spec){ var rr=ctx.rr, ri=ctx.ri, ST=ctx.ST, C=ctx.C, z=spec.z||0, q=dense(spec.pts,2), runs=withBreaks(ctx,q,ri(2,3)), i;
    for(i=0;i<runs.length;i++)ctx.bline(ST.TREES,maxX(runs[i]),C.ink,rr(198,218),rr(0.72,0.86),runs[i],z);
    var sh=withBreaks(ctx,shift(q,0,2).map(function(v,k){ return [v[0],v[1]+(ctx.noise(v[0]*0.05,3.1)-0.5)*0.8]; }),ri(1,2));
    for(i=0;i<sh.length;i++)ctx.bline(ST.INDIGO,maxX(sh[i]),C.danmo,rr(95,125),rr(0.5,0.6),sh[i],z);
    return {fp:EMPTY,slots:{pts:spec.pts}}; }
  // (b) a flight of n 3-px treads from (x,y) down toward the water, ruled; treads drift dir·0.6 px per step and widen a little
  function steps(ctx,spec){ var rr=ctx.rr, R=ctx.R, ST=ctx.ST, C=ctx.C, x=spec.x, y=spec.y, w=spec.w||30, n=spec.n||8, dir=spec.dir||0, rise=3, yB=y+rise*n, z=spec.z===undefined?yB:spec.z, k;
    var Rl=function(al,wd,a,b,c,d,ov){ ctx.rline(ST.JIEHUA,Math.max(a,c),C.ink,al,wd,a,b,c,d,z,ov); };
    var xl=function(k){ return x-w/2*(1+0.03*k)+dir*0.6*k; }, xr=function(k){ return x+w/2*(1+0.03*k)+dir*0.6*k; };
    Rl(rr(150,172),0.62,xl(0),y,xl(n),yB); Rl(rr(150,172),0.62,xr(0),y,xr(n),yB);
    for(k=0;k<=n;k++){ var yy=y+rise*k+rr(-0.25,0.25), a=xl(k), b=xr(k); if(k>0&&k<n&&R()<0.15){ if(R()<0.5)a+=(b-a)*rr(0.25,0.5); else b-=(b-a)*rr(0.25,0.5); }
      Rl(k===0?rr(160,180):rr(118,150),k===0?0.65:rr(0.5,0.58),a,yy,b,yy,rr(0.2,0.8)); }
    ctx.wash(ST.OCHRE,[[xl(0),y],[xr(0),y],[xr(n),yB],[xl(n),yB]],C.ochre,0.16,3,2.6,z);
    ctx.wash(ST.INDIGO,[[xl(n-2),y+rise*(n-2)],[xr(n-2),y+rise*(n-2)],[xr(n),yB+0.5],[xl(n),yB+0.5]],C.danmo,0.12,2.4,2,z);
    return {fp:EMPTY,slots:{top:[x,y],bottom:[x+dir*0.6*n,yB],w:w}}; }
  // (a) terrace: a strip behind the front edge `pts` (given right→left), `depth` deep (negative depth: the strip lies in front of the edge).
  // D-08: the front edge is ONE continuous structural line that dips and rises; the strip carries a few texture-grade contour lines
  // following it and 点苔 on the edge; the earth is one graded 赭石 wash (full at the edge, gone at 60 % depth) with 1–2 large
  // irregular reserves; edge marks by kind (street 沿石 / quay stone + 缆桩 + 跳板 / bank long 皴 down to the water + reeds)
  function terrace(ctx,spec){ var rr=ctx.rr, R=ctx.R, ri=ctx.ri, ST=ctx.ST, C=ctx.C, INK=ctx.INK, F=ascending(spec.pts), depth=spec.depth||24, z=spec.z||0, kind=spec.kind||'street', i, k;
    var x0=F[0][0], x1=F[F.length-1][0], L=x1-x0, ad=Math.abs(depth), sg=depth<0?-1:1, bank=kind==='bank';
    // the edge dips and rises: 4–8 px by slow noise on a bank, 1.5 px on a kerb or 堤石 (those are built, the earth is not)
    var amp=bank?rr(4,8):1.0, ph=rr(0,50);
    var eq=dense(F,2).map(function(v){ return [v[0],v[1]+(ctx.noise(v[0]*0.011+ph,z*0.01+1.7)-0.5)*2*amp+(ctx.noise(v[0]*0.07+ph,4.2)-0.5)*(bank?1.2:0.5)]; });
    var edgeY=function(x){ return yAt(eq,x); }, yTop=function(x){ return sg>0?edgeY(x)-ad:edgeY(x); }, yBot=function(x){ return sg>0?edgeY(x):edgeY(x)+ad; };
    var back=shift(F,0,-depth), P=eq.concat(back.slice().reverse()), b=bbox(P), ins=ctx.polyInside(P), ed=ctx.polyEdge(P);
    var Rl=function(al,w,a,bb,c,d,ov){ ctx.rline(ST.JIEHUA,Math.max(a,c),C.ink,al,w,a,bb,c,d,z,ov); };
    // walk the edge in 30–60 px pieces, `cy` below it, keeping a fraction — the kerb face and the stone course follow the dips as chords
    var alongE=function(cy,keep,cb){ var s=x0+rr(0,6); while(s<x1-3){ var e=Math.min(s+rr(30,60),x1); if(R()<keep)cb(s,edgeY(s)+cy,e,edgeY(e)+cy); s=e+rr(2,7); } };
    // 起稿 of the edge first (pale, in DRAFT), then the front edge as one structural line; bank freehand in TREES, built edges in JIEHUA
    broken(ctx,F,68,0.45,z,0.75);
    var runs=(bank&&L>300)?withBreaks(ctx,eq,1):[eq];
    for(i=0;i<runs.length;i++)ctx.bline(bank?ST.TREES:ST.JIEHUA,maxX(runs[i]),C.ink,INK.structural[1]*rr(0.95,1.1),INK.structural[0]*rr(0.95,1.1),runs[i],z);
    // contour lines: texture grade, 30–60 px, following the edge at 0.2–0.75 of the depth; 点苔 on the edge
    var nc=Math.max(1,Math.round(L/160*(bank?rr(2,3):rr(0.4,0.8)))), cph=rr(0,30);
    for(k=0;k<nc;k++){ var cl=rr(30,60), cx0=rr(x0+2,Math.max(x0+2,x1-cl-2)), ct=rr(0.2,0.75), q=[], n=Math.max(3,Math.round(cl/6));
      for(i=0;i<=n;i++){ var xx=cx0+cl*i/n; q.push([xx,edgeY(xx)-sg*ad*ct+(ctx.noise(xx*0.05+cph+k*7,2.2)-0.5)*2.2]); }
      ctx.bline(ST.TREES,cx0+cl,C.ink,INK.texture[1]*rr(0.8,1.1),INK.texture[0],q,z); }
    for(var mx=x0+rr(10,40);mx<x1-6;mx+=bank?rr(40,80):rr(120,200)){ if(R()<0.25)continue; moss(ctx,mx,edgeY(mx)+rr(-1.5,1.5)); }
    // the earth (D-19 3): TWO 赭 passes with the same reserves — first a full thin 赭石 over the WHOLE strip (0.18 nominal, C.ochre2 — C.ochre has the silk's own luminance and only warms),
    // then a second local pass of the darker 赭 (0.3, C.ochre2) that is full at the given edge — the foot of a row's wall, the water's
    // edge — and gone at ~45 % of the depth (the boundary wanders by noise). 1–2 large irregular reserves stay blank in both;
    // laid at 2.2× the nominal ink because dabs' radial fade leaves about half on the silk; the back quarter of the full pass thins to about
    // half so the strip's far boundary is torn, not ruled. A bank also takes a 汁绿 verge (below).
    var holes=[], nh=ri(1,2); for(k=0;k<nh;k++)holes.push({x:rr(x0+L*(k+0.15)/nh,x0+L*(k+0.85)/nh),r:rr(Math.min(ad*0.35,9),Math.min(ad*0.6,20)),d:rr(ad*0.12,ad*0.42),ph:rr(0,9)});
    for(k=0;k<nh;k++)holes[k].y=edgeY(holes[k].x)-sg*holes[k].d;
    var ink=spec.ink===undefined?0.18:spec.ink*0.75, ink2=ink*1.67, reg={x0:b.x0,x1:b.x1,y0:b.y0,y1:b.y1,z:z,inside:ins,edge:ed,tone:spec.tone};
    var open=function(x,y){ if(ctx.masks.waterAt(x,y))return false;
      for(var h=0;h<holes.length;h++){ var H=holes[h], dx=x-H.x, dy=y-H.y, dd=Math.sqrt(dx*dx+dy*dy); if(dd<0.5)return false;
        var rt=H.r*(0.65+0.7*ctx.noise(H.ph+dx/dd*1.3+2,dy/dd*1.3+2)); if(dd<rt)return false; if(dd<rt+3&&R()<(rt+3-dd)/3*0.7)return false; }
      return true; };
    var dEdge=function(x,y,frac){ return (edgeY(x)-y)*sg/(ad*frac*(0.85+0.3*ctx.noise(x*0.015+z*0.01,9.5))); };
    ctx.dabs(ST.OCHRE,reg,C.ochre2,Math.min(0.9,ink*2.2),2.5,3.4,function(x,y){ if(!open(x,y))return false; return R()<(0.9+0.1*ctx.noise(x*0.02+z*0.01,y*0.02+5.5))*(1-0.55*ctx.smoothstep(0.72,1.05,dEdge(x,y,1))); });
    ctx.dabs(ST.OCHRE,reg,C.ochre2,Math.min(0.9,ink2*2.2),2.3,3.2,function(x,y){ if(!open(x,y))return false; return R()<1-ctx.smoothstep(0,1,dEdge(x,y,0.45)); });
    // bank only: 汁绿 (C.zhilv, 0.12) on the grass verge — the far side of the strip from the water's edge, over the ochre base, holes kept
    if(bank){ var ZL=C.zhilv||[108,124,70]; ctx.dabs(ST.INDIGO,reg,ZL,Math.min(0.9,0.12*2.2),2.6,3.2,function(x,y){ if(!open(x,y))return false; return R()<ctx.smoothstep(0.35,0.75,dEdge(x,y,1)); }); }
    // edge marks
    if(kind==='street'){ // 沿石: kerb face 2 px below the edge in pieces, joint ticks every 12–18 px
      alongE(2,0.7,function(a,bb,c,d){ Rl(rr(95,125),0.5,a,bb,c,d,rr(0.2,0.6)); });
      for(var sx=x0+rr(3,9);sx<x1-2;sx+=rr(12,18)){ var sy=edgeY(sx); if(R()<0.2)continue; Rl(rr(105,140),0.5,sx,sy-0.2,sx+0.3,sy+2.2,rr(0,0.3)); } }
    else if(kind==='quay'){ // one stone course 6 px tall hung from the edge, blocks ~14 px, a quarter of joints missing; 2–3 缆桩; one 跳板
      alongE(6,0.85,function(a,bb,c,d){ Rl(rr(110,145),rr(0.5,0.6),a,bb,c,d,rr(0.3,1)); });
      for(var jx=x0+rr(4,12);jx<x1-2;jx+=rr(12,16)){ var jy=edgeY(jx); if(R()<0.25)continue; Rl(rr(100,135),0.5,jx,jy+0.3,jx,jy+6,rr(0.1,0.5)); }
      var nb=ri(2,3); for(k=0;k<nb;k++){ (function(){ var px=rr(x0+L*(k+0.15)/nb,x0+L*(k+0.85)/nb), py=edgeY(px)-0.5, ph=rr(4,5.5), pw=rr(2,2.8);
        Rl(rr(190,215),0.75,px-pw/2,py,px-pw/2,py-ph,rr(0.2,0.6)); Rl(rr(165,190),0.65,px+pw/2,py,px+pw/2,py-ph,rr(0.2,0.6)); Rl(rr(200,220),0.8,px-pw/2-0.6,py-ph,px+pw/2+0.6,py-ph,0.3);
        ctx.wash(ST.OCHRE,[[px-pw/2,py-ph+0.5],[px+pw/2,py-ph+0.5],[px+pw/2,py],[px-pw/2,py]],C.ochre2,0.3,1.2,1.1,z); })(); }
      (function(){ var gx=rr(x0+L*0.25,x0+L*0.75), gy=edgeY(gx), gd=spec.plankDir||(R()<0.5?1:-1), gl=rr(12,18), ex=gx+gd*gl*0.55, ey=gy+gl*0.85;
        Rl(rr(170,195),0.7,gx,gy-0.3,ex,ey); Rl(rr(150,175),0.6,gx+gd*2.6,gy,ex+gd*2.4,ey+0.6);
        for(var t=0.2;t<0.95;t+=rr(0.2,0.28))Rl(rr(110,140),0.5,gx+(ex-gx)*t,gy+(ey-gy)*t,gx+(ex-gx)*t+gd*2.5,gy+(ey-gy)*t+0.5,rr(0,0.3)); })(); }
    else { // bank: long 皴 from the top of the slope down to the water, about three per 40 px, unequal; a few stubs on the edge; 3–5 reed tufts
      var lean=R()<0.5?1:-1;
      for(var gx=x0+rr(3,12);gx<x1-8;gx+=rr(28,44)){ var ng=ri(2,4), gsl=lean*rr(0.3,0.6), cx=gx;
        for(var g=0;g<ng;g++){ cx+=g?rr(3.5,7):0; if(cx>x1-3)break; var ya=yTop(cx)+ad*rr(0.45,0.7), yb=yBot(cx)-rr(0,1.5), ly=yb-ya; if(ly<3)continue;
          var sl=gsl*rr(0.8,1.25), heavy=g===0&&R()<0.5, q=[[cx,ya],[cx+sl*ly*0.45-lean*ly*0.03,ya+ly*0.5],[cx+sl*ly,yb]];
          ctx.bline(ST.TREES,cx+Math.abs(sl*ly)+1,C.ink,heavy?rr(105,120):INK.texture[1]*rr(0.8,1.1),heavy?0.42:INK.texture[0],q,z); } }
      for(var cx3=x0+rr(6,14);cx3<x1-3;cx3+=rr(15,30)){ var cy3=edgeY(cx3)-rr(0,1.5), l3=rr(2.5,4), s3=rr(0.35,0.7)*(R()<0.5?1:-1); if(R()<0.35)continue; ctx.bline(ST.TREES,cx3+l3,C.ink,rr(100,125),0.4,[[cx3,cy3],[cx3+s3*l3*0.5,cy3+l3*0.45],[cx3+s3*l3,cy3+l3*0.9]],z); }
      var nt=ri(3,5); for(k=0;k<nt;k++){ (function(){ var tx=rr(x0+L*(k+0.1)/nt,x0+L*(k+0.9)/nt), ty=edgeY(tx)+rr(-1,1), nb2=ri(4,6), bl=[];
        for(var j=0;j<nb2;j++){ var h=rr(6,11), sx2=rr(-3,3), q=[[tx+rr(-0.6,0.6),ty],[tx+sx2*0.4,ty-h*0.55],[tx+sx2,ty-h]]; bl.push(q); }
        for(var j2=0;j2<bl.length;j2++)ctx.bline(ST.TREES,tx+4,C.ink,rr(150,200),rr(0.48,0.6),bl[j2],z); })(); } }
    return {fp:EMPTY,slots:{front:F,back:back,poly:P,edge:eq}}; }
  // (e) D-08: a tree's foot — a small mound of earth around the trunk base with 2–3 short 皴 and one shadow dot, so the base sits in the ground.
  // {x,y} = the trunk's ground contact, w = the trunk width there, z = the tree's z (default y). main.js calls it under every tree on a terrace.
  function foot(ctx,spec){ var rr=ctx.rr, R=ctx.R, ri=ctx.ri, ST=ctx.ST, C=ctx.C, INK=ctx.INK, x=spec.x, y=spec.y, w=spec.w||5, z=spec.z===undefined?y:spec.z, i;
    var mw=w*rr(2,2.6)+5, mh=rr(2.5,4)+w*0.2, dir=R()<0.5?1:-1;
    // the mound: two arcs from the ground line up into the trunk flare, left and right, structural weight; a broken toe line in front
    var lft=[[x-mw,y+1],[x-mw*0.6,y-mh*0.55],[x-w*0.6,y-mh]], rgt=[[x+mw*rr(0.8,1.1),y+0.8],[x+mw*0.55,y-mh*0.5],[x+w*0.6,y-mh*0.95]];
    ctx.bline(ST.TREES,x+mw,C.ink,INK.structural[1]*rr(0.9,1.05),INK.structural[0]*rr(0.9,1.05),lft,z); ctx.bline(ST.TREES,x+mw,C.ink,INK.structural[1]*rr(0.8,0.95),INK.structural[0]*rr(0.85,1),rgt,z);
    // 2–3 皴 lying on the mound, sloping outward and down to its toe
    var n=ri(2,3); for(i=0;i<n;i++){ var side=R()<0.5?-1:1, sx=x+side*rr(w*0.7,mw*0.45), sy=y-mh*rr(0.45,0.85), ex=x+side*rr(mw*0.55,mw*0.95), ey=y+rr(0,0.6);
      ctx.bline(ST.TREES,Math.max(sx,ex),C.ink,INK.texture[1]*rr(0.8,1.05),INK.texture[0],[[sx,sy],[(sx+ex)/2+side*0.4,(sy+ey)/2+0.3],[ex,ey]],z); }
    ctx.wash(ST.OCHRE,[[x-mw*1.35,y+2.2],[x+mw*1.35,y+2.2],[x+mw*0.7,y-mh],[x-mw*0.7,y-mh]],C.ochre2,0.3,1.6,1.4,z);   // D-19: the local 赭 pass at a tree's foot reaches a little past the mound's toe
    var dx=x+dir*(w*0.5+rr(0.5,1.5)), dy=y-rr(0,0.8), dr=rr(0.7,1.0), da=ri(150,200);
    ctx.add(ST.FINISH,dx+2,function(g){ g.noStroke(); g.fill(C.ink[0],C.ink[1],C.ink[2],da); g.ellipse(dx,dy,dr*2.2,dr*1.6); });
    return {fp:EMPTY,slots:{x:x,y:y,w:mw}}; }

  // ---------------------------------------------------------------- flat kinds
  // ground {poly, ink=0.2, tone, moss=true}: blank silk under a holed 赭石 wash and a few 点苔 clusters
  function ground(ctx,zn){ var rr=ctx.rr, R=ctx.R, P=zn.poly, b=bbox(P), ins=ctx.polyInside(P);
    groundWash(ctx,P,zn.ink===undefined?0.2:zn.ink,zn.tone);
    if(zn.moss!==false){ var n=Math.round((b.x1-b.x0)*(b.y1-b.y0)/7000); for(var k=0;k<n;k++){ var x=rr(b.x0,b.x1), y=rr(b.y0,b.y1); if(ins(x,y)&&!ctx.masks.solidAt(x,y)&&!ctx.masks.waterAt(x,y)&&R()<0.7)moss(ctx,x,y); } }
    return {fp:EMPTY,slots:{poly:P}}; }
  // road {poly, edges?=[poly loop], crossing|crossings, treepits, busstop, wash=0.15, margin=10}: blank centre, broken 淡墨 edges,
  // 点苔 along the edges, a worn 赭石 margin, and the street furniture
  function road(ctx,zn){ var rr=ctx.rr, ri=ctx.ri, P=zn.poly, edges=zn.edges||[P.concat([P[0]])], i, k;
    for(i=0;i<edges.length;i++){ var E=edges[i]; broken(ctx,E,75,0.5,0,0.8);
      for(k=1;k<E.length;k++){ var a=E[k-1], b=E[k], dx=b[0]-a[0], dy=b[1]-a[1], L=Math.sqrt(dx*dx+dy*dy); if(L<20)continue;
        for(var s=rr(6,30);s<L-4;s+=rr(28,70)){ var t=s/L, off=rr(-2.2,2.2); moss(ctx,a[0]+dx*t-dy/L*off,a[1]+dy*t+dx/L*off); } } }
    var m=zn.margin===undefined?10:zn.margin, ink=zn.wash===undefined?0.15:zn.wash;
    if(ink>0&&m>0)groundWash(ctx,P,ink,zn.tone,function(x,y,ed){ return ed(x,y)<m*(0.4+1.4*ctx.noise(x*0.03+2,y*0.03)); });
    var cr=zn.crossings||(zn.crossing?[zn.crossing]:[]); for(i=0;i<cr.length;i++)crossing(ctx,cr[i]);
    var tp=zn.treepits||[]; for(i=0;i<tp.length;i++)treepit(ctx,tp[i]);
    var slots={poly:P,crossings:cr,treepits:tp}; if(zn.busstop)slots.busstop=busstop(ctx,zn.busstop).slots;
    return {fp:EMPTY,slots:slots}; }
  // field {poly, dir?, gap=4–6, bund=true}: 田垄 as faint parallel lines 4–6 px apart, each slightly bowed, ends trimmed, a few split
  function field(ctx,zn){ var rr=ctx.rr, R=ctx.R, ri=ctx.ri, P=zn.poly, b=bbox(P), ins=ctx.polyInside(P), i;
    var ang=zn.dir===undefined?rr(0.05,0.16)*(R()<0.5?1:-1):zn.dir, gap=zn.gap||rr(4,6), ux=Math.cos(ang), uy=Math.sin(ang), nx=-uy, ny=ux;
    var cs=[[b.x0,b.y0],[b.x1,b.y0],[b.x0,b.y1],[b.x1,b.y1]], dmin=1e9,dmax=-1e9,smin=1e9,smax=-1e9;
    for(i=0;i<4;i++){ var dd=cs[i][0]*nx+cs[i][1]*ny, ss=cs[i][0]*ux+cs[i][1]*uy; dmin=Math.min(dmin,dd); dmax=Math.max(dmax,dd); smin=Math.min(smin,ss); smax=Math.max(smax,ss); }
    var bow=R()<0.5?1:-1;
    for(var d=dmin+rr(1,gap);d<dmax;d+=gap*rr(0.8,1.2)){ if(R()<0.1)continue; var runs=[], run=[], w=rr(0.38,0.5);
      for(var s=smin;s<=smax;s+=4){ var x=ux*s+nx*d, y=uy*s+ny*d; if(ins(x,y))run.push([x,y]); else if(run.length){ runs.push(run); run=[]; } } if(run.length)runs.push(run);
      for(i=0;i<runs.length;i++){ var r=runs[i], n=r.length; if(n<4)continue; var c0=ri(0,3), c1=ri(0,3); r=r.slice(c0,n-c1); n=r.length; var a=0;
        while(n-a>=3){ var m=Math.min(n-a,ri(10,30)); if(n-a-m<4)m=n-a; var q=r.slice(a,a+m), sag=rr(0.6,2.2)*bow, al=rr(50,85)*(0.55+0.45*(q[0][1]-b.y0)/Math.max(1,b.y1-b.y0));
          for(var k=0;k<m;k++){ var t=k/(m-1), o=sag*Math.sin(Math.PI*t)+(ctx.noise(q[k][0]*0.06,d*0.3)-0.5)*0.8; q[k]=[q[k][0]+nx*o,q[k][1]+ny*o]; }
          ridge(ctx,q,al,w); a+=m+ri(1,2); } } }
    if(zn.bund)broken(ctx,P.concat([P[0]]),70,0.5,0,0.75);
    groundWash(ctx,P,zn.ink===undefined?0.15:zn.ink,zn.tone);
    return {fp:EMPTY,slots:{poly:P}}; }
  function ridge(ctx,r,al,w){ if(r.length>=2)ctx.bline(ctx.ST.TREES,maxX(r),ctx.C.ink,al,w,r,0); }
  // crossing {x,y,n=5–7,ang=0}: 斑马线 — a 赭石 band across the road with 5–7 silk gaps 4×12 px along ctx.OBL
  function crossing(ctx,zn){ var rr=ctx.rr, ri=ctx.ri, o=ctx.OBL, on=Math.sqrt(o[0]*o[0]+o[1]*o[1]), ux=o[0]/on, uy=o[1]/on;
    var n=zn.n||ri(5,7), pitch=rr(8,9.5), len=zn.len||14, ang=zn.ang||0, cx=Math.cos(ang), cy=Math.sin(ang), W=n*pitch, x=zn.x, y=zn.y, s0=-W/2, s1=W/2;
    var P=[[x+cx*s0,y+cy*s0],[x+cx*s1,y+cy*s1],[x+cx*s1+ux*len,y+cy*s1+uy*len],[x+cx*s0+ux*len,y+cy*s0+uy*len]], b=bbox(P), det=cx*uy-cy*ux, st=[];
    for(var k=0;k<n;k++)st.push(s0+pitch*(k+0.5)+rr(-0.6,0.6));
    ctx.dabs(ctx.ST.OCHRE,{x0:b.x0,x1:b.x1,y0:b.y0,y1:b.y1,z:0,inside:ctx.polyInside(P),edge:ctx.polyEdge(P)},ctx.C.ochre,0.3,1.6,1.5,function(px,py){ var s=((px-x)*uy-(py-y)*ux)/det; for(var j=0;j<n;j++)if(Math.abs(s-st[j])<2)return false; return true; },{pool:true});
    return {fp:EMPTY,slots:{x:x,y:y,poly:P}}; }
  // treepit {x,y,s=10–14}: a kerbed square on the ground plane (front edge at y, depth along ctx.OBL), soil 赭石 inside
  function treepit(ctx,zn){ var rr=ctx.rr, o=ctx.OBL, s=zn.s||rr(10,14), x=zn.x, y=zn.y, ox=o[0]*s, oy=o[1]*s, ST=ctx.ST, C=ctx.C, al=rr(115,150);
    var P=[[x-s/2,y],[x+s/2,y],[x+s/2+ox,y+oy],[x-s/2+ox,y+oy]];
    var L=function(a,b,w){ ctx.rline(ST.JIEHUA,Math.max(a[0],b[0]),C.ink,al*rr(0.88,1.1),w,a[0],a[1],b[0],b[1],0,rr(0.8,2)); };
    L(P[0],P[1],0.6); L(P[1],P[2],0.55); L(P[2],P[3],0.5); L(P[3],P[0],0.55); L([P[0][0]+1.6,P[0][1]-1.3],[P[1][0]-1.6,P[1][1]-1.3],0.45);
    ctx.wash(ST.OCHRE,[[x-s/2+1.5,y-1.6],[x+s/2-1.5,y-1.6],[x+s/2+ox-1.5,y+oy+1.2],[x-s/2+ox+1.5,y+oy+1.2]],C.ochre2,0.25,2.5,2.2,0);
    return {fp:EMPTY,slots:{tree:[x+ox*0.5,y+oy*0.5]}}; }

  // ---------------------------------------------------------------- solid kinds
  // busstop {x,y,h=40}: pole as a line pair with a base, a board 9×13 hung to its right with a 花青 header and an ink blob for the name
  function busstopGeom(zn){ var h=zn.h||40; return {x:zn.x,y:zn.y,h:h,bx:zn.x+1.4,by:zn.y-h+1,bw:9,bh:13}; }
  function busstopFp(zn){ var G=busstopGeom(zn); return {x0:G.bx,x1:G.bx+G.bw,y0:G.by,y1:G.by+G.bh,z:G.y,inside:function(px,py){ return px>=G.bx&&px<=G.bx+G.bw&&py>=G.by&&py<=G.by+G.bh; }}; }
  function busstop(ctx,zn){ var rr=ctx.rr, ri=ctx.ri, ST=ctx.ST, C=ctx.C, G=busstopGeom(zn), x=G.x, y=G.y, h=G.h, z=y, bx=G.bx, by=G.by, bw=G.bw, bh=G.bh;
    var Rl=function(al,w,a,b,c,d){ ctx.rline(ST.JIEHUA,Math.max(a,c),C.ink,al,w,a,b,c,d,z,rr(0.4,1.2)); };
    Rl(185,0.75,x,y,x,y-h); Rl(150,0.55,x+1.4,y-0.5,x+1.4,y-h+1); Rl(170,0.7,x-2.5,y+0.3,x+4,y+0.3);
    Rl(180,0.75,bx,by,bx+bw,by); Rl(180,0.75,bx+bw,by,bx+bw,by+bh); Rl(180,0.75,bx+bw,by+bh,bx,by+bh);
    ctx.wash(ST.INDIGO,[[bx+0.8,by+0.6],[bx+bw-0.6,by+0.6],[bx+bw-0.6,by+3.2],[bx+0.8,by+3.2]],C.huaqing,0.35,1.5,1.4,z);
    var nd=ri(3,4), ds=[]; for(var k=0;k<nd;k++)ds.push([bx+bw*0.5+rr(-0.7,0.7),by+5+k*(bh-6.5)/(nd-1)+rr(-0.3,0.3),rr(0.9,1.35),rr(0.55,0.8)]);
    ctx.add(ST.FINISH,bx+bw,function(g){ g.noStroke(); for(var i=0;i<ds.length;i++){ g.fill(C.ink[0],C.ink[1],C.ink[2],Math.round(255*ds[i][3])); g.ellipse(ds[i][0],ds[i][1],ds[i][2]*2.2,ds[i][2]*1.7); } });
    return {fp:busstopFp(zn),slots:{stop:[x,y]}}; }
  // railing {pts, h=12}: a free-standing railing along a polyline (promenade edge, bridge approach)
  function railKind(ctx,zn){ var runs=[]; for(var i=1;i<zn.pts.length;i++)runs.push([zn.pts[i-1][0],zn.pts[i-1][1],zn.pts[i][0],zn.pts[i][1]]); railing(ctx,runs,zn.h||12,1); return {fp:EMPTY,slots:{pts:zn.pts}}; }

  // quay {front, wallH=28, steps:[{x,w=44,n=8–14}], rail?:{h=12,set=2}, poly?, ink=0.12}: 堤石 face with courses hung from the front line,
  // 台阶 blocks cut through it (walkable — excluded from the footprint), a railing on the platform set back from the edge, a worn strip of 赭石 along the edge
  function quayGeom(zn){ var F=ascending(zn.front), H=zn.wallH||28, st=(zn.steps||[]).map(function(s){ var yT=yAt(F,s.x); return {x:s.x,w:s.w||44,n:s.n,yT:yT,yB:yT+H}; });
    var inSteps=function(x,y){ for(var i=0;i<st.length;i++){ var s=st[i]; if(Math.abs(x-s.x)<s.w/2*(1+0.12*Math.max(0,y-s.yT)/H)+0.5)return true; } return false; };
    var stepsX=function(x){ for(var i=0;i<st.length;i++)if(Math.abs(x-st[i].x)<st[i].w/2+2.5)return true; return false; };
    return {F:F,H:H,steps:st,face:facePoly(F,H),inSteps:inSteps,stepsX:stepsX,z:maxY(F)}; }
  function quayFp(ctx,zn){ var G=quayGeom(zn), b=bbox(G.face), ins=ctx.polyInside(G.face); return {x0:b.x0,x1:b.x1,y0:b.y0,y1:b.y1,z:G.z,inside:function(x,y){ return ins(x,y)&&!G.inSteps(x,y); }}; }
  function quay(ctx,zn){ var rr=ctx.rr, R=ctx.R, ri=ctx.ri, ST=ctx.ST, C=ctx.C, G=quayGeom(zn), F=G.F, H=G.H, z=G.z, i, k;
    var Rl=function(al,w,a,b,c,d,ov){ ctx.rline(ST.JIEHUA,Math.max(a,c),C.ink,al,w,a,b,c,d,z,ov); };
    broken(ctx,shift(F,0,H),75,0.5,z,0.85);
    for(i=1;i<F.length;i++)Rl(195,0.85,F[i-1][0],F[i-1][1],F[i][0],F[i][1]);
    var cs=courses(ctx,F,H,z,G.inSteps,140);
    alongF(F,H,G.inSteps,function(r){ pieces(ctx,r,0.7,function(q){ Rl(rr(110,140),0.6,q[0],q[1],q[2],q[3],rr(0.2,0.8)); }); });
    for(i=0;i<G.steps.length;i++){ (function(s){ var n=s.n||ri(8,14), wid=function(y){ return s.w/2*(1+0.12*(y-s.yT)/H); };
      Rl(185,0.75,s.x-s.w/2,s.yT,s.x-wid(s.yB),s.yB); Rl(185,0.75,s.x+s.w/2,s.yT,s.x+wid(s.yB),s.yB);
      for(k=1;k<=n;k++){ var y=s.yT+H*k/n+rr(-0.3,0.3), hw=wid(y), xa=s.x-hw, xb=s.x+hw; if(R()<0.15){ if(R()<0.5)xa+=hw*rr(0.3,0.7); else xb-=hw*rr(0.3,0.7); }
        Rl(rr(120,170),rr(0.5,0.65),xa,y,xb,y,rr(0.2,0.8)); }
      ctx.wash(ST.OCHRE,[[s.x-s.w/2,s.yT],[s.x+s.w/2,s.yT],[s.x+wid(s.yB),s.yB],[s.x-wid(s.yB),s.yB]],C.ochre,0.2,3,2.8,z); })(G.steps[i]); }
    var b=bbox(G.face), notSteps=function(x,y){ return !G.inSteps(x,y); };
    ctx.dabs(ST.OCHRE,{x0:b.x0,x1:b.x1,y0:b.y0,y1:b.y1,z:z,inside:ctx.polyInside(G.face),edge:ctx.polyEdge(G.face)},C.ochre2,0.4,2.6,3.2,notSteps);   // D-19: a full thin 赭 (≈0.18 on the silk) over the whole face — C.ochre2, since C.ochre only warms
    // D-19 (3): the stone face is damp toward the water — 淡墨 courses re-emerge in the lower half of the face, darker the nearer the water line
    // (the ink courses above fade per D-08 d), and the damp band at the foot is a gradient, 0.3 at the water line thinning over 8 px
    for(k=1;k<cs.length;k++){ (function(cy){ var tf=cy/H; if(tf<0.45)return; var f=(tf-0.45)/0.55;
      alongF(F,cy,G.inSteps,function(r){ pieces(ctx,r,0.55+0.4*f,function(q){ ctx.rline(ST.INDIGO,q[2],C.danmo,rr(60,85)+95*f,rr(0.5,0.62),q[0],q[1]+rr(-0.3,0.3),q[2],q[3]+rr(-0.3,0.3),z,rr(0.2,0.8)); }); }); })(cs[k]); }
    ctx.dabs(ST.INDIGO,{x0:b.x0,x1:b.x1,y0:b.y0+H-8,y1:b.y1,z:z,inside:function(x,y){ var yt=yAt(F,x); return x>=F[0][0]&&x<=F[F.length-1][0]&&y>yt+H-8&&y<=yt+H; }},C.danmo,0.3,2.2,2.2,function(x,y){ if(!notSteps(x,y))return false; var yt=yAt(F,x); return R()<ctx.smoothstep(0,1,(y-(yt+H-8))/8*(0.85+0.3*ctx.noise(x*0.03,2.5))); });
    if(zn.poly)groundWash(ctx,zn.poly,zn.ink===undefined?0.12:zn.ink,zn.tone,function(x,y){ return y>yAt(F,x)-14*(0.5+ctx.noise(x*0.02,y*0.02)); });
    var runs=[]; if(zn.rail){ var set=zn.rail.set||2; alongF(F,-set,function(x){ return G.stepsX(x); },function(r){ runs.push(r); }); railing(ctx,runs,zn.rail.h||12,1); }
    return {fp:quayFp(ctx,zn),slots:{front:F,water:shift(F,0,H),steps:G.steps,rail:runs}}; }

  // floodwall {pts (base), h=44, gate?:{x,w=24,drop} | gates:[{x,w,drop}…]} and wall {pts, h=32, cap=6, gate?|gates?}: one face standing on the
  // base polyline, however long or receding. The base is cut into slices of ≤16 px of y, each with its own z (its near base y): every mark takes the
  // z of the slice it lies in, and footprint() returns the whole face with `slices` — main.js stamps each of `fp.slices||[fp]`.
  function wallGeom(zn){ var B0=ascending(zn.pts), h=zn.h||(zn.kind==='wall'?32:44), cap=zn.kind==='wall'?(zn.cap||6):0, B=[], i;
    for(i=0;i<B0.length;i++){ if(i>0){ var a=B0[i-1], b=B0[i], n=Math.max(1,Math.ceil(Math.abs(b[1]-a[1])/16)); for(var k=1;k<n;k++)B.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]); } B.push([B0[i][0],B0[i][1]]); }
    var top=shift(B,0,-h), slices=[]; for(i=1;i<B.length;i++)slices.push({x0:B[i-1][0],x1:B[i][0],z:Math.max(B[i-1][1],B[i][1])});
    var zAt=function(x){ for(var j=0;j<slices.length;j++)if(x<=slices[j].x1||j===slices.length-1)return slices[j].z; return slices[0].z; };
    var gs=(zn.gates||(zn.gate?[zn.gate]:[])).map(function(g){ return {x:g.x,w:g.w||24,top:yAt(top,g.x)+(g.drop===undefined?h*0.18:g.drop)}; });
    var inGate=function(x,y,pad){ for(var j=0;j<gs.length;j++)if(Math.abs(x-gs[j].x)<gs[j].w/2+(pad||0)&&y>gs[j].top-(pad?1:0))return true; return false; };
    return {B:B,h:h,cap:cap,top:top,x0:B[0][0],x1:B[B.length-1][0],g:gs[0]||null,gs:gs,inGate:inGate,slices:slices,zAt:zAt,z:maxY(B)}; }
  function wallFp(ctx,zn){ var G=wallGeom(zn), pad=G.cap?2.5:1.5, o=shift(G.top,0,-(G.cap?G.cap+2.2:0)), bb=G.B.map(function(q){ return [q[0],q[1]]; });
    o[0][0]-=pad; o[o.length-1][0]+=pad; bb[0][0]-=pad; bb[bb.length-1][0]+=pad; var P=o.concat(bb.reverse()), b=bbox(P), ins=ctx.polyInside(P);
    var inside=function(x,y){ if(G.inGate(x,y))return false; return ins(x,y); }, slices=[];
    for(var i=0;i<G.slices.length;i++){ (function(sl,first,last){ var sx0=first?b.x0:sl.x0, sx1=last?b.x1:sl.x1;
      slices.push({x0:sx0,x1:sx1,y0:b.y0,y1:b.y1,z:sl.z,inside:function(x,y){ return x>=sx0&&x<sx1+(last?1:0)&&inside(x,y); }}); })(G.slices[i],i===0,i===G.slices.length-1); }
    return {x0:b.x0,x1:b.x1,y0:b.y0,y1:b.y1,z:G.z,inside:inside,slices:slices}; }
  // per-slice dabs over a face polygon (so each part of a receding face is hidden only by what stands in front of it)
  function faceDabs(ctx,st,G,poly,bandY0,bandY1,c,ink,step,rad,pred){ var ins=ctx.polyInside(poly), ed=ctx.polyEdge(poly), b=bbox(poly);
    for(var i=0;i<G.slices.length;i++){ (function(sl){ var y0=bandY0===undefined?b.y0:bandY0(sl), y1=bandY1===undefined?b.y1:bandY1(sl);
      ctx.dabs(st,{x0:Math.max(b.x0,sl.x0-1),x1:Math.min(b.x1,sl.x1+1),y0:y0,y1:y1,z:sl.z,inside:function(x,y){ return x>=sl.x0&&x<sl.x1&&ins(x,y); },edge:ed},c,ink,step,rad,pred); })(G.slices[i]); } }
  // 防洪墙: proud coping (two lines), stone courses, end lines, 闸口 openings, 淡墨 under the coping, 赭石 face, 复勾 of the coping
  function floodwall(ctx,zn){ var rr=ctx.rr, ST=ctx.ST, C=ctx.C, G=wallGeom(zn), B=G.B, T=G.top, h=G.h, x0=G.x0, x1=G.x1, zAt=G.zAt, i;
    var Rl=function(al,w,a,b,c,d){ ctx.rline(ST.JIEHUA,Math.max(a,c),C.ink,al,w,a,b,c,d,zAt((a+c)/2),rr(0.5,1.5)); };
    for(i=1;i<B.length;i++)broken(ctx,[B[i-1],B[i]],75,0.5,zAt((B[i-1][0]+B[i][0])/2),0.85);
    for(i=1;i<T.length;i++){ var e0=i===1?1.5:0, e1=i===T.length-1?1.5:0; Rl(195,0.85,T[i-1][0]-e0,T[i-1][1],T[i][0]+e1,T[i][1]); Rl(165,0.6,T[i-1][0]-e0*0.8,T[i-1][1]+2.6,T[i][0]+e1*0.8,T[i][1]+2.6); }
    Rl(180,0.8,x0,B[0][1],x0,T[0][1]+2.6); Rl(180,0.8,x1,B[B.length-1][1],x1,T[T.length-1][1]+2.6);
    var skip=G.gs.length?function(x,y){ return G.inGate(x,y,2); }:null, notGate=skip?function(x,y){ return !skip(x,y); }:undefined;
    courses(ctx,shift(T,0,2.6),h-2.6,zAt,skip,145);
    for(i=0;i<G.gs.length;i++)gate(ctx,B,G.gs[i],zAt(G.gs[i].x));
    var face=T.concat(B.slice().reverse());
    faceDabs(ctx,ST.OCHRE,G,face,undefined,undefined,C.ochre,0.3,3,3,notGate);
    faceDabs(ctx,ST.INDIGO,G,face,function(sl){ return Math.min(yAt(T,sl.x0),yAt(T,sl.x1))+2.6; },function(sl){ return Math.max(yAt(T,sl.x0),yAt(T,sl.x1))+8; },C.danmo,0.2,2.5,2,function(x,y){ var yt=yAt(T,x); return y>yt+2.6&&y<yt+6&&(!skip||!skip(x,y)); });
    for(i=1;i<T.length;i++)ctx.bline(ST.FINISH,T[i][0]+2,C.ink,105,0.6,[[T[i-1][0]-(i===1?2:0),T[i-1][1]+0.2],[(T[i-1][0]+T[i][0])/2,(T[i-1][1]+T[i][1])/2-0.2],[T[i][0]+(i===T.length-1?2:0),T[i][1]+0.2]],zAt((T[i-1][0]+T[i][0])/2));
    return {fp:wallFp(ctx,zn),slots:{base:B,top:T,gate:G.g,gates:G.gs,slices:G.slices}}; }
  // 围墙 with 瓦顶: eave line, double ridge, 瓦垄 at a hand-spaced ~3.3 px pitch, 瓦当 dots, 墙墩 at both ends; the face stays silk
  function wall(ctx,zn){ var rr=ctx.rr, R=ctx.R, ST=ctx.ST, C=ctx.C, G=wallGeom(zn), B=G.B, T=G.top, cap=G.cap, x0=G.x0, x1=G.x1, zAt=G.zAt, i;
    var Rl=function(al,w,a,b,c,d,ov){ ctx.rline(ST.JIEHUA,Math.max(a,c),C.ink,al,w,a,b,c,d,zAt((a+c)/2),ov); };
    for(i=1;i<B.length;i++)broken(ctx,[B[i-1],B[i]],75,0.5,zAt((B[i-1][0]+B[i][0])/2),0.85);
    for(i=1;i<T.length;i++){ var a=T[i-1], b=T[i], e0=i===1?2.5:0, e1=i===T.length-1?2.5:0;
      Rl(195,0.85,a[0]-e0,a[1],b[0]+e1,b[1]); Rl(185,0.75,a[0]-e0*0.4,a[1]-cap,b[0]+e1*0.4,b[1]-cap); Rl(150,0.55,a[0]-e0*0.4,a[1]-cap-1.6,b[0]+e1*0.4,b[1]-cap-1.6); }
    var dots=[]; for(var vx=x0+rr(1,2.5);vx<x1-0.5;vx+=rr(3,3.6)){ var yt=yAt(T,vx), jx=vx+rr(-0.25,0.25); Rl(rr(50,85),0.42,jx,yt-cap+0.6,jx,yt-0.5,rr(0,0.3)); if(R()<0.85)dots.push([jx,yt+0.6,rr(0.4,0.6),rr(90,130)]); }
    ctx.add(ST.JIEHUA,x1,function(g){ g.noStroke(); for(var k=0;k<dots.length;k++){ g.fill(C.ink[0],C.ink[1],C.ink[2],dots[k][3]); g.ellipse(dots[k][0],dots[k][1],dots[k][2]*2,dots[k][2]*2); } });
    var pierEnd=function(px,pb,pt,dir){ Rl(180,0.8,px,pb,px,pt-cap-2); Rl(160,0.65,px+dir*3,pb,px+dir*3,pt-cap-2); Rl(185,0.8,px-dir*1,pt-cap-2,px+dir*4,pt-cap-2); };
    pierEnd(x0,B[0][1],T[0][1],1); pierEnd(x1,B[B.length-1][1],T[T.length-1][1],-1);
    for(i=0;i<G.gs.length;i++)gate(ctx,B,G.gs[i],zAt(G.gs[i].x));
    var notGate=G.gs.length?function(x,y){ return !G.inGate(x,y); }:undefined, face=T.concat(B.slice().reverse()), capPoly=shift(T,0,-cap-1.6).concat(T.slice().reverse());
    faceDabs(ctx,ST.OCHRE,G,face,function(sl){ return Math.min(yAt(B,sl.x0),yAt(B,sl.x1))-6; },undefined,C.ochre,0.22,3,2.6,function(x,y){ var yb=yAt(B,x); return y<=yb-0.3&&y>yb-6&&(!notGate||notGate(x,y)); });
    faceDabs(ctx,ST.INDIGO,G,capPoly,undefined,undefined,C.huaqing,0.2,2.5,2.2,function(x,y){ var yt=yAt(T,x); return y>yt-cap-1&&y<yt-0.4&&R()>((y-(yt-cap-1))/(cap+0.6))*0.8; });
    faceDabs(ctx,ST.INDIGO,G,face,undefined,function(sl){ return Math.max(yAt(T,sl.x0),yAt(T,sl.x1))+3; },C.danmo,0.12,2.5,2,function(x,y){ var yt=yAt(T,x); return y>yt+0.3&&y<yt+2.2&&(!notGate||notGate(x,y)); });
    for(i=1;i<T.length;i++)ctx.bline(ST.FINISH,T[i][0]+3,C.ink,105,0.6,[[T[i-1][0]-(i===1?3:0),T[i-1][1]+0.3],[(T[i-1][0]+T[i][0])/2,(T[i-1][1]+T[i][1])/2-0.3],[T[i][0]+(i===T.length-1?3:0),T[i][1]+0.3]],zAt((T[i-1][0]+T[i][0])/2));
    return {fp:wallFp(ctx,zn),slots:{base:B,top:T,gate:G.g,gates:G.gs,slices:G.slices}}; }

  // pier {x,y,len=100,dir=-1,drop=12,railH=14,thick=3.2}: 凌波門 — a level timber deck from the shore point (x,y) out over the water,
  // piling pairs every ~10 px dropping to the water, a brace in every third bay, a railing on the far side, the near edge open for sitting
  // (slots.seats), and 淡墨 shadow lines on the water under the pilings. `rise` is no longer read: the deck is horizontal (D-07 e).
  function pierGeom(zn){ var x=zn.x, y=zn.y, len=zn.len||100, dir=zn.dir||-1, th=zn.thick||3.2, x1=x+dir*len, y1=y;
    return {x:x,y:y,x1:x1,y1:y1,len:len,dir:dir,thick:th,drop:zn.drop||12,railH:zn.railH||14,slab:[[x,y-th],[x1,y1-th],[x1,y1],[x,y]],z:y}; }
  function pierFp(ctx,zn){ var G=pierGeom(zn), b=bbox(G.slab); return {x0:b.x0,x1:b.x1,y0:b.y0,y1:b.y1,z:G.z,inside:ctx.polyInside(G.slab)}; }
  function pier(ctx,zn){ var rr=ctx.rr, R=ctx.R, ST=ctx.ST, C=ctx.C, G=pierGeom(zn), x=G.x, y=G.y, x1=G.x1, dir=G.dir, len=G.len, th=G.thick, z=G.z, i;
    var Rl=function(al,w,a,b,c,d,ov){ ctx.rline(ST.JIEHUA,Math.max(a,c),C.ink,al,w,a,b,c,d,z,ov); };
    ctx.line(ST.DRAFT,Math.max(x,x1),C.ink,70,0.5,x,y-th*0.5,x1,y-th*0.5);
    Rl(205,0.85,x,y-th,x1,y-th); Rl(160,0.65,x,y,x1,y);
    var posts=[], s=rr(3,6), k=0;
    while(s<len-2){ var px=x+dir*s, dp=G.drop+rr(-0.6,0.6), gp=2.2, xa=Math.min(px,px+dir*gp), xb=Math.max(px,px+dir*gp);
      Rl(rr(175,205),0.75,xb,y,xb+0.5,y+dp); Rl(rr(135,165),0.6,xa,y,xa-0.5,y+dp);
      if(k%3===2&&posts.length){ var q=posts[posts.length-1]; Rl(rr(100,130),0.5,q[0],q[1]+q[2]*0.85,px,y+2,rr(0,0.4)); }
      posts.push([px,y,dp,xa,xb]); k++; s+=rr(9,11); }
    Rl(170,0.7,x,y-th,x-dir*7,y-th+2.5); Rl(150,0.6,x,y,x-dir*5,y+2);
    railing(ctx,[[x+dir*2,y-th-0.4,x1-dir*1.5,y-th-0.4]],G.railH,1);
    ctx.wash(ST.OCHRE,G.slab,C.ochre,0.3,2.5,2.2,z);
    for(i=0;i<posts.length;i++){ var P=posts[i]; ctx.wash(ST.OCHRE,[[P[3],P[1]],[P[4],P[1]],[P[4]+0.5,P[1]+P[2]],[P[3]-0.5,P[1]+P[2]]],C.ochre2,0.28,1.4,1.2,z); }
    ctx.wash(ST.INDIGO,[[x,y+0.3],[x1,y+0.3],[x1,y+2.2],[x,y+2.2]],C.danmo,0.18,2.2,1.8,z);
    // shadow lines on the water: one or two short 淡墨 strokes at each piling foot, drifting with the ripple
    for(i=0;i<posts.length;i++){ (function(P){ var n=R()<0.6?2:1; for(var j=0;j<n;j++){ var L=rr(4,8), yy=P[1]+P[2]+1+j*rr(1.6,2.4), x0=P[0]-L*rr(0.35,0.65), q=[[x0,yy],[x0+L*0.5,yy+rr(-0.5,0.5)],[x0+L,yy+rr(-0.3,0.3)]];
        ctx.bline(ST.INDIGO,x0+L,C.danmo,rr(90,125),rr(0.45,0.55),q,z); } })(posts[i]); }
    var seats=[]; for(var ss=rr(7,10);ss<len-6;ss+=rr(8.5,10.5))seats.push({x:x+dir*ss,y:y-th,z:z,dir:dir});
    return {fp:pierFp(ctx,zn),slots:{seats:seats,deck:[x,y-th,x1,y-th],thick:th}}; }

  // ---------------------------------------------------------------- contract
  var BUILD={terrace:terrace,steps:steps,bankline:bankLine,ground:ground,road:road,field:field,crossing:crossing,treepit:treepit,busstop:busstop,railing:railKind,quay:quay,floodwall:floodwall,wall:wall,pier:pier};
  function footprint(ctx,spec){ var zn=spec.zone||spec;
    switch(zn.kind){ case 'quay':return quayFp(ctx,zn); case 'floodwall': case 'wall':return wallFp(ctx,zn); case 'pier':return pierFp(ctx,zn); case 'busstop':return busstopFp(zn); case 'road':return zn.busstop?busstopFp(zn.busstop):EMPTY; default:return EMPTY; } }
  function build(ctx,spec){ var zn=spec.zone||spec, out=BUILD[zn.kind](ctx,zn); ctx.reg.zones.push({kind:zn.kind,fp:out.fp,slots:out.slots}); return out; }
  return {footprint:footprint,build:build,terrace:terrace,steps:steps,bankLine:bankLine,foot:foot};
})();
