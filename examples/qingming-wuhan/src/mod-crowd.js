/* mod-crowd.js — placement grammar for figures (interfaces §2(g)). Places, never draws.
   place(ctx, spec) → [{x,y,h,pose,dir,z,tint,prop}, …]
     spec.kind     queue | cluster | episode | stream | ring | rail | stairs | deck
     spec.zone     {pts:[[x,y],…], w, z, dir, seats} — pts the band / rail / stair line, w the band half-width,
                   z the deck's z (figures standing on a structure), dir a unit-ish vector, seats a boat's seat list;
                   or a box {x0,x1,y0,y1} (a horizontal band, w = half its height)
     spec.focus    [x,y] — the slot a queue ends at, the centre a cluster or ring forms round, what a stream or rail row looks at
     spec.n        count; else density × band length (stream) or the kind's own range
     spec.density  figures per 100 px of band: 汉正街/户部巷 4–6, 江滩 2–3, 桥面 1–2, 东湖 0.5–1
     spec.mix      pose weights {walk:5,dan:1,…} or a preset name (street quay bridge park)
     spec.roles    episode: [incident figure spec | pose name, pose names…]; spec.spread scales the knot's radius (default 1)
   footprint(ctx, fig) → {x0,x1,y0,y1,z,inside}: 0.35 h wide (0.6 h with a wide prop), head narrower; waist-up for pose rail
   spreadAlong(ctx, pts, n, jitter) → [[x,y,tx,ty,s], …] n points by arc length, each moved up to ±jitter/2 of a spacing
   h = 60·depth(y) (children 0.5 h), z = y unless the zone has one. Feet never inside masks.solidAt; footprint boxes
   may overlap ≤ 40 % only when z differs by ≥ 6 (stream clumps: ≥ 4; episodes: ≤ 50 % at ≥ 4). Figures already placed are kept in ctx.reg.placed. */
