/* mod-arch.js — 界画 architecture on the shared ctx: Song timber buildings, the modern kinds built from the same parts,
   the 长江大桥 truss, quays, walls, steps, embankments, 牌坊.
   Public: ARCH.footprint(ctx,spec) (pure) and ARCH.build(ctx,spec) → {fp,slots}. spec.kind picks the builder (default 'hall').
   Conventions: (x,y) = ground contact of the front-right corner, w = frontage to the left, d = depth along ctx.OBL
   (dir=-1 mirrors the depth vector so the right flank shows), h = ground-to-eave height, z defaults to y.
   Geometry never consumes ctx.R — footprint() and build() see the same shapes; only the drawing is random. */
var ARCH=(function(){
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  function bbox(P){ var b={x0:1e9,x1:-1e9,y0:1e9,y1:-1e9}; for(var i=0;i<P.length;i++){ var q=P[i]; if(q[0]<b.x0)b.x0=q[0]; if(q[0]>b.x1)b.x1=q[0]; if(q[1]<b.y0)b.y0=q[1]; if(q[1]>b.y1)b.y1=q[1]; } return b; }
  function rect(x0,y0,x1,y1){ return [[x0,y0],[x1,y0],[x1,y1],[x0,y1]]; }
  function lerp(a,b,t){ return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]; }
  function dist(a,b){ var dx=b[0]-a[0], dy=b[1]-a[1]; return Math.sqrt(dx*dx+dy*dy); }
  function polyLen(P){ var L=0; for(var i=1;i<P.length;i++)L+=dist(P[i-1],P[i]); return L; }
  // round 7 (D-14: 「墨團邊緣稍方硬,修邊即可」): a 積墨 field's region — corners rounded by r, the lower edge feathered over f px (pred thins the dabs to nothing);
  // returns {poly, inside, pred}; the integrator lays its dabs with `inside` and `pred`
  function softRect(ctx,x0,y0,x1,y1,r,f){ var R=ctx.R, w=x1-x0, h=y1-y0; r=Math.min(r,w*0.3,h*0.3); var poly=[], k;
    function arc(cx,cy,a0){ for(k=0;k<=3;k++){ var a=a0+k*Math.PI/6; poly.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]); } }
    arc(x0+r,y0+r,Math.PI); arc(x1-r,y0+r,-Math.PI/2); arc(x1-r,y1-r,0); arc(x0+r,y1-r,Math.PI/2);
    function inside(x,y){ if(x<x0||x>x1||y<y0||y>y1)return false; var dx=x<x0+r?x0+r-x:x>x1-r?x-(x1-r):0, dy=y<y0+r?y0+r-y:y>y1-r?y-(y1-r):0; return dx*dx+dy*dy<=r*r; }
    function pred(x,y){ var d=y1-y; return d>=f||R()<d/f; }
    return {poly:poly,inside:inside,pred:pred}; }
  function shifted(P,dx,dy){ return P.map(function(q){ return [q[0]+dx,q[1]+dy]; }); }
  function along(P,t){ var f=t*(P.length-1), i=Math.min(P.length-2,Math.max(0,Math.floor(f))), s=f-i; return [P[i][0]+(P[i+1][0]-P[i][0])*s,P[i][1]+(P[i+1][1]-P[i][1])*s]; }
  function zOf(s){ return s.z===undefined?s.y:s.z; }
  // union of polygons as one footprint (interfaces §3)
  function unionFp(ctx,polys,z){ var tests=[], b={x0:1e9,x1:-1e9,y0:1e9,y1:-1e9}, i;
    for(i=0;i<polys.length;i++){ if(!polys[i]||polys[i].length<3)continue; tests.push(ctx.polyInside(polys[i])); var c=bbox(polys[i]); b.x0=Math.min(b.x0,c.x0); b.x1=Math.max(b.x1,c.x1); b.y0=Math.min(b.y0,c.y0); b.y1=Math.max(b.y1,c.y1); }
    return {x0:b.x0,x1:b.x1,y0:b.y0,y1:b.y1,z:z,polys:polys,inside:function(x,y){ for(var k=0;k<tests.length;k++)if(tests[k](x,y))return true; return false; }}; }
  // an eave from A to B lifted at its ends (翘角): qa / qb px over the last Lq px
  function eavePts(A,B,qa,qb){ var L=dist(A,B), n=Math.max(2,Math.ceil(L/2)), Lq=Math.min(L*0.24,28), out=[];
    for(var i=0;i<=n;i++){ var t=i/n, s=t*L, lift=0; if(s<Lq)lift+=qa*Math.pow(1-s/Lq,2.2); if(L-s<Lq)lift+=qb*Math.pow(1-(L-s)/Lq,2.2); out.push([A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t-lift]); }
    return out; }

  /* ---------------------------------------------------------------- drawing tools bound to one z
     T.occ holds local occluders (polygons of the same building that stand in front of a part — the tier above, the clock tower);
     every ruled line, curve, dot and wash is split around them, then rline clips against the z-mask as usual. */
  function tools(ctx,z,s){ var ST=ctx.ST, C=ctx.C, rr=ctx.rr, occ=[], T={ctx:ctx,z:z};
    function inOcc(x,y){ for(var i=0;i<occ.length;i++)if(occ[i](x,y))return true; return false; }
    T.hid=function(x,y){ return ctx.masks.hidden(x,y,z)||inOcc(x,y); };
    T.occlude=function(poly){ if(poly&&poly.length>2)occ.push(ctx.polyInside(poly)); };
    T.clearOcc=function(){ occ.length=0; };
    function ruled(st,c,al,w,x1,y1,x2,y2,over){ var xr=Math.max(x1,x2);
      if(!occ.length){ ctx.rline(st,xr,c,al,w,x1,y1,x2,y2,z,over); return; }
      var dx=x2-x1, dy=y2-y1, L=Math.sqrt(dx*dx+dy*dy), n=Math.max(1,Math.ceil(L/2)), a=-1, i;
      for(i=0;i<=n;i++){ var t=i/n, vis=!inOcc(x1+dx*t,y1+dy*t);
        if(vis&&a<0)a=t;
        if(a>=0&&(!vis||i===n)){ var b=vis?t:(i-1)/n; if(b>a)ctx.rline(st,xr,c,al,w,x1+dx*a,y1+dy*a,x1+dx*b,y1+dy*b,z,(a===0&&b===1)?over:0); a=-1; } } }
    // D-06/D-08 ink hierarchy: primary silhouette / structural division / texture (pale, and broken: ~80 % of the length in runs with 2–4 px gaps)
    function grade(k,dw,da){ var g=ctx.INK&&ctx.INK[k]; return g?{w:g[0],al:g[1]}:{w:dw,al:da}; }   // core exports INK as [w, alpha]
    var INK={primary:grade('primary',0.65,205),structural:grade('structural',0.5,150),texture:grade('texture',0.35,90)};
    // pale: a whole building a step paler (roof stacks behind one another, D-08); WS: callers that still give explicit widths (bridge, 江汉关, 电视塔, 趸船) follow the primary grade
    var pale=T.pale=1, WS=INK.primary.w/0.8;
    T.setPale=function(k){ pale=T.pale=k||1; };
    T.INK=INK;
    T.rule=function(al,w,x1,y1,x2,y2,over){ ruled(ST.JIEHUA,C.ink,al*pale,w*WS,x1,y1,x2,y2,over); };
    T.ruleC=function(st,c,al,w,x1,y1,x2,y2,over){ ruled(st,c,al*pale,w*WS,x1,y1,x2,y2,over); };
    T.pri=function(x1,y1,x2,y2,over,k){ k=k||1; ruled(ST.JIEHUA,C.ink,INK.primary.al*k*pale*rr(0.94,1.06),INK.primary.w*k,x1,y1,x2,y2,over); };
    T.str=function(x1,y1,x2,y2,over,k){ k=k||1; ruled(ST.JIEHUA,C.ink,INK.structural.al*k*pale*rr(0.92,1.08),INK.structural.w*k,x1,y1,x2,y2,over); };
    T.txt=function(x1,y1,x2,y2,k,whole){ k=k||1; var al=INK.texture.al*k*pale*rr(0.8,1.2), w=INK.texture.w*k, dx=x2-x1, dy=y2-y1, L=Math.sqrt(dx*dx+dy*dy);
      if(whole||L<7){ ruled(ST.JIEHUA,C.ink,al,w,x1,y1,x2,y2,0); return; }
      var s=rr(0,1.5); while(s<L-1){ var e=Math.min(L,s+rr(7,16)); ruled(ST.JIEHUA,C.ink,al*rr(0.85,1.1),w,x1+dx*s/L,y1+dy*s/L,x1+dx*e/L,y1+dy*e/L,0); s=e+rr(2,4); } };
    T.tex=function(x1,y1,x2,y2,al,w){ ruled(ST.JIEHUA,C.ink,al*pale,w*WS,x1,y1,x2,y2,0); };
    T.draft=function(x1,y1,x2,y2){ ctx.rline(ST.DRAFT,Math.max(x1,x2),C.ink,rr(60,90),0.5,x1,y1,x2,y2,undefined,0); };
    T.curve=function(st,pts,c,al,w){ var run=[]; al*=pale; w*=(w>0.45?WS:1); function flush(){ if(run.length>1)ctx.pline(st,bbox(run).x1,c,al,w,run,run.length>2); run=[]; }
      for(var i=0;i<pts.length;i++){ if(T.hid(pts[i][0],pts[i][1])){ flush(); continue; } run.push(pts[i]); } flush(); };
    T.dots=function(st,pts,c,al){ var vis=[], xr=-1e9, i; for(i=0;i<pts.length;i++){ if(T.hid(pts[i][0],pts[i][1]))continue; vis.push(pts[i]); if(pts[i][0]>xr)xr=pts[i][0]; }
      if(!vis.length)return; var cc=ctx.col(c,al*pale);
      ctx.add(st,xr,function(g){ g.stroke(cc[0],cc[1],cc[2],cc[3]); g.strokeCap(g.ROUND); for(var k=0;k<vis.length;k++){ g.strokeWeight(vis[k][2]); g.point(vis[k][0],vis[k][1]); } }); };
    T.wash=function(st,poly,c,ink,step,rad,pred){ if(!poly||poly.length<3)return; var b=bbox(poly), ins=ctx.polyInside(poly); ink*=pale;
      ctx.dabs(st,{x0:b.x0,x1:b.x1,y0:b.y0,y1:b.y1,z:z,inside:function(x,y){ return ins(x,y)&&!inOcc(x,y); },edge:ctx.polyEdge(poly)},c,ink,step,rad,pred); };
    T.ochre=function(poly,ink,c){ T.wash(ST.OCHRE,poly,c||C.ochre,ink===undefined?0.3:ink,2.6,2.6); };
    T.fin=function(pts,al,w){ var run=[]; al*=pale; w*=WS; function flush(){ if(run.length>1)ctx.bline(ST.FINISH,bbox(run).x1,C.ink,al,w,run,z); run=[]; }
      for(var i=0;i<pts.length;i++){ if(inOcc(pts[i][0],pts[i][1])){ flush(); continue; } run.push(pts[i]); } flush(); };
    if(s&&s.pale)T.setPale(s.pale);
    return T; }

  /* ---------------------------------------------------------------- Song building: geometry */
  function boxGeom(ctx,s){ var w=s.w, dir=s.dir===undefined?1:s.dir, d=s.d||Math.round(w*0.6), ox=ctx.OBL[0]*d*dir, oy=ctx.OBL[1]*d;
    var x1=s.x, x0=s.x-w, y=s.y, tb=s.tb===undefined?Math.round(clamp(w*0.05,3,6)):s.tb, dg=!!s.dougong, ez=s.ez||(dg?6:3);
    var ye=y-s.h, yf=ye+ez, yb=y-tb, sx=dir>0?x0:x1;
    return {x:s.x,y:y,w:w,h:s.h,d:d,dir:dir,ox:ox,oy:oy,x0:x0,x1:x1,tb:tb,ez:ez,ye:ye,yf:yf,yb:yb,sx:sx,dg:dg,z:zOf(s),
      front:rect(x0,yf,x1,yb), side:[[sx,yb],[sx+ox,yb+oy],[sx+ox,yf+oy],[sx,yf]],
      base:rect(x0-3,yb,x1+3,y), baseSide:[[sx-3*dir,y],[sx-3*dir+ox,y+oy],[sx-3*dir+ox,yb+oy],[sx-3*dir,yb]]}; }
  // roof over a box: eave polylines with 翘角, ridge, front slope, visible flank (hip slope / gable), 垂脊 list, tile end-lines
  function roofGeom(G,s,ctx){ var kind=s.roof||'xuanshan', w=G.w, ox=G.ox, oy=G.oy, dir=G.dir, ye=G.ye, x0=G.x0, x1=G.x1;
    // per-building variation of 翘角 lift and ridge-end lengths, from noise at the building's place (not ctx.R: footprint and build agree)
    var nv=ctx?ctx.noise(G.x1*0.131+7,ye*0.077):0.5, nv2=ctx?ctx.noise(G.x1*0.089+31,ye*0.053+3):0.5, vq=0.7+0.6*clamp((nv-0.3)/0.4,0,1), vr=0.6+0.8*clamp((nv2-0.3)/0.4,0,1);
    var ov=s.ov!==undefined?s.ov:Math.max(4,Math.round(w*0.07)); if(kind==='yingshan')ov=Math.max(2,Math.round(ov*0.35));
    var rise=s.rise||Math.round(kind==='zanjian'?Math.max(14,w*0.42):kind==='pent'?clamp(w*0.18,5,14):clamp(w*0.3,9,46));
    var q=(s.qiao!==undefined?s.qiao:(kind==='xuanshan'||kind==='yingshan'?1.8:kind==='pent'?0.6:4.5))*Math.min(1,w/50)*vq, qL=s.attachL?0:q, qR=s.attachR?0:q;
    var XL=x0-ov, XR=x1+ov, ins=kind==='xieshan'?w*0.2:kind==='wudian'?w*0.3:kind==='yingshan'?ov:kind==='xuanshan'?ov*(1-vr):0, apex=[x0+w/2+ox/2,ye-rise];
    var ridge=kind==='zanjian'?[apex,apex]:kind==='pent'?[[XL+ox,ye+oy-rise],[XR+ox,ye+oy-rise]]:[[XL+ins+ox/2,ye-rise],[XR-ins+ox/2,ye-rise]];
    if(kind==='xuanshan')ridge[dir>0?1:0][0]+=dir*ov*(vr-1)*0.6;
    var eaveF=eavePts([XL,ye],[XR,ye],qL,qR), cx=dir>0?XL:XR, qc=dir>0?qL:qR;
    var eaveS=eavePts([cx,ye],[cx+ox,ye+oy],qc,q), EF=eaveS[0], EB=eaveS[eaveS.length-1];
    var rEnd=dir>0?ridge[0]:ridge[1], rFar=dir>0?ridge[1]:ridge[0], farC=dir>0?eaveF[eaveF.length-1]:eaveF[0];
    // the front-slope polygon is the whole silhouette: eave overhang and 翘角 (eavePts), the ridge with its second line and 鸱吻 on top (D-08: what is stamped behind is really cut)
    var cap=kind==='pent'?0.8:kind==='zanjian'?5.5:(s.chiwen?7:2.4);
    var side=null, gable=null, sideTop=null, ridges=[], front=eaveF.concat(kind==='zanjian'?[[apex[0],apex[1]-cap]]:[[ridge[1][0]+1.5,ridge[1][1]-cap],[ridge[0][0]-1.5,ridge[0][1]-cap]]), wallGable=false;
    if(kind==='xuanshan'||kind==='yingshan'){ eaveS=null; gable=[[cx,ye],rEnd,[cx+ox,ye+oy]]; ridges=[[rEnd,[cx,ye]],[rEnd,[cx+ox,ye+oy]],[rFar,farC]]; wallGable=kind==='yingshan'; }
    else if(kind==='pent'){ eaveS=null; gable=[[cx,ye],[cx+ox,ye+oy-rise],[cx+ox,ye+oy]]; ridges=[[rEnd,[cx,ye]],[rFar,farC]]; wallGable=true; }
    else if(kind==='xieshan'){ var mid=lerp(EF,EB,0.5), HC=lerp(mid,rEnd,0.58), hv=[(EB[0]-EF[0])*0.21,(EB[1]-EF[1])*0.21], TF=[HC[0]-hv[0],HC[1]-hv[1]], TB=[HC[0]+hv[0],HC[1]+hv[1]];
      side=eaveS.concat([TB,TF]); gable=[TF,TB,rEnd]; sideTop=[TF,TB]; ridges=[[rEnd,TF],[TF,EF],[rEnd,TB],[TB,EB],[rFar,farC]]; }
    else if(kind==='wudian'){ side=eaveS.concat([rEnd]); sideTop=[rEnd,rEnd]; ridges=[[rEnd,EF],[rEnd,EB],[rFar,farC]]; }
    else { side=eaveS.concat([apex]); sideTop=[apex,apex]; ridges=[[apex,EF],[apex,EB],[apex,farC]]; }
    // eave zone (rafters, 瓦当, 斗拱) between the eave and the wall top, front and flank — the wall polygon starts only at yf
    var yf=G.yf!==undefined?G.yf:ye+3, eaveZone=[[XL,ye],[XR,ye],[XR,yf+1],[XL,yf+1]], eaveZoneS=[[cx,ye],[cx+ox,ye+oy],[cx+ox,yf+1+oy],[cx,yf+1]];
    return {kind:kind,ov:ov,rise:rise,ye:ye,XL:XL,XR:XR,ridge:ridge,apex:apex,eaveF:eaveF,eaveS:eaveS,front:front,side:side,gable:gable,sideTop:sideTop,ridges:ridges,cx:cx,wallGable:wallGable,vr:vr,eaveZone:eaveZone,eaveZoneS:eaveZoneS}; }
  function hallGeom(ctx,s){ var G=boxGeom(ctx,s), n=s.storeys||1, bays=s.bays||Math.max(1,Math.round(s.w/26)), i,k;
    G.bays=bays; G.roof=roofGeom(G,s,ctx);
    // bay rhythm: widths ×0.85–1.15 from the building's own place on the scroll (noise, never ctx.R — footprint and build agree)
    var wts=[], sum=0; for(i=0;i<bays;i++){ var nv=ctx.noise(s.x*0.173+i*3.7,s.y*0.091+bays); wts.push(0.85+0.3*clamp((nv-0.3)/0.4,0,1)); sum+=wts[i]; }
    G.cols=[G.x0+1]; for(i=0;i<bays;i++)G.cols.push(G.cols[i]+(G.w-2)*wts[i]/sum);
    var H=G.yb-G.yf, pb=6, bands=[], yy=G.yb, body=(H-pb*(n-1))/n;
    for(k=0;k<n;k++){ var top=k===n-1?G.yf:yy-body; bands.push({y0:yy,y1:top}); yy=top-pb; }
    G.bands=bands;
    var front=s.front; if(!front){ front=[]; var doorBay=s.doorBay!==undefined?s.doorBay:(bays>2?Math.floor(bays/2):bays-1);
      for(k=0;k<n;k++){ var str=''; for(i=0;i<bays;i++)str+=(k===0&&i===doorBay)?'d':'w'; front.push(str); } }
    G.front=front;
    if(s.awning){ var kk=0.55, adx=-G.ox*kk, ady=-G.oy*kk, top0=G.bands[0].y1+2+(s.sign?clamp(G.w*0.28,20,40)/3+7:0); G.awn={dx:adx,dy:ady,top:top0,poly:[[G.x0,top0],[G.x1,top0],[G.x1+adx,top0+ady+5],[G.x0+adx,top0+ady+5]]}; }
    if(s.huangzi){ var hx=G.dir>0?G.roof.XR:G.roof.XL, hbx=hx+G.dir*8; G.hz={x:hx,bx:hbx,py:G.roof.ye+4,poly:rect(hbx-2.6,G.roof.ye+2.5,hbx+2.6,G.roof.ye+35)}; }
    G.wall=rect(G.x0,G.yf,G.x1,G.yb);   // round 10 (integrator): the wall face itself — G.front is the bay strings from here on, so the wall was missing from every hall's footprint
    G.polys=[G.base,G.baseSide,G.wall,G.side,G.roof.front,G.roof.side,G.roof.gable,G.roof.eaveZone,G.roof.eaveZoneS,G.awn?G.awn.poly:null,G.hz?G.hz.poly:null];
    return G; }

  /* ---------------------------------------------------------------- Song building: parts */
  function column(T,cx,top,base,foot,pri){ if(pri){ T.pri(cx-1,top,cx-1,base,undefined,0.95); T.txt(cx+1,top+1,cx+1,base-0.5,1.1); } else { T.str(cx-1,top,cx-1,base); T.txt(cx+1,top+1,cx+1,base-0.5,0.9); }
    if(foot)T.str(cx-2.2,base-0.3,cx+2.2,base-0.3,0.3); T.wash(T.ctx.ST.OCHRE,rect(cx-1.4,top+0.5,cx+1.4,base-0.5),T.ctx.C.ochre,0.36,2,1.5); }
  function bracket(T,cx,ye,yf){ var rr=T.ctx.rr, k=rr(0.9,1.25), hw=rr(2.4,3.2), o=rr(-0.4,0.4); T.txt(cx-hw+o,ye+1.2,cx+hw+o,ye+1.2,k,true); T.txt(cx+o,ye+1.2,cx+o,yf-0.8,k*1.1,true); if(T.ctx.R()>0.3)T.txt(cx-hw*0.6+o,yf-0.8,cx+hw*0.6+o,yf-0.8,k*0.85,true); }
  // D-17: 斗拱 as a dark clustered mark — 斗 and 栱 layers stepping out under the eave, a 淡墨 blob gathering them (the 黄鹤楼's eaves)
  function bracketHeavy(T,cx,ye,yf,kk){ var rr=T.ctx.rr, ST=T.ctx.ST, C=T.ctx.C, hw=rr(2.8,3.6)*(kk||1), o=rr(-0.4,0.4), h=yf-ye, y1=ye+h*0.3, y2=ye+h*0.62;
    T.str(cx-hw+o,y1,cx+hw+o,y1,0,1.1); T.str(cx-hw*0.7+o,y2,cx+hw*0.7+o,y2,0,1); T.str(cx-hw*0.4+o,yf-0.8,cx+hw*0.4+o,yf-0.8,0,0.95); T.str(cx+o,ye+1,cx+o,yf-0.5,0,1.1);
    T.txt(cx-hw*0.5+o,y1+0.2,cx-hw*0.5+o,y2,1.1,true); T.txt(cx+hw*0.5+o,y1+0.2,cx+hw*0.5+o,y2,1.1,true);
    T.wash(ST.INDIGO,rect(cx-hw+o,y1-0.5,cx+hw+o,yf-0.3),C.danmo,kk?0.36*Math.min(1.3,kk):0.36,1.2,1.4); }
  // D-17: an open storey — 栏杆 across the bay's lower third, the 空廊 behind it a dark plane; the columns beside it stay light bars
  function gallery(T,x0,y0,x1,y1){ var ctx=T.ctx, rr=ctx.rr, ST=ctx.ST, C=ctx.C, ry=y1-(y1-y0)*0.3;
    T.str(x0,ry,x1,ry,undefined,1.05); T.str(x0,ry+2.2,x1,ry+2.2,undefined,0.8); for(var px=x0+rr(1,2.5);px<x1-0.5;px+=rr(3,4))T.txt(px,ry+0.3,px,y1-0.6,rr(1,1.3),true);
    T.wash(ST.INDIGO,rect(x0+0.3,y0+0.5,x1-0.3,ry-0.3),C.danmo,0.4,1.4,1.6);
    T.wash(ST.INDIGO,rect(x0+0.3,ry+0.5,x1-0.3,y1-0.5),C.danmo,0.2,2,2); }
  function window(T,x0,y0,x1,y1){ var rr=T.ctx.rr, R=T.ctx.R; T.str(x0,y0,x1,y0); T.str(x0,y1,x1,y1,undefined,0.9); T.str(x0,y0,x0,y1,undefined,0.9); T.str(x1,y0,x1,y1,undefined,0.9);
    for(var bx=x0+rr(1.4,2);bx<x1-0.9;bx+=rr(1.9,2.5))if(R()>0.08)T.txt(bx,y0+0.8,bx,y1-0.8,rr(0.85,1.25));
    T.txt(x0+0.5,y0+(y1-y0)*0.62,x1-0.5,y0+(y1-y0)*0.62,1.2,true); }
  // k scales the frame's alpha (structural grade ×k); bars:false leaves the opening empty (D-08: 江汉关's bands paler, the tower's mass dominant)
  function archWindow(T,x0,y0,x1,y1,k,bars){ var rr=T.ctx.rr, C=T.ctx.C, ST=T.ctx.ST, r=(x1-x0)/2, xc=(x0+x1)/2, pts=[], IK=T.INK; k=k||1;
    for(var i=0;i<=8;i++){ var a=Math.PI+Math.PI*i/8; pts.push([xc+Math.cos(a)*r,y0+r+Math.sin(a)*r]); }
    T.curve(ST.JIEHUA,pts,C.ink,IK.structural.al*k*1.05,IK.structural.w*1.1); T.str(x0,y0+r,x0,y1,undefined,k); T.str(x1,y0+r,x1,y1,undefined,k); T.str(x0-1,y1,x1+1,y1,undefined,k*1.05);
    if(bars!==false)for(var bx=x0+rr(1.6,2.2);bx<x1-1;bx+=rr(2,2.6))T.txt(bx,y0+r*0.6+Math.abs(bx-xc)*0.3,bx,y1-0.8,k*1.1,true);
    T.wash(ST.INDIGO,[[x0+1,y0+r],[x1-1,y0+r],[x1-1,y1-1],[x0+1,y1-1]],C.danmo,0.1*k,3,2.5); }
  function door(T,x0,y0,x1,y1,ding){ var rr=T.ctx.rr, ST=T.ctx.ST, C=T.ctx.C, xm=(x0+x1)/2, i,j;
    T.str(x0,y0,x1,y0,undefined,1.1); T.str(x0,y0,x0,y1); T.str(x1,y0,x1,y1); T.txt(xm,y0+0.5,xm,y1,1.2,true); T.str(x0-1,y1-1,x1+1,y1-1,0.4,0.85);
    if(ding&&y1-y0>28){ var pts=[]; for(i=0;i<4;i++)for(j=0;j<3;j++){ pts.push([x0+2+(xm-x0-4)*(j+0.5)/3,y0+4+(y1-y0-9)*(i+0.5)/4,rr(0.8,1.1)]); pts.push([xm+2+(x1-xm-4)*(j+0.5)/3,y0+4+(y1-y0-9)*(i+0.5)/4,rr(0.8,1.1)]); } T.dots(ST.JIEHUA,pts,C.ink,160); }
    T.wash(ST.INDIGO,rect(x0+0.6,y0+0.6,x1-0.6,y0+(y1-y0)*0.45),C.danmo,0.34,1.6,1.7);   // D-12 (a) / D-19 (1): the doorway is open and dark above — one continuous band, every kind, deeper now
    T.wash(ST.INDIGO,rect(x0+0.6,y0+(y1-y0)*0.45,x1-0.6,y1-1.4),C.danmo,0.12,2.2,2);
    T.ochre(rect(x0+0.6,y0+0.6,x1-0.6,y1-1.4),0.3); }
  function counter(T,x0,x1,base,bh){ var ST=T.ctx.ST, C=T.ctx.C; T.wash(ST.INDIGO,rect(x0+0.5,base-bh*0.8,x1-0.5,base-1),C.danmo,0.14,3,2.8);
    T.wash(ST.INDIGO,rect(x0+0.5,base-bh*0.8,x1-0.5,base-bh*0.42),C.danmo,0.34,1.6,1.7);   // D-12 (a) / D-19 (1): the dark interior band under the 额枋 — the shop has an inside (every kind), deeper now
    T.str(x0+1,base-11,x1-1,base-11,undefined,1.1); T.txt(x0+1.5,base-9.6,x1-1.5,base-9.6,1.2,true); T.str(x0+3,base-9.6,x0+3,base-0.8); T.str(x1-3,base-9.6,x1-3,base-0.8); }
  function balcony(T,x0,x1,yTop,yBot,ox,oy,sx,dir){ var rr=T.ctx.rr, p=3*dir; T.pri(x0-3,yTop,x1+3,yTop,undefined,0.9); T.str(x0-3,yBot-0.5,x1+3,yBot-0.5,undefined,0.9);
    for(var px=x0-2+rr(0,2);px<x1+3;px+=rr(3.5,5))T.txt(px,yTop+0.3,px,yBot-0.8,rr(1,1.4),true);
    T.str(sx-p,yTop,sx-p+ox,yTop+oy); for(var t=rr(0.02,0.08);t<1;t+=rr(0.09,0.14))T.txt(sx-p+ox*t,yTop+oy*t+0.3,sx-p+ox*t,yBot+oy*t-0.8,rr(0.9,1.3),true); }
  // D-19 (1): 瓦面 as a dark tile mass — 瓦垄 at structural grade from the eave to the ridge (no fade), the eave row darkest (the first fifth is gone over a second time),
  // a fifth of them lift off once for 2–3 px on the way up; k scales the ink (a roof stack behind, or the 黄鹤楼's heavier tiers)
  // grad (D-21, B10 ③ — the 黄鹤楼's roofs): the 垄 are no longer an even sieve — each row is darkest at the eave and pales in three steps toward the ridge, the rows at the
  // shaded left end of the slope are heavier and those at the lit right end paler and fewer (light from the upper right for the whole scroll, D-12)
  function tiles(T,eave,topA,topB,k,grad){ var ctx=T.ctx, rr=ctx.rr, R=ctx.R, L=polyLen(eave), s=rr(0.8,2), heavy=ctx.ri(4,7), kk=0, IK=T.INK.structural; k=k||1;
    function piece(a,ux,uy,len,sw,al,w,sa,sb,ak){ var pa=[a[0]+ux*sa,a[1]+uy*sa], pb=[a[0]+ux*sb,a[1]+uy*sb], m=(sa+sb)/2, sk=sw*(sb-sa)/len; T.curve(ctx.ST.JIEHUA,[pa,[a[0]+ux*m-uy*sk,a[1]+uy*m+ux*sk],pb],ctx.C.ink,al*ak,w); }
    while(s<L-0.8){ var t=s/L, a=along(eave,t), b=[topA[0]+(topB[0]-topA[0])*t,topA[1]+(topB[1]-topA[1])*t], dx=b[0]-a[0], dy=b[1]-a[1], len=Math.sqrt(dx*dx+dy*dy);
      if(len>3){ var ux=dx/len, uy=dy/len, al=IK.al*k*rr(0.72,1.05), w=IK.w*rr(0.85,1.1), sw=rr(-0.45,0.45); if(kk%heavy===0){ al+=30; w+=0.08; }
        if(grad)al*=1.18-0.5*t;
        if(R()>(grad?0.05+0.24*t:0.06)){ var t0=0.9, tE=Math.min(len-1,Math.max(4,len*0.2)), t1=len-rr(0.6,1.4), gap=(len>16&&R()<0.2)?[tE+rr(0.25,0.7)*(t1-tE),rr(2,3)]:null;
          if(grad&&len>10){ var tM=tE+(t1-tE)*rr(0.42,0.58); piece(a,ux,uy,len,sw,al,w,t0,tE,1); piece(a,ux,uy,len,sw,al,w*0.92,tE,tM,0.74); if(R()>0.12*t)piece(a,ux,uy,len,sw,al,w*0.82,tM,t1,0.5); }
          else if(gap){ piece(a,ux,uy,len,sw,al,w,t0,gap[0]-gap[1]/2,1); piece(a,ux,uy,len,sw,al,w,gap[0]+gap[1]/2,t1,1); } else piece(a,ux,uy,len,sw,al,w,t0,t1,1);
          piece(a,ux,uy,len,sw,al,w+0.06,t0,tE,grad?0.75:0.6); } }
      s+=rr(1.7,2.4); kk++; } }
  function eaveLines(T,pts,al,k){ var C=T.ctx.C, ST=T.ctx.ST, rr=T.ctx.rr, R=T.ctx.R, IK=T.INK; k=k||1; T.curve(ST.JIEHUA,pts,C.ink,Math.min(250,IK.primary.al*k*rr(0.95,1.05)),Math.min(0.9,IK.primary.w*k*1.05)); T.curve(ST.JIEHUA,shifted(pts,0,1.6),C.ink,Math.min(220,IK.structural.al*k*0.9),Math.min(0.75,IK.structural.w*0.9*k));
    // 瓦当 dots with 滴水 drops of unequal length hanging between some of them
    var L=polyLen(pts), dots=[], ds=rr(3,4); for(var s=rr(1,3);s<L-1;s+=ds){ var p=along(pts,s/L); dots.push([p[0],p[1]+0.3,rr(1,1.55)]); if(R()<0.45)T.tex(p[0]+ds*0.5,p[1]+0.6,p[0]+ds*0.5,p[1]+rr(1.4,2.8),IK.texture.al*rr(0.9,1.3),IK.texture.w); ds=rr(3,4.2); } T.dots(ST.JIEHUA,dots,C.ink,IK.primary.al*0.8*rr(0.85,1.1)); }
  // D-12 (a): the dark plane under an eave. Not dabs: a dense wash strip 2.6 px tall that follows the eave polyline (翘角 included), then a soft lower edge dying out over 4 px.
  function eavePlane(T,pts,k){ var ctx=T.ctx, ST=ctx.ST, C=ctx.C, n=pts.length, i, top=[], bot=[], soft=[]; if(n<2)return; k=k||1;
    for(i=0;i<n;i++){ top.push([pts[i][0],pts[i][1]+0.6]); bot.push([pts[i][0],pts[i][1]+3.2]); soft.push([pts[i][0],pts[i][1]+7]); }
    var band=top.concat(bot.slice().reverse()), tail=bot.concat(soft.slice().reverse()), y0=bot[0][1], y1=soft[0][1];
    T.wash(ST.INDIGO,band,C.danmo,0.42*k,1.2,1.5);
    T.wash(ST.INDIGO,tail,C.danmo,0.2*k,1.6,1.8,function(px,py){ var u=(py-y0)/(y1-y0); return ctx.R()>u*1.15; }); }
  // D-12 (b)/(c): a turned flank. dir>0 = the flank faces left, away from the light: a continuous 淡墨 plane (INDIGO 0.2); dir<0 = it faces the light and keeps the silk, a whisper only.
  function flankPlane(T,side,dir,extra){ var ctx=T.ctx, ink=(dir>0?0.3:0.1)+(extra||0)*0.5; if(side&&side.length>2)T.wash(ctx.ST.INDIGO,side,ctx.C.danmo,ink,2,2); }
  // tint: 'indigo' (花青, the default) | 'ochre' (黄鹤楼) | 'grey' (里份 灰瓦)
  function drawRoof(T,RG,tint,chiwen,tk,grad){ var ctx=T.ctx, ST=ctx.ST, C=ctx.C, rr=ctx.rr, R=ctx.R, IK=T.INK, i; tk=tk||1;
    var ek=T.eaveK||1; eaveLines(T,RG.eaveF,0,ek); if(RG.eaveS)eaveLines(T,RG.eaveS,0,0.9*ek);
    var r0=RG.ridge[0], r1=RG.ridge[1];
    if(RG.kind==='pent'){ T.pri(r0[0],r0[1],r1[0],r1[1],undefined,0.9); }
    else if(RG.kind!=='zanjian'){ T.pri(r0[0]-1,r0[1],r1[0]+1,r1[1],undefined,1.1); T.str(r0[0]-1,r0[1]-1.7,r1[0]+1,r1[1]-1.7);
      if(chiwen){ T.pri(r0[0]-1,r0[1]-1.7,r0[0]-1,r0[1]-5); T.str(r0[0]-1,r0[1]-5,r0[0]+1.6,r0[1]-6.2,undefined,1.1); T.pri(r1[0]+1,r1[1]-1.7,r1[0]+1,r1[1]-5); T.str(r1[0]+1,r1[1]-5,r1[0]-1.6,r1[1]-6.2,undefined,1.1); } }
    else { T.pri(RG.apex[0],RG.apex[1],RG.apex[0],RG.apex[1]-4,undefined,0.95); T.dots(ST.JIEHUA,[[RG.apex[0],RG.apex[1]-4.6,2.2]],C.ink,190); }
    // 垂脊/戗脊: the far one is the roof's silhouette (primary); the ones on the flank and gable are divisions (structural)
    for(i=0;i<RG.ridges.length;i++){ var a=RG.ridges[i][0], b=RG.ridges[i][1]; if(i===RG.ridges.length-1)T.pri(a[0],a[1],b[0],b[1]); else T.str(a[0],a[1],b[0],b[1],undefined,1.1); }
    if(RG.kind==='xuanshan'){ var g=RG.gable; T.str(g[0][0]+1.5,g[0][1]-1,g[1][0]+1.5,g[1][1]+1.2,undefined,0.9); T.str(g[2][0]-1.5,g[2][1]-1,g[1][0]-1.5,g[1][1]+1.2,undefined,0.85); }
    if(RG.wallGable){ var gb=RG.gable, gy0=Math.min(gb[0][1],gb[1][1],gb[2][1]), gy1=Math.max(gb[0][1],gb[2][1]), ins=ctx.polyInside(gb);
      for(var cy=gy1-rr(2,3.5);cy>gy0+2;cy-=rr(3,4.2)){ var xa=Math.min(gb[0][0],gb[2][0])+0.5, xb=Math.max(gb[0][0],gb[2][0])-0.5, ca=-1, seg=[]; for(var xx=xa;xx<=xb;xx+=0.5){ var v=ins(xx,cy); if(v&&ca<0)ca=xx; if(ca>=0&&(!v||xx+0.5>xb)){ seg.push([ca,xx]); ca=-1; } }
        for(var q=0;q<seg.length;q++)if(seg[q][1]-seg[q][0]>3&&R()>0.25)T.txt(seg[q][0],cy,seg[q][1],cy+rr(-0.2,0.2),0.9); } }
    tiles(T,RG.eaveF,RG.ridge[0],RG.ridge[1],tk,grad); if(RG.side)tiles(T,RG.eaveS,RG.sideTop[0],RG.sideTop[1],tk,grad);
    // D-19 (1)/(3): the tile mass. A 淡墨 field over the WHOLE slope (denser toward the eave, where the 垄 crowd), then the pigment as one continuous transparent layer —
    // 花青 dense at the ridge thinning to ~65 % at the eave on the front slope; the flank slope, turned from the light, takes the 淡花青 layer whole (INDIGO 0.18–0.25). The line bones stay visible through it.
    var yr=RG.ridge[0][1], ye=RG.ye, pred=function(px,py){ var u=(py-yr)/(ye-yr); return R()>0.35*clamp(u,0,1); };
    var st=tint==='ochre'?ST.OCHRE:ST.INDIGO, c=tint==='ochre'?C.ochre:tint==='grey'?C.danmo:C.huaqing, ink=(tint==='ochre'?0.24:tint==='grey'?0.22:0.14)*tk, grey=(tint==='ochre'?0.2:0.25)*tk;
    var predLo=function(px,py){ var u=(py-yr)/(ye-yr); return R()<0.55+0.5*u; };
    T.wash(ST.INDIGO,RG.front,C.danmo,grey,2.6,2.4,predLo); if(RG.side)T.wash(ST.INDIGO,RG.side,C.danmo,grey*1.1,2.6,2.4,predLo);
    T.wash(st,RG.front,c,ink,2.4,2.2,pred); if(RG.side)T.wash(st,RG.side,c,ink*1.4,2.4,2.2); if(RG.gable&&RG.kind!=='xuanshan'&&!RG.wallGable)T.wash(st,RG.gable,c,ink*0.9,2.4,2);
    if(RG.side&&tint!=='indigo')T.wash(ST.INDIGO,RG.side,C.huaqing,0.14*tk,2.6,2.4);
    if(RG.wallGable)T.ochre(RG.gable,0.14,C.ochre2);
    T.fin(RG.eaveF,rr(95,115)*ek,Math.min(0.9,0.62*ek)); if(RG.eaveS)T.fin(RG.eaveS,rr(90,110)*ek,Math.min(0.9,0.6*ek)); if(RG.kind!=='zanjian'&&RG.kind!=='pent')T.fin([r0,lerp(r0,r1,0.5),r1],95*ek,Math.min(0.9,0.6*ek)); }

  // D-21 (B10 ⑤): the 黄鹤楼's main storey as a colonnade with depth — the front columns stand free as light bars (their 淡赭 kept out of the ink), the back wall 9 px deeper
  // along OBL in 淡墨 0.4 with its lattice paler on it, the floor between them a lighter plane seen from above, the right return wall between; the board hangs on the front plane
  function deepGallery(T,s,G,cols,top,base,cy0,bhgt,bwid,slots){ var ctx=T.ctx, ST=ctx.ST, C=ctx.C, rr=ctx.rr, R=ctx.R, dir=G.dir, gd=9, gdx=ctx.OBL[0]*gd*dir, gdy=ctx.OBL[1]*gd, x0=G.x0, x1=G.x1, bays=G.bays, i;
    var xl=dir>0?x0+1:x0+1+gdx, xr=dir>0?x1-1+gdx:x1-1, yt=top+3, sr=null;
    if(s.sign){ var bxc=x0+G.w/2, by=top+4.5; sr={x0:bxc-bwid/2-1,x1:bxc+bwid/2+1,y0:by-4.5,y1:by+bhgt+1}; }
    function keep(px,py){ if(sr&&px>sr.x0&&px<sr.x1&&py>sr.y0&&py<sr.y1)return false; for(var q=0;q<cols.length;q++)if(Math.abs(px-cols[q])<2.4)return false; return true; }
    // the back wall's lattice, paler, on the deeper plane
    var pk=T.pale; T.setPale(pk*0.62);
    for(i=0;i<bays;i++){ var bx0=cols[i]+1.6+gdx, bx1=cols[i+1]-1.6+gdx; window(T,bx0+1.5,cy0+gdy+1,bx1-1.5,base+gdy-1.5); }
    T.setPale(pk);
    T.str(xl,base+gdy,xr,base+gdy,undefined,0.85); if(dir>0)T.str(x1-1+gdx,yt,x1-1+gdx,base+gdy,undefined,0.8); else T.str(x0+1+gdx,yt,x0+1+gdx,base+gdy,undefined,0.8);
    T.wash(ST.INDIGO,rect(xl,yt,xr,base+gdy),C.danmo,0.4,1.3,1.5,keep);
    T.wash(ST.INDIGO,[[x0+1+gdx,base+gdy],[x1-1+gdx,base+gdy],[x1-1,base],[x0+1,base]],C.danmo,0.15,1.6,1.6,keep);
    if(dir>0)T.wash(ST.INDIGO,[[x1-1+gdx,yt],[x1-1,yt],[x1-1,base],[x1-1+gdx,base+gdy]],C.danmo,0.26,1.3,1.5,keep); else T.wash(ST.INDIGO,[[x0+1,yt],[x0+1+gdx,yt],[x0+1+gdx,base+gdy],[x0+1,base]],C.danmo,0.26,1.3,1.5,keep); }

  /* ---------------------------------------------------------------- Song building: the whole hall */
  function drawHall(ctx,s,G){ var T=tools(ctx,G.z,s), ST=ctx.ST, C=ctx.C, rr=ctx.rr, i,k;
    var x0=G.x0, x1=G.x1, y=G.y, ox=G.ox, oy=G.oy, dir=G.dir, sx=G.sx, RG=G.roof, slots={}, p=3*dir;
    if(G.occ)for(i=0;i<G.occ.length;i++)T.occlude(G.occ[i]);
    if(G.awn)T.occlude(G.awn.poly);   // the 凉棚 mat is opaque to the wall behind it (D-08)
    T.street=!!s.street; T.eaveK=s.eaveK||1;
    T.draft(x0-3,y+0.5,x1+3,y+0.5); T.draft(sx-p,y+0.5,sx-p+ox,y+oy+0.5); if(G.tb>0)T.draft(x0,G.yb,x1,G.yb);
    if(s.balcony)balcony(T,x0,x1,G.yb,y,ox,oy,sx,dir);
    else if(G.tb>=12){ courses(T,x0-3,G.yb,x1+3,y); T.rule(180,0.8,sx-p,y,sx-p+ox,y+oy); T.rule(175,0.75,sx-p,G.yb,sx-p+ox,G.yb+oy); T.rule(150,0.7,sx-p+ox,G.yb+oy,sx-p+ox,y+oy); T.ochre(G.baseSide,0.16); }
    else if(G.tb>0){ T.pri(x0-3,y,x1+3,y,undefined,1.05); T.str(x0-3,G.yb,x1+3,G.yb); if(G.tb>=5)T.txt(x0-2,G.yb+G.tb*0.5,x1+2,G.yb+G.tb*0.5);
      T.pri(sx-p,y,sx-p+ox,y+oy); T.str(sx-p,G.yb,sx-p+ox,G.yb+oy,undefined,0.9); T.str(sx-p+ox,G.yb+oy,sx-p+ox,y+oy,undefined,0.8);
      for(var jx=x0+rr(4,10);jx<x1-2;jx+=rr(9,16))T.txt(jx,G.yb+1,jx+rr(-0.4,0.4),y-0.6,1,true);
      T.ochre(G.base,0.2); T.ochre(G.baseSide,0.16); }
    var bays=G.bays, bw=(G.w-2)/bays, cols=G.cols, bwid=s.signBig?clamp(G.w*0.36,36,52):clamp(G.w*0.28,20,40), bhgt=s.signBig?clamp(bwid*0.3,14,16):bwid/3;
    for(k=0;k<G.bands.length;k++){ var b=G.bands[k], top=b.y1, base=b.y0, fr=G.front[k]||'', bh=base-top;
      if(s.brick){ T.pri(x0,top,x0,base,undefined,0.9); T.pri(x1,top,x1,base,undefined,0.9); T.str(x0-1,top,x1+1,top); T.str(sx+ox,top+oy,sx+ox,base+oy,undefined,0.8); T.str(sx,top,sx+ox,top+oy,undefined,0.85); }
      else { T.pri(x0-2,top,x1+2,top,undefined,1.05); T.str(x0-1,top+3,x1+1,top+3,undefined,0.9);
        T.pri(sx,top,sx+ox,top+oy,undefined,0.9); T.str(sx,top+3,sx+ox,top+3+oy,undefined,0.8);
        T.ochre(rect(x0-1,top+0.4,x1+1,top+2.8),0.28);
        for(i=0;i<=bays;i++)column(T,cols[i],top+0.5,base,k===0&&G.tb>0&&G.tb<12,i===0||i===bays);
        column(T,sx+ox,top+oy+0.5,base+oy,false,false); }
      var cy0=top+Math.max(bh*0.14,(k===0&&s.sign)?bhgt+7:0);
      if(s.deepGallery){ deepGallery(T,s,G,cols,top,base,cy0,bhgt,bwid,slots); continue; }
      for(i=0;i<bays;i++){ var kind=fr.charAt(i)||'w', bx0=cols[i]+1.6, bx1=cols[i+1]-1.6;
        if(kind==='w'){ window(T,bx0+1.5,cy0,bx1-1.5,base-bh*0.3); if(s.shadeBays)T.wash(ST.INDIGO,rect(bx0+1.5,cy0+0.5,bx1-1.5,base-bh*0.3-0.5),C.danmo,0.14,2.2,2); }
        else if(kind==='g')gallery(T,bx0,cy0,bx1,base);
        else if(kind==='a')archWindow(T,bx0+1.5,cy0-2,bx1-1.5,base-bh*0.28);
        else if(kind==='d'){ door(T,bx0+1,cy0,bx1-1,base,s.dingding); if(!slots.door)slots.door={x:(bx0+bx1)/2,y:base,w:bx1-bx0,h:base-cy0}; }
        else if(kind==='o'){ counter(T,bx0,bx1,base,bh); if(!slots.counter)slots.counter={x:(bx0+bx1)/2,y:base,w:bx1-bx0,x0:bx0,x1:bx1}; } }
      if(k<G.bands.length-1){ if(s.brick){ T.str(x0-0.5,top-3,x1+0.5,top-3,undefined,0.9); T.txt(x0+1,top-4.6,x1-1,top-4.6,0.9); T.str(sx,top-3,sx+ox,top-3+oy,undefined,0.8); } else balcony(T,x0,x1,top-6,top,ox,oy,sx,dir); } }
    if(G.dg&&s.deepGallery){ // D-21 (B10 ③/⑤): 斗拱 as one gathered cluster over every column, light gaps between — no continuous black band under this eave
      for(i=0;i<=bays;i++)bracketHeavy(T,cols[i],G.ye,G.yf,1.5); for(var tq=0.2;tq<0.95;tq+=0.3)bracketHeavy(T,sx+ox*tq,G.ye+oy*tq,G.yf+oy*tq,1.3); }
    else if(G.dg){ var br=s.dgHeavy?bracketHeavy:bracket; for(i=0;i<=bays;i++){ br(T,cols[i],G.ye,G.yf); if(i<bays){ var cbw=cols[i+1]-cols[i]; if(s.dgHeavy&&cbw>18){ br(T,cols[i]+cbw*0.25,G.ye,G.yf); br(T,cols[i]+cbw*0.5,G.ye,G.yf); br(T,cols[i]+cbw*0.75,G.ye,G.yf); } else { br(T,cols[i]+cbw/3,G.ye,G.yf); br(T,cols[i]+cbw*2/3,G.ye,G.yf); } } }
      for(var t=0.2;t<0.95;t+=(s.dgHeavy?0.2:0.27))br(T,sx+ox*t,G.ye+oy*t,G.yf+oy*t); }
    // D-17: the 檐下 of the 黄鹤楼 — the whole eave zone (front and flank) one dark plane, the darkest architecture on the scroll, the 斗拱 marks inside it
    if(s.deepEave&&s.deepGallery){ T.wash(ST.INDIGO,RG.eaveZone,C.ink,0.2,1.3,1.5); T.wash(ST.INDIGO,RG.eaveZoneS,C.ink,0.26,1.3,1.5); }
    else if(s.deepEave){ T.wash(ST.INDIGO,RG.eaveZone,C.ink,0.5,1.3,1.5); T.wash(ST.INDIGO,RG.eaveZoneS,C.ink,0.56,1.3,1.5); }
    // D-12 (a): under the eave one CONTINUOUS 淡墨 plane, front and flank, its lower edge soft; the 复勾 of the eave sits on its upper edge
    var epk=s.deepEave?1.1:1; eavePlane(T,RG.eaveF,epk); if(RG.eaveS)eavePlane(T,RG.eaveS,0.9*epk); else eavePlane(T,[[sx,G.ye],[sx+ox,G.ye+oy]],0.9);
    T.ochre(G.side,0.14,C.ochre2);
    // D-12 (c): light from the upper right — a flank that turns away from it (dir>0: the left flank shows) is the shaded face and gathers the wash; the right flank stays nearly blank
    flankPlane(T,G.side,dir,s.flankShade);
    drawRoof(T,RG,s.tiles||'indigo',s.chiwen,s.tileK,s.tileGrad);
    if(s.sign){ var bxc=slots.door?slots.door.x:slots.counter?slots.counter.x:x0+G.w/2, by=G.bands[0].y1+4.5;
      T.rule(140,0.5,bxc-bwid*0.35,by-4.2,bxc-bwid*0.35,by); T.rule(140,0.5,bxc+bwid*0.35,by-4.2,bxc+bwid*0.35,by);
      T.rule(180,0.7,bxc-bwid/2,by,bxc+bwid/2,by); T.rule(180,0.7,bxc-bwid/2,by+bhgt,bxc+bwid/2,by+bhgt); T.rule(170,0.7,bxc-bwid/2,by,bxc-bwid/2,by+bhgt); T.rule(170,0.7,bxc+bwid/2,by,bxc+bwid/2,by+bhgt);
      slots.signRect={x:bxc-bwid/2,y:by,w:bwid,h:bhgt,cx:bxc,cy:by+bhgt/2,vertical:false,text:s.sign}; }
    if(s.huangzi){ var hx=dir>0?RG.XR:RG.XL, hd=dir>0?1:-1, py=RG.ye+4, bx=hx+hd*8;
      T.rule(170,0.7,hx-hd*4,py+1.2,bx+hd*1,py-0.6); T.rule(160,0.6,bx-2,py,bx+2,py); T.rule(160,0.6,bx-2,py,bx-2,py+30); T.rule(160,0.6,bx+2,py,bx+2,py+30); T.rule(150,0.6,bx-2,py+30,bx+2,py+30);
      if(s.huangziRed){ T.ruleC(ST.INDIGO,C.zhusha,150,0.7,bx-1.6,py+0.5,bx-1.6,py+29.5,0); T.ruleC(ST.INDIGO,C.zhusha,150,0.7,bx+1.6,py+0.5,bx+1.6,py+29.5,0); }
      slots.huangzi={x:bx-2,y:py,w:4,h:30,cx:bx,cy:py+15,vertical:true,text:s.huangzi===true?'':s.huangzi}; }
    if(G.awn){ var A=G.awn, yo=A.top+A.dy+5, L=dist([0,0],[A.dx,A.dy+5]); T.clearOcc(); if(G.occ)for(i=0;i<G.occ.length;i++)T.occlude(G.occ[i]);
      T.rule(170,0.75,x0+A.dx,y+A.dy,x0+A.dx,yo); T.rule(170,0.75,x1+A.dx,y+A.dy,x1+A.dx,yo);
      T.rule(185,0.8,x0+A.dx-2,yo,x1+A.dx+2,yo); T.rule(160,0.7,x0,A.top,x0+A.dx,yo); T.rule(160,0.7,x1,A.top,x1+A.dx,yo);
      for(var tt=0.08;tt<0.97;tt+=2/L)if(ctx.R()>0.15)T.tex(x0+A.dx*tt,A.top+(yo-A.top)*tt,x1+A.dx*tt,A.top+(yo-A.top)*tt,rr(45,75),0.4);
      for(var u=rr(0.06,0.14);u<0.96;u+=rr(0.1,0.16))T.tex(x0+G.w*u,A.top,x0+G.w*u+A.dx,yo,rr(40,65),0.38);
      T.wash(ST.INDIGO,A.poly,C.danmo,0.15,3,3); slots.awning={x0:x0,x1:x1,y:y+A.dy}; }
    slots.eaveLine={y:RG.ye,x0:RG.XL,x1:RG.XR}; slots.ground={x0:x0,x1:x1,y:y};
    return slots; }

  var KINDS={};
  KINDS.hall={geom:hallGeom,draw:drawHall};

  /* ---------------------------------------------------------------- shared faces: stone courses (堤石、台), a tiled garden wall */
  function courses(T,x0,y0,x1,y1){ var rr=T.ctx.rr, R=T.ctx.R, ST=T.ctx.ST, C=T.ctx.C, row=0, prev=y0, yy;
    T.rule(190,0.85,x0-1,y0,x1+1,y0); T.rule(165,0.8,x0-1,y1,x1+1,y1); T.rule(160,0.7,x0,y0,x0,y1); T.rule(160,0.7,x1,y0,x1,y1);
    function joints(ya,yb){ for(var jx=x0+(row%2?7:0)+rr(2,6);jx<x1-2;jx+=rr(12,16))if(R()>0.35)T.txt(jx,ya+0.4,jx+rr(-0.3,0.3),yb-0.4,0.95,true); row++; }
    for(yy=y0+rr(5.5,6.5);yy<y1-2.5;yy+=rr(5.5,6.5)){ var xx=x0+rr(0,3); while(xx<x1-1){ var xe=Math.min(x1-0.5,xx+rr(18,44)); T.txt(xx,yy+rr(-0.3,0.3),xe,yy+rr(-0.3,0.3),rr(1,1.3)); xx=xe+rr(0,2); }
      joints(prev,yy); prev=yy; }
    joints(prev,y1);
    T.ochre(rect(x0+0.5,y0+0.5,x1-0.5,y1-0.5),0.2); T.wash(ST.INDIGO,rect(x0+0.5,y1-2.5,x1-0.5,y1-0.3),C.danmo,0.18,2.5,2); }
  function wallFace(T,x0,x1,y,yt,sx,ox,oy){ var rr=T.ctx.rr, ST=T.ctx.ST, C=T.ctx.C;
    T.draft(x0,y+0.5,x1,y+0.5); T.draft(sx,y+0.5,sx+ox,y+oy+0.5);
    T.rule(175,0.75,x0-1,y,x1+1,y); T.rule(190,0.8,x0-1.5,yt,x1+1.5,yt); T.rule(160,0.65,x0-2,yt-2.5,x1+2,yt-2.5); T.rule(140,0.6,x0-1,yt-3.5,x1+1,yt-3.5);
    for(var tx=x0+rr(1,3);tx<x1-1;tx+=rr(1.8,2.4))T.tex(tx,yt-3.2,tx+0.3,yt-0.3,rr(55,95),0.4);
    var dots=[]; for(var dx=x0+rr(1,3);dx<x1-1;dx+=rr(3,4))dots.push([dx,yt+0.3,rr(1,1.4)]); T.dots(ST.JIEHUA,dots,C.ink,170);
    T.rule(165,0.7,x0,yt,x0,y); T.rule(165,0.7,x1,yt,x1,y);
    T.rule(180,0.75,sx,yt,sx+ox,yt+oy); T.rule(150,0.6,sx,yt-2.5,sx+ox,yt-2.5+oy); T.rule(160,0.7,sx+ox,yt-2.5+oy,sx+ox,y+oy); T.rule(165,0.7,sx,y,sx+ox,y+oy);
    T.wash(ST.INDIGO,rect(x0+0.5,yt+0.5,x1-0.5,yt+3.5),C.danmo,0.18,2.5,2.5); T.ochre(rect(x0+0.5,y-(y-yt)*0.4,x1-0.5,y-0.5),0.13);
    T.fin([[x0-1,yt],[(x0+x1)/2,yt-0.2],[x1+1,yt]],100,0.6); }

  /* ---------------------------------------------------------------- kinds built on the hall */
  function copy(s,o){ var r={}, k; for(k in s)r[k]=s[k]; for(k in o)r[k]=o[k]; return r; }
  // shop row rhythm: without spec.roof the roof alternates 悬山 / 硬山 / a lean-to 凉棚 by the shop's place on the scroll; the door sits in a different bay per shop and one bay may be an awning
  function shopSpec(ctx,s){ var bays=s.bays||Math.max(2,Math.round(s.w/28)), nv=ctx.noise(s.x*0.057+11,s.y*0.041), roof=s.roof||(nv<0.42?'xuanshan':nv<0.58?'yingshan':'pent'), storeys=s.storeys||(roof==='pent'?1:2);
    var o=copy(s,{storeys:storeys,roof:roof,bays:bays,huangzi:s.huangzi===undefined?(ctx.noise(s.x*0.047+23,s.y*0.031)>0.47):s.huangzi});
    if(!s.front){ var g='', u='', i, db=bays>2?Math.floor(ctx.noise(s.x*0.083+3,s.y*0.067+5)*bays*0.999):-1; for(i=0;i<bays;i++){ g+=(i===db)?'d':'o'; u+='w'; } o.front=storeys>1?[g,u]:[g]; }
    if(s.awning===undefined&&roof!=='pent'&&!s.sign&&ctx.noise(s.x*0.071+17,s.y*0.037+9)>0.56)o.awning=true;
    return o; }
  KINDS.shopfront={geom:function(ctx,s){ return hallGeom(ctx,shopSpec(ctx,s)); },draw:function(ctx,s,G){ return drawHall(ctx,shopSpec(ctx,s),G); }};

  // stacked 楼阁 tiers: each tier a hall with 平座, xieshan roof and 4-way 翘角, the top tier 攒尖; the tier above occludes the ridge lines of the one below
  function tierSpecs(s,tiers,shrink,tint){ var w=s.w||150, h=s.h||360, topRise=Math.round(w*0.2), Th=(h-topRise)/tiers, out=[], k, i;
    for(k=0;k<tiers;k++){ var wk=Math.round(w*(1-shrink*k)), last=k===tiers-1, bays=Math.max(3,Math.round(wk/26)), ws=''; for(i=0;i<bays;i++)ws+='w';
      out.push({x:s.x-Math.round((w-wk)/2),y:s.y-k*Th,w:wk,d:Math.round(wk*0.6),h:Math.round(Th*0.62),dir:s.dir,z:zOf(s),storeys:1,roof:last?'zanjian':'xieshan',rise:Math.round(Th*0.36+(last?topRise:0)),
        dougong:true,tb:k===0?(s.tb===undefined?4:s.tb):6,balcony:k>0,bays:bays,front:k===0?undefined:[ws],tiles:s.tiles||tint,qiao:5.5,chiwen:!last,sign:k===0?s.sign:undefined,dingding:k===0}); }
    return out; }
  function towerGeom(ctx,s,tiers,shrink,tint){ var specs=tierSpecs(s,tiers,shrink,tint), parts=[], polys=[], k, i;
    for(k=0;k<specs.length;k++)parts.push({s:specs[k],G:hallGeom(ctx,specs[k])});
    for(k=0;k<parts.length;k++){ if(k<parts.length-1)parts[k].G.occ=[parts[k+1].G.wall,parts[k+1].G.side]; for(i=0;i<parts[k].G.polys.length;i++)polys.push(parts[k].G.polys[i]); }
    return {parts:parts,polys:polys,z:zOf(s)}; }
  function towerDraw(ctx,s,G){ var slots={}, k; for(k=0;k<G.parts.length;k++){ var sl=drawHall(ctx,G.parts[k].s,G.parts[k].G); if(k===0)slots=sl; }
    var top=G.parts[G.parts.length-1].G.roof.apex; slots.top={x:top[0],y:top[1]}; return slots; }
  /* D-17 / B9 黄鹤楼 — the architectural climax. Five tiers that are NOT a scaled stack: widths 1 / .86 / .92 / .78 / .64 of w, so the main (middle) storey's 平座
     projects beyond the roof under it and bears; tier heights 1 / .86 / 1.22 / .86 / .76; storeys alternate closed (doors, lattice in shade) and open (栏杆 + 空廊);
     every eave deep (ov 0.10 w, main 0.13 w) with 斗拱 as dark clusters and the whole 檐下 zone one dark plane; the main eave 1.5× (w 0.9) and its 翘角 7.5;
     「黃鶴樓」 board under the main eave (signRect, 14–16 px); a stone 台基 (`tb`, default 14) with a flight of 石阶 in front. Slots add `baseFp` (台基 + 石阶, the only
     part a tree may occlude) and `bodyFp` (the storeys — nothing may cross them), both at the building's z; `storeys[]` {y0,y1,open}. Default w 150, h 360. */
  function hhlSpecs(ctx,s){ var w=s.w||150, h=s.h||360, topRise=Math.round(w*0.22), wk=[1,0.86,0.92,0.78,0.64], bk=[1,0.86,1.22,0.86,0.76], sum=0, out=[], k,i, tb0=s.tb===undefined?14:s.tb, yk=s.y-tb0;
    for(k=0;k<5;k++)sum+=bk[k]; var Hb=h-topRise-tb0;
    for(k=0;k<5;k++){ var Th=Hb*bk[k]/sum, ww=Math.round(w*wk[k]), main=k===2, last=k===4, bays=Math.max(3,Math.round(ww/24)), open=(k%2)===1, fr='';
      for(i=0;i<bays;i++)fr+=open?'g':(k===0&&i===Math.floor(bays/2))?'d':'w';
      out.push({x:s.x-Math.round((w-ww)/2),y:Math.round(yk),w:ww,d:Math.round(ww*0.6),h:Math.round(Th*0.6),dir:s.dir,z:zOf(s),storeys:1,roof:last?'zanjian':'xieshan',rise:Math.round(Th*0.38+(last?topRise:0)),
        ov:Math.round(ww*(main?0.13:0.1)),qiao:main?7.5:6,ez:main?11:9,dougong:true,dgHeavy:true,deepEave:true,tb:k===0?0:(main?8:6),balcony:k>0,bays:bays,front:[fr],tiles:s.tiles||'ochre',chiwen:!last,
        sign:main?s.sign:undefined,signBig:true,eaveK:main?1.5:1.15,tileK:main?1.15:1.05,shadeBays:!open,dingding:k===0,pale:s.pale,open:open,deepGallery:main,tileGrad:true});
      yk-=Th; }
    return out; }
  function hhlGeom(ctx,s){ var specs=hhlSpecs(ctx,s), parts=[], polys=[], body=[], w=s.w||150, tb0=s.tb===undefined?14:s.tb, dir=s.dir===undefined?1:s.dir, x1=s.x, x0=s.x-w, y=s.y, d=Math.round(w*0.6), ox=ctx.OBL[0]*d*dir, oy=ctx.OBL[1]*d, sx=dir>0?x0:x1, k,i;
    for(k=0;k<specs.length;k++)parts.push({s:specs[k],G:hallGeom(ctx,specs[k])});
    for(k=0;k<parts.length;k++){ if(k<parts.length-1){ var N=parts[k+1].G; parts[k].G.occ=[N.wall,N.side,N.base,N.baseSide]; } for(i=0;i<parts[k].G.polys.length;i++)body.push(parts[k].G.polys[i]); }
    var bx0=x0-6, bx1=x1+6, bsx=sx-6*dir, base={x0:bx0,x1:bx1,y:y,yt:y-tb0,sx:bsx,ox:ox,oy:oy,dir:dir,poly:rect(bx0,y-tb0,bx1,y),side:[[bsx,y],[bsx+ox,y+oy],[bsx+ox,y-tb0+oy],[bsx,y-tb0]]};
    var sw=Math.round(w*0.26), n=Math.max(3,Math.round(tb0/3.5)), ddx=0.45*2.5*dir, ddy=tb0/n+0.55*2.5, cx=x0+w/2, treads=[];
    for(k=0;k<n;k++)treads.push([[cx-sw/2+ddx*k,y-tb0+ddy*(k+1)],[cx+sw/2+ddx*k,y-tb0+ddy*(k+1)]]);
    var tl=treads[n-1], steps={n:n,w:sw,cx:cx,treads:treads,poly:[[cx-sw/2-2,y-tb0],[cx+sw/2+2,y-tb0],[tl[1][0]+2,tl[1][1]+1],[tl[0][0]-2,tl[0][1]+1]]};
    var basePolys=tb0>0?[base.poly,base.side,steps.poly]:[];
    polys=body.concat(basePolys);
    return {parts:parts,polys:polys,body:body,basePolys:basePolys,base:base,steps:steps,tb0:tb0,z:zOf(s)}; }
  function hhlDraw(ctx,s,G){ var T=tools(ctx,G.z,s), ST=ctx.ST, C=ctx.C, rr=ctx.rr, slots={}, storeys=[], k, B=G.base, S=G.steps;
    if(G.tb0>0){ // 台基: stone courses, the flank, the flight of 石阶 in front of the face (the face's lines stop at the flight)
      T.occlude(S.poly); courses(T,B.x0,B.yt,B.x1,B.y); T.pri(B.x0-1,B.yt,B.x1+1,B.yt,undefined,1.1);
      T.rule(170,0.75,B.sx,B.y,B.sx+B.ox,B.y+B.oy); T.rule(165,0.75,B.sx,B.yt,B.sx+B.ox,B.yt+B.oy); T.rule(150,0.7,B.sx+B.ox,B.yt+B.oy,B.sx+B.ox,B.y+B.oy); T.wash(ST.INDIGO,B.side,C.danmo,0.22,2.4,2.2); T.ochre(B.side,0.16,C.ochre2);
      T.clearOcc(); var tr=S.treads, n=S.n;
      for(k=0;k<n;k++){ var a=tr[k][0], b=tr[k][1]; T.pri(a[0],a[1],b[0],b[1],undefined,0.95+0.15*k/n); T.txt(a[0]+1,a[1]+1,b[0]-1,a[1]+1,1.1,true); }
      T.str(tr[0][0][0],B.yt,tr[n-1][0][0],tr[n-1][0][1],undefined,1.05); T.str(tr[0][1][0],B.yt,tr[n-1][1][0],tr[n-1][1][1],undefined,1.05);
      T.ochre(S.poly,0.18); T.wash(ST.INDIGO,[[tr[0][0][0],B.yt+1],[tr[0][1][0],B.yt+1],[tr[n-1][1][0],tr[n-1][1][1]],[tr[n-1][0][0],tr[n-1][0][1]]],C.danmo,0.1,2.6,2.4);
      slots.steps={treads:tr.map(function(t){ return {x0:t[0][0],x1:t[1][0],y:t[0][1]}; })}; }
    for(k=0;k<G.parts.length;k++){ var P=G.parts[k], sl=drawHall(ctx,P.s,P.G); if(k===0){ slots.door=sl.door; slots.ground=sl.ground; slots.eaveLine=sl.eaveLine; } if(sl.signRect)slots.signRect=sl.signRect;
      storeys.push({y0:P.G.y,y1:P.G.roof.ye,x0:P.G.x0,x1:P.G.x1,open:!!P.s.open,eave:{y:P.G.roof.ye,x0:P.G.roof.XL,x1:P.G.roof.XR}}); }
    var top=G.parts[G.parts.length-1].G.roof.apex; slots.top={x:top[0],y:top[1]}; slots.storeys=storeys;
    slots.bodyFp=unionFp(ctx,G.body,G.z); slots.baseFp=unionFp(ctx,G.basePolys,G.z); slots.ground={x0:B.x0,x1:B.x1,y:B.y};
    return slots; }
  KINDS.huanghelou={geom:hhlGeom,draw:hhlDraw};
  KINDS.qingchuange={geom:function(ctx,s){ return towerGeom(ctx,copy(s,{tb:s.tb===undefined?22:s.tb,w:s.w||120,h:s.h||220}),s.tiers||3,0.13,'indigo'); },draw:towerDraw};

  // 里份: a tiled front wall with a 石库门 and faded 春联, the two-storey 灰瓦 house set back behind it (the 天井 lies between)
  function lilongGeom(ctx,s){ var w=s.w||90, h=s.h||110, dir=s.dir===undefined?1:s.dir, d=s.d||Math.round(w*0.7), ox=ctx.OBL[0]*d*dir, oy=ctx.OBL[1]*d, sb=0.45, sx=dir>0?s.x-w:s.x, z=zOf(s), i;
    var wh=Math.round(h*0.5), wall={x0:s.x-w,x1:s.x,y:s.y,yt:s.y-wh,sx:sx,ox:ox*sb,oy:oy*sb,poly:rect(s.x-w,s.y-wh-3.5,s.x,s.y),side:[[sx,s.y],[sx+ox*sb,s.y+oy*sb],[sx+ox*sb,s.y-wh-3.5+oy*sb],[sx,s.y-wh-3.5]]};
    // the house behind is a pair of 硬山 brick units with a 天井 slot between them; each unit's ridge and 翘角 differ (roofGeom noise at its own x)
    var gap=Math.max(4,Math.round(w*0.06)), uw=Math.round((w-gap)/2), hx=s.x+ox*sb, hy=s.y+oy*sb, units=[], specs=[], polys=[wall.poly,wall.side];
    for(i=0;i<2;i++){ var bays=Math.max(1,Math.round(uw/26)), ws='', xs='', k; for(k=0;k<bays;k++){ ws+='w'; xs+='x'; }
      var hs={x:hx-i*(uw+gap),y:hy,w:uw,d:Math.round(d*0.55),h:Math.round(h*0.8),dir:dir,z:z,storeys:2,roof:'yingshan',tb:0,bays:bays,front:[xs,ws],tiles:'grey',qiao:0.8,brick:true,attachL:i===0,attachR:i===1}, G=hallGeom(ctx,hs);
      G.occ=[wall.poly,wall.side]; units.push(G); specs.push(hs); polys=polys.concat(G.polys); }
    var dw=16, dh=Math.round(wh*0.62), dx0=s.x-w/2-dw/2;
    return {wall:wall,units:units,unitSpecs:specs,gap:{x0:hx-uw-gap,x1:hx-uw,y:hy,yt:hy-Math.round(h*0.42)},house:units[0],houseSpec:specs[0],door:{x0:dx0,x1:dx0+dw,y0:s.y-dh,y1:s.y},polys:polys,z:z}; }
  function lilongDraw(ctx,s,G){ var T=tools(ctx,G.z,s), ST=ctx.ST, C=ctx.C, rr=ctx.rr, R=ctx.R, W=G.wall, D=G.door, xm=(D.x0+D.x1)/2, i, ext=G.occ||[];
    function occExt(){ for(var q=0;q<ext.length;q++)T.occlude(ext[q]); }
    for(i=0;i<G.units.length;i++)drawHall(ctx,G.unitSpecs[i],G.units[i]);
    // the 天井 slot: a low party wall between the two units, its top a little below the front wall's cap
    var gp=G.gap; for(i=0;i<G.units.length;i++)T.occlude(G.units[i].front); T.occlude(W.poly); T.occlude(W.side); occExt();
    T.str(gp.x0-0.5,gp.yt,gp.x1+0.5,gp.yt,undefined,0.9); T.txt(gp.x0+1,gp.yt+2.5,gp.x1-1,gp.yt+2.5,0.9,true); T.wash(ST.INDIGO,rect(gp.x0+0.5,gp.yt+0.5,gp.x1-0.5,gp.y),C.danmo,0.14,2.5,2);
    T.clearOcc(); for(i=0;i<G.units.length;i++){ T.occlude(G.units[i].front); T.occlude(G.units[i].side); } occExt();
    wallFace(T,W.x0,W.x1,W.y,W.yt,W.sx,W.ox,W.oy);
    T.clearOcc(); occExt();
    T.pri(D.x0,D.y0,D.x0,D.y1); T.str(D.x0-2.5,D.y0-1,D.x0-2.5,D.y1); T.pri(D.x1,D.y0,D.x1,D.y1); T.str(D.x1+2.5,D.y0-1,D.x1+2.5,D.y1);
    T.pri(D.x0-4.5,D.y0-1,D.x1+4.5,D.y0-1,undefined,1.05); T.str(D.x0-4.5,D.y0-6,D.x1+4.5,D.y0-6,undefined,1.1); T.str(D.x0-4.5,D.y0-6,D.x0-4.5,D.y0-1); T.str(D.x1+4.5,D.y0-6,D.x1+4.5,D.y0-1);
    var arc=[]; for(i=0;i<=8;i++){ var a=Math.PI+Math.PI*i/8; arc.push([xm+Math.cos(a)*(D.x1-D.x0)*0.45,D.y0-6-Math.abs(Math.sin(a))*4]); } T.curve(ST.JIEHUA,arc,C.ink,T.INK.structural.al,T.INK.structural.w);
    T.txt(xm,D.y0+0.5,xm,D.y1-0.5,1.2,true); T.dots(ST.JIEHUA,[[xm-3.5,D.y0+(D.y1-D.y0)*0.5,1.4],[xm+3.5,D.y0+(D.y1-D.y0)*0.5,1.4]],C.ink,170);
    // brick courses only beside the doorway (the rest of the wall stays a plain rendered face)
    for(var side=0;side<2;side++){ var bx0=side?D.x1+6.5:Math.max(W.x0+1,D.x0-18), bx1=side?Math.min(W.x1-1,D.x1+18):D.x0-6.5, row=0;
      for(var cy=D.y1-rr(2,3.5);cy>D.y0-7;cy-=rr(3,3.8),row++){ if(R()<0.3)continue; var xa=bx0+(side?0:rr(0,5)), xb=bx1-(side?rr(0,5):0); T.txt(xa,cy,xb,cy+rr(-0.2,0.2),0.85); if(R()<0.5){ var jx=xa+(xb-xa)*(row%2?0.3:0.65)+rr(-1.5,1.5); T.tex(jx,cy-2.6,jx,cy-0.3,T.INK.texture.al*0.8,T.INK.texture.w); } } }
    T.wash(ST.INDIGO,rect(D.x0+0.5,D.y0+0.5,D.x1-0.5,D.y1-0.5),C.danmo,0.3,2.5,2.5);
    T.ochre(rect(D.x0-2.5,D.y0-6,D.x0,D.y1),0.22); T.ochre(rect(D.x1,D.y0-6,D.x1+2.5,D.y1),0.22);
    if(s.chunlian!==false){ var sy=D.y0+(D.y1-D.y0)*0.18, strips=[rect(D.x0-6.5,sy,D.x0-3.5,sy+14),rect(D.x1+3.5,sy,D.x1+6.5,sy+14),rect(xm-7,D.y0-10,xm+7,D.y0-7)];
      for(var q=0;q<3;q++){ var b=strips[q]; T.wash(ST.INDIGO,b,C.zhusha,0.32,2,1.6); T.ruleC(ST.INDIGO,C.zhusha,80,0.5,b[0][0],b[0][1],b[3][0],b[3][1],0); T.ruleC(ST.INDIGO,C.zhusha,80,0.5,b[1][0],b[1][1],b[2][0],b[2][1],0); } }
    return {door:{x:xm,y:D.y1,w:D.x1-D.x0,h:D.y1-D.y0},wallTop:{y:W.yt,x0:W.x0,x1:W.x1},ground:{x0:W.x0,x1:W.x1,y:W.y}}; }
  KINDS.lilong={geom:lilongGeom,draw:lilongDraw};

  /* ---------------------------------------------------------------- D-12 (4) 轉角街屋: a corner house whose two faces are BOTH real
     The long face runs along the main street (4–6 window bays over a 骑楼 arcade of 3–4 arches, a balcony line on the first floor); the short
     face turns down the side street along OBL with 2–3 bays of its own, foreshortened; a chamfered corner bay carries the entrance; the roof is a
     歇山 turning the corner, ridge parallel to the long face, two 戗脊 flanking the chamfer facet. Side face = the shaded plane (INDIGO 0.3),
     its windows paler; the long face keeps the silk. Side depth, bays and roof are decided from one another (nS from d, ridge inset from w). */
  function quadWindow(T,P,k){ var rr=T.ctx.rr, R=T.ctx.R, i; k=k||1;
    for(i=0;i<4;i++){ var a=P[i], b=P[(i+1)%4]; T.str(a[0],a[1],b[0],b[1],undefined,k*(i===0?1:0.9)); }
    var n=Math.max(2,Math.round(dist(P[0],P[1])/2.2)); for(i=1;i<n;i++){ var t=i/n, u=lerp(P[0],P[1],t), v=lerp(P[3],P[2],t); if(R()>0.1)T.txt(u[0],u[1]+0.8,v[0],v[1]-0.8,k*rr(0.85,1.2)); }
    var m0=lerp(P[0],P[3],0.62), m1=lerp(P[1],P[2],0.62); T.txt(m0[0],m0[1],m1[0],m1[1],k*1.2,true); }
  function cornerGeom(ctx,s){ var w=s.w||90, dir=s.dir===undefined?1:s.dir, d=s.d||Math.round(w*0.55), n=s.storeys||2, h=s.h||Math.round(n*34), z=zOf(s), i,k;
    var ox=ctx.OBL[0]*d*dir, oy=ctx.OBL[1]*d, x1=s.x, x0=s.x-w, y=s.y, cx=dir>0?x0:x1, ye=y-h, tb=3, yb=y-tb;
    function nz(i){ var v=ctx.noise(s.x*0.0131+i*2.71+5.3,s.y*0.0173+i*1.31+2.9); return clamp((v-0.28)/0.44,0,1); }
    var c=Math.round(clamp(w*0.12,8,14)), vc=clamp(c*0.9/d,0.12,0.3);
    function F(u,yy){ return [cx+dir*u,yy]; } function Sd(v,yy){ return [cx+ox*v,yy+oy*v]; }
    var ov=Math.max(4,Math.round(w*0.06)), ovv=ov/d, rise=s.rise||Math.round(clamp(w*0.22,10,26)), ins=Math.round(w*0.18);
    var H=yb-(ye+3), gh=Math.round(H*(n===2?0.44:0.38)), uh=(H-gh-4*(n-1))/(n-1), bands=[{y0:yb,y1:yb-gh}], yy=yb-gh-4;
    for(k=1;k<n;k++){ bands.push({y0:yy,y1:k===n-1?ye+3:yy-uh}); yy=yy-uh-4; }
    var nA=clamp(Math.round((w-c)/28),3,4), nB=clamp(Math.round((w-c)/17),4,6), nS=clamp(Math.round(d*0.6/16),2,3), aw=[], sum=0;
    for(i=0;i<nB;i++){ var t=0.85+0.3*nz(10+i); aw.push(t); sum+=t; } var bcols=[c+1]; for(i=0;i<nB;i++)bcols.push(bcols[i]+(w-c-2)*aw[i]/sum);
    var acols=[]; for(i=0;i<=nA;i++)acols.push(c+1+(w-c-2)*i/nA); var scols=[]; for(i=0;i<=nS;i++)scols.push(vc+(1-vc)*i/nS);
    var q=2.2*Math.min(1,w/50), eF=eavePts(F(c-ov*0.5,ye),F(w+ov,ye),0,q), sF=Sd(vc,ye), sB=Sd(1+ovv,ye); sF[0]-=dir*ov*0.9; sB[0]-=dir*ov*0.9;
    var eS=eavePts(sF,sB,0,q), eC=[eF[0],eS[0]];
    var ridge=[[cx+dir*ins+ox*0.5,ye-rise],[cx+dir*(w-ins)+ox*0.5,ye-rise]], rEnd=ridge[0], rFar=ridge[1];
    var mid=lerp(sF,sB,0.5), HC=lerp(mid,rEnd,0.58), hv=[(sB[0]-sF[0])*0.21,(sB[1]-sF[1])*0.21], TF=[HC[0]-hv[0],HC[1]-hv[1]], TB=[HC[0]+hv[0],HC[1]+hv[1]];
    var cap=2.4, roofFront=eF.concat([[rFar[0]+1.5*dir,rFar[1]-cap],[rEnd[0]-1.5*dir,rEnd[1]-cap],eS[0]]), roofSide=eS.concat([TB,TF]), gable=[TF,TB,rEnd], facet=[eF[0],eS[0],TF];
    var ridges=[[rEnd,TF],[TF,eF[0]],[TF,eS[0]],[rEnd,TB],[TB,sB],[rFar,eF[eF.length-1]]];
    var front=[F(c,ye+3),F(w,ye+3),F(w,yb),F(c,yb)], cham=[F(c,ye+3),Sd(vc,ye+3),Sd(vc,yb),F(c,yb)], side=[Sd(vc,ye+3),Sd(1,ye+3),Sd(1,yb),Sd(vc,yb)];
    var base=[F(c,yb),F(w+3,yb),F(w+3,y),F(c,y)], baseC=[F(c,yb),Sd(vc,yb),Sd(vc,y),F(c,y)], baseS=[Sd(vc,yb),Sd(1,yb),Sd(1,y),Sd(vc,y)];
    var ez=[F(c-ov,ye),F(w+ov,ye),F(w+ov,ye+4),F(c-ov,ye+4)], ezS=[[sF[0],sF[1]],[sB[0],sB[1]],[sB[0],sB[1]+4],[sF[0],sF[1]+4]];
    return {x:s.x,y:y,w:w,d:d,h:h,n:n,dir:dir,ox:ox,oy:oy,x0:x0,x1:x1,cx:cx,ye:ye,yb:yb,tb:tb,z:z,c:c,vc:vc,F:F,Sd:Sd,ov:ov,rise:rise,bands:bands,nA:nA,nB:nB,nS:nS,bcols:bcols,acols:acols,scols:scols,
      eF:eF,eS:eS,eC:eC,ridge:ridge,TF:TF,TB:TB,sB:sB,ridges:ridges,roofFront:roofFront,roofSide:roofSide,gable:gable,facet:facet,front:front,cham:cham,side:side,base:base,baseC:baseC,baseS:baseS,
      polys:[base,baseC,baseS,front,cham,side,ez,ezS,roofFront,roofSide,gable,facet]}; }
  function cornerDraw(ctx,s,G){ var T=tools(ctx,G.z,s), ST=ctx.ST, C=ctx.C, rr=ctx.rr, R=ctx.R, IK, F=G.F, Sd=G.Sd, dir=G.dir, w=G.w, c=G.c, vc=G.vc, y=G.y, yb=G.yb, i,k, slots={}; IK=T.INK;
    if(G.occ)for(i=0;i<G.occ.length;i++)T.occlude(G.occ[i]);
    function L(a,b,g,k){ if(g==='p')T.pri(a[0],a[1],b[0],b[1],undefined,k); else if(g==='t')T.txt(a[0],a[1],b[0],b[1],k,true); else T.str(a[0],a[1],b[0],b[1],undefined,k); }
    // ground and 台基: front, chamfer, side — one ground line turning the corner
    T.draft(F(c,y+0.5)[0],y+0.5,F(w+3,y+0.5)[0],y+0.5); T.draft(Sd(vc,y+0.5)[0],Sd(vc,y+0.5)[1],Sd(1,y+0.5)[0],Sd(1,y+0.5)[1]);
    L(F(c,y),F(w+3,y),'p',1.05); L(F(c,y),Sd(vc,y),'p',1); L(Sd(vc,y),Sd(1,y),'p',0.95); L(F(c,yb),F(w+3,yb),'s',1); L(F(c,yb),Sd(vc,yb),'s',0.9); L(Sd(vc,yb),Sd(1,yb),'s',0.85); L(Sd(1,yb),Sd(1,y),'s',0.8);
    T.ochre(G.base,0.2); T.ochre(G.baseC,0.18); T.ochre(G.baseS,0.16);
    // ground floor: the 骑楼 arcade — piers, arches, a dark interior band under every arch (D-12 a), the shop line inside
    var b0=G.bands[0], top=b0.y1, ac=G.acols, ar=[];
    for(i=0;i<=G.nA;i++){ var px=F(ac[i],0)[0]; T.pri(px-1.2,top+0.5,px-1.2,yb,undefined,i===0||i===G.nA?1:0.9); T.str(px+1.2,top+1,px+1.2,yb-0.3,undefined,0.85); T.wash(ST.OCHRE,rect(px-1.6,top+1,px+1.6,yb-0.5),C.ochre,0.3,2,1.5); }
    L(F(c-1,top),F(w+1,top),'p',1.05); L(F(c,top+3),F(w,top+3),'s',0.9); T.ochre(rect(Math.min(F(c,0)[0],F(w,0)[0]),top+0.4,Math.max(F(c,0)[0],F(w,0)[0]),top+2.8),0.26);
    for(i=0;i<G.nA;i++){ var xa=Math.min(F(ac[i],0)[0],F(ac[i+1],0)[0])+2.6, xb=Math.max(F(ac[i],0)[0],F(ac[i+1],0)[0])-2.6, oh=yb-top-4;
      archWindow(T,xa,top+4,xb,yb,1.05,false); T.wash(ST.INDIGO,rect(xa+0.8,top+4+(xb-xa)*0.5,xb-0.8,yb-oh*0.42),C.danmo,0.36,1.6,1.7);
      T.str(xa+1.5,yb-oh*0.5,xb-1.5,yb-oh*0.5,undefined,0.75); T.txt(xa+3,yb-oh*0.5,xa+3,yb-0.8,0.9,true); T.txt(xb-3,yb-oh*0.5,xb-3,yb-0.8,0.9,true);
      ar.push({x0:xa,x1:xb,y:yb}); }
    // the balcony line on the first floor, turning the corner: front rail with posts, the chamfer, the side rail foreshortened
    var bt=top-6; L(F(c-3,bt),F(w+3,bt),'p',0.9); L(F(c-3,top-0.5),F(w+3,top-0.5),'s',0.9); for(var u=c-2+rr(0,2);u<w+3;u+=rr(3.5,5))T.txt(F(u,0)[0],bt+0.3,F(u,0)[0],top-0.8,rr(1,1.4),true);
    L(F(c-3,bt),Sd(vc,bt),'s',1); L(Sd(vc,bt),Sd(1,bt),'s',0.9); L(Sd(vc,top-0.5),Sd(1,top-0.5),'s',0.75); for(var t=vc+0.03;t<1;t+=rr(0.08,0.12)){ var a=Sd(t,bt), b=Sd(t,top); T.txt(a[0],a[1]+0.3,b[0],b[1]-0.8,rr(0.9,1.3),true); }
    // upper storeys: long-face window bays (their own rhythm, not the arcade's), floor bands, the chamfer bay, the side bays paler
    for(k=1;k<G.n;k++){ var b=G.bands[k], bh=b.y0-b.y1; if(k>1){ L(F(c-1,b.y0+2),F(w+1,b.y0+2),'p',0.95); L(F(c,b.y0+4),F(w,b.y0+4),'s',0.8); L(F(c-1,b.y0+2),Sd(vc,b.y0+2),'s',0.9); L(Sd(vc,b.y0+2),Sd(1,b.y0+2),'s',0.8); }
      for(i=0;i<G.nB;i++){ var wx0=Math.min(F(G.bcols[i],0)[0],F(G.bcols[i+1],0)[0])+2.2, wx1=Math.max(F(G.bcols[i],0)[0],F(G.bcols[i+1],0)[0])-2.2; window(T,wx0,b.y1+bh*0.16,wx1,b.y0-bh*0.28); T.str(Math.max(wx0,wx1)+2.2,b.y1+1,Math.max(wx0,wx1)+2.2,b.y0-0.5,undefined,0.6); }
      var cq=[F(c-1.5,b.y1+bh*0.18),Sd(vc*0.85,b.y1+bh*0.18+G.oy*vc*0.85*0),Sd(vc*0.85,b.y0-bh*0.3),F(c-1.5,b.y0-bh*0.3)]; cq[1]=Sd(vc*0.85,b.y1+bh*0.18); quadWindow(T,cq,0.85);
      for(i=0;i<G.nS;i++){ var va=G.scols[i]+(G.scols[i+1]-G.scols[i])*0.18, vb=G.scols[i]+(G.scols[i+1]-G.scols[i])*0.82; quadWindow(T,[Sd(va,b.y1+bh*0.16),Sd(vb,b.y1+bh*0.16),Sd(vb,b.y0-bh*0.28),Sd(va,b.y0-bh*0.28)],0.75); } }
    // the chamfer bay: the entrance — an arched door, dark inside, two steps
    var dx0=F(c-1,0)[0], dxs=Sd(vc*0.9,0), dw=Math.abs(dxs[0]-dx0)-1, dl=Math.min(dx0,dxs[0])+0.5, ddy=G.oy*vc*0.9;
    T.pri(dl,top+5,dl,yb); T.pri(dl+dw,top+5+ddy*0.9,dl+dw,yb+ddy*0.9); L([dl-1,top+5],[dl+dw+1,top+5+ddy*0.9],'p',1.05); L([dl-1,top+2.5],[dl+dw+1,top+2.5+ddy*0.9],'s',1);
    T.wash(ST.INDIGO,[[dl+0.6,top+6],[dl+dw-0.6,top+6+ddy*0.9],[dl+dw-0.6,yb-1+ddy*0.9],[dl+0.6,yb-1]],C.danmo,0.38,1.6,1.7);
    T.txt((dl+dw/2),top+6,(dl+dw/2),yb-0.5,1.1,true); slots.door={x:dl+dw/2,y:yb,w:dw,h:yb-top-5};
    // side face pilasters at the bay lines, down the whole height, paler; the rear corner post
    for(i=0;i<=G.nS;i++){ var pa=Sd(G.scols[i],G.ye+3), pb=Sd(G.scols[i],yb); T.str(pa[0],pa[1],pb[0],pb[1],undefined,i===G.nS?0.85:0.7); }
    // roof: 歇山 turning the corner
    eaveLines(T,G.eF,0,1); eaveLines(T,G.eC,0,0.95); eaveLines(T,G.eS,0,0.9);
    var r0=G.ridge[0], r1=G.ridge[1]; T.pri(r0[0]-dir,r0[1],r1[0]+dir,r1[1],undefined,1.1); T.str(r0[0]-dir,r0[1]-1.7,r1[0]+dir,r1[1]-1.7);
    for(i=0;i<G.ridges.length;i++){ var ra=G.ridges[i][0], rb=G.ridges[i][1]; if(i===G.ridges.length-1)T.pri(ra[0],ra[1],rb[0],rb[1]); else T.str(ra[0],ra[1],rb[0],rb[1],undefined,1.05); }
    tiles(T,G.eF,r0,r1); tiles(T,G.eS,G.TF,G.TB); tiles(T,G.eC,G.TF,G.TF);
    var yr=r0[1], ye=G.ye, pred=function(px,py){ var u=(py-yr)/(ye-yr); return R()>0.35*clamp(u,0,1); }, predLo=function(px,py){ var u=(py-yr)/(ye-yr); return R()<0.55+0.5*u; };
    T.wash(ST.INDIGO,G.roofFront,C.danmo,0.25,2.6,2.4,predLo); T.wash(ST.INDIGO,G.roofSide,C.danmo,0.26,2.6,2.4,predLo);   // D-19 (1): the tile mass over the whole slope
    T.wash(ST.INDIGO,G.roofFront,C.huaqing,0.14,2.4,2.2,pred); T.wash(ST.INDIGO,G.roofSide,C.huaqing,0.2,2.4,2.2); T.wash(ST.INDIGO,G.gable,C.huaqing,0.19,2.4,2); T.wash(ST.INDIGO,G.facet,C.huaqing,0.2,2.4,2,pred);
    T.fin(G.eF,rr(95,115),0.62); T.fin([G.eC[0],lerp(G.eC[0],G.eC[1],0.5),G.eC[1]],100,0.6); T.fin(G.eS,rr(90,110),0.6); T.fin([r0,lerp(r0,r1,0.5),r1],95,0.6);
    // D-12 (a)(c): the planes — under every eave, and the whole side face (turned from the light); the chamfer half-shaded; the long face keeps the silk
    eavePlane(T,G.eF,1); eavePlane(T,G.eC,1); eavePlane(T,G.eS,0.9);
    T.ochre(G.side,0.14,C.ochre2); flankPlane(T,G.side,dir,0); T.wash(ST.INDIGO,G.cham,C.danmo,dir>0?0.12:0.06,2,2);
    if(s.sign){ var bwid=clamp(w*0.28,20,40), bhgt=bwid/3, bxc=F(c+(w-c)*0.5,0)[0], by=bt-2-bhgt;
      T.rule(180,0.7,bxc-bwid/2,by,bxc+bwid/2,by); T.rule(180,0.7,bxc-bwid/2,by+bhgt,bxc+bwid/2,by+bhgt); T.rule(170,0.7,bxc-bwid/2,by,bxc-bwid/2,by+bhgt); T.rule(170,0.7,bxc+bwid/2,by,bxc+bwid/2,by+bhgt);
      slots.signRect={x:bxc-bwid/2,y:by,w:bwid,h:bhgt,cx:bxc,cy:by+bhgt/2,vertical:false,text:s.sign}; }
    slots.arcade=ar; slots.balcony={y:bt,x0:Math.min(F(c,0)[0],F(w,0)[0]),x1:Math.max(F(c,0)[0],F(w,0)[0])}; slots.eaveLine={y:G.ye,x0:Math.min(G.eF[0][0],G.eF[G.eF.length-1][0]),x1:Math.max(G.eF[0][0],G.eF[G.eF.length-1][0])};
    slots.ground={x0:G.x0,x1:G.x1,y:y}; slots.counter=ar.length?{x:(ar[0].x0+ar[0].x1)/2,y:yb,w:ar[0].x1-ar[0].x0,x0:ar[0].x0,x1:ar[0].x1}:undefined;
    return slots; }
  KINDS.cornerHouse={geom:cornerGeom,draw:cornerDraw};

  /* ---------------------------------------------------------------- D-10 连续街屋: a whole row as ONE structure
     The front line steps in and out along OBL (4–14 px), so at every step back the forward unit's flank shows as a 淡墨 wall face with its own
     eave return; units differ in kind (two-storey shop, single-storey shop with 凉棚, a gate/passage into the 里弄, a corner unit turned along the
     side street, 石库门 pairs with 天井 gaps), in bays and roof, and share party walls; under every eave the space is real (counter, dark interior
     band, shadow); a second rank of roofs stands behind and shows only in the gaps and above the lower units, cut by the front silhouette and paler.
     Geometry (rowPlan) uses ctx.noise only, so footprint() and build() agree. Ranks: smaller setback = nearer; equal setback: the left unit hides the
     right one's flank (party wall). Each unit is a hall/shop/lilong geometry with the nearer units' polygons as local occluders. */
  var ROWS={hubuxiang:1,hanzhengjie:1,lilong:1,jianghanlu:1,hzrear:1};
  function rowPlan(ctx,s){ var kind=s.row||(ROWS[s.kind]?s.kind:'hubuxiang'), dir=s.dir===undefined?1:s.dir, z=zOf(s), pale=s.pale||1, w=s.w, i,k;
    if(kind==='hzrear')return rearRowPlan(ctx,s);
    function nz(i,j){ var v=ctx.noise(s.x*0.0113+i*2.37+3.1,s.y*0.0197+j*1.73+11.7); return clamp((v-0.28)/0.44,0,1); }
    var H=s.h||(kind==='lilong'?104:kind==='hanzhengjie'?84:96), rise=s.rise||0, depth=s.depth||Math.round(clamp(w/9,26,44));
    var n=clamp(Math.round(w/(kind==='lilong'?62:54)),5,9), kinds=[], wts=[], sum=0;
    // unit kinds along the row (right to left): the rightmost is a full shop, a gate sits in the middle third, the last unit turns the corner
    var gateAt=2+Math.floor(nz(0,0)*(n-4+0.999));
    for(k=0;k<n;k++){ var v=nz(k,1), kd;
      if(k===n-1&&kind!=='lilong')kd=s.cornerHouse?'cornerHouse':'corner'; else if(kind==='hanzhengjie')kd='hz'; else if(k===gateAt)kd='gate';
      else if(kind==='lilong')kd=v<0.25?'shop1':'shiku';
      else if(kind==='jianghanlu')kd=v<0.55?'colon':v<0.8?'shop2':'shop1';
      else kd=v<0.4?'shop1':'shop2';
      if(k===0&&(kd==='shop1'||kd==='gate'))kd=kind==='lilong'?'shiku':'shop2';
      kinds.push(kd); var wt=kd==='gate'?0.4:kd==='corner'?0.55:kd==='cornerHouse'?1.25:kd==='shiku'?1.15:kd==='hz'?0.8+0.5*nz(k,2):0.75+0.55*nz(k,2); wts.push(wt); sum+=wt; }
    // 汉正街 (round 6, tell 6): a side lane — a gap the width of a person — after every 2nd or 3rd unit; the lane widths come off the frontage first
    var laneAfter=[], laneW=11, prevLane=-1, wAvail=w; for(k=0;k<n;k++){ var ln=kind==='hanzhengjie'&&k>=1&&k<=n-3&&k-prevLane>=2&&(k-prevLane>=3||nz(k,14)>0.5); laneAfter.push(ln); if(ln){ prevLane=k; wAvail-=laneW; } }
    // round 7 (D-14, tell 3): ONE unit per 汉正街 row — the one nearest the row's centre — is built as a through-space (shed floor, house threshold and lane floor on one
    // ground line, the goods stacked from the counter back to the door, the lane level to the house and then stepping down). It stands on the front line and has its lane on its left.
    var kT=-1; if(kind==='hanzhengjie'){ var acc=0, best=1e9; for(k=0;k<n;k++){ var cxk=acc+wts[k]/sum*0.5; acc+=wts[k]/sum; if(kinds[k]==='hz'&&k<=n-3&&Math.abs(cxk-0.5)<best){ best=Math.abs(cxk-0.5); kT=k; } }
      if(kT>=0){ laneAfter[kT]=true; if(kT>0)laneAfter[kT-1]=false; if(kT+1<n)laneAfter[kT+1]=false; wAvail=w; for(k=0;k<n;k++)if(laneAfter[k])wAvail-=(k===kT?18:laneW); } }
    // the through lane is a cart's width (18 px) and its left neighbour stands back, so the lane floor and its steps stay in view past the neighbour's front edge in the oblique view
    // setbacks along OBL: 0 = the front line; 4–14 px back. At least two of each so the line really steps
    var sb=[], back=0, fwd=0; for(k=0;k<n;k++){ var u=nz(k,3), b=u<0.5?0:Math.round(4+10*(u-0.5)*2); if(kinds[k]==='gate'||kinds[k]==='corner'||kinds[k]==='cornerHouse'||k===kT)b=0; sb.push(b); if(b)back++; else fwd++; }
    if(back<2){ var b1=kT===1?0:1, b3=Math.min(n-2,kT===3?4:3); sb[b1]=Math.max(sb[b1],8); sb[b3]=Math.max(sb[b3],12); } if(fwd<2){ sb[0]=0; sb[2]=0; }
    if(kT>=0){ sb[kT]=0; sb[kT+1]=Math.max(sb[kT+1],10); }
    var units=[], polys=[], xr=s.x, signs=s.signs||[], sgi=0, hz=0, lanes=[], goodsOff=Math.floor(nz(0,17)*2.999);
    for(k=0;k<n;k++){ var wk=Math.round(wAvail*wts[k]/sum), kd=kinds[k], b=sb[k], ux=xr+ctx.OBL[0]*b*dir, uy=s.y+ctx.OBL[1]*b-rise*(s.x-xr)/w, spec, G, nv=nz(k,4), nv2=nz(k,5);
      var base={x:ux,y:uy,dir:dir,z:z,pale:pale,street:true,tb:kd==='shiku'?0:3,attachL:k<n-1&&sb[k+1]===b&&kinds[k+1]!=='gate',attachR:k>0&&sb[k-1]===b&&kinds[k-1]!=='gate'};
      if(kd==='shop2'){ spec=copy(base,{kind:'shopfront',w:wk,d:Math.round(wk*0.55),h:Math.round(H*(0.94+0.12*nv2)),storeys:2,roof:nv<0.5?'xuanshan':'yingshan',bays:Math.max(2,Math.round(wk/24)),awning:nv2>0.6&&sgi>=signs.length,huangzi:(hz++%2)===1,sign:sgi<signs.length?signs[sgi++]:undefined}); spec=shopSpec(ctx,spec); G=hallGeom(ctx,spec); }
      else if(kd==='shop1'){ spec=copy(base,{kind:'shopfront',w:wk,d:Math.round(wk*0.55),h:Math.round(H*(0.5+0.1*nv2)),storeys:1,roof:nv<0.55?'pent':'xuanshan',bays:Math.max(2,Math.round(wk/22)),awning:nv2<0.7,huangzi:nv>0.6}); spec=shopSpec(ctx,spec); G=hallGeom(ctx,spec); }
      else if(kd==='colon'){ spec=copy(base,{kind:'colonnade',w:wk,d:Math.round(wk*0.5),h:Math.round(H*(1+0.15*nv2)),storeys:2,bays:Math.max(2,Math.round(wk/22)),tb:4}); G=colonnadeGeom(ctx,spec); }
      else if(kd==='corner'){ var cw=clamp(Math.round(wk*0.8),22,34), cd=Math.round(clamp(wk*1.4,38,58)), fr=nv<0.5?'d':'w'; spec=copy(base,{w:cw,d:cd,h:Math.round(H*(nv2<0.5?0.55:0.9)),storeys:nv2<0.5?1:2,roof:nv<0.6?'xuanshan':'yingshan',bays:1,front:nv2<0.5?[fr]:[fr,'w'],huangzi:nv>0.4,huangziRed:true}); G=hallGeom(ctx,spec); }
      else if(kd==='cornerHouse'){ spec=copy(base,{kind:'cornerHouse',w:wk,d:Math.round(clamp(wk*0.62,34,60)),h:Math.round(H*(1.02+0.1*nv2)),storeys:nv2<0.5?2:3,sign:sgi<signs.length?signs[sgi++]:undefined}); G=cornerGeom(ctx,spec); }   // D-12 (4): the row ends in a real corner house
      else if(kd==='shiku'){ spec=copy(base,{kind:'lilong',w:wk,d:Math.round(wk*0.75),h:Math.round(H*1.02),chunlian:nv>0.35}); G=lilongGeom(ctx,spec); }
      else if(kd==='hz'){ // 汉正街 铺屋 = one business space: front 棚 (mat or tiles alternately, unequal pitch) + rear house (higher, set back by the shed's depth, windows in one of two rhythms) + the goods of this unit
        var st2=nz(k,18)>0.22?2:1, hh=Math.round(H*(st2>1?1.1+0.15*nv2:0.66+0.1*nv2)), hsd=Math.round(H*(0.36+0.12*nv2)), sdp=Math.round(clamp(wk*0.42,13,k===kT?18:24)), body=st2>1?(hh-6)/2:hh-3, sr=Math.round(clamp(3+7*nz(k,15),3,body-hsd-2));
        spec=copy(base,{kind:'hz',w:wk,tb:0,hs:hsd,sd:sdp,srise:sr,mat:(k%2)===0,goods:['cloth','sacks','baskets'][(k+goodsOff)%3],hd:Math.round(wk*0.5),hh:hh,storeys:st2,hroof:nv<0.55?'xuanshan':'yingshan',hbays:Math.max(1,Math.round(wk/((k%2)?17:28))),doorU:nz(k,19),ch:clamp(Math.round(hsd*0.3),10,14),sign:sgi<signs.length?signs[sgi++]:undefined,waterside:!!s.waterside,through:k===kT}); if(k===kT)spec.goods='bales'; G=hzGeom(ctx,spec); }
      else { // gate: a wall with a passage, the 里弄 behind it seen through the opening
        var gh=Math.round(H*0.5), ow=Math.max(9,Math.round(wk*0.6)), ox=ctx.OBL[0]*6*dir, oy=ctx.OBL[1]*6, sxg=dir>0?ux-wk:ux;
        spec=copy(base,{kind:'gate',w:wk,h:gh}); G={x0:ux-wk,x1:ux,y:uy,yt:uy-gh,sx:sxg,ox:ox,oy:oy,z:z,open:{x0:ux-wk/2-ow/2,x1:ux-wk/2+ow/2,y0:uy-Math.round(gh*0.78),y1:uy},
          polys:[rect(ux-wk-1,uy-gh-4,ux+1,uy),[[sxg,uy],[sxg+ox,uy+oy],[sxg+ox,uy-gh-4+oy],[sxg,uy-gh-4]]]}; G.front=G.polys[0]; G.side=G.polys[1]; }
      units.push({kind:kd,spec:spec,G:G,sb:b,x0:ux-wk,x1:ux,y:uy,k:k,laneL:laneAfter[k]}); xr-=wk;
      if(laneAfter[k]){ var lw=k===kT?18:laneW; lanes.push({x1:xr,x0:xr-lw,y:s.y-rise*(s.x-xr)/w,after:k,L:(kd==='hz'?spec.sd+spec.hd:depth),through:k===kT,sd:kd==='hz'?spec.sd:0}); xr-=lw; } }
    // rank: nearer = smaller setback; ties: the left unit hides the right one's flank (party wall)
    for(k=0;k<n;k++){ var U=units[k]; U.occ=[]; for(i=0;i<n;i++){ if(i===k)continue; var V=units[i], nearer=V.sb<U.sb||(V.sb===U.sb&&i>k); if(!nearer)continue; if(Math.abs(i-k)>2)continue; U.occ=U.occ.concat(V.G.polys.filter(function(q){ return q&&q.length>2; })); }
      U.G.occ=(U.G.occ||[]).concat(U.occ); if(U.kind==='shiku')for(i=0;i<U.G.units.length;i++)U.G.units[i].occ=U.G.units[i].occ.concat(U.occ);
      // a step back on the left exposes this unit's flank (dir>0) — it gets the 淡墨 wall face
      var L=dir>0?units[k+1]:units[k-1], laneSide=dir>0?U.laneL:(k>0&&units[k-1].laneL); U.flank=!!(L&&L.sb>U.sb)||(dir>0?k===n-1:k===0)||!!laneSide; if(U.spec)U.spec.flankShade=U.flank?0.12:0; polys=polys.concat(U.G.polys); }
    // second rank: roofs behind the row, over the gate and the low units and one or two more, cut by everything in front and a step paler
    var rears=[], frontPolys=polys.filter(function(q){ return q&&q.length>2; });
    if(kind==='hanzhengjie'){ // round 9 (D-16, tell 3c): behind a 汉正街 row the rear rank is ONE connected mass, not a row of facades — see rearMass; it stands clear of the through lane's water
      var maxL=0, tl=null; for(k=0;k<lanes.length;k++){ if(lanes[k].L>maxL)maxL=lanes[k].L; if(lanes[k].through)tl=lanes[k]; }
      var runs=tl?[[s.x+2,tl.x1+1],[tl.x0-1,xr-2]]:[[s.x+2,xr-2]];
      rears=rearMass(ctx,s,runs,Math.max(depth,maxL)+5,0.42,0.3,frontPolys,z,pale);
      for(k=0;k<rears.length;k++)polys=polys.concat(rears[k].G.polys); }
    else for(k=0;k<n;k++){ var U=units[k], want=U.kind==='gate'||U.kind==='shop1'||(U.kind!=='corner'&&U.kind!=='cornerHouse'&&nz(k,6)>0.72); if(!want)continue;
      var dd=depth+Math.round(4+8*nz(k,7)), rw=Math.round((U.x1-U.x0)*(0.75+0.45*nz(k,8))), rx=U.x1+ctx.OBL[0]*dd*dir+Math.round((U.x1-U.x0)*0.3*(nz(k,9)-0.5)), ry=U.y+ctx.OBL[1]*dd, rh=Math.round(7+5*nz(k,10));
      var rs={x:rx,y:ry,w:rw,d:Math.round(rw*0.55),h:rh,dir:dir,z:z,storeys:1,roof:nz(k,11)<0.6?'xuanshan':'xieshan',tb:0,bays:1,front:['x'],rise:Math.round(rw*(0.32+0.14*nz(k,12))),tiles:nz(k,13)<0.5?'grey':'indigo',pale:pale*0.9}, RG=hallGeom(ctx,rs);
      RG.occ=frontPolys; rears.push({spec:rs,G:RG}); polys=polys.concat(RG.polys); }
    return {kind:kind,units:units,rears:rears,lanes:lanes,polys:polys,z:z,dir:dir,depth:depth,H:H,x0:xr,x1:s.x,y:s.y,waterside:!!s.waterside}; }
  /* round 9 (D-16, tell 3c): the rear rank as ONE connected mass. Segments of their own widths (34–74 px) run along `runs` (x from right to left), each a single-storey hall
     whose depth along OBL is dd0 + {0, 3, 6} — so the roofs step and overlap in z — sharing party walls where two stand on the same line (attach: no 翘角 between, no gap);
     only two segments carry a window rhythm, the rest are a blank wall plane and a roof; a segment whose left neighbour stands further back shows its flank as the 淡墨 side.
     Each is cut by the front row and by the nearer segments within two places. Noise only (rowPlan's nz), so footprint and build agree. */
  function rearMass(ctx,s,runs,dd0,h0,h1,frontPolys,z,pale){ var dir=s.dir===undefined?1:s.dir, H=s.h||84, segs=[], out=[], r,m,k,i;
    function nz(i,j){ var v=ctx.noise(s.x*0.0113+i*2.37+3.1,s.y*0.0197+j*1.73+11.7); return clamp((v-0.28)/0.44,0,1); }
    for(r=0;r<runs.length;r++){ var xx=runs[r][0], xe=runs[r][1], first=true; if(xx-xe<20)continue;
      while(xx-xe>=20){ var rw=Math.round(34+40*nz(segs.length,20)); if(xx-rw<xe+24)rw=xx-xe; segs.push({x1:xx,x0:xx-rw,runStart:first,runEnd:xx-rw<=xe+0.5}); xx-=rw; first=false; } }
    if(!segs.length)return out;
    var winA=Math.floor(nz(1,21)*(segs.length-0.001)), winB=segs.length>1?(winA+1+Math.floor(nz(2,22)*(segs.length-1.001)))%segs.length:-1;
    for(m=0;m<segs.length;m++){ var sg=segs[m]; sg.dd=dd0+[0,3,6][Math.floor(nz(m,23)*2.999)]; sg.h=Math.round(H*(h0+h1*nz(m,24))); }
    for(m=0;m<segs.length;m++){ var sg=segs[m], L=segs[m+1], Rt=segs[m-1], w=sg.x1-sg.x0, win=m===winA||m===winB, bays=Math.max(2,Math.round(w/((m%2)?17:26)));
      var attachL=!!(L&&!sg.runEnd&&L.dd===sg.dd), attachR=!!(Rt&&!sg.runStart&&Rt.dd===sg.dd), flank=dir>0?(!L||sg.runEnd||L.dd>sg.dd):(!Rt||sg.runStart||Rt.dd>sg.dd);
      var rs={x:sg.x1+ctx.OBL[0]*sg.dd*dir,y:s.y+ctx.OBL[1]*sg.dd,w:w,d:Math.round(w*0.5),h:sg.h,dir:dir,z:z,storeys:1,roof:nz(m,11)<0.6?'xuanshan':'yingshan',tb:0,bays:bays,front:[win?rep('w',bays):rep('x',bays)],
        rise:Math.round(w*(0.26+0.12*nz(m,12))),tiles:nz(m,13)<0.5?'grey':'indigo',pale:pale*0.9,attachL:attachL,attachR:attachR,flankShade:flank?0.12:0,rear:true}, RG=hallGeom(ctx,rs);
      out.push({spec:rs,G:RG,x0:sg.x0,x1:sg.x1,dd:sg.dd,h:sg.h}); }
    // occluders: the whole front row, and the nearer segments within two places (ties: the left hides the right one's flank)
    for(m=0;m<out.length;m++){ var occ=frontPolys.slice(); for(k=0;k<out.length;k++){ if(k===m||Math.abs(k-m)>2)continue; var nearer=out[k].dd<out[m].dd||(out[k].dd===out[m].dd&&k>m); if(!nearer)continue;
        for(i=0;i<out[k].G.polys.length;i++)if(out[k].G.polys[i]&&out[k].G.polys[i].length>2)occ.push(out[k].G.polys[i]); } out[m].G.occ=occ; }
    return out; }
  // round 9: a whole row that IS such a mass (main.js's rear 汉正街 row) — the segments stand on the row's front line with their steps as the setbacks; no sheds, no lanes, no second rank
  function rearRowPlan(ctx,s){ var dir=s.dir===undefined?1:s.dir, z=zOf(s), pale=s.pale||1, rise=s.rise||0, polys=[], units=[], k;
    var mass=rearMass(ctx,copy(s,{h:s.h||84}),[[s.x,s.x-s.w]],0,0.5,0.35,[],z,pale);
    for(k=0;k<mass.length;k++){ var M=mass[k], dy=-rise*(s.x-M.x1)/s.w; if(dy){ M.spec.y+=dy; M.G=hallGeom(ctx,M.spec); }
      units.push({kind:'rear',spec:M.spec,G:M.G,sb:M.dd,x0:M.x0,x1:M.x1,y:M.spec.y-ctx.OBL[1]*M.dd,k:k,laneL:false}); polys=polys.concat(M.G.polys); }
    for(k=0;k<mass.length;k++){ var occ=[], i,j; for(i=0;i<mass.length;i++){ if(i===k||Math.abs(i-k)>2)continue; var nearer=mass[i].dd<mass[k].dd||(mass[i].dd===mass[k].dd&&i>k); if(!nearer)continue;
        for(j=0;j<mass[i].G.polys.length;j++)if(mass[i].G.polys[j]&&mass[i].G.polys[j].length>2)occ.push(mass[i].G.polys[j]); } mass[k].G.occ=occ; }
    return {kind:'hzrear',units:units,rears:[],lanes:[],polys:polys,z:z,dir:dir,depth:0,H:s.h||84,x0:s.x-s.w,x1:s.x,y:s.y,waterside:false}; }
  function gateDraw(ctx,s,G){ var T=tools(ctx,G.z,s), ST=ctx.ST, C=ctx.C, rr=ctx.rr, R=ctx.R, O=G.open, i;
    if(G.occ)for(i=0;i<G.occ.length;i++)T.occlude(G.occ[i]);
    wallFace(T,G.x0,G.x1,G.y,G.yt,G.sx,G.ox,G.oy);
    // the passage: jambs and lintel primary, the alley beyond in 淡墨 with a rear wall's courses and one small window showing through
    T.pri(O.x0,O.y0,O.x0,O.y1); T.pri(O.x1,O.y0,O.x1,O.y1); T.pri(O.x0-2,O.y0,O.x1+2,O.y0,undefined,1.05); T.str(O.x0-2,O.y0-3,O.x1+2,O.y0-3);
    var ins=rect(O.x0+0.4,O.y0+0.4,O.x1-0.4,O.y1), yw=O.y0+(O.y1-O.y0)*0.55;
    for(var cy=O.y1-rr(4,6);cy>yw+2;cy-=rr(3,3.8))if(R()>0.35)T.txt(O.x0+1,cy,O.x1-1,cy+rr(-0.2,0.2),0.8);
    var wx=O.x0+(O.x1-O.x0)*rr(0.3,0.5), ww=Math.min(5,(O.x1-O.x0)*0.4); T.str(wx,O.y0+5,wx+ww,O.y0+5,undefined,0.8); T.str(wx,O.y0+5,wx,O.y0+11,undefined,0.7); T.str(wx+ww,O.y0+5,wx+ww,O.y0+11,undefined,0.7); T.str(wx,O.y0+11,wx+ww,O.y0+11,undefined,0.7);
    T.wash(ST.INDIGO,ins,C.danmo,0.15,2.5,2.5); T.wash(ST.INDIGO,rect(O.x0+0.4,O.y0+0.4,O.x1-0.4,O.y0+(O.y1-O.y0)*0.45),C.danmo,0.14,2.5,2.5);
    T.fin([[O.x0-2,O.y0],[(O.x0+O.x1)/2,O.y0+0.2],[O.x1+2,O.y0]],110,0.62);
    return {gate:{x:(O.x0+O.x1)/2,y:O.y1,w:O.x1-O.x0,h:O.y1-O.y0},ground:{x0:G.x0,x1:G.x1,y:G.y}}; }
  /* ------------------------------------------------------------ 汉正街 铺屋 (round 6, tell 6): a business SPACE, not a facade.
     Front 棚 on posts (mat or tiled lean-to, its own pitch), the goods stacked under it and a counter at its front; the rear house behind, higher and set
     back by the shed's depth, with the windows (two bay rhythms); between them an open door through which the 侧弄 shows as a dark slot with the passage
     wall's courses low in it. Geometry from the spec only (rowPlan's noise), so footprint and build agree. */
  function rep(c,n){ var r=''; while(n-->0)r+=c; return r; }
  function hzGeom(ctx,s){ var dir=s.dir===undefined?1:s.dir, w=s.w, sd=s.sd, ox=ctx.OBL[0]*sd*dir, oy=ctx.OBL[1]*sd, z=zOf(s);
    var B=boxGeom(ctx,{x:s.x,y:s.y,w:w,h:s.hs,d:sd,dir:dir,tb:0,z:z});
    var RG=roofGeom(B,{roof:'pent',rise:s.srise,ov:3,qiao:0.5,attachL:s.attachL,attachR:s.attachR},ctx);
    var hspec=copy(s,{kind:'hall',x:s.x+ox,y:s.y+oy,w:w,d:s.hd,h:s.hh,storeys:s.storeys,roof:s.hroof,bays:s.hbays,tb:0,front:s.storeys>1?[rep('x',s.hbays),rep('w',s.hbays)]:[rep('x',s.hbays)],sign:undefined,huangzi:false,awning:false,dougong:false});
    var house=hallGeom(ctx,hspec);
    var dw=clamp(Math.round(w*0.2),8,12), dx1=Math.round(s.x-w*(0.16+0.62*s.doorU)+dw/2);
    if(s.through){ var lo=Math.max(s.x-w+dw+1,s.x-w+7.3+ox), hi=Math.min(s.x-1,s.x-2.7+ox); if(hi>lo)dx1=Math.round(clamp(dx1,lo,hi)); }   // the corridor's front end (door-end shifted by −ox) must land on the counter
    var door={x0:dx1-dw,x1:dx1,y0:B.yf+1.5,y1:house.y};
    var polys=[B.front,B.side,RG.front,RG.gable,RG.eaveZone,RG.eaveZoneS].concat(house.polys);
    return {x0:s.x-w,x1:s.x,y:s.y,z:z,dir:dir,w:w,shed:B,sroof:RG,house:house,hspec:hspec,door:door,cTop:s.y-s.ch,polys:polys}; }
  // the goods of one unit, drawn in front of the shed's dark inside; returns the boxes the inside wash must leave light
  function goods(T,kind,x0,x1,yf,cTop,y,D){ var ctx=T.ctx, rr=ctx.rr, R=ctx.R, ST=ctx.ST, C=ctx.C, IK=T.INK, keep=[], i,k, w=x1-x0;
    if(kind==='cloth'){ // bolts hung from the eave beam, unequal lengths, a fold line down each; one in 花青, one in 赭
      var n=clamp(Math.round(w/9),3,5), gx=x0+2+rr(0,3), tint=ctx.ri(0,n-1);
      for(i=0;i<n;i++){ var bw=rr(3,4.6), bx=gx+rr(0,1.5), top=yf+1, bot=cTop-rr(1,7); if(bx+bw>x1-2)break; if(bx<D.x1&&bx+bw>D.x0&&R()<0.6){ gx=D.x1+1.5; i--; continue; }
        var box=rect(bx,top,bx+bw,bot); keep.push(box); T.str(bx,top,bx,bot,undefined,0.9); T.str(bx+bw,top,bx+bw,bot,undefined,0.9); T.txt(bx+bw*rr(0.35,0.65),top+2,bx+bw*rr(0.35,0.65),bot-1,0.8);
        T.curve(ST.JIEHUA,[[bx,bot],[bx+bw*0.5,bot+1.2],[bx+bw,bot]],C.ink,IK.structural.al*0.9,IK.structural.w); T.str(bx-0.3,top,bx+bw+0.3,top,undefined,0.8);
        if(i===tint)T.wash(ST.INDIGO,rect(bx+0.4,top+1,bx+bw-0.4,bot-0.5),C.huaqing,0.14,1.6,1.6); else if(i===(tint+2)%n)T.ochre(rect(bx+0.4,top+1,bx+bw-0.4,bot-0.5),0.18);
        gx=bx+bw+rr(1.5,4); }
      // folded pieces on the counter
      for(k=0,i=x0+w*rr(0.55,0.7);k<2&&i+9<x1-2;k++,i+=rr(9,12)){ var fw=rr(7,9), fh=rr(2,3); T.str(i,cTop-fh,i+fw,cTop-fh,undefined,0.85); T.str(i,cTop-fh,i,cTop,undefined,0.8); T.str(i+fw,cTop-fh,i+fw,cTop,undefined,0.8); keep.push(rect(i,cTop-fh,i+fw,cTop)); } }
    else if(kind==='sacks'){ // sacks piled on the shed floor beside the door, two rows, the upper row set in; each a rounded body with its tied neck
      var sw=rr(7,9), sh=rr(5.5,6.5), sxs=D.x0-x0>x1-D.x1?x0+3:D.x1+2, rowN=clamp(Math.floor((D.x0-x0>x1-D.x1?D.x0-x0-4:x1-D.x1-4)/(sw+0.8)),1,4), base=cTop-rr(0.3,1.2);
      function sack(cx,cy,ww,hh){ var pts=[[cx-ww/2,cy],[cx-ww/2-0.6,cy-hh*0.55],[cx-ww*0.3,cy-hh],[cx+ww*0.3,cy-hh],[cx+ww/2+0.6,cy-hh*0.55],[cx+ww/2,cy]]; T.curve(ST.JIEHUA,pts,C.ink,IK.structural.al*rr(0.9,1.05),IK.structural.w,true);
        T.str(cx-ww/2+0.5,cy,cx+ww/2-0.5,cy,undefined,0.8); T.txt(cx-ww*0.18,cy-hh-0.3,cx+ww*0.18,cy-hh-0.3,1,true); T.txt(cx,cy-hh-0.3,cx+rr(-0.8,0.8),cy-hh-rr(1.5,2.4),1,true);
        T.txt(cx-ww*0.22,cy-hh*0.5,cx+ww*0.1,cy-hh*0.25,0.8,true); keep.push(rect(cx-ww/2-0.6,cy-hh-2.5,cx+ww/2+0.6,cy)); }
      for(i=0;i<rowN;i++)sack(sxs+sw/2+i*(sw+0.8)+rr(-0.4,0.4),base+rr(-0.4,0.4),sw*rr(0.95,1.05),sh*rr(0.9,1.1));
      for(i=0;i<rowN-1;i++)if(R()>0.25)sack(sxs+sw+i*(sw+0.8)+rr(-0.5,0.5),base-sh+rr(0,0.8),sw*rr(0.9,1),sh*rr(0.85,0.95)); }
    else { // baskets: round bodies with a rim and two weave arcs, three or four on the floor and one on the counter
      var n=clamp(Math.round(w/11),3,4), bx0=x0+3+rr(0,3);
      function basket(cx,cy,r){ var pts=[], j; for(j=0;j<=12;j++){ var a=Math.PI*(1+j/12), rx=r, ry=r*0.85; pts.push([cx+Math.cos(a)*rx,cy+Math.sin(a)*ry]); } pts=[[cx-r*0.86,cy]].concat(pts.slice(2,11)).concat([[cx+r*0.86,cy]]);
        T.curve(ST.JIEHUA,pts,C.ink,IK.structural.al*rr(0.9,1.05),IK.structural.w,true); T.str(cx-r*0.86,cy,cx+r*0.86,cy,undefined,0.85);
        T.str(cx-r*0.98,cy-r*0.72,cx+r*0.98,cy-r*0.72,undefined,0.9); T.txt(cx-r*0.95,cy-r*0.5,cx+r*0.95,cy-r*0.5,0.9,true); T.txt(cx-r*0.9,cy-r*0.3,cx+r*0.9,cy-r*0.3,0.8,true);
        for(j=-1;j<=1;j++)T.txt(cx+j*r*0.45,cy-r*0.72,cx+j*r*0.4,cy,0.7,true); keep.push(rect(cx-r-0.5,cy-r-0.5,cx+r+0.5,cy)); }
      for(i=0;i<n;i++){ var r=rr(3.2,4), cx=bx0+r; if(cx+r>x1-2)break; if(cx+r>D.x0&&cx-r<D.x1){ bx0=D.x1+1; i--; continue; } basket(cx,cTop-rr(0.3,1.5),r); bx0=cx+r+rr(1,3); }
      basket(x0+w*rr(0.6,0.75),cTop-0.2,rr(2.6,3.2)); }
    return keep; }
  // round 7 (D-14, tell 3): the through unit's goods — bales stacked on the shed floor from just behind the counter back to the house door, in rows that recede along OBL,
  // each row half-hiding the one behind it (every bale drawn becomes an occluder for the ones behind), the rearmost standing in the doorway and cut by the jamb;
  // a porter's corridor two px wide runs from the counter's gap to the door along the same OBL and nothing is put in it. Returns {keep, cor, gx}: the boxes the inside wash
  // must leave light, the corridor test, the x of the counter gap
  function throughGoods(T,s,G){ var ctx=T.ctx, rr=ctx.rr, R=ctx.R, ST=ctx.ST, C=ctx.C, IK=T.INK, x0=G.x0, x1=G.x1, y=G.y, B=G.shed, D=G.door, cTop=G.cTop, sd=s.sd, ox=B.ox, oy=B.oy/sd, keep=[], i,j;   // ox: the shift at the house's depth; oy: per px of depth
    var dcx=D.x1-2.3, cw=2.2, gx=dcx-ox;                       // corridor: at the door it hugs the right jamb; at the counter it is at gx
    function corX(t){ return dcx+ox*(t/sd-1); }
    function cor(px,py){ if(py<D.y1-0.5||py>cTop+0.8)return false; var t=(py-y)/oy; return Math.abs(px-corX(t))<cw/2; }
    var T2=tools(ctx,G.z,s); if(G.occ)for(i=0;i<G.occ.length;i++)T2.occlude(G.occ[i]);
    T2.occlude(rect(x0-1,cTop,gx-2,y+1)); T2.occlude(rect(gx+2,cTop,x1+1,y+1));   // the counter board hides the feet of the front rows
    var sw=rr(7,8.5), sh=rr(5.2,6.2);
    function bale(cx,cy,ww,hh){ var pts=[[cx-ww/2,cy],[cx-ww/2-0.5,cy-hh*0.55],[cx-ww*0.3,cy-hh],[cx+ww*0.3,cy-hh],[cx+ww/2+0.5,cy-hh*0.55],[cx+ww/2,cy]];
      T2.curve(ST.JIEHUA,pts,C.ink,IK.structural.al*rr(0.9,1.05),IK.structural.w); T2.str(cx-ww/2+0.5,cy,cx+ww/2-0.5,cy,0,0.8);
      T2.txt(cx-ww*0.18,cy-hh-0.3,cx+ww*0.18,cy-hh-0.3,1,true); T2.txt(cx,cy-hh-0.3,cx+rr(-0.8,0.8),cy-hh-rr(1.4,2.2),1,true); T2.txt(cx-ww*0.22,cy-hh*0.5,cx+ww*0.1,cy-hh*0.25,0.8,true);
      var box=[[cx-ww/2-0.6,cy+0.3],[cx-ww/2-0.9,cy-hh*0.55],[cx-ww*0.3,cy-hh-0.4],[cx+ww*0.3,cy-hh-0.4],[cx+ww/2+0.9,cy-hh*0.55],[cx+ww/2+0.6,cy+0.3]]; T2.occlude(box); keep.push(box); }
    // rows at depths sd-step, sd-2·step … while the row still shows above the counter; drawn front to back
    var step=rr(4.6,5.6), rows=[]; for(var t=sd-step;t>0;t-=step){ if(y+oy*t-sh>cTop+1)break; rows.push(t); }
    // the heap: every row two bales high, the rows nearest the door three where the beam allows, so the mass climbs from the counter to the door
    for(j=rows.length-1;j>=0;j--){ var t=rows[j], yb=y+oy*t, xs=x0+2.8+ox*t/sd+(j%2)*sw*0.5, xe=x1-2.8+ox*t/sd, cxr=corX(t), three=j<=1;
      for(var cx=xs+sw/2;cx+sw/2<xe;cx+=sw+rr(0.4,1)){ if(cx+sw/2>cxr-cw/2-0.3&&cx-sw/2<cxr+cw/2+0.3){ cx=cxr+cw/2+0.3+sw/2-(sw+0.7); continue; }
        bale(cx+rr(-0.3,0.3),yb+rr(-0.3,0.3),sw*rr(0.95,1.05),sh*rr(0.9,1.1));
        if(R()>0.15){ var ux=cx+sw*rr(0.3,0.5); if(ux+sw/2<xe&&!(ux+sw/2>cxr-cw/2-0.3&&ux-sw/2<cxr+cw/2+0.3)){ bale(ux,yb-sh+0.4,sw*rr(0.9,1),sh*rr(0.85,0.95));
          if(three&&R()<0.6&&yb-2*sh>B.yf+3.5)bale(ux+sw*rr(-0.25,0.15),yb-2*sh+0.8,sw*rr(0.85,0.95),sh*rr(0.8,0.9)); } } } }
    // round 8 (D-15, tell 3b): the rearmost bales stand on the threshold in FRONT of the house's wall plane, so they lie across the door's foot and the left jamb —
    // they are not clipped by the wall; hzDraw draws the jambs after them with these boxes as occluders, so the jamb is cut by the bale, not the reverse
    // round 9 (D-16, tell 3b): the stack on the threshold is as tall as the door's lower third, so it cuts the foot AND the left jamb for that third; a whisper of 赭 keeps it in front of the dark
    var nd=keep.length, third=(D.y1-D.y0)/3, hb=Math.max(sh*0.95,third*0.55), hb2=Math.max(sh*0.85,third-hb+0.8);
    bale(D.x0+sw*0.05,D.y1-0.2,sw,hb); bale(D.x0+sw*0.2,D.y1-hb-0.2,sw*0.92,hb2);
    for(i=nd;i<keep.length;i++)T2.ochre(keep[i],0.14,C.ochre2);
    return {keep:keep,cor:cor,gx:gx,doorKeep:keep.slice(nd)}; }
  // the shed's lean-to: mats (weave along and across, fringe at the eave, no 瓦当) or tiles (垄 up the slope, 瓦当 dots); the plane under the eave stays (D-12)
  function shedRoof(T,RG,mat){ var ctx=T.ctx, ST=ctx.ST, C=ctx.C, rr=ctx.rr, R=ctx.R, IK=T.INK, r0=RG.ridge[0], r1=RG.ridge[1], g=RG.gable, i;
    if(mat){ T.curve(ST.JIEHUA,RG.eaveF,C.ink,IK.primary.al*rr(0.95,1.05),IK.primary.w); T.curve(ST.JIEHUA,shifted(RG.eaveF,0,1.4),C.ink,IK.structural.al*0.8,IK.structural.w*0.9);
      var L=polyLen(RG.eaveF); for(var sv=rr(1,3);sv<L-1;sv+=rr(2.2,3.6)){ var p=along(RG.eaveF,sv/L); if(R()<0.5)T.tex(p[0],p[1]+0.6,p[0]+rr(-0.3,0.3),p[1]+rr(1.6,3),IK.texture.al*rr(0.8,1.2),IK.texture.w); } }
    else eaveLines(T,RG.eaveF,0,1);
    eavePlane(T,RG.eaveF,1);
    T.str(r0[0],r0[1],r1[0],r1[1],undefined,0.9);
    T.str(g[0][0],g[0][1],g[1][0],g[1][1],undefined,1.05); T.str(g[1][0],g[1][1],g[2][0],g[2][1],undefined,0.8);
    if(mat){ // weave: lines parallel to the eave every ~2.3 px up the slope, broken; seams up the slope every 12–18 px; a warm 赭 over it
      var a0=RG.eaveF[0], a1=RG.eaveF[RG.eaveF.length-1], n=Math.max(2,Math.round(dist(a0,r0)/2.3));
      for(i=1;i<n;i++){ var t=i/n, pa=lerp(a0,r0,t), pb=lerp(a1,r1,t); T.txt(pa[0]+1,pa[1],pb[0]-1,pb[1],0.85); }
      for(var u=rr(0.08,0.16);u<0.95;u+=rr(0.14,0.22)){ var qa=lerp(a0,a1,u), qb=lerp(r0,r1,u); T.str(qa[0],qa[1]-0.8,qb[0],qb[1],undefined,0.75); }
      T.ochre(RG.front,0.26,C.ochre2); T.ochre(g,0.16,C.ochre2); }
    else { tiles(T,RG.eaveF,r0,r1); var yr=r0[1], ye=RG.ye, pred=function(px,py){ var uu=(py-yr)/(ye-yr); return R()>0.06+0.94*clamp((uu-0.4)/0.35,0,1); };
      T.wash(ST.INDIGO,RG.front,C.danmo,0.08,3,3,function(px,py){ return R()<(py-yr)/(ye-yr)*1.3; }); T.wash(ST.INDIGO,RG.front,C.huaqing,0.22,2.4,2.2,pred); }
    T.fin(RG.eaveF,rr(95,112),0.62); }
  function hzDraw(ctx,s,G){ var T=tools(ctx,G.z,s), ST=ctx.ST, C=ctx.C, rr=ctx.rr, R=ctx.R, IK=T.INK, i, x0=G.x0, x1=G.x1, y=G.y, B=G.shed, RG=G.sroof, D=G.door, cTop=G.cTop, dir=G.dir, slots={};
    // 1. the rear house, cut by the shed in front of it
    G.house.occ=[B.front,B.side,RG.front,RG.gable,RG.eaveZone,RG.eaveZoneS].concat(G.occ||[]);
    drawHall(ctx,G.hspec,G.house);
    if(G.occ)for(i=0;i<G.occ.length;i++)T.occlude(G.occ[i]);
    T.draft(x0-2,y+0.5,x1+2,y+0.5);
    // 2. the door to the 侧弄 on the house's front plane: jambs, a lintel under the eave beam, the slot dark, the passage wall's courses low in it
    function doorFrame(){ var kj=s.through?1.2:1; T.pri(D.x0,D.y0,D.x0,D.y1,undefined,kj); T.pri(D.x1,D.y0,D.x1,D.y1,undefined,kj); T.str(D.x0-1.5,D.y0,D.x1+1.5,D.y0,undefined,1.05*kj);
      for(var cy=D.y1-rr(2,3);cy>D.y0+(D.y1-D.y0)*0.5;cy-=rr(2.6,3.4))if(R()>0.3)T.txt(D.x0+1,cy,D.x1-1,cy+rr(-0.2,0.2),0.7); }
    if(!s.through)doorFrame();
    // 3. the goods of this unit, then the counter and posts
    var TG=s.through?throughGoods(T,s,G):null, keep=TG?TG.keep:goods(T,s.goods,x0,x1,B.yf,cTop,y,D), keepIn=keep.map(function(q){ return ctx.polyInside(q); }), cor=TG?TG.cor:function(){ return false; };
    function clear(px,py){ if(cor(px,py))return false; for(var q=0;q<keepIn.length;q++)if(keepIn[q](px,py))return false; return true; }
    // round 8 (D-15, tell 3b): the through unit's jambs are drawn after the heap, with the bales on the threshold as occluders — the bales cut the door's foot, not the reverse
    // round 9 (D-16, tell 3a): inside the door a REAR ROOM — a second, paler threshold 8 px deeper along OBL, the near jamb's wall foot running back to it, the back wall
    // with one small window left as silk (the light comes from behind), so the eye passes the door plane, the floor strip and then the back wall — two depths
    var RR=null; if(TG){ var rdd=8, rox=ctx.OBL[0]*rdd*dir, roy=ctx.OBL[1]*rdd, tx0=Math.max(D.x0+0.4,D.x0+rox), tx1=Math.min(D.x1-0.4,D.x1+rox), ty=D.y1+roy, jx=dir>0?D.x1:D.x0, ww=Math.min(4,(tx1-tx0)*0.4), wx=tx0+(tx1-tx0)*0.45-ww/2, wy0=D.y0+(D.y1-D.y0)*0.32;
      RR={x0:tx0,x1:tx1,y:ty,rearIn:ctx.polyInside(rect(tx0,D.y0,tx1,ty)),win:rect(wx,wy0,wx+ww,wy0+4.2),winIn:ctx.polyInside(rect(wx-0.2,wy0-0.2,wx+ww+0.2,wy0+4.4)),jx:jx,rox:rox}; }
    if(TG){ for(i=0;i<TG.doorKeep.length;i++)T.occlude(TG.doorKeep[i]); doorFrame();
      T.str(RR.x0,RR.y,RR.x1,RR.y,0,0.75); T.str(RR.jx-0.4*dir,D.y1,RR.jx+RR.rox,RR.y,0,0.8);
      T.str(RR.win[0][0],RR.win[0][1],RR.win[1][0],RR.win[1][1],0,0.7); T.str(RR.win[3][0],RR.win[3][1],RR.win[2][0],RR.win[2][1],0,0.7); T.str(RR.win[0][0],RR.win[0][1],RR.win[3][0],RR.win[3][1],0,0.65); T.str(RR.win[1][0],RR.win[1][1],RR.win[2][0],RR.win[2][1],0,0.65); }
    if(TG){ // the counter opens where the corridor meets it: the board in two pieces with the flap's edge posts, the sill running through
      var gx=TG.gx; T.pri(x0+2,cTop,gx-2,cTop,undefined,1.05); T.pri(gx+2,cTop,x1-2,cTop,undefined,1.05); T.str(x0+2,cTop+1.3,gx-2,cTop+1.3,undefined,0.9); T.str(gx+2,cTop+1.3,x1-2,cTop+1.3,undefined,0.9);
      T.str(gx-2,cTop,gx-2,y-0.6); T.str(gx+2,cTop,gx+2,y-0.6); T.str(x0+2.5,cTop+1.3,x0+2.5,y-0.6); T.str(x1-2.5,cTop+1.3,x1-2.5,y-0.6); T.str(x0+1.5,y-0.8,x1-1.5,y-0.8,undefined,0.85);
      for(var jx0=x0+2.5+rr(7,10);jx0<x1-5;jx0+=rr(8,12))if(jx0<gx-3.5||jx0>gx+3.5)T.txt(jx0,cTop+1.8,jx0+rr(-0.3,0.3),y-1,0.9,true);
      T.ochre(rect(x0+3,cTop+1.6,gx-2,y-1),0.2); T.ochre(rect(gx+2,cTop+1.6,x1-3,y-1),0.2);
      T.str(D.x0+0.3,D.y1,D.x1-0.3,D.y1,0,1.05); }   // the house's threshold, seen in the doorway: the same ground the lane floor reaches at the house's depth
    else { T.pri(x0+2,cTop,x1-2,cTop,undefined,1.05); T.str(x0+2,cTop+1.3,x1-2,cTop+1.3,undefined,0.9); T.str(x0+2.5,cTop+1.3,x0+2.5,y-0.6); T.str(x1-2.5,cTop+1.3,x1-2.5,y-0.6); T.str(x0+1.5,y-0.8,x1-1.5,y-0.8,undefined,0.85);
      for(var jx=x0+2.5+rr(7,10);jx<x1-5;jx+=rr(8,12))T.txt(jx,cTop+1.8,jx+rr(-0.3,0.3),y-1,0.9,true);
      T.ochre(rect(x0+3,cTop+1.6,x1-3,y-1),0.2); }
    T.pri(x0-1,B.yf,x1+1,B.yf,undefined,1.05); T.str(x0-0.5,B.yf+2.2,x1+0.5,B.yf+2.2,undefined,0.85);
    column(T,x0+1.2,B.yf+0.5,y,false,true); column(T,x1-1.2,B.yf+0.5,y,false,true); if(G.w>34)column(T,x0+G.w*(0.44+0.14*s.doorU),B.yf+0.5,cTop-0.5,false,false);
    column(T,B.sx+B.ox,B.yf+B.oy+0.5,y+B.oy,false,false);
    // 4. the inside: the space from the eave beam down to the counter is dark (积墨, thicker at the top), leaving the goods light; the flank turned from the light gathers more
    var yf=B.yf, y1=cTop; var dIn=ctx.polyInside(rect(D.x0,D.y0,D.x1,D.y1));
    var FI=softRect(ctx,x0+0.6,yf+0.4,x1-0.6,cTop-0.3,2.5,3).inside;
    if(TG){ // round 8 (D-15, tell 3a): ONE 积墨 field from the counter's underside back into the doorway — never thinner than half under the counter's lip, full under the beam,
      // laid through the door as well (the door is the same field), then the doorway alone taken deeper, most at its head and still a third at the threshold; no lit passage wall
      T.wash(ST.INDIGO,rect(x0+0.6,yf+0.4,x1-0.6,cTop-0.3),C.danmo,0.36,1.2,1.4,function(px,py){ return FI(px,py)&&clear(px,py)&&!RR.winIn(px,py)&&(dIn(px,py)?(RR.rearIn(px,py)||R()>0.45):R()>(py-yf)/(y1-yf)*0.5); });
      // round 9 (D-16, tell 3a): the door plane and the floor strip stay at the field's 0.35; the rear room behind the second threshold deepens to ~0.5 toward the back wall, the window left as silk
      T.wash(ST.INDIGO,rect(RR.x0,D.y0+0.4,RR.x1,RR.y-0.2),C.danmo,0.26,1,1.2,function(px,py){ return clear(px,py)&&!RR.winIn(px,py)&&R()>(py-D.y0)/(RR.y-D.y0)*0.45; });
      T.wash(ST.INDIGO,rect(x0+2.5,cTop+1.3,x1-2.5,cTop+3.6),C.danmo,0.16,1.4,1.4,function(px,py){ return R()>(py-cTop-1.3)/2.3*0.9; });   // the counter's underside: the field's front edge
    } else {
    T.wash(ST.INDIGO,rect(x0+0.6,yf+0.4,x1-0.6,cTop-0.3),C.danmo,0.36,1.2,1.4,function(px,py){ return FI(px,py)&&clear(px,py)&&!dIn(px,py)&&R()>(py-yf)/(y1-yf)*0.8; });
    // the door: the slot's upper half is the darkest ink of the unit (the 侧弄 goes back into shadow); the lower half is the passage wall, lit, its courses over a thin grey
    T.wash(ST.INDIGO,rect(D.x0+0.4,D.y0+0.4,D.x1-0.4,D.y0+(D.y1-D.y0)*0.52),C.danmo,0.72,1,1.2); T.wash(ST.INDIGO,rect(D.x0+0.4,D.y0+(D.y1-D.y0)*0.5,D.x1-0.4,D.y1-0.3),C.danmo,0.14,1.2,1.3); }
    T.wash(ST.INDIGO,B.side,C.danmo,dir>0?0.28:0.12,2,2); T.ochre(B.side,0.1,C.ochre2);
    // 5. the shed roof
    shedRoof(T,RG,s.mat);
    if(TG){ // round 8 (D-15, tell 3d): the house is tied to its shed — a 淡墨 shadow on the house's front wall rising from the shed roof's back edge (the ridge), deepest at the
      // joint and gone 7 px up, so no silk shows between house and shed; through a tools set that the shed roof occludes, so the roof itself stays as painted
      var T3=tools(ctx,G.z,s), r0=RG.ridge[0], r1=RG.ridge[1], jy=Math.min(r0[1],r1[1]); if(G.occ)for(i=0;i<G.occ.length;i++)T3.occlude(G.occ[i]); T3.occlude(RG.front); T3.occlude(RG.gable); T3.occlude(RG.eaveZone); T3.occlude(RG.eaveZoneS);
      T3.wash(ST.INDIGO,rect(Math.min(r0[0],r1[0])+0.5,jy-7,Math.max(r0[0],r1[0])-0.5,Math.max(r0[1],r1[1])+0.6),C.danmo,0.22,1.4,1.5,function(px,py){ var ry=r0[1]+(r1[1]-r0[1])*(px-r0[0])/((r1[0]-r0[0])||1); return py<=ry+0.6&&R()>(ry-py)/7*0.95; }); }
    if(s.sign){ var bwid=clamp(G.w*0.3,20,40), bhgt=bwid/3, bxc=x0+G.w/2+rr(-3,3), by=B.yf+2.6;
      T.rule(140,0.5,bxc-bwid*0.35,by-2.2,bxc-bwid*0.35,by); T.rule(140,0.5,bxc+bwid*0.35,by-2.2,bxc+bwid*0.35,by);
      T.rule(180,0.7,bxc-bwid/2,by,bxc+bwid/2,by); T.rule(180,0.7,bxc-bwid/2,by+bhgt,bxc+bwid/2,by+bhgt); T.rule(170,0.7,bxc-bwid/2,by,bxc-bwid/2,by+bhgt); T.rule(170,0.7,bxc+bwid/2,by,bxc+bwid/2,by+bhgt);
      slots.signRect={x:bxc-bwid/2,y:by,w:bwid,h:bhgt,cx:bxc,cy:by+bhgt/2,vertical:false,text:s.sign}; }
    slots.counter={x:(x0+x1)/2,y:y,w:G.w-4,x0:x0+2,x1:x1-2}; slots.door={x:(D.x0+D.x1)/2,y:D.y1,w:D.x1-D.x0,h:D.y1-D.y0};
    slots.eaveLine={y:RG.ye,x0:RG.XL,x1:RG.XR}; slots.houseEave={y:G.house.roof.ye,x0:G.house.roof.XL,x1:G.house.roof.XR};
    var SU=softRect(ctx,x0,RG.ye,x1,cTop,2.5,3); slots.shadeUnderEave={poly:SU.poly,inside:SU.inside,pred:SU.pred,x0:x0,x1:x1,y0:RG.ye,y1:cTop}; slots.ground={x0:x0,x1:x1,y:y};
    return slots; }
  KINDS.hz={geom:hzGeom,draw:hzDraw};
  function streetRowDraw(ctx,s,P){ var slots={signRects:[],eaveLines:[],counters:[],doors:[],huangzi:[],gates:[],units:[],shadeUnderEave:[],lanes:[]}, i,k;
    for(i=0;i<P.rears.length;i++)drawHall(ctx,P.rears[i].spec,P.rears[i].G);
    for(k=P.units.length-1;k>=0;k--){ var U=P.units[k], sl;
      if(U.kind==='gate')sl=gateDraw(ctx,U.spec,U.G); else if(U.kind==='cornerHouse')sl=cornerDraw(ctx,U.spec,U.G); else if(U.kind==='shiku')sl=lilongDraw(ctx,U.spec,U.G); else if(U.kind==='colon')sl=colonnadeDraw(ctx,U.spec,U.G); else if(U.kind==='hz')sl=hzDraw(ctx,U.spec,U.G); else sl=drawHall(ctx,U.spec,U.G);
      sl=sl||{}; if(sl.signRect)slots.signRects.push(sl.signRect); if(sl.eaveLine)slots.eaveLines.push(copy(sl.eaveLine,{unit:k})); if(sl.houseEave)slots.eaveLines.push(copy(sl.houseEave,{unit:k})); if(sl.counter)slots.counters.push(sl.counter); if(sl.door)slots.doors.push(sl.door); if(sl.huangzi)slots.huangzi.push(sl.huangzi); if(sl.gate)slots.gates.push(sl.gate);
      // tell 3 (户部巷): the region from the eave line (a two-storey shop: the 平座 over the ground floor) down to the counter top, across the unit — one 积墨 patch for the integrator
      if(sl.shadeUnderEave)slots.shadeUnderEave.push(copy(sl.shadeUnderEave,{unit:k,z:P.z}));
      else if(sl.counter&&U.G.bands&&(U.kind==='shop1'||U.kind==='shop2'||U.kind==='corner')){ var ey=U.G.bands.length>1?U.G.bands[0].y1:U.G.roof.ye, cty=U.G.bands[0].y0-11; if(cty>ey+3){ var SU2=softRect(ctx,U.x0,ey,U.x1,cty,2.5,3); slots.shadeUnderEave.push({poly:SU2.poly,inside:SU2.inside,pred:SU2.pred,x0:U.x0,x1:U.x1,y0:ey,y1:cty,unit:k,z:P.z}); } }
      slots.units.push(U.kind==='hz'?{kind:U.kind,x0:U.x0,x1:U.x1,y:U.y,setback:U.sb,z:P.z,goods:U.spec.goods,mat:U.spec.mat,shedEave:U.G.sroof.ye,houseY:U.G.house.y}:{kind:U.kind,x0:U.x0,x1:U.x1,y:U.y,setback:U.sb,z:P.z}); }
    // the street edge is one line: at every step of the front line a short return along OBL joins the two ground lines, and the recess floor takes a 淡墨 strip
    var T=tools(ctx,P.z,s), ox=ctx.OBL[0]*P.dir, oy=ctx.OBL[1];
    for(k=0;k<P.units.length-1;k++){ var A=P.units[k], B=P.units[k+1], db=B.sb-A.sb; if(!db)continue; var xa=P.dir>0?A.x0:A.x1, near=db>0?A:B, far=db>0?B:A, xn=P.dir>0?near.x0:near.x1, L=Math.abs(db);
      T.str(xn-3*P.dir,near.y,xn-3*P.dir+ox*L,near.y+oy*L,undefined,0.9);
      T.wash(ctx.ST.INDIGO,[[xn-3*P.dir,near.y-0.5],[xn-3*P.dir+ox*L,near.y+oy*L-0.5],[xn-3*P.dir+ox*L-P.dir*6,near.y+oy*L-0.5],[xn-3*P.dir-P.dir*6,near.y-0.5]],ctx.C.danmo,0.1,2.5,2); }
    // 汉正街 side lanes: the gap between two units, its floor receding along OBL; the right unit's foundation shows in it; a waterside row's lane steps down to the water
    for(k=0;k<P.lanes.length;k++){ var Ln=P.lanes[k], TL=tools(ctx,P.z,s), R=ctx.R, rr=ctx.rr, lx0=Ln.x0, lx1=Ln.x1, ly=Ln.y, L=Ln.L, j, U2=P.units[Ln.after+1];
      if(U2)for(j=0;j<U2.G.polys.length;j++)TL.occlude(U2.G.polys[j]);
      var drop=P.waterside?0.5:0.85, floor=[[lx1,ly],[lx0,ly],[lx0+ox*L,ly+oy*L*drop],[lx1+ox*L,ly+oy*L*drop]];
      if(Ln.through){ // round 7 (D-14, tell 3): the through unit's lane is the same ground as its shed floor — level along OBL to the house's depth (the door's threshold height),
        // and from there the water steps are the continuation of the lane's right-edge line: riser, tread, riser, tread, the house's foundation showing as a wedge beside them
        var sd=Ln.sd, xs=lx1+ox*sd, ys=ly+oy*sd, nT=Math.max(3,Math.round((L-sd)/4)), rise=1.5, prof=[[lx1,ly],[xs,ys]], q, dl=(L-sd)/nT;
        TL.wash(ctx.ST.INDIGO,[[lx1,ly],[lx0,ly],[lx0+ox*sd,ys],[xs,ys]],ctx.C.danmo,0.11,2.2,2,function(px,py){ return R()>(ly-py)/Math.abs(oy*sd)*0.5; });   // round 8: the lane floor is the shed floor's ground, a shade firmer
        // round 9 (D-16, tell 3d): the top step lies in the lane's own ground — its nosing is the lane floor's back edge at the house's depth (no drop before it) — and the
        // stair goes INTO the water: the bank line crosses the lane half a tread short of the lane's end and cuts the last riser; nothing of the stair is drawn beyond it
        var wdep=L-dl*0.5, yw=ly+oy*wdep+nT*rise;
        TL.str(lx1+ox*sd+0.3,ys,lx0+ox*sd+0.5,ys+rr(-0.15,0.15),0,1.05);
        for(q=0;q<nT;q++){ var da=sd+q*dl, dbb=sd+(q+1)*dl, ya=ly+oy*da+(q+1)*rise, yb=ly+oy*dbb+(q+1)*rise, last=q===nT-1;
          if(last){ prof.push([lx1+ox*da,Math.min(ya,yw)]); break; }
          prof.push([lx1+ox*da,ya]); prof.push([lx1+ox*dbb,yb]);
          TL.str(lx1+ox*da+0.3,ya,lx0+ox*da+0.5,ya+rr(-0.2,0.2),0,1); if(R()<0.7)TL.txt(lx1+ox*da,ya+1.1,lx0+ox*da+1,ya+1.1,0.9,true);   // the tread's front edge across the lane
          TL.wash(ctx.ST.INDIGO,[[lx1+ox*da,ya],[lx0+ox*da,ya],[lx0+ox*dbb,yb],[lx1+ox*dbb,yb]],ctx.C.danmo,q?0.09:0.11,2.2,2); }
        // round 8 (D-15, tell 3c): ONE primary stroke — the shed's flank foot from its front post, the house's front-wall foot at the lane corner, then riser / tread down to the water
        TL.pri(lx1+0.4,ly+0.2,prof[1][0],prof[1][1],0,1.05); for(q=1;q<prof.length-1;q++)TL.pri(prof[q][0],prof[q][1],prof[q+1][0],prof[q+1][1],0,q<3?1:0.92);
        var wedge=[[xs,ys],[lx1+ox*wdep,ly+oy*wdep],[lx1+ox*wdep,yw]]; TL.wash(ctx.ST.INDIGO,wedge,ctx.C.danmo,0.1,2,2); TL.ochre(wedge,0.16);
        for(j=1;j<=2;j++){ var dd2=sd+(wdep-sd)*(0.3+0.3*j), qa=[lx1+ox*dd2,ly+oy*dd2], qb=[lx1+ox*dd2,ly+oy*dd2+nT*rise*(dd2-sd)/(L-sd)]; TL.txt(qa[0],qa[1]+1,qb[0]-0.3,qb[1]-0.8,0.8,true); }
        // the bank line: one structural rule across the lane at the water's level, the last riser stopping in it; two ripples on the water side of it
        TL.str(lx1+ox*wdep+1.5,yw,lx0+ox*wdep-1.5,yw+rr(-0.15,0.15),0,0.95);
        for(j=0;j<2;j++){ var wd3=wdep+1.4+j*1.8, wy3=ly+oy*wd3+nT*rise; TL.curve(ctx.ST.JIEHUA,[[lx0+ox*wd3-1,wy3+0.3],[lx0+ox*wd3+3,wy3-0.3],[lx1+ox*wd3-2,wy3+0.2]],ctx.C.ink,TL.INK.texture.al*0.9,TL.INK.texture.w); }
        slots.lanes.push({x0:lx0,x1:lx1,y:ly,L:L,after:Ln.after,through:true}); continue; }
      TL.wash(ctx.ST.INDIGO,floor,ctx.C.danmo,0.07,2.2,2,function(px,py){ return R()>(ly-py)/Math.abs(oy*L*drop)*0.6; });
      if(P.waterside){ // the right unit's foundation shows under its flank line as a wedge of courses; treads across the lane, each a little further back and lower; two water ticks at the foot
        var wedge=[[lx1,ly],[lx1+ox*L,ly+oy*L],[lx1+ox*L,ly+oy*L*drop]]; TL.wash(ctx.ST.INDIGO,wedge,ctx.C.danmo,0.1,2,2); TL.ochre(wedge,0.16);
        for(var d=rr(3,5);d<L-2;d+=rr(3.5,5)){ var ya=ly+oy*d*drop, xa=lx0+ox*d, xb=lx1+ox*d; TL.str(xa+0.5,ya,xb-0.3,ya+rr(-0.2,0.2),undefined,1); if(R()<0.6)TL.txt(xa+1,ya+1.2,xb-1,ya+1.2,0.9,true); }
        for(j=0;j<3;j++){ var dd=L*0.3+j*L*0.25, qa=[lx1+ox*dd,ly+oy*dd], qb=[lx1+ox*dd,ly+oy*dd*drop]; TL.txt(qa[0],qa[1]+1,qb[0]-0.3,qb[1]-1,0.8,true); }
        var we=L+3, wy=ly+oy*we*drop; for(j=0;j<2;j++)TL.curve(ctx.ST.JIEHUA,[[lx0+ox*we-1,wy+j*1.6],[lx0+ox*we+3,wy+j*1.6-0.5],[lx1+ox*we-2,wy+j*1.6+0.2]],ctx.C.ink,TL.INK.texture.al*0.9,TL.INK.texture.w); }
      else for(var d2=rr(4,6);d2<L-2;d2+=rr(6,9))TL.txt(lx0+ox*d2+1,ly+oy*d2*drop,lx1+ox*d2-1,ly+oy*d2*drop,0.7,true);
      slots.lanes.push({x0:lx0,x1:lx1,y:ly,L:L,after:Ln.after}); }
    slots.ground={x0:P.x0,x1:P.x1,y:P.y}; return slots; }
  KINDS.streetRow={geom:rowPlan,draw:streetRowDraw};

  // 租界 street building: pilasters, floor bands, arched windows, cornice with dentils, balustrade parapet, flat roof
  // D-12 (d): no two tall buildings alike — storey height ×0.85–1.15, one of three window rhythms, one of three endings (cornice / 歇山 / flat with a 女儿墙), all from noise at the building's place unless the spec fixes them
  function colonnadeGeom(ctx,s){ var n1=ctx.noise(s.x*0.0171+13,s.y*0.0133+7), n2=ctx.noise(s.x*0.0233+41,s.y*0.019+3), n3=ctx.noise(s.x*0.0197+29,s.y*0.0151+17);
    var storeyK=s.storeyK||(0.85+0.3*clamp((n1-0.3)/0.4,0,1)), h=Math.round(s.h*storeyK), ending=s.ending||(n2<0.36?'cornice':n2<0.66?'xieshan':'parapet'), pattern=s.pattern||(n3<0.4?'arch':n3<0.7?'pair':'sill');
    var G=boxGeom(ctx,{x:s.x,y:s.y,w:s.w,h:h,d:s.d,dir:s.dir,tb:s.tb===undefined?4:s.tb,z:s.z}); G.storeys=s.storeys||3; G.bays=s.bays||Math.max(2,Math.round(s.w/24)); G.ending=ending; G.pattern=pattern;
    if(ending==='xieshan'){ G.roof=roofGeom(G,{roof:'xieshan',rise:Math.round(clamp(s.w*0.2,8,22)),qiao:3,ov:Math.max(3,Math.round(s.w*0.05))},ctx); G.polys=[G.base,G.baseSide,G.front,G.side,G.roof.front,G.roof.side,G.roof.gable,G.roof.eaveZone,G.roof.eaveZoneS]; }
    else { G.parapet=rect(G.x0-3,G.ye-(ending==='parapet'?8:4),G.x1+3,G.ye+2); G.polys=[G.base,G.baseSide,G.front,G.side,G.parapet]; }
    return G; }
  // flat roof with a 女儿墙: coping, a blank wall, short piers, one raised centre block — no dentils, no cornice
  function parapetWall(T,x0,x1,ye,sx,ox,oy,p){ var rr=T.ctx.rr, ST=T.ctx.ST, C=T.ctx.C, xm=(x0+x1)/2, i;
    T.rule(rr(195,215),0.9,x0-3,ye+2,x1+3,ye+2); T.rule(rr(185,205),0.85,x0-3,ye-8,x1+3,ye-8); T.rule(rr(140,160),0.6,x0-3,ye-6.6,x1+3,ye-6.6);
    for(var px=x0-2+rr(2,6);px<x1+1;px+=rr(9,14))T.txt(px,ye-6.2,px,ye+1.6,rr(0.9,1.2),true);
    T.rule(rr(170,190),0.75,xm-6,ye-11,xm+6,ye-11); T.rule(rr(150,170),0.7,xm-6,ye-11,xm-6,ye-8); T.rule(rr(150,170),0.7,xm+6,ye-11,xm+6,ye-8);
    T.rule(rr(180,200),0.8,sx-p,ye+2,sx-p+ox,ye+2+oy); T.rule(rr(160,180),0.75,sx-p,ye-8,sx-p+ox,ye-8+oy); T.rule(150,0.65,sx-p+ox,ye-8+oy,sx-p+ox,ye+2+oy);
    T.wash(ST.INDIGO,[[sx-p,ye-7.5],[sx-p+ox,ye-7.5+oy],[sx-p+ox,ye+1.5+oy],[sx-p,ye+1.5]],C.danmo,0.18,2,2);
    T.fin([[x0-3,ye-8],[xm,ye-8.2],[x1+3,ye-8]],100,0.62); }
  function cornice(T,x0,x1,ye,sx,ox,oy,p){ var rr=T.ctx.rr, R=T.ctx.R, ST=T.ctx.ST, C=T.ctx.C;
    T.rule(rr(198,218),0.92,x0-3,ye+2,x1+3,ye+2); T.rule(rr(150,175),0.65,x0-2,ye+4.6,x1+2,ye+4.6);
    for(var dx=x0-1+rr(0,2);dx<x1+1;dx+=rr(2.6,3.4))if(R()>0.1)T.txt(dx,ye+2.4,dx,ye+4.3,rr(1.1,1.5),true);
    T.rule(rr(165,185),0.75,x0-3,ye-4,x1+3,ye-4); for(var px=x0-2+rr(0,3);px<x1+2;px+=rr(4,5.5))T.txt(px,ye-3.7,px,ye+1.8,rr(1,1.4),true);
    T.rule(rr(180,200),0.8,sx-p,ye+2,sx-p+ox,ye+2+oy); T.rule(rr(150,170),0.7,sx-p,ye-4,sx-p+ox,ye-4+oy); T.rule(150,0.65,sx-p+ox,ye-4+oy,sx-p+ox,ye+2+oy);
    T.fin([[x0-3,ye+2],[(x0+x1)/2,ye+1.8],[x1+3,ye+2]],100,0.62); }
  function colonnadeDraw(ctx,s,G){ var T=tools(ctx,G.z,s), ST=ctx.ST, C=ctx.C, rr=ctx.rr, x0=G.x0, x1=G.x1, y=G.y, ox=G.ox, oy=G.oy, sx=G.sx, dir=G.dir, p=3*dir, n=G.storeys, bays=G.bays, bw=(G.w-2.5)/bays, i,k, slots={};
    if(G.occ)for(i=0;i<G.occ.length;i++)T.occlude(G.occ[i]);
    T.draft(x0-3,y+0.5,x1+3,y+0.5); T.draft(sx-p,y+0.5,sx-p+ox,y+oy+0.5);
    if(G.tb>0){ T.rule(185,0.8,x0-3,y,x1+3,y); T.rule(165,0.7,x0-3,G.yb,x1+3,G.yb); T.rule(180,0.8,sx-p,y,sx-p+ox,y+oy); T.rule(160,0.7,sx-p,G.yb,sx-p+ox,G.yb+oy); T.rule(150,0.7,sx-p+ox,G.yb+oy,sx-p+ox,y+oy); T.ochre(G.base,0.18); }
    var H=G.yb-(G.ye+2), fh=H/n, cols=[]; for(i=0;i<=bays;i++)cols.push(x0+1.25+i*bw);
    for(i=0;i<=bays;i++){ T.rule(rr(170,200),0.8,cols[i]-1.25,G.ye+2,cols[i]-1.25,G.yb); T.rule(rr(130,160),0.6,cols[i]+1.25,G.ye+2,cols[i]+1.25,G.yb); T.wash(ST.OCHRE,rect(cols[i]-1.5,G.ye+2.5,cols[i]+1.5,G.yb-0.5),C.ochre,0.24,2,1.5); }
    T.rule(rr(160,180),0.7,sx+ox,G.ye+2+oy,sx+ox,G.yb+oy);
    for(k=0;k<n;k++){ var base=G.yb-k*fh, top=base-fh, ground=k===0;
      if(k>0){ T.rule(rr(165,185),0.75,x0-1,base,x1+1,base); T.rule(rr(120,150),0.55,x0-1,base+2.2,x1+1,base+2.2); T.rule(rr(150,170),0.7,sx,base,sx+ox,base+oy); }
      for(i=0;i<bays;i++){ var wx0=cols[i]+2.6, wx1=cols[i+1]-2.6, m=(wx1-wx0)*(ground?0.12:0.2), wt=top+fh*(ground?0.14:0.22), wb=base-fh*(ground?0.03:0.22);
        if(ground||G.pattern==='arch')archWindow(T,wx0+m,wt,wx1-m,wb);
        else if(G.pattern==='pair'){ var mm=(wx1-wx0)*0.5; window(T,wx0+m*0.6,wt+1,wx0+mm-1,wb); window(T,wx0+mm+1,wt+1,wx1-m*0.6,wb); T.str(wx0+mm,wt+0.5,wx0+mm,wb,undefined,0.8); }
        else { window(T,wx0+m,wt+1.5,wx1-m,wb-1); T.str(wx0+m-1.5,wb+0.2,wx1-m+1.5,wb+0.2,undefined,1.05); T.str(wx0+m-1,wt,wx1-m+1,wt,undefined,0.9); T.wash(ST.INDIGO,rect(wx0+m+0.5,wt+2,wx1-m-0.5,wt+2+(wb-wt)*0.3),C.danmo,0.14,2,2); } }
      if(ground){ var cb=Math.floor(bays/2); slots.door={x:(cols[cb]+cols[cb+1])/2,y:base,w:cols[cb+1]-cols[cb]-5}; } }
    if(G.ending==='xieshan'){ eavePlane(T,G.roof.eaveF,1); if(G.roof.eaveS)eavePlane(T,G.roof.eaveS,0.9); drawRoof(T,G.roof,'indigo',false); }
    else { if(G.ending==='parapet')parapetWall(T,x0,x1,G.ye,sx,ox,oy,p); else cornice(T,x0,x1,G.ye,sx,ox,oy,p); eavePlane(T,[[x0-3,G.ye+2],[x1+3,G.ye+2]],1); eavePlane(T,[[sx-p,G.ye+2],[sx-p+ox,G.ye+2+oy]],0.9); }
    T.ochre(G.side,0.14,C.ochre2); flankPlane(T,G.side,dir,0);
    slots.eaveLine={y:G.ye,x0:x0,x1:x1}; slots.ground={x0:x0,x1:x1,y:y}; slots.ending=G.ending; return slots; }
  KINDS.colonnade={geom:colonnadeGeom,draw:colonnadeDraw};

  // 江汉关: three-step 台基, rusticated base storey, an 8-column giant order with two rows of arched windows, cornice, then the clock tower (3 tiers, clock at 8:00, cupola)
  function jhgGeom(ctx,s){ var w=s.w||230, h=s.h||105, G=boxGeom(ctx,{x:s.x,y:s.y,w:w,h:h,d:s.d||64,dir:s.dir,tb:8,z:s.z}), tw=s.tw||56, cxm=s.x-w*0.5, dir=G.dir, th=[62,52,44], tiers=[], yy=G.ye-4, k;
    for(k=0;k<3;k++){ var ww=tw-8*k, x0=cxm-ww/2, x1=cxm+ww/2, sxk=dir>0?x0:x1, dep=ww*0.35, tox=ctx.OBL[0]*dep*dir, toy=ctx.OBL[1]*dep;
      tiers.push({x0:x0,x1:x1,y1:yy,y0:yy-th[k],sx:sxk,ox:tox,oy:toy,poly:rect(x0,yy-th[k],x1,yy),side:[[sxk,yy],[sxk+tox,yy+toy],[sxk+tox,yy-th[k]+toy],[sxk,yy-th[k]]]}); yy-=th[k]; }
    var cr=(tw-16)/2-4, cup={cx:cxm,y:yy,r:cr,poly:[[cxm-cr-1,yy],[cxm+cr+1,yy],[cxm+cr+1,yy-9],[cxm+cr*0.7,yy-20],[cxm,yy-32],[cxm-cr*0.7,yy-20],[cxm-cr-1,yy-9]]};
    G.tiers=tiers; G.cup=cup; G.cxm=cxm; G.parapet=rect(G.x0-3,G.ye-4,G.x1+3,G.ye+2);
    G.polys=[G.base,G.baseSide,G.front,G.side,G.parapet,cup.poly,rect((dir>0?G.x1+9:G.x0-9)-6.5,G.y+3-42,(dir>0?G.x1+9:G.x0-9)+6.5,G.y+3)]; for(k=0;k<3;k++){ G.polys.push(tiers[k].poly); G.polys.push(tiers[k].side); }
    return G; }
  function jhgDraw(ctx,s,G){ var T=tools(ctx,G.z,s), ST=ctx.ST, C=ctx.C, rr=ctx.rr, x0=G.x0, x1=G.x1, y=G.y, ox=G.ox, oy=G.oy, sx=G.sx, dir=G.dir, p=3*dir, i,k, slots={};
    for(k=0;k<3;k++){ T.occlude(G.tiers[k].poly); T.occlude(G.tiers[k].side); } T.occlude(G.cup.poly);
    T.draft(x0-6,y+0.5,x1+6,y+0.5); T.draft(sx-6*dir,y+0.5,sx-6*dir+ox,y+oy+0.5); T.draft(x0,G.ye,x1,G.ye);
    for(k=0;k<3;k++){ var sy=y-k*2.7, ins=k*1.6; T.rule(rr(175,195),0.8,x0-6+ins,sy,x1+6-ins,sy); T.rule(rr(160,180),0.75,sx-(6-ins)*dir,sy,sx-(6-ins)*dir+ox,sy+oy); }
    T.rule(165,0.7,x0-3,G.yb,x1+3,G.yb); T.rule(150,0.7,sx-p+ox,G.yb+oy,sx-p+ox,y+oy); T.ochre(rect(x0-6,y-8,x1+6,y),0.16);
    var yb=G.yb, yBase=yb-(yb-G.ye)*0.3, bays=7, bw=(G.w-4)/bays;
    T.rule(rr(180,200),0.8,x0,yBase,x1,yBase); T.rule(rr(140,160),0.6,x0,yBase+2.5,x1,yBase+2.5); T.rule(170,0.75,x0,yBase,x0,yb); T.rule(170,0.75,x1,yBase,x1,yb);
    for(var cy=yBase+7;cy<yb-2;cy+=rr(4.5,5.5))T.tex(x0+0.5,cy,x1-0.5,cy+rr(-0.3,0.3),rr(70,100),0.45);
    for(i=0;i<bays;i++){ var bx0=x0+2+i*bw, bx1=bx0+bw, wm=bw*0.3; if(i===3){ archWindow(T,bx0+wm*0.6,yBase+5,bx1-wm*0.6,yb,1,false); slots.door={x:(bx0+bx1)/2,y:yb,w:bw-wm*1.2}; } else if(i!==0&&i!==bays-1){ T.setPale(T.pale*0.8); window(T,bx0+wm,yBase+7,bx1-wm,yb-6); T.setPale(T.pale/0.8); } }
    var cols=[], cw=(G.w-3)/7; for(i=0;i<8;i++)cols.push(x0+1.5+i*cw);
    for(i=0;i<8;i++){ var cx=cols[i]; T.rule(rr(175,205),0.8,cx-1.5,G.ye+7,cx-1.5,yBase); T.rule(rr(130,160),0.6,cx+1.5,G.ye+7,cx+1.5,yBase); T.rule(160,0.7,cx-3.2,G.ye+6.5,cx+3.2,G.ye+6.5); T.rule(140,0.6,cx-2.4,G.ye+8.5,cx+2.4,G.ye+8.5); T.rule(150,0.7,cx-2.8,yBase-0.4,cx+2.8,yBase-0.4);
      T.wash(ST.OCHRE,rect(cx-1.8,G.ye+9,cx+1.8,yBase-1),C.ochre,0.22,2,1.5); }
    var zh=(yBase-(G.ye+9))/2; for(k=0;k<2;k++){ var wt=G.ye+9+k*zh+zh*0.18, wb=G.ye+9+k*zh+zh*0.92; for(i=0;i<7;i++){ if(k===0&&(i===0||i===6))continue; var ax0=cols[i]+4, ax1=cols[i+1]-4, am=(ax1-ax0)*0.22; archWindow(T,ax0+am,wt,ax1-am,wb,k===0?0.72:0.82,false); } }
    cornice(T,x0,x1,G.ye,sx,ox,oy,p);
    T.rule(rr(160,180),0.7,sx,yBase,sx+ox,yBase+oy); T.rule(rr(160,180),0.7,sx+ox,G.ye+7+oy,sx+ox,yb+oy); T.rule(rr(150,170),0.7,sx,G.ye+7,sx+ox,G.ye+7+oy); T.wash(ST.INDIGO,G.side,C.danmo,0.1,2.8,2.5); T.ochre(G.side,0.14,C.ochre2);
    T.clearOcc();
    for(k=0;k<3;k++){ var t=G.tiers[k], tx0=t.x0, tx1=t.x1, ty0=t.y0, ty1=t.y1, tsx=t.sx, tox=t.ox, toy=t.oy, tm=(tx0+tx1)/2;
      T.pri(tx0,ty0,tx0,ty1,undefined,1.05); T.pri(tx1,ty0,tx1,ty1,undefined,1.05); T.str(tsx+tox,ty0+toy,tsx+tox,ty1+toy,undefined,1.05); T.rule(rr(150,170),0.65,tsx,ty1,tsx+tox,ty1+toy);
      T.pri(tx0-3,ty0,tx1+3,ty0,undefined,1.1); T.rule(rr(150,170),0.65,tx0-2,ty0+2.6,tx1+2,ty0+2.6); T.rule(rr(170,190),0.75,tsx-3*dir,ty0,tsx-3*dir+tox,ty0+toy); T.rule(rr(130,150),0.6,tsx-2*dir,ty0+2.6,tsx-2*dir+tox,ty0+2.6+toy); T.rule(rr(140,160),0.6,tsx-3*dir+tox,ty0+toy,tsx-3*dir+tox,ty0+2.6+toy);
      for(var ddx=tx0-1+rr(0,2);ddx<tx1+1;ddx+=rr(2.6,3.4))T.tex(ddx,ty0+0.4,ddx,ty0+2.3,rr(100,150),0.5);
      if(k<2){ var ww=(tx1-tx0)*0.26; archWindow(T,tm-ww/2,ty0+8,tm+ww/2,ty1-6,0.9,false); T.rule(rr(150,170),0.7,tx0+2,ty1-6,tx1-2,ty1-6); T.rule(rr(130,150),0.6,tsx,ty1-6,tsx+tox,ty1-6+toy); }
      else { var cr=10, cyc=(ty0+ty1)/2+2, circ=[]; for(i=0;i<=28;i++){ var a=i/28*Math.PI*2; circ.push([tm+Math.cos(a)*cr,cyc+Math.sin(a)*cr]); } T.curve(ST.JIEHUA,circ,C.ink,190,0.8);
        for(i=0;i<12;i++){ var a2=i/12*Math.PI*2, r0=i%3===0?cr-2.4:cr-1.4; T.tex(tm+Math.cos(a2)*r0,cyc+Math.sin(a2)*r0,tm+Math.cos(a2)*(cr-0.4),cyc+Math.sin(a2)*(cr-0.4),rr(140,190),0.55); }
        var ah=-Math.PI/2+Math.PI*2*8/12; T.rule(225,1.25,tm,cyc,tm+Math.cos(ah)*6,cyc+Math.sin(ah)*6,0); T.rule(225,1,tm,cyc,tm,cyc-8,0); T.dots(ST.JIEHUA,[[tm,cyc,1.8]],C.ink,220);   // D-18: hands at 8:00, readable at 1×
        T.wash(ST.INDIGO,circ,C.danmo,0.04,3,2.5); slots.clock={x:tm,y:cyc,r:cr}; }
      // the tower's mass: shadow under each cornice and a 淡墨 flank, so the tiers read as a solid shaft rather than window bands
      T.wash(ST.INDIGO,rect(tx0+0.5,ty0+2.8,tx1-0.5,ty0+7),C.danmo,0.16,2.5,2.5); T.wash(ST.INDIGO,t.side,C.danmo,0.13,2.5,2.5); T.ochre(t.side,0.1,C.ochre2); }
    var cup=G.cup, cxm=cup.cx, cyy=cup.y, cr2=cup.r; T.rule(rr(185,205),0.85,cxm-cr2-1,cyy,cxm+cr2+1,cyy); T.rule(rr(170,190),0.75,cxm-cr2,cyy,cxm-cr2,cyy-9); T.rule(rr(170,190),0.75,cxm+cr2,cyy,cxm+cr2,cyy-9);
    for(i=1;i<4;i++)T.tex(cxm-cr2+i*cr2*0.5,cyy-0.5,cxm-cr2+i*cr2*0.5,cyy-8.5,rr(110,150),0.5);
    var dome=[]; for(i=0;i<=12;i++){ var a3=Math.PI+Math.PI*i/12; dome.push([cxm+Math.cos(a3)*(cr2+1),cyy-9+Math.sin(a3)*14]); } T.curve(ST.JIEHUA,dome,C.ink,190,0.8);
    T.rule(180,0.75,cxm,cyy-23,cxm,cyy-31,0); T.dots(ST.JIEHUA,[[cxm,cyy-31.5,2]],C.ink,190); T.wash(ST.INDIGO,dome.concat([[cxm+cr2+1,cyy-9]]),C.huaqing,0.22,3,2.5);
    T.fin([[G.tiers[2].x0-3,G.tiers[2].y0],[G.cxm,G.tiers[2].y0-0.2],[G.tiers[2].x1+3,G.tiers[2].y0]],105,0.62);
    // D-18: the 「江漢關」 board framed on the first tower tier (14-px characters), and the 「武漢關」 wharf sign — a post with a vertical board at the building's front-right corner
    var bx0=G.cxm-30, by0=G.tiers[0].y1-30; T.rule(185,0.8,bx0,by0,bx0+60,by0); T.rule(185,0.8,bx0,by0+20,bx0+60,by0+20); T.rule(175,0.75,bx0,by0,bx0,by0+20); T.rule(175,0.75,bx0+60,by0,bx0+60,by0+20);
    slots.signRect={x:bx0,y:by0,w:60,h:20,cx:G.cxm,cy:by0+10,vertical:false,text:s.sign};
    var wpx=dir>0?x1+9:x0-9, wpy=y+3; T.rule(190,0.9,wpx,wpy,wpx,wpy-42,0); T.rule(170,0.75,wpx-6,wpy-41,wpx+6,wpy-41); T.rule(170,0.75,wpx-6,wpy-7,wpx+6,wpy-7); T.rule(165,0.7,wpx-6,wpy-41,wpx-6,wpy-7); T.rule(165,0.7,wpx+6,wpy-41,wpx+6,wpy-7); T.ochre(rect(wpx-5.5,wpy-40.5,wpx+5.5,wpy-7.5),0.12);
    slots.wharfSign={x:wpx-6,y:wpy-41,w:12,h:34,cx:wpx,cy:wpy-24,vertical:true,text:'武漢關'};
    slots.eaveLine={y:G.ye,x0:x0,x1:x1}; slots.ground={x0:x0,x1:x1,y:y}; slots.top={x:cxm,y:cyy-32};
    return slots; }
  KINDS.jianghanguan={geom:jhgGeom,draw:jhgDraw};

  // 龟山电视塔: pale tapered ink lines, six ring ledges, the observation disc with its window band, antenna — no colour
  function tvGeom(ctx,s){ var h=s.h||440, x=s.x, y=s.y, yd=y-h*0.7, yu=y-h*0.86, disc=[], i;
    for(i=0;i<24;i++){ var a=i/24*Math.PI*2; disc.push([x+Math.cos(a)*45,yd+Math.sin(a)*11]); }
    return {x:x,y:y,h:h,yd:yd,yu:yu,z:zOf(s),polys:[[[x-8,y],[x+8,y],[x+3.5,yd+11],[x-3.5,yd+11]],disc,[[x-3.2,yd-11],[x+3.2,yd-11],[x+1.6,yu],[x-1.6,yu]],[[x-1.2,yu],[x+1.2,yu],[x+0.6,y-h],[x-0.6,y-h]]]}; }
  function tvDraw(ctx,s,G){ var T=tools(ctx,G.z,s), ST=ctx.ST, C=ctx.C, rr=ctx.rr, x=G.x, y=G.y, yd=G.yd, yu=G.yu, top=y-G.h, i, k;
    T.draft(x,y,x,yd+11);
    function taper(xa,ya,xb,yb,a0,a1,w){ for(var j=0;j<3;j++){ var t0=j/3, t1=(j+1)/3, al=a0+(a1-a0)*(j+0.5)/3; ctx.rline(ST.JIEHUA,Math.max(xa,xb),C.ink,al,w,xa+(xb-xa)*t0,ya+(yb-ya)*t0,xa+(xb-xa)*t1,ya+(yb-ya)*t1,G.z,0.6); } }
    taper(x-8,y,x-3.5,yd+11,95,60,0.7); taper(x+8,y,x+3.5,yd+11,95,60,0.7); taper(x-3,y,x-1.2,yd+11,60,40,0.5); taper(x+3,y,x+1.2,yd+11,60,40,0.5);
    taper(x-3.2,yd-11,x-1.6,yu,60,45,0.6); taper(x+3.2,yd-11,x+1.6,yu,60,45,0.6);
    ctx.rline(ST.JIEHUA,x,C.ink,60,0.55,x,yu,x,top,G.z,0);
    var hs=[0.12,0.24,0.36,0.47,0.56,0.64]; for(i=0;i<6;i++){ var yy=y-(y-yd-11)*hs[i], hw=11-4.5*hs[i], ring=[]; for(k=0;k<=6;k++)ring.push([x-hw+2*hw*k/6,yy+Math.sin(Math.PI*k/6)*1.6]); T.curve(ST.JIEHUA,ring,C.ink,rr(60,80),0.5); }
    var topArc=[], botArc=[]; for(i=0;i<=16;i++){ var a2=Math.PI+Math.PI*i/16; topArc.push([x+Math.cos(a2)*45,yd+Math.sin(a2)*11]); botArc.push([x+Math.cos(a2)*45,yd-Math.sin(a2)*11]); }
    T.curve(ST.JIEHUA,topArc,C.ink,85,0.65); T.curve(ST.JIEHUA,botArc,C.ink,95,0.7);
    T.tex(x-44,yd-2.5,x+44,yd-2.5,70,0.5); T.tex(x-44,yd+2.5,x+44,yd+2.5,70,0.5); for(var wx=x-42+rr(0,2);wx<x+42;wx+=rr(3,4))T.tex(wx,yd-2.2,wx,yd+2.2,rr(40,65),0.4);
    var ring2=[]; for(i=0;i<=6;i++)ring2.push([x-3+i,yu+8+Math.sin(Math.PI*i/6)*1.2]); T.curve(ST.JIEHUA,ring2,C.ink,55,0.45);
    return {disc:{x:x,y:yd,rx:45,ry:11},top:{x:x,y:top}}; }
  KINDS.tvtower={geom:tvGeom,draw:tvDraw};

  /* ---------------------------------------------------------------- 长江大桥
     spec {x,y (right end of the truss, deck level), spans 9, span 80, rise (deck climb over the whole length), trussH0 28 → trussH1 22,
           dir, z, water (y of the water at the piers — a number or a function of x, for a deck that climbs the page), first/total (which spans of the whole bridge this piece is — fade and pier sizes follow),
           fadeFrom 5, approach {right,left} arch counts, pavilion {right,left}} */
  // D-21 (B10 ④): the 桥头堡 as Wuhan's — a broad block whose base width is ≈ 0.55 of its height above the deck; the ground tier one solid wall mass continuous with the
  // abutment below the deck (the same rusticated masonry, a flight of 石阶 in profile up its outer side), the three upper tiers stepping back 2.5–3 px a side, a small 攒尖 cap.
  // Shared by bridgeGeom (footprint) and towerAt (drawing), so the stamped outline is the drawn one.
  var BH={th:[40,26,22,16],hw:[35,32,29.5,27],ab:32,cap:10,run:38};
  function bhGeom(cx,base,outer){ var tiers=[], y0=base, k, L=[], Rr=[];
    for(k=0;k<4;k++){ var tw=k===3?3:2.2, ye=y0-BH.th[k], ry=k<3?ye-3.6:ye-BH.cap, xe=BH.hw[k]+tw+0.5; tiers.push({k:k,hw:BH.hw[k],tw:tw,y0:y0,ye:ye,ry:ry});
      L.push([cx-xe,y0+0.5]); L.push([cx-xe,k<3?ry:ye-1.2]); Rr.push([cx+xe,y0+0.5]); Rr.push([cx+xe,k<3?ry:ye-1.2]); y0=ry; }
    var poly=[[cx-BH.hw[0]-1,base+BH.ab],[cx+BH.hw[0]+1,base+BH.ab]].concat(Rr).concat([[cx,tiers[3].ye-BH.cap-4.5]]).concat(L.slice().reverse());
    var sx0=cx+outer*(BH.hw[0]+1), stair=[[sx0,base+0.5],[sx0+outer*BH.run,base+BH.ab],[sx0,base+BH.ab]];
    return {cx:cx,base:base,outer:outer,tiers:tiers,poly:poly,stair:stair,ab:BH.ab}; }
  function bridgeGeom(ctx,s){ var spans=s.spans||9, span=s.span||80, rise=s.rise||0, dir=s.dir===undefined?1:s.dir, x=s.x, y=s.y, L=spans*span, first=s.first||0, total=s.total||(first+spans);
    var H0=s.trussH0||28, H1=s.trussH1||22, ox=ctx.OBL[0]*14*dir, oy=ctx.OBL[1]*14, water=s.water===undefined?y+70:s.water, wat=typeof water==='function'?water:function(){ return water; }, xEnd=x-dir*L, i;
    function u(px){ return (x-px)*dir/L; }
    function yD(px){ return y-rise*u(px); }
    function Hh(px){ return H0+(H1-H0)*(first+u(px)*spans)/total; }
    function yB(px){ return yD(px)+Hh(px); }
    var pav=s.pavilion||{}, ap=s.approach||{}, atR=first===0, atL=first+spans>=total;
    var apR=ap.right===undefined?(atR?3:0):ap.right, apL=ap.left===undefined?(atL?3:0):ap.left, pavR=pav.right===undefined?atR:pav.right, pavL=pav.left===undefined?atL:pav.left;
    var polys=[[[x,yD(x)-5],[xEnd,yD(xEnd)-5],[xEnd,yB(xEnd)],[x,yB(x)]],[[x+ox,yD(x)+oy-5],[xEnd+ox,yD(xEnd)+oy-5],[xEnd,yD(xEnd)],[x,yD(x)]]];
    var piers=[]; for(i=(apR?0:1);i<=(apL?spans:spans-1);i++){ var px=x-dir*i*span, si=first+i, pw=14-4*si/total, top=yB(px), sxp=dir>0?px-pw/2:px+pw/2, pox=ctx.OBL[0]*16*dir, poy=ctx.OBL[1]*16;
      var wy=wat(px), P={x:px,w:pw,top:top,bot:wy,si:si,poly:rect(px-pw/2,top,px+pw/2,wy),side:[[sxp,top],[sxp+pox,top+poy],[sxp+pox,wy+poy],[sxp,wy]]}; piers.push(P); polys.push(P.poly); polys.push(P.side); }
    var appr=[]; if(apR){ appr.push({x0:x,x1:x+dir*apR*30,y:y,n:apR,dir:dir}); polys.push(rect(Math.min(x,x+dir*apR*30),y-5,Math.max(x,x+dir*apR*30),y+34)); }
    if(apL){ var yl=yD(xEnd); appr.push({x0:xEnd,x1:xEnd-dir*apL*30,y:yl,n:apL,dir:-dir}); polys.push(rect(Math.min(xEnd,xEnd-dir*apL*30),yl-5,Math.max(xEnd,xEnd-dir*apL*30),yl+34)); }
    var pavs=[]; if(pavR)pavs.push({x:x,y:yD(x)}); if(pavL)pavs.push({x:xEnd,y:yD(xEnd)});
    // D-21 (B10 ④): the 桥头堡 — twin broad blocks (bhGeom), the far twin 14 px of depth behind the near one; the near one's abutment carries a flight of 石阶 on its outer side
    for(i=0;i<pavs.length;i++){ var pp=pavs[i], outer=pp.x===x?dir:-dir, bh=bhGeom(pp.x,pp.y+2,outer); pp.outer=outer; pp.poly=bh.poly; pp.stair=bh.stair; pp.far=shifted(pp.poly,ox,oy); polys.push(pp.poly); polys.push(pp.far); polys.push(pp.stair); }
    // the near 栏杆 (D-08): its own thin strip from the rail top down to just above the deck edge, stamped by main.js at railZ (in front of the deck figures, so it hides their legs);
    // the deck-edge line itself stays below the strip and is drawn with the bridge
    var railZ=s.railZ===undefined?zOf(s)+80:s.railZ, rail=[[[x,yD(x)-4.8],[xEnd,yD(xEnd)-4.8],[xEnd,yD(xEnd)-0.4],[x,yD(x)-0.4]]];
    for(i=0;i<appr.length;i++)rail.push(rect(Math.min(appr[i].x0,appr[i].x1),appr[i].y-4.8,Math.max(appr[i].x0,appr[i].x1),appr[i].y-0.4));
    return {x:x,y:y,spans:spans,span:span,dir:dir,L:L,first:first,total:total,xEnd:xEnd,ox:ox,oy:oy,yD:yD,yB:yB,piers:piers,appr:appr,pavs:pavs,water:water,fadeFrom:s.fadeFrom===undefined?5:s.fadeFrom,z:zOf(s),polys:polys,rail:rail,railZ:railZ}; }
  function bridgeDraw(ctx,s,G){ var T=tools(ctx,G.z,s), TR=tools(ctx,G.railZ,s), ST=ctx.ST, C=ctx.C, rr=ctx.rr, R=ctx.R, dir=G.dir, yD=G.yD, yB=G.yB, ox=G.ox, oy=G.oy, i,k,t, slots={}, railLine=[];
    for(i=0;i<G.pavs.length;i++){ T.occlude(G.pavs[i].poly); T.occlude(G.pavs[i].stair); TR.occlude(G.pavs[i].poly); TR.occlude(G.pavs[i].stair); }   // the near block (and its stair) hides the truss and the rail; the far twin stands behind them
    function fade(si){ return si>=G.fadeFrom?1-0.6*(si-G.fadeFrom+1)/(G.total-G.fadeFrom):1; }
    // D-21 (B10 ④): the train rides INSIDE the bridge — every truss member that crosses its length leaves a 1.6-px strip that cuts the train's lines and wash (the member in front)
    var TRN=s.train, strips=[], trx0=-1e9, trx1=1e9, carL=38, carGap=2.2;
    if(TRN){ var tn=TRN.n||7, tL=tn*carL+(tn-1)*carGap; trx0=Math.min(TRN.x,TRN.x+dir*tL)-2; trx1=Math.max(TRN.x,TRN.x+dir*tL)+2; }
    function member(al,w,x1,y1,x2,y2){ if(Math.max(x1,x2)>trx0&&Math.min(x1,x2)<trx1){ var ddx=x2-x1, ddy=y2-y1, Lm=Math.sqrt(ddx*ddx+ddy*ddy)||1, nx=-ddy/Lm*0.8, ny=ddx/Lm*0.8; strips.push([[x1+nx,y1+ny],[x2+nx,y2+ny],[x2-nx,y2-ny],[x1-nx,y1-ny]]); }
      if(R()<0.18){ var tt=rr(0.3,0.62), g=rr(2.5,4)/dist([x1,y1],[x2,y2]), ta=tt-g/2, tb=tt+g/2; T.rule(al,w,x1,y1,x1+(x2-x1)*ta,y1+(y2-y1)*ta); T.rule(al,w,x1+(x2-x1)*tb,y1+(y2-y1)*tb,x2,y2); } else T.rule(al,w,x1,y1,x2,y2); }
    for(i=0;i<G.spans;i++){ var xa=G.x-dir*i*G.span, xb=xa-dir*G.span, f=fade(G.first+i);
      T.draft(xa,yD(xa)+2,xb,yD(xb)+2); T.draft(xa+ox,yD(xa)+oy,xb+ox,yD(xb)+oy);
      // the deck's top edge is the receiving plane: one primary line; the truss hangs entirely below it
      T.pri(xa,yD(xa),xb,yD(xb),undefined,1.05*f); T.pri(xa,yB(xa),xb,yB(xb),undefined,0.95*f);
      // far side: the far kerb and the far rail, structural and paler — nothing of the far truss above the deck
      T.str(xa+ox,yD(xa)+oy,xb+ox,yD(xb)+oy,undefined,0.75*f); T.str(xa+ox,yD(xa)+oy-4,xb+ox,yD(xb)+oy-4,undefined,0.85*f);
      var n=Math.round(G.span/13), pk=[]; for(k=0;k<=n;k++)pk.push(xa-dir*k*G.span/n);
      for(k=0;k<=n;k++){ var xk=pk[k]; member(165*f,0.7,xk,yD(xk)+0.4,xk,yB(xk)); }
      for(k=0;k<n;k++){ var x1=pk[k], x2=pk[k+1]; if(k%2===0)member(135*f,0.5,x1,yD(x1)+0.4,x2,yB(x2)); else member(135*f,0.5,x1,yB(x1),x2,yD(x2)+0.4); }
      // near 栏杆 at railZ: top rail (primary, a shade lighter than the deck edge) and posts every ~8 px down to the deck edge
      TR.pri(xa,yD(xa)-4.2,xb,yD(xb)-4.2,undefined,0.9*f);
      for(t=rr(1,4);t<G.span;t+=rr(7.5,8.5)){ var px=xa-dir*t; TR.str(px,yD(px)-4.2,px,yD(px)-0.5,0.2,1.05*f); railLine.push({x:px,y:yD(px)-4.2}); }
      for(t=rr(2,5);t<G.span;t+=rr(7.5,8.5)){ var qx=xa-dir*t; T.tex(qx+ox,yD(qx)+oy-4,qx+ox,yD(qx)+oy-0.3,rr(60,90)*f,0.45); }
      // D-21 (B10 ④): the rail deck as one visible layer — the lower chord (primary, above), the rail surface 3.5 px over it (structural), the slab between them 淡墨: 上公路下铁路
      T.str(xa,yB(xa)-3.5,xb,yB(xb)-3.5,undefined,0.95*f);
      T.wash(ST.INDIGO,[[xa,yB(xa)-3.2],[xb,yB(xb)-3.2],[xb,yB(xb)-0.4],[xa,yB(xa)-0.4]],C.danmo,0.16*f,2.5,2);
      // the deck as a plane: a faint 淡赭 over the road surface between the near edge and the far kerb, and a 淡墨 line of shadow under the near edge (the slab the truss hangs from)
      T.wash(ST.OCHRE,[[xa,yD(xa)-0.3],[xb,yD(xb)-0.3],[xb+ox,yD(xb)+oy+0.5],[xa+ox,yD(xa)+oy+0.5]],C.ochre,0.09*f,2.8,2.4);
      T.wash(ST.INDIGO,[[xa,yD(xa)+0.6],[xb,yD(xb)+0.6],[xb,yD(xb)+3.2],[xa,yD(xa)+3.2]],C.danmo,0.14*f,2.5,2); }
    if(TRN){ // the train: body standing on the rail surface, wheels touching it, roof under the road deck; light from the upper right — the 淡墨 gathers toward each car's left end
      for(k=0;k<strips.length;k++)T.occlude(strips[k]);
      var tnn=TRN.n||7, q, top=function(px){ return yB(px)-13; }, bot=function(px){ return yB(px)-5.1; }, railY=function(px){ return yB(px)-3.5; };
      for(q=0;q<tnn;q++){ var xa2=TRN.x+dir*q*(carL+carGap), xb2=xa2+dir*carL, xl=Math.min(xa2,xb2), xr=Math.max(xa2,xb2), fq=fade(G.first+Math.floor(dir*(G.x-(xl+xr)/2)/G.span)), xh=q===0?xa2+dir*2.2:xa2;
        T.rule(195*fq,0.8,xh,top(xh),xb2,top(xb2),0.4); T.rule(180*fq,0.75,xa2,bot(xa2),xb2,bot(xb2),0.2); T.rule(175*fq,0.7,xa2,bot(xa2),xh,top(xh),0.3); T.rule(175*fq,0.7,xb2,bot(xb2),xb2,top(xb2),0.3);
        T.tex(xl+1,bot(xl)-2.6,xr-1,bot(xr)-2.6,120*fq,0.5);
        for(var wx=xl+3.5;wx<xr-2;wx+=rr(4.2,4.8))T.tex(wx,top(wx)+1.6,wx,top(wx)+5.2,rr(60,85)*fq,0.45);
        var wxs=[xl+5,xl+8.6,xr-8.6,xr-5], wi; for(wi=0;wi<4;wi++)(function(wcx){ var wcy=railY(wcx)-1.3, pts=[], a; for(a=0;a<=8;a++){ var an=Math.PI*a/8; pts.push([wcx+Math.cos(an)*1.3,wcy+Math.sin(an)*1.3]); } T.curve(ST.JIEHUA,pts,C.ink,160*fq,0.55); T.dots(ST.JIEHUA,[[wcx,wcy+0.3,1.7]],C.ink,140*fq); })(wxs[wi]);
        T.wash(ST.INDIGO,[[xh,top(xh)+0.5],[xb2,top(xb2)+0.5],[xb2,bot(xb2)-0.5],[xa2,bot(xa2)-0.5],[xa2,bot(xa2)-3]],C.danmo,0.3*fq,2.2,2.2,(function(x0w,x1w){ return function(px,py){ var u=(px-x0w)/Math.max(1,x1w-x0w); return R()<1.05-0.95*ctx.smoothstep(0.3,1,u); }; })(xl,xr)); }
      T.clearOcc(); for(i=0;i<G.pavs.length;i++){ T.occlude(G.pavs[i].poly); T.occlude(G.pavs[i].stair); } }
    for(i=0;i<G.piers.length;i++){ var P=G.piers[i], f2=fade(P.si), pl=P.x-P.w/2, pr=P.x+P.w/2, sxp=P.side[0][0], pox=P.side[1][0]-sxp, poy=P.side[1][1]-P.side[0][1];
      T.rule(185*f2,0.85,pl,P.top,pl,P.bot); T.rule(185*f2,0.85,pr,P.top,pr,P.bot); T.rule(170*f2,0.8,pl-0.5,P.top,pr+0.5,P.top);
      T.rule(150*f2,0.7,sxp+pox,P.top+poy,sxp+pox,P.bot+poy); T.rule(150*f2,0.7,sxp,P.top,sxp+pox,P.top+poy);
      var row=0; for(var cy=P.top+rr(7,10);cy<P.bot-4;cy+=rr(8,12),row++){ var xa=pl+rr(0.5,3), xb=pr-rr(0.5,3);
        if(R()<0.5){ var xm=(xa+xb)/2+rr(-3,3); T.tex(xa,cy,xm-1,cy+rr(-0.3,0.3),rr(60,95)*f2,0.5); T.tex(xm+1,cy+rr(-0.3,0.3),xb,cy,rr(60,95)*f2,0.5); } else T.tex(xa,cy,xb,cy+rr(-0.3,0.3),rr(60,95)*f2,0.5);
        if(R()<0.6){ var jx=pl+P.w*(row%2?0.35:0.65)+rr(-2,2); T.tex(jx,cy+0.5,jx,Math.min(P.bot-0.5,cy+rr(5,9)),rr(55,85)*f2,0.45); } }
      T.rule(175*f2,0.8,pl,P.top,pl-5,P.top+2.5); T.rule(175*f2,0.8,pl-5,P.top+2.5,pl-5,P.bot); T.rule(120*f2,0.6,pl-5,P.top+2.5,pl,P.top+5.5);
      T.ochre(P.poly,0.2); T.ochre(P.side,0.16,C.ochre2); T.wash(ST.INDIGO,rect(pl-4.5,P.bot-3,pr-0.5,P.bot-0.3),C.danmo,0.18,2.5,2); }
    for(i=0;i<G.appr.length;i++){ var A=G.appr[i], ad=A.dir, ax=A.x0, ay=A.y, aend=A.x1;
      T.pri(ax,ay,aend,ay,undefined,1.05); TR.pri(ax,ay-4.2,aend,ay-4.2,undefined,0.9); for(t=rr(1,4);t<A.n*30;t+=rr(7.5,8.5)){ TR.str(ax+ad*t,ay-4.2,ax+ad*t,ay-0.5,0.2,1.05); railLine.push({x:ax+ad*t,y:ay-4.2}); }
      T.rule(175,0.8,aend,ay,aend,ay+34); T.rule(160,0.75,ax,ay+34,aend,ay+34); T.rule(175,0.8,ax,ay,ax,ay+34);
      for(k=0;k<A.n;k++){ var a0=ax+ad*(k*30+4), a1=ax+ad*(k*30+26), am=(a0+a1)/2, arc=[[a0,ay+34],[a0,ay+26]]; for(var j=0;j<=8;j++){ var an=Math.PI+Math.PI*j/8; arc.push([am+Math.cos(an)*11*ad,ay+26+Math.sin(an)*11]); } arc.push([a1,ay+34]);
        T.curve(ST.JIEHUA,arc,C.ink,175,0.75); T.tex(am,ay+14.6,am,ay+12.6,150,0.7); T.wash(ST.INDIGO,[[a0+ad,ay+34],[a0+ad,ay+26],[am,ay+16],[a1-ad,ay+26],[a1-ad,ay+34]],C.danmo,0.14,3,2.5); }
      for(var cy2=ay+rr(5,7);cy2<ay+12;cy2+=rr(4.5,6))T.tex(ax+ad*0.5,cy2,aend-ad*0.5,cy2+rr(-0.3,0.3),rr(80,110),0.45);
      T.ochre(rect(Math.min(ax,aend)+0.5,ay+0.5,Math.max(ax,aend)-0.5,ay+33.5),0.14); }
    T.clearOcc();
    // D-21 (B10 ④) 桥头堡: a broad block on each bank (bhGeom) — the ground tier and the abutment below the deck one wall mass of rusticated courses (the deck level a string
    // course only), two arched openings standing on the deck, three windows a tier on the two middle tiers, an open pavilion tier under a small 攒尖; corner edges primary with an
    // inner pilaster line; the left flank turned from the light; the far twin behind it, paler, cut by the near one; a flight of 石阶 in profile up the near block's outer side
    function towerAt(cx,base,pk,occs,outer,stair){ var bh=bhGeom(cx,base,outer), tiers=bh.tiers, fox=ctx.OBL[0]*11*dir, foy=ctx.OBL[1]*11, k, j, q; T.setPale(pk); for(q=0;q<occs.length;q++)T.occlude(occs[q]);
      for(k=0;k<4;k++){ var tr=tiers[k], h=tr.hw, ye=tr.ye, y0=tr.y0, yb0=k===0?base+bh.ab:y0, sxk=cx-h*dir, tw=tr.tw, eave=eavePts([cx-h-tw,ye],[cx+h+tw,ye],k===3?2.2:1.2,k===3?2.2:1.2);
        if(k===0&&stair)T.occlude(bh.stair);
        T.rule(rr(200,222),0.95,cx-h,yb0,cx-h,ye+2); T.rule(rr(200,222),0.95,cx+h,yb0,cx+h,ye+2); T.rule(rr(150,170),0.7,cx-h+2.4,yb0,cx-h+2.4,ye+2,0.3); T.rule(rr(150,170),0.7,cx+h-2.4,yb0,cx+h-2.4,ye+2,0.3);
        T.rule(rr(150,170),0.7,sxk+fox,yb0+foy,sxk+fox,ye+2+foy); T.rule(rr(140,160),0.65,sxk,yb0,sxk+fox,yb0+foy);
        if(k===0){ for(var cy=ye+7.5;cy<yb0-2.5;cy+=rr(5,6.4)){ var xa=cx-h+2.8+rr(0,1.5), xb=cx+h-2.8-rr(0,1.5), xm=xa+(xb-xa)*rr(0.3,0.7);
            if(R()<0.7){ T.tex(xa,cy,xm-1.2,cy+rr(-0.3,0.3),rr(70,100),0.45); T.tex(xm+1.2,cy+rr(-0.3,0.3),xb,cy,rr(70,100),0.45); } else T.tex(xa,cy,xb,cy+rr(-0.3,0.3),rr(70,100),0.45);
            if(R()<0.55){ var jx=xa+(xb-xa)*rr(0.15,0.85); T.tex(jx,cy+0.6,jx+rr(-0.3,0.3),Math.min(yb0-0.5,cy+rr(4,5.5)),rr(55,85),0.4); } }
          T.rule(rr(150,170),0.7,cx-h+2.4,base+0.5,cx+h-2.4,base+0.5,0);
          for(j=-1;j<=1;j+=2){ var ax=cx+j*h*0.5, aw=8; archWindow(T,ax-aw/2,base-18,ax+aw/2,base-0.6,1.1,false); T.wash(ST.INDIGO,[[ax-aw/2+0.6,base-15],[ax+aw/2-0.6,base-15],[ax+aw/2-0.6,base-1],[ax-aw/2+0.6,base-1]],C.danmo,0.34,1.4,1.5); } }
        else if(k<3){ for(j=-1;j<=1;j++){ var wx=cx+j*h*0.56, ww=4.6, wy0=ye+6.5, wy1=y0-4.5; T.str(wx-ww/2,wy0,wx+ww/2,wy0,undefined,1.05); T.str(wx-ww/2,wy0,wx-ww/2,wy1); T.str(wx+ww/2,wy0,wx+ww/2,wy1); T.str(wx-ww/2-0.8,wy1,wx+ww/2+0.8,wy1,undefined,0.9); T.txt(wx,wy0+0.5,wx,wy1-0.5,1.1,true);
            T.wash(ST.INDIGO,rect(wx-ww/2+0.4,wy0+0.4,wx+ww/2-0.4,wy1-0.4),C.danmo,0.24,1.5,1.5); } T.rule(rr(140,160),0.65,cx-h+1,y0-3.6,cx+h-1,y0-3.6,0.2); }
        else { var rl=y0-5.5; T.str(cx-h+1,rl,cx+h-1,rl,undefined,1.05); for(var px=cx-h+2.5;px<cx+h-1.5;px+=rr(2.6,3.2))T.txt(px,rl+0.3,px,y0-0.6,1.1,true);
          for(j=0;j<6;j++){ var ccx=cx-h+2.2+(2*h-4.4)*j/5; T.str(ccx,ye+2.5,ccx,y0-0.3,undefined,1.05); } T.wash(ST.INDIGO,rect(cx-h+2.6,ye+3,cx+h-2.6,rl-0.5),C.danmo,0.38,1.4,1.5); }
        T.wash(ST.INDIGO,[[sxk,yb0],[sxk+fox,yb0+foy],[sxk+fox,ye+2+foy],[sxk,ye+2]],C.danmo,dir>0?0.36:0.14,1.8,1.8);
        T.ochre(rect(cx-h+0.5,ye+3.2,cx+h-0.5,yb0-0.5),0.2);
        if(k===0&&stair){ T.clearOcc(); for(q=0;q<occs.length;q++)T.occlude(occs[q]); }
        T.curve(ST.JIEHUA,eave,C.ink,rr(195,215),0.85); var dts=[]; for(t=1.5;t<2*(h+tw)-1;t+=rr(2.6,3.4))dts.push([cx-h-tw+t,ye+0.3,rr(0.9,1.2)]); T.dots(ST.JIEHUA,dts,C.ink,175);
        T.wash(ST.INDIGO,rect(cx-h+0.3,ye+0.6,cx+h-0.3,ye+3.2),C.danmo,0.3,1.3,1.4);
        if(k<3){ var ry=tr.ry, rl2=cx-h-0.4, rr2=cx+h+0.4; T.rule(rr(180,200),0.8,rl2,ry,rr2,ry); tiles(T,eave,[rl2,ry],[rr2,ry],0.9); T.rule(rr(160,180),0.7,cx-h-tw,ye-1.2,rl2,ry); T.rule(rr(160,180),0.7,cx+h+tw,ye-1.2,rr2,ry);
          T.wash(ST.INDIGO,[[cx-h-tw,ye-1.2],[cx+h+tw,ye-1.2],[rr2,ry],[rl2,ry]],C.huaqing,0.22,2.4,2.2); T.wash(ST.INDIGO,[[cx-h-tw,ye-1.2],[cx+h+tw,ye-1.2],[rr2,ry],[rl2,ry]],C.danmo,0.16,2.6,2.4); }
        else { var apex=[cx,tr.ry]; T.rule(rr(195,215),0.85,cx-h-tw,ye-1.2,apex[0],apex[1]); T.rule(rr(195,215),0.85,cx+h+tw,ye-1.2,apex[0],apex[1]); T.rule(rr(150,170),0.65,cx-h*0.35,ye-1,apex[0],apex[1]); T.rule(rr(150,170),0.65,cx+h*0.35,ye-1,apex[0],apex[1]);
          tiles(T,eave,apex,apex,0.9); T.rule(195,0.85,cx,apex[1],cx,apex[1]-3.5,0); T.dots(ST.JIEHUA,[[cx,apex[1]-4.2,2.2]],C.ink,200);
          T.wash(ST.INDIGO,[[cx-h-tw,ye-1.2],[cx+h+tw,ye-1.2],apex],C.huaqing,0.22,2.4,2.2); T.wash(ST.INDIGO,[[cx-h-tw,ye-1.2],[cx+h+tw,ye-1.2],apex],C.danmo,0.16,2.6,2.4); }
        T.fin(eave,rr(100,120),0.66); }
      // the 石阶 up the abutment's outer side, seen in profile: the flight's sawtooth edge is the wall's top, its masonry under it, the ground line at its foot
      if(stair){ var S=bh.stair, o=outer, sx0=S[0][0], gy=base+bh.ab, n=Math.round(bh.ab/2.7), i2, xe=S[1][0];
        for(i2=0;i2<n;i2++){ var xa2=sx0+o*BH.run*i2/n, xb2=sx0+o*BH.run*(i2+1)/n, ya2=base+0.5+bh.ab*i2/n, yb2=base+0.5+bh.ab*(i2+1)/n; T.str(xa2,ya2,xb2,ya2,undefined,0.95+0.25*i2/n); T.str(xb2,ya2,xb2,yb2,undefined,0.8); }
        T.pri(Math.min(sx0,xe)-0.5,gy,Math.max(sx0,xe)+0.5,gy,undefined,1.05);
        for(var cy3=gy-rr(4,5.5);cy3>base+7;cy3-=rr(5,6.4)){ var xr3=sx0+o*BH.run*(gy-cy3)/bh.ab-o*2.5; if(Math.abs(xr3-sx0)>4)T.tex(sx0+o*0.8,cy3,xr3,cy3+rr(-0.3,0.3),rr(70,100),0.45); }
        T.ochre(S,0.2); T.wash(ST.INDIGO,[[sx0,gy-2.6],[xe,gy-0.3],[xe,gy],[sx0,gy]],C.danmo,0.18,2.2,2); }
      T.clearOcc(); T.setPale(s.pale||1); }
    for(i=0;i<G.pavs.length;i++){ var pv=G.pavs[i]; towerAt(pv.x+ox,pv.y+2+oy,0.62*(s.pale||1),[pv.poly,pv.stair],pv.outer,false); towerAt(pv.x,pv.y+2,s.pale||1,[],pv.outer,true); }
    var seats=[], xs=G.x-dir*rr(6,12); while(dir*(G.x-xs)<G.L-4){ seats.push({x:xs,y:yD(xs)+0.5,z:G.z,dir:R()<0.5?1:-1,rail:true}); xs-=dir*rr(9,14); }
    slots.deckZone={x0:Math.min(G.x,G.xEnd),x1:Math.max(G.x,G.xEnd),yAt:yD,railY:function(px){ return yD(px)-4; },z:G.z,dir:dir};
    slots.railDeck={yAt:function(px){ return yB(px)-3.5; },chord:yB}; slots.seats=seats;
    railLine.sort(function(a,b){ return a.x-b.x; }); slots.railLine=railLine; slots.railFp=unionFp(ctx,G.rail,G.railZ); slots.railZ=G.railZ;
    slots.piers=G.piers.map(function(P){ return {x:P.x,top:P.top,bot:P.bot,w:P.w}; }); slots.pavilions=G.pavs.map(function(pp){ return {x:pp.x,y:pp.y}; });
    return slots; }
  KINDS.bridge={geom:bridgeGeom,draw:bridgeDraw};

  /* ---------------------------------------------------------------- quay, wall, steps, embankment, 牌坊 */
  function wharfGeom(ctx,s){ var len=s.len||140, dir=s.dir===undefined?1:s.dir, x1=s.x, x0=s.x-len, y=s.y, hh=s.hh||9, deck=y-hh, cw=Math.round(len*0.3), cx0=x0+Math.round(len*0.36), gx=dir>0?x1:x0;
    var bank=s.bank||[gx+dir*22,y+20], gw=[[gx-dir*2,deck-0.5],[bank[0]-dir*2,bank[1]],[bank[0]+dir*3,bank[1]],[gx+dir*3,deck-0.5]], hull=[[x0+3,y],[x1-3,y],[x1,deck],[x0,deck]];
    return {x0:x0,x1:x1,y:y,deck:deck,hull:hull,cabin:rect(cx0,deck-14,cx0+cw,deck),cabinRoof:rect(cx0-2,deck-17,cx0+cw+2,deck-14),gx:gx,bank:bank,gw:gw,dir:dir,z:zOf(s),
      polys:[hull,rect(cx0,deck-14,cx0+cw,deck),rect(cx0-2,deck-17,cx0+cw+2,deck-14),gw]}; }
  function wharfDraw(ctx,s,G){ var T=tools(ctx,G.z,s), ST=ctx.ST, C=ctx.C, rr=ctx.rr, x0=G.x0, x1=G.x1, y=G.y, deck=G.deck, cb=G.cabin, cr=G.cabinRoof, dir=G.dir, i, t;
    T.draft(x0+3,y+0.5,x1-3,y+0.5);
    T.rule(rr(185,205),0.85,x0,deck,x1,deck); T.rule(rr(165,185),0.8,x0+3,y,x1-3,y); T.rule(175,0.8,x0,deck,x0+3,y); T.rule(175,0.8,x1,deck,x1-3,y);
    T.rule(rr(110,140),0.55,x0+1,deck+3,x1-1,deck+3); T.rule(rr(100,130),0.5,x0+2,deck+6,x1-2,deck+6);
    for(var bx=x0+rr(6,10);bx<x1-4;bx+=rr(10,16))T.tex(bx,deck+0.5,bx+rr(-0.3,0.3),y-0.5,rr(60,90),0.45);
    T.rule(175,0.75,cb[0][0],cb[0][1],cb[0][0],cb[3][1]); T.rule(175,0.75,cb[1][0],cb[1][1],cb[1][0],cb[2][1]); T.rule(190,0.85,cr[0][0],cr[3][1],cr[1][0],cr[3][1]); T.rule(160,0.65,cr[0][0],cr[0][1],cr[1][0],cr[0][1]); T.rule(150,0.6,cr[0][0],cr[0][1],cr[0][0],cr[3][1]); T.rule(150,0.6,cr[1][0],cr[1][1],cr[1][0],cr[2][1]);
    var cwid=cb[1][0]-cb[0][0]; for(i=0;i<3;i++){ var wx0=cb[0][0]+cwid*(0.1+i*0.3); window(T,wx0,deck-11.5,wx0+cwid*0.2,deck-4.5); }
    T.rule(175,0.65,x0+1,deck-5,x1-1,deck-5); for(var px=x0+rr(1,3);px<x1-1;px+=rr(5.5,6.5))T.tex(px,deck-4.7,px,deck-0.3,rr(120,160),0.5);
    var gw=G.gw, a=gw[0], b=gw[1], c=gw[2], d=gw[3], L=dist(a,b); T.rule(180,0.8,a[0],a[1],b[0],b[1]); T.rule(180,0.8,d[0],d[1],c[0],c[1]);
    for(t=2.5/L;t<1;t+=rr(2.6,3.4)/L)T.tex(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,d[0]+(c[0]-d[0])*t,d[1]+(c[1]-d[1])*t,rr(90,125),0.45);
    T.rule(150,0.6,a[0],a[1]-4.5,b[0],b[1]-4.5); for(t=0.12;t<0.95;t+=0.28)T.tex(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-4.5,a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,rr(110,150),0.5);
    var mx=dir>0?x0+2:x1-2, post=[mx-dir*26,y+14]; T.curve(ST.BOATS,[[mx,deck+1],[mx-dir*9,deck+9],[mx-dir*18,y+11],[post[0],post[1]]],C.ink,90,0.6); T.rule(170,0.9,post[0],post[1]-6,post[0],post[1]+1,0);
    T.ochre(G.hull,0.3); T.ochre(cb,0.24); T.wash(ST.INDIGO,rect(cb[0][0]+0.5,deck-14,cb[1][0]-0.5,deck-11.5),C.danmo,0.2,2.5,2); T.wash(ST.INDIGO,rect(x0+3,y-2.5,x1-3,y-0.3),C.danmo,0.16,2.5,2);
    T.fin([[x0,deck],[(x0+x1)/2,deck-0.2],[x1,deck]],100,0.62);
    return {deckZone:{x0:x0+2,x1:x1-2,y:deck,z:G.z},gate:{x:G.gx,y:deck},gangway:{from:[G.gx,deck],to:G.bank},ground:{x0:x0,x1:x1,y:y}}; }
  KINDS.wharf={geom:wharfGeom,draw:wharfDraw};

  function wallGeom(ctx,s){ var w=s.w, h=s.h||14, dir=s.dir===undefined?1:s.dir, d=s.d||10, ox=ctx.OBL[0]*d*dir, oy=ctx.OBL[1]*d, x0=s.x-w, x1=s.x, y=s.y, sx=dir>0?x0:x1;
    return {x0:x0,x1:x1,y:y,yt:y-h,sx:sx,ox:ox,oy:oy,z:zOf(s),polys:[rect(x0-1,y-h-4,x1+1,y),[[sx,y],[sx+ox,y+oy],[sx+ox,y-h-4+oy],[sx,y-h-4]]]}; }
  function wallDraw(ctx,s,G){ var T=tools(ctx,G.z,s); wallFace(T,G.x0,G.x1,G.y,G.yt,G.sx,G.ox,G.oy); return {top:{y:G.yt,x0:G.x0,x1:G.x1},ground:{x0:G.x0,x1:G.x1,y:G.y}}; }
  KINDS.wall={geom:wallGeom,draw:wallDraw};

  // 台阶: n treads of width w stepping by (dx,dy) per tread — dy<0 climbs the picture (steps going down to a river above), dy>0 comes toward the viewer
  function stepsGeom(ctx,s){ var n=s.n||10, w=s.w||40, dir=s.dir===undefined?1:s.dir, dx=s.dx===undefined?ctx.OBL[0]*4*dir:s.dx, dy=s.dy===undefined?-2:s.dy, x=s.x, y=s.y, treads=[], i;
    for(i=0;i<n;i++)treads.push([[x-w+dx*i,y+dy*i],[x+dx*i,y+dy*i]]);
    var a=treads[0], b=treads[n-1]; return {treads:treads,n:n,z:zOf(s),polys:[[[a[0][0],a[0][1]+1],[a[1][0],a[1][1]+1],[b[1][0],b[1][1]-1],[b[0][0],b[0][1]-1]]]}; }
  function stepsDraw(ctx,s,G){ var T=tools(ctx,G.z,s), rr=ctx.rr, tr=G.treads, n=G.n, i;
    T.draft(tr[0][0][0],tr[0][0][1],tr[n-1][0][0],tr[n-1][0][1]); T.draft(tr[0][1][0],tr[0][1][1],tr[n-1][1][0],tr[n-1][1][1]);
    for(i=0;i<n;i++){ var a=tr[i][0], b=tr[i][1]; T.rule(rr(185,205)-i*4,0.78-i*0.015,a[0],a[1],b[0],b[1]); }
    T.rule(175,0.75,tr[0][0][0],tr[0][0][1],tr[n-1][0][0],tr[n-1][0][1]); T.rule(175,0.75,tr[0][1][0],tr[0][1][1],tr[n-1][1][0],tr[n-1][1][1]);
    T.ochre(G.polys[0],0.15);
    return {treads:tr.map(function(t){ return {x0:t[0][0],x1:t[1][0],y:t[0][1]}; })}; }
  KINDS.steps={geom:stepsGeom,draw:stepsDraw};

  function embGeom(ctx,s){ var w=s.w, h=s.h||18, dir=s.dir===undefined?1:s.dir, x0=s.x-w, x1=s.x, y=s.y, sx=dir>0?x0:x1, d=s.d||8, ox=ctx.OBL[0]*d*dir, oy=ctx.OBL[1]*d;
    return {x0:x0,x1:x1,y:y,yt:y-h,sx:sx,ox:ox,oy:oy,z:zOf(s),polys:[rect(x0,y-h,x1,y),[[sx,y],[sx+ox,y+oy],[sx+ox,y-h+oy],[sx,y-h]]]}; }
  function embDraw(ctx,s,G){ var T=tools(ctx,G.z,s); T.draft(G.x0,G.yt,G.x1,G.yt); courses(T,G.x0,G.yt,G.x1,G.y);
    T.rule(170,0.75,G.sx,G.yt,G.sx+G.ox,G.yt+G.oy); T.rule(160,0.7,G.sx+G.ox,G.yt+G.oy,G.sx+G.ox,G.y+G.oy); T.rule(150,0.7,G.sx,G.y,G.sx+G.ox,G.y+G.oy);
    T.fin([[G.x0,G.yt],[(G.x0+G.x1)/2,G.yt-0.2],[G.x1,G.yt]],95,0.6); return {top:{y:G.yt,x0:G.x0,x1:G.x1},waterline:{y:G.y}}; }
  KINDS.embankment={geom:embGeom,draw:embDraw};

  // 牌坊: four columns, the middle bay taller, two beams per bay with a 匾 panel between, 斗拱 rows, three small 庑殿 roofs
  function paifangGeom(ctx,s){ var w=s.w||90, h=s.h||90, x1=s.x, x0=s.x-w, y=s.y, xs=[x0,x0+w*0.25,x0+w*0.75,x1], yo=y-h*0.72, ym=y-h*0.9, bg=clamp(h*0.19,12,20), bgM=clamp(h*0.3,22,30), ox=ctx.OBL[0]*10, oy=ctx.OBL[1]*10, i, polys=[], roofs=[];
    for(i=0;i<4;i++)polys.push(rect(xs[i]-1.8,i===1||i===2?ym:yo,xs[i]+1.8,y));
    function mk(a,b,yt,rise){ var RG=roofGeom({w:b-a,ox:ox,oy:oy,dir:1,ye:yt,x0:a,x1:b},{roof:'wudian',rise:rise,ov:3,qiao:2.6}); roofs.push(RG); polys.push(RG.front); polys.push(RG.side); }
    mk(xs[1]+2,xs[2]-2,ym-7,10); mk(xs[0]+2,xs[1]-2,yo-6,7); mk(xs[2]+2,xs[3]-2,yo-6,7);
    polys.push(rect(xs[0]-3,yo-6,xs[3]+3,yo+bg)); polys.push(rect(xs[1]-3,ym-7,xs[2]+3,ym+bgM));
    return {xs:xs,yo:yo,ym:ym,y:y,bg:bg,bgM:bgM,roofs:roofs,z:zOf(s),polys:polys}; }
  function paifangDraw(ctx,s,G){ var T=tools(ctx,G.z,s), ST=ctx.ST, C=ctx.C, rr=ctx.rr, xs=G.xs, y=G.y, yo=G.yo, ym=G.ym, bg0=G.bg, bg, i, k;
    for(i=0;i<4;i++){ var cx=xs[i], top=(i===1||i===2)?ym:yo; T.draft(cx-4,y+0.5,cx+4,y+0.5);
      T.rule(rr(185,205),0.85,cx-1.4,top,cx-1.4,y); T.rule(rr(140,170),0.65,cx+1.4,top,cx+1.4,y); T.wash(ST.OCHRE,rect(cx-1.8,top+0.5,cx+1.8,y-0.5),C.ochre,0.36,2,1.5);
      T.rule(170,0.7,cx-4,y-4,cx-1.6,y-4); T.rule(170,0.7,cx-4,y-4,cx-4,y); T.rule(170,0.7,cx+1.6,y-4,cx+4,y-4); T.rule(170,0.7,cx+4,y-4,cx+4,y); }
    for(k=0;k<3;k++){ var a=xs[k], b=xs[k+1], yt=(k===1)?ym:yo; bg=(k===1)?G.bgM:bg0;
      T.rule(rr(185,205),0.85,a-2,yt,b+2,yt); T.rule(rr(150,175),0.65,a-1,yt+3,b+1,yt+3); T.rule(rr(180,200),0.8,a-2,yt+bg,b+2,yt+bg); T.rule(rr(150,175),0.65,a-1,yt+bg-3,b+1,yt+bg-3);
      T.ochre(rect(a-1,yt+0.4,b+1,yt+2.8),0.3); T.ochre(rect(a-1,yt+bg-2.7,b+1,yt+bg-0.3),0.3);
      for(var bx=a+rr(2,5);bx<b-1;bx+=rr(4.5,6))bracket(T,bx,yt-6,yt);
      if(k===1){ var pw=(b-a)*0.9, pm=(a+b)/2; T.rule(185,0.75,pm-pw/2,yt+3.5,pm+pw/2,yt+3.5); T.rule(185,0.75,pm-pw/2,yt+bg-3.5,pm+pw/2,yt+bg-3.5); T.rule(175,0.7,pm-pw/2,yt+3.5,pm-pw/2,yt+bg-3.5); T.rule(175,0.7,pm+pw/2,yt+3.5,pm+pw/2,yt+bg-3.5); T.wash(ST.INDIGO,rect(pm-pw/2+0.6,yt+4,pm+pw/2-0.6,yt+bg-4),C.danmo,0.08,2.6,2.4); }
      T.wash(ST.INDIGO,rect(a,yt-6,b,yt-0.5),C.danmo,0.2,2.5,2);
      drawRoof(T,G.roofs[k===1?0:k===0?1:2],'indigo',false); }
    var pm2=(xs[1]+xs[2])/2, pw2=(xs[2]-xs[1])*0.9, bgM=G.bgM;
    return {signRect:{x:pm2-pw2/2,y:ym+3.5,w:pw2,h:bgM-7,cx:pm2,cy:ym+bgM/2,vertical:false,text:s.sign},gate:{x:pm2,y:y,w:xs[2]-xs[1]}}; }
  KINDS.paifang={geom:paifangGeom,draw:paifangDraw};
  function footprint(ctx,spec){ var K=KINDS[spec.kind]||KINDS.hall, G=K.geom(ctx,spec), fp=unionFp(ctx,G.polys,G.z); if(G.rail)fp.rail=unionFp(ctx,G.rail,G.railZ); return fp; }
  function build(ctx,spec){ var K=KINDS[spec.kind]||KINDS.hall, G=K.geom(ctx,spec), slots=K.draw(ctx,spec,G)||{}, out={fp:unionFp(ctx,G.polys,G.z),slots:slots,kind:spec.kind||'hall'}; ctx.reg.buildings.push(out); return out; }
  // D-10 public entry for the 连续街屋: spec.kind is the STREET (hubuxiang | hanzhengjie | lilong | jianghanlu). Phase A: stampZ(ARCH.streetRowFootprint(ctx,spec)); phase B: ARCH.streetRow(ctx,spec)
  function rowSpec(spec){ return copy(spec,{kind:'streetRow',row:spec.row||(ROWS[spec.kind]?spec.kind:'hubuxiang')}); }
  function streetRowFootprint(ctx,spec){ return footprint(ctx,rowSpec(spec)); }
  function streetRow(ctx,spec){ var out=build(ctx,rowSpec(spec)); out.kind='streetRow:'+rowSpec(spec).row; return out; }
  return {footprint:footprint,build:build,streetRow:streetRow,streetRowFootprint:streetRowFootprint};
})();
