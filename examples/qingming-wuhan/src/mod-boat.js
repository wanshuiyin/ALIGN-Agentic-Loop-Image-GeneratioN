/* mod-boat.js — 舟船 (interfaces §2(c)).
   BOAT.footprint(ctx,spec) / BOAT.build(ctx,spec), spec = {x,y,type,len,dir,z,moving,mastFolded,clearance?,seats?}:
   (x,y) is the waterline at the RIGHT end of the hull, len extends to the left, dir=+1 bow at the right (heading right),
   dir=-1 bow at the left; z the mask depth (default y). Side elevation seen a little from above, as the 汴河 boats are:
   the deck shows as a thin band above the gunwale. Geometry is resolved once per spec and cached as spec.bt, so hand the
   same spec object to footprint() and build(). build() returns {fp, seats:[{x,y,pose,dir,h}]} and pushes it to ctx.reg.boats.
   Types: song (generic 汴河 cargo boat: mat 舱棚, 桅, 橹, 舵), duchuan (汉江 flat ferry, open, railed), huazi (划子 rowboat),
   ferry (轮渡, two decks), tug (拖轮, wheelhouse, foldable signal mast), barge (驳船, cargo mounds under tarp),
   louchuan (楼船 pleasure boat, railed decks), haishi (海事艇 patrol launch). */