var CROWD=(function(){
  var CARRY={dan:1,porter:1,basket:1,bag:1,cart:1,pushbike:1,ebike:1,veg:1};
  var WIDE={dan:1,umbrella:1,bike:1,ebike:1,cart:1};
  var PROP={dan:'dan',umbrella:'umbrella',phone:'phone',eat:'bowl',pushbike:'bike',ebike:'ebike',cart:'cart',porter:'sack',basket:'basket',
    stick:'stick',photo:'camera',tourist:'backpack',pole:'pole',row:'oar',sweep:'broom',veg:'basket',point:'arm'};
  var ALIAS={bag:['walk','bag'],flag:['walk','flag']};
  var HT={sit:0.62,squat:0.55,veg:0.55,vendor:0.7};
  var MIX={
    street:{walk:5,phone:1,dan:1.2,bag:1,pushbike:0.4,ebike:0.6,cart:0.3,child:0.6,tourist:0.7,basket:0.5,eat:0.5,stand:0.8,talk:0.4},
    quay:{walk:4,stand:2,phone:1,photo:1,umbrella:0.3,tourist:1,stick:0.5,child:0.6,run:0.3,bag:0.5},
    bridge:{walk:3,tourist:2,photo:1,phone:1,flag:0.6,ebike:0.4,stand:0.6},
    park:{walk:3,stand:1,umbrella:0.4,photo:0.6,child:0.8,stick:0.5,run:0.4,bag:0.4},
    queue:{queue:5,stand:3},
    cluster:{stand:4,point:1.2,phone:1,talk:1,squat:0.4,photo:0.4},
    rail:{rail:5,point:1.5},
    stairs:{climb:6,stand:0.6,point:0.3,child:0.5,stick:0.4},
    watch:{stand:4,phone:1,photo:0.8,point:0.5}};

  // ---------------- polylines
  function dist(a,b){ var dx=a[0]-b[0], dy=a[1]-b[1]; return Math.sqrt(dx*dx+dy*dy); }
  function plen(pts){ var L=0; for(var i=1;i<pts.length;i++)L+=dist(pts[i-1],pts[i]); return L; }
  function atLen(pts,s){ var n=pts.length, acc=0, i; if(n===1)return [pts[0][0],pts[0][1],1,0,s];
    for(i=1;i<n;i++){ var a=pts[i-1], b=pts[i], d=dist(a,b);
      if(s<=acc+d||i===n-1){ var t=d>0?Math.max(0,Math.min(1,(s-acc)/d)):0, tx=d>0?(b[0]-a[0])/d:1, ty=d>0?(b[1]-a[1])/d:0;
        return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,tx,ty,s]; }
      acc+=d; } }
  function spreadAlong(ctx,pts,n,jitter){ var L=plen(pts), m=L/Math.max(1,n), out=[]; jitter=jitter||0;
    for(var i=0;i<n;i++){ var s=(i+0.5)*m+ctx.rr(-0.5,0.5)*m*jitter; out.push(atLen(pts,Math.max(0,Math.min(L,s)))); } return out; }
  function unit(v){ var L=Math.sqrt(v[0]*v[0]+v[1]*v[1])||1; return [v[0]/L,v[1]/L]; }
  function sgn(v){ return v<0?-1:1; }
  function zoneOf(ctx,spec){ var z=spec.zone||{}, Z={pts:z.pts||null,w:z.w||0,z:z.z===undefined?spec.z:z.z,dir:z.dir,seats:z.seats||spec.seats,focus:null};
    if(!Z.pts&&z.x0!==undefined){ var ym=(z.y0+z.y1)/2; Z.pts=[[z.x0,ym],[z.x1,ym]]; if(z.w===undefined)Z.w=(z.y1-z.y0)/2; }
    var f=spec.focus; if(f)Z.focus=f.length!==undefined?[f[0],f[1]]:[f.x,f.y]; return Z; }

  // ---------------- poses
  function pick(ctx,mix,filter){ var ks=[], ws=[], t=0, k;
    for(k in mix){ if(filter&&!filter(k))continue; ks.push(k); ws.push(mix[k]); t+=mix[k]; }
    if(!t)return null; var r=ctx.R()*t; for(var i=0;i<ks.length;i++){ r-=ws[i]; if(r<=0)return ks[i]; } return ks[ks.length-1]; }
  function mixOf(spec,dflt){ var m=spec.mix; if(!m)return MIX[dflt]; if(typeof m==='string')return MIX[m]||MIX[dflt]; return m; }
  function isCarry(k){ return !!CARRY[k]; }
  function notCarry(k){ return !CARRY[k]; }

  // ---------------- one group: its specs, their boxes, the rules it checks
  function group(ctx,Z,kind){ ctx.reg.placed=ctx.reg.placed||[];
    return {ctx:ctx,kind:kind,z:Z.z,focus:Z.focus,specs:[],boxes:[],loose:kind==='queue'||kind==='rail'||kind==='deck',ground:kind!=='rail'&&kind!=='deck'&&Z.z===undefined}; }
  function mk(G,x,y,name,dir,hs){ var pose=name, prop='', a=ALIAS[name]; if(a){ pose=a[0]; prop=a[1]; } else prop=PROP[name]||'';
    return {x:x,y:y,h:60*G.ctx.depth(y)*(hs||1),pose:pose,dir:dir,z:G.z===undefined?y:G.z,tint:'none',prop:prop}; }
  function boxOf(f){ var w=f.h*(WIDE[f.prop]?0.6:0.35), ht=HT[f.pose]||1, cut=f.pose==='rail'?0.45:0;
    return {x0:f.x-w/2,x1:f.x+w/2,y0:f.y-f.h*ht,y1:f.y-f.h*cut,z:f.z,d:f.y}; }
  // depth for the overlap rule: the feet's y — on a deck every figure shares zone.z, and there the feet decide who stands in front
  function depthOf(b){ return b.d===undefined?b.z:b.d; }
  // reaction poses (recoil yield block look) if the figure module has them, else the older vocabulary
  var FALL={recoil:'point',block:'point',yield:'stand',look:'phone'};
  function react(nm){ var F=typeof FIGURE!=='undefined'&&FIGURE.POSES; return (F&&F[nm])?nm:(FALL[nm]||nm); }
  function ovl(a,b){ var ix=Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0); if(ix<=0)return 0; var iy=Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0); if(iy<=0)return 0;
    return ix*iy/Math.min((a.x1-a.x0)*(a.y1-a.y0),(b.x1-b.x0)*(b.y1-b.y0)); }
  function clash(b,o,dz,mx){ var f=ovl(b,o); if(f<=0.04)return false; return Math.abs(depthOf(b)-depthOf(o))<(dz||6)||f>(mx||0.4); }
  function standable(ctx,x,y,w){ var M=ctx.masks; return !(M.solidAt(x,y)||M.solidAt(x-w*0.35,y)||M.solidAt(x+w*0.35,y)||M.solidAt(x,y-3)); }
  function fits(G,f,mate){ var ctx=G.ctx, b=boxOf(f), i;
    if(f.x<ctx.CW+3||f.x>ctx.SW-3||f.y<10||f.y>ctx.SH-2)return false;
    if(G.ground&&!standable(ctx,f.x,f.y,b.x1-b.x0))return false;
    var P=ctx.reg.placed; for(i=0;i<P.length;i++)if(clash(b,P[i]))return false;
    if(!G.loose)for(i=0;i<G.boxes.length;i++){ if(i===mate)continue; if(clash(b,G.boxes[i],G.dz,G.maxOv))return false; }
    return true; }
  // place f, nudging it a little (tries−1 times) when it clashes; returns its index or −1
  function put(G,f,mate,tries){ var ctx=G.ctx, ox=f.x, oy=f.y, k; if(tries===undefined)tries=4;
    for(k=0;k<tries;k++){ if(fits(G,f,mate)){ G.specs.push(f); var b=boxOf(f); G.boxes.push(b); return G.specs.length-1; }
      var a=ctx.rr(0,Math.PI*2), d=f.h*ctx.rr(0.12,0.35); f.x=ox+Math.cos(a)*d; f.y=oy+Math.sin(a)*d*0.6; f.h=60*ctx.depth(f.y)*(f.pose==='child'?0.5:1); if(G.z===undefined)f.z=f.y; }
    return -1; }
  // an adult with a child by the hand: the child stands beside, off the band's axis, half height
  function child(G,f,tx,ty){ var ctx=G.ctx, side=ctx.R()<0.5?-1:1, d=f.h*0.28;
    return mk(G,f.x-ty*d*side+tx*f.h*0.05,f.y+tx*d*side+ty*f.h*0.05,'child',f.dir,0.5); }
  // one name from the mix into the group; 'child' becomes adult(walkPose)+child. Returns the adult's index or −1
  function addOne(G,x,y,nm,dir,tx,ty,mate,walkPose,look){ var f;
    if(nm==='child'){ f=mk(G,x,y,walkPose||'walk',dir); if(look)look(f); var k=put(G,f,mate); if(k<0)return -1;
      if(put(G,child(G,f,tx,ty),k)>=0)f.prop='hand'; return k; }
    f=mk(G,x,y,nm,dir); if(look)look(f); return put(G,f,mate); }
  function tintAll(ctx,specs){ var maxZ=specs.length>12?2:1, nz=0, i;
    for(i=0;i<specs.length;i++){ var r=ctx.R(); if(r<0.06&&nz<maxZ){ specs[i].tint='zhusha'; nz++; } else if(r<0.42)specs[i].tint='indigo'; else specs[i].tint='none'; } }
  function done(G){ tintAll(G.ctx,G.specs); for(var i=0;i<G.boxes.length;i++)G.ctx.reg.placed.push(G.boxes[i]); return G.specs; }

  // ---------------- stream: a street band walked in 1–4 depth lanes with a pulse — clumps of 2–4 at 0.4–0.7 h, gaps of 1.5–3 h between clumps;
  // inside a clump 25 % are a pair stopped face to face, 15 % have stopped and turned against the flow (phone, or pointing back)
  function stream(ctx,spec,Z){ var G=group(ctx,Z,'stream'), pts=Z.pts, L=plen(pts), mid=atLen(pts,L/2), hRef=60*ctx.depth(mid[1]), mix=mixOf(spec,'street'), i, l;
    G.dz=4;
    var n=spec.n||Math.round((spec.density||4)*L/100), lanes=Math.max(1,Math.min(4,Math.round(2*Z.w/(0.55*hRef)))), per=[], laneW=lanes>1?1.6*Z.w/lanes:0;
    for(l=0;l<lanes;l++)per.push(Math.floor(n/lanes)); for(i=0;i<n-Math.floor(n/lanes)*lanes;i++)per[ctx.ri(0,lanes-1)]++;
    var name=function(){ return ctx.R()<0.2?(pick(ctx,mix,isCarry)||'dan'):(pick(ctx,mix,notCarry)||'walk'); };
    var look=function(f){ if(!Z.focus)return; var dx=Z.focus[0]-f.x, dy=Z.focus[1]-f.y, reach=2.2*f.h; if(dx*dx+dy*dy>reach*reach)return;
      if(Math.abs(dx)>f.h*0.1)f.dir=sgn(dx);
      if((f.pose==='walk'||f.pose==='tourist'||f.pose==='run')&&ctx.R()<0.45){ if(ctx.R()<0.7)f.pose='stand'; else { f.pose='point'; f.prop='arm'; } } };
    var placedAt=function(k,s,v){ if(k>=0){ G.boxes[k].s=s; G.boxes[k].v=v; } };
    // episodes placed earlier: nobody in their gaps, and the stream compresses ×0.6 within 4 h of a knot
    var gaps=ctx.reg.gaps||[], knots=ctx.reg.knots||[];
    var inGap=function(x,y){ for(var g=0;g<gaps.length;g++){ var b=gaps[g]; if(x>=b.x0&&x<=b.x1&&y>=b.y0&&y<=b.y1)return true; } return false; };
    var squeeze=function(x,y){ for(var g=0;g<knots.length;g++){ var K=knots[g], dx=x-K.x, dy=(y-K.y)/0.42; if(dx*dx+dy*dy<16*K.h*K.h)return 0.6; } return 1; };
    // one clump member at arc length s, lateral v; returns the along-step it used
    var member=function(x,y,s,v,tx,ty,nx,ny,run,last){ var h=60*ctx.depth(y), r=ctx.R(), k;
      if(!last&&r<0.25){ // two stopped face to face, the second a little deeper so their sleeves overlap
        var side=ctx.R()<0.5?-1:1, f=mk(G,x,y,'talk',1), g=mk(G,x+tx*h*0.36+nx*h*0.06*side,y+ty*h*0.36+ny*h*0.06*side,ctx.R()<0.5?'talk':'stand',-1);
        if(ctx.R()<0.5)f.prop='arm'; k=put(G,f); placedAt(k,s,v); if(k>=0){ var k2=put(G,g,k); placedAt(k2,s+h*0.36,v+h*0.06*side); } return h*0.36; }
      if(r<0.4){ // stopped and turned against the flow
        var nm=ctx.R()<0.6?'phone':'point', f2=mk(G,x,y,nm,-run); k=put(G,f2); placedAt(k,s,v); return 0; }
      k=addOne(G,x,y,name(),run,tx,ty,undefined,'walk',look); placedAt(k,s,v); return 0; };
    for(l=0;l<lanes;l++){ var vl=lanes>1?-0.8*Z.w+(l+0.5)*laneW:0, ja=lanes>1?0.35*laneW:Z.w*0.6, dv=0, s=hRef*ctx.rr(0.2,1.5), run=ctx.R()<0.5?1:-1;
      var scale=Math.max(0.45,Math.min(2.2,(L/Math.max(1,per[l]))/(1.12*hRef)));
      while(G.specs.length<n&&s<L-0.2*hRef){ var m=ctx.R()<0.15?1:ctx.ri(2,4), j;
        if(ctx.R()<0.32)run=-run;
        for(j=0;j<m&&s<L-0.2*hRef;j++){ var P=atLen(pts,s), tx=P[2], ty=P[3], nx=-ty, ny=tx;
          dv=Math.max(-ja,Math.min(ja,dv+ctx.rr(-0.2,0.2)*hRef)); var v=vl+dv+ctx.rr(-ja*0.5,ja*0.5), x=P[0]+nx*v, y=P[1]+ny*v, h=60*ctx.depth(y);
          if(inGap(x,y)){ s+=h*0.3; j--; if(s>L-0.2*hRef)break; continue; }
          var sq=squeeze(x,y); s+=member(x,y,s,v,tx,ty,nx,ny,run,j===m-1)+h*ctx.rr(0.4,0.7)*Math.min(1,Math.max(0.7,scale))*sq; }
        var E=atLen(pts,Math.min(L,s)); s+=hRef*ctx.rr(1.5,3)*scale*squeeze(E[0],E[1]); } }
    // short of n: attach singles to existing knots rather than filling the gaps
    var want=n-G.specs.length, tries=0;
    while(want>0&&tries<want*4&&G.boxes.length){ tries++; var a=G.boxes[ctx.ri(0,G.boxes.length-1)]; if(a.s===undefined)continue;
      var Q=atLen(pts,Math.max(0,Math.min(L,a.s+hRef*ctx.rr(0.45,0.9)*(ctx.R()<0.5?-1:1)))), v2=Math.max(-Z.w*0.85,Math.min(Z.w*0.85,a.v+ctx.rr(-0.5,0.5)*(laneW||Z.w)));
      if(inGap(Q[0]-Q[3]*v2,Q[1]+Q[2]*v2))continue;
      var kk=addOne(G,Q[0]-Q[3]*v2,Q[1]+Q[2]*v2,name(),ctx.R()<0.5?1:-1,Q[2],Q[3],undefined,'walk',look); placedAt(kk,Q[4],v2); if(kk>=0)want=n-G.specs.length; }
    return done(G); }

  // ---------------- queue: a snaking line from the slot outward, spacing 0.45–0.6 h, everyone facing the slot, 30 % on the phone
  function queue(ctx,spec,Z){ var G=group(ctx,Z,'queue'), slot=Z.focus, n=spec.n||ctx.ri(4,9), hRef=60*ctx.depth(slot[1]), mix=mixOf(spec,'queue'), pts=Z.pts, i;
    if(!pts){ var d=unit(Z.dir||[1,0.08]), nx=-d[1], ny=d[0], tot=n*0.62*hRef+hRef, v=0, t; pts=[[slot[0],slot[1]]];
      for(t=hRef*1.3;t<tot+hRef*1.3;t+=hRef*1.3){ v=Math.max(-0.28*hRef,Math.min(0.28*hRef,v+ctx.rr(-0.14,0.14)*hRef)); pts.push([slot[0]+d[0]*t+nx*v,slot[1]+d[1]*t+ny*v]); } }
    var L=plen(pts), s=hRef*ctx.rr(0.45,0.6);
    for(i=0;i<n&&s<L;i++){ var P=atLen(pts,s), h=60*ctx.depth(P[1]), off=ctx.rr(-0.07,0.07)*h, x=P[0]-P[3]*off, y=P[1]+P[2]*off, nm=ctx.R()<0.3?'phone':(pick(ctx,mix)||'queue');
      var dir=Math.abs(slot[0]-x)>2?sgn(slot[0]-x):sgn(-P[2]);
      if(i>1&&i<n-1&&nm!=='phone'&&ctx.R()<0.17){ dir=-dir; nm='talk'; }
      var f=mk(G,x,y,nm,dir), k=put(G,f,undefined,1), tries=0;
      while(k<0&&tries<3){ tries++; s+=h*0.22; P=atLen(pts,s); f=mk(G,P[0],P[1],nm,dir); k=put(G,f,undefined,1); }
      if(k>=0&&ctx.R()<0.1&&put(G,child(G,f,P[2],P[3]),k,1)>=0)f.prop='hand';
      s+=h*ctx.rr(0.45,0.6); }
    // a straggler 1.5 h behind the last, still walking up
    var Q=atLen(pts,Math.min(L,s+hRef*1.0)), sf=mk(G,Q[0],Q[1],'walk',Math.abs(slot[0]-Q[0])>2?sgn(slot[0]-Q[0]):sgn(-Q[2])); put(G,sf,undefined,2);
    return done(G); }

  // ---------------- cluster: 3–6 round a focus at 0.8–1.5 h on a flattened ring with uneven gaps and an opening, all facing in
  function cluster(ctx,spec,Z){ var G=group(ctx,Z,'cluster'), f0=Z.focus, n=spec.n||ctx.ri(3,6), hRef=60*ctx.depth(f0[1]), mix=mixOf(spec,'cluster');
    var open=Math.PI*2*ctx.rr(0.72,1), a=ctx.rr(0,Math.PI*2), gaps=[], t=0, i; for(i=0;i<n;i++){ gaps.push(ctx.rr(0.5,1.5)); t+=gaps[i]; }
    for(i=0;i<n;i++){ var r=hRef*ctx.rr(0.8,1.5), x=f0[0]+Math.cos(a)*r, y=f0[1]+Math.sin(a)*r*0.42, dx=f0[0]-x;
      put(G,mk(G,x,y,pick(ctx,mix)||'stand',Math.abs(dx)>hRef*0.1?sgn(dx):(ctx.R()<0.5?1:-1))); a+=gaps[i]/t*open; }
    return done(G); }

  // ---------------- episode: an incident that propagates. Three silhouettes (spec.shape, else read from roles[0]):
  //   ring  (default; an e-bike, a fall) — ring 1 within 1.2 h: 3–4 in reaction poses (recoil / block / yield) facing the incident, overlapping it and each
  //         other; ring 2 at 1.2–2.5 h: people halted on the side the incident heads for, and 'look' figures beyond the gap with their feet still going the
  //         stream's way; on the far side a consequential gap of 1.5–2.5 h with nobody in it. The gap and the knot go to ctx.reg.gaps / ctx.reg.knots and
  //         the streams placed afterwards keep out of the gap and compress ×0.6 within 4 h of the knot.
  //   clump (photographers at a rail) — low and wide: a row of kneelers, rail leaners and standing photographers 0.35–0.55 h apart, all facing one way,
  //         rail leaners at z − 3 so the rail hides their legs.
  //   knot  (a vendor) — tight and vertical: 3–4 customers stacked in depth right at the vendor, then a queue tail of 2–4 leading off along the stream.
  // roles[0] may be the incident itself as a figure spec; the other roles name the poses of the non-reaction figures in order (ring 2, the clump's row,
  // the knot's customers). spread scales the radii. Direction: the stream runs zone.dir if given, else against the incident's dir (a wrong-way rider).
  function episode(ctx,spec,Z){ var G=group(ctx,Z,'episode'), f0=Z.focus, roles=(spec.roles||[]).slice(), spread=spec.spread||1, mix=mixOf(spec,'cluster'), i;
    var hRef=60*ctx.depth(f0[1]), r0=roles.length&&typeof roles[0]==='object'?roles.shift():null, c=null, d=r0&&r0.dir?r0.dir:(ctx.R()<0.5?1:-1);
    var shape=spec.shape||(r0&&(r0.pose==='photo'?'clump':r0.pose==='vendor'||r0.pose==='veg'?'knot':'ring'))||'ring';
    var sd=Z.dir?sgn(Z.dir[0]):-d, n=spec.n||(shape==='ring'?ctx.ri(6,8):shape==='clump'?ctx.ri(4,6):ctx.ri(5,7));
    G.dz=0.06*hRef; G.maxOv=0.6;
    ctx.reg.gaps=ctx.reg.gaps||[]; ctx.reg.knots=ctx.reg.knots||[];
    // deck z: a small spread by the feet so the nearer figure's lines win where bodies overlap (kept within ±1.5 of zone.z, under the rail)
    var zAt=function(f){ if(G.z!==undefined)f.z=G.z+Math.max(-1.5,Math.min(1.5,(f.y-f0[1])/hRef*1.5)); return f; };
    var at=function(a,r,hs,nm,dir){ var x=f0[0]+Math.cos(a)*r, y=f0[1]+Math.sin(a)*r*0.42; return zAt(mk(G,x,y,nm,dir,hs)); };
    var twd=function(f){ var dx=f0[0]-f.x; return Math.abs(dx)>hRef*0.08?sgn(dx):(ctx.R()<0.5?1:-1); };
    if(r0){ c=mk(G,r0.x!==undefined?r0.x:f0[0],r0.y!==undefined?r0.y:f0[1],r0.pose||'vendor',d,r0.hs);
      if(r0.h)c.h=r0.h; if(r0.prop!==undefined)c.prop=r0.prop; if(r0.z!==undefined)c.z=r0.z; else zAt(c); if(r0.tint)c.tint=r0.tint; G.specs.push(c); G.boxes.push(boxOf(c)); }
    var role=function(dflt){ var nm=roles.shift(); return nm||dflt; };
    if(shape==='ring'){
      // ring 1: on the side the incident heads for (+d), inside 1.2 h, bodies overlapping — recoil, block, yield, recoil
      // x inside the incident's own width or just beyond it, feet staggered in depth (−0.2 … +0.2 h) so the bodies overlap and the nearer one's lines win
      var k1=Math.min(n,ctx.ri(3,4)), R1=['recoil','block','yield','recoil'], base=d>0?0:Math.PI, k, ys1=[-0.2,0.16,-0.08,0.22], sw=ctx.ri(0,3);
      for(k=0;k<k1;k++){ var back=k===k1-1&&ctx.R()<0.5, x1=f0[0]+d*hRef*ctx.rr(0.2,0.95)*spread*(back?-1:1), y1=f0[1]+ys1[(k+sw)%4]*hRef*spread+ctx.rr(-0.03,0.03)*hRef;
        var f1=zAt(mk(G,x1,y1,react(R1[k]),1,ctx.rr(0.92,1.08))); f1.dir=twd(f1); if(f1.pose==='point')f1.prop='arm'; put(G,f1,undefined,6); }
      // the gap: the far side (−d), 1.2 h to 2.7–3.7 h, nobody
      var gl=hRef*ctx.rr(1.5,2.5)*spread, g0=f0[0]-d*hRef*1.2*spread, g1=g0-d*gl, gw=Z.w||hRef*0.5;
      ctx.reg.gaps.push({x0:Math.min(g0,g1),x1:Math.max(g0,g1),y0:f0[1]-gw-hRef*0.2,y1:f0[1]+gw+hRef*0.2});
      // ring 2: 1–2 halted on the approach side at 1.2–2.5 h facing the incident; 1–2 'look' just beyond the gap, feet the stream's way, head turned back
      var k2=Math.min(n-k1,ctx.ri(2,4)), nl=Math.max(1,Math.round(k2/2));
      for(k=0;k<k2-nl;k++){ var f2=at(base+ctx.rr(-0.9,0.9),hRef*ctx.rr(1.2,2.5)*spread,ctx.rr(0.92,1.08),role(ctx.R()<0.5?'stand':react('yield')),1); f2.dir=twd(f2); if(f2.pose==='point')f2.prop='arm'; put(G,f2,undefined,5); }
      for(k=0;k<nl;k++){ var lx=g1-d*hRef*ctx.rr(0.1,0.6), ly=f0[1]+ctx.rr(-0.6,0.6)*gw, lk=react('look');
        var f3=zAt(mk(G,lx,ly,lk,lk==='look'?sd:sgn(f0[0]-lx)||1,ctx.rr(0.92,1.08))); put(G,f3,undefined,5); }
      ctx.reg.knots.push({x:f0[0],y:f0[1],h:hRef*spread}); }
    else if(shape==='clump'){
      // a low wide row along x: kneeling photographers, rail leaners (legs behind the rail), standing ones; 0.35–0.55 h apart, all facing d
      var row=['squat','rail','photo','squat','rail','photo'], x=f0[0]-d*hRef*0.55*(n-1)*0.5*spread, ry=f0[1];
      for(k=0;k<n;k++){ var nm=role(row[k%row.length]), yk=ry+ctx.rr(-0.08,0.08)*hRef, fk=zAt(mk(G,x,yk,nm,d,ctx.rr(0.9,1)));
        if(nm==='rail'){ fk.prop='camera'; fk.y=ry+hRef*0.5; if(G.z!==undefined)fk.z=G.z-3; else fk.z=ry; } else if(nm==='squat')fk.prop='camera';
        put(G,fk,undefined,3); x+=d*hRef*ctx.rr(0.35,0.55)*spread; }
      ctx.reg.knots.push({x:f0[0],y:f0[1],h:hRef*spread*0.7}); }
    else {
      // knot: 3–4 customers stacked in depth at the vendor (x within ±0.25 h, y from −0.5 h behind to +0.35 h in front), overlapping; then a queue tail
      var kc=Math.min(n,ctx.ri(3,4)), ys=[-0.5,0.35,-0.15,0.15];
      for(k=0;k<kc;k++){ var cx=f0[0]+d*hRef*ctx.rr(0.25,0.55)*spread+ctx.rr(-0.12,0.12)*hRef, cy=f0[1]+ys[k]*hRef*0.6*spread+ctx.rr(-0.05,0.05)*hRef;
        var fc=zAt(mk(G,cx,cy,role(pick(ctx,mix)||'stand'),-d,ctx.rr(0.92,1.08))); if(fc.pose==='point')fc.prop='arm'; put(G,fc,undefined,6); }
      var tail=n-kc, tx=f0[0]+d*hRef*0.9*spread, ty=f0[1]+hRef*0.1*spread;
      for(k=0;k<tail;k++){ tx+=d*hRef*ctx.rr(0.45,0.6)*spread; ty+=ctx.rr(-0.08,0.08)*hRef; var fq=zAt(mk(G,tx,ty,ctx.R()<0.3?'phone':'queue',-d,ctx.rr(0.92,1.08))); put(G,fq,undefined,3); }
      ctx.reg.gaps.push({x0:Math.min(f0[0]-d*hRef*0.4,f0[0]-d*hRef*1.5),x1:Math.max(f0[0]-d*hRef*0.4,f0[0]-d*hRef*1.5),y0:f0[1]-hRef*0.5,y1:f0[1]+hRef*0.5});
      ctx.reg.knots.push({x:f0[0],y:f0[1],h:hRef*spread}); }
    return done(G); }

  // ---------------- ring: dancers round a centre on a flattened ring, watchers in 1–3 clumps outside it
  function ring(ctx,spec,Z){ var G=group(ctx,Z,'ring'), c=Z.focus, n=spec.n||ctx.ri(8,14), hRef=60*ctx.depth(c[1]), r=spec.r||hRef*(0.13*n+0.1), i, k;
    var a=ctx.rr(0,Math.PI*2), gaps=[], t=0; for(i=0;i<n;i++){ gaps.push(ctx.rr(0.7,1.3)); t+=gaps[i]; }
    for(i=0;i<n;i++){ var rad=r*ctx.rr(0.93,1.07), x=c[0]+Math.cos(a)*rad, y=c[1]+Math.sin(a)*rad*0.42, dx=c[0]-x;
      put(G,mk(G,x,y,'dance',Math.abs(dx)>hRef*0.15?sgn(dx):(ctx.R()<0.5?1:-1))); a+=gaps[i]/t*Math.PI*2; }
    var nw=spec.watchers===undefined?ctx.ri(4,7):spec.watchers, clumps=nw>=4?ctx.ri(2,3):1, wm=mixOf({mix:spec.watchMix},'watch'), left=nw;
    for(k=0;k<clumps&&left>0;k++){ var m=k===clumps-1?left:Math.min(left,Math.max(1,Math.round(left/(clumps-k)*ctx.rr(0.6,1.3)))); left-=m;
      var ca=ctx.R()<0.7?ctx.rr(0.15,0.85)*Math.PI:ctx.rr(1.15,1.85)*Math.PI, cr=r*ctx.rr(1.35,1.7), cx=c[0]+Math.cos(ca)*cr, cy=c[1]+Math.sin(ca)*cr*0.42;
      for(i=0;i<m;i++){ var wx=cx+ctx.rr(-0.45,0.45)*hRef, wy=cy+ctx.rr(-0.18,0.18)*hRef, ddx=c[0]-wx; put(G,mk(G,wx,wy,pick(ctx,wm)||'stand',Math.abs(ddx)>hRef*0.15?sgn(ddx):1)); } }
    return done(G); }

  // ---------------- rail: clumps of 2–4 at 0.4–0.7 h, gaps of 1.5–3 h between clumps, 30 % turned to talk to the neighbour; waist-up, the rail crossing at 0.5 h
  function rail(ctx,spec,Z){ var G=group(ctx,Z,'rail'), pts=Z.pts, L=plen(pts), mid=atLen(pts,L/2), hRef=60*ctx.depth(mid[1]), n=spec.n||Math.round(L/(1.1*hRef)), mix=mixOf(spec,'rail'), i, k;
    var s=hRef*ctx.rr(0.1,1.2), scale=Math.max(0.5,Math.min(2.5,(L/Math.max(1,n))/(1.1*hRef)));
    while(G.specs.length<n&&s<L-3){ var m=ctx.R()<0.15?1:ctx.ri(2,4), first=G.specs.length;
      for(k=0;k<m&&s<L-3;k++){ var P=atLen(pts,s), h=60*ctx.depth(P[1]), x=P[0]+ctx.rr(-1.2,1.2), nm=pick(ctx,mix)||'rail', dir=ctx.R()<0.5?1:-1;
        if(Z.focus){ var dx=Z.focus[0]-x; if(Math.abs(dx)>h*0.15)dir=sgn(dx); }
        var f=mk(G,x,P[1]+h*ctx.rr(0.46,0.54),'rail',dir,ctx.rr(0.92,1.08)); f.z=G.z===undefined?P[1]:G.z-3; if(nm==='point')f.prop='arm'; // z − 3: the rail is stamped in front, it hides the legs
        if(k>0&&ctx.R()<0.3){ f.dir=-sgn(P[2]); if(ctx.R()<0.5)f.prop='arm'; } // turned back to the one just placed
        put(G,f,undefined,1); s+=h*ctx.rr(0.4,0.7)*Math.min(1,Math.max(0.7,scale)); }
      s+=hRef*ctx.rr(1.5,3)*scale; }
    // short of n: join existing clumps (0.4–0.7 h beside a member), never the gaps
    var tries=0; while(G.specs.length<n&&tries<n*4&&G.specs.length){ tries++; var a=G.specs[ctx.ri(0,G.specs.length-1)], hh=a.h, sx=a.x+hh*ctx.rr(0.4,0.7)*(ctx.R()<0.5?-1:1);
      if(sx<pts[0][0]+3&&sx<pts[pts.length-1][0]+3||sx>pts[0][0]-3&&sx>pts[pts.length-1][0]-3)continue;
      var Q=atLen(pts,Math.max(0,Math.min(L,(sx-pts[0][0])/((pts[pts.length-1][0]-pts[0][0])||1)*L))), h2=60*ctx.depth(Q[1]), g=mk(G,Q[0],Q[1]+h2*ctx.rr(0.46,0.54),'rail',ctx.R()<0.3?sgn(a.x-Q[0]):(ctx.R()<0.5?1:-1),ctx.rr(0.92,1.08));
      g.z=G.z===undefined?Q[1]:G.z-3; put(G,g,undefined,1); }
    return done(G); }

  // ---------------- stairs: climbers along the stair line, 70 % going up, 25 % in pairs, lulls; a few stopped and looking about
  function stairs(ctx,spec,Z){ var G=group(ctx,Z,'stairs'), pts=Z.pts, L=plen(pts), mid=atLen(pts,L/2), hRef=60*ctx.depth(mid[1]), n=spec.n||Math.round(L/(0.75*hRef)), mix=mixOf(spec,'stairs');
    var end=pts[pts.length-1], up=Z.dir?sgn(Z.dir[0]):(Math.abs(end[0]-pts[0][0])>4?sgn(end[0]-pts[0][0]):1), w=Z.w||0.25*hRef, s=hRef*ctx.rr(0.2,0.8), got=0;
    var climbOnly=function(k){ return k==='climb'; };
    while(got<n&&s<L-0.2*hRef){ var P=atLen(pts,s), v=ctx.rr(-1,1)*w, x=P[0]-P[3]*v, y=P[1]+P[2]*v, h=60*ctx.depth(y), nm=pick(ctx,mix)||'climb', dir=ctx.R()<0.7?up:-up, along=0;
      if(nm==='stand'||nm==='point')dir=ctx.R()<0.5?1:-1;
      var k=addOne(G,x,y,nm,dir,P[2],P[3],undefined,'climb'); if(k>=0)got++;
      if(ctx.R()<0.25){ var v2=v+ctx.rr(0.3,0.6)*w*(v>0?-1:1), Q=atLen(pts,s+h*0.35);
        if(addOne(G,Q[0]-Q[3]*v2,Q[1]+Q[2]*v2,pick(ctx,mix,climbOnly)||'climb',dir,Q[2],Q[3],k,'climb')>=0)got++; along=h*0.35; }
      s+=along+h*ctx.rr(0.5,0.9)*(ctx.R()<0.2?ctx.rr(1.8,2.6):1); }
    return done(G); }

  // ---------------- deck: the boat's seats as given; n < seats thins them at random
  function deck(ctx,spec,Z){ var G=group(ctx,Z,'deck'), seats=Z.seats||[], n=spec.n===undefined?seats.length:spec.n, i;
    for(i=0;i<seats.length;i++){ var st=seats[i]; if(n<seats.length&&ctx.R()>n/seats.length)continue; var pose=st.pose||'sit';
      var f={x:st.x,y:st.y,h:st.h||60*ctx.depth(st.y),pose:pose,dir:st.dir||(ctx.R()<0.5?1:-1),z:Z.z!==undefined?Z.z:st.y,tint:'none',prop:PROP[pose]||''};
      G.specs.push(f); G.boxes.push(boxOf(f)); }
    return done(G); }

  function place(ctx,spec){ var Z=zoneOf(ctx,spec), k=spec.kind||'stream';
    if(k==='queue')return queue(ctx,spec,Z); if(k==='cluster')return cluster(ctx,spec,Z); if(k==='episode')return episode(ctx,spec,Z); if(k==='ring')return ring(ctx,spec,Z);
    if(k==='rail')return rail(ctx,spec,Z); if(k==='stairs')return stairs(ctx,spec,Z); if(k==='deck')return deck(ctx,spec,Z); return stream(ctx,spec,Z); }

  // the box the placement rules used, with the figure's silhouette inside it: head 0.2 w for the top 0.14 h, body widening to 0.57 w at the feet (wide props: 0.5 w)
  function footprint(ctx,f){ var b=boxOf(f), w=b.x1-b.x0, wide=!!WIDE[f.prop], h=f.h, fx=f.x, y0=b.y0;
    b.inside=function(x,y){ if(x<b.x0||x>b.x1||y<b.y0||y>b.y1)return false; var u=(y-y0)/h, hw=u<0.14?0.2*w:(wide?0.5*w:(0.34+0.23*u)*w); return Math.abs(x-fx)<hw; };
    return b; }

  return {place:place,footprint:footprint,spreadAlong:spreadAlong,MIX:MIX,CARRY:CARRY,WIDE:WIDE};
})();
