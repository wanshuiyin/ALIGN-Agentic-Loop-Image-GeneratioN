/* mod-tree.js — 树石: trees, reeds, rocks and banks (interfaces §2(d)).
   TREE.footprint(ctx,spec) / TREE.build(ctx,spec), spec = {x,y,h,kind,dir,z}: (x,y) is the ground contact at the trunk base
   (rock: base centre), h the height, kind one of huai|za|wutong|liu|ying|tao|song|luwei|rock, dir ±1 the lean (default drawn),
   z the mask depth (default y). The tree is grown once per spec and cached as spec.sk, so footprint() and build() see the same
   skeleton: hand the same spec object to both. TREE.bank(ctx,spec) draws a 坡岸 from an edge polyline; it is ground and has no footprint. */
var TREE=(function(){
  var ZHILV=[118,138,88], SHILV=[96,150,110], HUA=[214,198,166]; // 汁绿 / 石绿 fallbacks; core's C.zhilv / C.shilv are used when present
  // per-kind growth: fork = trunk height fraction, wb = base width / h, lv = branching levels, claw = downward hook at the tips
  // (蟹爪) vs antler forks (鹿角), up = pull toward vertical per level (negative spreads outward), spread = side-child angle,
  // bend = per-branch curvature, stop = early-termination odds from level 2, twig = odds of a mid-branch twig, low = extra trunk limbs
  var K={
    huai:  {fork:[0.34,0.46],wb:0.042,lv:[4,4],claw:0.25,up:0.12, spread:[0.5,0.8],  bend:0.22,stop:0.06,twig:0.6, low:[0,1],lean:0.08,limbs:[2,3]},
    za:    {fork:[0.3,0.44], wb:0.04, lv:[3,4],claw:0.8, up:0.05, spread:[0.55,0.85],bend:0.3, stop:0.1, twig:0.55,low:[0,1],lean:0.16,limbs:[2,3]},
    wutong:{fork:[0.42,0.54],wb:0.05, lv:[3,4],claw:0.2, up:0.18, spread:[0.45,0.7], bend:0.16,stop:0.08,twig:0.45,low:[0,0],lean:0.06,limbs:[3,3]},
    liu:   {fork:[0.28,0.42],wb:0.062,lv:[2,3],claw:0,   up:-0.25,spread:[0.55,0.9], bend:0.3, stop:0.1, twig:0.3, low:[1,2],lean:0.22,limbs:[2,3]},
    ying:  {fork:[0.26,0.38],wb:0.036,lv:[3,4],claw:0.15,up:-0.05,spread:[0.55,0.85],bend:0.25,stop:0.06,twig:0.7, low:[0,1],lean:0.12,limbs:[3,4]},
    tao:   {fork:[0.24,0.36],wb:0.038,lv:[3,4],claw:0.1, up:0.15, spread:[0.45,0.7], bend:0.2, stop:0.1, twig:0.6, low:[0,1],lean:0.1, limbs:[2,3]},
    song:  {fork:[0.45,0.62],wb:0.05, lv:[2,3],claw:0,   up:-0.3, spread:[0.7,1.0],  bend:0.3, stop:0.15,twig:0.3, low:[1,3],lean:0.2, limbs:[2,2]}
  };
  // line grades (D-08): read from ctx.INK — trunk, dominant limbs and the ridge primary; secondary limbs, roots, knots structural;
  // twigs, tips, 皴, strands, needles texture (no head, hook or bead: those are the brush's, not this module's)
  function grades(ctx){ var I=ctx.INK||{}; var g=function(k,dw,da){ var v=I[k]; return v?{w:v.w||v[0]||dw,a:v.a||v[1]||da}:{w:dw,a:da}; };
    return {P:g('primary',0.65,205),S:g('structural',0.5,150),T:g('texture',0.35,90)}; }
  function primary(ctx){ return grades(ctx).P; }

  // ---------------------------------------------------------------- geometry helpers
  function wrap(d){ while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI; return d; }
  function mx(pts){ var m=-1e9; for(var i=0;i<pts.length;i++)if(pts[i][0]>m)m=pts[i][0]; return m; }
  function bbox(pts){ var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for(var i=0;i<pts.length;i++){ var p=pts[i]; if(p[0]<x0)x0=p[0]; if(p[0]>x1)x1=p[0]; if(p[1]<y0)y0=p[1]; if(p[1]>y1)y1=p[1]; } return [x0,y0,x1,y1]; }
  function lerp(a,b,t){ return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]; }
  // linear resample at ~step px, vertices kept
  function dens(pts,step){ var out=[[pts[0][0],pts[0][1]]];
    for(var i=1;i<pts.length;i++){ var ax=pts[i-1][0], ay=pts[i-1][1], bx=pts[i][0], by=pts[i][1], L=Math.sqrt((bx-ax)*(bx-ax)+(by-ay)*(by-ay)), n=Math.max(1,Math.round(L/step));
      for(var k=1;k<=n;k++){ var t=k/n; out.push([ax+(bx-ax)*t,ay+(by-ay)*t]); } }
    return out; }
  // parallel polyline at signed distance d(t) — positive = visual left of the direction of travel
  function offset(pts,d){ var n=pts.length, out=[];
    for(var i=0;i<n;i++){ var a=pts[Math.max(0,i-1)], b=pts[Math.min(n-1,i+1)], tx=b[0]-a[0], ty=b[1]-a[1], L=Math.sqrt(tx*tx+ty*ty)||1, dd=d(n>1?i/(n-1):0);
      out.push([pts[i][0]+ty/L*dd,pts[i][1]-tx/L*dd]); }
    return out; }
  function arcOf(E){ var cum=[0]; for(var i=1;i<E.length;i++){ var dx=E[i][0]-E[i-1][0], dy=E[i][1]-E[i-1][1]; cum.push(cum[i-1]+Math.sqrt(dx*dx+dy*dy)); } return cum; }
  // point and unit tangent at arc length s along E
  function at(E,cum,s){ var n=E.length, i=1; while(i<n-1&&cum[i]<s)i++; var a=E[i-1], b=E[i], L=cum[i]-cum[i-1]||1, t=Math.max(0,Math.min(1,(s-cum[i-1])/L));
    return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,tx:(b[0]-a[0])/L,ty:(b[1]-a[1])/L}; }

  // ---------------------------------------------------------------- drawing helpers
  // several small marks in one stroke object: item {p:[[x,y]..], w, a, v}; 1 point = dot, 2 = line, ≥3 = curve (v: straight vertices)
  function marks(ctx,st,c,items){ if(!items.length)return; var x=-1e9, i; for(i=0;i<items.length;i++){ var m=mx(items[i].p); if(m>x)x=m; }
    ctx.add(st,x,function(g){ g.noFill(); g.strokeCap(g.ROUND);
      for(var k=0;k<items.length;k++){ var it=items[k], p=it.p; g.stroke(c[0],c[1],c[2],it.a); g.strokeWeight(it.w);
        if(p.length===1)g.line(p[0][0],p[0][1],p[0][0]+0.01,p[0][1]);
        else if(p.length===2||it.v){ g.beginShape(); for(var j=0;j<p.length;j++)g.vertex(p[j][0],p[j][1]); g.endShape(); }
        else { g.beginShape(); g.curveVertex(p[0][0],p[0][1]); for(var q=0;q<p.length;q++)g.curveVertex(p[q][0],p[q][1]); g.curveVertex(p[p.length-1][0],p[p.length-1][1]); g.endShape(); } } }); }
  // a batcher: pushes items not hidden at depth z (z null = caller already checked), flushes eight at a time
  function batch(ctx,st,c,z){ var it=[]; return {
    push:function(item){ if(z!==null&&ctx.masks.hidden(item.p[0][0],item.p[0][1],z))return; it.push(item); if(it.length>=8){ marks(ctx,st,c,it); it=[]; } },
    done:function(){ marks(ctx,st,c,it); it=[]; } }; }
  // pline split into the runs not hidden at depth zfn(p)
  function plineZ(ctx,st,c,al,w,pts,zfn,curve){ var run=[], i;
    var out=function(){ if(run.length>1)ctx.pline(st,mx(run),c,al,w,run,curve); run=[]; };
    for(i=0;i<pts.length;i++){ var p=pts[i]; if(ctx.masks.hidden(p[0],p[1],zfn(p)))out(); else run.push(p); }
    out(); }
  // split a polyline into consecutive runs of arc length rr(a,b), sharing one point
  function runs(ctx,E,a,b){ var cum=arcOf(E), out=[], i=0;
    while(i<E.length-1){ var want=ctx.rr(a,b), j=i+1; while(j<E.length-1&&cum[j]-cum[i]<want)j++; out.push(E.slice(i,j+1)); i=j; }
    return out; }

  // the runs of a polyline outside a region (a mark cut where a nearer mass covers it)
  function clipOut(pts,ins){ var out=[], cur=[], i; for(i=0;i<pts.length;i++){ if(ins(pts[i][0],pts[i][1])){ if(cur.length>1)out.push(cur); cur=[]; } else cur.push(pts[i]); } if(cur.length>1)out.push(cur); return out; }

  // a woody stroke (D-10 c): pts run base → tip; width grows from wT at the tip to wB at the base (and ink with it), one slow
  // noise along the body, no head and no tail — the tip is simply where the line stops. Hidden samples at depth z are dropped.
  // Pieces are butt-capped and abut. Several strokes are gathered into one stroke object by limbBatch (eight at a time).
  function limbPieces(ctx,pts,z,wT,wB,aT,aB,pieces){ var n=pts.length, cum=arcOf(pts), L=cum[n-1], ph=ctx.rr(0,100), cur=null, lastK=null, i;
    if(L<0.5)return; for(i=0;i<n;i++){ var t=cum[i]/L, k=Math.pow(1-t,1.3), nz=(ctx.noise(ph+cum[i]*0.04,2.9)-0.5)*0.24;
      var w=Math.max(0.15,Math.round((wT+(wB-wT)*k)*(1+nz)/0.06)*0.06), a=Math.round(Math.max(30,Math.min(250,(aT+(aB-aT)*k)*(1+nz*0.6)))/10)*10, key=w*1000+a;
      var px=pts[i][0]+(ctx.R()-0.5)*0.3, py=pts[i][1]+(ctx.R()-0.5)*0.3;
      if(z!==undefined&&z!==null&&ctx.masks.hidden(pts[i][0],pts[i][1],z)){ if(cur&&cur.pts.length>1)pieces.push(cur); cur=null; lastK=null; continue; }
      if(cur&&key!==lastK){ cur.pts.push([px,py]); if(cur.pts.length>1)pieces.push(cur); cur=null; }
      if(!cur){ cur={w:w,a:a,pts:[]}; lastK=key; }
      cur.pts.push([px,py]); }
    if(cur&&cur.pts.length>1)pieces.push(cur); }
  function flushPieces(ctx,st,c,pieces){ if(!pieces.length)return; var x=-1e9, i; for(i=0;i<pieces.length;i++){ var m=mx(pieces[i].p=pieces[i].pts); if(m>x)x=m; }
    ctx.add(st,x,function(g){ var cx=g.drawingContext; cx.save(); cx.lineCap='butt'; cx.lineJoin='round';
      for(var r=0;r<pieces.length;r++){ var pc=pieces[r], ps=pc.pts; cx.lineWidth=pc.w; cx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+(pc.a/255).toFixed(3)+')';
        cx.beginPath(); cx.moveTo(ps[0][0],ps[0][1]); for(var j=1;j<ps.length;j++)cx.lineTo(ps[j][0],ps[j][1]); cx.stroke(); } cx.restore(); }); }
  function limbBatch(ctx,st,c,z){ var pieces=[], n=0; return {
    push:function(pts,wT,wB,aT,aB){ limbPieces(ctx,pts,z,wT,wB,aT,aB,pieces); if(++n>=8){ flushPieces(ctx,st,c,pieces); pieces=[]; n=0; } },
    done:function(){ flushPieces(ctx,st,c,pieces); pieces=[]; n=0; } }; }

  // ---------------------------------------------------------------- skeleton
  function skeleton(ctx,s){ if(s.sk)return s.sk;
    var kind=K[s.kind]?s.kind:(s.kind==='luwei'||s.kind==='rock'?s.kind:'za');
    var sk={kind:kind,x:s.x,y:s.y,h:s.h,dir:s.dir||(ctx.R()<0.5?-1:1),z:s.z===undefined?s.y:s.z,feature:!!s.feature,weave:!!s.weave,main:!!s.main,crossings:[],branches:[],tips:[],knots:[],roots:[],strands:[],clusters:[],balls:[],patches:[],canopy:[],pts:[]};
    s.sk=sk;
    if(kind==='luwei')growReeds(ctx,sk); else if(kind==='rock')growRock(ctx,sk); else growTree(ctx,sk);
    return sk; }

  // ---------------------------------------------------------------- 主势 (D-10): a tree is grown from one or two sweeps
  // A sweep is a long S- or C-curve from the root through the crown, chosen once per tree (lean, curvature, height). The trunk is
  // its lower part; the dominant limb lies on the rest of it. A second sweep may leave the first near the fork. Secondary limbs
  // leave a sweep at 25–45° and bend back toward it; twig sheaves (5–9 twigs from one origin) sit along the sweeps, dense on the
  // outer side of the curve, sparse inside, with two or three deliberate holes where the silk shows.
  function crom(pts,step){ var n=pts.length; if(n<3)return dens(pts,step); var out=[[pts[0][0],pts[0][1]]], i, k;
    for(i=0;i<n-1;i++){ var p0=pts[Math.max(0,i-1)], p1=pts[i], p2=pts[i+1], p3=pts[Math.min(n-1,i+2)], L=Math.sqrt((p2[0]-p1[0])*(p2[0]-p1[0])+(p2[1]-p1[1])*(p2[1]-p1[1])), m=Math.max(1,Math.round(L/step));
      for(k=1;k<=m;k++){ var s=k/m, s2=s*s, s3=s2*s;
        out.push([0.5*(2*p1[0]+(-p0[0]+p2[0])*s+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*s2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*s3),
                  0.5*(2*p1[1]+(-p0[1]+p2[1])*s+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*s2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*s3)]); } }
    return out; }
  // a sweep from (x,y): total arc length len, starting angle a0, shape 'S' (angle swings one way then the other) or 'C' (one bow)
  function sweep(ctx,x,y,len,a0,shape,amp,sign){ var pts=[[x,y]], cx=x, cy=y, s=0, st=2, i=0;
    while(s<len){ var t=s/len, a=shape==='S'?a0+sign*amp*Math.sin(t*Math.PI*1.5-0.15):a0+sign*amp*(t*1.1-0.2);
      a+=(ctx.noise(cx*0.05,cy*0.05,4.4)-0.5)*0.22; cx+=Math.cos(a)*st; cy+=Math.sin(a)*st; pts.push([cx,cy]); s+=st; i++; if(i>400)break; }
    return {pts:pts,cum:arcOf(pts),len:s,a0:a0,shape:shape,amp:amp,sign:sign}; }
  // local curvature side of a sweep at arc s: +1 if the curve is bending to the visual right of travel (so the outer side is the left)
  function curvSide(sw,s){ var A=at(sw.pts,sw.cum,Math.max(0,s-4)), B=at(sw.pts,sw.cum,Math.min(sw.len,s+4)); var d=wrap(Math.atan2(B.ty,B.tx)-Math.atan2(A.ty,A.tx)); return d>0?1:-1; }

  function growTree(ctx,sk){
    var rr=ctx.rr, ri=ctx.ri, R=ctx.R, T=K[sk.kind], x=sk.x, y=sk.y, h=sk.h, dir=sk.dir, i, k;
    var fork=h*rr(T.fork[0],T.fork[1]), wb=h*T.wb, wt=wb*rr(0.42,0.52);
    sk.inkv=rr(-15,15); sk.small=h<100; sk.sweeps=[]; sk.chains=[]; sk.twigs=[]; sk.twigEnds=[]; sk.holes=[];
    // sweep 1: the trunk and the leading limb lie on it. Lean goes with dir; the bow goes back over the lean (C) or swings twice (S)
    var lean=dir*rr(0.3,1.5)*T.lean, a0=-Math.PI/2+lean, shape=R()<0.55?'S':'C', amp=rr(0.3,0.6)*(sk.kind==='liu'?1.3:sk.kind==='song'?1.4:1), sg=R()<0.65?-dir:dir;
    // the main tree (D-19, B9 tell 5; spec.main): its bias is decided at the root — the trunk leans with dir 1.6–2.2× the kind's
    // lean and bows back over it in one C; the limbs on the lean side reach out long into space, the limbs on the other side are
    // short, leave close together and gather into a knot
    if(sk.main){ lean=dir*rr(1.6,2.2)*T.lean+dir*0.12; a0=-Math.PI/2+lean; shape='C'; amp=rr(0.45,0.65); sg=-dir; }
    var s1=sweep(ctx,x,y,h*rr(0.98,1.08),a0,shape,amp,sg); sk.sweeps.push(s1);
    // trunk = the sweep up to the fork
    var S=[], n0=0; while(n0<s1.pts.length&&s1.cum[n0]<=fork)n0++; S=s1.pts.slice(0,Math.max(3,n0)); var n=S.length, flare=rr(1.4,2.6)*h/120+0.6, nk=ri(2,3);
    for(i=0;i<nk;i++)sk.knots.push({t:rr(0.2,0.85),side:R()<0.5?-1:1,amp:rr(1.2,2.2),sig:rr(2.5,4)/fork,r:rr(0.9,1.5),a0:rr(0,6.28)});
    var wfn=function(t,side){ var w=(wb*(1-t)+wt*t)/2; if(t<0.1)w+=flare*Math.pow(1-t/0.1,1.6);
      for(var q=0;q<sk.knots.length;q++){ var kn=sk.knots[q]; if(kn.side===side){ var u=(t-kn.t)/kn.sig; w+=kn.amp*Math.exp(-u*u); } } return w; };
    sk.S=S; sk.L=offset(S,function(t){ return wfn(t,-1); }); sk.Rt=offset(S,function(t){ return -wfn(t,1); });
    sk.trunkPoly=sk.L.concat(sk.Rt.slice().reverse()); sk.inner=offset(S,function(t){ return wfn(t,-1)*0.42; });
    var cx=S[n-1][0], cy=S[n-1][1]; sk.fork=[cx,cy]; sk.crown=[cx,cy]; sk.wb=wb; sk.wt=wt; sk.wfn=wfn;
    var nr=ri(2,3); for(i=0;i<nr;i++){ var rs=i===0?-1:i===1?1:(R()<0.5?-1:1); sk.roots.push({side:rs,t:i<2?rr(0.03,0.06):rr(0.05,0.09),len:rr(3.5,7)*(0.7+0.3*h/120),drop:rr(0.6,1.8),lift:rr(0.8,1.6)}); }
    // chain 1: the rest of sweep 1 above the fork — the trunk goes on up INTO the crown to 0.85–0.9 h, thinning to nothing
    var c1=s1.pts.slice(n-1), fs=s1.cum[n-1];
    sk.chains.push({pts:c1,cum:arcOf(c1),w0:wt*0.85,sw:s1,s0:fs,role:'dom',lvl:1});
    // big limbs (D-13): each leaves the trunk at its OWN height — about 0.3, 0.5, 0.65 h, a fourth near 0.78 h on tall trees —
    // on ALTERNATING sides, at 35–60° from the trunk (松 nearer horizontal), bowing back toward vertical; the lower ones run
    // longest. Never two at one node and never a matched pair: every height, angle and length is drawn on its own. The crown is
    // the union of these limbs' secondaries and twig sheaves, with the trunk still visible inside it.
    var song=sk.kind==='song', liu=sk.kind==='liu', hts=sk.small?[0.32,0.52,0.68]:h>=115?[0.3,0.48,0.63,0.78]:[0.3,0.5,0.66], side=R()<0.5?-1:1;
    if(sk.small&&R()<0.4)hts.pop(); if(song)hts=hts.slice(0,ri(2,3));
    var plan=[]; for(i=0;i<hts.length;i++){ plan.push({hf:hts[i],side:side,len:1,dev:null,gather:false}); side=-side; }
    if(sk.main)plan=[{hf:0.3,side:dir,len:1.35,dev:rr(0.85,1.2),gather:false},{hf:0.44,side:-dir,len:0.62,dev:rr(0.45,0.7),gather:true},{hf:0.53,side:-dir,len:0.55,dev:rr(0.5,0.8),gather:true},{hf:0.7,side:dir,len:1.2,dev:rr(0.7,1.0),gather:false}];
    for(i=0;i<plan.length;i++){ var pl=plan[i], hf=pl.hf+rr(-0.04,0.04), yl=y-hf*h, j1=0; side=pl.side; while(j1<s1.pts.length&&s1.pts[j1][1]>yl)j1++; if(j1>=s1.pts.length-3)break;
      var ar=s1.cum[j1], ql=at(s1.pts,s1.cum,ar), tgl=Math.atan2(ql.ty,ql.tx), ep;
      if(j1<n-1)ep=(side<0?sk.L:sk.Rt)[j1]; else { var hw=wt*0.85*Math.pow(Math.max(0,1-(ar-fs)/(s1.len-fs)),1.15)/2; ep=[ql.x-ql.ty*side*hw,ql.y+ql.tx*side*hw]; }
      var dev=side*(pl.dev!==null?pl.dev:song?rr(0.95,1.3):rr(0.6,1.05)), lenL=h*rr(0.34,0.46)*(1-(hf-0.3)*0.55)*(sk.small?0.9:1)*(song?0.85:1)*pl.len;
      var sL=sweep(ctx,ep[0],ep[1],lenL,tgl+dev,'C',rr(0.3,0.55)*(song?0.7:1)*(pl.gather?0.7:1),-side); sk.sweeps.push(sL);
      sk.chains.push({pts:sL.pts,cum:sL.cum,w0:wt*rr(0.6,0.78)*(1-hf*0.45)*(pl.gather?0.85:1),sw:sL,s0:0,role:sk.main?(pl.gather?'near':'dom'):i<2?'dom':'near',lvl:1,limb:true,gather:pl.gather}); }
    // D-14 (B6 tell 6): spec.feature marks ONE big limb — the second from the base — to carry a dense knot of twigs over its
    // outer half (sheaves 2.2× as close, twigs shorter and crossing) with the sheaf beside the knot left out, so a through-gap of
    // silk 0.12–0.18 h wide opens in the crown next to it. Nothing else about the growth changes.
    sk.feat=(sk.feature||sk.main)&&sk.chains.length>2?sk.chains[2]:null; // the main tree's knot is on its first gathered limb
    // holes: two or three stretches of the crown, each on one chain, where nothing leaves the sweep
    var nh=ri(2,3); for(i=0;i<nh;i++){ var hc=sk.chains[ri(0,sk.chains.length-1)], hu=rr(0.25,0.8), hl=rr(0.1,0.18); if(hc===sk.feat)continue; sk.holes.push({c:hc,u0:hu,u1:hu+hl}); }
    var inHole=function(ch,u){ for(var q=0;q<sk.holes.length;q++)if(sk.holes[q].c===ch&&u>=sk.holes[q].u0&&u<=sk.holes[q].u1)return true; return false; };
    var sc=0.8+0.4*h/120;
    // secondary limbs and twig sheaves along each chain
    for(i=0;i<sk.chains.length;i++){ var ch=sk.chains[i], P=ch.pts, cum=ch.cum, L=cum[cum.length-1], sp=ch.role==='dom'?rr(2,8):rr(3,7), pend=0;
      // on a big limb the full side is its UPPER side (the secondaries stand on the limb and close the crown); on the trunk's
      // continuation it is the outer side of the bow, as before
      while(sp<L-3){ var u=sp/L, q=at(P,cum,sp), tga=Math.atan2(q.ty,q.tx), cs=curvSide(ch.sw,ch.s0+sp), outer=ch.limb?(q.tx<0?1:-1):-cs, sd=R()<(ch.limb?0.78:0.7)?outer:-outer;
        var wl=ch.w0*(1-u)*(1-u), far=ch.role==='far'||sd!==outer&&R()<0.5, hole=inHole(ch,u), knot=ch===sk.feat&&u>0.5||ch.gather&&u>0.35;
        if(!hole&&u<0.92&&R()<(ch.role==='dom'?0.85:0.6)){
          // a limb: leaves at 25–45° (pines nearer horizontal), bends back toward the sweep by half its departure, 4 pieces
          var da=sd*(song?rr(0.9,1.35):rr(0.45,0.8)), la2=tga+da, ll=Math.min(L-sp+6,h*(song?rr(0.24,0.4):rr(0.2,0.36)))*(1-u*0.4)*(far?0.7:1), lp2=[[q.x,q.y]], lx=q.x, ly=q.y, j;
          if(ll>4){ var relax=song?-0.3:rr(0.35,0.65), nn=4;
            for(j=1;j<=nn;j++){ var tt=j/nn; var aa=la2-da*relax*tt+(song&&j===nn?wrap(-Math.PI/2-la2)*0.4:0)+rr(-0.08,0.08); lx+=Math.cos(aa)*ll/nn; ly+=Math.sin(aa)*ll/nn; lp2.push([lx,ly]); }
            var lw=Math.max(0.5,wl*0.6), lb={pts:lp2,w:lw,lvl:2,a:aa,role:far?'far':'near',len:ll}; sk.branches.push(lb); sk.pts.push([lx,ly]);
            sk.tips.push({x:lx,y:ly,a:aa,lvl:2,sparse:far,len:ll});
            // a child off the limb, bending back toward the limb's own line, on the longer near limbs
            if(!far&&ll>h*0.14&&R()<0.75){ var mi=ri(1,nn-1), m=lp2[mi], cs2=R()<0.5?-1:1, ca=Math.atan2(lp2[mi][1]-lp2[mi-1][1],lp2[mi][0]-lp2[mi-1][0])+cs2*rr(0.5,0.8), cl=ll*rr(0.4,0.6), cp=[[m[0],m[1]]], kx=m[0], ky=m[1];
              for(j=1;j<=3;j++){ var ta=ca-cs2*rr(0.5,0.8)*0.5*(j/3)+rr(-0.08,0.08); kx+=Math.cos(ta)*cl/3; ky+=Math.sin(ta)*cl/3; cp.push([kx,ky]); }
              sk.branches.push({pts:cp,w:lw*0.6,lvl:3,a:ta,role:'near',len:cl}); sk.tips.push({x:kx,y:ky,a:ta,lvl:3,sparse:false,len:cl}); sk.pts.push([kx,ky]);
              if(!song)twigSheaf(ctx,sk,T,kx,ky,ta,sc,far); }
            if(!song)twigSheaf(ctx,sk,T,lx,ly,aa,sc,far); }
          pend=sp; }
        // sheaves straight off the sweep in the crown, more on the outer side
        // the knot (D-16, B8 tell 5): every twig of it starts ON the limb — at the limb's drawn edge on its side, staggered along
        // the limb's own line, never beside it — so the fine branching visibly grows out of the coarse
        if(knot){ var ehw=0.5*ch.w0*Math.pow(1-u,1.15), alg=[q.tx,q.ty]; twigSheaf(ctx,sk,T,q.x-q.ty*outer*ehw,q.y+q.tx*outer*ehw,tga+outer*rr(0.6,1.3),sc*0.62,false,true,alg); if(R()<0.7)twigSheaf(ctx,sk,T,q.x+q.ty*outer*ehw,q.y-q.tx*outer*ehw,tga-outer*rr(0.5,1.2),sc*0.55,false,true,alg); }
        else if(!hole&&!song&&u>(ch.limb?0.12:0.25)&&R()<(sd===outer?0.8:0.3)&&!(sk.small&&R()<0.4))twigSheaf(ctx,sk,T,q.x-q.ty*sd*0.6,q.y+q.tx*sd*0.6,tga+sd*rr(0.5,0.9),sc*0.9,sd!==outer);
        sp+=(song?rr(10,16):rr(5,9)/1.4)*(0.8+0.5*h/120)*(ch.role==='dom'?1:1.4)*(knot?1/2.2:1); } // D-19 (1), B9 tell 5: sheaves 1.4× as close inside the crown
      // the sweep's own end: a sheaf on the tangent
      var e=P[P.length-1], ea=Math.atan2(P[P.length-1][1]-P[P.length-2][1],P[P.length-1][0]-P[P.length-2][0]);
      sk.tips.push({x:e[0],y:e[1],a:ea,lvl:1,sparse:false,len:h*0.2,end:true}); sk.pts.push(e);
      if(!song)twigSheaf(ctx,sk,T,e[0],e[1],ea,sc*(ch===sk.feat?0.62:1),false,ch===sk.feat);
      if(ch===sk.feat)twigSheaf(ctx,sk,T,e[0],e[1],ea+rr(-0.5,0.5),sc*0.62,false,true,[Math.cos(ea),Math.sin(ea)]); }
    if(sk.feat&&sk.feature)featureGap(ctx,sk); // the main tree gathers without the through-gap: its open side is the reaching side
    if(sk.weave)weaveTwigs(ctx,sk);
    // D-19 (1): every crown knows where its twigs cross — the leaf-dot clusters sit there (the woven crown picked its own above)
    if(!sk.weave&&!song){ var crA=twigCrossings(sk.twigs), crP=[]; for(i=0;i<crA.length;i++)if(R()<0.55){ var okc=true; for(k=0;k<crP.length;k++)if(Math.abs(crP[k][0]-crA[i][0])<4&&Math.abs(crP[k][1]-crA[i][1])<4){ okc=false; break; } if(okc)crP.push(crA[i]); } sk.crossings=crP; sk.crossAll=crA; }
    sk.dom=[]; for(i=0;i<sk.chains.length;i++)if(sk.chains[i].role==='dom')sk.dom.push(sk.chains[i]);
    // D-21 (B10 ⑤): the leaves are organised into 2–4 masses, one on each big limb's outer half — the dots, balls and blossom go
    // only there, the limbs between the masses stay bare twig on silk
    if(!song&&!liu)leafMasses(ctx,sk);
    // kind-specific dressing
    if(liu){ // 垂条 in sheaves along the sweeps (crown part), each sheaf bowing the way the sweep bows, plus some limb ends; 3 in 10 omitted
      for(i=0;i<sk.dom.length;i++){ var ch2=sk.dom[i], L2=ch2.cum[ch2.cum.length-1], ps=rr(3,9);
        while(ps<L2-2){ var u2=ps/L2; if(!inHole(ch2,u2)&&R()<0.55){ var qq=at(ch2.pts,ch2.cum,ps), cs3=curvSide(ch2.sw,ch2.s0+ps); sheaf(ctx,sk,qq.x,qq.y+rr(0.3,1),-cs3*rr(1,4)); } ps+=rr(12,20); } }
      for(i=0;i<sk.tips.length;i++)if(!sk.tips[i].sparse&&R()<0.4)sheaf(ctx,sk,sk.tips[i].x,sk.tips[i].y,rr(-1.5,1.5));
      if(!sk.strands.length)sheaf(ctx,sk,sk.dom[0].pts[2][0],sk.dom[0].pts[2][1],0);
      var sb=bbox([].concat.apply([],sk.strands)); sk.canopy.push({x:(sb[0]+sb[2])/2,y:(sb[1]+sb[3])/2,rx:(sb[2]-sb[0])/2+2,ry:(sb[3]-sb[1])/2+2}); }
    if(song){ // 攒针 tufts where the limbs end, sized by the limb and turned the way it points; along the upper side of limbs a few more
      for(i=0;i<sk.tips.length;i++){ var tp=sk.tips[i], rs=Math.max(3.5,Math.min(8,tp.len*0.28)), ca2=tp.a; ca2+=wrap(-Math.PI/2-ca2)*0.55;
        cluster(ctx,sk,tp.x,tp.y-0.5,rs,ca2); cluster(ctx,sk,tp.x-Math.cos(tp.a)*rs*0.8,tp.y-Math.sin(tp.a)*rs*0.8-rr(1,3),rs*0.85,ca2+rr(-0.35,0.35)); if(R()<0.4)cluster(ctx,sk,tp.x+Math.cos(tp.a)*rs*0.5+rr(-2,2),tp.y+Math.sin(tp.a)*rs*0.5-rr(2,4),rs*0.75,ca2+rr(-0.3,0.3)); }
      for(i=0;i<sk.branches.length;i++){ var pb=sk.branches[i]; if(pb.role==='far'&&R()<0.5)continue; var pal=dens(pb.pts,rr(10,15)); for(k=1;k<pal.length-1;k++)if(R()<0.5){ var ta2=Math.atan2(pal[k][1]-pal[k-1][1],pal[k][0]-pal[k-1][0]); cluster(ctx,sk,pal[k][0]+rr(-1,1),pal[k][1]-rr(1.5,3.5),Math.max(3.5,Math.min(7,pb.len*0.22)),ta2+wrap(-Math.PI/2-ta2)*0.7); } }
      for(i=0;i<sk.clusters.length;i++){ var c=sk.clusters[i]; sk.canopy.push({x:c.x,y:c.y-c.r*0.35,rx:c.r*0.95,ry:c.r*0.85}); } }
    if(sk.kind==='wutong'){ var bEnds=sk.massEnds; for(i=0;i<bEnds.length;i++)if(R()<0.7){ var te=bEnds[i], nb=R()<0.6?1:2; for(k=0;k<nb;k++)sk.balls.push({x:te[0]+rr(-1.5,1.5),y:te[1],len:rr(2,4),a:Math.PI/2+rr(-0.35,0.35)}); }
      var np=ri(3,5); for(i=0;i<np;i++)sk.patches.push({t:rr(0.12,0.9),u:rr(0.1,0.5),w:rr(0.4,0.6),len:rr(4,9)/fork}); }
    if(sk.kind==='ying'||sk.kind==='tao'){ sk.blooms=[]; var order=[], ends=sk.massEnds.slice(); for(i=0;i<sk.massDots.length;i++)if(sk.massDots[i][2]<0.8&&R()<0.3)ends.push(sk.massDots[i]); // the blossom clusters fill the masses: their twig ends and a pick of their inner anchors
      for(i=0;i<ends.length;i++)order.push(i);
      for(i=order.length-1;i>0;i--){ var j2=ri(0,i), tmp=order[i]; order[i]=order[j2]; order[j2]=tmp; }
      var nbl=Math.max(2,Math.round(ends.length*0.6)), nred=Math.min(8,nbl);
      for(i=0;i<nbl&&i<order.length;i++){ var bt=ends[order[i]], nd=ri(5,9), dots=[];
        for(k=0;k<nd;k++){ var ba=rr(0,6.28), br=rr(0,3.2)*(0.8+0.4*h/120); dots.push([bt[0]+Math.cos(ba)*br*1.15,bt[1]+Math.sin(ba)*br*0.8-1]); }
        sk.blooms.push({dots:dots,red:i<nred}); } }
    sk.top=[cx,cy]; for(i=0;i<sk.pts.length;i++)if(sk.pts[i][1]<sk.top[1])sk.top=sk.pts[i]; }

  // a twig sheaf: 5–9 twigs sharing one origin, fanning about direction a, each a gentle curve of its own length; 蟹爪 hooks the
  // ends toward the ground, 鹿角 lifts them. Sparse sheaves (inner side, subordinate limbs) carry 3–5.
  // `cross` (the featured knot): the fan is wider and every other twig starts a little to one side and swings the other way,
  // so the twigs of the sheaf cross one another and the knot closes
  // `along` (the knot): the unit tangent of the limb the sheaf leaves — the crossing twigs' origins are staggered along it, on
  // the limb line, instead of stepping off the line
  function twigSheaf(ctx,sk,T,x,y,a,sc,sparse,cross,along){ var rr=ctx.rr, ri=ctx.ri, R=ctx.R, nt=sparse?ri(3,5):cross?ri(7,10):ri(5,9), fan=rr(0.8,1.4)*(cross?2:1), s0=rr(-0.25,0.25), claw=T.claw*rr(0.7,1.3), bow=rr(0.15,0.45)*(R()<0.5?-1:1), k;
    if(sk.small)nt=Math.max(3,nt-2);
    var lens=[], mxl=0; for(k=0;k<nt;k++){ lens.push(rr(4,12)*sc*(R()<0.2?1.6:1)); }
    // the sheaf is uneven: the twigs crowd toward one side of the fan and share one bow, lengths differ twofold
    var skew=rr(-0.35,0.35);
    for(k=0;k<nt;k++){ var f=(k-(nt-1)/2)/Math.max(1,nt-1), a1=a+s0+fan*(f+skew*f*f*4)+rr(-0.1,0.1), L=lens[k], q1, q2, q3, ox=x, oy=y;
      if(cross&&k%2){ var cs=rr(1.5,3)*(f<0?-1:1); if(along){ ox=x+along[0]*cs; oy=y+along[1]*cs; } else { ox=x-Math.sin(a)*cs; oy=y+Math.cos(a)*cs; } a1=a+s0-fan*f*1.1+rr(-0.1,0.1); bow=-bow; }
      if(claw>0.35){ var a2=a1+wrap(Math.PI/2-a1)*claw*rr(0.3,0.55); q1=[ox+Math.cos(a1)*L*0.45,oy+Math.sin(a1)*L*0.45]; q2=[q1[0]+Math.cos((a1+a2)/2+bow*0.5)*L*0.3,q1[1]+Math.sin((a1+a2)/2+bow*0.5)*L*0.3]; q3=[q2[0]+Math.cos(a2+bow)*L*0.3,q2[1]+Math.sin(a2+bow)*L*0.3]; }
      else { a1+=wrap(-Math.PI/2-a1)*0.2; q1=[ox+Math.cos(a1)*L*0.4,oy+Math.sin(a1)*L*0.4]; q2=[q1[0]+Math.cos(a1+bow*0.5)*L*0.32,q1[1]+Math.sin(a1+bow*0.5)*L*0.32]; q3=[q2[0]+Math.cos(a1+bow)*L*0.3,q2[1]+Math.sin(a1+bow)*L*0.3]; }
      sk.twigs.push({pts:[[ox,oy],q1,q2,q3],a:a1,knot:!!cross}); sk.twigEnds.push(q3); sk.pts.push(q3);
      // in the knot the twigs branch again: one or two twiglets leave each twig's body at 0.6–1.1 rad, a quarter to a half
      // its length, so the cluster is a tangle of three orders (limb → twig → twiglet) that cross, not a comb
      if(cross&&R()<0.7){ var ntl=R()<0.5?1:2, tl; for(tl=0;tl<ntl;tl++){ var b0=tl===0?q1:q2, b1=tl===0?q2:q3, ba=Math.atan2(b1[1]-b0[1],b1[0]-b0[0])+(R()<0.5?-1:1)*rr(0.6,1.1), bl=L*rr(0.25,0.45), bb=rr(-0.4,0.4);
          var t1=[b0[0]+Math.cos(ba)*bl*0.5,b0[1]+Math.sin(ba)*bl*0.5], t2=[t1[0]+Math.cos(ba+bb)*bl*0.5,t1[1]+Math.sin(ba+bb)*bl*0.5];
          sk.twigs.push({pts:[[b0[0],b0[1]],t1,[(t1[0]+t2[0])/2,(t1[1]+t2[1])/2],t2],a:ba,knot:true}); sk.twigEnds.push(t2); } } } }

  // the woven crown (D-15, B7 tell 6; spec.weave): the twigs inside the crown are re-bent so each curves toward the crown's centre
  // and runs long enough to cross one or two of its neighbours — the fine branching knits into a mass — while the twigs at the
  // crown's edge are thinned to single ones that end free. Where two twigs cross is remembered (`sk.crossings`): the leaf dots,
  // 梧桐 balls and blossom go there, not along every tip.
  function weaveTwigs(ctx,sk){ var rr=ctx.rr, R=ctx.R, tw=sk.twigs, n=tw.length, i, k; if(n<6)return;
    var cx=0, cy=0; for(i=0;i<n;i++){ cx+=tw[i].pts[0][0]; cy+=tw[i].pts[0][1]; } cx/=n; cy/=n;
    var rmax=1; for(i=0;i<n;i++){ var e=tw[i].pts[3], de=Math.sqrt((e[0]-cx)*(e[0]-cx)+(e[1]-cy)*(e[1]-cy)); if(de>rmax)rmax=de; }
    var out=[], ends=[], inner=[];
    for(i=0;i<n;i++){ var t=tw[i], o=t.pts[0], d=Math.sqrt((o[0]-cx)*(o[0]-cx)+(o[1]-cy)*(o[1]-cy))/rmax;
      if(t.knot){ out.push(t); ends.push(t.pts[3]); inner.push(t); continue; } // the featured knot stays as grown (feature + weave on one tree, D-16)
      if(d>0.66){ if(R()<0.38){ out.push(t); ends.push(t.pts[3]); } continue; } // the rim: one twig in three, left as grown, ending free
      var e3=t.pts[3], L0=Math.sqrt((e3[0]-o[0])*(e3[0]-o[0])+(e3[1]-o[1])*(e3[1]-o[1]))||4, L=L0*rr(1.25,1.7)*(1-d*0.25)+2;
      var ac=Math.atan2(cy-o[1],cx-o[0]), a1=t.a, turn=wrap(ac-a1); if(Math.abs(turn)>1.9)turn=(turn<0?-1:1)*1.9; // never doubling back on itself
      var side=R()<0.5?-1:1, w0=rr(0.15,0.35)*side, s0=a1+turn*rr(0.1,0.3)+w0, s1=a1+turn*rr(0.75,1.0)-w0*0.5, pts=[[o[0],o[1]]], px=o[0], py=o[1];
      for(k=1;k<=3;k++){ var u=k/3, ang=s0+(s1-s0)*u*u; px+=Math.cos(ang)*L/3; py+=Math.sin(ang)*L/3; pts.push([px,py]); }
      if(sk.inGap&&(sk.inGap(pts[2])||sk.inGap(pts[3]))){ out.push(t); ends.push(t.pts[3]); continue; } // a woven twig never reaches into the through-gap
      var nt={pts:pts,a:s0}; out.push(nt); ends.push(pts[3]); inner.push(nt); sk.pts.push(pts[3]); }
    // the crossings of the inner twigs (segment against segment), each pair once
    var cr=twigCrossings(inner);
    // the dots go to a sparse pick of the crossings: one in three, none within 4.5 px of another
    var pick=[]; for(i=0;i<cr.length;i++)if(R()<0.35){ var okp=true; for(k=0;k<pick.length;k++)if(Math.abs(pick[k][0]-cr[i][0])<4.5&&Math.abs(pick[k][1]-cr[i][1])<4.5){ okp=false; break; } if(okp)pick.push(cr[i]); }
    sk.twigs=out; sk.twigEnds=ends; sk.crossings=pick; sk.crossAll=cr; sk.weaveC=[cx,cy]; }

  // the leaf masses (D-21, B10 tell ⑤ 「按几根主枝组织叶团,团内合、团间透」): 2–4 per crown, each an ellipse lying along ONE big
  // limb over its outer half (0.55–0.82 of the limb, lifted a little to the limb's upper side, rx 0.10–0.145 h), the main tree's
  // gathered limbs first, then the longest; a crown with fewer limbs than masses puts two on its longest limb (0.5–0.65 and
  // 0.8–0.95). Where the leaves may sit is then decided here, once: the anchors are every twig end, twig middle and twig crossing;
  // an anchor inside a mass is kept (certain inside 0.6 of the mass's radius, thinning to nothing at the rim — the soft edge),
  // one outside all masses never; kept anchors closer than 1.3 px to one already kept are dropped so the dots touch, not pile.
  // `sk.massDots` [x,y,d] (d = distance in mass radii) are the leaf dots; `sk.massEnds` the twig ends inside a mass (balls,
  // blossom); `sk.massD(p)` the distance of any point to the nearest mass, for the 汁绿 and 石绿 in drawTree (no dice in it).
  function leafMasses(ctx,sk){ var rr=ctx.rr, ri=ctx.ri, R=ctx.R, h=sk.h, i, k;
    var cand=[]; for(i=0;i<sk.chains.length;i++)if(sk.chains[i].limb||i===0)cand.push(sk.chains[i]);
    cand.sort(function(a,b){ var ga=a.gather?1:0, gb=b.gather?1:0; if(ga!==gb)return gb-ga; return b.cum[b.cum.length-1]-a.cum[a.cum.length-1]; });
    var nm=Math.min(h>=115?ri(3,4):ri(2,3),cand.length+1), masses=[];
    for(i=0;i<nm;i++){ var ch=cand[i%cand.length], twice=i>=cand.length, P=ch.pts, cum=ch.cum, L=cum[cum.length-1];
      var u=twice?rr(0.8,0.95):cand.length<nm&&i===0?rr(0.5,0.65):rr(0.55,0.82), q=at(P,cum,L*u), tl=Math.sqrt(q.tx*q.tx+q.ty*q.ty)||1, tx=q.tx/tl, ty=q.ty/tl, nx=-ty, ny=tx;
      if(ny>0){ nx=-nx; ny=-ny; } // the upper side, where the sheaves stand
      var lift=ch.limb?h*rr(0.03,0.06):h*rr(0,0.02), rx=h*rr(0.10,0.145)*(ch.gather?0.85:1)*(sk.kind==='ying'||sk.kind==='tao'?1.2:1), ry=rx*(ch.limb?rr(0.65,0.85):rr(0.8,0.95));
      masses.push({x:q.x+nx*lift,y:q.y+ny*lift,rx:rx,ry:ry,c:tx,s:ty,ch:ch}); }
    var massD=function(p){ var best=9, m, dx, dy, uu, vv, d; for(var j=0;j<masses.length;j++){ m=masses[j]; dx=p[0]-m.x; dy=p[1]-m.y; uu=(dx*m.c+dy*m.s)/m.rx; vv=(-dx*m.s+dy*m.c)/m.ry; d=Math.sqrt(uu*uu+vv*vv); if(d<best)best=d; } return best; };
    var soft=function(d){ return d<0.6?1:d<1?(1-d)/0.4:0; };
    var an=[], tw=sk.twigs, cr=sk.crossAll||[]; for(i=0;i<cr.length;i++)an.push(cr[i]);
    // along every twig that reaches a mass, a point every 1.6 px; in the heart of a mass (inside 0.75) the band widens — a point
    // or two beside the twig as well — so the dots close over the twig network there instead of stringing along it
    for(i=0;i<tw.length;i++){ var tp=tw[i].pts; if(massD(tp[3])>=1.2&&massD(tp[1])>=1.2)continue; var tdn=dens(tp,1.6);
      for(k=1;k<tdn.length;k++){ var tq=tdn[k]; an.push(tq); if(massD(tq)<0.75){ var vx=tq[0]-tdn[k-1][0], vy=tq[1]-tdn[k-1][1], vl=Math.sqrt(vx*vx+vy*vy)||1, off=rr(1.1,1.7)*(R()<0.5?-1:1);
          an.push([tq[0]-vy/vl*off,tq[1]+vx/vl*off]); if(R()<0.5)an.push([tq[0]+vy/vl*off*rr(0.8,1.4),tq[1]-vx/vl*off*rr(0.8,1.4)]); } } }
    for(i=an.length-1;i>0;i--){ var j2=ri(0,i), tmp=an[i]; an[i]=an[j2]; an[j2]=tmp; }
    var dots=[]; for(i=0;i<an.length;i++){ var a=an[i], d=massD(a); if(d>=1||R()>=soft(d))continue; var ok=true;
      for(k=0;k<dots.length;k++){ var dd=dots[k]; if(Math.abs(dd[0]-a[0])<1.3&&Math.abs(dd[1]-a[1])<1.3){ ok=false; break; } }
      if(ok)dots.push([a[0],a[1],d]); }
    var ends=[]; for(i=0;i<sk.twigEnds.length;i++){ var e=sk.twigEnds[i], de=massD(e); if(de<1&&R()<soft(de))ends.push(e); }
    sk.masses=masses; sk.massD=massD; sk.massDots=dots; sk.massEnds=ends; }

  // the crown as an ellipse: centre = mean of twig origins, radii = the twig ends' reach (柳: the strand canopy); cached on sk
  function crownOf(sk){ if(sk.crownE!==undefined)return sk.crownE; var tw=sk.twigs, n=tw.length, i, e=null;
    if(sk.kind==='liu'&&sk.canopy.length)e=sk.canopy[0];
    else if(n>=4){ var cx=0, cy=0, rx=1, ry=1; for(i=0;i<n;i++){ cx+=tw[i].pts[0][0]; cy+=tw[i].pts[0][1]; } cx/=n; cy/=n;
      for(i=0;i<n;i++){ var q=tw[i].pts[3], dx=Math.abs(q[0]-cx), dy=Math.abs(q[1]-cy); if(dx>rx)rx=dx; if(dy>ry)ry=dy; } e={x:cx,y:cy,rx:rx,ry:ry}; }
    sk.crownE=e; return e; }

  // where twigs cross (segment against segment, each pair once, the ends excluded)
  function twigCrossings(tw){ var cr=[], i, k, seg=function(a,b,c,d2){ var r1x=b[0]-a[0], r1y=b[1]-a[1], r2x=d2[0]-c[0], r2y=d2[1]-c[1], den=r1x*r2y-r1y*r2x; if(Math.abs(den)<1e-6)return null;
      var t2=((c[0]-a[0])*r2y-(c[1]-a[1])*r2x)/den, u2=((c[0]-a[0])*r1y-(c[1]-a[1])*r1x)/den; if(t2<0.05||t2>0.95||u2<0.05||u2>0.95)return null; return [a[0]+r1x*t2,a[1]+r1y*t2]; };
    for(i=0;i<tw.length;i++)for(k=i+1;k<tw.length;k++){ var A=tw[i].pts, B=tw[k].pts, found=null, bA=A[0][0]<B[0][0]?A:B, bB=bA===A?B:A;
      if(Math.min(bB[0][0],bB[3][0])-Math.max(bA[0][0],bA[3][0])>14)continue;
      for(var ia=0;ia<3&&!found;ia++)for(var ib=0;ib<3&&!found;ib++)found=seg(A[ia],A[ia+1],B[ib],B[ib+1]);
      if(found)cr.push(found); }
    return cr; }

  // the through-gap beside the featured knot (D-14): a band of silk 0.12–0.18 h wide on the limb's upper side, running from the
  // start of the knot on outward past the crown edge; every twig and secondary limb that begins or ends in it is taken away
  function featureGap(ctx,sk){ var rr=ctx.rr, ch=sk.feat, P=ch.pts, cum=ch.cum, L=cum[cum.length-1], q=at(P,cum,L*0.45), t=at(P,cum,L*0.8), h=sk.h;
    var nx=-q.ty, ny=q.tx; if(ny>0){ nx=-nx; ny=-ny; } // the upper side
    var gw=h*rr(0.12,0.18), rk=h*0.09+4, ax=q.x+nx*(rk+gw/2), ay=q.y+ny*(rk+gw/2), dx=t.tx, dy=t.ty, dl=Math.sqrt(dx*dx+dy*dy)||1, gl=h*0.6, i;
    dx/=dl; dy/=dl; if(dy>0.2){ dy=0.2; dx=(dx<0?-1:1)*Math.sqrt(1-0.04); } // the band climbs or runs out, never down into the trunk
    var inGap=function(p){ var ux=p[0]-ax, uy=p[1]-ay, s=ux*dx+uy*dy; if(s<0||s>gl)return false; var d=Math.abs(ux*dy-uy*dx); return d<gw/2; };
    sk.gap={x:ax,y:ay,dx:dx,dy:dy,len:gl,w:gw}; sk.inGap=inGap;
    var tw=[], te=[]; for(i=0;i<sk.twigs.length;i++){ var pts=sk.twigs[i].pts; if(inGap(pts[0])||inGap(pts[2])||inGap(pts[3]))continue; tw.push(sk.twigs[i]); te.push(sk.twigEnds[i]); }
    sk.twigs=tw; sk.twigEnds=te;
    var br=[]; for(i=0;i<sk.branches.length;i++){ var bp=sk.branches[i].pts; if(inGap(bp[0])||inGap(bp[bp.length-1]))continue; br.push(sk.branches[i]); } sk.branches=br;
    var tp=[]; for(i=0;i<sk.tips.length;i++)if(!inGap([sk.tips[i].x,sk.tips[i].y]))tp.push(sk.tips[i]); sk.tips=tp; }

  // willow 垂条 sheaf: 3–6 strands touching at (sx,sy), each falling 0.3–0.8 of the drop to the ground with two or three gentle
  // bends, its own length and a soft end; `bow` is the sideways drift the whole sheaf shares — the way the sweep it hangs from bows
  function sheaf(ctx,sk,sx,sy,bow){ var rr=ctx.rr, ri=ctx.ri, R=ctx.R, drop=Math.max(8,sk.y-rr(4,12)-sy), ns=ri(3,6), lean=(bow===undefined?rr(-1.5,1.5):bow), i, k;
    for(k=0;k<ns;k++){ var len=Math.min(drop*rr(0.3,0.8),sk.h*rr(0.35,0.5)), spread=(k-(ns-1)/2)/(ns-1)*rr(5,11)*(0.5+0.5*len/40)+lean, nb=ri(2,3), amp=rr(0.8,2.2)*(R()<0.5?-1:1), ph=rr(0,3), pts=[];
      for(i=0;i<=6;i++){ var t=i/6; pts.push([sx+spread*t+lean*t*t*1.5+amp*Math.sin(t*nb*1.9+ph)*Math.min(1,t*3),sy+len*t]); }
      sk.strands.push(pts); for(i=0;i<pts.length;i++)sk.pts.push(pts[i]); } }
  // a needle tuft: 6–11 needles in a fan about `ang` (the limb's own direction, lifted), tufts alternately dark and pale
  function cluster(ctx,sk,x,y,rs,ang){ var rr=ctx.rr, ri=ctx.ri; sk.clusters.push({x:x,y:y,r:rs*rr(0.9,1.25),n:ri(6,11),c:(ang===undefined?-Math.PI/2:ang)+rr(-0.25,0.25),sp:rr(1.05,2.1),dark:sk.clusters.length%2===0}); sk.pts.push([x,y-rs]); }

  function growReeds(ctx,sk){ var rr=ctx.rr, ri=ctx.ri, R=ctx.R, n=ri(5,9), h=sk.h, dir=sk.dir, i, k;
    sk.stalks=[]; for(i=0;i<n;i++){ var bx=sk.x+rr(-2.5,2.5), L=h*rr(0.6,1), a=-Math.PI/2+dir*rr(0.05,0.35)+rr(-0.12,0.12), pts=[[bx,sk.y]], cx=bx, cy=sk.y, droop=dir*rr(0.05,0.2);
      for(k=1;k<=4;k++){ a+=droop; cx+=Math.cos(a)*L/4; cy+=Math.sin(a)*L/4; pts.push([cx,cy]); }
      var plume=[]; if(R()<0.8){ var np=ri(2,3); for(k=0;k<np;k++){ var pa=a+dir*rr(0.15,0.4)+k*0.18, pl=rr(3,5); plume.push([[cx,cy],[cx+Math.cos(pa)*pl*0.5,cy+Math.sin(pa)*pl*0.5+0.3],[cx+Math.cos(pa)*pl,cy+Math.sin(pa)*pl+1]]); } }
      sk.stalks.push({pts:pts,plume:plume,a:a}); }
    sk.crown=[sk.x,sk.y-h*0.8]; sk.top=[sk.x,sk.y-h]; }

  // 折带 rock: angular outline, left face, stepped top, right shoulder; dir<0 mirrors the shape (the polygon is re-ordered base-left first)
  function growRock(ctx,sk){ var rr=ctx.rr, x=sk.x, y=sk.y, h=sk.h, w=h*rr(1.3,2.1), d=sk.dir;
    var P=[[-w/2,0],[-w/2+rr(0,0.15)*w,-h*rr(0.35,0.55)],[-w/2+rr(0.1,0.25)*w,-h*rr(0.8,1)],[-rr(0.05,0.2)*w,-h],[rr(0.05,0.25)*w,-h*rr(0.85,1)],[w/2-rr(0,0.12)*w,-h*rr(0.5,0.7)],[w/2,-h*rr(0.1,0.3)],[w/2-rr(0,0.1)*w,0]];
    for(var i=0;i<P.length;i++)P[i]=[x+P[i][0]*d,y+P[i][1]];
    if(d<0)P.reverse();
    sk.poly=P; sk.w=w; sk.bb=bbox(P); sk.crown=[x,y-h]; sk.top=[x,y-h]; }

  // ---------------------------------------------------------------- footprint
  function footprint(ctx,s){ var sk=skeleton(ctx,s);
    if(sk.kind==='rock')return {x0:sk.bb[0],x1:sk.bb[2],y0:sk.bb[1],y1:sk.bb[3],z:sk.z,inside:ctx.polyInside(sk.poly)};
    if(sk.kind==='luwei')return {x0:sk.x-1,x1:sk.x+1,y0:sk.y-1,y1:sk.y,z:sk.z,inside:function(){ return false; }};
    var tin=ctx.polyInside(sk.trunkPoly), tb=bbox(sk.trunkPoly), can=sk.canopy, x0=tb[0], y0=tb[1], x1=tb[2], y1=tb[3];
    for(var i=0;i<can.length;i++){ var c=can[i]; x0=Math.min(x0,c.x-c.rx); x1=Math.max(x1,c.x+c.rx); y0=Math.min(y0,c.y-c.ry); y1=Math.max(y1,c.y+c.ry); }
    return {x0:x0,x1:x1,y0:y0,y1:y1,z:sk.z,inside:function(px,py){ if(tin(px,py))return true;
      for(var k=0;k<can.length;k++){ var e=can[k], u=(px-e.x)/e.rx, v=(py-e.y)/e.ry; if(u*u+v*v<=1)return true; } return false; }}; }

  // ---------------------------------------------------------------- build
  function build(ctx,s){ var sk=skeleton(ctx,s);
    if(sk.kind==='luwei')drawReeds(ctx,sk); else if(sk.kind==='rock')drawRock(ctx,sk); else drawTree(ctx,sk);
    var fp=footprint(ctx,s), out={fp:fp,slots:{crown:sk.crown,top:sk.top,kind:sk.kind}}; ctx.reg.trees.push(out); return out; }

  function drawTree(ctx,sk){
    var ST=ctx.ST, C=ctx.C, rr=ctx.rr, ri=ctx.ri, R=ctx.R, z=sk.z, T=K[sk.kind], h=sk.h, S=sk.S, n=S.length, i, k;
    var G=grades(ctx), PR=G.P, SG=G.S, TX=G.T, ink=batch(ctx,ST.TREES,C.ink,z), iv=sk.inkv, A=function(a){ return Math.max(40,Math.min(240,a+iv)); };
    // trunk edges (D-10 c): two woody strokes, heaviest at the root and thinning up to the fork, no head; each breaks at a knot on its side
    var limbs=limbBatch(ctx,ST.TREES,C.ink,z);
    var edge=function(E,side){ var cut=-1;
      for(var q=0;q<sk.knots.length;q++)if(sk.knots[q].side===side)cut=Math.round(sk.knots[q].t*(n-1));
      if(cut>3&&cut<n-4){ limbs.push(E.slice(0,cut),PR.w*0.95,PR.w*1.3,A(PR.a-6),A(PR.a+25)); limbs.push(E.slice(cut+1),PR.w*0.85,PR.w*1.05,A(PR.a-14),A(PR.a+8)); }
      else limbs.push(E,PR.w*0.85,PR.w*1.3,A(PR.a-14),A(PR.a+25)); };
    edge(sk.L,-1); edge(sk.Rt,1);
    // 节疤 (D-19 (1), B9 tell 1): the ring at structural ×1.3, and the eye of the knot filled with 积墨 — two or three short heavy
    // strokes curling inside the ring, the darkest marks on the trunk — so at 1× every trunk carries a black spot or two
    for(i=0;i<sk.knots.length;i++){ var kn=sk.knots[i], ki=Math.round(kn.t*(n-1)), kc=lerp(sk.L[ki],sk.Rt[ki],kn.side<0?0.22:0.78), ring=[];
      for(k=0;k<=6;k++){ var ka=kn.a0+k*0.75; ring.push([kc[0]+Math.cos(ka)*kn.r,kc[1]+Math.sin(ka)*kn.r*0.8]); }
      ctx.bline(ST.TREES,mx(ring),C.ink,A(Math.min(240,SG.a*1.3+rr(-8,12))),Math.min(0.9,SG.w*1.3*rr(0.95,1.08)),ring,z);
      var ne=ri(2,3), eb=batch(ctx,ST.TREES,C.ink,z); for(k=0;k<ne;k++){ var ea0=kn.a0+k*2.1+rr(-0.4,0.4), er=kn.r*rr(0.55,0.95), ex0=kc[0]+Math.cos(ea0)*er*0.5, ey0=kc[1]+Math.sin(ea0)*er*0.4;
        eb.push({p:[[ex0,ey0],[ex0+Math.cos(ea0+1.2)*er,ey0+Math.sin(ea0+1.2)*er*0.8],[ex0+Math.cos(ea0+2.4)*er*1.1,ey0+Math.sin(ea0+2.4)*er*0.9]],w:Math.max(0.8,kn.r*rr(0.5,0.75)),a:A(PR.a+rr(10,30))}); }
      eb.done(); }
    // 露根: each root leaves the flare a little up the edge, lifts, then runs out and down into the ground line, structural grade
    for(i=0;i<sk.roots.length;i++){ var ro=sk.roots[i], rj=Math.max(1,Math.round(ro.t*(n-1))), rp=ro.side<0?sk.L[rj]:sk.Rt[rj], gy=sk.y+ro.drop;
      var rpts=[[rp[0],rp[1]],[rp[0]+ro.side*ro.len*0.35,rp[1]-ro.lift*0.3],[rp[0]+ro.side*ro.len*0.7,gy-ro.lift*0.2],[rp[0]+ro.side*ro.len,gy+rr(0,0.6)]];
      ctx.bline(ST.TREES,mx(rpts),C.ink,A(SG.a+rr(-4,18)),SG.w*rr(1.05,1.25),rpts,z);
      if(R()<0.6)ink.push({p:[[rp[0]+ro.side*ro.len*0.5,gy+rr(0.5,1.5)],[rp[0]+ro.side*(ro.len+rr(2,4)),gy+rr(0.8,2)]],w:TX.w*rr(1,1.15),a:A(TX.a+rr(-10,15))}); }
    // 皴 along the shaded side
    var ns=ri(7,12); for(i=0;i<ns;i++){ var ci=ri(2,n-3), cp=lerp(sk.L[ci],sk.Rt[ci],rr(0.1,0.45)), tg=S[Math.min(n-1,ci+1)], tb=S[Math.max(0,ci-1)], tl=Math.sqrt((tg[0]-tb[0])*(tg[0]-tb[0])+(tg[1]-tb[1])*(tg[1]-tb[1]))||1, sl=rr(2.5,6);
      ink.push({p:[cp,[cp[0]+(tg[0]-tb[0])/tl*sl*0.5+rr(-0.3,0.3),cp[1]+(tg[1]-tb[1])/tl*sl*0.5],[cp[0]+(tg[0]-tb[0])/tl*sl,cp[1]+(tg[1]-tb[1])/tl*sl]],w:TX.w*rr(1.1,1.3),a:A(SG.a+rr(-25,10))}); }
    if(sk.kind==='song'){ // 鳞 hatch: short arcs across the trunk, alternating sides
      var sd=R()<0.5?0:1; for(var yy=rr(1.5,3);yy<n-2;yy+=rr(1.8,3)){ var hi=Math.round(yy), u0=sd?0.4:0.05, u1=sd?0.95:0.6, p0=lerp(sk.L[hi],sk.Rt[hi],u0+rr(-0.05,0.05)), p2=lerp(sk.L[hi],sk.Rt[hi],u1+rr(-0.05,0.05)), pm=lerp(p0,p2,0.5);
        ink.push({p:[p0,[pm[0],pm[1]+rr(0.6,1.3)],p2],w:TX.w*rr(1,1.15),a:TX.a+rr(0,30)}); sd=1-sd; } }
    ink.done();
    // limbs (D-10 c): every woody line thickens toward its base and simply ends at the tip. The dominant chains lie on the sweeps:
    // where the limb is wider than a line it is two edges converging, then one line thinning to the tip; secondary limbs and twigs
    // are single lines, base heavier than tip, subordinate ones a step paler
    for(i=0;i<sk.chains.length;i++){ var ch=sk.chains[i], P=crom(ch.pts,1.5), cum=arcOf(P), L=cum[cum.length-1], w0=ch.w0, dom=ch.role==='dom', j;
      var wg=function(s){ return w0*Math.pow(1-s/L,1.15); }, sj=0; while(sj<P.length&&wg(cum[sj])>0.95)sj++;
      var aB=dom?PR.a-6:SG.a-10, aT=dom?SG.a-10:TX.a+5;
      if(ch.limb){ aB=PR.a+10; } // D-19 (1): the base of every big limb is dark where it leaves the trunk
      if(sj>3){ var D=P.slice(0,sj+1), E1=offset(D,function(t){ return wg(t*cum[sj])/2; }), E2=offset(D,function(t){ return -wg(t*cum[sj])/2; });
        limbs.push(E1,PR.w*0.7,PR.w*(ch.limb?1.1:0.95),A(aT+10),A(aB)); limbs.push(E2,PR.w*0.7,PR.w*(ch.limb?1.1:0.95),A(aT+10),A(aB));
        // the crotch: a short heavy stroke along the limb's under side over its first tenth, the ink gathered where the limb bears
        if(ch.limb&&cum[sj]>8){ var cl0=0; while(cl0<D.length-1&&cum[cl0]<Math.min(cum[sj]*0.35,h*0.06))cl0++; var under=D[2][0]>D[0][0]?E2:E1, cr=[];
          for(j=0;j<=cl0;j++)cr.push([under[j][0],under[j][1]]); if(cr.length>2)limbs.push(cr,PR.w*0.9,PR.w*1.3,A(PR.a+8),A(PR.a+30)); } }
      var rest=P.slice(Math.max(0,sj-1)); if(rest.length>2)limbs.push(rest,TX.w*0.8,Math.min(0.95,sj>3?0.95:w0),A(aT),A(sj>3?aB-10:aB)); }
    for(i=0;i<sk.branches.length;i++){ var b=sk.branches[i], far=b.role==='far', wB=far?SG.w*0.85:SG.w*1.05, wT=TX.w*(far?0.7:0.8), aB2=far?SG.a-25:SG.a-(b.lvl-2)*12, aT2=far?TX.a-8:TX.a+6;
      limbs.push(crom(b.pts,1.5),wT*(b.lvl>=3?0.85:1),Math.min(0.9,Math.min(wB,b.w+0.2))*(b.lvl>=3?0.8:1),A(aT2),A(aB2)); }
    // twigs: pale at the tip, a step darker at the base where they gather in the crown (D-19 (1): the mass sits inside, the rim stays a lace)
    var ce=crownOf(sk); for(i=0;i<sk.twigs.length;i++){ var tw=sk.twigs[i], to=tw.pts[0], din=ce?Math.sqrt(Math.pow((to[0]-ce.x)/ce.rx,2)+Math.pow((to[1]-ce.y)/ce.ry,2)):1, inn=din<0.7;
      limbs.push(crom(tw.pts,1.2),TX.w*0.55,TX.w*(inn?1.15:1.05),A(TX.a-12),A(TX.a+(inn?32:12))); }
    limbs.done();
    if(sk.kind==='liu'){ var zf=function(){ return z; };
      for(i=0;i<sk.strands.length;i++)plineZ(ctx,ST.TREES,C.ink,A(TX.a+rr(-14,8)),TX.w*rr(0.95,1.15),sk.strands[i],zf,true);
      // 汁绿: pale sparse dots on the hanging ends of some strands; 花青 under a few branch ends
      var lv2=batch(ctx,ST.INDIGO,ZHILV,z);
      for(i=0;i<sk.strands.length;i++)if(R()<0.45){ var dd=dens(sk.strands[i],rr(4.5,7)); for(k=Math.floor(dd.length*0.62);k<dd.length;k++)lv2.push({p:[[dd[k][0]+rr(-0.6,0.6),dd[k][1]]],w:rr(1,1.4),a:rr(30,48)}); }
      lv2.done();
      var nh=ri(2,4); for(i=0;i<nh;i++){ var ht=sk.tips[ri(0,sk.tips.length-1)], hx=ht.x, hy=ht.y+3;
        ctx.dabs(ST.INDIGO,{x0:hx-5,x1:hx+5,y0:hy-4,y1:hy+4,z:z,inside:function(px,py){ return (px-hx)*(px-hx)/25+(py-hy)*(py-hy)/16<=1; }},C.huaqing,0.16,2.5,2.5); } }
    if(sk.kind==='song'){ var nd=batch(ctx,ST.TREES,C.ink,z);
      for(i=0;i<sk.clusters.length;i++){ var c=sk.clusters[i];
        for(k=0;k<c.n;k++){ var na=c.c-c.sp/2+k*c.sp/(c.n-1)+rr(-0.08,0.08), nl2=c.r*rr(0.65,1.05), ox=c.x+rr(-0.6,0.6), oy=c.y+0.5;
          nd.push({p:[[ox,oy],[ox+Math.cos(na)*nl2,oy+Math.sin(na)*nl2]],w:TX.w*rr(1,1.2),a:c.dark?SG.a+rr(0,25):TX.a+rr(-5,15)}); } }
      nd.done(); }
    if(sk.kind==='wutong'){ var bl=batch(ctx,ST.TREES,C.ink,z);
      for(i=0;i<sk.balls.length;i++){ var ba=sk.balls[i], bx=ba.x+Math.cos(ba.a)*ba.len, by=ba.y+Math.sin(ba.a)*ba.len;
        bl.push({p:[[ba.x,ba.y],[bx,by]],w:0.4,a:rr(130,160)}); bl.push({p:[[bx,by+0.6]],w:1.5,a:rr(150,190)}); }
      bl.done(); }
    // 赭石 on the trunk (梧桐: the light patches stay silk), 淡墨 on the shaded left side
    var poly=sk.trunkPoly, pb=bbox(poly), pred=null, ptests=[];
    for(i=0;i<sk.patches.length;i++){ var pa=sk.patches[i], i0=Math.round(pa.t*(n-1)), i1=Math.min(n-1,Math.round((pa.t+pa.len)*(n-1))), q0=lerp(sk.L[i0],sk.Rt[i0],pa.u), qa=lerp(sk.L[i0],sk.Rt[i0],pa.u+pa.w), qb=lerp(sk.L[i1],sk.Rt[i1],pa.u+pa.w*0.8), qc=lerp(sk.L[i1],sk.Rt[i1],pa.u+0.05);
      ptests.push(ctx.polyInside([q0,qa,qb,qc])); if(R()<0.5)ctx.wash(ST.INDIGO,[q0,qa,qb,qc],C.danmo,0.16,2.2,2,z); }
    if(ptests.length)pred=function(px,py){ for(var q=0;q<ptests.length;q++)if(ptests[q](px,py))return false; return true; };
    ctx.dabs(ST.OCHRE,{x0:pb[0],x1:pb[2],y0:pb[1],y1:pb[3],z:z,inside:ctx.polyInside(poly),edge:ctx.polyEdge(poly)},C.ochre,rr(0.38,0.46),2.5,2.5,pred);
    // D-19 (1): the shaded side of the trunk carries a 淡墨 band at 0.3 (was 0.22), and its lower third once more, so the trunk has a dark side at 1×
    ctx.wash(ST.INDIGO,sk.L.concat(sk.inner.slice().reverse()),C.danmo,0.34,2.2,2,z);
    // the band itself is a stroke, not only dabs (a 4-px trunk holds too few dab cells to darken): one 淡墨 woody stroke up the
    // shaded half, 0.7 of the half-width at the root thinning to the fork, alpha 125 → 80, broken where the trunk is hidden
    var bandL=sk.L, bandP=[], bw0=sk.wfn(0.12,-1), bw1=sk.wfn(1,-1); for(i=0;i<n;i++){ var bt=n>1?i/(n-1):0; bandP.push(lerp(S[i],bandL[i],0.55)); }
    var band=limbBatch(ctx,ST.INDIGO,C.danmo,z); band.push(bandP,Math.max(0.5,bw1*0.6),Math.max(0.8,bw0*0.7),80,125); band.done();
    var lo3=Math.max(3,Math.round(n*0.38)); ctx.wash(ST.INDIGO,sk.L.slice(0,lo3).concat(sk.inner.slice(0,lo3).reverse()),C.danmo,0.22,2.2,2,z);
    // crown colour (D-19 (3), B9 tell ③): over a 淡赭 base 0.15 on the crown's inner half, a 汁绿 wash 0.18–0.26 on the inner half
    // of 柳 / 槐 / 梧桐 crowns (thinning to nothing at the ellipse's edge through noise holes — the silk and the twigs show
    // through), and 石绿 0.2 only as two or three local touches on the lit (right) side where twigs cross; never a solid green
    // crown. 松: 淡花青 0.2 on the shaded-side tufts. 樱 / 桃 carry blossom and get no green.
    var cc=crownOf(sk), ell=function(cx0,cy0,ax,ay,soft){ return {x0:cx0-ax,x1:cx0+ax,y0:cy0-ay,y1:cy0+ay,z:z,inside:function(px,py){ var u=(px-cx0)/ax, v=(py-cy0)/ay; return u*u+v*v<=1; },
      pred:function(px,py){ var u=(px-cx0)/ax, v=(py-cy0)/ay; return ctx.noise(px*0.11,py*0.11,5.7)>0.22+soft*(u*u+v*v); }}; };
    if(cc&&sk.kind!=='song'&&sk.kind!=='ying'&&sk.kind!=='tao'){ var ix=cc.x-cc.rx*0.1, iy=cc.y+cc.ry*0.05, irx=cc.rx*0.58, iry=cc.ry*0.55, inner=ell(ix,iy,irx,iry,0.5);
      ctx.dabs(ST.OCHRE,inner,C.ochre,0.15,2.5,2.5,inner.pred);
      // D-21 (B10 ⑤): the 汁绿 follows the leaf masses, not the crown — one wash per mass (its ellipse ×1.15, through the same
      // noise holes, thinning at the mass's rim, never into the through-gap); the willow keeps its canopy wash
      if(sk.kind==='liu')ctx.dabs(ST.INDIGO,inner,C.zhilv||ZHILV,rr(0.18,0.26),2.5,2.5,inner.pred);
      else if((sk.kind==='huai'||sk.kind==='wutong')&&sk.masses){ var gi=rr(0.18,0.26), massD=sk.massD, inGap=sk.inGap;
        for(i=0;i<sk.masses.length;i++){ var mm=sk.masses[i], ex=Math.sqrt(mm.rx*mm.rx*mm.c*mm.c+mm.ry*mm.ry*mm.s*mm.s)*1.15, ey=Math.sqrt(mm.rx*mm.rx*mm.s*mm.s+mm.ry*mm.ry*mm.c*mm.c)*1.15;
          ctx.dabs(ST.INDIGO,{x0:mm.x-ex,x1:mm.x+ex,y0:mm.y-ey,y1:mm.y+ey,z:z,inside:function(px,py){ return massD([px,py])<1.15; }},C.zhilv||ZHILV,gi,2.5,2.5,
            function(px,py){ if(inGap&&inGap([px,py]))return false; var dq=massD([px,py]); return ctx.noise(px*0.11,py*0.11,5.7)>0.22+0.5*dq*dq; }); } }
      var lit=[], crs=sk.massDots||sk.crossAll||[]; for(i=0;i<crs.length;i++)if(crs[i][0]>cc.x+cc.rx*0.1)lit.push(crs[i]); if(!lit.length)for(i=0;i<sk.twigEnds.length;i++)if(sk.twigEnds[i][0]>cc.x+cc.rx*0.15)lit.push(sk.twigEnds[i]);
      var nsl=Math.min(lit.length,ri(2,3)); for(i=0;i<nsl;i++){ var sp0=lit[ri(0,lit.length-1)], sr=rr(2.5,4.5), se=ell(sp0[0],sp0[1],sr*1.2,sr*0.85,0.3); ctx.dabs(ST.INDIGO,se,C.shilv||SHILV,0.2,2.2,2.2,se.pred); } }
    if(sk.kind==='song'){ for(i=0;i<sk.clusters.length;i++){ var pc=sk.clusters[i]; if(pc.x<sk.x-2&&pc.dark&&R()<0.8){ var pe=ell(pc.x,pc.y-pc.r*0.3,pc.r*0.95,pc.r*0.8,0.4); ctx.dabs(ST.INDIGO,pe,C.huaqing,0.16,2.3,2.3,pe.pred); } } }
    // 樱 / 桃: a few 淡朱砂 dots near the tips in the last pass, 樱 with silk-light ones beside them
    // 樱 / 桃: dot clusters on a third of the twigs — 淡朱砂 clusters in the last pass (樱 with a silk-light dot or two beside them),
    // the rest 淡墨 clusters in the 花青 pass, so the crown reads as bloom-and-shadow rather than an even sprinkle
    // leaf dots (D-19 (1), B9 tell 5): 淡墨 dot clusters where twigs cross — two to four dots 0.9–1.4 px, alpha 70–120 — on every
    // 槐/杂 crown (樱/桃/梧桐 fewer, they carry blossom and balls), so at 1× the crown is a mass with holes, not a lace
    // D-21 (B10 ⑤): the dots sit only inside the leaf masses (`sk.massDots`, one per kept anchor): in the heart of a mass 1.5–2 px
    // at alpha 120–160, touching, so the mass closes; toward its rim smaller and paler, so the edge is soft; between the masses
    // nothing — silk and twigs. 梧桐/樱/桃 carry balls and blossom in the same masses and take a third as many 淡墨 dots.
    if(sk.massDots){ var ld=batch(ctx,ST.INDIGO,C.ink,z), md=sk.massDots, bare=sk.kind==='huai'||sk.kind==='za';
      for(i=0;i<md.length;i++){ if(!bare&&R()>=0.35)continue; var dm0=md[i], core=dm0[2]<0.6;
        ld.push({p:[[dm0[0]+rr(-0.3,0.3),dm0[1]+rr(-0.3,0.3)]],w:core?rr(1.5,2):rr(1.1,1.6),a:core?rr(120,160):rr(70,115)}); }
      ld.done(); }
    if(sk.blooms){ var zh=batch(ctx,ST.FINISH,C.zhusha,z), wh=batch(ctx,ST.FINISH,HUA,z), dm=batch(ctx,ST.INDIGO,C.ink,z);
      for(i=0;i<sk.blooms.length;i++){ var bl2=sk.blooms[i];
        for(k=0;k<bl2.dots.length;k++){ var d=bl2.dots[k];
          if(bl2.red)zh.push({p:[d],w:rr(1.2,1.7),a:sk.kind==='tao'?rr(105,145):rr(85,125)});
          else dm.push({p:[d],w:rr(1.1,1.6),a:rr(55,85)}); }
        if(bl2.red&&sk.kind==='ying'&&R()<0.5)wh.push({p:[[bl2.dots[0][0]+rr(-2,2),bl2.dots[0][1]+rr(-2,1)]],w:1.5,a:rr(100,130)}); }
      zh.done(); wh.done(); dm.done(); } }

  function drawReeds(ctx,sk){ var ST=ctx.ST, C=ctx.C, rr=ctx.rr, z=sk.z, i, k, pl=batch(ctx,ST.TREES,C.ink,z);
    for(i=0;i<sk.stalks.length;i++){ var st=sk.stalks[i]; ctx.bline(ST.TREES,mx(st.pts),C.ink,rr(130,180),rr(0.4,0.5),st.pts,z);
      for(k=0;k<st.plume.length;k++)pl.push({p:st.plume[k],w:rr(0.5,0.65),a:rr(140,175)}); }
    var nl=ctx.ri(2,3); for(i=0;i<nl;i++){ var ls=ctx.R()<0.5?-1:1, lx=sk.x+rr(-2,2), L=rr(5,9); pl.push({p:[[lx,sk.y],[lx+ls*L*0.5,sk.y-L*0.6],[lx+ls*L,sk.y-L*0.75]],w:rr(0.4,0.5),a:rr(120,160)}); }
    pl.done();
    var bx=sk.x, by=sk.y; ctx.dabs(ST.OCHRE,{x0:bx-5,x1:bx+5,y0:by-4,y1:by+1,z:z,inside:function(px,py){ return (px-bx)*(px-bx)/25+(py-by+1.5)*(py-by+1.5)/6<=1; }},C.ochre,0.2,2.5,2.5); }

  function drawRock(ctx,sk){ var ST=ctx.ST, C=ctx.C, rr=ctx.rr, ri=ctx.ri, z=sk.z, P=sk.poly, w=sk.w, h=sk.h, G=grades(ctx), i;
    // outline in three runs — heavy over the top and left face, lighter down the right, the base mostly open
    var A=dens([P[0],P[1],P[2],P[3]],2), B=dens([P[3],P[4],P[5]],2), Cc=dens([P[5],P[6],P[7]],2);
    ctx.bline(ST.TREES,mx(A),C.ink,G.P.a+rr(0,20),G.P.w*rr(1.05,1.2),A.slice(0,A.length-1),z);
    ctx.bline(ST.TREES,mx(B),C.ink,G.P.a+rr(-5,12),G.P.w*rr(0.95,1.1),B.slice(1),z);
    ctx.bline(ST.TREES,mx(Cc),C.ink,G.S.a+rr(10,30),G.S.w*rr(1,1.15),Cc.slice(1),z);
    var base=dens([P[7],P[0]],2), nb=Math.round(base.length*rr(0.3,0.5)); ctx.bline(ST.TREES,mx(base),C.ink,G.T.a+rr(20,40),G.S.w,base.slice(0,Math.max(2,nb)),z);
    // 折带皴: a stroke runs across, folds down sharply, runs on
    var zd=batch(ctx,ST.TREES,C.ink,z), nf=ri(2,3);
    for(i=0;i<nf;i++){ var u=rr(0.25,0.75), s0=lerp(P[0],P[2],u), run=w*rr(0.3,0.5), drop=h*rr(0.2,0.35);
      var p1=[s0[0]+run,s0[1]+rr(-1,1)], p2=[p1[0]+drop*0.35,p1[1]+drop], p3=[p2[0]+rr(0.1,0.25)*w,p2[1]+rr(-0.5,1)];
      zd.push({p:[[s0[0]+rr(1,3),s0[1]],p1,p2,p3],w:G.S.w*rr(0.85,1),a:G.S.a+rr(-30,5),v:true}); }
    zd.done();
    ctx.wash(ST.OCHRE,P,C.ochre,rr(0.16,0.24),2.5,2.5,z);
    ctx.wash(ST.INDIGO,[P[0],P[1],P[2],P[3],[sk.x,sk.y-h*0.55],[sk.x-w*0.1,sk.y]],C.danmo,0.17,2.2,2,z);
    var mo=batch(ctx,ST.FINISH,C.ink,z), nm=ri(2,3); for(i=0;i<nm;i++){ var mp=lerp(P[2],P[4],rr(0,1)); mo.push({p:[[mp[0]+rr(-1,1),mp[1]-rr(0,1)]],w:rr(1,1.4),a:rr(180,220)}); } mo.done(); }

  // ---------------------------------------------------------------- bank
  // spec {pts:[[x,y]..] the 坡口 edge, depth (px the slope runs toward +y; negative runs up), slope (x per unit of depth, default -0.3),
  //       z (default: each mark's own y), grass (tufts per 100 px, default 2), moss (点苔, default true)}
  function bank(ctx,s){ var ST=ctx.ST, C=ctx.C, rr=ctx.rr, ri=ctx.ri, R=ctx.R, G=grades(ctx), i, k;
    var depth=s.depth===undefined?24:s.depth, slope=s.slope===undefined?-0.3:s.slope, sg=depth<0?-1:1, ad=Math.abs(depth), dl=Math.sqrt(slope*slope+1), dx=slope/dl*sg, dy=sg/dl;
    var E=dens(s.pts,4); for(i=0;i<E.length;i++){ E[i][1]+=(ctx.noise(E[i][0]*0.05,7.3)-0.5)*2.4; }
    var zf=function(p){ return s.z===undefined?p[1]:s.z; }, cum=arcOf(E), total=cum[cum.length-1], sc=Math.max(0.6,Math.min(1.3,ad/24));
    // 起稿: the faint edge, a fifth of it missing, not quite where the final line will go
    var dr=runs(ctx,E,30,60); for(i=0;i<dr.length;i++)if(R()<0.8){ var sh=rr(-0.8,0.8), dp=dr[i].map(function(p){ return [p[0],p[1]+sh]; }); plineZ(ctx,ST.DRAFT,C.ink,rr(60,90),0.5,dp,zf,false); }
    // 坡口 in pieces with pressure: some pieces missing, ends pulled in so the gaps show, a few doubled below
    var tr=runs(ctx,E,40,90); for(i=0;i<tr.length;i++){ if(R()<0.15)continue; var pc=tr[i].slice(ri(0,1),tr[i].length-ri(0,1)); if(pc.length<3)continue;
      var sh2=rr(-0.5,0.5), pp=pc.map(function(p){ return [p[0],p[1]+sh2]; }), zz=s.z===undefined?bbox(pp)[3]:s.z;
      ctx.bline(ST.TREES,mx(pp),C.ink,G.S.a+rr(-20,40),G.S.w*rr(1,1.3),pp,zz);
      if(R()<0.3){ var d0=ri(0,Math.max(0,pp.length-6)), dbl=pp.slice(d0,d0+ri(3,6)).map(function(p){ return [p[0]+dx*1.5,p[1]+dy*1.5+rr(-0.3,0.3)]; }); if(dbl.length>=2)ctx.bline(ST.TREES,mx(dbl),C.ink,G.T.a+rr(0,30),G.T.w*1.2,dbl,zz); } }
    // 短皴 in groups down the slope, grass tufts, 点苔
    var cun=batch(ctx,ST.TREES,C.ink,null), pos=rr(6,30);
    while(pos<total-4){ var ng=ri(3,6), lean=rr(-0.35,0.35), deep=R()<0.45, cs=Math.cos(lean), sn=Math.sin(lean), ux=dx*cs-dy*sn, uy=dx*sn+dy*cs, bulge=rr(-0.6,0.6);
      for(k=0;k<ng;k++){ var q=at(E,cum,pos+k*rr(2,4.5)), off=rr(1,3.5)+(deep&&k%2?rr(5,9):0), L=rr(3,10)*sc*(k===0||k===ng-1?0.7:1), x0=q.x+dx*off, y0=q.y+dy*off;
        if(ctx.masks.hidden(x0,y0,zf([x0,y0])))continue; cun.push({p:[[x0,y0],[x0+ux*L*0.5-uy*bulge,y0+uy*L*0.5+ux*bulge],[x0+ux*L,y0+uy*L]],w:G.T.w*rr(1,1.3),a:G.T.a+rr(-30,25)}); }
      pos+=rr(18,70); }
    cun.done();
    var gr=batch(ctx,ST.TREES,C.ink,null), gp=rr(10,30), per=s.grass===undefined?2:s.grass;
    while(per>0&&gp<total-4){ var g=at(E,cum,gp), nt=ri(3,5), gl=rr(-0.4,0.4);
      if(!ctx.masks.hidden(g.x,g.y-1,zf([g.x,g.y])))for(k=0;k<nt;k++){ var ga=-Math.PI/2+gl+(k-(nt-1)/2)*rr(0.25,0.4), GL=rr(4,9), gx=g.x+rr(-1,1), gy=g.y-0.5, side=Math.cos(ga)<0?-1:1;
        gr.push({p:[[gx,gy],[gx+Math.cos(ga)*GL*0.55,gy+Math.sin(ga)*GL*0.55],[gx+Math.cos(ga)*GL+side*rr(0.5,1.5),gy+Math.sin(ga)*GL+rr(0.5,1.2)]],w:G.T.w*rr(1.1,1.3),a:G.T.a+rr(20,60)}); }
      gp+=rr(25,70)*2/per; }
    gr.done();
    if(s.moss!==false){ var mo=batch(ctx,ST.FINISH,C.ink,null), mp=rr(8,20);
      while(mp<total-4){ var m=at(E,cum,mp); if(R()<0.7&&!ctx.masks.hidden(m.x,m.y,zf([m.x,m.y])))mo.push({p:[[m.x+rr(-1,1),m.y+rr(-1,1)]],w:rr(1,1.3),a:rr(180,220)}); mp+=rr(15,45); }
      mo.done(); }
    // 赭石 over the slope band, holes left by the dab noise
    var foot=[]; for(i=E.length-1;i>=0;i--)foot.push([E[i][0]+dx*ad,E[i][1]+dy*ad]);
    var poly=E.concat(foot), zw=s.z===undefined?bbox(poly)[1]:s.z;
    ctx.wash(ST.OCHRE,poly,C.ochre,rr(0.18,0.28),3.5,3.5,zw);
    // D-19 (3): the foot of the near slope — the lower 55 % of the band — takes a 汁绿 wash 0.15 over the ochre, dissolving upward
    var mid=[]; for(i=0;i<E.length;i++)mid.push([E[i][0]+dx*ad*0.45,E[i][1]+dy*ad*0.45]); var fpoly=mid.concat(foot), fin=ctx.polyInside(fpoly), fb=bbox(fpoly);
    ctx.dabs(ST.INDIGO,{x0:fb[0],x1:fb[2],y0:fb[1],y1:fb[3],z:zw,inside:fin,edge:ctx.polyEdge(fpoly)},C.zhilv||ZHILV,0.15,3.2,3.2,function(px,py){ return ctx.noise(px*0.09,py*0.09,9.6)>0.3; });
    return {poly:poly}; }

  // ---------------------------------------------------------------- hill (蛇山 / 龟山 / 磨山)
  // spec {pts:[[x,y]..] the ridge line, right to left; depth: px of visible body under the ridge; z (default: ridge top y − 1, so
  //       everything standing on the body is nearer); tone:'ink'|'huaqing' for the wash}. The ridge is resampled once and cached as spec.hk.
  function hillSk(ctx,s){ if(s.hk)return s.hk;
    var E=dens(s.pts,3), i; for(i=0;i<E.length;i++)E[i][1]+=(ctx.noise(E[i][0]*0.04,11.7)-0.5)*3;
    var depth=s.depth===undefined?40:s.depth, foot=[], top=1e9, bot=-1e9;
    for(i=0;i<E.length;i++){ if(E[i][1]<top)top=E[i][1]; if(E[i][1]>bot)bot=E[i][1]; }
    // ridge height at x (the ridge runs one way in x; either direction)
    var fwd=E[0][0]<E[E.length-1][0], yat=function(x){ var lo=0, hi=E.length-1; while(hi-lo>1){ var md=(lo+hi)>>1; if(fwd?E[md][0]<x:E[md][0]>x)lo=md; else hi=md; } return E[lo][1]+(E[hi][1]-E[lo][1])*((x-E[lo][0])/((E[hi][0]-E[lo][0])||1)); };
    // the foot (D-13, B5 tell 4): one body from the ridge down to a foot that LIES FLAT — a near-horizontal ground level under the
    // whole hill (the ridge's own landing height where the ridge comes down to the ground, else `depth` under the crest), joined to
    // the ridge by a soft max so the lower edge is a curve that becomes horizontal, never a diagonal copy of the ridge
    var yBase=Math.min(Math.max(bot+2,top+depth),top+depth*1.6), soft=Math.max(4,depth*0.14);
    var footY=function(x){ var a=yat(x)+3, b=yBase+(ctx.noise(x*0.006,12.3)-0.5)*depth*0.12, m=Math.max(a,b); return m+soft*Math.log(Math.exp((a-m)/soft)+Math.exp((b-m)/soft)); };
    for(i=E.length-1;i>=0;i--)foot.push([E[i][0],footY(E[i][0])]);
    var poly=E.concat(foot), bb=bbox(poly), cum=arcOf(E), total=cum[cum.length-1], ic=0;
    for(i=1;i<E.length;i++)if(E[i][1]<E[ic][1])ic=i;
    // fold lines (D-08): three or four dominant directions leaving the crest and fanning down at different angles, each with a
    // slow curve; the body's 皴 gather along them and the wash sits on their shaded (left) side
    var nf=5, folds=[], tilt=ctx.rr(-0.3,0.3), k;
    for(k=0;k<nf;k++){ var u=(k/(nf-1)-0.5), st=Math.max(2,Math.min(total-2,cum[ic]+u*total*ctx.rr(0.55,0.8)+ctx.rr(-10,10))), q=at(E,cum,st);
      // the fold runs from the crest to the foot: steep near the ridge, lying down as it nears the ground (its lateral direction
      // becomes horizontal), so the 皴 that follow it also lie down
      var th=u*ctx.rr(1.1,1.7)+tilt+ctx.rr(-0.18,0.18), curv=ctx.rr(-0.25,0.25), fp=[[q.x,q.y]], fx=q.x, fy=q.y, j=0, lay=ctx.rr(0.55,0.85), tgt=th>=0?Math.PI:0;
      while(fy<footY(fx)-2&&j<60){ var frac=Math.max(0,Math.min(1,1-(footY(fx)-fy)/(depth*0.6))), ang=Math.PI/2+th+curv*(j/12)+(ctx.noise(fx*0.07,fy*0.07,5.5)-0.5)*0.5; ang+=(tgt-ang)*Math.pow(frac,1.8)*lay; fx+=Math.cos(ang)*4; fy+=Math.sin(ang)*4; fp.push([fx,fy]); j++; }
      folds.push({pts:fp,th:th,cum:arcOf(fp)}); }
    folds.sort(function(p,q){ return q.pts[0][0]-p.pts[0][0]; });
    // valleys (D-14, B6 tell 4): between every two adjacent peaks of the ridge a 凹谷 — a fold curve that starts at the saddle and
    // descends to the foot, the slope faces on both sides turning toward it, opening at its mouth into a fan across the foot
    var peaks=[], valleys=[], n=E.length, j;
    for(i=0;i<n;i++){ var lo=true; for(j=Math.max(0,i-12);j<=Math.min(n-1,i+12);j++)if(E[j][1]<E[i][1]){ lo=false; break; } if(lo&&(!peaks.length||i-peaks[peaks.length-1]>12))peaks.push(i); }
    for(i=1;i<peaks.length;i++){ var pa=peaks[i-1], pb=peaks[i], sd=pa; for(j=pa;j<=pb;j++)if(E[j][1]>E[sd][1])sd=j;
      if(E[sd][1]-E[pa][1]<8||E[sd][1]-E[pb][1]<8)continue; // a shoulder, not two peaks
      var spacing=Math.abs(E[pb][0]-E[pa][0]), sdy=E[sd][1];
      // the saddle's width: the ridge's span within 3 px above its lowest point, at most 0.12 of the spacing; the mouth opens to
      // twice it (never under 0.16 spacing)
      var sx0=E[sd][0], sx1=E[sd][0]; for(j=pa;j<=pb;j++)if(E[j][1]>sdy-3){ if(E[j][0]<sx0)sx0=E[j][0]; if(E[j][0]>sx1)sx1=E[j][0]; }
      var sw=Math.max(10,Math.min(spacing*0.12,sx1-sx0)), hw0=sw*0.5, mhw=Math.max(sw,spacing*0.16);
      // which flank is nearer: the one whose foot lies lower on the page a third of the spacing out from the saddle; ties go right
      var fyR=footY(E[sd][0]+spacing*0.33), fyL=footY(E[sd][0]-spacing*0.33), near=fyL>fyR+1?-1:1, far=-near;
      // the floor (D-16, B8 tell 2): sinks from the saddle for 70 % of the drop, then over the last 30 % turns from vertical to
      // 0.25 rad off horizontal — toward the far flank — and runs on along the foot nearly flat, still falling a little, for up
      // to 0.9 of the mouth's half-width: the valley bottom lies open along the foot instead of ending on it
      var vx=E[sd][0], vy=sdy+1, vp=[[vx,vy]], vth=ctx.rr(-0.15,0.15), vcurv=ctx.rr(-0.2,0.2), jj=0, y0v=vy, run=0, D=Math.max(8,footY(vx)-y0v), turnAt=y0v+0.7*D, Lt=0.41*D, sT=0, mxc=vx;
      while(jj<80){ var va;
        if(vy<turnAt&&!sT)va=Math.PI/2+vth+vcurv*(jj/14)+(ctx.noise(vx*0.06,vy*0.06,6.1)-0.5)*0.3;
        else { if(!sT)mxc=vx; sT+=3; var tu=Math.min(1,sT/Lt), ang=tu<1?Math.PI/2-(Math.PI/2-0.25)*tu:0.06+(ctx.noise(vx*0.05,6.3)-0.5)*0.1; va=far>0?ang:Math.PI-ang; run+=Math.abs(Math.cos(va))*3; }
        vx+=Math.cos(va)*3; vy+=Math.sin(va)*3; vp.push([vx,vy]); jj++;
        if(vy>=footY(vx)+1.5||run>mhw*0.9)break; }
      // x of the valley at height y (clamped to its ends; at the mouth, where the floor lies flat, the turn's start)
      var xat=(function(P){ return function(y){ if(y<=P[0][1])return P[0][0]; for(var q=1;q<P.length;q++)if(P[q][1]>=y){ var a2=P[q-1], b2=P[q], t2=(b2[1]-a2[1])?(y-a2[1])/(b2[1]-a2[1]):0; return a2[0]+(b2[0]-a2[0])*t2; } return P[P.length-1][0]; }; })(vp);
      // the valley is one concave FACE (D-15, B7 tell 4): a polygon from the saddle down to the foot, the saddle's half-width at
      // the top, twice the saddle's width at the mouth, most of the widening over the lower part
      var hw=(function(a,b){ return function(t){ return a+(b-a)*Math.pow(t,1.3); }; })(hw0,mhw), vcum=arcOf(vp), vlen=vcum[vcum.length-1];
      var face=offset(vp,hw).concat(offset(vp,function(t){ return -hw(t); }).slice().reverse());
      // the two flanks' feet at the mouth (D-16 b), about the floor's turn: the near flank's toe comes down and lies flat on the
      // foot (2 px under it) up to the turn; the far flank's toe comes down behind the floor's flat run, 4 px above the foot, and
      // reaches a third of the mouth past the middle, where the near toe's mass (the strip above its outline) cuts it — so the
      // mouth has a front and a back and reads as a place, not a line
      var fyM=footY(mxc), feet=[], sdd;
      var nearEnd=mxc+near*mhw*0.08, lap=ctx.rr(8,12); // D-19 (d): the far foot's line runs 8–12 px under the near foot and stops there
      for(sdd=-1;sdd<=1;sdd+=2){ var isNear=sdd===near, x0f=mxc+sdd*mhw*(isNear?1.25:1.05), ytop=fyM-depth*(isNear?0.34:0.26), xEnd=isNear?nearEnd:nearEnd+near*lap, P=[], nn=ctx.ri(7,9), q2;
        for(q2=0;q2<=nn;q2++){ var u=q2/nn, eu=1-Math.pow(1-u,2.2), px=x0f+(xEnd-x0f)*eu, py=ytop+(footY(px)+(isNear?2:-4)-ytop)*Math.pow(u,0.6)+(ctx.noise(px*0.05,7.7+sdd)-0.5)*1.5; P.push([px,py]); }
        // the toe's mass is the strip above its outline, 3 px thick where it leaves the flank, 9 px at its tip across the mouth
        var lob=P.concat(offset(P,function(u){ return -sdd*(isNear?4+8*u:3+6*u); }).slice().reverse());
        feet.push({side:sdd,near:isNear,pts:P,poly:lob,inside:ctx.polyInside(lob)}); }
      valleys.push({pts:vp,cum:vcum,len:vlen,spacing:spacing,reach:spacing*0.5,xat:xat,hw:hw,face:face,near:near,feet:feet,mouth:[mxc,fyM],mhw:mhw}); }
    // the 皴 direction (dx,dy) at (x,y) turned toward the nearest valley within its reach — progressively: nothing at half the peak
    // spacing, an ease over the flank, four fifths at the valley line; the target is the valley a little further down, so both
    // flank faces turn their waists into the valley rather than only the hatches beside its line
    var toward=function(x,y,dx,dy){ var best=null, bk=0;
      for(var v=0;v<valleys.length;v++){ var V=valleys[v], d=Math.abs(x-V.xat(y)); if(d<V.reach){ var u=1-d/V.reach, k=u*u*(3-2*u)*0.8; if(k>bk){ bk=k; best=V; } } }
      if(!best)return {dx:dx,dy:dy,k:0}; var dd=Math.abs(x-best.xat(y)), ty=Math.max(9,dd*1.1), tx=best.xat(y+ty)-x, tl=Math.sqrt(tx*tx+ty*ty)||1; tx/=tl; ty/=tl; // the target is never flatter than ~42° from vertical: the waist turns in, it does not streak across
      var ox=dx*(1-bk)+tx*bk, oy=dy*(1-bk)+ty*bk, ol=Math.sqrt(ox*ox+oy*oy)||1; return {dx:ox/ol,dy:oy/ol,k:bk}; };
    // folds do not start on a saddle: the valley is the line there
    if(valleys.length){ var kept=[]; for(k=0;k<folds.length;k++){ var okf=true; for(j=0;j<valleys.length;j++)if(Math.abs(folds[k].pts[0][0]-valleys[j].pts[0][0])<valleys[j].spacing*0.12)okf=false; if(okf)kept.push(folds[k]); } folds=kept; }
    // signed horizontal distance from (x,y) to the nearest fold, its index and tangent: d>0 is right of the fold (lit), d<0 left (shaded)
    var nearest=function(x,y){ var best=null, bd=1e9, bi=-1, tx=0, ty=1;
      for(var f=0;f<folds.length;f++){ var P=folds[f].pts, m=P.length-1, a=P[0], b=P[m], t;
        for(var i2=1;i2<P.length;i2++)if(P[i2][1]>=y){ a=P[i2-1]; b=P[i2]; break; }
        t=(b[1]-a[1])?(y-a[1])/(b[1]-a[1]):0; t=Math.max(0,Math.min(1,t)); var fxx=a[0]+(b[0]-a[0])*t, d=x-fxx, L=Math.sqrt((b[0]-a[0])*(b[0]-a[0])+(b[1]-a[1])*(b[1]-a[1]))||1;
        if(Math.abs(d)<Math.abs(bd)){ bd=d; bi=f; tx=(b[0]-a[0])/L; ty=(b[1]-a[1])/L; } }
      return {d:bd,i:bi,tx:tx,ty:ty}; };
    s.hk={E:E,depth:depth,poly:poly,bb:bb,z:s.z===undefined?top-1:s.z,tone:s.tone||'ink',cum:cum,folds:folds,valleys:valleys,toward:toward,nearest:nearest,yat:yat,footY:footY}; return s.hk; }
  function hillFootprint(ctx,s){ var hk=hillSk(ctx,s);
    return {x0:hk.bb[0],x1:hk.bb[2],y0:hk.bb[1],y1:hk.bb[3],z:hk.z,inside:ctx.polyInside(hk.poly)}; }
  function hill(ctx,s){ var ST=ctx.ST, C=ctx.C, rr=ctx.rr, ri=ctx.ri, R=ctx.R, hk=hillSk(ctx,s), E=hk.E, cum=hk.cum, total=cum[cum.length-1], depth=hk.depth, z=hk.z, PR=primary(ctx), i, k;
    var zf=function(){ return z; };
    // 起稿: a pale, slightly displaced ridge in pieces
    var dr=runs(ctx,E,40,80); for(i=0;i<dr.length;i++)if(R()<0.8){ var sh=rr(-1,1), dp=dr[i].map(function(p){ return [p[0],p[1]+sh]; }); plineZ(ctx,ST.DRAFT,C.ink,rr(55,85),0.5,dp,zf,false); }
    // the ridge: one stroke at the primary grade
    ctx.bline(ST.TREES,mx(E),C.ink,PR.a+rr(-6,10),PR.w*rr(0.9,1.02),E,z);
    // 皴 (D-10): the body is the three or four fold curves from crest to foot; each fold is drawn as a broken texture line, and
    // the 皴 are short hatches that start at the fold and run down-slope on its shaded side — rows of them, dense at the fold,
    // thinning to nothing between folds; the lit side gets only a few right at the fold. No head, no tail, no grid between.
    var cun=batch(ctx,ST.TREES,C.ink,z), TX=grades(ctx).T, SG=grades(ctx).S, folds=hk.folds, nearest=hk.nearest, footY=hk.footY, HA=0.8; // hill 皴 one grade paler than the trees' twigs (D-16 d)
    for(i=0;i<folds.length;i++){ var F=folds[i].pts, fc=folds[i].cum, ft=fc[fc.length-1], fr=runs(ctx,F,12,30), r2;
      for(r2=0;r2<fr.length;r2++){ if(R()<0.2)continue; var fade0=fc[Math.min(fc.length-1,F.indexOf(fr[r2][0]))]/ft, fp2=fr[r2].slice(0,Math.max(2,fr[r2].length-ri(0,1)));
        ctx.bline(ST.TREES,mx(fp2),C.ink,(TX.a+rr(20,45)-fade0*35)*HA,TX.w*rr(1.05,1.25),fp2,z); }
      var sp=rr(2,5);
      while(sp<ft-3){ var q=at(F,fc,sp), fade=sp/ft, nx=-q.ty, ny=q.tx; if(nx>0){ nx=-nx; ny=-ny; } // normal pointing to the shaded (left) side
        var off=rr(0,2.5), row=0;
        while(off<34&&row<10){ var odds=Math.exp(-off/14)*(1-fade*0.65)*(row===0?1:0.9); if(R()<odds){
            var turn=rr(0.4,0.9), dx=q.tx*Math.cos(turn)-q.ty*Math.sin(turn), dy=q.tx*Math.sin(turn)+q.ty*Math.cos(turn); if(dy<0){ dx=q.tx; dy=q.ty; }
            var sx=q.x+nx*off+q.tx*rr(-1.5,1.5), sy=q.y+ny*off+q.ty*rr(-1.5,1.5), tv=hk.toward(sx,sy,dx,dy); dx=tv.dx; dy=tv.dy;
            var Ls=rr(4.5,11)*(1-fade*0.3)*(1-off/60), lim=footY(sx)-4-sy, L2=Math.min(Ls,lim/Math.max(0.12,dy)), bow=rr(-1.6,1.6)*(1-tv.k);
            if(L2>2.5){ if(tv.k>0.05){ // within the valley's reach the hatch is a gentle C: it leaves along the flank and its end turns further into the valley
                var t2=hk.toward(sx+dx*L2*0.5,sy+dy*L2*0.5+4,dx,dy); L2=Math.min(L2,lim/Math.max(0.12,Math.max(dy,t2.dy)));
                var mxp=sx+dx*L2*0.5, myp=sy+dy*L2*0.5, ex=mxp+t2.dx*L2*0.5, ey=myp+t2.dy*L2*0.5;
                if(L2>2.5)cun.push({p:[[sx,sy],[mxp,myp],[ex,ey]],w:TX.w*rr(1.3,1.7),a:(SG.a+rr(-10,20)-fade*35-off*2.5)*HA}); }
              else cun.push({p:[[sx,sy],[sx+dx*L2*0.5-dy*bow,sy+dy*L2*0.5+dx*bow],[sx+dx*L2,sy+dy*L2]],w:TX.w*rr(1.3,1.7),a:(SG.a+rr(-10,20)-fade*35-off*2.5)*HA}); } }
          off+=rr(2.5,4.5); row++; }
        if(R()<0.3*(1-fade*0.7)){ var lx=q.x-nx*rr(0.5,3), ly=q.y-ny*rr(0.5,3), Ll=rr(4,8)*(1-fade*0.4), ldx=q.tx*0.9-q.ty*(-0.3), ldy=q.tx*(-0.3)+q.ty*0.9; if(ldy<0){ ldx=q.tx; ldy=q.ty; }
          cun.push({p:[[lx,ly],[lx+ldx*Ll,ly+ldy*Ll]],w:TX.w*1.2,a:(TX.a+rr(0,25)-fade*30)*HA}); }
        sp+=rr(2,4); } }
    // the valleys (D-16, B8 tell 2): the floor line sinks and lies flat at the mouth; the valley zone's 皴 are short Cs that turn
    // with the floor — vertical under the saddle, flat at the mouth — and thin to three or four flat strokes on the fan; the two
    // flanks' toes lap at the mouth, the near one drawn whole, the far one cut where the near toe's mass covers it
    var vs=hk.valleys, v, rockS=ctx.INK&&ctx.INK.style?ctx.INK.style.rock:undefined;
    for(v=0;v<vs.length;v++){ var VL=vs[v], V=VL.pts, vc=VL.cum, vt=vc[vc.length-1], hwv=VL.hw, nearIn=VL.feet[VL.near>0?1:0].inside, vr=runs(ctx,V,8,18), r3, s2, segs;
      for(r3=0;r3<vr.length;r3++){ if(R()<0.2)continue; var vf=vc[Math.min(vc.length-1,V.indexOf(vr[r3][0]))]/vt; segs=clipOut(vr[r3],nearIn);
        for(s2=0;s2<segs.length;s2++)ctx.bline(ST.TREES,mx(segs[s2]),C.ink,(SG.a+rr(0,20)-vf*35)*HA,SG.w*rr(0.85,1),segs[s2],z,rockS); }
      // the zone's 皴 stand on the floor's own offset curves — a row at fraction f of the zone's half-width lies f·hw(t) beside
      // the floor, so the rows hang narrow under the saddle and spread across the foot at the mouth — and each stroke leans
      // from its flank down INTO the floor: its direction is the floor's tangent there turned toward the line by 0.6 rad on the
      // outer rows (0.15 beside the line), less toward the mouth, so under the saddle the two families slant into the seam and
      // at the mouth, where the floor lies flat, they lie flat with it; 6–10 px, stopped short of the line, never across it
      var sideF, f0=rr(0.15,0.3);
      for(sideF=-1;sideF<=1;sideF+=2){ var f=f0+rr(-0.05,0.05);
        while(f<=1.02){ if(R()<0.2){ f+=rr(0.14,0.22); continue; } // some rows on one flank only, so the faces never mirror
          var Of=offset(V,(function(ff,sg){ return function(t){ return sg*ff*hwv(t); }; })(f,sideF)), oc=arcOf(Of), ot=oc[oc.length-1], pos=rr(3,8);
          while(pos<ot-3){ var pl2=rr(6,10), tt=pos/ot, odds=(0.9-tt*0.3)*(1-f*0.3)*(tt<0.08?0.4:1);
            if(R()<odds&&tt<0.95){ var a0=at(Of,oc,pos), fl=at(V,vc,tt*vt), fl2=at(V,vc,Math.min(vt,tt*vt+pl2*0.6));
              if(a0.tx*fl.tx+a0.ty*fl.ty>0.3){ var th=(0.15+0.45*f)*(1-tt*0.5)*sideF, c1=Math.cos(th), s1=Math.sin(th), c2=Math.cos(th*0.6), s2b=Math.sin(th*0.6);
                var d1x=fl.tx*c1-fl.ty*s1, d1y=fl.tx*s1+fl.ty*c1, d2x=fl2.tx*c2-fl2.ty*s2b, d2y=fl2.tx*s2b+fl2.ty*c2;
                var room=f*hwv(tt)-rr(1.5,3), need=pl2*(0.5*Math.abs(s1)+0.5*Math.abs(s2b)); if(need>room)pl2*=room/need;
                if(pl2>=3){ var m1x=a0.x+d1x*pl2*0.5, m1y=a0.y+d1y*pl2*0.5, e1x=m1x+d2x*pl2*0.5, e1y=m1y+d2y*pl2*0.5;
                  if(e1y<footY(e1x)-2&&!nearIn(m1x,m1y))cun.push({p:[[a0.x,a0.y],[m1x,m1y],[e1x,e1y]],w:TX.w*rr(1.3,1.7),a:(SG.a+rr(10,35)-tt*45-f*15)*HA}); } } }
            pos+=pl2+rr(2,5); }
          f+=rr(0.14,0.22); } }
      // the fan: three or four 皴 lying nearly flat over the foot around the mouth, each falling outward from the middle
      var tq=at(V,vc,vt*0.7), nfan=ri(3,4), mw=VL.mhw;
      for(k=0;k<nfan;k++){ var fs=k%2?1:-1, fx0=tq.x+fs*mw*rr(0.15,0.75)+VL.near*(-mw*0.1), fy0=footY(fx0)-rr(2,7), fa=fs>0?rr(0.1,0.35):Math.PI-rr(0.1,0.35), fL=rr(7,11), fdx=Math.cos(fa), fdy=Math.sin(fa);
        var fLim=footY(fx0+fdx*fL)-1.5-fy0, fL2=Math.min(fL,fLim/Math.max(0.1,fdy)), fbw=rr(0.2,0.6);
        if(fL2>4&&!nearIn(fx0+fdx*fL2*0.5,fy0+fdy*fL2*0.5))cun.push({p:[[fx0,fy0],[fx0+fdx*fL2*0.5,fy0+fdy*fL2*0.5-fbw],[fx0+fdx*fL2,fy0+fdy*fL2]],w:TX.w*rr(1.2,1.5),a:(TX.a+rr(0,25))*HA}); }
      // the flanks' toes: the outline as broken structural pieces (the far one cut under the near toe), 3–5 short flat 皴 in each mass
      for(k=0;k<2;k++){ var FT=VL.feet[k], P=FT.pts, fr2=runs(ctx,dens(P,3),8,16), rq, pc=arcOf(P), pl=pc[pc.length-1];
        for(rq=0;rq<fr2.length;rq++){ if(R()<0.25)continue; segs=FT.near?[fr2[rq]]:clipOut(fr2[rq],nearIn);
          for(s2=0;s2<segs.length;s2++)ctx.bline(ST.TREES,mx(segs[s2]),C.ink,(SG.a+rr(0,15))*(FT.near?1.05:HA),SG.w*rr(0.85,1)*(FT.near?1.15:1),segs[s2],z,rockS); }
        if(FT.near)ctx.wash(ST.INDIGO,FT.poly,C.danmo,0.16,2.2,2,z); // the near foot's mass is a body: 淡墨 under its outline, so it laps over the far foot
        var nh=ri(3,5); for(rq=0;rq<nh;rq++){ var pq=at(P,pc,pl*rr(0.15,0.9)), unx=-pq.ty, uny=pq.tx; if(uny>0){ unx=-unx; uny=-uny; }
          var up=rr(2,6), ln=rr(5,9), hx0=pq.x+unx*up, hy0=pq.y+uny*up, hx1=hx0+pq.tx*ln, hy1=hy0+pq.ty*ln*0.6;
          if(FT.near||!nearIn((hx0+hx1)/2,(hy0+hy1)/2))cun.push({p:[[hx0,hy0],[(hx0+hx1)/2+unx*rr(0.3,0.8),(hy0+hy1)/2+uny*rr(0.3,0.8)],[hx1,hy1]],w:TX.w*rr(1.2,1.5),a:(TX.a+rr(0,20))*HA}); } } }
    cun.done();
    // the valley band is graded: the 淡墨 face is darkest at the saddle and dissolves toward the mouth — two washes, the face at a
    // pale ink, and its upper half again, plus the body wash's own seam below
    for(v=0;v<vs.length;v++){ var VP=vs[v].pts, hwb=vs[v].hw, nvp=VP.length, upper=Math.max(3,Math.round(nvp*0.5)), vink=hk.tone==='huaqing'?0.11:0.13;
      var fpoly=offset(VP,function(t){ return hwb(t)*0.8; }).concat(offset(VP,function(t){ return -hwb(t)*0.8; }).slice().reverse());
      ctx.wash(ST.INDIGO,fpoly,C.danmo,vink*rr(0.8,1),2.4,2.2,z);
      var UP=VP.slice(0,upper), upoly=offset(UP,function(t){ return 1.8+hwb(t*0.5)*0.6; }).concat(offset(UP,function(t){ return -(1.8+hwb(t*0.5)*0.6); }).slice().reverse());
      ctx.wash(ST.INDIGO,upoly,C.danmo,vink*rr(1.3,1.6),2.2,2,z); }
    // 点苔 along the ridge, sitting just under the line
    var mo=batch(ctx,ST.FINISH,C.ink,z), mp=rr(6,16);
    while(mp<total-4){ var m=at(E,cum,mp); if(R()<0.7){ var nm=R()<0.35?2:1; for(k=0;k<nm;k++)mo.push({p:[[m.x+rr(-1.5,1.5)+k*2,m.y+rr(0.3,1.8)]],w:rr(1,1.4),a:rr(180,220)}); } mp+=rr(10,30); }
    mo.done();
    // the wash, bounded by the ridge and fading out toward the foot through noise holes
    var col=hk.tone==='huaqing'?C.huaqing:C.danmo, ink=hk.tone==='huaqing'?rr(0.1,0.14):rr(0.11,0.15), bb=hk.bb, yat=hk.yat;
    var pred=function(px,py){ var yr=yat(px), f=(py-yr)/Math.max(6,footY(px)-yr), nf=nearest(px,py), sh=nf.d<0?Math.exp(-nf.d*nf.d/900):Math.exp(-nf.d*nf.d/60)*0.5;
      for(var vv=0;vv<hk.valleys.length;vv++){ var VV=hk.valleys[vv], vt2=Math.max(0,Math.min(1,(py-VV.pts[0][1])/Math.max(1,VV.pts[VV.pts.length-1][1]-VV.pts[0][1]))), vd=(px-VV.xat(py))/Math.max(6,VV.hw(vt2)*0.9); sh=Math.max(sh,Math.exp(-vd*vd)*(0.85-vt2*0.55)); } return ctx.noise(px*0.13,py*0.13,3.3)*0.7+ctx.noise(px*0.03,py*0.03,8.1)*0.3>0.2+f*0.7-sh*0.3; };
    ctx.dabs(ST.INDIGO,{x0:bb[0],x1:bb[2],y0:bb[1],y1:bb[3],z:z,inside:ctx.polyInside(hk.poly),edge:ctx.polyEdge(hk.poly)},col,ink,2.4,2.2,pred);
    // the foot (D-19 (3), B9 tell ③ 近坡): the lower 45 % of the body carries a 淡赭 base 0.14 and a 汁绿 wash 0.15 over it, both
    // dissolving upward through noise holes; the shaded strip beside each fold (8 px on its left) stays 淡墨 — no green there
    var fpts=[], fi; for(fi=0;fi<E.length;fi++){ var yr0=yat(E[fi][0]); fpts.push([E[fi][0],yr0+(footY(E[fi][0])-yr0)*0.55]); } for(fi=E.length-1;fi>=0;fi--)fpts.push([E[fi][0],footY(E[fi][0])+1]);
    var freg={x0:bb[0],x1:bb[2],y0:bb[1],y1:bb[3]+2,z:z,inside:ctx.polyInside(fpts),edge:ctx.polyEdge(fpts)};
    var fpred=function(px,py){ var yr=yat(px), f=(py-yr)/Math.max(6,footY(px)-yr); return ctx.noise(px*0.12,py*0.12,9.4)>0.2+(1-f)*0.9; };
    var gpred=function(px,py){ var nf=nearest(px,py); if(nf.d<0&&nf.d>-8)return false; return fpred(px,py)&&ctx.noise(px*0.07,py*0.07,9.9)>0.35; };
    ctx.dabs(ST.OCHRE,freg,C.ochre,0.14,2.6,2.6,fpred);
    ctx.dabs(ST.INDIGO,freg,C.zhilv||ZHILV,0.15,2.6,2.6,gpred);
    var fp=hillFootprint(ctx,s), out={fp:fp,slots:{ridge:E,top:hk.bb[1],kind:'hill'}}; ctx.reg.zones.push({kind:'hill',fp:fp,slots:out.slots}); return out; }

  return {footprint:footprint,build:build,bank:bank,hill:hill,hillFootprint:hillFootprint};
})();
