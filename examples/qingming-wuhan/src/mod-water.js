/* mod-water.js — 水纹 (D-08: fewer, longer decisions).
   Every water line is texture grade (ctx.INK.texture width, no head, no hook, a gentle two-step thinning at the end). Against a
   hull: 3–5 long contours (24–60 px) that follow the waterline at opening offsets, anchored at bow or stern and releasing into
   blank silk; the field keeps out of the hull zone. Along banks and in open water (D-10 tell 6): `current` — 3–6 long lines
   (25–45 px) staggered along the flow that walk the field together and thin away; bank families sit within 35 px of their bank,
   open water carries at most one current per 400 px and nothing else (the isolated 2–4-line packets are gone).
   Wakes: two arms of 2–3 long lines that open apart and thin to nothing, no churn; 尖弧 crests (2–3 arcs) at bows and pier faces;
   pier feet in 3–4 contours releasing downstream with one eddy in the lee; the 两江清浊线 as 2–3 broken texture-grade lines (淡赭/淡花青)
   with a small feather at the head; 淡花青 only as short broken rows at the near bank's foot (D-15 b: no tonal band on open water).
   WATER.build(ctx, spec) → {fp, slots};  spec = {x0, x1, yTop(x), yBot(x), flow, density, kind, piers, flow2, seam, seamLen}.
   Boats are read from ctx.reg.boats as {fp, spec:{dir, moving, len}}. Lines go to ST.WATER, colour to ST.INDIGO. */