var BOAT=(function(){
  function mx(pts){ var m=-1e9; for(var i=0;i<pts.length;i++)if(pts[i][0]>m)m=pts[i][0]; return m; }
  // several small marks in one stroke object (1 pt = dot, 2 = line, ≥3 = polyline); skipped per mark when hidden at depth z
  function marks(ctx,st,c,items){ if(!items.length)return; var x=-1e9,i; for(i=0;i<items.length;i++){ var m=mx(items[i].p); if(m>x)x=m; }
    ctx.add(st,x,function(g){ g.noFill(); g.strokeCap(g.ROUND);
      for(var k=0;k<items.length;k++){ var it=items[k], p=it.p; g.stroke(c[0],c[1],c[2],it.a); g.strokeWeight(it.w);
        if(p.length===1)g.line(p[0][0],p[0][1],p[0][0]+0.01,p[0][1]);
        else { g.beginShape(); for(var j=0;j<p.length;j++)g.vertex(p[j][0],p[j][1]); g.endShape(); } } }); }
  function batch(ctx,st,c,z){ var it=[]; return {
    push:function(p,w,a){ if(ctx.masks.hidden(p[0][0],p[0][1],z))return; it.push({p:p,w:w*wk(ctx),a:ak(ctx,a)}); if(it.length>=8){ marks(ctx,st,c,it); it=[]; } },
    done:function(){ marks(ctx,st,c,it); it=[]; } }; }
  // every weight and alpha in this file was written against v2's hierarchy (primary 0.8 / 210); the boat follows whatever grade
  // core publishes now in ctx.INK, so a thinner primary thins the whole hull and its rigging in the same proportion (D-08: ~25 % thinner)
  function wk(ctx){ return ctx.INK.primary[0]/0.8; }
  function ak(ctx,a){ return a+(ctx.INK.primary[1]-210); }
  // ruled line (界笔) at depth z; bline for the freehand hull curves; both clip through z inside core
  function rl(ctx,z,x1,y1,x2,y2,w,a){ ctx.rline(ctx.ST.BOATS,Math.max(x1,x2),ctx.C.ink,ak(ctx,a||190),(w||0.7)*wk(ctx),x1,y1,x2,y2,z,0.6); }
  function bl(ctx,z,pts,w,a){ ctx.bline(ctx.ST.BOATS,mx(pts),ctx.C.ink,ak(ctx,a||215),(w||0.7)*wk(ctx),pts,z); }
  // 朱砂 band (waterline, 海事 stripe): a painted band, not a printed stripe — 3–5 ruled pieces of unequal length, each with its own
  // ink load (alpha 60–130) and a slightly different width, gaps of 3–8 px between them where the brush lifted; the band also stops
  // under each hanging tyre; every piece is clipped at the hull's depth so it stops behind whatever stands in front of the hull
  function redLine(ctx,b,x1,y1,x2,y2,w,a){ var lo=Math.min(x1,x2), hi=Math.max(x1,x2), L=hi-lo, i, k;
    var n=ctx.ri(3,5), wts=[], sum=0; for(k=0;k<n;k++){ wts.push(ctx.rr(0.6,1.6)); sum+=wts[k]; }
    var gaps=[]; for(k=0;k<n-1;k++)gaps.push(ctx.rr(3,8)); var gsum=0; for(k=0;k<gaps.length;k++)gsum+=gaps[k];
    var run=Math.max(L*0.5,L-gsum), x=lo+(L-run-gsum)*0.5;
    function piece(xa,xb,al,ww){ var cuts=[]; if(b.fenderX)for(var j=0;j<b.fenderX.length;j++)if(b.fenderX[j]>xa-3&&b.fenderX[j]<xb+3)cuts.push([b.fenderX[j]-3.4,b.fenderX[j]+3.4]);
      cuts.sort(function(p,q){ return p[0]-q[0]; }); var s=xa;
      for(var j=0;j<cuts.length;j++){ if(cuts[j][0]>s+2)ctx.rline(ctx.ST.INDIGO,cuts[j][0],ctx.C.zhusha,al,ww,s,y1,cuts[j][0],y2,b.z,0); s=Math.max(s,cuts[j][1]); }
      if(xb>s+2)ctx.rline(ctx.ST.INDIGO,xb,ctx.C.zhusha,al,ww,s,y1,xb,y2,b.z,0); }
    for(k=0;k<n;k++){ var len=run*wts[k]/sum; piece(x,x+len,ctx.ri(60,130),w*ctx.rr(0.8,1.15)); x+=len+(k<n-1?gaps[k]:0); } }
  // slack rope between two points: sags by a share of its span, drawn as one freehand line at texture-to-structural grade
  function rope(ctx,z,a,bq,sagK,w,al){ var dx=bq[0]-a[0], dy=bq[1]-a[1], L=Math.sqrt(dx*dx+dy*dy), sag=L*sagK+2, pts=[], n=Math.max(4,Math.round(L/8));
    for(var i=0;i<=n;i++){ var t=i/n; pts.push([a[0]+dx*t,a[1]+dy*t+Math.sin(t*Math.PI)*sag]); }
    ctx.bline(ctx.ST.BOATS,Math.max(a[0],bq[0]),ctx.C.ink,ak(ctx,al||150),(w||0.5)*wk(ctx),pts,z); }
  // a coiled rope lying on the deck: a flattened spiral of 2.5 turns
  function coil(ctx,b,x,y,r){ var pts=[], n=22; for(var i=0;i<=n;i++){ var t=i/n, a=t*Math.PI*5, rr=r*(0.25+0.75*t); pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr*0.45]); }
    pts.push([x+r*1.4,y+r*0.5]); ctx.pline(ctx.ST.BOATS,x+r*1.5,ctx.C.ink,ak(ctx,175),0.55*wk(ctx),pts,true); }
  function arcPts(cx,cy,rx,ry,a0,a1,n){ var o=[]; for(var i=0;i<=n;i++){ var t=a0+(a1-a0)*i/n; o.push([cx+rx*Math.cos(t),cy+ry*Math.sin(t)]); } return o; }
  function poly(ctx,pts){ var b=[1e9,1e9,-1e9,-1e9]; for(var i=0;i<pts.length;i++){ var p=pts[i]; if(p[0]<b[0])b[0]=p[0]; if(p[1]<b[1])b[1]=p[1]; if(p[0]>b[2])b[2]=p[0]; if(p[1]>b[3])b[3]=p[1]; }
    return {x0:b[0],y0:b[1],x1:b[2],y1:b[3],inside:ctx.polyInside(pts),edge:ctx.polyEdge(pts),pts:pts}; }
  function unionFP(ctx,list,z){ var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,i; for(i=0;i<list.length;i++){ var f=list[i]; if(f.x0<x0)x0=f.x0; if(f.y0<y0)y0=f.y0; if(f.x1>x1)x1=f.x1; if(f.y1>y1)y1=f.y1; }
    return {x0:x0,y0:y0,x1:x1,y1:y1,z:z,parts:list,
      inside:function(x,y){ for(var k=0;k<list.length;k++)if(list[k].inside(x,y))return true; return false; },
      edge:function(x,y){ var m=1e9; for(var k=0;k<list.length;k++){ if(list[k].inside(x,y)){ var e=list[k].edge(x,y); if(e<m)m=e; } } return m===1e9?0:m; }}; }

  // ---------------------------------------------------------------- geometry
  // hull: squared raked ends, sheer dips amidships, 2–4 plank lines converging toward the bow
  function hull(ctx,b,fbK,rakeBow,rakeStern,k){ var L=b.len, d=b.dir, fb=L*fbK, x=b.x, y=b.y, xr=x, xl=x-L; k=k||{};
    var bowK=k.bowK||1.12, sternK=k.sternK||1.38, sagK=k.sag===undefined?0.16:k.sag;
    // bow is at the right when d=+1
    var bowX=d>0?xr:xl, sternX=d>0?xl:xr, rb=rakeBow*fb*d, rs=-rakeStern*fb*d;
    var bowTop=[bowX+rb,y-fb*bowK], sternTop=[sternX+rs,y-fb*sternK];   // 汴河船: the stern rides higher than the squared bow
    sagK*=1.6;                                                          // the sheer sags enough to read as a curve at 1×
    var sheer=[], n=10, i; for(i=0;i<=n;i++){ var t=i/n, sx=sternTop[0]+(bowTop[0]-sternTop[0])*t, sag=Math.sin(t*Math.PI)*fb*sagK;
      sheer.push([sx,sternTop[1]+(bowTop[1]-sternTop[1])*t+sag]); }
    // waterline: nearly straight, bellied a little; the stern of a steel or pleasure hull rounds down to it (3-point curve)
    var wlS=sternX, sternCurve=null; if(k.roundStern){ var bulge=fb*0.42; wlS=sternX+d*fb*0.15;
      sternCurve=[sternTop,[sternX-d*bulge*0.35,sternTop[1]+fb*0.55],[sternX+d*bulge*0.1,y-fb*0.15],[wlS,y+0.3]]; }
    var wl=[[wlS,y],[wlS+(bowX-wlS)*0.5,y+0.9],[bowX,y]];
    b.fb=fb; b.sheer=sheer; b.bowTop=bowTop; b.sternTop=sternTop; b.bowX=bowX; b.sternX=sternX; b.wl=wl; b.wlS=wlS; b.sternCurve=sternCurve;
    b.deckY=function(xx){ var t=(xx-sternTop[0])/(bowTop[0]-sternTop[0]); t=Math.max(0,Math.min(1,t)); return sternTop[1]+(bowTop[1]-sternTop[1])*t+Math.sin(t*Math.PI)*fb*sagK; };
    // far gunwale: the deck seen a little from above, 0.28·fb behind the near sheer, pulled in at both ends
    var far=[], dw=fb*0.28; for(i=0;i<sheer.length;i++){ var u=i/(sheer.length-1), pinch=1-0.55*Math.pow(Math.abs(u-0.5)*2,3); far.push([sheer[i][0]+d*(u-0.5)*fb*0.1,sheer[i][1]-dw*pinch]); }
    b.far=far; b.dw=dw;
    b.hullPoly=[[sternTop[0],sternTop[1]-dw-1]].concat(far).concat([[bowTop[0],bowTop[1]-dw-1],[bowX,y+1]]).concat(sternCurve?[[wlS,y+1],[sternX-d*fb*0.15,y-fb*0.15],[sternX-d*fb*0.15,sternTop[1]+fb*0.5]]:[[sternX,y+1]]);
    return b; }
  function geom(ctx,s){ if(s.bt)return s.bt;
    var b={type:s.type||'song',x:s.x,y:s.y,len:s.len||160,dir:s.dir||1,z:s.z===undefined?s.y:s.z,moving:!!s.moving,mastFolded:!!s.mastFolded,
           ropeTo:s.ropeTo||null,tow:!!s.tow,towTo:s.towTo||null,clearance:s.clearance||0,parts:[],seats:[]};
    b.steel=b.type==='ferry'||b.type==='tug'||b.type==='barge'||b.type==='haishi';   // steel hulls take 淡花青 on the shaded side, wood a second 赭
    s.bt=b; var G=GEO[b.type]||GEO.song; G(ctx,b); return b; }

  // ---------------------------------------------------------------- volume primitives (D-10 (3): the turn of the cabin comes first)
  // the boat's oblique: a point one unit deeper into the boat rises one unit and shifts toward the stern (ctx.OBL[0] scaled by dir),
  // so every cabin and deck house shows three faces — the near side, the top turning away, and its AFT end face — the way the arch
  // module's boxes show their dir-side face; windows and weave are then laid on those faces, never on the outline
  function obl(ctx,b,dd){ return {dd:dd,ox:ctx.OBL[0]*dd*b.dir*2.6,oy:-dd}; }
  // the mat 舱棚 as a barrel lying along the boat: S(x,u) is the point on its surface at length x and turning angle u (0 = near
  // eave, 0.5 = crown, 1 = far eave); the silhouette along the length is the surface at U, just past the crown, so a thin band of
  // the top shows turning away; the aft end is closed by the full arch (its end face), the forward end by the arc up to U only
  function barrelGeom(ctx,b,cab){ if(cab.g)return cab.g; var d=b.dir, cx=(cab.x0+cab.x1)/2, rx=(cab.x1-cab.x0)/2, wh=cab.h*cab.wall, ry=cab.h-wh, i;
    var o=obl(ctx,b,b.dw*1.45), dd=o.dd, ox=o.ox;
    var yn=function(x){ return b.deckY(x)-b.dw*0.3; };                       // near foot: a strip of walkway shows in front of the wall
    var ryAt=function(x){ var q=(x-cx)/rx; return ry*(1-0.22*q*q); };       // the crown bows along the length; the ends keep most of the height
    // section (B5): a real round arch — a semi-ellipse from the near eave over the crown to the far eave. The turning angle u runs
    // 0 → 1 through θ = πu: height ry·sin θ, depth (1−cos θ)/2 of the barrel's width, so the near face rises steeply from the eave,
    // rounds continuously through the crown at u = 0.5 and turns down out of sight past U, the angle where the projected height peaks
    var v=function(u){ return (1-Math.cos(Math.PI*u))*0.5; };
    var S=function(x,u){ return [x+ox*v(u),yn(x)-wh-dd*v(u)-ryAt(x)*Math.sin(Math.PI*u)]; };
    var U=(Math.PI-Math.atan(2*ry/dd))/Math.PI;
    var xe=d>0?cab.x0:cab.x1, xo=d>0?cab.x1:cab.x0, n=10, P=[[xo,yn(xo)+1]];
    for(i=0;i<=n;i++)P.push(S(xo,U*i/n));
    for(i=1;i<=16;i++)P.push(S(xo+(xe-xo)*i/16,U));
    for(i=1;i<=n;i++)P.push(S(xe,U+(1-U)*i/n));
    P.push([xe+ox,yn(xe)-dd+1]); P.push([xe,yn(xe)+1]);
    // the shell's three faces as polygons (D-12 (5)): near face = wall + the near half of the arch up to the crown (u=UR=0.5);
    // top band = crown to the silhouette at U; end face = the aft arch closed by its foot. Stamped a step above the hull so the far
    // gunwale, the deck and anything standing behind the cabin are cut by the shell, not drawn through it
    var UR=0.5, along=function(u,rev){ var o=[], k; for(k=0;k<=16;k++)o.push(S(xo+(xe-xo)*(rev?16-k:k)/16,u)); return o; };
    var near=[[xo,yn(xo)+1],[xe,yn(xe)+1]].concat(along(UR,true));
    var topB=along(UR).concat(along(U,true));
    var endF=[[xe,yn(xe)+1]]; for(i=0;i<=14;i++)endF.push(S(xe,i/14)); endF.push([xe+ox,yn(xe)-dd+1]);
    cab.g={cx:cx,rx:rx,wh:wh,ry:ry,dd:dd,ox:ox,U:U,UR:UR,yn:yn,ryAt:ryAt,S:S,xe:xe,xo:xo,pts:P,near:near,topB:topB,endF:endF}; return cab.g; }
  function cabinPoly(ctx,b,cab){ return barrelGeom(ctx,b,cab).pts; }
  // a deck house as a box: h={x0,x1,top,y1?} (y1 = a flat foot for a house standing on a deck above the hull; else it stands on
  // the far deck line). Three faces: side, the top surface (a parallelogram of the boat's depth, slanted at both ends), the aft
  // end face. The house above it (cover=[x0,x1]) hides the middle of the top surface, so its far edge is drawn only fore and aft of it.
  function houseGeom(ctx,b,h){ if(h.g)return h.g; var d=b.dir, o=obl(ctx,b,b.dw*0.7), dd=o.dd, ox=o.ox, xe=d>0?h.x0:h.x1, xo=d>0?h.x1:h.x0;
    var foot=h.y1!==undefined?function(){ return h.y1; }:function(x){ return b.deckY(x)-b.dw; };
    h.g={dd:dd,ox:ox,xe:xe,xo:xo,foot:foot,top:h.top,pts:[[xo,foot(xo)],[xo,h.top],[xo+ox,h.top-dd],[xe+ox,h.top-dd],[xe+ox,foot(xe)-dd],[xe,foot(xe)]]}; return h.g; }
  function drawHouse(ctx,b,h,cover){ var g=houseGeom(ctx,b,h), z=b.z, C=ctx.C, t=h.top, xe=g.xe, xo=g.xo, ox=g.ox, dd=g.dd, fe=g.foot(xe), fo=g.foot(xo), lo=Math.min(xe,xo), hi=Math.max(xe,xo);
    rl(ctx,z,xo,fo,xo,t,0.7,195); rl(ctx,z,xe,fe,xe,t,0.85,215);                                     // forward edge structural; the aft corner (side meets end face) primary
    rl(ctx,z,lo-1,t,hi+1,t,0.8,205);                                                                  // the side's top edge, primary
    rl(ctx,z,xe,t,xe+ox,t-dd,0.75,205); rl(ctx,z,xo,t,xo+ox,t-dd,0.55,165);                          // the two slanted ends of the top surface
    var c0=cover?Math.min(cover[0],cover[1])+ox:null, c1=cover?Math.max(cover[0],cover[1])+ox:null, a=lo+ox, bq=hi+ox;
    if(cover){ if(c0>a+2)rl(ctx,z,a,t-dd,c0,t-dd,0.55,165); if(bq>c1+2)rl(ctx,z,c1,t-dd,bq,t-dd,0.55,165); } else rl(ctx,z,a,t-dd,bq,t-dd,0.55,165);   // far edge of the top
    rl(ctx,z,xe+ox,t-dd,xe+ox,fe-dd,0.6,175); rl(ctx,z,xe+ox,fe-dd,xe,fe,0.5,150);                  // far edge and bottom of the end face
    // the end face in 淡墨, the top surface left pale
    var u=function(x){ return (x-xe)/ox; };
    // (D-19): the shaded end face is 淡墨 0.28, and carries the material's second colour under it — 淡花青 0.2 on steel, 赭 0.2 on wood
    var endR={x0:Math.min(xe,xe+ox)-1,x1:Math.max(xe,xe+ox)+1,y0:t-dd-1,y1:Math.max(fe,fe-dd)+1,z:z,
      inside:function(x,y){ var v=u(x); return v>=0&&v<=1&&y>=t-dd*v&&y<=fe-dd*v; }};
    ctx.dabs(b.steel?ctx.ST.INDIGO:ctx.ST.OCHRE,endR,b.steel?C.huaqing:C.ochre2,0.2,2,1.6,null,{});
    ctx.dabs(ctx.ST.INDIGO,endR,C.danmo,0.46,1.6,1.5,null,{pool:true}); }   // renders at ~0.28
  // 花青 on a house's side face only (the top band stays pale)
  function sideWash(ctx,b,h,c,ink){ var g=houseGeom(ctx,b,h), lo=Math.min(g.xe,g.xo), hi=Math.max(g.xe,g.xo), t=h.top;
    ctx.dabs(ctx.ST.INDIGO,{x0:lo,x1:hi,y0:t,y1:Math.max(g.foot(lo),g.foot(hi)),z:b.z,inside:function(x,y){ return x>=lo&&x<=hi&&y>=t&&y<=g.foot(x); }},c,ink,3,3,null,{}); }
  var GEO={}, DRAW={};
  // 汴河 cargo boat: mat cabin over the middle, mast forward of it, 橹 and 舵 at the stern
  GEO.song=function(ctx,b){ hull(ctx,b,0.11,0.5,0.25); var L=b.len, d=b.dir, fb=b.fb, y=b.y;
    var c0=b.sternX+d*L*0.25, c1=b.sternX+d*L*0.66; if(c0>c1){ var t=c0; c0=c1; c1=t; }
    // barrel cabin: end walls 0.5·h, arched mat roof over them; a small square stern house with windows
    var H=fh(ctx,b), cab={x0:c0,x1:c1,h:Math.max(fb*1.25,H*0.8),wall:0.2}; b.cab=cab;
    b.house=ctx.R()<0.6?{x0:Math.min(b.sternX+d*L*0.06,b.sternX+d*L*0.19),x1:Math.max(b.sternX+d*L*0.06,b.sternX+d*L*0.19),h:Math.max(fb*0.9,H*0.65)}:null;
    b.mast={x:b.sternX+d*L*0.72,h:L*ctx.rr(0.5,0.6),furled:ctx.R()<0.65};
    b.lu={x:b.sternX+d*L*0.05}; b.rudder={x:b.sternX-d*L*0.015};
    var cabPoly=cabinPoly(ctx,b,cab), cg=cab.g;
    b.parts=[poly(ctx,b.hullPoly),poly(ctx,cabPoly)]; b.shell=[poly(ctx,cg.near),poly(ctx,cg.topB),poly(ctx,cg.endF)];
    if(b.house){ b.house.top=Math.min(b.deckY(b.house.x0),b.deckY(b.house.x1))-b.dw-b.house.h; b.parts.push(poly(ctx,houseGeom(ctx,b,b.house).pts)); }
    b.seats=[{x:b.bowX-d*L*0.08,y:b.deckY(b.bowX-d*L*0.08)+1,pose:'poling',dir:d,z:b.z,h:fh(ctx,b)},
             {x:b.sternX+d*L*0.09,y:b.deckY(b.sternX+d*L*0.09)+1,pose:'rowing',dir:-d,z:b.z,h:fh(ctx,b)}]; };

  function fh(ctx,b){ return 36*ctx.depth(b.y); }   // people on boats: ≈0.6 of a shore figure, so a 汴河 boat is 6–8 heads long
  function box(b,x0,x1,top,h){ var y0=b.deckY(x0)-b.dw, y1=b.deckY(x1)-b.dw; return [[x0,y0],[x0,top],[x1,top],[x1,y1]]; }
  function rect(x0,y0,x1,y1){ return [[x0,y0],[x1,y0],[x1,y1],[x0,y1]]; }
  function seat(ctx,b,x,pose,dir,dy){ return {x:x,y:b.deckY(x)-b.dw+(dy||0),pose:pose,dir:dir||b.dir,z:b.z,h:fh(ctx,b)}; }
  function span(b,a0,a1){ var x0=b.sternX+b.dir*b.len*a0, x1=b.sternX+b.dir*b.len*a1; return x0<x1?[x0,x1]:[x1,x0]; }

  // 轮渡: steel hull, straight sheer with a flared bow; lower deck house with a ruler window row, upper deck set back with
  // 栏杆 and lifebuoys, wheelhouse and funnel toward the bow, an open bow deck with e-bikes in a row, 朱砂 waterline band
  GEO.ferry=function(ctx,b){ hull(ctx,b,0.075,0.35,0.1,{bowK:1.45,sternK:1.15,sag:0.04,roundStern:true}); var L=b.len, d=b.dir, fb=b.fb, i;
    var lo=span(b,0.06,0.82), up=span(b,0.14,0.78), wh=span(b,0.6,0.76);
    var H=fh(ctx,b); b.lower={x0:lo[0],x1:lo[1],h:Math.max(fb*1.15,H*0.85)}; b.upper={x0:up[0],x1:up[1],h:Math.max(fb*1.0,H*0.8)}; b.wheel={x0:wh[0],x1:wh[1],h:Math.max(fb*1.0,H*0.95)};
    b.funnel={x:b.sternX+d*L*0.52,w:Math.max(fb*0.55,7),h:Math.max(fb*1.2,H*0.8)}; b.bikes=span(b,0.85,0.98); b.band=true;
    var top1=Math.min(b.deckY(lo[0]),b.deckY(lo[1]))-b.dw-b.lower.h, top2=top1-b.upper.h, top3=top2-b.wheel.h;
    b.top1=top1; b.top2=top2; b.top3=top3; b.lower.top=top1; b.upper.top=top2; b.upper.y1=top1; b.wheel.top=top3; b.wheel.y1=top2;
    b.parts=[poly(ctx,b.hullPoly),poly(ctx,houseGeom(ctx,b,b.lower).pts),poly(ctx,houseGeom(ctx,b,b.upper).pts),poly(ctx,houseGeom(ctx,b,b.wheel).pts),
             poly(ctx,rect(b.funnel.x-b.funnel.w/2,top2-b.funnel.h,b.funnel.x+b.funnel.w/2,top2))];
    // passengers keep to the top deck aft of the wheelhouse (the wheelhouse and funnel must stay in view), at uneven spacing
    b.seats=[]; var ps=span(b,0.15,0.48), n=Math.round((ps[1]-ps[0])/24); for(i=0;i<n;i++){ var x=ps[0]+(ps[1]-ps[0])*(i+0.5)/n+ctx.rr(-5,5); b.seats.push({x:x,y:top2+1,pose:ctx.R()<0.5?'ferryRail':'phone',dir:ctx.R()<0.5?1:-1,z:b.z,h:fh(ctx,b)}); }
    b.seats.push(seat(ctx,b,b.bikes[0]+(b.bikes[1]-b.bikes[0])*0.3,'rideEbike',d)); b.seats.push(seat(ctx,b,b.bikes[1]-6*d,'stand',-d)); };
  DRAW.ferry=function(ctx,b){ drawHull(ctx,b,1,true); var z=b.z, C=ctx.C, x, i, lo=b.lower, up=b.upper, wh=b.wheel;
    // lower deck house: two rails, window mullions every 6 px
    var t=b.top1; drawHouse(ctx,b,lo,[up.x0,up.x1]);                                              // lower deck house: side, top band, aft end face
    // the lower deck house is one mass: a solid wall band with 6–8 window openings cut into it (each opening holds a 淡墨 interior),
    // wall between them wider than the openings, the sill line under; the deck edge above throws a 1-px 淡墨 shadow
    var wins=batch(ctx,ctx.ST.BOATS,C.ink,z), sh=batch(ctx,ctx.ST.BOATS,C.danmo,z), wy=t+lo.h*0.28, wh4=Math.min(4.2,lo.h*0.4);
    function openings(x0,x1,yy,hh,n,al){ var pitch=(x1-x0)/n, ww=pitch*0.42; for(var j=0;j<n;j++){ var xa=x0+pitch*(j+0.5)-ww/2+ctx.rr(-0.6,0.6), xb=xa+ww;
        wins.push([[xa,yy],[xb,yy],[xb,yy+hh],[xa,yy+hh],[xa,yy]],0.5,al); sh.push([[xa+0.5,yy+hh*0.5],[xb-0.5,yy+hh*0.5]],(hh-0.9)/wk(ctx),ctx.ri(100,125)); } }   // the interior dark (D-19: 0.4)
    openings(lo.x0+3,lo.x1-3,wy,wh4,ctx.ri(6,8),160);
    rl(ctx,z,lo.x0,wy+wh4+1.2,lo.x1,wy+wh4+1.2,0.5,140);                                                                // sill
    sh.push([[lo.x0,t+1.2],[lo.x1,t+1.2]],1.0,150);                                                                     // shadow under the upper deck's edge
    // upper deck: floor line, one rail line with posts at 12 px, lifebuoys every 40 px; the upper cabin has fewer, wider openings
    var t2=b.top2; drawHouse(ctx,b,up,[Math.min(wh.x0,b.funnel.x-b.funnel.w/2),Math.max(wh.x1,b.funnel.x+b.funnel.w/2)]);
    var rh=Math.max(fb(b)*0.55,fh(ctx,b)*0.32); rl(ctx,z,up.x0,t2-rh,up.x1,t2-rh,0.55,170); for(x=up.x0+5;x<up.x1-2;x+=12)rl(ctx,z,x,t2,x,t2-rh,0.45,140);
    var rings=batch(ctx,ctx.ST.BOATS,C.ink,z); for(x=up.x0+20;x<up.x1-10;x+=40)rings.push(arcPts(x,t2-rh*0.5,3,3,0,2*Math.PI,12),0.7,190); rings.done();
    openings(up.x0+3,up.x1-3,t2+2.5,Math.min(3.8,(t-t2)*0.42),ctx.ri(5,7),150);
    sh.push([[up.x0,t2+1.2],[up.x1,t2+1.2]],1.0,150);
    // davits and a lifeboat hung under the upper deck's overhang, on the side away from the bikes
    var dvx=b.dir>0?lo.x0+(up.x0-lo.x0)*0.5+8:lo.x1-(lo.x1-up.x1)*0.5-8, dvy=t2-rh*0.3, lbw=Math.max(9,fb(b)*0.6), lbh=Math.max(2.4,fb(b)*0.18);
    var lby=t+lo.h*0.55; wins.push([[dvx-lbw*0.5,dvy],[dvx-lbw*0.5,dvy-3],[dvx-lbw*0.5+2,dvy-4.5]],0.6,175); wins.push([[dvx+lbw*0.5,dvy],[dvx+lbw*0.5,dvy-3],[dvx+lbw*0.5-2,dvy-4.5]],0.6,175);
    wins.push([[dvx-lbw*0.5+1,dvy-4.5],[dvx-lbw*0.4,lby]],0.4,120); wins.push([[dvx+lbw*0.5-1,dvy-4.5],[dvx+lbw*0.4,lby]],0.4,120);          // falls
    wins.push([[dvx-lbw*0.5,lby],[dvx-lbw*0.45,lby+lbh],[dvx,lby+lbh*1.3],[dvx+lbw*0.45,lby+lbh],[dvx+lbw*0.5,lby]],0.65,185); wins.push([[dvx-lbw*0.5,lby],[dvx+lbw*0.5,lby]],0.5,160);   // the boat, gunwale up
    wins.done();
    // wheelhouse and funnel with a cap ring
    var t3=b.top3; drawHouse(ctx,b,wh,null);
    // wheelhouse glazing: 3–4 tall panes, the aft face of the house shaded with 淡墨 so it reads as a box, not a row of bars
    var np=ctx.ri(3,4), pw=(wh.x1-wh.x0-6)/np; for(i=0;i<np;i++){ var px0=wh.x0+3+pw*i+0.8, px1=px0+pw-1.6; wins.push([[px0,t3+2],[px1,t3+2],[px1,t2-3],[px0,t2-3],[px0,t3+2]],0.5,150); }
    wins.done(); sh.push([[wh.x0,t3+1.2],[wh.x1,t3+1.2]],1.0,140); sh.done();
    var f=b.funnel, fl=f.x-f.w/2, fr=f.x+f.w/2, ft=t2-f.h, lean=b.dir*1.5; rl(ctx,z,fl,t2,fl+lean,ft,0.75,200); rl(ctx,z,fr,t2,fr+lean,ft,0.75,200); rl(ctx,z,fl+lean,ft,fr+lean,ft,0.7,190);
    rl(ctx,z,fl+lean*0.85-0.8,ft+2.2,fr+lean*0.85+0.8,ft+2.2,0.6,175); rl(ctx,z,fl+lean*0.85-0.8,ft+2.2,fl+lean*0.85-0.8,ft-0.2,0.6,175); rl(ctx,z,fr+lean*0.85+0.8,ft+2.2,fr+lean*0.85+0.8,ft-0.2,0.6,175);   // cap ring
    rl(ctx,z,fl+lean*0.6,ft+f.h*0.35,fr+lean*0.6,ft+f.h*0.35,0.45,120);                                                          // a band on the funnel
    var aftF=b.dir>0?[fl,fl+f.w*0.4]:[fr-f.w*0.4,fr];                                                                            // the funnel's aft side in shade
    ctx.dabs(ctx.ST.INDIGO,{x0:aftF[0]-2,x1:aftF[1]+2,y0:ft,y1:t2,z:z,inside:function(xx,yy){ var l=(yy-t2)/(ft-t2); return xx>=aftF[0]+lean*l&&xx<=aftF[1]+lean*l&&yy>=ft&&yy<=t2; }},C.danmo,0.2,2,1.6,null,{});
    // e-bikes on the open bow deck: two wheels r 1.6 and a tilted frame, every 6 px
    var bk=batch(ctx,ctx.ST.BOATS,C.ink,z); for(x=b.bikes[0]+3;x<b.bikes[1]-3;x+=6.5){ var dy=b.deckY(x)-b.dw-1.6; bk.push(arcPts(x-2,dy,1.6,1.6,0,2*Math.PI,8),0.5,170); bk.push(arcPts(x+2,dy,1.6,1.6,0,2*Math.PI,8),0.5,170); bk.push([[x-2,dy-1],[x+0.5,dy-4.5],[x+2.5,dy-1]],0.5,170); bk.push([[x+0.5,dy-4.5],[x-1,dy-5.5]],0.5,170); } bk.done();
    // colour: 花青 on the superstructure, 朱砂 band along the waterline
    sideWash(ctx,b,lo,C.huaqing,0.2); sideWash(ctx,b,up,C.huaqing,0.2); sideWash(ctx,b,wh,C.huaqing,0.2);
    redLine(ctx,b,b.wlS,b.y-2.2,b.bowX,b.y-2.2,2.2,120); };
  function fb(b){ return b.fb; }

  // 拖轮: high flared bow, three-storey wheelhouse stepping back, tyre fenders, towing bitts, a signal mast that folds aft
  GEO.tug=function(ctx,b){ hull(ctx,b,0.1,0.6,0.15,{bowK:1.7,sternK:1.05,sag:0.06,roundStern:true}); var L=b.len, d=b.dir, fb=b.fb, i;
    var s1=span(b,0.3,0.62), s2=span(b,0.34,0.58), s3=span(b,0.38,0.54), hh=Math.max(fb*0.62,fh(ctx,b)*0.55);
    var base=Math.min(b.deckY(s1[0]),b.deckY(s1[1]))-b.dw; b.st=[{x0:s1[0],x1:s1[1],y1:base,y0:base-hh},{x0:s2[0],x1:s2[1],y1:base-hh,y0:base-2*hh},{x0:s3[0],x1:s3[1],y1:base-2*hh,y0:base-3*hh}];
    b.mast={x:b.sternX+d*L*0.5,h:L*0.42,top:base-3*hh}; b.bitts=span(b,0.08,0.14); b.fenders=true;
    // D-12 (2): spec.clearance = the height above the waterline that nothing may exceed (the tug is passing under a bridge beam).
    // Storeys whose roof would rise above it are omitted, the last one kept is cut down so the lowered mast lying on its roof stays
    // under the line; the mast and its yard lie aft along the roof and over the aft deck on a crutch; the funnel is hinged down.
    if(b.clearance){ var lim=b.y-b.clearance, keep=[], j;
      for(j=0;j<3;j++){ var st=b.st[j]; if(st.y1<=lim+2.5)break; if(st.y0<lim+3.5){ st=b.st[j]; st.y0=lim+3.5; if(st.y1-st.y0<hh*0.45)break; keep.push(st); break; } keep.push(st); }
      b.st=keep; var roofY=keep.length?keep[keep.length-1].y0:base; b.mast.top=roofY; b.mastFolded=false; b.mastDown=true; }
    for(i=0;i<b.st.length;i++)b.st[i].top=b.st[i].y0; if(b.st.length)delete b.st[0].y1;             // the first storey stands on the deck, the others on the storey below
    b.parts=[poly(ctx,b.hullPoly)]; for(i=0;i<b.st.length;i++)b.parts.push(poly(ctx,houseGeom(ctx,b,b.st[i]).pts));
    if(b.mastDown){ var m=b.mast, mx0=m.x, my0=m.top-2.0, mx1=m.x-d*m.h, my1=m.top-1.2; b.mastEnd=[mx1,my1];
      b.parts.push(poly(ctx,[[mx0,my0-1],[mx0,my0+1],[mx1,my1+1],[mx1,my1-1]])); }
    else if(b.mastFolded){ var mf=b.mast, ex=mf.x-d*mf.h*0.86, ey=mf.top-mf.h*0.48; b.mastEnd=[ex,ey]; b.parts.push(poly(ctx,[[mf.x,mf.top],[mf.x+2,mf.top],[ex+2,ey],[ex,ey]])); }
    else b.parts.push(poly(ctx,rect(b.mast.x-1,b.mast.top-b.mast.h,b.mast.x+1,b.mast.top)));
    b.seats=[seat(ctx,b,b.sternX+d*L*0.2,'winch',d),seat(ctx,b,b.bowX-d*L*0.1,'pointing',-d)];
    if(b.mastFolded)b.seats.push(seat(ctx,b,b.sternX+d*L*0.7,'pointing',d));
    if(b.clearance){ for(i=0;i<b.seats.length;i++){ var sq=b.seats[i], room=sq.y-(b.y-b.clearance)-1; if(room<sq.h)sq.h=room; } } };
  DRAW.tug=function(ctx,b){ drawHull(ctx,b,1,true); var z=b.z, C=ctx.C, d=b.dir, x, i, k;
    var tw=batch(ctx,ctx.ST.BOATS,C.ink,z), tsh=batch(ctx,ctx.ST.BOATS,C.danmo,z);
    var ns=b.st.length; for(i=0;i<ns;i++){ var s=b.st[i], hh=(i===0?Math.min(b.deckY(s.x0),b.deckY(s.x1))-b.dw:s.y1)-s.y0; drawHouse(ctx,b,s,i<ns-1?[b.st[i+1].x0,b.st[i+1].x1]:null);
      // window openings with wall between: the wheelhouse on top gets the tall glazing, the storeys below small ports
      // each storey is a wall with a few openings (3–5), the wheelhouse on top with tall glazing; every opening holds a 淡墨 interior
      var wtop=i===ns-1&&!b.clearance, whh=wtop?Math.min(hh*0.55,5):Math.min(hh*0.36,3.4), wy=s.y0+(wtop?2:hh*0.3), nw=wtop?ctx.ri(3,4):ctx.ri(3,5), pitch=(s.x1-s.x0-4)/nw, ww=pitch*(wtop?0.6:0.42);
      for(k=0;k<nw;k++){ var xa=s.x0+2+pitch*(k+0.5)-ww/2, xb=xa+ww; tw.push([[xa,wy],[xb,wy],[xb,wy+whh],[xa,wy+whh],[xa,wy]],0.5,wtop?165:150); tsh.push([[xa+0.5,wy+whh*0.5],[xb-0.5,wy+whh*0.5]],(whh-0.9)/wk(ctx),ctx.ri(100,125)); }   // interiors dark (D-19: 0.4)
      if(!wtop)rl(ctx,z,s.x0,wy+whh+1,s.x1,wy+whh+1,0.45,130);
      tsh.push([[s.x0,s.y0+1.2],[s.x1,s.y0+1.2]],1.0,140); }                                       // 淡墨 under each deck edge
    tw.done(); tsh.done();
    // the aft face of the wheelhouse stack in shade, so the storeys read as boxes stepping back
    // fenders: tyres along the hull side
    var fd=batch(ctx,ctx.ST.BOATS,C.ink,z), fx=[]; for(x=b.sternX+d*12;d>0?x<b.bowX-14:x>b.bowX+14;x+=d*14){ var yy=b.y-b.fb*0.28; fd.push(arcPts(x,yy,2.8,2.8,0,2*Math.PI,10),1.1,205); fd.push([[x,b.deckY(x)-0.5],[x,yy-2.8]],0.5,150); fx.push(x); } fd.done(); b.fenderX=fx;
    // towing bitts and the winch drum at the stern
    var bt=b.bitts; rl(ctx,z,bt[0],b.deckY(bt[0])-b.dw,bt[0],b.deckY(bt[0])-b.dw-5,1.2,210); rl(ctx,z,bt[1],b.deckY(bt[1])-b.dw,bt[1],b.deckY(bt[1])-b.dw-5,1.2,210);
    var wx=b.sternX+d*b.len*0.22, wy=b.deckY(wx)-b.dw-3; var wb=batch(ctx,ctx.ST.BOATS,C.ink,z); wb.push(arcPts(wx,wy,3,3,0,2*Math.PI,12),0.7,190); wb.push(arcPts(wx,wy,1.2,1.2,0,2*Math.PI,8),0.6,170); wb.done();
    coil(ctx,b,b.sternX+d*b.len*0.3,b.deckY(b.sternX+d*b.len*0.3)-b.dw*0.4,3);
    // towline: slack from the stern bitts to a barge astern; when the barge is ahead the tug pushes and a tight lashing runs from the bow
    if(b.tow&&b.towTo){ var ahead=(b.towTo[0]-b.bowX)*d>-4;
      if(ahead)rope(ctx,z,[b.bowX-d*3,b.deckY(b.bowX-d*3)-b.dw-2],b.towTo,0.03,0.6,180); else rope(ctx,z,[(bt[0]+bt[1])/2,b.deckY(bt[0])-b.dw-4],b.towTo,0.12,0.65,185); }
    // signal mast: upright with a yard; folded aft at ~45° with the rope running to the winch; or, under a clearance, LOWERED —
    // lying aft along the deckhouse roof in its tabernacle, the yard beside it, the far end on a crutch over the aft deck, the
    // halyard coiled at the foot; the funnel hinged down: a stub on the roof and the stack lying beside the mast with its cap aft
    var m=b.mast; if(b.mastDown){ var e=b.mastEnd, my=m.top-2.0, mx1=e[0];
      rl(ctx,z,m.x+d*1.2,m.top+0.3,m.x+d*1.2,my-1.2,0.9,205); rl(ctx,z,m.x-d*1.2,m.top+0.3,m.x-d*1.2,my-1.2,0.9,205);        // tabernacle: two cheeks the mast pivots in
      rl(ctx,z,m.x,my-0.2,mx1,e[1]-0.2,1.1,215); rl(ctx,z,m.x,my+0.8,mx1,e[1]+0.8,0.6,150);                                       // the mast lying flat along the roof, its shaded underside
      var ydx=m.x-d*m.h*0.12, ydx1=m.x-d*m.h*0.72; rl(ctx,z,ydx,m.top-0.6,ydx1,m.top-0.4,0.7,180);                              // the yard beside it, on the near side of the roof
      var cx1=m.x-d*m.h*0.92, cy1=b.deckY(cx1)-b.dw; rl(ctx,z,cx1-1.5,cy1,cx1,e[1]+0.8,0.6,180); rl(ctx,z,cx1+1.5,cy1,cx1,e[1]+0.8,0.6,180);   // the crutch on the aft deck
      rl(ctx,z,cx1-2,e[1]-1.5,cx1+2,e[1]+2.2,0.4,120);                                                                          // a lashing over the mast at the crutch
      coil(ctx,b,m.x+d*6,m.top-1.0,2.4);                                                                                        // the halyard coiled at the foot
      var fs=m.x-d*8, fw=Math.max(fb(b)*0.5,5);                                                                                 // the funnel hinged down: a short stub ...
      rl(ctx,z,fs-fw/2,m.top,fs-fw/2,m.top-2.4,0.75,200); rl(ctx,z,fs+fw/2,m.top,fs+fw/2,m.top-2.4,0.75,200); rl(ctx,z,fs-fw/2-0.6,m.top-2.4,fs+fw/2+0.6,m.top-2.4,0.6,170);
      var cr=batch(ctx,ctx.ST.BOATS,C.ink,z); cr.push(arcPts(fs-d*(fw*0.5+4),m.top-0.9,fw*0.5,1.1,0,2*Math.PI,12),0.6,175); cr.push(arcPts(fs-d*(fw*0.5+4),m.top-0.9,fw*0.32,0.7,0,2*Math.PI,10),0.5,140); cr.done();   // ... and its cap lying on the roof beside it
      ctx.pline(ctx.ST.BOATS,Math.max(e[0],wx),C.ink,150,0.45,[[e[0],e[1]+1],[(e[0]+wx)/2,(e[1]+wy)/2+4],[wx,wy-3]],true); }   // slack rope from the mast end to the winch
    else if(b.mastFolded){ var ef=b.mastEnd; rl(ctx,z,m.x,m.top,ef[0],ef[1],1.1,210); rl(ctx,z,m.x-d*4,m.top,m.x+d*4,m.top,0.9,200);
      var yd=[m.x-d*m.h*0.66,m.top-m.h*0.37]; rl(ctx,z,yd[0]-6,yd[1]-2,yd[0]+6,yd[1]+2,0.7,180);   // the yard, now slanting with the mast
      ctx.pline(ctx.ST.BOATS,Math.max(ef[0],wx),C.ink,150,0.45,[[ef[0],ef[1]],[(ef[0]+wx)/2,(ef[1]+wy)/2+6],[wx,wy-3]],true); }   // slack rope to the winch
    else { rl(ctx,z,m.x,m.top,m.x,m.top-m.h,1.0,210); rl(ctx,z,m.x-7,m.top-m.h*0.78,m.x+7,m.top-m.h*0.78,0.7,185); rl(ctx,z,m.x,m.top-m.h,m.x+d*10,m.top-m.h+16,0.4,110); }
    for(i=0;i<b.st.length;i++)sideWash(ctx,b,b.st[i],C.huaqing,0.22);
    redLine(ctx,b,b.wlS,b.y-1.8,b.bowX,b.y-1.8,1.8,110); };

  // 驳船: low flat hull, cargo under tarps, small stern cabin; no mast
  GEO.barge=function(ctx,b){ hull(ctx,b,0.055,0.2,0.1,{bowK:1.1,sternK:1.1,sag:0.02}); var L=b.len, d=b.dir, fb=b.fb, i, j;
    // 3–5 separate low mounds of unequal width and height, a gap of 2–3 px of bare deck between neighbours (B6: not one continuous
    // wave); the mound nearest the viewer — the one at the hull's centre-front — is the one real covered load (b.load): two or three
    // goods under its tarp push it up into blunt bulges, 3–4 tie ropes cross it at unequal spacing and press the top line down,
    // and its tarp hangs down over the walkway to BEHIND the near gunwale, so the gunwale line cuts its foot
    var n=ctx.ri(3,5), a0=0.18, a1=0.9, m=[], wts=[], sum=0, li=n===3?1:ctx.ri(1,n-2); for(i=0;i<n;i++){ wts.push(i===li?ctx.rr(1.7,2.2):ctx.rr(0.7,1.3)); sum+=wts[i]; }   // the load is the widest, at the hull's centre
    var ta=a0, gap=ctx.rr(2,3); for(i=0;i<n;i++){ var tb=ta+(a1-a0)*wts[i]/sum, s=span(b,ta,tb); m.push({x0:s[0]+gap/2,x1:s[1]-gap/2,h:L*ctx.rr(0.03,0.05)}); ta=tb; }
    var deckAt=function(xx){ return b.deckY(xx)-b.dw; };
    var ld=m[li]; ld.load=true; ld.h*=1.7; ld.goods=[]; ld.ties=[];
    var ng=ld.x1-ld.x0>42?ctx.ri(2,3):2, gw=[], gs=0; for(j=0;j<ng;j++){ gw.push(ctx.rr(0.7,1.4)); gs+=gw[j]; }
    var gx=ld.x0+1.5, gL=ld.x1-ld.x0-3, tallest=ctx.ri(0,ng-1); for(j=0;j<ng;j++){ var w=gL*gw[j]/gs; var gr=w*0.5*1.05; ld.goods.push({c:gx+w*0.5,r:gr,t:Math.min(ld.h,gr*1.3)*(j===tallest?1:ctx.rr(0.68,0.88))}); gx+=w; }
    var nt=ctx.ri(3,4), tw=[], ts=0; for(j=0;j<nt;j++){ tw.push(ctx.rr(0.6,1.5)); ts+=tw[j]; }
    var tx=ld.x0+3, tL=ld.x1-ld.x0-6; for(j=0;j<nt;j++){ var wt=tL*tw[j]/ts; ld.ties.push(tx+wt*0.5); tx+=wt; }
    // the load's top line: blunt bulges (1−u⁴) over each good, the tarp stretched between neighbours as a chord at 0.8, pressed down
    // 0.7 px under every rope; the other mounds: one raised cosine each, dropping to the deck at both ends
    var loadH=function(xx){ var h=0, g=ld.goods, k; for(k=0;k<g.length;k++){ var u=(xx-g[k].c)/g[k].r; if(u>-1&&u<1){ var v=g[k].t*(1-u*u*u*u*u*u); if(v>h)h=v; } }
      for(k=0;k<g.length-1;k++){ if(xx>=g[k].c&&xx<=g[k+1].c){ var t=(xx-g[k].c)/(g[k+1].c-g[k].c), ch=(g[k].t+(g[k+1].t-g[k].t)*t)*0.8; if(ch>h)h=ch; } }
      var e=Math.min(xx-ld.x0,ld.x1-xx)/3; if(e<1)h*=Math.max(0.15,e);
      for(k=0;k<ld.ties.length;k++){ var q=(xx-ld.ties[k])/1.6; h-=0.5*Math.exp(-q*q); } return Math.max(h,0.6); };
    var moundH=function(mm,xx){ if(mm.load)return loadH(xx); var cxm=(mm.x0+mm.x1)/2, rxm=(mm.x1-mm.x0)/2, u=(xx-cxm)/rxm; return u>-1&&u<1?mm.h*(0.5+0.5*Math.cos(u*Math.PI)):0; };
    var tarpH=function(xx){ var h=0; for(var k=0;k<n;k++){ var v=moundH(m[k],xx); if(v>h)h=v; } return h; };
    b.mounds=m; b.load=ld; b.tarpH=tarpH; b.tarpX=[m[0].x0,m[n-1].x1]; b.tarp=[]; b.valleys=[]; for(i=1;i<n;i++)b.valleys.push((m[i-1].x1+m[i].x0)/2);
    var cb=span(b,0.03,0.15); b.cabin={x0:cb[0],x1:cb[1],h:Math.max(fb*1.3,fh(ctx,b)*0.7)};
    b.parts=[poly(ctx,b.hullPoly)];
    for(i=0;i<n;i++){ var mm=m[i], pts=[], xx, st=mm.load?1.5:2; for(xx=mm.x0;xx<=mm.x1+0.01;xx+=st)pts.push([xx,deckAt(xx)-moundH(mm,xx)]); if(pts[pts.length-1][0]<mm.x1)pts.push([mm.x1,deckAt(mm.x1)-moundH(mm,mm.x1)]);
      mm.top=pts; if(mm.load){ mm.face=[[mm.x0,b.deckY(mm.x0)-0.7]].concat(pts).concat([[mm.x1,b.deckY(mm.x1)-0.7]]); b.parts.push(poly(ctx,mm.face)); }
      else b.parts.push(poly(ctx,[[mm.x0,deckAt(mm.x0)+1]].concat(pts).concat([[mm.x1,deckAt(mm.x1)+1]]))); }
    b.tarp=ld.top; b.shell=[poly(ctx,ld.face)];                       // the load's near face occludes the far gunwale, the deck planks and whatever stands behind it
    var ct=Math.min(b.deckY(cb[0]),b.deckY(cb[1]))-b.dw-b.cabin.h; b.cabin.top=ct; b.parts.push(poly(ctx,houseGeom(ctx,b,b.cabin).pts)); b.cabinTop=ct;
    b.seats=[seat(ctx,b,b.sternX+d*L*0.2,'stand',d)]; };
  DRAW.barge=function(ctx,b){ drawHull(ctx,b,1,true); var z=b.z, C=ctx.C, d=b.dir, i, k, x;
    var wv=batch(ctx,ctx.ST.BOATS,C.ink,z), deckAt=function(xx){ return b.deckY(xx)-b.dw; };
    // the simpler mounds: one hump each at primary, 2–4 fold lines leaning off the crest, a tie at each end down past the gunwale,
    // a short hem where the tarp is lashed at the deck; 赭石 over the whole hump
    for(i=0;i<b.mounds.length;i++){ var m=b.mounds[i]; if(m.load)continue; var cx=(m.x0+m.x1)/2, rx=(m.x1-m.x0)/2, nf=ctx.ri(2,4);
      bl(ctx,z,m.top,0.6,200);
      for(k=0;k<nf;k++){ var fx=cx+rx*ctx.rr(-0.6,0.6), top=deckAt(fx)-b.tarpH(fx)+ctx.rr(1,2.5), ex=fx+(fx-cx)*ctx.rr(0.15,0.4), by=deckAt(ex)-ctx.rr(1,3);
        wv.push([[fx,top],[fx+(ex-fx)*0.5+ctx.rr(-0.6,0.6),(top+by)/2],[ex,by]],0.4,ctx.ri(85,110)); }
      var te=[m.x0+1.5,m.x1-1.5]; for(k=0;k<2;k++){ var tx=te[k]; wv.push([[tx,deckAt(tx)-b.tarpH(tx)-0.5],[tx+ctx.rr(-0.6,0.6),deckAt(tx)+1.5],[tx+ctx.rr(-1.2,1.2),deckAt(tx)+b.dw+3]],0.45,150); }
      var hem=[]; for(x=m.x0+1;x<=m.x1-1;x+=5)hem.push([x,deckAt(x)-1.4+Math.sin(x*0.7)*0.25]); wv.push(hem,0.4,100);
      var pp=b.parts[i+1]; ctx.dabs(ctx.ST.OCHRE,{x0:pp.x0,x1:pp.x1,y0:pp.y0,y1:pp.y1,z:z,inside:pp.inside,edge:pp.edge},C.ochre2,0.3,3,3,null,{}); }
    wv.done();
    // the covered load (B6): its strokes a step above the hull. Top line primary with the blunt bulges of the goods beneath; the fore
    // and aft edges of the tarp fall to the gunwale line and stop there (the foot hangs behind the near gunwale, never drawn);
    // the ropes ride over the bulge and go on past the gunwale to the hull side; under each rope short 淡墨 creases pulled toward it
    var ld=b.load, zl=z+1, lv=batch(ctx,ctx.ST.BOATS,C.ink,zl), cr=batch(ctx,ctx.ST.BOATS,C.danmo,zl), topAt=function(xx){ return deckAt(xx)-b.tarpH(xx); };
    bl(ctx,zl,ld.top,0.7,210);
    bl(ctx,zl,[[ld.x0,topAt(ld.x0)],[ld.x0-0.3,(topAt(ld.x0)+b.deckY(ld.x0))/2],[ld.x0,b.deckY(ld.x0)-0.6]],0.55,175);
    bl(ctx,zl,[[ld.x1,topAt(ld.x1)],[ld.x1+0.3,(topAt(ld.x1)+b.deckY(ld.x1))/2],[ld.x1,b.deckY(ld.x1)-0.6]],0.55,175);
    for(k=0;k<ld.ties.length;k++){ var tx=ld.ties[k], ty=topAt(tx), gy=b.deckY(tx), bend=ctx.rr(0.5,1.1)*(ctx.R()<0.5?1:-1);
      lv.push([[tx,ty-0.6],[tx+bend,ty+(gy-ty)*0.45],[tx+bend*0.5,gy-0.6]],0.5,170);                                       // over the face to the gunwale
      lv.push([[tx+bend*0.5,gy+0.6],[tx+bend*0.5+ctx.rr(-0.8,0.8),gy+b.dw*0.6+2.5]],0.45,150);                              // and on down the hull side
      var nc=ctx.ri(2,3); for(i=0;i<nc;i++){ var sg=ctx.R()<0.5?1:-1, cy=ty+2+(gy-2-ty-2)*ctx.rr(0.1,0.9), cl=ctx.rr(3,5.5);
        cr.push([[tx+sg*1.1,cy],[tx+sg*(1.1+cl*0.55),cy+cl*0.35],[tx+sg*(1.1+cl),cy+cl*0.7]],0.4,ctx.ri(95,125)); } }
    // the fold where the tarp is stretched between two goods: one short line from the saddle down the face
    for(k=0;k<ld.goods.length-1;k++){ var sx=(ld.goods[k].c+ld.goods[k+1].c)/2, sy=topAt(sx); lv.push([[sx,sy+0.8],[sx+d*0.6,sy+(b.deckY(sx)-sy)*0.5]],0.4,105); }
    lv.done(); cr.done();
    // colour by face: the slope of each good turning toward the stern takes 淡墨, the slope toward the bow 赭石; the face is the
    // region between the top line and the gunwale
    var fp=b.parts[b.mounds.indexOf(ld)+1], face={x0:fp.x0,x1:fp.x1,y0:fp.y0,y1:fp.y1,z:zl,inside:function(xx,yy){ return xx>=ld.x0&&xx<=ld.x1&&yy>=topAt(xx)&&yy<=b.deckY(xx)-0.8; }};
    var aft=function(xx){ var g=ld.goods, bi=0, bd=1e9; for(var q=0;q<g.length;q++){ var dd=Math.abs(xx-g[q].c); if(dd<bd){ bd=dd; bi=q; } } return (xx-g[bi].c)*d<0; };
    ctx.dabs(ctx.ST.INDIGO,face,C.danmo,0.2,2,1.6,function(xx,yy){ return aft(xx); },{});
    ctx.dabs(ctx.ST.OCHRE,face,C.ochre2,0.3,3,3,function(xx,yy){ return !aft(xx); },{});
    var c=b.cabin, ct=b.cabinTop; drawHouse(ctx,b,c,null);
    var wx=(c.x0+c.x1)/2; rl(ctx,z,wx-2.5,ct+3,wx+2.5,ct+3,0.5,150); rl(ctx,z,wx-2.5,ct+3,wx-2.5,ct+8,0.5,150); rl(ctx,z,wx+2.5,ct+3,wx+2.5,ct+8,0.5,150); rl(ctx,z,wx-2.5,ct+8,wx+2.5,ct+8,0.5,150);
    ctx.dabs(ctx.ST.INDIGO,{x0:wx-2.2,x1:wx+2.2,y0:ct+3.3,y1:ct+7.7,z:z,inside:function(xx,yy){ return xx>=wx-2.2&&xx<=wx+2.2&&yy>=ct+3.3&&yy<=ct+7.7; }},C.danmo,0.55,1.1,1.2,null,{pool:true});   // the window's interior dark (D-19)
    sideWash(ctx,b,c,C.huaqing,0.2); };

  // 楼船: three railed decks stepping inward, a hipped roof with lifted corners on top, a short funnel aft; no smoke
  GEO.louchuan=function(ctx,b){ hull(ctx,b,0.08,0.4,0.2,{bowK:1.25,sternK:1.25,sag:0.06,roundStern:true}); var L=b.len, d=b.dir, fb=b.fb, i;
    var dh=Math.max(fb*0.95,fh(ctx,b)*0.85), base=Math.min(b.deckY(b.sternX+d*L*0.1),b.deckY(b.sternX+d*L*0.9))-b.dw, decks=[];
    var A=[[0.1,0.9],[0.16,0.84],[0.24,0.76]]; for(i=0;i<3;i++){ var s=span(b,A[i][0],A[i][1]); decks.push({x0:s[0],x1:s[1],y1:base-dh*i,y0:base-dh*(i+1)}); }
    // the top deck is open: a hipped canopy on posts stands over it, clearing the passengers' heads; the roof is never a floor
    b.decks=decks; var top=base-3*dh, canopy=fh(ctx,b)*1.12; b.roof={x0:decks[2].x0-6,x1:decks[2].x1+6,y:top-canopy,h:Math.max(fb*0.7,fh(ctx,b)*0.45),posts:canopy}; b.funnel={x:b.sternX+d*L*0.22,w:fb*0.35,h:fb*0.5,y:decks[1].y0};
    for(i=0;i<3;i++){ decks[i].top=decks[i].y0; if(i===0)delete decks[i].y1; }
    b.parts=[poly(ctx,b.hullPoly)]; for(i=0;i<3;i++)b.parts.push(poly(ctx,houseGeom(ctx,b,decks[i]).pts));
    b.parts.push(poly(ctx,[[b.roof.x0,b.roof.y],[b.roof.x0+6,b.roof.y-b.roof.h],[b.roof.x1-6,b.roof.y-b.roof.h],[b.roof.x1,b.roof.y]]));
    // seats: on decks 1–2 people stand on the deck floor (the deck's lower line) behind its rail; on the top deck they stand on the
    // deck in front of the roof — the roof is a canopy over the top deck, nobody stands on it
    b.seats=[]; for(i=0;i<3;i++){ var dk=decks[i], n=Math.round((dk.x1-dk.x0)/30)-(i===2?1:0); for(var k=0;k<n;k++){ var x=dk.x0+(dk.x1-dk.x0)*(k+0.5)/n+ctx.rr(-6,6); b.seats.push({x:x,y:dk.y0+1,pose:ctx.R()<0.4?'photographer':(ctx.R()<0.5?'ferryRail':'tourist'),dir:ctx.R()<0.5?1:-1,z:b.z,h:fh(ctx,b)}); } } };
  DRAW.louchuan=function(ctx,b){ drawHull(ctx,b,2,true); var z=b.z, C=ctx.C, i, x;
    for(i=0;i<3;i++){ var dk=b.decks[i], dy1=i===0?Math.min(b.deckY(dk.x0),b.deckY(dk.x1))-b.dw:dk.y1, rh=(dy1-dk.y0)*0.42;
      drawHouse(ctx,b,dk,i<2?[b.decks[i+1].x0,b.decks[i+1].x1]:[b.roof.x0+5,b.roof.x1-5]);
      rl(ctx,z,dk.x0,dk.y0+rh,dk.x1,dk.y0+rh,0.55,165); for(x=dk.x0+3;x<dk.x1-1;x+=6)rl(ctx,z,x,dk.y0,x,dk.y0+rh,0.5,150);   // railing on every deck
      if(i===0)for(x=dk.x0+4;x<dk.x1-2;x+=6)rl(ctx,z,x,dk.y0+rh+2,x,dy1-2,0.45,120);                                              // lower deck windows
      else for(x=dk.x0+5;x<dk.x1-3;x+=9)rl(ctx,z,x,dk.y0+rh+1.5,x,dy1-1.5,0.45,110);
      (function(x0,x1,ya,yb){ ctx.dabs(ctx.ST.INDIGO,{x0:x0,x1:x1,y0:ya,y1:yb,z:z,inside:function(xx,yy){ return xx>=x0&&xx<=x1&&yy>=ya&&yy<=yb; }},C.danmo,i===0?0.5:0.36,1.4,1.4,null,{pool:true}); })(dk.x0+3,dk.x1-2,dk.y0+rh+2.2,dy1-2.2); }   // the interior behind the glazing, deepest on the lower deck (D-19)
    var r=b.roof, td=b.decks[2], trh=(td.y1-td.y0)*0.42; rl(ctx,z,td.x0,td.y0-trh,td.x1,td.y0-trh,0.55,165); for(x=td.x0+3;x<td.x1-1;x+=6)rl(ctx,z,x,td.y0,x,td.y0-trh,0.5,150);   // top-deck balustrade
    var px=[r.x0+5,(r.x0+r.x1)/2,r.x1-5]; for(i=0;i<3;i++)rl(ctx,z,px[i],td.y0,px[i],r.y,0.7,190);                                                       // canopy posts
    bl(ctx,z,[[r.x0,r.y+0.5],[r.x0+3,r.y-r.h*0.3],[r.x0+6,r.y-r.h]],0.8,215); bl(ctx,z,[[r.x1,r.y+0.5],[r.x1-3,r.y-r.h*0.3],[r.x1-6,r.y-r.h]],0.8,215);
    rl(ctx,z,r.x0+6,r.y-r.h,r.x1-6,r.y-r.h,0.85,215); rl(ctx,z,r.x0-2,r.y,r.x1+2,r.y,0.75,200); rl(ctx,z,r.x0,r.y+2,r.x1,r.y+2,0.5,140);   // ridge, eave, eave board
    var sh=batch(ctx,ctx.ST.BOATS,C.danmo,z); for(i=0;i<3;i++)sh.push([[b.decks[i].x0,b.decks[i].y0+1.2],[b.decks[i].x1,b.decks[i].y0+1.2]],1.0,140); sh.push([[r.x0,r.y+3.4],[r.x1,r.y+3.4]],1.0,120); sh.done();
    var rw=batch(ctx,ctx.ST.BOATS,C.ink,z); for(x=r.x0+8;x<r.x1-6;x+=2.2)rw.push([[x,r.y-r.h+1],[x+(x-(r.x0+r.x1)/2)*0.04,r.y-1]],0.4,ctx.ri(60,95)); rw.done();   // 瓦垄
    var f=b.funnel; rl(ctx,z,f.x-f.w/2,f.y,f.x-f.w/2,f.y-f.h,0.7,195); rl(ctx,z,f.x+f.w/2,f.y,f.x+f.w/2,f.y-f.h,0.7,195); rl(ctx,z,f.x-f.w/2-1,f.y-f.h,f.x+f.w/2+1,f.y-f.h,0.7,190);
    for(i=1;i<=3;i++){ var pp=b.parts[i]; ctx.dabs(ctx.ST.OCHRE,{x0:pp.x0,x1:pp.x1,y0:pp.y0,y1:pp.y1,z:z,inside:pp.inside,edge:pp.edge},C.ochre,0.22,3,3,null,{}); }
    var rp=b.parts[4]; ctx.dabs(ctx.ST.INDIGO,{x0:rp.x0,x1:rp.x1,y0:rp.y0,y1:rp.y1,z:z,inside:rp.inside,edge:rp.edge},C.huaqing,0.3,3,3,null,{});
    redLine(ctx,b,b.wlS,b.y-1.6,b.bowX,b.y-1.6,1.6,100); };

  // 海事艇: small fast launch, sharply raked bow, low cabin with a raked windscreen, a short mast with a light
  GEO.haishi=function(ctx,b){ hull(ctx,b,0.11,1.3,0.1,{bowK:1.5,sternK:1.0,sag:0.05,roundStern:true}); var L=b.len, d=b.dir, fb=b.fb;
    var s=span(b,0.3,0.68); var ch=Math.max(fb*0.9,fh(ctx,b)*0.6), top=Math.min(b.deckY(s[0]),b.deckY(s[1]))-b.dw-ch; b.cabin={x0:s[0],x1:s[1],top:top,h:ch};
    b.mast={x:b.sternX+d*L*0.45,top:top,h:fb*1.1};
    b.parts=[poly(ctx,b.hullPoly),poly(ctx,box(b,s[0],s[1],top,0))]; b.seats=[seat(ctx,b,b.sternX+d*L*0.15,'stand',d)]; };
  DRAW.haishi=function(ctx,b){ drawHull(ctx,b,1,true); var z=b.z, C=ctx.C, c=b.cabin, d=b.dir, x;
    var fx=d>0?c.x1:c.x0, bx=d>0?c.x0:c.x1; rl(ctx,z,bx,b.deckY(bx)-b.dw,bx,c.top,0.7,195); rl(ctx,z,fx,b.deckY(fx)-b.dw,fx+d*4,c.top,0.7,195); rl(ctx,z,bx-1,c.top,fx+d*4,c.top,0.8,205);
    for(x=c.x0+4;x<c.x1-2;x+=5)rl(ctx,z,x,c.top+2,x,c.top+c.h*0.55,0.45,130); rl(ctx,z,c.x0,c.top+c.h*0.55,c.x1,c.top+c.h*0.55,0.5,150);
    ctx.dabs(ctx.ST.INDIGO,{x0:c.x0+2,x1:c.x1-1,y0:c.top+2,y1:c.top+c.h*0.55,z:z,inside:function(xx,yy){ return xx>=c.x0+2.5&&xx<=c.x1-1.5&&yy>=c.top+2.4&&yy<=c.top+c.h*0.55-0.4; }},C.danmo,0.5,1.3,1.3,null,{pool:true});   // the glazing dark (D-19)
    var m=b.mast; rl(ctx,z,m.x,m.top,m.x,m.top-m.h,0.8,200); rl(ctx,z,m.x-4,m.top-m.h*0.7,m.x+4,m.top-m.h*0.7,0.6,170);
    var pp=b.parts[1]; ctx.dabs(ctx.ST.INDIGO,{x0:pp.x0,x1:pp.x1,y0:pp.y0,y1:pp.y1,z:z,inside:pp.inside,edge:pp.edge},C.huaqing,0.25,3,3,null,{});
    redLine(ctx,b,b.sternX+d*b.len*0.1,b.y-b.fb*0.9,b.bowX-d*b.len*0.12,b.y-b.fb*0.9,2.4,130); };   // the 海事 stripe

  // 划子: a tiny open rowboat, one plank line, two thwarts, a pair of oars
  GEO.huazi=function(ctx,b){ hull(ctx,b,0.13,0.5,0.4,{bowK:1.25,sternK:1.2,sag:0.2}); var L=b.len, d=b.dir;
    b.parts=[poly(ctx,b.hullPoly)]; b.oar={x:b.sternX+d*L*0.55}; b.seats=[seat(ctx,b,b.sternX+d*L*0.5,'rowing',d,2)]; };
  DRAW.huazi=function(ctx,b){ drawHull(ctx,b,1,false); var z=b.z, d=b.dir, L=b.len, i;
    for(i=0;i<2;i++){ var x=b.sternX+d*L*(0.32+0.36*i); rl(ctx,z,x,b.deckY(x)-0.5,x+d*1.5,b.deckY(x)-b.dw+0.5,0.55,170); }
    var ox=b.oar.x; bl(ctx,z,[[ox,b.deckY(ox)-b.dw-6],[ox+d*L*0.28,b.y+5]],0.7,205); bl(ctx,z,[[ox-d*L*0.05,b.deckY(ox)-2],[ox-d*L*0.05+d*L*0.3,b.y+6]],0.6,170); };

  // 汉江渡船: flat open Song hull with a rail along the far gunwale, a flat awning on four posts amidships, e-bikes at one end
  GEO.duchuan=function(ctx,b){ hull(ctx,b,0.09,0.4,0.3,{bowK:1.15,sternK:1.25,sag:0.1}); var L=b.len, d=b.dir, fb=b.fb, i;
    var aw=span(b,0.3,0.62); var top=Math.min(b.deckY(aw[0]),b.deckY(aw[1]))-b.dw-Math.max(fb*1.4,fh(ctx,b)*1.05); b.awning={x0:aw[0],x1:aw[1],top:top};
    b.bikes=span(b,0.08,0.26); b.lu={x:b.sternX+d*L*0.05}; b.rudder={x:b.sternX-d*L*0.015};
    b.parts=[poly(ctx,b.hullPoly),poly(ctx,rect(aw[0],top-2,aw[1],top+2))];
    b.seats=[seat(ctx,b,b.sternX+d*L*0.06,'rowing',-d)]; var n=ctx.ri(4,6); for(i=0;i<n;i++){ var x=b.sternX+d*L*(0.3+0.6*i/n)+d*4; b.seats.push(seat(ctx,b,x,ctx.R()<0.35?'phone':(ctx.R()<0.5?'stand':'leanRail'),ctx.R()<0.5?1:-1)); }
    b.seats.push(seat(ctx,b,(b.bikes[0]+b.bikes[1])/2,'rideEbike',d)); };
  DRAW.duchuan=function(ctx,b){ drawHull(ctx,b,2,true); var z=b.z, C=ctx.C, d=b.dir, x, i;
    // rail along the far gunwale
    for(i=1;i<b.far.length-1;i++)rl(ctx,z,b.far[i][0],b.far[i][1],b.far[i][0],b.far[i][1]-5,0.5,160); var rail=[]; for(i=0;i<b.far.length;i++)rail.push([b.far[i][0],b.far[i][1]-5]); bl(ctx,z,rail,0.5,165);
    var a=b.awning; rl(ctx,z,a.x0-2,a.top,a.x1+2,a.top,0.8,205); rl(ctx,z,a.x0-2,a.top+2,a.x1+2,a.top+2,0.5,150);
    var px=[a.x0,a.x0+(a.x1-a.x0)*0.5,a.x1]; for(i=0;i<3;i++){ rl(ctx,z,px[i],a.top+2,px[i],b.deckY(px[i])-b.dw,0.6,180); rl(ctx,z,px[i]+3,a.top+2,px[i]+3,b.deckY(px[i]),0.5,150); }
    var wv=batch(ctx,ctx.ST.BOATS,C.ink,z); for(x=a.x0+1;x<a.x1;x+=2)wv.push([[x,a.top-1.5],[x+0.6,a.top+1.5]],0.4,ctx.ri(60,95)); 
    for(x=b.bikes[0]+3;d>0?x<b.bikes[1]-3:x<b.bikes[1]-3;x+=6.5){ var dy=b.deckY(x)-b.dw-1.6; wv.push(arcPts(x-2,dy,1.6,1.6,0,2*Math.PI,8),0.5,170); wv.push(arcPts(x+2,dy,1.6,1.6,0,2*Math.PI,8),0.5,170); wv.push([[x-2,dy-1],[x+0.5,dy-4.5],[x+2.5,dy-1]],0.5,170); }
    wv.done(); drawSternGear(ctx,b);
    var pp=b.parts[1]; ctx.dabs(ctx.ST.INDIGO,{x0:pp.x0,x1:pp.x1,y0:pp.y0-1,y1:pp.y1+1,z:z,inside:function(x,y){ return x>=pp.x0&&x<=pp.x1&&y>=pp.y0-1&&y<=pp.y1+1; }},C.huaqing,0.25,2.5,2.5,null,{}); };

  // ---------------------------------------------------------------- drawing
  function drawHull(ctx,b,planks,ruled){ var z=b.z, C=ctx.C, i; var st=ctx.ST.BOATS;
    bl(ctx,z,b.sheer,0.85,220);                                   // gunwale — primary silhouette
    if(b.sternCurve)bl(ctx,z,b.sternCurve,0.8,215); else bl(ctx,z,[b.sternTop,[b.sternX,b.y]],0.8,220);   // stern: rounded or a post
    bl(ctx,z,[b.bowTop,[b.bowX,b.y]],0.9,225);                    // bow post
    // waterline: not a drawn edge but where the water takes the hull — a structural line broken into 2–3 runs, and at bow and
    // stern the meniscus: a short curl of water climbing the stem and the stern post, rising above the line and falling away aft
    var wlL=Math.abs(b.bowX-b.wlS), wlD=b.bowX>b.wlS?1:-1, nrun=wlL>90?3:2, wx=b.wlS+wlD*ctx.rr(2,5), k;
    for(k=0;k<nrun;k++){ var wl1=wx+wlD*wlL/nrun*ctx.rr(0.62,0.85), pts=[]; if(k===nrun-1)wl1=b.bowX-wlD*ctx.rr(2,4);
      for(var j=0;j<=4;j++){ var u=j/4, xx=wx+(wl1-wx)*u, t=(xx-b.wlS)/(b.bowX-b.wlS); pts.push([xx,b.y+Math.sin(t*Math.PI)*0.9]); }
      bl(ctx,z,pts,0.6,165); wx=wl1+wlD*ctx.rr(2,5); }
    bl(ctx,z,[[b.bowX+b.dir*5,b.y+1.8],[b.bowX+b.dir*2.2,b.y+0.6],[b.bowX+b.dir*0.4,b.y-1.6]],0.5,150);                  // meniscus at the stem
    bl(ctx,z,[[b.wlS-b.dir*0.3,b.y-1.2],[b.wlS-b.dir*2,b.y+0.5],[b.wlS-b.dir*5.5,b.y+1.6]],0.5,140);                    // and at the stern
    // a curve between sheer and waterline: plank seams follow the sheer near the top and flatten toward the waterline;
    // the bilge line at 30 % down is the strongest of them, the rest at structural grade
    function seam(t,sagK){ var ys=b.sternTop[1]+(b.y-b.sternTop[1])*t, yb=b.bowTop[1]+(b.y-b.bowTop[1])*(0.35+0.65*t);
      var pts=[], n=12; for(var k=0;k<=n;k++){ var u=k/n, xx=b.sternTop[0]+(b.bowTop[0]-b.sternTop[0])*u;
        var xs=b.sternCurve?b.sternTop[0]-b.dir*b.fb*0.15*Math.sin(t*Math.PI):b.sternTop[0], sag=Math.sin(u*Math.PI)*b.fb*sagK*(1-t);
        pts.push([xs+(b.bowTop[0]-xs)*u,ys+(yb-ys)*u+sag]); } return pts; }
    bl(ctx,z,seam(0.3,0.22),0.7,180);                              // bilge line
    for(i=1;i<=planks;i++){ var t=0.45+0.5*(i-0.5)/planks; bl(ctx,z,seam(t,0.2),ruled?0.6:0.55,ruled?150:160); }
    // far gunwale and the deck between: seen from a little above; the deck gets a few 界笔 plank lines across
    bl(ctx,z,b.far,0.55,170); bl(ctx,z,[b.sheer[0],b.far[0]],0.6,180); bl(ctx,z,[b.sheer[b.sheer.length-1],b.far[b.far.length-1]],0.6,180);
    for(i=1;i<b.sheer.length-1;i+=2){ var sx0=b.sheer[i][0]; if(b.cab&&sx0>b.cab.x0-1&&sx0<b.cab.x1+1)continue; rl(ctx,z,sx0,b.sheer[i][1]-0.4,b.far[i][0],b.far[i][1]+0.4,0.4,90); }
    // 护舷 strake just under the gunwale
    var sk=[]; for(i=0;i<b.sheer.length;i++)sk.push([b.sheer[i][0],b.sheer[i][1]+1.6]); bl(ctx,z,sk,0.5,160);
    // colour by material (D-19 (3)): every hull takes a thin 赭 over the body — the sheer strake between gunwale and 护舷 line stays
    // blank silk, the lit top of the turn — and a second pass on the shaded side: the aft half of the side (its edge wandering
    // 4–6 px with the noise, never a ruled cut) and everything below the bilge line. Wood (song, huazi, duchuan, louchuan) takes the
    // second pass in the deeper 赭 (ochre2); steel (ferry, tug, barge, haishi) takes 淡花青 there instead, over the same thin 赭
    var hp=b.parts[0], lit=function(x,y){ var sy=b.deckY(x); return y>sy-0.3&&y<sy+2.4; }, body=function(x,y){ return hp.inside(x,y)&&!lit(x,y); };
    var xm=(b.bowX+b.sternX)/2, aftSide=function(x,y){ var t=(b.y-y)/Math.max(4,b.y-b.deckY(x)); return (xm-x)*b.dir>(ctx.noise(x*0.05,y*0.05)-0.5)*12||t<0.6; };
    ctx.dabs(ctx.ST.OCHRE,{x0:hp.x0,x1:hp.x1,y0:hp.y0,y1:hp.y1,z:z,inside:body,edge:hp.edge},C.ochre,b.steel?0.3:0.42,2.2,2.4,null,{});
    if(b.steel)ctx.dabs(ctx.ST.INDIGO,{x0:hp.x0,x1:hp.x1,y0:hp.y0,y1:hp.y1,z:z,inside:function(x,y){ return body(x,y)&&aftSide(x,y); },edge:hp.edge},C.huaqing,0.3,2.2,2.4,null,{});
    else ctx.dabs(ctx.ST.OCHRE,{x0:hp.x0,x1:hp.x1,y0:hp.y0,y1:hp.y1,z:z,inside:function(x,y){ return body(x,y)&&aftSide(x,y); },edge:hp.edge},C.ochre2,0.4,2.2,2.4,null,{});
    ctx.dabs(ctx.ST.OCHRE,{x0:hp.x0,x1:hp.x1,y0:hp.y0+2,y1:hp.y1,z:z,inside:function(x,y){ return body(x,y)&&y>b.deckY(x)+2.6; },edge:hp.edge},C.danmo,0.2,2.6,2.4,null,{});   // light 淡墨 over the whole side under the strake, so the hull sinks before the belly takes over
    // the hull belly (D-19 (1)): a real dark plane, not a line at the water — 淡墨 0.3 at the waterline grading up through the
    // lower 45 % of the freeboard in four pooled bands (0.30 / 0.22 / 0.15 / 0.08, each dab bleeding a px into its neighbour so no
    // band edge shows), in the 花青 pass, so the hull sits in the water as a dark shape; the strake above stays silk
    var lo=Math.min(b.wlS,b.bowX), hi=Math.max(b.wlS,b.bowX);
    var wlY=function(x){ var t=(x-b.wlS)/(b.bowX-b.wlS); return b.y+Math.sin(Math.max(0,Math.min(1,t))*Math.PI)*0.9; };
    var fbAt=function(x){ return Math.max(4,wlY(x)-b.deckY(x)); }, inks=[0.54,0.4,0.27,0.14], NB=inks.length;   // nominal 0.30 / 0.22 / 0.15 / 0.08 — pooled dabs render at ~0.55 of their ink (as the bridge belly's ×1.9)
    function belly(k){ var t0=k/NB, t1=(k+1)/NB;
      ctx.dabs(ctx.ST.INDIGO,{x0:lo,x1:hi,y0:b.y-b.fb*1.6,y1:b.y+1,z:z,
        inside:function(x,y){ if(x<lo||x>hi||!hp.inside(x,y))return false; var dp=fbAt(x)*0.45, yb=wlY(x)-0.4; return y<=yb-dp*t0&&y>yb-dp*t1; },
        edge:function(x,y){ return k===0?Math.max(0.5,Math.min(1.2,wlY(x)-0.4-y+0.5)):1.2; }},C.danmo,inks[k],1.0,1.3,null,{pool:true}); }
    for(i=0;i<NB;i++)belly(i); }
  // mat 舱棚 as a SHELL (D-12 (5)): three faces stamped a step above the hull (stampShell, from build()) so the shell occludes;
  // its own strokes go at z+1. Silhouette, forward arc and the aft arch primary; ridge cane, eave, end-face edges structural.
  // The weave belongs to the near slope only: transverse arcs S(x,u) clipped to u ≤ UR (they stop at the ridge cane and at the end
  // face), each band of strands fanned so the pitch is tighter at the eave and wider at the crown (the slope foreshortens toward
  // the eave); the top band carries 3–4 faint lengthwise canes and nothing else; the end face carries the doorway and its shade.
  function stampShell(ctx,b){ if(!b.shell)return; for(var i=0;i<b.shell.length;i++){ var f=b.shell[i]; ctx.masks.stampZ({x0:f.x0,y0:f.y0,x1:f.x1,y1:f.y1,z:b.z+2,inside:f.inside}); } }
  function drawMatCabin(ctx,b){ var cab=b.cab, g=barrelGeom(ctx,b,cab), z=b.z+1, C=ctx.C, S=g.S, U=g.U, UR=g.UR, xe=g.xe, xo=g.xo, ox=g.ox, dd=g.dd, wh=g.wh, x, k, i;
    var xa=Math.min(xe,xo), xb=Math.max(xe,xo), yne=g.yn(xe), yno=g.yn(xo);
    function along(u,step){ var o=[]; for(x=xa;x<xb;x+=step)o.push(S(x,u)); o.push(S(xb,u)); return o; }
    function around(xx,u0,u1,n){ var o=[]; for(i=0;i<=n;i++)o.push(S(xx,u0+(u1-u0)*i/n)); return o; }
    bl(ctx,z,along(U,3),0.85,225);                                                   // the top silhouette, primary
    bl(ctx,z,around(xo,0,U,8),0.8,215);                                              // forward end: the near arc up to the turning angle
    bl(ctx,z,around(xe,0,1,14),0.85,225);                                            // aft end: the whole arch closes the barrel
    rl(ctx,z,xe,yne+0.5,xe,yne-wh,0.85,215); rl(ctx,z,xo,yno+0.5,xo,yno-wh,0.7,195);   // wall corners: aft (side meets end face) primary
    rl(ctx,z,xe+ox,yne-dd+0.5,xe+ox,yne-wh-dd,0.6,175); rl(ctx,z,xe+ox,yne-dd,xe,yne,0.5,150);   // far wall edge and foot of the end face
    bl(ctx,z,along(0,4),0.55,160);                                                   // eave where the mat meets the wall
    var wv=batch(ctx,ctx.ST.BOATS,C.ink,z);
    // plaiting (B5): sparse — one transverse arc every 3–4 px, each following the round section from the eave up toward the crown,
    // in two pieces: heavier from the eave to a third of the turn, fainter above and stopping short of the crown, so the weave fades
    // as the shell turns into the light. Bands of 5–11 px lean alternately; no lengthwise line crosses the slope
    var edges=[xa+1.5], bw; while(edges[edges.length-1]<xb-1.2){ bw=ctx.rr(5,11); edges.push(edges[edges.length-1]+bw); }
    var lowU=[0.02,0.08,0.15,0.22,0.3], highU=[0.3,0.36,0.41,0.45];
    for(var bi=0;bi<edges.length-1;bi++){ var e0=edges[bi], e1=Math.min(edges[bi+1],xb-1.2), lean=(bi%2?1:-1)*ctx.rr(0.6,1.1);
      for(x=e0+ctx.rr(1,2);x<e1-0.8;x+=ctx.rr(3,4)){ var lo=[], hi=[];
        for(i=0;i<lowU.length;i++){ var xx=x+lean*lowU[i]/UR; if(xx>xa+0.8&&xx<xb-0.8)lo.push(S(xx,lowU[i])); }
        for(i=0;i<highU.length;i++){ var xh=x+lean*highU[i]/UR; if(xh>xa+0.8&&xh<xb-0.8)hi.push(S(xh,highU[i])); }
        if(lo.length>=3)wv.push(lo,0.45,ctx.ri(95,125)); if(hi.length>=3&&ctx.R()<0.7)wv.push(hi,0.38,ctx.ri(45,70)); } }
    // one faint cane near the crown, the only lengthwise line on the mat
    wv.push(along(0.44,4),0.4,ctx.ri(50,65));
    // wall: a plank line and two small lights on the strake, kept away from the corners
    var mid=[]; for(x=xa;x<=xb;x+=6)mid.push([x,g.yn(x)-wh*0.5]); wv.push(mid,0.4,110);
    var lt=batch(ctx,ctx.ST.BOATS,C.danmo,z);
    for(k=0;k<2;k++){ var wx=xa+(xb-xa)*(0.32+0.36*k), wy=g.yn(wx); wv.push([[wx-2.5,wy-wh*0.85],[wx+2.5,wy-wh*0.85],[wx+2.5,wy-wh*0.2],[wx-2.5,wy-wh*0.2],[wx-2.5,wy-wh*0.85]],0.5,160);
      lt.push([[wx-2,wy-wh*0.525],[wx+2,wy-wh*0.525]],(wh*0.65-0.8)/wk(ctx),ctx.ri(100,125)); }   // the light's interior dark (D-19)
    wv.done(); lt.done();
    // the aft opening (篷口): the whole arch of the end face is a dark rounded mouth — 淡墨 0.3 inside the arch, deeper toward its
    // far side — and the doorway's lintel is the only line drawn across it
    var F=function(u){ return [xe+ox*u,yne-dd*u]; }, hd=wh+g.ryAt(xe)*0.42, j0=F(0.28), j1=F(0.72);
    bl(ctx,z,[[j0[0],j0[1]-hd],[j1[0],j1[1]-hd]],0.65,200);
    var arch=function(u){ return S(xe,u)[1]; }, ef=b.shell[2];
    ctx.dabs(ctx.ST.OCHRE,{x0:ef.x0,x1:ef.x1,y0:ef.y0,y1:ef.y1,z:z,inside:ef.inside,edge:ef.edge},C.ochre2,0.2,2,1.8,null,{});   // second 赭 on the shaded end (D-19)
    ctx.dabs(ctx.ST.INDIGO,{x0:ef.x0,x1:ef.x1,y0:ef.y0,y1:ef.y1,z:z,inside:ef.inside,edge:ef.edge},C.danmo,0.5,1.1,1.4,null,{pool:true});   // the 篷口 dark (nominal 0.4)
    ctx.dabs(ctx.ST.INDIGO,{x0:Math.min(xe,xe+ox)-1,x1:Math.max(xe,xe+ox)+1,y0:S(xe,0.6)[1]-2,y1:yne+1,z:z,
      inside:function(xx,yy){ var u=(xx-xe)/ox; return u>=0.45&&u<=1&&yy>=arch(u)&&yy<=yne-dd*u; }},C.danmo,0.2,1.4,1.4,null,{pool:true});
    var nf=b.shell[0];
    ctx.dabs(ctx.ST.INDIGO,{x0:nf.x0,x1:nf.x1,y0:nf.y0,y1:nf.y1,z:z,inside:function(xx,yy){ return nf.inside(xx,yy)&&yy<g.yn(xx)-wh-1&&yy>g.yn(xx)-wh-g.ryAt(xx)*0.86; },edge:nf.edge},C.huaqing,0.2,3,3,null,{});   // 花青 gathers on the lower turn; the crown is left silk, lit
    ctx.dabs(ctx.ST.OCHRE,{x0:nf.x0,x1:nf.x1,y0:nf.y0,y1:nf.y1,z:z,inside:function(xx,yy){ return nf.inside(xx,yy)&&yy>g.yn(xx)-wh-g.ryAt(xx)*0.92; },edge:nf.edge},C.ochre,0.2,2.4,2.4,null,{});   // thin 赭 over the whole near face under the 花青; the crown silk (D-19)
    ctx.dabs(ctx.ST.OCHRE,{x0:xa,x1:xb,y0:Math.min(yne,yno)-wh,y1:Math.max(yne,yno),z:z,inside:function(xx,yy){ return xx>=xa&&xx<=xb&&yy<=g.yn(xx)&&yy>=g.yn(xx)-wh; }},C.ochre2,0.26,2.4,2.2,null,{});   // the wall in the deeper 赭
    // 复勾 (D-10 a / D-12 a): the 舱腹 — the eave under the mat over the middle of the length, the one heaviest stroke of the cabin
    ctx.bline(ctx.ST.FINISH,xb,C.ink,ak(ctx,235),0.9*wk(ctx),along(0.02,3).slice(Math.round((xb-xa)*0.2/3),Math.round((xb-xa)*0.8/3)),z);
    if(b.house){ var h=b.house, top=h.top; drawHouse(ctx,b,h,null);
      var gy1=(b.deckY(h.x0)+b.deckY(h.x1))/2-b.dw-2; for(x=h.x0+3;x<h.x1-2;x+=4)rl(ctx,b.z,x,top+2,x,gy1,0.45,120);
      ctx.dabs(ctx.ST.INDIGO,{x0:h.x0+2,x1:h.x1-1,y0:top+2,y1:gy1,z:b.z,inside:function(xx,yy){ return xx>=h.x0+2.4&&xx<=h.x1-1.6&&yy>=top+2.4&&yy<=gy1-0.4; }},C.danmo,0.48,1.4,1.4,null,{pool:true});   // the house's interior seen through the glazing (D-19)
      var hp=b.parts[2]; ctx.dabs(ctx.ST.OCHRE,{x0:hp.x0,x1:hp.x1,y0:hp.y0,y1:hp.y1,z:b.z,inside:hp.inside,edge:hp.edge},C.ochre,0.3,3,2.5,null,{}); } }
  // 桅: one ruled line, a furled sail as a lumpy bundle, or a 纤绳 running to the bank
  function drawMast(ctx,b){ var m=b.mast, z=b.z, C=ctx.C, y0=b.deckY(m.x), top=y0-m.h;
    rl(ctx,z,m.x,y0,m.x+b.dir*0.6,top,0.8,205); rl(ctx,z,m.x-2.2,y0,m.x+2.2,y0,0.6,170);
    if(m.furled){ var pts=[], k, n=Math.round(m.h*0.7/3); for(k=0;k<=n;k++){ var t=k/n, yy=y0-4-(m.h*0.7)*t; pts.push([m.x+b.dir*0.6*t+Math.sin(k*1.7)*1.1,yy]); }
      ctx.pline(ctx.ST.BOATS,mx(pts),C.ink,190,2.2,pts,false); ctx.pline(ctx.ST.BOATS,mx(pts),C.ink,120,0.5,pts,false);
      for(k=1;k<n;k+=2)rl(ctx,z,pts[k][0]-2.4,pts[k][1],pts[k][0]+2.4,pts[k][1]+0.8,0.5,150); }
    // stays to bow and stern, a pair of shrouds to the gunwale, a halyard slack to the mast foot, and the 纤绳 to the bank when there is one
    rl(ctx,z,m.x,top+3,b.bowTop[0],b.bowTop[1]-1,0.4,125); rl(ctx,z,m.x,top+3,b.sternTop[0],b.sternTop[1]-1,0.4,125);
    var sx1=m.x-b.dir*b.len*0.1, sx2=m.x+b.dir*b.len*0.12; rl(ctx,z,m.x,top+m.h*0.12,sx1,b.deckY(sx1)-0.5,0.4,120); rl(ctx,z,m.x,top+m.h*0.12,sx2,b.deckY(sx2)-0.5,0.4,120);
    rope(ctx,z,[m.x+b.dir*0.6,top+1],[m.x-b.dir*7,y0-b.dw-1],0.06,0.45,135);
    if(b.ropeTo)rope(ctx,z,[m.x+b.dir*0.5,top+m.h*0.2],b.ropeTo,0.05,0.55,165);
    coil(ctx,b,m.x-b.dir*14,b.deckY(m.x-b.dir*14)-b.dw*0.4,3.2); }
  function drawSternGear(ctx,b){ var z=b.z, d=b.dir, y0=b.deckY(b.lu.x);
    // 橹: a long sweep from the stern deck into the water behind, with the pivot block
    bl(ctx,z,[[b.lu.x+d*4,y0-b.fb*0.6],[b.lu.x,y0-2],[b.sternX-d*b.len*0.14,b.y+4]],0.85,220); rl(ctx,z,b.lu.x-2,y0-1.5,b.lu.x+2,y0-1.5,0.7,180);
    // 舵: a blade hung on the stern post
    var rx=b.rudder.x; bl(ctx,z,[[rx,b.y-b.fb*0.9],[rx-d*2.5,b.y+3.5],[rx-d*6,b.y+3.5],[rx-d*4,b.y-b.fb*0.7]],0.65,195); rl(ctx,z,rx,b.y-b.fb*0.9,rx-d*4,b.y-b.fb*0.7,0.5,150); }

  DRAW.song=function(ctx,b){ drawHull(ctx,b,ctx.ri(2,4),true); drawMatCabin(ctx,b); drawMast(ctx,b); drawSternGear(ctx,b); };

  function footprint(ctx,spec){ var b=geom(ctx,spec); return unionFP(ctx,b.parts,b.z); }
  function build(ctx,spec){ var b=geom(ctx,spec); stampShell(ctx,b); (DRAW[b.type]||DRAW.song)(ctx,b);
    var rec={fp:footprint(ctx,spec),seats:b.seats,type:b.type,x:b.x,y:b.y,len:b.len,dir:b.dir,z:b.z,moving:b.moving,bowX:b.bowX,sternX:b.sternX,
             spec:{dir:b.dir,moving:b.moving,len:b.len,type:b.type},slots:{deck:b.deckY},clearance:b.clearance||0};
    ctx.reg.boats.push(rec); return rec; }
  return {footprint:footprint,build:build};
})();