var WATER=(function(){
  var TAU=Math.PI*2, BANK=50, HULL=60, PIER=40;
  function unit(x,y){ var L=Math.sqrt(x*x+y*y)||1; return [x/L,y/L]; }
  function rot(v,a){ var c=Math.cos(a), s=Math.sin(a); return [v[0]*c-v[1]*s,v[0]*s+v[1]*c]; }
  function align(t,d){ return (t[0]*d[0]+t[1]*d[1])<0?[-t[0],-t[1]]:t; }
  function drawRun(g,ps,a,b,flat){ var i; g.beginShape();
    if(flat){ for(i=a;i<b;i++)g.vertex(ps[i][0],ps[i][1]); }
    else { g.curveVertex(ps[a][0],ps[a][1]); for(i=a;i<b;i++)g.curveVertex(ps[i][0],ps[i][1]); g.curveVertex(ps[b-1][0],ps[b-1][1]); }
    g.endShape(); }

  // waterline profile of a registered boat: the lowest footprint pixel in each column (水线以下不画, so the footprint's bottom edge is the waterline)
  function hull(b){ var fp=b.fp, sp=b.spec, X0=Math.floor(fp.x0), X1=Math.ceil(fp.x1), Y0=Math.floor(fp.y0), Y1=Math.ceil(fp.y1), prof=[], first=-1, last=-1, x, y;
    for(x=X0;x<=X1;x++){ var yy=-1; for(y=Y1;y>=Y0;y--){ if(fp.inside(x,y)){ yy=y; break; } } prof.push(yy); if(yy>=0){ if(first<0)first=x-X0; last=x-X0; } }
    if(first<0)return null;
    var wlMin=1e9, wlMax=-1e9; for(x=first;x<=last;x++)if(prof[x]>=0){ wlMin=Math.min(wlMin,prof[x]); wlMax=Math.max(wlMax,prof[x]); }
    function at(i){ i=Math.max(first,Math.min(last,i)); var k=i; while(prof[k]<0&&k<last)k++; while(prof[k]<0&&k>first)k--; return prof[k]; }
    var dir=sp.dir<0?-1:1, sI=dir>0?first:last, bI=dir>0?last:first;
    return {x0:X0+first,x1:X0+last,dir:dir,moving:!!sp.moving,len:sp.len||(last-first),stern:[X0+sI,at(sI)],bow:[X0+bI,at(bI)],
      wl:function(px){ return at(Math.round(px-X0)); },
      dist:function(px,py){ if(px<X0+first-HULL||px>X0+last+HULL||py<wlMin-HULL||py>wlMax+HULL)return 1e9;   // beyond HULL either way: no caller looks further
        var c=Math.round(px-X0), i0=Math.max(first,c-45), i1=Math.min(last,c+45), best=1e9, i; if(i0>i1){ i0=i1=c<first?first:last; }
        for(i=i0;i<=i1;i++){ if(prof[i]<0)continue; var dx=X0+i-px, dy=prof[i]-py, d=dx*dx+dy*dy; if(d<best)best=d; } return Math.sqrt(best); },
      tangent:function(px){ var i=Math.round(px-X0); return unit(6,at(i+3)-at(i-3)); }}; }

  function build(ctx,spec){
    var ST=ctx.ST, C=ctx.C, R=ctx.R, rr=ctx.rr, ri=ctx.ri, clamp=ctx.clamp, ss=ctx.smoothstep, noise=ctx.noise, hidden=ctx.masks.hidden, SH=ctx.SH;
    var x0=spec.x0, x1=spec.x1, yT=spec.yTop, yB=spec.yBot, kind=spec.kind||'river', density=spec.density===undefined?1:spec.density;
    var f0=spec.flow||[-1,0], flow=unit(f0[0],f0[1]), nrmF=[-flow[1],flow[0]], piers=spec.piers||[], i, k, x, y;
    var yMin=1e9, yMax=-1e9; for(x=x0;x<=x1;x+=5){ yMin=Math.min(yMin,yT(x)); yMax=Math.max(yMax,yB(x)); }
    var fp={x0:x0,x1:x1,y0:yMin,y1:yMax,z:0,inside:function(px,py){ return px>=x0&&px<=x1&&py>=yT(px)&&py<=yB(px); }};
    var out={fp:fp,slots:{}}; if(!ctx.reg.water)ctx.reg.water=[]; ctx.reg.water.push(out);
    function inWater(px,py){ return fp.inside(px,py)&&!hidden(px,py,py); }
    // a line never runs into a hull: it stops a px or two short of the waterline (the break the eye reads as water meeting wood)
    function clear(px,py){ for(var j=0;j<hulls.length;j++)if(hulls[j].dist(px,py)<1.6)return false; return true; }

    // confluence: the 汉江 current flow2 meets the band's flow along a seam running from `seam` downstream for seamLen px;
    // on the 汉江 side the local current is flow2 at the mouth and turns into flow over the length of the seam
    var seam=kind==='confluence'?spec.seam:null, seamLen=spec.seamLen||250, flow2=null, hanSign=1;
    if(seam){ flow2=unit(spec.flow2[0],spec.flow2[1]); hanSign=(flow2[0]*nrmF[0]+flow2[1]*nrmF[1])>0?-1:1; }
    function baseFlow(px,py){ var f=flow;
      if(seam){ var ux=px-seam[0], uy=py-seam[1], u=ux*flow[0]+uy*flow[1], v=ux*nrmF[0]+uy*nrmF[1];
        if(v*hanSign>0){ var m=u>=0?1-ss(0,seamLen*1.3,u):ss(-seamLen*0.5,0,u); f=unit(flow2[0]*m+flow[0]*(1-m),flow2[1]*m+flow[1]*(1-m)); } }
      return rot(f,(noise(px*0.006+11,py*0.014+5)-0.5)*0.8); }

    var hulls=[]; for(i=0;i<ctx.reg.boats.length;i++){ var b=ctx.reg.boats[i]; if(b.fp.x1<x0-60||b.fp.x0>x1+60||b.fp.y1<yMin-10||b.fp.y1>yMax+10)continue; var h=hull(b); if(h)hulls.push(h); }
    if(kind==='lake'){ skin(true); return out; }   // 东湖: the calm skin and nothing else

    // nearness (0..1) and local direction at a point; blocked = the blank wedge ahead of a moving bow, or the zone its wake fills itself
    function probe(px,py){ var w=0, d=baseFlow(px,py), blocked=false, yb=yB(px), yt=yT(px), tb=yb-py, tt=py-yt, tg, j;
      if(yb<SH+2&&tb<BANK){ var wb=1-tb/BANK; tg=align(unit(8,yB(px+4)-yB(px-4)),d); d=unit(d[0]+tg[0]*wb*1.5,d[1]+tg[1]*wb*1.5); w=wb; }
      if(yt>-2&&tt<BANK){ var wt=(1-tt/BANK)*0.6; tg=align(unit(8,yT(px+4)-yT(px-4)),d); d=unit(d[0]+tg[0]*wt*1.5,d[1]+tg[1]*wt*1.5); w=Math.max(w,wt); }
      for(j=0;j<hulls.length;j++){ var h=hulls[j];
        if(h.moving){ var a=(px-h.bow[0])*h.dir, oy=py-h.bow[1]; if(a>0&&a<60&&Math.abs(oy)<a*0.6+4)blocked=true;
          var as=(h.stern[0]-px)*h.dir; if(as>0&&as<h.len*1.5&&Math.abs(py-h.stern[1])<as*0.45+6)blocked=true; }
        var dh=h.dist(px,py); if(dh<HULL){ var wh=1-dh/HULL; tg=align(h.tangent(px),d); d=unit(d[0]+tg[0]*wh*2,d[1]+tg[1]*wh*2); w=Math.max(w,wh); } }
      for(j=0;j<piers.length;j++){ var P=piers[j], hw=P.w/2, ox=px-P.x, py2=py-P.y; if(py2<-30)continue;
        var dp=Math.sqrt(Math.pow(Math.max(0,Math.abs(ox)-hw),2)+Math.pow(Math.max(0,py2),2)); if(dp>=PIER)continue;
        var wp=1-dp/PIER, al=ox*flow[0]+py2*flow[1], ac=ox*nrmF[0]+py2*nrmF[1], side=ac>=0?1:-1;
        if(al<-hw)d=unit(d[0]+(flow[0]+nrmF[0]*side*1.2)*wp*2,d[1]+(flow[1]+nrmF[1]*side*1.2)*wp*2);
        else if(al>hw)d=unit(d[0]+(-flow[0]*0.8+nrmF[0]*side*0.5)*wp*2.5,d[1]+(-flow[1]*0.8+nrmF[1]*side*0.5)*wp*2.5);
        w=Math.max(w,wp); }
      return {w:w,d:d,blocked:blocked}; }

    // a set of strokes → one stroke object; every point is clipped to the band and to masks.hidden at its own depth, visible runs drawn.
    // Texture grade (D-08): width from ctx.INK.texture, no head, no hook; tail = the last part thins gently in two steps and
    // lightens (the brush lifting downstream), tf = where the thinning starts (default 0.62). flat = straight vertices (尖弧 keep their point)
    function strokeSet(strokes){ var xm=-1e9, runs=[], a, j;
      for(a=0;a<strokes.length;a++){ var s=strokes[a], pts=s.pts, run=[];
        for(j=0;j<pts.length;j++){ var q=pts[j], ok=inWater(q[0],q[1])&&clear(q[0],q[1]); if(ok){ run.push(q); if(q[0]>xm)xm=q[0]; }
          if(!ok||j===pts.length-1){ if(run.length>=3)runs.push({pts:run,al:s.al,w:s.w,tail:s.tail,flat:s.flat,tf:s.tf||0.62}); run=[]; } } }
      if(!runs.length)return; var ink=C.ink;
      ctx.add(ST.WATER,xm,function(g){ g.noFill(); g.strokeCap(g.ROUND);
        for(var r=0;r<runs.length;r++){ var u=runs[r], ps=u.pts, n=ps.length, c1=u.tail?Math.min(n-1,Math.max(2,Math.round(n*u.tf))):n, c2=u.tail?Math.min(n-1,Math.max(c1,Math.round(n*(u.tf+(1-u.tf)*0.55)))):n;
          g.stroke(ink[0],ink[1],ink[2],u.al); g.strokeWeight(u.w); drawRun(g,ps,0,c1,u.flat);
          if(c1<n){ g.stroke(ink[0],ink[1],ink[2],u.al*0.8); g.strokeWeight(u.w*0.8); drawRun(g,ps,c1-1,c2,u.flat); }
          if(c2<n){ g.stroke(ink[0],ink[1],ink[2],u.al*0.5); g.strokeWeight(u.w*0.58); drawRun(g,ps,c2-1,n,u.flat); } } }); }
    var TW=ctx.INK.texture[0];   // texture-grade width. D-19: the visible lines now sit on the skin, so they rise by contact — hull contours and pier feet
                                 // ×1.35 width / alpha 135–170, wakes and crests ×1.2 / 110–140, bank and open currents and eddies wider only (「大小不等的黑处」, not 统一加黑)

    // one cluster at c along unit direction d: one wave family — n lines (2–6) that share a phase, wavelength and amplitude within a
    // few percent, start on a slanted front (echelon, not a lens) and diverge slowly toward the downstream end; no hook, no head.
    // o.wave/o.shift let consecutive clusters continue one wave.
    function cluster(c,d,o){ var n=o.n, nrm=[-d[1],d[0]], W=o.wave||{A:rr(0.35,0.9),lam:o.L*rr(1.3,2.4),ph:rr(0,TAU),kap:rr(-0.012,0.012),drift:rr(0,0.08),ech:rr(-0.22,0.22),div:rr(0.04,0.22)}, shift=o.shift||0, offs=[0], strokes=[], i, k;
      for(i=1;i<n;i++)offs.push(offs[i-1]+o.sp*rr(0.88,1.12));
      var mid=offs[n-1]/2;
      for(i=0;i<n;i++){ var off=offs[i]-mid, Li=clamp(o.L*rr(0.8,1.12),8,64), st=(i-(n-1)/2)*o.L*W.ech+rr(-0.06,0.06)*o.L, m=Math.max(5,Math.round(Li/3)), pts=[], phi=W.ph+i*W.drift, Ai=W.A*rr(0.85,1.15), lami=W.lam*rr(0.95,1.05), kapi=W.kap+rr(-0.003,0.003);
        if(n>3&&i>0&&i<n-1&&R()<0.08)continue;
        for(k=0;k<=m;k++){ var t=k/m, al=-Li/2+Li*t+st, ac=off*(1+W.div*t)+Ai*Math.sin(TAU*(al+shift)/lami+phi)+kapi*al*al; pts.push([c[0]+d[0]*al+nrm[0]*ac+rr(-0.12,0.12),c[1]+d[1]*al+nrm[1]*ac+rr(-0.12,0.12)]); }
        strokes.push({pts:pts,al:Math.round(o.al*rr(0.88,1.08)),w:TW*rr(0.9,1.1),tail:o.taper,tf:o.tf}); }
      strokeSet(strokes); }
    // placed cluster centres, so later clusters keep their distance
    var cell=16, grid={};
    function put(px,py){ var key=Math.floor(px/cell)+','+Math.floor(py/cell); (grid[key]||(grid[key]=[])).push([px,py]); }
    function tooClose(px,py,s){ var gx=Math.floor(px/cell), gy=Math.floor(py/cell), r=Math.ceil(s/cell), a, b, q;
      for(a=gx-r;a<=gx+r;a++)for(b=gy-r;b<=gy+r;b++){ var L=grid[a+','+b]; if(!L)continue; for(q=0;q<L.length;q++){ var dx=L[q][0]-px, dy=L[q][1]-py; if(dx*dx+dy*dy<s*s)return true; } } return false; }

    // a streak: up to m clusters chained end-to-end along the local flow, one wave family throughout (same phase, echelon and
    // divergence), the line count wandering by one; the brush lifts only at the last cluster. Stops at a blocked zone or the water's edge.
    function streak(c0,d0,m,o){ var W={A:rr(0.35,0.9),lam:o.L*rr(1.3,2.4),ph:rr(0,TAU),kap:m>1?0:rr(-0.012,0.012),drift:rr(0,0.08),ech:rr(-0.22,0.22),div:m>1?rr(0.02,0.1):rr(0.04,0.22)}, c=c0, d=d0, shift=0, j;
      for(j=0;j<m;j++){ var L=o.L*rr(0.85,1.15), last=j===m-1;
        cluster(c,d,{n:clamp(o.n+ri(-1,1),2,6),L:L,sp:o.sp,al:o.al,taper:last,tf:o.tf,wave:W,shift:shift}); put(c[0],c[1]);
        if(last)break; var adv=L*rr(0.9,1.05); shift+=adv; var nc=[c[0]+d[0]*adv-d[1]*rr(-1.5,1.5),c[1]+d[1]*adv+d[0]*rr(-1.5,1.5)];
        if(!inWater(nc[0],nc[1]))break; var pr=probe(nc[0],nc[1]); if(pr.blocked)break; d=pr.d; c=nc; } }
    // a current (D-10 tell 6): the one mark open water may carry. Four to six long lines (25–45 px) that walk the local flow
    // together, staggered along it so the group is a long slanting band rather than a packet, sharing one slow wave, the longest
    // lines in the middle, one of them breaking once, every one thinning to nothing downstream. Not a cluster: no echelon front
    // across the flow, no fixed straight direction — each line bends with the field, so the six read as one water moving.
    function current(c,d0,o){ var n=o.n||ri(4,6), L=o.L||rr(30,40), sp=o.sp||rr(2.6,3.4), ech=rr(0.28,0.5)*(R()<0.5?1:-1), W={A:rr(0.3,0.7),lam:L*rr(1.6,2.6),ph:rr(0,TAU)}, nrm0=[-d0[1],d0[0]], strokes=[], offs=[0], i, k;
      for(i=1;i<n;i++)offs.push(offs[i-1]+sp*rr(0.85,1.15));
      var mid=offs[n-1]/2, brk=n>4?ri(1,n-2):-1;
      for(i=0;i<n;i++){ var off=offs[i]-mid, e=Math.abs(i-(n-1)/2)/((n-1)/2), Li=clamp(L*rr(0.85,1.15)*(1-0.22*e),25,64), st=(i-(n-1)/2)*L*ech+rr(-0.08,0.08)*L, p=[c[0]+d0[0]*st+nrm0[0]*off,c[1]+d0[1]*st+nrm0[1]*off], d=d0, pts=[], s=0, ph=W.ph+i*rr(0,0.06), Ai=W.A*rr(0.9,1.1), gapAt=i===brk?rr(0.3,0.6):-1, gapL=rr(5,8), al=Math.round(o.al*rr(0.9,1.08));
        while(s<=Li){ var t=s/Li, nrm=[-d[1],d[0]], ac=Ai*Math.sin(TAU*(s+st)/W.lam+ph)*(1+0.5*t);
          if(!(gapAt>0&&t>gapAt&&s<gapAt*Li+gapL))pts.push([p[0]+nrm[0]*ac+rr(-0.12,0.12),p[1]+nrm[1]*ac+rr(-0.12,0.12)]);
          else if(pts.length>=4){ strokes.push({pts:pts,al:al,w:TW*rr(1.1,1.3),tail:false}); pts=[]; } else pts=[];
          if(!inWater(p[0],p[1]))break; var pr=probe(p[0],p[1]); if(pr.blocked)break;
          d=unit(d[0]*0.7+pr.d[0]*0.3,d[1]*0.7+pr.d[1]*0.3); p=[p[0]+d[0]*2,p[1]+d[1]*2]; s+=2; }
        if(pts.length>=4)strokes.push({pts:pts,al:al,w:TW*rr(1.1,1.3),tail:true,tf:o.tf||0.55}); }
      strokeSet(strokes); put(c[0],c[1]); put(c[0]+d0[0]*L*0.8,c[1]+d0[1]*L*0.8); put(c[0]-d0[0]*L*0.8,c[1]-d0[1]*L*0.8); }
    // a small inward spiral (卷), flattened as the oblique view flattens it, with an uneven radius; often a companion arc outside
    function eddy(c,r0,hand){ var turns=rr(1.1,1.7), N=Math.ceil(turns*9), th0=rr(0,TAU), wob=rr(0,TAU), pts=[], pts2=[], k;
      for(k=0;k<=N;k++){ var t=k/N, th=th0+hand*t*turns*TAU, r=(r0*(1-0.7*t)+0.3)*(1+0.18*Math.sin(3*th+wob)); pts.push([c[0]+Math.cos(th)*r+rr(-0.1,0.1),c[1]+Math.sin(th)*r*0.62+rr(-0.1,0.1)]); pts2.push([c[0]+Math.cos(th)*(r+1.9),c[1]+Math.sin(th)*(r+1.9)*0.62]); }
      var strokes=[{pts:pts,al:ri(85,115),w:TW*rr(1.1,1.25),tail:true}];
      if(R()<0.6)strokes.push({pts:pts2.slice(0,Math.round(pts2.length*rr(0.5,0.75))),al:ri(75,105),w:TW*1.1,tail:true});
      strokeSet(strokes); }

    // 尖弧 crests: k pointed arcs stacked ahead of point B in direction m (a bow wave, or water piling on a pier's upstream face)
    function crest(B,m,k,hw){ var nrm=[-m[1],m[0]], strokes=[], j, i;
      for(j=0;j<k;j++){ var adv=3.2*j+rr(-0.5,0.5), w2=hw*(1-0.12*j)*rr(0.9,1.1), ht=rr(1.6,2.8), pts=[];
        for(i=0;i<=6;i++){ var t=i/6-0.5, along=adv+ht*(1-Math.pow(Math.abs(t)*2,0.75)), across=t*2*w2; pts.push([B[0]+m[0]*along+nrm[0]*across,B[1]+m[1]*along+nrm[1]*across]); }
        strokes.push({pts:pts,al:ri(105,130),w:TW*rr(1.15,1.3),flat:true}); }
      strokeSet(strokes); }

    // water against a hull: three to five long contours (24–60 px) that follow the hull's waterline at growing, opening offsets,
    // each anchored at the bow or the stern (rounding a moored hull's end as a quarter-circle, starting on the raked end of a moving
    // hull), running along the hull and over its last part releasing — the offset opens, the line bends downstream and thins to
    // nothing. Blank silk between the contours and beyond them; the field stays out of the whole hull zone.
    function hullContours(h){ var Lh=h.x1-h.x0, cx=(h.x0+h.x1)/2, nC=ri(3,5), o=rr(2.4,3.4), sp=rr(3,4.2), strokes=[], W={A:rr(0.25,0.55),lam:rr(24,48),ph:rr(0,TAU)}, first=R()<0.5?1:-1, sy=noise(h.x0*0.03,h.x1*0.02)*TAU, i;
      function rowY(px,o){ if(px<h.x0){ var dx=h.x0-px; if(h.moving&&h.dir<0)return null; return dx>=o?null:h.wl(h.x0)+Math.sqrt(o*o-dx*dx); }
        if(px>h.x1){ var dx2=px-h.x1; if(h.moving&&h.dir>0)return null; return dx2>=o?null:h.wl(h.x1)+Math.sqrt(o*o-dx2*dx2); }
        return h.wl(px)+o; }
      var avail=Math.min(yB(cx),SH)-h.wl(cx)-3, tot=o, ii; for(ii=0;ii<nC-1;ii++)tot+=sp*(1+0.35*ii); if(tot>avail*0.85)sp*=Math.max(0.35,(avail*0.85-o)/(tot-o));   // a hull moored close to the bank has less water under it
      for(i=0;i<nC;i++){ var end=first*(i%2?-1:1), L=Math.min(rr(24,60),Lh*0.7+o), rel=rr(3,9)*(0.7+0.5*i/nC), xs, dirx, q, pts=[], gapAt=R()<0.35?rr(0.3,0.55):-1, gapL=rr(4,8);
        // end = +1 anchors at the hull's right end, −1 at its left; the contour runs inward from there
        if(end>0){ xs=(h.moving&&h.dir>0)?h.x1-2.5:h.x1+o*0.85; dirx=-1; } else { xs=(h.moving&&h.dir<0)?h.x0+2.5:h.x0-o*0.85; dirx=1; }
        var ph=W.ph+i*rr(0,0.1), A=W.A*rr(0.85,1.15), lam=W.lam*rr(0.95,1.05);
        for(q=0;q<=L;q+=2){ var t=q/L, px=xs+dirx*q, ry=rowY(px,o); if(ry===null)continue; var u=Math.max(0,(t-0.55)/0.45), py=ry+rel*u*u+A*Math.sin(TAU*q/lam+ph)*(1+u)+(noise(px*0.015,sy+i*1.3)-0.5)*(0.4+1.2*u);
          if(gapAt>0&&t>gapAt&&q<gapAt*L+gapL)continue;
          if(h.dist(px,py)<o*0.6+0.6)continue; pts.push([px+rr(-0.12,0.12),py+rr(-0.12,0.12)]); }
        if(pts.length>=4)strokes.push({pts:pts,al:Math.round(rr(135,170)*(1-0.2*i/nC)),w:TW*rr(1.25,1.45),tail:true,tf:0.6});
        o+=sp*(1+0.35*i); }
      strokeSet(strokes); put(cx,h.wl(cx)+6); h.wrapR=HULL; }

    // wake: two arms leaving the stern at ±spread, bent by the current; each arm is two or three long lines that share one gentle
    // wave, open slowly apart, end at different lengths and thin to nothing — no churn, no eddy. A crest ahead of the bow.
    function wake(h){ var back=[-h.dir,0], S=h.stern, len=Math.min(210,h.len*rr(0.7,1.05)), spread=rr(0.15,0.24), arm, j, k;
      for(arm=-1;arm<=1;arm+=2){ var nl=ri(2,3), sp=rr(2.2,3.2), W={A:rr(0.5,0.9),lam:rr(30,60),ph:rr(0,TAU)}, path=[], p=[S[0]+back[0]*3,S[1]+rr(0,2)], s=3, strokes=[];
        while(s<len){ var f=rot(flow,(noise(p[0]*0.006+11,p[1]*0.014+5)-0.5)*0.3), m=Math.min(1,s/30), dd=rot(unit(back[0]+f[0]*0.5*m,back[1]+f[1]*0.5*m),arm*spread*(1-0.35*s/len));
          path.push([p[0],p[1],dd]); if(path.length%10===0)put(p[0],p[1]); p=[p[0]+dd[0]*2,p[1]+dd[1]*2]; s+=2; }
        for(j=0;j<nl;j++){ var endF=j===0?rr(0.8,1):rr(0.4,0.75), off=(j-(nl-1)/2)*sp, N=Math.floor(path.length*endF), gapK=R()<0.5?Math.floor(N*rr(0.3,0.6)):-1, gapN=ri(3,6), pts=[], al=Math.round(rr(110,140));
          for(k=0;k<N;k++){ var q=path[k], nrm=[-q[2][1],q[2][0]], t=k/path.length, oc=off*(1+1.6*t)+W.A*Math.sin(TAU*k*2/W.lam+W.ph+j*0.12)*(1+0.6*t);
            if(gapK>0&&k===gapK){ if(pts.length>=4)strokes.push({pts:pts,al:al,w:TW*rr(1.1,1.3),tail:false}); pts=[]; }
            if(gapK>0&&k>=gapK&&k<gapK+gapN)continue;
            pts.push([q[0]+nrm[0]*oc+rr(-0.12,0.12),q[1]+nrm[1]*oc+rr(-0.12,0.12)]); }
          if(pts.length>=4)strokes.push({pts:pts,al:al,w:TW*rr(1.1,1.3),tail:true,tf:0.45}); }
        strokeSet(strokes); }
      crest([h.bow[0]+h.dir*2.6,h.bow[1]+0.5],[h.dir,0],ri(2,3),rr(5,7)); }

    // pier: a crest piling on the upstream face, three or four contours round the foot that open downstream and release along
    // the current, one eddy in the lee
    function pierMarks(P){ var hw=P.w/2, up=[-flow[0],-flow[1]], F=[P.x+up[0]*(hw+1),P.y+1], dn=flow[0]<0?-1:1, nC=ri(3,4), o=rr(1.6,2.4), sp=rr(2.6,3.6), strokes=[], W={A:rr(0.2,0.5),lam:rr(20,40),ph:rr(0,TAU)}, j, q;
      crest(F,up,ri(2,3),rr(4,6)); put(F[0]+up[0]*4,F[1]);
      function rowY(px,o){ var dx=Math.abs(px-P.x)-hw; if(dx<=0)return P.y+o; if(dx>=o)return null; return P.y+Math.sqrt(o*o-dx*dx); }
      for(j=0;j<nC;j++){ var xs=P.x-dn*(hw+o*0.85), L=2*hw+1.7*o+rr(10,22), rel=rr(3,8), pts=[], ph=W.ph+j*rr(0,0.1);
        for(q=0;q<=L;q+=2){ var t=q/L, px=xs+dn*q, ry=rowY(px,o), u=Math.max(0,(t-0.55)/0.45);
          if(ry===null){ if((px-P.x)*dn<0)continue; ry=P.y+o; }
          var py=ry+rel*u*u+W.A*Math.sin(TAU*q/W.lam+ph)*(1+u)+(noise(px*0.03,j*2.3)-0.5)*(0.4+1.2*u); pts.push([px+rr(-0.12,0.12),py+rr(-0.12,0.12)]); }
        if(pts.length>=4)strokes.push({pts:pts,al:Math.round(rr(130,160)*(1-0.2*j/nC)),w:TW*rr(1.2,1.4),tail:true,tf:0.6});
        o+=sp*(1+0.3*j); }
      strokeSet(strokes);
      var e=[P.x+flow[0]*(hw+rr(16,36)),P.y+rr(0,8)+flow[1]*rr(16,36)]; if(inWater(e[0],e[1])){ eddy(e,rr(3,4.5),R()<0.5?1:-1); put(e[0],e[1]); } }

    // D-19 / D-21(1). The whole band carries the fine 水纹 the original's river shows edge to edge — but as water, not as a
    // pattern (B10: 「江水读作图案……木纹状底纹」). Rows along the flow, each row a chain of LONG lines (40–140 px) with short gaps
    // (3–8 px), every line a gentle wave (wavelength 26–46 px, amplitude 0.5–0.9 px) whose phase drifts along the row, the whole
    // sheet warped ±3 px by a slow 2-D noise so the rows undulate together (one water moving); the pieces of one row start and
    // end ≥ 10 px away from every start and end of the row above (错开接续 — brickwork, never a column of aligned ends).
    // Contrast halved from v10: width ~0.4 px, alpha 30–40. Density follows the current: rows 1.8–2.4 px apart within 80 px of a
    // bank, 2.6–3.4 in mid-stream, alpha ×1.4 near banks, hulls and piers, and an interleaved half-row appears only in the
    // hull and pier zones; the upper 30 % of the band fades to ×0.4 (the far water lost in the mist). No cluster has an edge:
    // nothing modulates the gaps in blocks. All dice from ctx.noise (z-slots 61–79), so nothing built after the water re-rolls.
    // Drawn flat in ~120 px columns, one stroke per column keyed at its right edge; the visible lines draw on top of it.
    function skin(calm){ var f=flow, n=nrmF, ox=x0, oy=yMin, cs=[[x0,yMin],[x1,yMin],[x0,yMax],[x1,yMax]], uMin=1e9, uMax=-1e9, vMin=1e9, vMax=-1e9, cols={}, order=[], row=0, prevB=[], j;
      for(j=0;j<4;j++){ var du=cs[j][0]-ox, dv=cs[j][1]-oy, uu=du*f[0]+dv*f[1], vv=du*n[0]+dv*n[1]; uMin=Math.min(uMin,uu); uMax=Math.max(uMax,uu); vMin=Math.min(vMin,vv); vMax=Math.max(vMax,vv); }
      var lam0=(calm?44:34)*(0.85+0.3*noise(x0*0.01,5,62)), A0=(calm?0.35:0.7)*(0.85+0.3*noise(x0*0.01,7,63)), ph0=noise(x0*0.01,9,64)*TAU, uMid=(uMin+uMax)/2;
      function nearB(px,py){ var w=0, yb=yB(px), yt=yT(px); if(yb<SH+2)w=Math.max(w,1-(yb-py)/80); if(yt>-2)w=Math.max(w,1-(py-yt)/80); return clamp(w,0,1); }
      function nearH(px,py){ var w=0, q; for(q=0;q<hulls.length;q++)w=Math.max(w,1-hulls[q].dist(px,py)/HULL);
        for(q=0;q<piers.length;q++){ var P=piers[q], dx=Math.max(0,Math.abs(px-P.x)-P.w/2), dy=Math.max(0,py-P.y); if(py-P.y>=-30)w=Math.max(w,1-Math.sqrt(dx*dx+dy*dy)/PIER); }
        return clamp(w,0,1); }
      function flush(run,rk){ if(run.length<6)return; var m=run[Math.floor(run.length/2)], nr=Math.max(nearB(m[0],m[1]),nearH(m[0],m[1])), t=clamp((m[1]-yT(m[0]))/Math.max(1,yB(m[0])-yT(m[0])),0,1), far=ss(0,0.3,t), xm=-1e9, q;
        for(q=0;q<run.length;q++)if(run[q][0]>xm)xm=run[q][0];
        var al=(40+12*noise(m[0]*0.15,rk*0.7,67))*(1+0.4*nr)*(0.4+0.6*far)*(calm?0.7:1), w=(0.36+0.08*noise(m[0]*0.17,rk*0.9,68))*(0.85+0.15*far), key=Math.floor(xm/120);
        if(!cols[key]){ cols[key]={xm:xm,runs:[]}; order.push(key); } if(xm>cols[key].xm)cols[key].xm=xm;
        cols[key].runs.push({pts:run,al:Math.round(al),w:w}); }
      function nearBoundary(u){ var d=1e9, q; for(q=0;q<prevB.length;q++){ var e=Math.abs(prevB[q]-u); if(e<d)d=e; } return d; }
      // one row at v: half = the interleaved row that exists only in the hull and pier zones
      function walk(v,half){ var lam=lam0*(0.85+0.3*noise(row*0.37,6,70)), A=A0*(0.7+0.6*noise(row*0.41,8,71)), ph=ph0+noise(row*0.71,10,72)*TAU*2, curB=[], u, Ap=A;
        var left=(40+100*noise(row*0.61,1,73))*(1-noise(row*0.53,12,74)), on=true, run=[];   // the first piece starts part-way, so the first ends of neighbouring rows differ
        for(u=uMin;u<=uMax;u+=2){ var bx=ox+f[0]*u+n[0]*v, by=oy+f[1]*u+n[1]*v, off=(noise(bx*0.004,by*0.015,75)-0.5)*6+(noise(bx*0.012,by*0.03,66)-0.5)*2+Ap*Math.sin(ph), px=bx+n[0]*off, py=by+n[1]*off;
          ph+=TAU*2/(lam*(0.8+0.4*noise(u*0.02,row*0.5,77)));
          if(left<=0){ var db=half?1e9:nearBoundary(u);
            if(db<10)left=12-db;   // an end or a start would sit under one of the row above: carry on past it
            else { if(on){ flush(run,row); run=[]; left=(3+5*noise(u*0.11,row*0.47,76))*(1-0.3*(nearB(px,py)+nearH(px,py))); } else { left=40+100*noise(u*0.013,row*0.31,73); Ap=A*(0.6+0.7*noise(u*0.09,row*0.43,79)); } on=!on; curB.push(u); } }
          left-=2; if(!on)continue;
          var ok=py>=-1&&inWater(px,py)&&clear(px,py); if(ok&&half)ok=nearH(px,py)>0.35+0.4*noise(bx*0.03,by*0.03,65);
          if(ok)run.push([px,py]); else if(run.length){ flush(run,row); run=[]; } }
        flush(run,row); if(!half)prevB=curB; }
      for(var v=vMin+2*noise(1,2,66);v<vMax;row++){ var mx=ox+f[0]*uMid+n[0]*v, my=oy+f[1]*uMid+n[1]*v, dB=1e9;
        if(yB(mx)<SH+2)dB=Math.min(dB,yB(mx)-my); if(yT(mx)>-2)dB=Math.min(dB,my-yT(mx));
        var pitch=(1.8+0.6*noise(row*0.83,4,69))+((2.6+0.8*noise(row*0.67,14,61))-(1.8+0.6*noise(row*0.83,4,69)))*ss(20,80,dB);   // rows press together toward the banks, open in mid-stream
        walk(v,false); if(hulls.length||piers.length)walk(v+pitch*0.5,true); v+=pitch; }
      var ink=C.ink;
      for(j=0;j<order.length;j++)(function(col){ ctx.add(ST.WATER,col.xm,function(g){ g.noFill(); g.strokeCap(g.ROUND);
        for(var r=0;r<col.runs.length;r++){ var q=col.runs[r]; g.stroke(ink[0],ink[1],ink[2],q.al); g.strokeWeight(q.w); drawRun(g,q.pts,0,q.pts.length,true); } }); })(cols[order[j]]); }
    skin(false);

    for(i=0;i<hulls.length;i++){ hullContours(hulls[i]); if(hulls[i].moving)wake(hulls[i]); }
    for(i=0;i<piers.length;i++)pierMarks(piers[i]);

    // the field: jittered candidates in random order, near the banks only (hull and pier zones carry their contours and nothing
    // else). A candidate starts a streak of one or two long clusters, stretches of bank are left quiet by a slow noise, and
    // each start keeps its distance from everything placed. Mid-river carries nothing but the drifts below.
    if(kind!=='wake'){ var cands=[];
      for(x=x0+rr(0,7);x<=x1;x+=7){ var top=Math.max(-3,yT(x)), bot=Math.min(SH+3,yB(x)); for(y=top+rr(0,7);y<=bot;y+=7){ var cx=x+rr(-3.5,3.5), cy=y+rr(-3.5,3.5); if(inWater(cx,cy))cands.push([cx,cy]); } }
      for(k=cands.length-1;k>0;k--){ var jj=Math.floor(R()*(k+1)), tmp=cands[k]; cands[k]=cands[jj]; cands[jj]=tmp; }
      for(k=0;k<cands.length;k++){ var q=cands[k], pr=probe(q[0],q[1]), skip=false; if(pr.blocked||pr.w<=0.3)continue;   // a bank family sits against its bank (≤ 35 px), never adrift in open water
        for(i=0;i<hulls.length;i++)if(hulls[i].dist(q[0],q[1])<HULL*0.9)skip=true;
        for(i=0;i<piers.length;i++){ var P=piers[i], dxp=Math.max(0,Math.abs(q[0]-P.x)-P.w/2), dyp=Math.max(0,q[1]-P.y); if(q[1]>P.y-30&&dxp*dxp+dyp*dyp<PIER*PIER*0.8)skip=true; }
        if(skip)continue;
        var w=pr.w, dep=ctx.depth(q[1]), p=(0.42+0.16*w)*(0.7+0.3*density)*(0.5+0.5*ss(0.35,0.55,noise(q[0]*0.004+20,7))), s=54-12*w;
        if(R()>p||tooClose(q[0],q[1],s))continue;
        var spN=rr(2.6,3.4)+(rr(1.9,2.4)-rr(2.6,3.4))*ss(0.45,1,w);   // lines press a little closer against the bank itself
        // a bank family is a current too (D-10 tell 6): fewer starts, each a long band of lines that walk the bank's tangent
        current(q,pr.d,{n:ri(3,5),L:rr(36,52)*(0.8+0.2*dep),sp:spN,al:Math.round(rr(56,82)*(0.85+0.15*dep)),tf:0.6});
        if(w>0.6&&R()<0.04)eddy([q[0]+rr(-8,8),q[1]+rr(-4,6)],rr(2.5,4),R()<0.5?1:-1); }
      // open water (D-10 tell 6): nothing but at most one current per 400 px of river, well away from banks, hulls and piers;
      // the isolated two- or three-line drifts are gone
      for(k=0;k<Math.round((x1-x0)/400);k++){ var tries=0;
        while(tries++<40){ var dx0=x0+k*400+rr(60,340), tt=rr(0.45,0.85), dy0=yT(dx0)+(yB(dx0)-yT(dx0))*tt; if(dx0>x1||!inWater(dx0,dy0))continue;
          var pr2=probe(dx0,dy0), near2=false; if(pr2.blocked||pr2.w>0.02)continue;
          for(i=0;i<hulls.length;i++)if(hulls[i].dist(dx0,dy0)<HULL)near2=true; if(near2||tooClose(dx0,dy0,90))continue;
          current([dx0,dy0],pr2.d,{L:rr(40,56)*(0.85+0.15*ctx.depth(dy0)),al:ri(52,72),tf:0.55}); break; } } }
    // 淡花青 at the bank foot only (D-15 b): per stretch two short broken rows within 12 px of the near bank, each a chain of
    // 40–90 px pieces with gaps, ink 0.10–0.14, never a continuous band; open water carries no INDIGO at all
    function flushRow(run,row){ if(run.length>=3)ctx.pline(ST.INDIGO,run[run.length-1][0],C.huaqing,row[2],row[1],run,true); }
    function bankBands(){ var bx=x0+rr(20,140), r, xx, run;
      while(bx<x1-100){ var xe=Math.min(x1-10,bx+rr(140,300)), off=rr(2.5,5), rows=[[off,rr(2.6,4),ri(26,36)],[off+rr(3,5),rr(1.8,2.8),ri(22,30)]];
        for(r=0;r<2;r++){ var px=bx+r*rr(10,40), pe, run2;
          while(px<xe){ pe=Math.min(xe,px+rr(40,90)); run=[];
            for(xx=px;xx<=pe;xx+=5){ var yb=yB(xx), py=yb-rows[r][0]-noise(xx*0.02,r*7)*2.5; if(yb>SH-1||hidden(xx,py,py)){ flushRow(run,rows[r]); run=[]; continue; } run.push([xx,py]); }
            flushRow(run,rows[r]); px=pe+rr(25,70); } }
        bx=xe+rr(160,420); } }
    if(kind==='river'||kind==='confluence')bankBands();

    // 清浊线 (D-15 b): two or three broken lines along the seam, texture grade, 淡赭 and 淡花青 alternating, 60–120 px pieces
    // with gaps, wavering with the seam and dying out past seamLen; the two colours mingle only in a small feather at the head
    function seamBands(){ var n=ri(2,3), sp=rr(3,5), j, cols=[C.ochre,C.huaqing];
      function at(u,v){ var vv=v+(noise(u*0.02+40,3)-0.5)*12; return [seam[0]+flow[0]*u+nrmF[0]*vv,seam[1]+flow[1]*u+nrmF[1]*vv]; }
      for(j=0;j<n;j++){ var v=(j-(n-1)/2)*sp*hanSign, col=cols[j%2], u=rr(0,18), al=ri(88,112)*(j===0?1:0.88);
        while(u<seamLen*1.1){ var L=rr(60,120), pts=[], k, m=Math.round(L/4);
          for(k=0;k<=m;k++){ var uu=u+L*k/m, q=at(uu,v+(j%2?1:-1)*Math.sin(uu*0.05+j)*0.6); if(!inWater(q[0],q[1])||!clear(q[0],q[1])){ if(pts.length>=3){ ctx.pline(ST.INDIGO,pts[pts.length-1][0],col,Math.round(al*(1-0.5*ss(seamLen*0.6,seamLen*1.1,uu))),TW*rr(1.05,1.25),pts,true); } pts=[]; continue; } pts.push(q); }
          if(pts.length>=3)ctx.pline(ST.INDIGO,pts[pts.length-1][0],col,Math.round(al*(1-0.5*ss(seamLen*0.6,seamLen*1.1,u+L))),TW*rr(1.05,1.25),pts,true);
          u+=L+rr(20,55); } }
      // the head: a small feather where the two waters first touch, each colour a few px over the seam
      var H=rr(10,14), hx=seam[0]+flow[0]*H, hy=seam[1]+flow[1]*H;
      function head(sign,c){ var reg={x0:hx-H-6,x1:hx+H+6,y0:hy-H-6,y1:hy+H+6,z:1,inside:function(px,py){ var dx=px-hx, dy=py-hy; return fp.inside(px,py)&&dx*dx+dy*dy<H*H; }};
        ctx.dabs(ST.INDIGO,reg,c,0.09,3.2,2.6,function(px,py){ var v=((px-seam[0])*nrmF[0]+(py-seam[1])*nrmF[1])*sign; return R()<ss(-5,3,v)&&R()>ss(0,H,Math.abs(v))*0.7; }); }
      head(-hanSign,C.ochre); head(hanSign,C.huaqing); }
    if(seam)seamBands();
    return out; }

  return {build:build};
})();
