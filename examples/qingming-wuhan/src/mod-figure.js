/* mod-figure.js — 白描 figures. Contract: interfaces.md §2(b), §3.
   Pose generators work in unit coordinates: origin at the feet centre, +u = facing direction, v up, height 1 = spec.h
   (after a ±8 % per-figure variation). A generator lays down marks (kind + points), solids (what the figure occludes),
   head/hand positions (赭石) and robe polygons (tint wash). footprint() resolves the figure once and caches it on the spec;
   build() draws the same resolved marks with bline in FIGURES, clipped by z. All randomness is spent at resolve/build time. */
var FIGURE=(function(){
  // [grade, width ×, alpha +] on ctx.INK (D-08: primary 0.65 / structural 0.5 / texture 0.35): hats, hair and shoes carry the darkest ink,
  // the garment silhouette is primary, arms/legs/head structural, folds and strings texture
  // 4th field (D-10(c)): stroke construction by material — garment edges (body, sleeves, trousers, hats) swell and thin; head arcs and
  // ticks are plain; frames, counters, poles and wheels are ruled; folds and strings sit at texture alpha, so they get no head either
  var KIND={hat:['primary',1.05,0],hair:['primary',1.25,15],hairL:['primary',1.15,0],tick:['structural',0.8,15,'rock'],head:['structural',0.85,35,'rock'],shoulder:['structural',1.0,45],
    body:['primary',1.0,5],fold:['texture',1.0,8],sleeve:['structural',1.0,45],leg:['structural',0.95,45],shoe:['primary',1.25,15],prop:['structural',0.9,40,'rule'],
    pole:['primary',1.05,5,'rule'],thin:['texture',1.0,8],foldT:['texture',1.05,10,'branch'],wheel:['structural',0.9,35,'rule'],div:['structural',0.95,40]};
  var GARM={robe:{hem:0.13,hb:0.16,wa:0.092,legs:'bare',belt:true},coat:{hem:0.34,hb:0.15,wa:0.097,legs:'trousers',belt:false},
    jacket:{hem:0.46,hb:0.14,wa:0.102,legs:'trousers',belt:false},shorts:{hem:0.5,hb:0.135,wa:0.1,legs:'bare',belt:false},
    longcoat:{hem:0.24,hb:0.17,wa:0.097,legs:'trousers',belt:false},skirt:{hem:0.4,hb:0.165,wa:0.092,legs:'bare',belt:true}};

  function newP(ctx,spec){ var rr=ctx.rr;
    var P={marks:[],solids:[],heads:[],hands:[],robes:[],reds:[],inks:[],ox:0,oy:0,sc:1,fl:1,prop:spec.prop,table:spec.table};
    P.r=function(a,b){ return rr(a,b); };
    P.pick=function(arr){ return arr[ctx.ri(0,arr.length-1)]; };
    P.map=function(q){ return [P.ox+P.fl*P.sc*q[0],P.oy+P.sc*q[1]]; };
    P.map2=function(q,ox,oy,sc,fl){ return P.map([ox+fl*sc*q[0],oy+sc*q[1]]); };
    P.m=function(k,pts){ var out=[]; for(var i=0;i<pts.length;i++)out.push(P.map(pts[i])); P.marks.push({k:k,pts:out,wm:P.bw||1,am:P.ba||0}); };
    P.solid=function(poly){ var out=[]; for(var i=0;i<poly.length;i++)out.push(P.map(poly[i])); P.solids.push({poly:out}); return out; };
    P.disc=function(u,v,r){ P.solids.push({c:P.map([u,v]),r:r*P.sc}); };
    // round 10 (D-19 (1)): an ink mass — a small polygon filled with 积墨 at build time (hair, hats, shoes); z-clipped like every mark
    P.ink=function(poly,ink){ var out=[]; for(var i=0;i<poly.length;i++)out.push(P.map(poly[i])); P.inks.push({poly:out,ink:ink}); };
    // round 10 (B9 「衣套同形感」): per-figure variety of the template — width, hem width, shoulder slope, lean; re-rolled per group body
    // round 11 (B10): width and hem jitter down to ±5 % — the action templates carry the difference between figures, not the coat
    P.vary=function(){ P.vw=rr(0.95,1.05); P.vh=rr(0.95,1.05); P.vs=rr(-0.02,0.03); P.vl=rr(-0.025,0.025); P.dark=rr(0,1)<0.75; };
    P.sub=function(fn,ox,oy,sc,fl){ var s=[P.ox,P.oy,P.sc,P.fl]; P.ox=ox; P.oy=oy; P.sc=sc; P.fl=fl; fn(P); P.ox=s[0]; P.oy=s[1]; P.sc=s[2]; P.fl=s[3]; };
    P.st=rr(0.85,1.2); P.sw=rr(0.9,1.1); P.hr=rr(0.92,1.08); P.h=spec.h;
    P.wm=rr(0.85,1.15); P.am=ctx.ri(-15,15); P.vary();
    P.hd=P.pick(['short','short','bun','brim','bald','pony','cap']);
    P.acc=rr(0,1)<0.3?P.pick(['backpack','bag','carry']):null;
    P.wt=rr(0,1)<0.5?1:-1; P.turn=P.pick(['tq','tq','tq','front','profile']);
    return P; }

  // ---------------------------------------------------------------- parts (pose frame: facing +u)
  function ell(cu,cv,ru,rv,n,rot){ var pts=[], c=Math.cos(rot||0), s=Math.sin(rot||0); n=n||8;
    for(var i=0;i<=n;i++){ var a=i/n*Math.PI*2, x=Math.cos(a)*ru, y=Math.sin(a)*rv; pts.push([cu+x*c-y*s,cv+x*s+y*c]); } return pts; }

  // head: face arc, nape arc, then one of the treatments — short hair (2–3 hatch strokes across the crown, silk showing between),
  // bun/topknot, peaked cap (crown + brim tick), bucket hat, bare head (two ticks), hood/ponytail, plus helmet/swim/tuft for
  // the poses that need them. Hair is a black mass only on P.dark (a fifth of figures). At ≥40 px an eye tick and a nose/ear
  // tick sit on the facing side. tilt>0 nods forward. Returns the head centre.
  function head(P,cu,cv,hat,tilt,turn){ var r=0.065*P.hr, ct=Math.cos(tilt||0), sn=Math.sin(tilt||0), pv=[cu,cv-1.3*r], big=P.h*P.sc>=40, hf=turn==='back'?-1:1;
    function q(a,b){ var du=a*r*hf, dv=b*r+1.3*r; return [pv[0]+du*ct+dv*sn,pv[1]-du*sn+dv*ct]; }
    function arc(k,list){ var pts=[]; for(var i=0;i<list.length;i++)pts.push(q(list[i][0],list[i][1])); P.m(k,pts); }
    if(hat==='cap'&&P.r(0,1)<0.5)hat=P.hd;
    var hk=P.dark?'hair':'hairL', j=P.r(-0.12,0.12), dk=P.dark;
    // round 10 (D-19 (1), 「黑头」): on 60 % of figures the hair or the hat is a solid ink mass (积墨 0.85–0.95) — the crown and the nape
    // for hair, the whole crown for a cap, bucket hat, hood or helmet; the face stays silk. The rest keep the hatched hair of round 9.
    function mass(list,ink){ var pts=[]; for(var i=0;i<list.length;i++)pts.push(q(list[i][0],list[i][1])); P.ink(pts,ink); }
    var mk=P.r(0.85,0.95);
    arc('head',[[0.2,0.88],[0.95,0.3],[0.9,-0.4],[0.35,-0.95]]);
    arc('head',[[-0.3,0.92],[-0.97,0.25],[-0.85,-0.5],[-0.3,-0.92]]);
    // round 11 (B10 「黑头压实」): the mass is the whole head but the face — hairline at the brow on the facing side, the ink running
    // over the crown, round the back and down the nape to the jaw; the face a crescent of silk (≈ 22 % of the disc), ink 75–80 %
    if(hat==='short'||hat==='bun'||hat==='pony'){ // hair: a mass over the crown and down the nape on dark heads; two or three strokes sweeping back with silk between on the rest
      if(dk){ mass([[0.74+j,0.62],[0.4,0.92],[-0.1,1.02],[-0.6,0.88],[-0.92,0.55],[-1.05,0.05],[-0.95,-0.5],[-0.6,-0.85],[-0.15,-0.94],[0.18,-0.65],[0.44,-0.25],[0.56,0.2]],mk); arc('hair',[[0.7+j,0.6],[0.56,0.2],[0.44,-0.25],[0.18,-0.65]]); }
      else { arc(hk,[[0.5+j,0.62],[-0.2,0.72],[-0.8,0.45],[-0.95,0.1]]); arc(hk,[[0.25,0.85+j],[-0.35,0.9],[-0.85,0.6]]); if(P.r(0,1)<0.5)arc(hk,[[0.4,0.42],[-0.3,0.55],[-0.85,0.25]]); } }
    if(hat==='bun'){ arc(hk,[[-0.6,0.95],[-0.8,1.4],[-0.2,1.45],[-0.1,1.05]]); if(dk)mass([[-0.6,0.95],[-0.8,1.4],[-0.2,1.45],[-0.1,1.05]],mk); }
    if(hat==='pony'){ arc(hk,[[-0.85,0.4],[-1.3,-0.1],[-1.2,-0.7]]); arc('hairL',[[-1.0,0.2],[-1.4,-0.5]]); }
    if(hat==='cap'){ arc('hat',[[-0.95,0.35],[-0.5,1.05],[0.4,1.08],[0.95,0.5]]); arc('hat',[[0.6,0.55+j],[1.3,0.5],[1.9,0.35]]);
      if(dk)mass([[-0.93,0.38],[-0.5,1.03],[0.4,1.06],[0.93,0.52],[0.62,0.5],[0.5,0.12],[0.4,-0.32],[0.14,-0.7],[-0.3,-0.9],[-0.75,-0.65],[-1.02,-0.1]],mk); else arc(hk,[[-0.6,0.6],[0.0,0.85],[0.5,0.7]]); }
    if(hat==='brim'){ arc('hat',[[-0.85,0.45],[-0.45,1.0],[0.45,1.05],[0.9,0.5]]); arc('hat',[[-1.7,0.3],[-0.8,0.5],[0.2,0.6],[1.0,0.5],[1.75,0.25]]);
      if(dk)mass([[-0.83,0.47],[-0.45,0.98],[0.45,1.03],[0.88,0.52],[0.6,0.5],[0.5,0.12],[0.4,-0.32],[0.14,-0.7],[-0.3,-0.9],[-0.75,-0.65],[-1.0,-0.1]],mk*0.95); }
    if(hat==='bald'){ arc('tick',[[-0.55,0.95],[-0.2,1.02]]); arc('tick',[[0.15,0.85],[0.5,0.8]]); if(P.r(0,1)<0.5)arc('hairL',[[-0.95,0.2],[-0.9,-0.3]]); if(dk)mass([[-0.6,0.55],[-0.95,0.3],[-1.0,-0.2],[-0.85,-0.5],[-0.65,-0.3],[-0.7,0.2]],mk*0.9); }
    if(hat==='helmet'){ arc('hat',[[-1.05,0.1],[-0.6,0.95],[0.4,1.05],[1.05,0.35],[1.15,-0.1]]); arc('hat',[[-0.6,0.5],[0.4,0.55]]);
      if(dk)mass([[-1.03,0.12],[-0.6,0.93],[0.4,1.03],[1.03,0.36],[1.1,-0.05],[0.6,0.3],[0.0,0.2],[-0.5,-0.2],[-0.85,-0.55],[-1.0,-0.3]],mk); }
    if(hat==='hood'){ arc('hat',[[-1.1,0.4],[-0.5,1.1],[0.5,1.05],[1.0,0.3]]); arc('hat',[[-1.05,0.3],[-1.15,-0.4],[-0.7,-0.8]]); arc('hairL',[[0.45,0.7],[-0.3,0.85]]);
      if(dk)mass([[-1.08,0.4],[-0.5,1.08],[0.5,1.03],[0.98,0.32],[0.62,0.45],[0.5,0.05],[0.35,-0.4],[0.0,-0.75],[-0.5,-0.85],[-0.95,-0.6],[-1.12,-0.4],[-1.0,0.1]],mk*0.9); }
    if(hat==='tuft'){ arc(hk,[[-0.8,0.5],[-0.3,1.0],[0.5,0.95]]); arc(hk,[[-0.1,1.0],[0.1,1.4]]); }
    if(hat==='swim')arc('hat',[[-1.0,0.2],[-0.5,1.0],[0.5,1.0],[1.0,0.25]]);
    // face ticks by turn: frontal = two eyes; three-quarter (and 'back', the head flipped) = near eye + nose; profile = eye, nose at the edge, ear
    if(big){ if(turn==='front'){ arc('tick',[[0.3,0.3],[0.5,0.3]]); arc('tick',[[-0.5,0.3],[-0.3,0.3]]); }
      else if(turn==='profile'){ arc('tick',[[0.55,0.32],[0.75,0.3]]); arc('tick',[[0.95,0.05],[1.12,-0.15],[0.95,-0.3]]); arc('tick',[[-0.5,0.1],[-0.55,-0.2]]); }
      else { arc('tick',[[0.45,0.3],[0.7,0.28]]); if(P.r(0,1)<0.6)arc('tick',[[0.9,-0.05],[0.98,-0.3]]); else arc('tick',[[-0.7,0.05],[-0.75,-0.25]]); } }
    var c=q(0,0); P.heads.push({c:P.map(c),r:r*P.sc}); P.disc(c[0],c[1],r*1.15); return c; }

  // shoulder line; dF/dB drop the front/back end (the counter-tilt against the hip: the shoulder above the supporting leg sits lower)
  function shoulders(P,cu,sv,hw,dF,dB){ dF=dF||0; dB=dB||0; P.m('shoulder',[[cu-hw,sv-0.012-dB],[cu-hw*0.45,sv+0.018-dB*0.5],[cu+hw*0.3,sv+0.022-dF*0.4],[cu+hw,sv-0.006-dF]]); }


  // ---------------------------------------------------------------- limbs as bones (round 5, D-12 primitive 1: 衣下有身)
  // solveArm: two bones from the shoulder to a hand point, elbow on the `bend` side; the reach is capped at 90 % so the elbow always bends.
  function solveArm(su,sv,hu,hv,bend,o){ o=o||{}; var L1=o.L1||0.17, L2=o.L2||0.17, tu=hu-su, tv=hv-sv, d=Math.sqrt(tu*tu+tv*tv), dm=(L1+L2)*0.9;
    if(d>dm){ var k=dm/d; tu*=k; tv*=k; d=dm; hu=su+tu; hv=sv+tv; }
    var th=Math.atan2(tv,tu), a=Math.acos(Math.max(-1,Math.min(1,(L1*L1+d*d-L2*L2)/(2*L1*d)))), ea=th+(bend||-1)*a;
    return {s:[su,sv],e:[su+Math.cos(ea)*L1,sv+Math.sin(ea)*L1],h:[hu,hv],wide:o.wide}; }
  function solveAngles(su,sv,a1,a2,o){ var L1=0.17; if(Math.abs(a2)<0.22)a2=a2<0?-0.22:0.22;
    var eu=su+Math.sin(a1)*L1, ev=sv-Math.cos(a1)*L1, b=a1+a2, hu=eu+Math.sin(b)*L1, hv=ev-Math.cos(b)*L1;
    return solveArm(su,sv,hu,hv,a2>=0?-1:1,o); }
  function nrm(a,b,away){ var du=b[0]-a[0], dv=b[1]-a[1], d=Math.sqrt(du*du+dv*dv)||1e-6, n=[-dv/d,du/d]; if(n[0]*away[0]+n[1]*away[1]<0){ n[0]=-n[0]; n[1]=-n[1]; } return n; }
  // the sleeve as a closed tube round the bones: outer edge shoulder → elbow → hand, the hand tip itself, inner edge back to the armpit.
  // `away` = the direction the outer side faces (away from the chest). w1 upper sleeve, w2 at the cuff (garment outside the flesh).
  function tubePts(A,away,w1,w2,armpit){ var s=A.s, e=A.e, h=A.h, n1=nrm(s,e,away), n2=nrm(e,h,n1), nm=[(n1[0]+n2[0])/2,(n1[1]+n2[1])/2];
    if(A.wide){ w1*=1.25; w2*=1.4; }
    var out=[[s[0]+n1[0]*w1*0.5,s[1]+n1[1]*w1*0.5],[e[0]+nm[0]*w1,e[1]+nm[1]*w1],[h[0]+n2[0]*w2*0.9-(h[0]-e[0])*0.06,h[1]+n2[1]*w2*0.9-(h[1]-e[1])*0.06],[h[0],h[1]],
      [h[0]-n2[0]*w2*0.8-(h[0]-e[0])*0.06,h[1]-n2[1]*w2*0.8-(h[1]-e[1])*0.06],[e[0]-nm[0]*w1*0.85,e[1]-nm[1]*w1*0.85]];
    if(armpit)out.push(armpit); return out; }
  // cut a polyline into its visible runs: original vertices kept (bline splines them), cut points found by sampling each segment
  function cutRuns(pts,hidden){ var runs=[], cur=[], i, k, N=10;
    function push(p){ cur.push(p); } function flush(){ if(cur.length>=2)runs.push(cur); cur=[]; }
    for(i=0;i<pts.length-1;i++){ var a=pts[i], b=pts[i+1], va=!hidden(a[0],a[1],i); if(va)push(a); else flush();
      for(k=1;k<=N;k++){ var t=k/N, q=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t], vq=!hidden(q[0],q[1],i);
        if(vq!==va){ var t0=(k-0.5)/N, c=[a[0]+(b[0]-a[0])*t0,a[1]+(b[1]-a[1])*t0]; if(vq){ flush(); push(c); } else { push(c); flush(); } va=vq; } } }
    var last=pts[pts.length-1]; if(!hidden(last[0],last[1],pts.length-2))push(last); flush(); return runs; }
  function inPolys(polys){ return function(u,v){ for(var i=0;i<polys.length;i++)if(pip(polys[i],u,v))return true; return false; }; }
  function discPoly(c,r){ return ell(c[0],c[1],r,r,10); }
  // clip the marks P.marks[i0..i1) against occluder polygons (figure frame, as stored): hidden runs are dropped, not thinned
  function clipMarks(P,i0,i1,polys){ var hid=inPolys(polys), out=P.marks.slice(0,i0), i, j; i1=Math.min(i1,P.marks.length);
    for(i=i0;i<i1;i++){ var m=P.marks[i], runs=cutRuns(m.pts,hid); for(j=0;j<runs.length;j++)out.push({k:m.k,pts:runs[j],wm:m.wm,am:m.am}); }
    P.marks=out.concat(P.marks.slice(i1)); }

  // legacy arm for the seated / riding bodies: the same bones, drawn as a closed sleeve. Signature unchanged.
  function armTo(P,su,sv,hu,hv,bend,o){ o=o||{}; var A=solveArm(su,sv,hu,hv,bend,o);
    if(!o.hide){ var t=tubePts(A,[A.s[0]-(o.cu!==undefined?o.cu:A.s[0]-0.05),0.2],0.045,0.035,null); P.m('body',t); P.solid(t); }
    else P.m('sleeve',[A.e,A.h]);
    P.hands.push(P.map(A.h)); return A.h; }
  function arm(P,su,sv,a1,a2,o){ var A=solveAngles(su,sv,a1,a2,o); return armTo(P,su,sv,A.h[0],A.h[1],a2>=0?-1:1,o); }

  // ---------------------------------------------------------------- the body under the garment (round 5)
  // figure(P,S) draws one person from a skeleton S (pose frame, facing +u): the outer contour is ONE closed line — neck, near shoulder,
  // outer edge of the near arm round the hand and back to the armpit, torso side, hip, near leg down to the foot and up its inner edge,
  // the hem between the legs, the far leg only where it shows beyond the near leg, the far side of the torso, the far arm (only if it
  // reaches out; a hanging far arm behind the torso is dropped), far shoulder, neck. Inner divisions (collar, 门襟 seam bowed by the twist,
  // jacket hem over trousers, cuffs, belt) are structural; folds — from the supporting hip and from the raised shoulder only — texture.
  //   S.chest [u,v] shoulder-bar centre · S.hw shoulder half width · S.dF/S.dB shoulder drops · S.tws twist −1..1 · S.turn
  //   S.pelvis [u,v] · S.rot pelvis roll (supporting side up) · S.ws supporting side (+1 front / −1 back) · S.hem S.hb S.wa S.hemU S.g
  //   S.head {c,tilt,look,hat} · S.armF/S.armB {s,e,h,wide} or null · S.showB the far arm is meant to show
  //   S.legs {kind, F:{k,f}, B:{k,f}} knee and foot per leg (v of foot > 0 = lifted) or null (legs skipped) · S.noHem · S.belt
  function figure(P,S){ var turn=S.turn, cu=S.chest[0], cv=S.chest[1], hw=S.hw, pu=S.pelvis[0], pv=S.pelvis[1], rot=S.rot||0, ws=S.ws||1, tws=S.tws||0;
    var hem=S.hem, hb=S.hb, wa=S.wa, hemU=S.hemU, g=S.g, front=turn==='front', prof=turn==='profile', tq=turn==='tq', i;
    var wv=pv+0.1, wu=S.waistU!==undefined?S.waistU:(cu+pu)/2+ws*0.012+tws*0.02, mid=(cu+pu)/2;
    var sF=[cu+hw+tws*0.03,cv-0.012-(S.dF||0)], sB=[cu-hw-tws*0.03,cv-0.012-(S.dB||0)];
    var apF=[cu+hw*0.9+tws*0.02,cv-0.1], apB=[cu-hw*0.92-tws*0.02,cv-0.1];
    // round 6 (B5 tell 2): the weight chain. The supporting side (sup) is drawn as one line planted foot → knee → hip → waist → shoulder:
    // the garment sits close on it (hip HP, waist wa·0.9, the hem corner ON the hip→knee line, no step at the hem); the other side hangs
    // loose from the shoulder (waist wa·1.1, hip HP·1.15, the hem flaring to hb). HP is the flesh hip half-width (0.085–0.12), per figure.
    var sup=ws>0?1:-1, HP=S.hip!==undefined?S.hip:hb*0.72, L=S.legs, lowHem=hem<pv-0.03;
    // round 7 (D-14): the v5 flesh widths are back — trouser 0.05–0.058 at the knee, 0.036 at the ankle, sleeve 0.05 — and the pelvis
    // roll is drawn at a size that shows: the hip and the hem corner rise 0.25·rot on the supporting side and drop on the loose side
    var wk=L?(L.kind==='trousers'?P.r(0.05,0.058):P.r(0.033,0.038)):0.045, wa2=L&&L.kind==='trousers'?0.036:0.026, oT=L&&L.kind==='trousers'?0.72:0.45, iT=L&&L.kind==='trousers'?0.12:0.15;
    var roll=0.25*rot, bare=L&&L.kind!=='trousers';
    // round 8 (D-15, B7 tell 2, fourth attempt): the large figures (h >= 40) and the ebike group are drawn as ONE silhouette — the sleeve
    // and the torso are a single mass (the sleeve's inner edge inside the torso and the torso side under the sleeve are both dropped),
    // the waist is a notch 0.8 of the hip width, no belt, no cuffs, no collar; flesh shows as swellings of that outline (shoulder blade,
    // buttock over the supporting leg, calf); at most three tapering folds, each leaving a bearing point. Smaller figures keep round 7.
    var big=P.h*P.sc>=40||!!P.ebike;
    function hipPt(s){ var t=s===sup; return [pu+s*HP*(t?1.0:1.1),pv+s*roll]; }
    function waistPt(s){ var t=s===sup; return big?[wu+s*HP*0.8*(t?1.0:1.1),wv]:[wu+s*wa*(t?0.9:1.1),wv]; }
    function buttPt(s){ var hp=hipPt(s), hm=hemPt(s), q=Math.min(0.5,0.06/Math.max(0.02,hp[1]-hm[1])); return [hp[0]+(hm[0]-hp[0])*q+s*0.012,hp[1]+(hm[1]-hp[1])*q]; }
    function nextDown(s){ if(!L)return null; var leg=s>0?L.F:L.B, k=leg.k, f=leg.f, lift=f[1]>0?f[1]:0; return k[1]<hem-0.03?[k[0]+s*wk,k[1]]:[f[0]+s*wa2,lift+0.012]; }
    function hemPt(s){ var t=s===sup, hv=hem+s*roll*1.2, hp=hipPt(s), nd=nextDown(s);
      if(t&&nd&&hp[1]>nd[1]+0.02){ var q=(hp[1]-hv)/(hp[1]-nd[1]); return [hp[0]+(nd[0]-hp[0])*q,hv]; }
      if(t)return [hp[0]+(hemU-pu)*0.5,hv];
      return [hemU+s*Math.max(HP*1.2,hb*(bare?1.15:1.05)),hv+(s>0?0:0.004)]; }
    var hipF=hipPt(1), hipB=hipPt(-1), hemF=hemPt(1), hemB=hemPt(-1), wF=waistPt(1), wB=waistPt(-1);
    // (a) the hem turns with the pelvis: between its two corners (already higher on the supporting side) the hem is the near rim of an
    // ellipse seen from a little above — it bows down below the chord by hemDip in the middle, a robe more than a jacket
    var hemDip=bare||!L?P.r(0.024,0.032):P.r(0.014,0.02);
    function hemV(u){ var t=(u-hemF[0])/((hemB[0]-hemF[0])||1e-6); t=t<0?0:t>1?1:t; return hemF[1]+(hemB[1]-hemF[1])*t-hemDip*Math.sin(Math.PI*t); }
    var blade=big?[cu-hw*1.09,cv-0.115]:[cu-hw*1.02,cv-0.1], btF=big&&lowHem&&sup>0?buttPt(1):null, btB=big&&lowHem&&sup<0?buttPt(-1):null;
    var torsoPoly=[sF,[cu+hw*0.98+(tq?0.02:0),cv-0.09],wF,hipF,hemF,hemB,hipB,wB,blade,sB];
    if(btF)torsoPoly.splice(4,0,btF); if(btB)torsoPoly.splice(torsoPoly.length-4,0,btB);
    if(!lowHem){ torsoPoly=[sF,[cu+hw*0.98+(tq?0.02:0),cv-0.09],wF,hemF,hemB,wB,blade,sB]; }
    // head on the neck: the neck leans with the spine from the shoulder bar to the head base
    var hc=S.head.c, r=0.065*P.hr, nw=0.028, nb=[cu+(hc[0]-cu)*0.25,cv+0.01], nt=[hc[0]-Math.sin(S.head.tilt||0)*r*0.3,hc[1]-1.25*r];
    head(P,hc[0],hc[1],S.head.hat||'cap',S.head.tilt||0,S.head.look||turn);
    if(!big)shoulders(P,cu+tws*0.01,cv,hw,S.dF||0,S.dB||0); // round 8: the large figures' shoulder slope is the silhouette itself, no bar across
    // arms: near arm in the loop; far arm in the loop when frontal, else only if it reaches out (then clipped by the torso), else dropped
    var AF=S.armF, AB=S.armB, w1=S.w1||P.r(0.047,0.054), w2=w1*0.8, loop=[];
    var farTube=null, farInLoop=front&&AB;
    if(AB&&!front){ var reach=AB.h[0]>cu+hw*0.6||AB.h[1]>cv+0.02||AB.h[0]<cu-hw*1.3||(S.showB&&!pip(torsoPoly,AB.h[0],AB.h[1]));
      if(reach)farTube=tubePts(AB,[-1,0],w1*0.95,w2*0.95,null); }
    // the loop, clockwise from the neck front: near shoulder, near arm, torso front, near leg, hem, far leg, torso back, far arm, far shoulder
    loop=[[nt[0]+nw*0.9,nt[1]],[nb[0]+nw,nb[1]],sF];
    var tf=null, tb=null, tfR=null, tbR=null, sF0, sF1, sB0, sB1;
    if(AF){ tf=tubePts(AF,[1,0],w1,w2,apF); tfR=[loop.length-1,0]; for(i=0;i<tf.length;i++)loop.push(tf[i]); tfR[1]=loop.length; } else loop.push(apF);
    sF0=loop.length-1; loop.push(wF); if(lowHem){ loop.push(hipF); if(btF)loop.push(btF); } loop.push(hemF); sF1=loop.length-1;
    // legs: on the supporting side the leg's outer edge starts at the hem corner itself (the chain runs on); on the loose side the
    // garment hangs past the leg and the trouser starts inside the hem; the supporting leg is a touch narrower at the knee
    var legPolys=[], nearPoly=null, farPts=null, hemInner=[], crossV=-1;
    if(L){ var kind=L.kind, top=hem;
      function legPts(leg,side){ var f=leg.f, k=leg.k, hasK=k[1]<top-0.03, lift=f[1]>0?f[1]:0, t=side===sup, hp=side>0?hemF:hemB, hv=hp[1], wkk=wk*(t?0.92:1.08), uo=hemU+side*hb*oT, ui=hemU+side*hb*iT;
        var o=[t?[hp[0],hv]:[uo,hemV(uo)]]; if(hasK)o.push([k[0]+side*wkk,k[1]]);
        // round 8: on the large figures the calf swells the outline behind the shin, 0.4 of the way from the knee to the ankle
        if(big){ var ka=hasK?[k[0]+side*wkk,k[1]]:o[0]; o.push([ka[0]+(f[0]+side*wa2-ka[0])*0.4+side*wkk*0.16,ka[1]+(lift+0.012-ka[1])*0.4]); }
        o.push([f[0]+side*wa2,lift+0.012],[f[0]+side*wa2*0.7,lift+0.002],[f[0]-side*wa2*0.7,lift+0.002],[f[0]-side*wa2,lift+0.012]);
        if(hasK)o.push([k[0]-side*wkk,k[1]]); o.push([ui,hemV(ui)]);
        // (b) the free leg's trouser folds once at the knee: a crease from the outer edge in, under the kneecap (round-7 figures only)
        if(hasK&&!t&&kind==='trousers'&&!big)P.m('fold',[[k[0]+side*wkk*0.95,k[1]+0.012],[k[0]+side*wkk*0.1,k[1]-0.004],[k[0]-side*wkk*0.45,k[1]-0.014]]);
        return o; }
      var nF=legPts(L.F,1), nB=legPts(L.B,-1);
      for(i=0;i<nF.length;i++)loop.push(nF[i]);
      // hem between the legs: a robe's underside dips; trousers meet at the crotch
      // the hem between the legs is the same ellipse arc, sampled where it shows
      var uA=hemU+hb*iT, uB=hemU-hb*iT; hemInner=[[uA*0.7+uB*0.3,0],[(uA+uB)/2,0],[uA*0.3+uB*0.7,0]]; for(i=0;i<3;i++)hemInner[i][1]=hemV(hemInner[i][0]);
      for(i=0;i<hemInner.length;i++)loop.push(hemInner[i]);
      var i0=loop.length; for(i=nB.length-1;i>=0;i--)loop.push(nB[i]); farPts=[i0,loop.length];
      nearPoly=nF.slice(); legPolys.push(nF,nB);
      // a far leg that crosses the near one (walk2: near foot back, far foot forward) shows only below the crossing — no X
      function uAt(leg,side,v){ var seg=[[hemU+side*hb*0.42,top]]; if(leg.k[1]<top-0.03)seg.push(leg.k); seg.push([leg.f[0],leg.f[1]>0?leg.f[1]:0]);
        for(var j=0;j<seg.length-1;j++){ var a=seg[j], b=seg[j+1]; if(v<=a[1]&&v>=b[1]){ var t=(a[1]-v)/((a[1]-b[1])||1e-6); return a[0]+(b[0]-a[0])*t; } } return seg[seg.length-1][0]; }
      var s0=uAt(L.F,1,top-0.01)-uAt(L.B,-1,top-0.01), vv; for(vv=top-0.02;vv>0;vv-=0.02){ var dd=uAt(L.F,1,vv)-uAt(L.B,-1,vv); if(dd*s0<0){ crossV=vv+0.01; break; } } }
    sB0=loop.length-1; loop.push(hemB); if(lowHem){ if(btB)loop.push(btB); loop.push(hipB); } loop.push(wB); sB1=loop.length-1;
    if(farInLoop){ tb=tubePts(AB,[-1,0],w1,w2,apB); tbR=[loop.length-1,0]; loop.push(apB); for(i=tb.length-2;i>=0;i--)loop.push(tb[i]); tbR[1]=loop.length; loop.push(sB); }
    else loop.push(blade,sB);
    loop.push([nb[0]-nw,nb[1]],[nt[0]-nw*0.9,nt[1]],[nt[0]+nw*0.9,nt[1]]);
    // hidden: the far leg inside the near leg (never an X), the loop's crossing under the head
    var headDisc=discPoly(hc,r*1.05), farHid=nearPoly&&!front?inPolys([nearPoly]):null;
    var hid=function(u,v,i){ return pip(headDisc,u,v)||(farHid&&i>=farPts[0]-1&&i<farPts[1]&&(farHid(u,v)||(crossV>0&&v>crossV))); };
    if(big){ var hid7=hid, inT=function(u,v){ return pip(torsoPoly,u,v); };
      hid=function(u,v,i){ if(hid7(u,v,i))return true;
        if(tfR&&i>=tfR[0]&&i<tfR[1])return inT(u,v); if(tbR&&i>=tbR[0]&&i<tbR[1])return inT(u,v);
        if((i>sF0&&i<sF1)||(i>sB0&&i<sB1))return (tf&&pip(tf,u,v))||(tb&&pip(tb,u,v)); return false; }; }
    var rs=cutRuns(loop,hid); for(i=0;i<rs.length;i++)P.m('body',rs[i]);
    // the arm in front of the body: a single inner line — the sleeve's outer edge round the hand, only where it lies on the torso
    if(big){ var inner=function(A,T){ if(!T)return; var e=[T[0],T[1],T[2],T[3],T[4]], rr2=cutRuns(e,function(u,v){ return !pip(torsoPoly,u,v)||pip(headDisc,u,v); }); for(var j=0;j<rr2.length;j++)P.m('body',rr2[j]); };
      inner(AF,tf); if(farInLoop)inner(AB,tb); }
    if(farTube){ var ft=cutRuns(farTube,inPolys([torsoPoly,headDisc].concat(legPolys))); for(i=0;i<ft.length;i++)P.m('body',ft[i]); P.solid(farTube); }
    // divisions (structural): jacket hem over the trousers; 门襟 seam bowed by the twist; cuffs; belt
    if(L&&!lowHem&&L.kind==='trousers'&&!S.noHem)P.m('div',[[hemF[0]-hb*0.15,hemV(hemF[0]-hb*0.15)-0.006],[hemU+hb*0.2,hemV(hemU+hb*0.2)-0.008],[hemU-hb*0.35,hemV(hemU-hb*0.35)-0.006],[hemB[0]+hb*0.1,hemV(hemB[0]+hb*0.1)-0.002]]);
    if(!prof)P.m('div',[[cu+hw*0.12+tws*0.05,cv-0.025],[wu+wa*0.12+tws*0.06+ws*0.008,wv-0.02],[hemU+hb*0.1+tws*0.03,hem+0.012]]);
    if(S.belt&&!big)P.m('div',[[wu-wa*0.9,wv+0.012],[wu+tws*0.02,wv+0.022],[wu+wa*0.85,wv+0.006]]);
    function cuff(A,w){ if(!A)return; var n=nrm(A.e,A.h,[0,1]), d=[A.h[0]-A.e[0],A.h[1]-A.e[1]], k=0.22; P.m('div',[[A.h[0]-d[0]*k+n[0]*w,A.h[1]-d[1]*k+n[1]*w],[A.h[0]-d[0]*k-n[0]*w,A.h[1]-d[1]*k-n[1]*w]]); }
    if(!big){ cuff(AF,w2*0.9); if(farTube||farInLoop)cuff(AB,w2*0.85); }
    // folds (texture): from the supporting hip toward the opposite shoulder; a short one from the raised shoulder toward the waist
    var so=ws>0?sB:sF, hs=[pu+ws*hb*0.5,pv+0.02], rsh=ws>0?sB:sF;
    if(!big){
      P.m('fold',[hs,[(hs[0]*0.55+so[0]*0.45)+ws*0.01,(pv+cv)/2],[so[0]*0.6+cu*0.4,cv-0.08]]);
      P.m('fold',[[rsh[0]*0.8+cu*0.2,cv-0.04],[rsh[0]*0.55+wu*0.45,(cv+wv)/2],[wu-ws*wa*0.3,wv+0.03]]);
      if(S.stoop)P.m('fold',[[cu-hw*0.5,cv-0.05],[wu-wa*0.4,wv+0.03],[pu-hb*0.3,pv-0.02]]); }
    else { // three at most, each leaving a bearing point and tapering out over 0.15–0.25 h: the supporting hip, the raised shoulder, the bent elbow
      function foldT(a,d,len,bow){ var n=Math.sqrt(d[0]*d[0]+d[1]*d[1])||1e-6, ux=d[0]/n, uy=d[1]/n; if(pip(headDisc,a[0]+ux*len,a[1]+uy*len))return;
        P.m('foldT',[a,[a[0]+ux*len*0.5-uy*bow,a[1]+uy*len*0.5+ux*bow],[a[0]+ux*len,a[1]+uy*len]]); }
      var hp0=hipPt(sup); foldT([hp0[0]-sup*0.01,hp0[1]+0.02],[so[0]-hp0[0],cv-0.08-hp0[1]],P.r(0.15,0.18),sup*0.012);
      foldT([rsh[0]*0.82+cu*0.18,cv-0.035],[wu-rsh[0]*0.82-cu*0.18,wv-cv],P.r(0.15,0.17),-ws*0.008);
      if(AF){ var b1=[AF.e[0]-AF.s[0],AF.e[1]-AF.s[1]], b2=[AF.h[0]-AF.e[0],AF.h[1]-AF.e[1]], cs=(b1[0]*b2[0]+b1[1]*b2[1])/((Math.sqrt(b1[0]*b1[0]+b1[1]*b1[1])*Math.sqrt(b2[0]*b2[0]+b2[1]*b2[1]))||1e-6);
        if(cs<0.55)foldT([AF.e[0]-(AF.e[0]-(AF.s[0]+AF.h[0])/2)*0.35,AF.e[1]-(AF.e[1]-(AF.s[1]+AF.h[1])/2)*0.35],b2,P.r(0.15,0.18),0.006); } }
    // hands, shoes, solids
    if(AF)P.hands.push(P.map(AF.h)); if(AB&&(farTube||farInLoop))P.hands.push(P.map(AB.h));
    if(L){ function shoe(f){ var lift=f[1]>0.03?f[1]:0, heel=f[1]>0.03?0:f[1]; P.m('shoe',[[f[0]-0.03,0.008+heel+lift],[f[0]+0.05,0.003+lift]]);
        P.ink([[f[0]-0.035,lift],[f[0]+0.055,lift],[f[0]+0.05,lift+0.026],[f[0]-0.02,lift+0.024]],0.8); }
      shoe(L.F.f); if(!prof||Math.abs(L.B.f[0]-L.F.f[0])>0.05)shoe(L.B.f); }
    var occ=[torsoPoly]; P.robes.push(P.solid(torsoPoly));
    if(AF){ var sa=tubePts(AF,[1,0],w1,w2,apF); P.solid(sa); occ.push(sa); }
    if(farInLoop){ var sb=tubePts(AB,[-1,0],w1,w2,apB); P.solid(sb); occ.push(sb); }
    if(farTube)occ.push(farTube);
    for(i=0;i<legPolys.length;i++){ P.solid(legPolys[i]); occ.push(legPolys[i]); }
    occ.push(headDisc);
    return {sF:sF,sB:sB,occ:occ,torso:torsoPoly}; }

  // ---------------------------------------------------------------- round 9 (D-16): the silhouette family
  // The body is no longer synthesised outward from a skeleton. Each figure is one of ~26 outline templates traced from the original's
  // 2.5× details: a rounded mass under the garment — small head, shoulders sloping straight off the neck, no waist notch, the hem wider
  // than the shoulders, one leg forward and the other lost in the hem, the arm a sleeve that falls or reaches, carriers bent from the
  // hip, a leaner with the chest on the rail. Unit coordinates, facing +u, height 1, feet at v 0, listed clockwise from the neck front.
  // A point's third field tags an anchor: sF/sB shoulders, hF/hB hands, fF/fB feet, mF/mB hem corners. `head` is the head centre
  // (r 0.065 unless given), `inner` up to two structural lines inside (a sleeve over the torso, a forearm), `folds` up to two tapering
  // texture folds, `men` whether the 门襟 is drawn, `arm2` an extra closed sleeve leaving the loop (a far arm raised), `turn` the face.
  var TPL={
    standFront:{turn:'front',head:[0,0.925],men:true,folds:[[[0.12,0.78],[0.10,0.62],[0.07,0.50]]],
      pts:[[0.03,0.875],[0.14,0.80,'sF'],[0.19,0.62],[0.185,0.48,'hF'],[0.20,0.37,'mF'],[0.13,0.03,'fF'],[0.04,0.03],[0.0,0.22],[-0.04,0.03],[-0.13,0.03,'fB'],[-0.20,0.37,'mB'],[-0.185,0.48,'hB'],[-0.19,0.62],[-0.14,0.80,'sB'],[-0.03,0.875]]},
    stand34:{turn:'tq',head:[0,0.925],men:true,folds:[[[-0.10,0.76],[-0.08,0.60],[-0.09,0.46]]],
      pts:[[0.03,0.875],[0.13,0.80,'sF'],[0.17,0.63],[0.16,0.48,'hF'],[0.17,0.37,'mF'],[0.12,0.03,'fF'],[0.035,0.03],[0.0,0.23],[-0.035,0.03],[-0.11,0.03,'fB'],[-0.16,0.37,'mB'],[-0.15,0.55],[-0.13,0.72],[-0.11,0.80,'sB'],[-0.03,0.875]]},
    standProfile:{turn:'profile',head:[0.01,0.925],men:false,inner:[[[0.0,0.78],[0.04,0.62],[0.05,0.50]]],hands:[[0.05,0.48]],
      pts:[[0.03,0.875],[0.09,0.81,'sF'],[0.12,0.66],[0.11,0.50],[0.12,0.37,'mF'],[0.08,0.03,'fF'],[-0.02,0.03],[-0.03,0.20],[-0.06,0.03,'fB'],[-0.11,0.03],[-0.13,0.37,'mB'],[-0.12,0.55],[-0.12,0.72],[-0.08,0.81,'sB'],[-0.03,0.875]]},
    walkProfile1:{turn:'profile',head:[0.02,0.925],men:false,inner:[[[0.02,0.78],[-0.04,0.62],[-0.06,0.50]]],hands:[[-0.06,0.48]],
      pts:[[0.04,0.875],[0.10,0.81,'sF'],[0.14,0.65],[0.14,0.50],[0.15,0.38,'mF'],[0.19,0.03,'fF'],[0.09,0.03],[0.02,0.25],[-0.08,0.06,'fB'],[-0.18,0.10],[-0.14,0.38,'mB'],[-0.13,0.55],[-0.12,0.72],[-0.07,0.81,'sB'],[-0.03,0.875]]},
    walkProfile2:{turn:'profile',head:[0.02,0.925],men:false,inner:[[[0.03,0.78],[0.08,0.63],[0.10,0.52]]],hands:[[0.10,0.50]],
      pts:[[0.04,0.875],[0.10,0.81,'sF'],[0.14,0.65],[0.14,0.50],[0.15,0.38,'mF'],[0.13,0.20],[0.12,0.06,'fF'],[0.03,0.05],[-0.02,0.22],[-0.05,0.03,'fB'],[-0.14,0.03],[-0.15,0.38,'mB'],[-0.13,0.55],[-0.12,0.72],[-0.07,0.81,'sB'],[-0.03,0.875]]},
    walk34:{turn:'tq',head:[0.01,0.925],men:true,folds:[[[-0.11,0.76],[-0.09,0.60],[-0.10,0.46]]],
      pts:[[0.03,0.875],[0.13,0.80,'sF'],[0.17,0.64],[0.15,0.50,'hF'],[0.17,0.37,'mF'],[0.17,0.03,'fF'],[0.07,0.03],[0.0,0.23],[-0.06,0.05,'fB'],[-0.15,0.06],[-0.16,0.37,'mB'],[-0.15,0.55],[-0.13,0.72],[-0.11,0.80,'sB'],[-0.03,0.875]]},
    carryPole:{turn:'tq',head:[0.10,0.905],tilt:0.12,men:true,folds:[[[-0.06,0.66],[0.02,0.56],[0.06,0.46]]],
      pts:[[0.12,0.85],[0.20,0.78,'sF'],[0.24,0.70],[0.28,0.82,'hF'],[0.22,0.66],[0.17,0.52],[0.18,0.42,'mF'],[0.16,0.03,'fF'],[0.06,0.03],[0.0,0.26],[-0.07,0.05,'fB'],[-0.16,0.08],[-0.15,0.42,'mB'],[-0.10,0.58],[-0.02,0.74],[0.02,0.80,'sB'],[0.06,0.85]]},
    carrySack:{turn:'tq',head:[0.16,0.86],tilt:0.25,men:true,folds:[[[-0.06,0.62],[0.02,0.52],[0.08,0.44]]],
      pts:[[0.18,0.80],[0.26,0.74,'sF'],[0.27,0.60],[0.25,0.46,'hF'],[0.20,0.40,'mF'],[0.15,0.03,'fF'],[0.05,0.03],[0.0,0.25],[-0.06,0.03,'fB'],[-0.15,0.03],[-0.14,0.40,'mB'],[-0.10,0.56],[-0.02,0.70],[0.06,0.78,'sB'],[0.10,0.82]]},
    leanRail:{turn:'profile',head:[0.22,0.78],tilt:0.1,men:false,folds:[[[-0.10,0.54],[-0.02,0.50],[0.06,0.44]]],
      pts:[[0.24,0.73],[0.30,0.66,'sF'],[0.40,0.60,'hF'],[0.36,0.55],[0.24,0.52],[0.14,0.44],[0.10,0.36,'mF'],[0.06,0.03,'fF'],[-0.03,0.03],[-0.06,0.20],[-0.09,0.03,'fB'],[-0.17,0.03],[-0.20,0.38,'mB'],[-0.12,0.56],[0.02,0.68],[0.14,0.75,'sB'],[0.18,0.77]]},
    sit:{turn:'tq',head:[0.04,0.745],tilt:0.05,men:true,
      pts:[[0.06,0.69],[0.14,0.63,'sF'],[0.17,0.50],[0.24,0.40,'hF'],[0.29,0.36,'mF'],[0.27,0.03,'fF'],[0.17,0.03],[0.17,0.30],[0.10,0.30],[0.13,0.03,'fB'],[0.06,0.03],[0.02,0.31],[-0.04,0.34],[-0.12,0.36,'mB'],[-0.14,0.50],[-0.11,0.62,'sB'],[-0.02,0.69]]},
    sitDangle:{turn:'tq',head:[0.04,0.60],tilt:0.15,men:true,
      pts:[[0.06,0.55],[0.14,0.49,'sF'],[0.19,0.36],[0.22,0.22,'hF'],[0.24,0.08,'mF'],[0.22,-0.30,'fF'],[0.13,-0.32],[0.12,0.0],[0.08,-0.28,'fB'],[0.0,-0.30],[0.0,0.02],[-0.10,0.03,'mB'],[-0.14,0.20],[-0.14,0.36],[-0.11,0.48,'sB'],[-0.02,0.55]]},
    squat:{turn:'tq',head:[0.08,0.56],tilt:0.12,men:false,folds:[[[-0.08,0.40],[-0.04,0.30],[0.02,0.20]]],
      pts:[[0.09,0.50],[0.16,0.45,'sF'],[0.22,0.36],[0.28,0.32,'hF'],[0.33,0.24,'mF'],[0.29,0.03,'fF'],[0.19,0.03],[0.18,0.12],[0.12,0.03,'fB'],[0.04,0.10],[-0.02,0.12,'mB'],[-0.12,0.20],[-0.14,0.34],[-0.08,0.45,'sB'],[0.0,0.50]]},
    reachOut:{turn:'tq',head:[0.01,0.925],men:true,folds:[[[-0.10,0.76],[-0.08,0.60],[-0.09,0.46]]],
      pts:[[0.03,0.875],[0.13,0.80,'sF'],[0.24,0.74],[0.36,0.70,'hF'],[0.33,0.64],[0.20,0.62],[0.18,0.50],[0.19,0.37,'mF'],[0.13,0.03,'fF'],[0.04,0.03],[0.0,0.23],[-0.04,0.03],[-0.12,0.03,'fB'],[-0.17,0.37,'mB'],[-0.16,0.55],[-0.13,0.72],[-0.10,0.80,'sB'],[-0.03,0.875]]},
    holdTwo:{turn:'tq',head:[0.03,0.915],tilt:0.15,men:true,inner:[[[0.17,0.60],[0.08,0.56],[0.0,0.55]],[[-0.16,0.60],[-0.08,0.56],[-0.01,0.55]]],hands:[[0.02,0.55]],
      pts:[[0.03,0.87],[0.13,0.80,'sF'],[0.16,0.66],[0.14,0.57,'hF'],[0.17,0.44],[0.17,0.38,'mF'],[0.12,0.03,'fF'],[0.035,0.03],[0.0,0.23],[-0.035,0.03],[-0.12,0.03,'fB'],[-0.17,0.38,'mB'],[-0.17,0.44],[-0.14,0.57,'hB'],[-0.16,0.66],[-0.13,0.80,'sB'],[-0.03,0.87]]},
    lookBack:{turn:'profile',look:'back',head:[0.0,0.925],men:false,inner:[[[0.02,0.78],[0.06,0.64],[0.08,0.52]]],hands:[[0.08,0.50]],
      pts:[[0.03,0.875],[0.11,0.80,'sF'],[0.14,0.64],[0.13,0.50],[0.15,0.38,'mF'],[0.17,0.03,'fF'],[0.07,0.03],[0.01,0.24],[-0.07,0.05,'fB'],[-0.16,0.08],[-0.15,0.38,'mB'],[-0.16,0.55],[-0.26,0.72,'hB'],[-0.22,0.78,'aE'],[-0.14,0.81,'sB'],[-0.03,0.875]]},
    push:{turn:'tq',head:[0.14,0.88],tilt:0.15,men:true,folds:[[[-0.10,0.50],[-0.02,0.60],[0.04,0.70]]],
      pts:[[0.14,0.84],[0.22,0.77,'sF'],[0.32,0.62],[0.38,0.52,'hF'],[0.32,0.48],[0.24,0.44],[0.20,0.38,'mF'],[0.18,0.03,'fF'],[0.08,0.03],[0.01,0.25],[-0.08,0.05,'fB'],[-0.18,0.10],[-0.15,0.40,'mB'],[-0.08,0.58],[0.0,0.72],[0.06,0.80,'sB'],[0.08,0.85]]},
    recoil:{turn:'tq',head:[-0.06,0.915],tilt:-0.1,men:true,folds:[[[-0.15,0.38],[-0.10,0.55],[-0.02,0.68]]],
      pts:[[-0.03,0.87],[0.08,0.81,'sF'],[0.16,0.72],[0.20,0.78,'hF'],[0.13,0.66],[0.12,0.52],[0.14,0.38,'mF'],[0.13,0.05,'fF'],[0.05,0.04],[-0.02,0.25],[-0.07,0.03,'fB'],[-0.17,0.03],[-0.20,0.38,'mB'],[-0.20,0.55],[-0.18,0.72],[-0.14,0.81,'sB'],[-0.09,0.87]]},
    rider:{turn:'tq',head:[0.06,0.90],tilt:0.15,men:true,folds:[[[-0.12,0.50],[-0.06,0.62],[0.02,0.72]]],
      pts:[[0.08,0.85],[0.15,0.78,'sF'],[0.28,0.70],[0.36,0.66,'hF'],[0.30,0.62],[0.18,0.60,'aE'],[0.20,0.48,'mF'],[0.24,0.40],[0.16,0.20],[0.13,0.03,'fF'],[0.05,0.03,'fB'],[0.06,0.22],[-0.02,0.42],[-0.14,0.45,'mB'],[-0.16,0.62],[-0.10,0.78,'sB'],[-0.02,0.85]]},
    child:{turn:'tq',head:[0.0,0.89],r:0.085,men:true,
      pts:[[0.04,0.83],[0.14,0.76,'sF'],[0.22,0.62],[0.20,0.52,'hF'],[0.17,0.42,'mF'],[0.13,0.03,'fF'],[0.04,0.03],[0.0,0.24],[-0.04,0.03],[-0.13,0.03,'fB'],[-0.17,0.42,'mB'],[-0.19,0.60],[-0.24,0.95,'hB'],[-0.19,0.94],[-0.15,0.74],[-0.10,0.78,'sB'],[-0.04,0.83]]},
    robeLong:{turn:'tq',head:[0,0.925],men:true,folds:[[[0.14,0.60],[0.12,0.42],[0.10,0.24]]],
      pts:[[0.03,0.875],[0.13,0.80,'sF'],[0.18,0.62],[0.17,0.52,'hF'],[0.20,0.30],[0.21,0.10,'mF'],[0.13,0.04,'fF'],[0.0,0.09],[-0.11,0.04,'fB'],[-0.20,0.10,'mB'],[-0.19,0.30],[-0.17,0.52,'hB'],[-0.18,0.62],[-0.13,0.80,'sB'],[-0.03,0.875]]},
    robeShort:{turn:'tq',head:[0,0.925],men:true,folds:[[[-0.09,0.76],[-0.07,0.62],[-0.08,0.52]]],
      pts:[[0.03,0.875],[0.13,0.80,'sF'],[0.17,0.62],[0.15,0.50,'hF'],[0.16,0.45,'mF'],[0.12,0.03,'fF'],[0.04,0.03],[0.0,0.28],[-0.04,0.03],[-0.11,0.03,'fB'],[-0.15,0.45,'mB'],[-0.14,0.60],[-0.12,0.74],[-0.10,0.80,'sB'],[-0.03,0.875]]},
    umbrella:{turn:'tq',head:[0,0.925],men:true,
      pts:[[0.03,0.875],[0.13,0.80,'sF'],[0.23,0.70],[0.19,0.80,'hF'],[0.14,0.70],[0.18,0.52],[0.19,0.38,'mF'],[0.12,0.03,'fF'],[0.035,0.03],[0.0,0.23],[-0.04,0.03],[-0.12,0.03,'fB'],[-0.19,0.38,'mB'],[-0.17,0.48,'hB'],[-0.18,0.62],[-0.13,0.80,'sB'],[-0.03,0.875]]},
    phone:{turn:'tq',head:[0.06,0.90],tilt:0.4,men:true,inner:[[[0.21,0.66],[0.17,0.75]]],hands:[[0.17,0.75]],
      pts:[[0.05,0.86],[0.15,0.79,'sF'],[0.21,0.66],[0.19,0.55],[0.20,0.40,'mF'],[0.12,0.03,'fF'],[0.035,0.03],[0.0,0.24],[-0.04,0.03],[-0.11,0.03,'fB'],[-0.17,0.40,'mB'],[-0.16,0.55,'hB'],[-0.14,0.72],[-0.10,0.80,'sB'],[-0.03,0.86]]},
    eatStanding:{turn:'tq',head:[0.04,0.905],tilt:0.3,men:true,inner:[[[0.20,0.66],[0.12,0.76]],[[-0.18,0.66],[-0.06,0.76]]],hands:[[0.12,0.76],[-0.04,0.76]],
      pts:[[0.04,0.86],[0.15,0.79,'sF'],[0.22,0.66],[0.19,0.52],[0.20,0.40,'mF'],[0.12,0.03,'fF'],[0.035,0.03],[0.0,0.24],[-0.04,0.03],[-0.11,0.03,'fB'],[-0.18,0.40,'mB'],[-0.17,0.52],[-0.20,0.66],[-0.13,0.79,'sB'],[-0.03,0.86]]},
    point:{turn:'tq',head:[0.01,0.925],tilt:-0.15,men:true,
      pts:[[0.03,0.875],[0.13,0.80,'sF'],[0.26,0.90],[0.40,1.04,'hF'],[0.35,0.95],[0.17,0.74],[0.19,0.55],[0.20,0.38,'mF'],[0.12,0.03,'fF'],[0.035,0.03],[0.0,0.23],[-0.04,0.03],[-0.12,0.03,'fB'],[-0.18,0.38,'mB'],[-0.17,0.50,'hB'],[-0.18,0.64],[-0.13,0.80,'sB'],[-0.03,0.875]]},
    kneel:{turn:'tq',head:[0.02,0.76],tilt:0.1,men:true,
      pts:[[0.03,0.71],[0.12,0.65,'sF'],[0.18,0.52],[0.22,0.42,'hF'],[0.28,0.36,'mF'],[0.26,0.03,'fF'],[0.16,0.03],[0.15,0.22],[0.03,0.25],[-0.07,0.03,'fB'],[-0.17,0.05],[-0.16,0.20],[-0.14,0.40,'mB'],[-0.12,0.58],[-0.10,0.66,'sB'],[-0.03,0.71]]},
    grab:{turn:'tq',head:[-0.08,0.915],tilt:0.05,men:true,folds:[[[-0.18,0.42],[-0.12,0.56],[-0.04,0.68]]],arm2:[[-0.15,0.80],[-0.10,0.95],[-0.05,1.06,'hB'],[-0.02,1.04],[-0.04,0.94],[-0.08,0.81]],
      // round 10: the arm at rest is half-bent and thick at the upper arm (elbow on both edges); the handlebar contact stretches it
      pts:[[-0.05,0.87],[0.06,0.82,'sF'],[0.16,0.80],[0.24,0.76],[0.33,0.72,'hF'],[0.32,0.65],[0.23,0.66],[0.15,0.63,'aE'],[0.14,0.50],[0.16,0.38,'mF'],[0.20,0.03,'fF'],[0.10,0.03],[0.02,0.24],[-0.05,0.05,'fB'],[-0.13,0.18],[-0.15,0.06],[-0.20,0.38,'mB'],[-0.22,0.55],[-0.20,0.72],[-0.16,0.82,'sB'],[-0.10,0.87]]},
    // round 10 (B9): four more from the original's crowd — a stooped elder (back rounded, head carried forward and low, short steps),
    // a broad 脚夫 (wide shoulders, short jacket, wide stance), a slim youth (narrow, hands in the jacket, long stride), a woman with
    // a bundle held against the chest (long robe, the bundle a bulge of the outline, the arm under it)
    elderStoop:{turn:'tq',head:[0.12,0.84],tilt:0.2,men:true,folds:[[[-0.08,0.66],[-0.04,0.54],[-0.02,0.42]]],
      pts:[[0.13,0.79],[0.21,0.74,'sF'],[0.23,0.60],[0.21,0.48,'hF'],[0.19,0.36,'mF'],[0.12,0.03,'fF'],[0.04,0.03],[0.0,0.22],[-0.03,0.03],[-0.10,0.03,'fB'],[-0.15,0.36,'mB'],[-0.16,0.50],[-0.13,0.66],[-0.06,0.78],[0.01,0.81,'sB'],[0.06,0.81]]},
    porterBroad:{turn:'tq',head:[0.02,0.92],men:true,folds:[[[-0.12,0.74],[-0.10,0.60],[-0.12,0.48]]],
      pts:[[0.04,0.87],[0.18,0.80,'sF'],[0.24,0.64],[0.22,0.50,'hF'],[0.23,0.40,'mF'],[0.17,0.03,'fF'],[0.06,0.03],[0.0,0.22],[-0.06,0.03],[-0.16,0.03,'fB'],[-0.23,0.40,'mB'],[-0.24,0.56],[-0.22,0.70],[-0.17,0.80,'sB'],[-0.04,0.87]]},
    youthSlim:{turn:'tq',head:[0.01,0.93],men:true,
      pts:[[0.03,0.88],[0.10,0.82,'sF'],[0.13,0.66],[0.12,0.52,'hF'],[0.12,0.44,'mF'],[0.13,0.03,'fF'],[0.06,0.03],[0.02,0.24],[-0.04,0.05,'fB'],[-0.11,0.06],[-0.12,0.44,'mB'],[-0.12,0.58],[-0.11,0.72],[-0.09,0.82,'sB'],[-0.03,0.88]]},
    womanBundle:{turn:'tq',head:[0.0,0.925],men:true,inner:[[[0.16,0.49],[0.22,0.57],[0.15,0.67]]],hands:[[0.14,0.60]],
      pts:[[0.03,0.875],[0.12,0.80,'sF'],[0.15,0.68],[0.26,0.66],[0.30,0.58,'hF'],[0.24,0.50],[0.17,0.48],[0.19,0.14,'mF'],[0.12,0.04,'fF'],[0.0,0.09],[-0.10,0.04,'fB'],[-0.18,0.14,'mB'],[-0.17,0.36],[-0.16,0.56],[-0.14,0.72],[-0.11,0.80,'sB'],[-0.03,0.875]]},
    // round 11 (B10 「按挑、提、扶、转身这些具体动作画外轮廓」): four action outlines traced from the original — the shape is the action, not the coat.
    // 挑 tiao: the pole on the near shoulder, the body bent under it (head low and forward), the near arm up gripping the pole ahead of the
    // shoulder, the far arm swinging out behind as a bulge of the back, knees bent, a long stride
    tiao:{turn:'tq',head:[0.15,0.84],tilt:0.3,men:true,folds:[[[-0.04,0.62],[0.04,0.52],[0.08,0.42]]],
      pts:[[0.15,0.79],[0.23,0.74,'sF'],[0.31,0.71],[0.38,0.75],[0.36,0.83],[0.30,0.85,'hF'],[0.26,0.80],[0.26,0.72],[0.24,0.66],[0.20,0.54],[0.21,0.40,'mF'],[0.21,0.03,'fF'],[0.10,0.03],[0.02,0.26],[-0.09,0.06,'fB'],[-0.20,0.10],[-0.17,0.40,'mB'],[-0.20,0.52],[-0.26,0.60,'hB'],[-0.22,0.66],[-0.12,0.66],[-0.05,0.72],[0.02,0.77,'sB'],[0.08,0.79]]},
    // 提 ti: one arm straight down with a load in the hand, that shoulder dropped, the body tilted away from the load (head over the far
    // foot), the far shoulder up, feet apart — the weight of the bag is in the outline's asymmetry
    ti:{turn:'tq',head:[-0.04,0.925],tilt:-0.04,men:true,folds:[[[-0.12,0.72],[-0.10,0.58],[-0.11,0.46]]],
      pts:[[0.02,0.87],[0.13,0.77,'sF'],[0.18,0.62],[0.17,0.50],[0.15,0.41,'hF'],[0.18,0.36,'mF'],[0.14,0.03,'fF'],[0.05,0.03],[0.0,0.22],[-0.05,0.03],[-0.15,0.03,'fB'],[-0.21,0.36,'mB'],[-0.20,0.52],[-0.18,0.66],[-0.14,0.83,'sB'],[-0.04,0.885]]},
    // 扶 fu: the arm out to a rail, a bar or a person, elbow a little bent, the shoulders carried forward over the hand and the weight on it
    // (head forward, the hem swung back), the far leg trailing
    fu:{turn:'tq',head:[0.08,0.915],tilt:0.12,men:true,folds:[[[-0.12,0.52],[-0.06,0.62],[0.0,0.72]]],
      pts:[[0.09,0.86],[0.18,0.79,'sF'],[0.29,0.72],[0.38,0.64],[0.41,0.58,'hF'],[0.36,0.54],[0.28,0.60],[0.20,0.62],[0.17,0.50],[0.16,0.38,'mF'],[0.15,0.03,'fF'],[0.05,0.03],[-0.01,0.24],[-0.08,0.05,'fB'],[-0.18,0.07],[-0.17,0.38,'mB'],[-0.16,0.55],[-0.11,0.72],[-0.07,0.80,'sB'],[0.0,0.86]]},
    // 转身 zhuanshen: feet and hem in profile toward +u, the shoulders turned back (wider than the hem), the head back over the shoulder,
    // the back arm out behind at hip height — the twist is the wide top over the narrow bottom
    zhuanshen:{turn:'tq',look:'back',head:[-0.02,0.925],men:true,inner:[[[0.03,0.78],[0.08,0.64],[0.10,0.52]]],hands:[[0.10,0.50]],
      pts:[[0.03,0.875],[0.16,0.81,'sF'],[0.18,0.66],[0.14,0.52],[0.14,0.40,'mF'],[0.13,0.03,'fF'],[0.04,0.03],[-0.01,0.24],[-0.06,0.03,'fB'],[-0.13,0.03],[-0.14,0.40,'mB'],[-0.16,0.55],[-0.26,0.62,'hB'],[-0.25,0.68],[-0.17,0.71],[-0.16,0.81,'sB'],[-0.03,0.875]]},
    // the same twist pointing: the back arm raised behind as its own sleeve (arm2) instead of out at the hip
    zhuanshenPoint:{turn:'tq',look:'back',head:[-0.02,0.925],men:true,inner:[[[0.03,0.78],[0.08,0.64],[0.10,0.52]]],hands:[[0.10,0.50]],arm2:[[-0.13,0.80],[-0.20,0.90],[-0.28,1.0,'hB'],[-0.24,1.03],[-0.14,0.93],[-0.09,0.83]],
      pts:[[0.03,0.875],[0.16,0.81,'sF'],[0.18,0.66],[0.14,0.52],[0.14,0.40,'mF'],[0.13,0.03,'fF'],[0.04,0.03],[-0.01,0.24],[-0.06,0.03,'fB'],[-0.13,0.03],[-0.14,0.40,'mB'],[-0.16,0.55],[-0.17,0.71],[-0.16,0.81,'sB'],[-0.03,0.875]]}
  };
  var TPL_NAMES=[]; for(var tk in TPL)TPL_NAMES.push(tk);
  function tagIdx(pts){ var a={}; for(var i=0;i<pts.length;i++)if(pts[i][2])a[pts[i][2]]=i; return a; }

  // tplFigure(P,name,o): the template scaled to the figure, deformed by lean (shear of the upper body over the feet) and weight (the mass
  // shifted over the front or back foot), then by contacts — an anchor is moved to its target and its two ring neighbours follow (0.7, 0.35).
  // The outline is one closed primary line; inside only the 门襟 (curved by the lean), the hem line and at most two folds; head as before.
  //   o.lean o.weight (−1..1) · o.hands [front,back] targets · o.feet [front,back] targets · o.hat o.tilt o.look · o.wMul o.hMul
  //   o.legsLift (feet v) · o.small: no folds (h·sc < 36)
  function tplFigure(P,name,o){ var T=TPL[name], o=o||{}, sw=(P.vw||1)*(o.wMul||1), hm=o.hMul||1, n=T.pts.length, pts=[], i, j, tags=tagIdx(T.pts);
    var lean=(o.lean||0)+(P.vl||0), wt=o.weight||0, small=P.h*P.sc<36, vh=P.vh||1, vs=P.vs||0;
    // round 10 (B9 「衣套同形感」): no two neighbours share a silhouette — the template's width ×0.85–1.15, the hem (and the stance under
    // it) ×0.8–1.2 fading out above v 0.62, the shoulders dropped or squared by ±0.02–0.03, the lean ±0.025, all rolled per figure
    function warp(q){ var v=q[1]*hm, hf=1+(vh-1)*Math.min(1,Math.max(0,(0.62-v)/0.25)), u=q[0]*sw*hf+lean*Math.max(0,v-0.3)/0.7+wt*0.045*Math.min(1,Math.max(0,v/0.45)); return [u,v]; }
    for(i=0;i<n;i++){ var q=warp(T.pts[i]); pts.push([q[0]+P.r(-0.005,0.005),q[1]+P.r(-0.004,0.004)]); }
    if(tags.sF!==undefined){ pts[tags.sF][1]-=vs; if(tags.sF+1<n)pts[tags.sF+1][1]-=vs*0.5; }
    if(tags.sB!==undefined){ pts[tags.sB][1]-=vs; if(tags.sB>0)pts[tags.sB-1][1]-=vs*0.5; }
    var hr=T.r||0.065, hc=warp(T.head); hc[0]+=o.headU||0; hc[1]+=o.headV||0;
    var arm2=null; if(T.arm2){ arm2=[]; for(i=0;i<T.arm2.length;i++)arm2.push(warp(T.arm2[i])); }
    // round 11 (B10 「受力形」, o.bones): the outline is wrapped round a chain solved from the contact outward — hand → shoulder → hip →
    // planted foot, given in the pose frame by the group. Every template point rides on the bone it belongs to (the arm: the ring from the
    // shoulder to the arm's end tag aE; the torso: the mass above the hem; the legs: below it, by side, blending into the torso through the
    // hip) and is re-expressed in the moved bone's frame — along the bone scaled to its new length, across it unchanged — so the traced
    // silhouette keeps its rounded mass but its shape is the pull. Folds then run along the chain, not the template's own.
    var B=o.bones, skin=null, chainFolds=null;
    if(B&&tags.mF!==undefined&&tags.mB!==undefined&&tags.fF!==undefined&&tags.fB!==undefined){
      var hTag=B.handTag||'hF', si=tags[hTag==='hF'?'sF':'sB'], hi=tags[hTag], ai=tags.aE!==undefined?tags.aE:hi;
      var hipR=[(pts[tags.mF][0]+pts[tags.mB][0])/2,0.5], sR=[pts[si][0],pts[si][1]], hR=[pts[hi][0],pts[hi][1]], fFR=[pts[tags.fF][0],pts[tags.fF][1]], fBR=[pts[tags.fB][0],pts[tags.fB][1]];
      var bone=function(a0,b0,a1,b1){ var d0=[b0[0]-a0[0],b0[1]-a0[1]], L0=Math.sqrt(d0[0]*d0[0]+d0[1]*d0[1])||1e-6, d1=[b1[0]-a1[0],b1[1]-a1[1]], L1=Math.sqrt(d1[0]*d1[0]+d1[1]*d1[1])||1e-6;
        var e0=[d0[0]/L0,d0[1]/L0], e1=[d1[0]/L1,d1[1]/L1];
        return function(p){ var t=((p[0]-a0[0])*e0[0]+(p[1]-a0[1])*e0[1])/L0, k=-(p[0]-a0[0])*e0[1]+(p[1]-a0[1])*e0[0]; return [a1[0]+t*L1*e1[0]-k*e1[1],a1[1]+t*L1*e1[1]+k*e1[0]]; }; };
      var TA=bone(sR,hR,B.shoulder,B.hand), TT=bone(hipR,sR,B.hip,B.shoulder), TF=bone(hipR,fFR,B.hip,B.fF), TB=bone(hipR,fBR,B.hip,B.fB);
      var inArm=function(k){ return hTag==='hF'?(k>si&&k<=ai):(k>=ai&&k<si); };
      skin=function(p,k){ var wA=0, wT=0, wF=0, wB=0;
        if(k!==undefined&&k===si){ wA=0.35; wT=0.65; }
        else if(k!==undefined&&inArm(k)){ wA=(k===si+1||k===si-1)?0.6:(k===ai?0.5:1); wT=1-wA; }
        else { var t=Math.min(1,Math.max(0,(p[1]-0.22)/0.25)); wT=t; if(p[0]>hipR[0])wF=1-t; else wB=1-t; }
        var q=[0,0], r; if(wA>0){ r=TA(p); q[0]+=r[0]*wA; q[1]+=r[1]*wA; } if(wT>0){ r=TT(p); q[0]+=r[0]*wT; q[1]+=r[1]*wT; }
        if(wF>0){ r=TF(p); q[0]+=r[0]*wF; q[1]+=r[1]*wF; } if(wB>0){ r=TB(p); q[0]+=r[0]*wB; q[1]+=r[1]*wB; } return q; };
      var src=pts; pts=[]; for(i=0;i<n;i++)pts.push(skin(src[i],i));
      hc=TT(hc); if(arm2)for(i=0;i<arm2.length;i++)arm2[i]=TT(arm2[i]);
      // folds along the chain: one across the torso from the arm's root toward the far hip (the strut of the pull), one from the hip down
      // the planted leg; both offset inside the outline, tapering (foldT)
      var tb=[B.shoulder[0]-B.hip[0],B.shoulder[1]-B.hip[1]], tl=Math.sqrt(tb[0]*tb[0]+tb[1]*tb[1])||1e-6, tn=[-tb[1]/tl,tb[0]/tl];
      if((tn[0]*(B.hand[0]-B.shoulder[0])+tn[1]*(B.hand[1]-B.shoulder[1]))<0){ tn[0]=-tn[0]; tn[1]=-tn[1]; }
      var pf=B.planted==='fB'?B.fB:B.fF, lb=[pf[0]-B.hip[0],pf[1]-B.hip[1]], ll=Math.sqrt(lb[0]*lb[0]+lb[1]*lb[1])||1e-6, ln=[-lb[1]/ll,lb[0]/ll]; if(ln[0]*(hipR[0]-pf[0])<0){ ln[0]=-ln[0]; ln[1]=-ln[1]; }
      chainFolds=[[[B.shoulder[0]-tb[0]*0.22+tn[0]*0.05,B.shoulder[1]-tb[1]*0.22+tn[1]*0.05],[B.shoulder[0]-tb[0]*0.55-tn[0]*0.01,B.shoulder[1]-tb[1]*0.55-tn[1]*0.01],[B.hip[0]+tb[0]*0.12-tn[0]*0.08,B.hip[1]+tb[1]*0.12-tn[1]*0.08]],
        [[B.hip[0]+lb[0]*0.12+ln[0]*0.035,B.hip[1]+lb[1]*0.12+ln[1]*0.035],[B.hip[0]+lb[0]*0.36+ln[0]*0.045,B.hip[1]+lb[1]*0.36+ln[1]*0.045],[B.hip[0]+lb[0]*0.62+ln[0]*0.03,B.hip[1]+lb[1]*0.62+ln[1]*0.03]]]; }
    function pull(arr,idx,target){ if(idx===undefined||!target)return; var m=arr.length, d=[target[0]-arr[idx][0],target[1]-arr[idx][1]], W=[1,0.7,0.35];
      for(var k=-2;k<=2;k++){ var jj=((idx+k)%m+m)%m, w=W[Math.abs(k)]; arr[jj][0]+=d[0]*w; arr[jj][1]+=d[1]*w; } }
    var hands=o.hands||[], feet=o.feet||[];
    if(skin){ hands=(arm2&&tags.hB===undefined)?[null,hands[1]||null]:[]; feet=[]; }
    // round 10 (B9 tell 2, o.chain): the pull on a hand propagates through the body before the hand ring is placed — the whole upper
    // body above v 0.3 follows, rising to 0.4 of the displacement at the shoulders (the head with them), the far hip braces 0.15 against
    // it and the near foot braces further along the pull (when the group does not fix that foot) — the outline is re-solved, not the hand
    function chain(hTag,target,hipTag,fTag,fGiven){ var idx=tags[hTag]; if(idx===undefined||!target)return; var d=[target[0]-pts[idx][0],target[1]-pts[idx][1]];
      if(Math.abs(d[0])+Math.abs(d[1])<0.02)return; var k;
      for(k=0;k<n;k++){ var w=0.4*Math.min(1,Math.max(0,(pts[k][1]-0.3)/0.45)); pts[k][0]+=d[0]*w; pts[k][1]+=d[1]*w*0.5; }
      hc[0]+=d[0]*0.4; hc[1]+=d[1]*0.2; if(arm2)for(k=0;k<arm2.length;k++){ arm2[k][0]+=d[0]*0.4; arm2[k][1]+=d[1]*0.2; }
      var hp=tags[hipTag]; if(hp!==undefined)pull(pts,hp,[pts[hp][0]-d[0]*0.15,pts[hp][1]]);
      var ft=tags[fTag]; if(ft!==undefined&&!fGiven)pull(pts,ft,[pts[ft][0]+d[0]*0.3,pts[ft][1]]);
      // the stretched sleeve is not a rod: its upper edge sags at the elbow under the pull, the lower edge a little less
      var sag=0.02+0.15*Math.abs(d[0]), up=hTag==='hF'?idx-1:idx+1, lo=hTag==='hF'?idx+1:idx-1; if(up>=0&&up<n)pts[up][1]-=sag; if(lo>=0&&lo<n)pts[lo][1]-=sag*0.5; }
    if(o.chain&&!skin){ chain('hF',hands[0],'mB','fF',!!feet[0]); chain('hB',hands[1],'mF','fB',!!feet[1]); }
    pull(pts,tags.hF,hands[0]); if(tags.hB!==undefined)pull(pts,tags.hB,hands[1]); else if(arm2)pull(arm2,tagIdx(T.arm2).hB,hands[1]);
    pull(pts,tags.fF,feet[0]); pull(pts,tags.fB,feet[1]);
    // the head: sits over the shoulders as the template says; a contact that moved the shoulders moves it too
    var sF=pts[tags.sF], sB=pts[tags.sB], hat=o.hat||'cap', tilt=(o.tilt!==undefined?o.tilt:(T.tilt||0)), look=o.look||T.look||T.turn;
    var headDisc=discPoly(hc,hr*1.05);
    head(P,hc[0],hc[1],hat,tilt,look);
    // the outline: one closed line, the run under the head dropped
    var loop=pts.slice(); loop.push([pts[0][0],pts[0][1]]);
    var cutV=o.cutV!==undefined?o.cutV:-9;
    var rs=cutRuns(loop,function(u,v){ return pip(headDisc,u,v)||v<cutV; }); for(i=0;i<rs.length;i++)P.m('body',rs[i]);
    if(arm2){ var a2=arm2.slice(); a2.push([arm2[0][0],arm2[0][1]]); var r2=cutRuns(a2,function(u,v){ return pip(headDisc,u,v)||pip(pts,u,v); }); for(i=0;i<r2.length;i++)P.m('body',r2[i]); P.solid(arm2); }
    // inside: 门襟 collar → hem, bowed by the lean; the hem line between the hem corners (only where a hem crosses the legs); ≤ 2 folds
    var mF=pts[tags.mF], mB=pts[tags.mB], hemV=(mF[1]+mB[1])/2;
    if(T.men&&mF&&mB&&hemV>cutV&&P.r(0,1)<0.75){ var c0=[pts[0][0]*0.5+pts[n-1][0]*0.5+0.015*sw,pts[0][1]-0.02], hu=mF[0]*0.62+mB[0]*0.38, mu=(c0[0]+hu)/2+0.02*sw+lean*0.04;
      P.m('div',[c0,[mu,(c0[1]+hemV)/2],[hu,hemV+0.006]]); }
    if(mF&&mB&&hemV>0.2&&hemV<0.6&&hemV>cutV&&name!=='rider'){ var dip=0.018+P.r(0,0.01), du=mB[0]-mF[0], dv=mB[1]-mF[1];
      P.m('div',[[mF[0]+du*0.06,mF[1]+dv*0.06-dip*0.4],[mF[0]+du*0.35,mF[1]+dv*0.35-dip],[mF[0]+du*0.68,mF[1]+dv*0.68-dip],[mF[0]+du*0.95,mF[1]+dv*0.95-dip*0.35]]); }
    function wp(q){ var w=warp(q); return skin?skin(w):w; }
    if(T.inner)for(i=0;i<T.inner.length;i++){ var il=[]; for(j=0;j<T.inner[i].length;j++)il.push(wp(T.inner[i][j])); P.m('div',il); }
    if(chainFolds){ if(!small)for(i=0;i<chainFolds.length;i++)P.m('foldT',chainFolds[i]); }
    else if(T.folds&&!small)for(i=0;i<T.folds.length;i++){ var fl=[]; for(j=0;j<T.folds[i].length;j++){ var w=warp(T.folds[i][j]); fl.push([w[0]+P.r(-0.006,0.006),w[1]]); } P.m('foldT',fl); }
    // feet: two short marks on the ground line (a lifted foot keeps its mark under the toe)
    function shoe(f){ if(!f)return; var lift=f[1]>0.05?f[1]-0.03:0; P.m('shoe',[[f[0]-0.03,0.008+lift],[f[0]+0.05,0.003+lift]]);
      P.ink([[f[0]-0.035,lift+0.0],[f[0]+0.055,lift+0.0],[f[0]+0.05,lift+0.028],[f[0]-0.02,lift+0.026]],0.8); } // round 10 (D-19): the shoe a dark mass
    var fFp=tags.fF!==undefined?pts[tags.fF]:null, fBp=tags.fB!==undefined?pts[tags.fB]:null;
    if(cutV<0){ shoe(fFp); if(fBp&&(!fFp||Math.abs(fBp[0]-fFp[0])>0.04||name==='sit'))shoe(fBp); }
    // hands (赭石 dab), solids, tint region
    if(tags.hF!==undefined)P.hands.push(P.map(pts[tags.hF])); if(tags.hB!==undefined)P.hands.push(P.map(pts[tags.hB]));
    if(arm2)P.hands.push(P.map(arm2[tagIdx(T.arm2).hB]));
    if(T.hands)for(i=0;i<T.hands.length;i++)P.hands.push(P.map(wp(T.hands[i])));
    var sol=pts; if(cutV>0){ sol=[]; for(i=0;i<n;i++)sol.push([pts[i][0],Math.max(cutV,pts[i][1])]); }
    var occ=[sol,headDisc]; if(arm2)occ.push(arm2); P.robes.push(P.solid(sol));
    return {sv:sF[1]+0.02,hw:0.13*sw,sF:sF,sB:sB,L:lean,turn:T.turn,occ:occ,head:hc,hem:hemV,fF:fFp?fFp[0]:0.1,fB:fBp?fBp[0]:-0.1,pts:pts,hF:tags.hF!==undefined?pts[tags.hF]:null}; }
  // the pose engine's arm/foot options → template contacts. armF/armB angles are ignored (the template's arm stands); reachF/reachB
  // move the hand anchor; fF/fB (a stride the pose set) move the feet; wt sets the weight, lean the shear.
  function tplPerson(P,o){ var hands=[o.reachF?[o.reachF[0],o.reachF[1]]:null,o.reachB?[o.reachB[0],o.reachB[1]]:null], feet=[null,null];
    if(o.fF!==undefined)feet[0]=[o.fF,o.raiseF||0]; if(o.fB!==undefined)feet[1]=[o.fB,o.raiseB||0];
    return tplFigure(P,o.tpl,{lean:o.lean||0,weight:o.wt||0,hands:hands,feet:feet,hat:o.hat,tilt:o.tilt,look:o.look,headU:o.headU,headV:o.headV,wMul:o.hwMul,cutV:o.legs==='skip'?(o.hem||0.47)-0.02:undefined}); }

  // a whole standing/walking person; every option has a varied default. Signature and options unchanged (round 3 record in figure.md);
  // round 5: the drawing goes through figure() — one closed contour, weight on one leg, pelvis rolled up on that side, far limbs dropped.
  function person(P,o){ o=o||{}; if(o.tpl&&TPL[o.tpl])return tplPerson(P,o); // round 9: every pose names a template; the skeleton below is the fallback
    var gn=o.garment||'coat';
    if(gn==='coat'&&o.hem===undefined&&P.r(0,1)<0.3)gn=P.pick(['longcoat','skirt']); else if(gn==='jacket'&&o.hem===undefined&&P.r(0,1)<0.2)gn='skirt';
    var g=GARM[gn], turn=o.turn||P.turn, tw=turn==='front'?1:turn==='tq'?0.84:0.65, sv=(o.sv||0.80)+P.r(-0.012,0.012), hw=0.14*P.sw*(o.hwMul||1)*tw, L=o.lean||0;
    var hem=o.hem!==undefined?o.hem:g.hem+P.r(-0.03,0.03), hb=g.hb*P.r(0.9,1.1)*(turn==='profile'?0.8:1), wa=g.wa*P.r(0.92,1.08)*(turn==='profile'?0.8:1), st=P.st*(o.stMul||1);
    var fF=o.fF!==undefined?o.fF:0.055*st, fB=o.fB!==undefined?o.fB:-0.055*st, wt=o.wt!==undefined?o.wt:P.wt, far=turn==='front'?0:P.r(0.008,0.014);
    // round 6: the weight chain — the pelvis sits over the planted foot (0.55–0.7 of the way) and the spine leans from there, so the
    // hem, pelvis, chest and head are one line over that foot; the head lands within 0.15 h of it. HP = the flesh hip half-width.
    var hip=(wt>0?fF:fB)*P.r(0.55,0.7), ax=function(v){ return L*v+hip; }, HP=P.r(0.10,0.12)*(turn==='profile'?0.85:1);
    var dv=hw*P.r(0.04,0.075), dF=wt*dv, dB=-wt*dv, hu=L*0.935+hip+(o.headU||0), hv=o.headV||0.935;
    var pv=0.52, pu=L*pv+hip, rot=wt*P.r(0.05,0.1)*(turn==='profile'?0.5:1), tws=(turn==='tq'?0.25:0)*(o.twist!==undefined?o.twist:1);
    var cu=L*sv+hip, cv=sv, sF=[cu+hw*0.7,sv-0.02-dF], sB=[cu-hw*0.7,sv-0.03-dB];
    var R={sv:sv,hw:hw,hem:hem,hb:hb,wa:wa,L:L,fF:fF,fB:fB,turn:turn,sF:sF,sB:sB}, vw=sv-(sv-hem)*0.45, acc=o.noAcc?null:P.acc;
    var AF=null, AB=null, showB=!!o.showB, ao=o.armOpt||{};
    if(o.armF)AF=solveAngles(sF[0],sF[1],o.armF[0],o.armF[1],ao); else if(o.reachF)AF=solveArm(sF[0],sF[1],o.reachF[0],o.reachF[1],o.reachF[2],ao);
    else if(!o.noArm)AF=solveAngles(sF[0],sF[1],P.r(0,0.18),P.r(0.22,0.4),ao);
    var carry=acc==='carry'&&!o.armB&&!o.reachB&&!o.noArm, hc=null;
    if(carry){ AB=solveAngles(sB[0],sB[1],P.r(-0.12,0.0),P.r(0.22,0.3),ao); hc=AB.h; showB=true; }
    else if(o.armB)AB=solveAngles(sB[0],sB[1],o.armB[0],o.armB[1],ao); else if(o.reachB)AB=solveArm(sB[0],sB[1],o.reachB[0],o.reachB[1],o.reachB[2],ao);
    else if(!o.noArm&&turn==='front')AB=solveAngles(sB[0],sB[1],P.r(-0.1,0.08),P.r(0.22,0.3),ao);
    // legs: the supporting leg straight under its hip, the free knee bent forward
    var legs=null; if(o.legs!=='skip'){ var kind=o.legs||g.legs, rf=o.raiseF||0, rb=(o.raiseB||0)+far;
      function leg(f,sup,side){ var hipJ=[pu+side*hb*0.42,pv], kn=[(hipJ[0]+f[0])/2,(pv+f[1])/2]; if(!sup)kn[0]+=0.035+Math.abs(f[0]-hipJ[0])*0.15; return {k:kn,f:f}; }
      legs={kind:kind,F:leg([fF,rf],wt>0,1),B:leg([fB,rb],wt<0,-1)}; }
    var S={turn:turn,chest:[cu,cv],hw:hw,dF:dF,dB:dB,tws:tws,pelvis:[pu,pv],rot:rot,ws:wt>0?1:-1,hem:hem,hb:hb,wa:wa,hip:HP,hemU:ax(hem),g:g,
      head:{c:[hu,hv],tilt:o.tilt||0,look:o.look||turn,hat:o.hat||'cap'},armF:AF,armB:AB,showB:showB,legs:legs,noHem:o.noHem,belt:g.belt&&P.r(0,1)<0.7,stoop:(o.tilt||0)>0.2};
    var i0=P.marks.length, Fg=figure(P,S); R.sF=Fg.sF; R.sB=Fg.sB; R.occ=Fg.occ;
    if(acc==='backpack'){ var bp=[[-hw*0.9+cu,sv-0.03],[-hw*1.5+ax(sv-0.1),sv-0.1],[-hw*1.55+ax(sv-0.3),sv-0.3],[-hw*0.95+ax(sv-0.34),sv-0.34]];
      P.m('prop',bp); P.solid(bp.concat([[-hw*0.9+ax(sv-0.2),sv-0.2]])); P.m('thin',[[hw*0.55+cu,sv-0.01],[hw*0.3+ax(sv-0.12),sv-0.14]]); }
    if(acc==='bag'){ P.m('thin',[[hw*0.6+cu,sv-0.01],[-wa*0.9+ax(vw+0.05),vw+0.03]]);
      var bg=[[-wa*0.75+ax(vw),vw+0.02],[-wa*1.6+ax(vw),vw],[-wa*1.65+ax(vw-0.13),vw-0.13],[-wa*0.8+ax(vw-0.12),vw-0.12],[-wa*0.75+ax(vw),vw+0.02]]; P.m('prop',bg); P.solid(bg); }
    if(carry&&hc){ var cb=[[hc[0]-0.03,hc[1]-0.02],[hc[0]+0.03,hc[1]-0.02],[hc[0]+0.05,hc[1]-0.14],[hc[0]-0.05,hc[1]-0.14],[hc[0]-0.03,hc[1]-0.02]]; P.m('prop',cb); P.solid(cb); }
    return R; }

  // seated body (stool / pier / mahjong): hip at (hu,hv), thighs forward to the knee, shins to the feet
  function sitter(P,o){ var hv=o.hip, hw=0.12*P.sw, sv=hv+0.27, L=o.lean||0.04, kv=o.knee!==undefined?o.knee:hv+0.01, fv=o.foot!==undefined?o.foot:0.02;
    head(P,L*3+0.02,sv+0.135,o.hat||'cap',o.tilt||0.05);
    shoulders(P,L*2,sv,hw);
    P.m('body',[[hw+L*2,sv-0.01],[hw*0.9+L,sv-0.14],[0.11,hv+0.02],[0.24,kv+0.01]]);
    P.m('body',[[-hw+L*2,sv-0.01],[-hw*1.1+L,sv-0.14],[-0.12,hv+0.04],[-0.1,hv-0.02],[0.06,hv-0.03],[0.2,kv-0.03]]);
    P.m('fold',[[0.03+L*2,sv-0.03],[-0.02+L,sv-0.14],[-0.04,sv-0.25]]);
    P.m('leg',[[0.24,kv+0.01],[0.25,(kv+fv)/2],[0.21,fv]]); P.m('leg',[[0.2,kv-0.03],[0.18,(kv+fv)/2],[0.14,fv]]);
    P.m('shoe',[[0.19,fv-0.006],[0.27,fv-0.012]]); P.m('shoe',[[0.12,fv-0.004],[0.19,fv-0.01]]);
    var poly=[[hw+L*2,sv],[0.11,hv+0.02],[0.26,kv+0.02],[0.24,fv],[0.12,fv],[0.06,hv-0.03],[-0.12,hv-0.02],[-hw+L*2,sv]];
    P.robes.push(P.solid(poly));
    return {sv:sv,hw:hw,sF:[L*2+hw*0.7,sv-0.02],sB:[L*2-hw*0.7,sv-0.03],knee:[0.22,kv]}; }

  function wheel(P,cu,cv,r){ P.m('wheel',ell(cu,cv,r,r,14,P.r(0,1))); P.disc(cu,cv,r*0.85); }
  // round 11: the load of a 提 — a bag hanging from the hand, its handle over the fingers, the body of it beside the leg
  function bag(P,h){ var u=h[0], v=h[1], w=P.r(0.055,0.075), d=P.r(0.16,0.2), b=[[u-w,v-0.02],[u+w,v-0.02],[u+w*1.1,v-d*0.6],[u+w*0.9,v-d],[u-w*0.9,v-d],[u-w*1.1,v-d*0.6],[u-w,v-0.02]];
    P.m('prop',b); P.m('thin',[[u-0.02,v-0.02],[u,v+0.02],[u+0.02,v-0.02]]); P.solid([[u-w,v-0.02],[u+w,v-0.02],[u+w*0.9,v-d],[u-w*0.9,v-d]]); }
  function basket(P,cu,cv,ru,rv){ P.m('prop',ell(cu,cv,ru,rv,8,P.r(-0.15,0.15))); P.solid(ell(cu,cv,ru*0.95,rv*0.95,8)); }

  // ---------------------------------------------------------------- poses (round 9: every pose names its silhouette template; person()
  // with tpl draws that template with the pose's hand/foot contacts, lean and weight; props are laid on it as before)
  // round 10: a pose name draws from three to seven templates, so a row of standers or walkers never repeats one silhouette
  function standTpl(P){ return P.turn==='front'?P.pick(['standFront','standFront','porterBroad']):P.turn==='profile'?P.pick(['standProfile','standProfile','elderStoop']):P.pick(['stand34','robeShort','robeLong','youthSlim','elderStoop','womanBundle','porterBroad','ti','ti']); }
  // round 11 (B10): the poses that are actions draw the action outline — biandan → 挑, porter (and a stander or queuer with a bag) → 提,
  // pushBike / leanRail → 扶, yield / pointing (and half the lookers) → 转身; the 提 gets its bag from the hand
  function withLoad(P,R,tpl){ if(tpl==='ti'&&R&&R.hF)bag(P,R.hF); return R; }
  var POSES={
    stand:function(P){ var tp=standTpl(P); withLoad(P,person(P,{tpl:tp,hat:P.pick(['cap','cap','brim','bald','hood']),lean:P.r(-0.02,0.02)+(tp==='ti'?-0.03:0),wt:P.wt*0.5}),tp); },
    walk1:function(P){ var st=P.st*P.r(0.85,1.25), prof=P.r(0,1)<0.35; person(P,{tpl:prof?P.pick(['walkProfile1','walkProfile1','elderStoop']):P.pick(['walk34','walk34','youthSlim','womanBundle','porterBroad']),hat:P.pick(['cap','cap','brim','hood','bald','bun']),lean:P.r(0.02,0.05),wt:1,
      fF:(prof?0.17:0.15)*st,fB:-(prof?0.1:0.09)*st,raiseB:P.r(0.03,0.06)}); },
    walk2:function(P){ var st=P.st*P.r(0.85,1.25), prof=P.r(0,1)<0.35; person(P,{tpl:prof?'walkProfile2':P.pick(['walk34','youthSlim','womanBundle','elderStoop']),hat:P.pick(['cap','brim','hood','bald','bun']),lean:P.r(0.015,0.04),wt:prof?-1:1,
      fF:(prof?0.12:0.13)*st,fB:-(prof?0.05:0.08)*st,raiseF:prof?P.r(0.04,0.07):0,raiseB:prof?0:P.r(0.02,0.05)}); },
    biandan:function(P){ var st=P.st, L=P.r(0.03,0.06);
      var R=person(P,{tpl:'tiao',hat:P.pick(['brim','cap','hood']),lean:L,wt:1,fF:0.21*st,fB:-0.09*st,raiseB:0.05,tilt:0.3});
      var s=R.sF[0]-0.03, pv=R.sF[1]+0.08, sag=P.r(0.06,0.09);
      P.m('pole',[[s-0.6,pv-sag],[s-0.3,pv-0.01],[s,pv],[s+0.3,pv-0.01],[s+0.6,pv-sag]]);
      var bags=P.prop==='bags'||(P.prop===undefined&&P.r(0,1)<0.4), e=[[s-0.6,pv-sag],[s+0.6,pv-sag]];
      for(var i=0;i<2;i++){ var bu=e[i][0], top=e[i][1];
        if(bags){ var w=P.r(0.09,0.12), hgt=P.r(0.14,0.2), b0=top-0.14;
          P.m('thin',[[bu-0.01,top],[bu-0.04,b0]]); P.m('thin',[[bu+0.01,top],[bu+0.04,b0]]);
          P.m('prop',[[bu-w,b0],[bu-w*1.05,b0-hgt*0.6],[bu-w*0.8,b0-hgt],[bu+w*0.8,b0-hgt],[bu+w*1.05,b0-hgt*0.6],[bu+w,b0],[bu-w,b0]]);
          P.solid([[bu-w,b0],[bu+w,b0],[bu+w,b0-hgt],[bu-w,b0-hgt]]); }
        else { var cv=top-P.r(0.3,0.36), ru=P.r(0.08,0.1), rv=ru*0.72;
          P.m('thin',[[bu,top],[bu-ru*0.7,cv+rv*0.6]]); P.m('thin',[[bu,top],[bu+ru*0.7,cv+rv*0.6]]); basket(P,bu,cv,ru,rv); } } },
    umbrella:function(P){ person(P,{tpl:'umbrella',hat:P.pick(['cap','bun','bald']),lean:P.r(-0.01,0.02),reachF:[0.19,0.79,-1]});
      var cu=0.17, top=P.r(1.2,1.26), rad=P.r(0.34,0.4);
      P.m('pole',[[cu,0.76],[cu+0.005,top-0.03]]);
      P.m('prop',[[cu-rad,1.07],[cu-rad*0.5,top-0.05],[cu,top],[cu+rad*0.5,top-0.05],[cu+rad,1.07]]);
      P.m('prop',[[cu-rad,1.07],[cu-rad*0.5,1.095],[cu,1.1],[cu+rad*0.5,1.095],[cu+rad,1.07]]);
      P.m('thin',[[cu,top-0.01],[cu-rad*0.55,1.09]]); P.m('thin',[[cu,top-0.01],[cu+rad*0.5,1.092]]);
      P.solid([[cu-rad,1.07],[cu-rad*0.5,top-0.05],[cu,top],[cu+rad*0.5,top-0.05],[cu+rad,1.07],[cu,1.1]]); },
    phone:function(P){ person(P,{tpl:'phone',hat:P.pick(['cap','bald','hood','bun']),tilt:P.r(0.3,0.45)});
      P.m('prop',[[0.17,0.79],[0.24,0.755]]); },
    eating:function(P){ person(P,{tpl:'eatStanding',hat:P.pick(['cap','bald','hood','cap','bun']),tilt:P.r(0.22,0.35)});
      P.m('prop',[[0.0,0.79],[0.02,0.73],[0.10,0.715],[0.18,0.73],[0.20,0.79]]); P.m('prop',[[-0.01,0.795],[0.21,0.80]]);
      P.m('thin',[[0.15,0.77],[0.09,0.89]]); P.m('thin',[[0.18,0.775],[0.11,0.895]]);
      P.solid([[-0.01,0.80],[0.21,0.80],[0.18,0.72],[0.02,0.72]]); },
    squat:function(P){ tplFigure(P,'squat',{hat:P.pick(['cap','brim','hood','bald'])}); },
    sitStool:function(P){ tplFigure(P,'sit',{hat:P.pick(['cap','bald','hood','bun'])});
      P.m('prop',[[-0.17,0.32],[-0.02,0.32]]); P.m('prop',[[-0.15,0.32],[-0.16,0.02]]); P.m('prop',[[-0.04,0.32],[-0.03,0.02]]); },
    // sitDangle stays on the round-5 sitter: the 凌波门 students are part of a passage that holds (B8), and the seat-edge contract is theirs
    sitDangle:function(P){ var S=sitter(P,{hip:0.02,knee:0.0,foot:-0.34,hat:P.pick(['cap','bald','bun','tuft']),lean:0.02,tilt:0.15});
      armTo(P,S.sF[0],S.sF[1],0.22,0.05,-1); if(P.r(0,1)<0.6)armTo(P,S.sB[0],S.sB[1],-0.12,0.04,1); },
    pushBike:function(P){ var st=P.st; P.sub(function(P){ person(P,{tpl:'fu',hat:P.pick(['cap','hood','bun','bald']),lean:0.04,wt:1,fF:0.15*st,fB:-0.09*st,raiseB:0.04,reachF:[0.38,0.57,-1]}); },-0.08,0,1,1);
      wheel(P,0.22,0.18,0.17); wheel(P,0.9,0.18,0.17);
      P.m('prop',[[0.22,0.18],[0.34,0.52]]); P.m('prop',[[0.34,0.52],[0.74,0.5]]); P.m('prop',[[0.74,0.5],[0.48,0.2]]); P.m('prop',[[0.48,0.2],[0.22,0.18]]);
      P.m('prop',[[0.74,0.5],[0.9,0.18]]); P.m('prop',[[0.27,0.56],[0.4,0.56]]); P.m('prop',[[0.74,0.5],[0.68,0.58],[0.5,0.6]]);
      P.solid([[0.22,0.18],[0.34,0.52],[0.74,0.5],[0.9,0.18]]); },
    rideEbike:function(P){ var box=P.prop==='box'||(P.prop===undefined&&P.r(0,1)<0.4);
      wheel(P,-0.3,0.15,0.15); wheel(P,0.42,0.15,0.15);
      P.m('prop',[[-0.13,0.23],[0.2,0.23],[0.3,0.44],[0.36,0.62]]); P.m('prop',[[0.28,0.64],[0.42,0.66]]);
      P.m('prop',[[-0.34,0.3],[-0.22,0.42],[-0.06,0.44]]); P.m('prop',[[-0.24,0.44],[-0.08,0.455]]);
      P.solid([[-0.34,0.3],[-0.06,0.44],[0.2,0.23],[0.3,0.44],[0.36,0.62],[0.2,0.6],[-0.13,0.23]]);
      tplFigure(P,'rider',{hat:'helmet',tilt:0.15,hands:[[0.34,0.65]],feet:[[0.12,0.22],null]});
      if(box){ P.m('prop',[[-0.44,0.42],[-0.2,0.42],[-0.2,0.66],[-0.44,0.66],[-0.44,0.42]]); P.solid([[-0.44,0.42],[-0.2,0.42],[-0.2,0.66],[-0.44,0.66]]); } },
    leadChild:function(P){ var st=P.st, cs=P.r(0.5,0.56), mp=[0.22,0.5];
      person(P,{tpl:'stand34',hat:P.pick(['cap','bun','hood','bald']),lean:0.02,wt:1,fF:0.1*st,fB:-0.08*st,tilt:0.12,reachF:[mp[0],mp[1],-1]});
      P.sub(function(P){ person(P,{tpl:'child',hat:'tuft',lean:0.02,wt:1,fF:0.14,fB:-0.1,reachB:[(mp[0]-0.37)/cs,mp[1]/cs,1]}); },0.37,0,cs,1); },
    vendor:function(P){ var hand=P.r(0,1)<0.6, hp=hand?[0.5,0.54]:[0.3,0.5];
      person(P,{tpl:'reachOut',hat:P.pick(['cap','hood','bald','cap']),hem:0.47,legs:'skip',tilt:0.15,lean:hand?0.04:0.0,reachF:[hp[0],hp[1],-1]});
      P.m('pole',[[-0.5,0.47],[0.58,0.462]]); P.m('prop',[[0.32,0.47],[0.33,0.56],[0.52,0.565],[0.53,0.47]]); P.m('prop',[[0.35,0.6],[0.5,0.605]]);
      if(hand){ P.m('prop',[[0.46,0.55],[0.48,0.5],[0.58,0.5],[0.6,0.55]]); P.m('prop',[[0.45,0.555],[0.61,0.555]]); P.solid([[0.46,0.56],[0.6,0.56],[0.58,0.5],[0.48,0.5]]); }
      P.solid([[-0.5,0.45],[0.58,0.45],[0.58,0.48],[-0.5,0.48]]); },
    // the customer: leaning to the counter, hands out at bowl height. Stand 0.72 h from the vendor's x, facing them, so the hands meet at the counter's end
    buy:function(P){ person(P,{tpl:'holdTwo',hat:P.pick(['cap','bald','hood','short','bun']),lean:0.05,wt:1,tilt:0.14,reachF:[0.22,0.55,-1]}); },
    vendorZhaoli:function(P){ person(P,{tpl:'point',hat:P.pick(['cap','hood','cap']),hem:0.47,legs:'skip',tilt:-0.05,reachF:[0.25,0.94,-1]});
      P.m('prop',[[0.25,0.95],[0.42,0.81]]); P.m('prop',[[0.42,0.81],[0.5,0.85],[0.56,0.79],[0.49,0.72],[0.42,0.81]]);
      P.m('pole',[[-0.5,0.47],[0.7,0.462]]); P.m('prop',[[0.36,0.62],[0.38,0.48],[0.62,0.48],[0.64,0.62]]); P.m('prop',[[0.33,0.63],[0.67,0.635]]);
      P.solid([[-0.5,0.45],[0.7,0.45],[0.7,0.48],[-0.5,0.48]]); P.solid([[0.36,0.62],[0.38,0.48],[0.62,0.48],[0.64,0.62]]); },
    poling:function(P){ var st=P.st; person(P,{tpl:'recoil',hat:P.pick(['brim','cap','hood']),lean:-0.05,wt:-1,fF:0.13*st,fB:-0.1*st,reachF:[0.26,0.85,-1]});
      P.m('pole',[[0.36,1.03],[-0.26,-0.25]]); },
    rowing:function(P){ var st=P.st; person(P,{tpl:'push',hat:P.pick(['brim','cap','hood']),lean:0.06,wt:1,fF:0.16*st,fB:-0.1*st,reachF:[0.32,0.5,-1]});
      P.m('pole',[[-0.1,0.76],[0.62,0.3]]); },
    winch:function(P){ var st=P.st; person(P,{tpl:'reachOut',hat:P.pick(['cap','hood','brim']),lean:-0.08,wt:-1,fF:0.18*st,fB:-0.08*st,reachF:[0.3,0.64,1]});
      P.m('thin',[[0.3,0.65],[0.85,0.7]]); },
    porter:function(P){ var R=person(P,{tpl:'ti',hat:P.pick(['brim','cap','hood']),lean:P.r(-0.05,-0.02),wt:-1,tilt:-0.04,fF:0.13*P.st,fB:-0.12*P.st});
      bag(P,[R.hF[0],R.hF[1]-0.01]); },
    pair:function(P){ var ob=P.pick(['phone','phone','bag']), mp=ob==='phone'?[0.0,0.72]:[0.0,0.5], sc=P.r(0.94,1), tp=ob==='phone'?'reachOut':'stand34';
      P.sub(function(P){ person(P,{tpl:tp,hat:P.pick(['cap','bald','hood']),lean:0.05,wt:1,tilt:ob==='phone'?0.25:0.12,reachF:[mp[0]+0.25,mp[1],-1]}); },-0.25,0,1,1);
      P.sub(function(P){ person(P,{tpl:tp,hat:P.pick(['cap','bun','brim']),lean:0.05,wt:1,tilt:ob==='phone'?0.2:0.1,reachF:[0.25/sc,mp[1]/sc,-1]}); },0.25,0,sc,-1);
      if(ob==='phone'){ var ph=[[mp[0]-0.02,mp[1]-0.01],[mp[0]-0.02,mp[1]+0.08],[mp[0]+0.03,mp[1]+0.08],[mp[0]+0.03,mp[1]-0.01],[mp[0]-0.02,mp[1]-0.01]]; P.m('prop',ph); P.solid(ph); }
      else { var bg=[[mp[0]-0.05,mp[1]],[mp[0]+0.05,mp[1]],[mp[0]+0.07,mp[1]-0.15],[mp[0]-0.07,mp[1]-0.15],[mp[0]-0.05,mp[1]]]; P.m('prop',bg); P.solid(bg); P.m('thin',[[mp[0]-0.03,mp[1]],[mp[0],mp[1]+0.03],[mp[0]+0.03,mp[1]]]); } },
    pointing:function(P){ person(P,{tpl:'zhuanshenPoint',hat:P.pick(['cap','brim','bald','hood']),tilt:-0.12,lean:P.r(0,0.03),reachB:[-0.32,1.02,1]}); },
    oldStick:function(P){ person(P,{tpl:P.pick(['robeLong','elderStoop','elderStoop']),hat:P.pick(['cap','bald','hood']),lean:P.r(0.04,0.07),tilt:0.15,reachF:[0.21,0.52,-1]});
      P.m('pole',[[0.2,0.53],[0.27,0.01]]); },
    womanBasket:function(P){ person(P,{tpl:'robeLong',hat:'bun',lean:P.r(0,0.02),reachF:[0.17,0.6,-1]});
      basket(P,0.22,0.55,0.09,0.07); P.m('prop',[[0.14,0.6],[0.22,0.69],[0.3,0.61]]); },
    photographer:function(P){ person(P,{tpl:'eatStanding',hat:P.pick(['cap','brim','bun','bald']),tilt:-0.08});
      P.m('prop',[[0.10,0.75],[0.17,0.75],[0.17,0.81],[0.10,0.81],[0.10,0.75]]); },
    queue:function(P){ var tp=P.pick(['holdTwo','stand34','standProfile','holdTwo','youthSlim','womanBundle','elderStoop','porterBroad','ti','ti','zhuanshen','zhuanshen']);
      withLoad(P,person(P,{tpl:tp,hat:P.pick(['cap','bald','hood','brim','bun']),tilt:tp==='zhuanshen'?-0.05:P.r(0,0.12),lean:tp==='ti'?-0.03:0}),tp); },
    sweeping:function(P){ person(P,{tpl:'push',hat:P.pick(['brim','hood','cap']),lean:0.06,wt:1,fF:0.13*P.st,fB:-0.09*P.st,reachF:[0.3,0.47,-1]});
      P.m('prop',[[0.2,0.63],[0.52,0.06]]); P.m('thin',[[0.5,0.09],[0.43,0.0]]); P.m('thin',[[0.51,0.09],[0.52,0.0]]); P.m('thin',[[0.52,0.09],[0.6,0.01]]); },
    cart:function(P){ var st=P.st; person(P,{tpl:'walk34',hat:P.pick(['brim','hood','cap']),lean:0.14,wt:1,fF:0.18*st,fB:-0.1*st,raiseB:0.05,reachF:[0.14,0.5,-1]});
      P.m('pole',[[0.16,0.49],[-0.56,0.44]]); P.m('pole',[[0.14,0.45],[-0.56,0.4]]);
      P.m('prop',[[-0.56,0.44],[-1.08,0.47],[-1.08,0.36],[-0.56,0.34]]); P.m('prop',[[-0.58,0.46],[-0.72,0.72],[-0.92,0.74],[-1.06,0.48]]);
      wheel(P,-0.82,0.19,0.19); P.solid([[-0.56,0.34],[-0.56,0.46],[-0.72,0.72],[-0.92,0.74],[-1.08,0.47],[-1.08,0.36]]); },
    ferryRail:function(P){ person(P,{tpl:'holdTwo',hat:P.pick(['cap','bun','hood','bald','brim']),lean:0.03,tilt:0.1,reachF:[0.25,0.58,-1]}); },
    leanRail:function(P){ person(P,{tpl:'fu',hat:P.pick(['cap','bun','hood','bald','brim']),hem:0.52,legs:'skip',tilt:0.12,lean:0.05,reachF:[0.40,0.56,-1]}); },
    runChild:function(P){ P.sub(function(P){ person(P,{tpl:'walk34',hat:'tuft',lean:0.08,wt:1,fF:0.22,fB:-0.18,raiseB:0.08}); },0,0,P.r(0.52,0.58),1); },
    tourist:function(P){ person(P,{tpl:'umbrella',hat:P.pick(['brim','cap','bun']),lean:0.02,wt:1,fF:0.09*P.st,fB:-0.06*P.st,reachF:[0.2,0.8,-1]});
      P.m('prop',[[-0.12,0.76],[-0.24,0.72],[-0.26,0.52],[-0.14,0.5]]); P.solid([[-0.1,0.76],[-0.24,0.72],[-0.26,0.52],[-0.1,0.5]]);
      P.m('thin',[[0.2,0.81],[0.27,1.24]]); var f=[[0.27,1.24],[0.42,1.17],[0.27,1.1],[0.27,1.24]]; P.m('prop',f); P.reds.push(P.solid(f)); },
    squatSeller:function(P){ POSES.squat(P); basket(P,0.55,0.08,0.2,0.07); P.m('thin',[[0.42,0.1],[0.47,0.14],[0.52,0.1]]); P.m('thin',[[0.55,0.11],[0.6,0.15],[0.66,0.11]]); },
    dancePair:function(P){ var st=P.st;
      P.sub(function(P){ person(P,{tpl:'point',hat:P.pick(['cap','bun','hood']),lean:0.02,wt:1,fF:0.16*st,fB:-0.12*st,reachF:[0.3,1.02,-1]}); },-0.3,0,1,1);
      P.sub(function(P){ person(P,{tpl:'reachOut',hat:P.pick(['cap','bun','hood']),lean:0.02,wt:1,fF:0.14*st,fB:-0.12*st,reachF:[0.32,0.84,-1]}); },0.3,0,P.r(0.94,1),1); },
    swimmer:function(P){ head(P,0.02,0.06,'swim',0.1); P.m('sleeve',[[0.12,0.02],[0.2,0.06],[0.28,0.0]]);
      var r=P.ballR||0.055, b=ell(-0.24,0.05,r,r,10); P.m('prop',b); P.reds.push(P.solid(ell(-0.24,0.05,r*0.9,r*0.9,10))); },
    // 三轮 rider: two wheels seen in side view (front wheel under the handlebar, the pair of rear wheels as one), a low seat, a bed behind
    sanlun:function(P){ var load=P.r(0,1)<0.6;
      wheel(P,0.62,0.17,0.17); wheel(P,-0.52,0.19,0.19);
      P.m('prop',[[0.62,0.17],[0.55,0.62],[0.62,0.75]]); P.m('prop',[[0.5,0.76],[0.72,0.77]]);
      P.m('prop',[[0.62,0.17],[0.2,0.2],[0.05,0.4],[-0.1,0.4]]); P.m('prop',[[-0.06,0.53],[0.08,0.53]]); P.m('thin',[[0.0,0.53],[0.0,0.41]]);
      P.m('prop',[[-0.14,0.4],[-0.9,0.42],[-0.92,0.64],[-0.16,0.62],[-0.14,0.4]]); P.m('thin',[[-0.14,0.5],[-0.9,0.52]]); P.m('prop',[[-0.9,0.42],[-0.52,0.19]]); P.m('prop',[[-0.14,0.4],[-0.52,0.19]]);
      P.solid([[0.62,0.17],[0.55,0.62],[0.72,0.77],[0.5,0.76],[0.2,0.2],[-0.14,0.4],[-0.9,0.42],[-0.92,0.64],[-0.16,0.62]]);
      if(load){ var lp=[[-0.18,0.62],[-0.24,0.86],[-0.55,0.96],[-0.86,0.88],[-0.9,0.63]]; P.m('prop',lp); P.solid(lp);
        P.m('thin',[[-0.3,0.66],[-0.6,0.92]]); P.m('thin',[[-0.82,0.66],[-0.42,0.9]]); }
      P.sub(function(P){ tplFigure(P,'rider',{hat:P.pick(['brim','cap','bald','short']),tilt:0.2,hands:[[0.47,0.52]],feet:[[0.14,0.03],null]}); },0.10,0.26,0.95,1); },
    // 讨价还价: two facing, both with the hands out to the bag; unequal heights
    bargain:function(P){ var ob=P.pick(['bag','bowl']), mp=[0.01,ob==='bag'?0.56:0.6], sc=P.r(0.88,0.97);
      P.sub(function(P){ person(P,{tpl:'holdTwo',hat:P.pick(['cap','bald','hood','short']),lean:0.06,wt:1,tilt:0.14,reachF:[mp[0]+0.24,mp[1],-1]}); },-0.24,0,1,1);
      P.sub(function(P){ person(P,{tpl:'holdTwo',hat:P.pick(['cap','bun','brim','short']),lean:0.05,wt:1,tilt:0.1,reachF:[(0.25-mp[0])/sc,mp[1]/sc,-1]}); },0.25,0,sc,-1);
      if(ob==='bag'){ var bg=[[mp[0]-0.05,mp[1]-0.01],[mp[0]+0.05,mp[1]-0.01],[mp[0]+0.07,mp[1]-0.16],[mp[0]-0.07,mp[1]-0.16],[mp[0]-0.05,mp[1]-0.01]]; P.m('prop',bg); P.solid(bg); }
      else { P.m('prop',[[mp[0]-0.08,mp[1]],[mp[0]-0.06,mp[1]-0.06],[mp[0]+0.06,mp[1]-0.06],[mp[0]+0.08,mp[1]]]); P.m('prop',[[mp[0]-0.09,mp[1]+0.005],[mp[0]+0.09,mp[1]+0.005]]); P.solid([[mp[0]-0.08,mp[1]],[mp[0]+0.08,mp[1]],[mp[0]+0.06,mp[1]-0.06],[mp[0]-0.06,mp[1]-0.06]]); } },
    // 退: weight back on the rear leg, body leaning away, both arms up between the figure and what comes at it
    recoil:function(P){ person(P,{tpl:'recoil',hat:P.pick(['cap','bald','hood','short','bun']),lean:P.r(-0.06,-0.03),wt:-1,tilt:-0.15,
      fF:0.12*P.st,fB:-0.08*P.st,raiseF:0.03,reachF:[0.25,0.8,-1]}); },
    // 让: side-stepping away (the figure's +u is away from the focus), torso in profile, head turned back over the shoulder, the trailing arm out behind
    yield:function(P){ person(P,{tpl:'zhuanshen',hat:P.pick(['cap','bald','hood','short','bun']),lean:P.r(0.0,0.03),wt:1,tilt:0.02,fF:0.16*P.st,fB:-0.06*P.st,raiseB:0.04}); },
    // 拦: one arm straight out at shoulder height toward the focus, the other up, the shoulders pulled back, the front foot braced
    block:function(P){ person(P,{tpl:'grab',hat:P.pick(['cap','bald','hood','short','brim']),lean:P.r(-0.02,0.02),wt:-1,tilt:0.05,fF:0.17*P.st,fB:-0.07*P.st,reachF:[0.38,0.76,1]}); },
    // 看: feet still and close, body three-quarter, head turned toward the focus at +u
    look:function(P){ var tp=P.pick(['zhuanshen','zhuanshen','zhuanshen','stand34','robeShort','robeLong','youthSlim','womanBundle','porterBroad']);
      person(P,{tpl:tp,hat:P.pick(['cap','bald','hood','short','bun','brim']),lean:P.r(-0.01,0.02),look:tp==='zhuanshen'?'back':'profile',tilt:-0.06}); },
    mahjong:function(P){ tplFigure(P,'sit',{hat:P.pick(['cap','bald','hood','bun']),tilt:0.2,hands:[[0.3,0.46]]});
      P.m('prop',[[-0.17,0.32],[-0.02,0.32]]); P.m('prop',[[-0.15,0.32],[-0.16,0.02]]);
      if(P.table!==false){ P.m('pole',[[0.12,0.43],[0.66,0.425]]); P.m('prop',[[0.6,0.42],[0.61,0.02]]);
        for(var i=0;i<5;i++)P.m('thin',[[0.17+i*0.08,0.455],[0.22+i*0.08,0.455]]); P.solid([[0.12,0.41],[0.66,0.41],[0.66,0.445],[0.12,0.445]]); } }
  };
  // ---------------------------------------------------------------- skeleton bodies (round 4, D-10 tell 2)
  // A body here is not a pose: it is a spine over a weight line, with the limbs solved from where the hands and feet are.
  // Positions are given in the GROUP frame (unit; the group's feet-centre is the origin, +u the group's dir), so several bodies can
  // share exact contact points (a handlebar, a bag, a pole, a rail, a bowl). Each body spends its own ink and width jitter.
  //   feet   [[u,v],[u,v]]  front foot, back foot (v>0 = lifted); wt 0/1 = which foot carries the weight — the pelvis sits over it
  //   lean   forward shift of the chest per unit height above the pelvis; bend = stoop (chest lower, head further forward and down)
  //   twist  −1..1 shoulder bar rotated against the pelvis (the near shoulder comes forward); pu/pelvis override the weight line (a seated rider)
  //   hands  [front, back]: null (the arm hangs), [u,v,bend] a point the hand must reach, {elbow:[u,v],hand:[u,v]} an elbow planted on something
  // Returns the group-frame head centre, shoulder points and hip points so the next body (or a pole) can be built against them.
  function ik2(a,b,L1,L2,side,straight){ var tu=b[0]-a[0], tv=b[1]-a[1], d=Math.sqrt(tu*tu+tv*tv)||1e-6;
    if(straight||d>(L1+L2)*0.985){ L1=L2=d/1.97; }
    var th=Math.atan2(tv,tu), c=(L1*L1+d*d-L2*L2)/(2*L1*d), al=Math.acos(Math.max(-1,Math.min(1,c))), ea=th+side*al;
    return [a[0]+Math.cos(ea)*L1,a[1]+Math.sin(ea)*L1]; }
  function body(P,o){ var fl=o.fl||1, sc=o.sc||1, ox=o.ox||0, oy=o.oy||0, out={role:o.role||''}, m0=P.marks.length, s0=P.solids.length, occ=null;
    function L(g){ return [(g[0]-ox)/(fl*sc),(g[1]-oy)/sc]; }
    P.bw=P.r(0.88,1.12); P.ba=Math.round(P.r(-12,12));
    P.sub(function(P){
      if(o.tpl&&TPL[o.tpl]){ // round 9: the role's silhouette template placed on the group's contact points
        var hd=o.hands||[], ht=[], ft=[o.feet[0]?L(o.feet[0]):null,o.feet[1]?L(o.feet[1]):null], k;
        for(k=0;k<2;k++)ht.push(hd[k]?(hd[k].elbow?L(hd[k].hand):L(hd[k])):null);
        P.vary(); if(o.wMul)P.vw=o.wMul; // round 10: each body of a group rolls its own width, hem, shoulders and lean (a fixed wMul pins the width)
        var bn=null; if(o.bones){ var ob=o.bones; bn={handTag:ob.handTag,planted:ob.planted,hand:L(ob.hand),shoulder:L(ob.shoulder),hip:L(ob.hip),fF:L(ob.fF),fB:L(ob.fB)}; } // round 11: the chain, group frame → pose frame
        var Ft=tplFigure(P,o.tpl,{lean:o.tlean||0,weight:o.tweight!==undefined?o.tweight:(o.wt?-1:1),hands:ht,feet:ft,hat:o.hat,tilt:o.tilt,look:o.look,headU:o.headU,headV:o.headV,chain:o.chain,bones:bn,cutV:o.legs==='skip'?(o.hem||0.47)-0.02:undefined});
        occ=Ft.occ; out.head=P.map(Ft.head); out.sF=P.map(Ft.sF); out.sB=P.map(Ft.sB); out.hipF=P.map([Ft.fF*0.5,0.5]); out.hipB=P.map([Ft.fB*0.5,0.5]); out.chest=P.map([(Ft.sF[0]+Ft.sB[0])/2,Ft.sv-0.06]);
        return; }
      var gn=o.garment||'jacket', g=GARM[gn], turn=o.turn||'tq', tw=turn==='front'?1:turn==='tq'?0.84:0.65;
      var fF=L(o.feet[0]), fB=L(o.feet[1]), wt=o.wt||0, sf=wt?fB:fF, ws=wt?-1:1;
      var pv=o.pelvis!==undefined?o.pelvis:0.52, lean=o.lean||0, bend=o.bend||0, tws=o.twist||0;
      var pu=o.pu!==undefined?L([o.pu,0])[0]:sf[0]*0.8+(o.hipShift||0);
      var cv=pv+0.26-bend*0.06, cu=pu+lean*0.26+bend*0.12;
      var hu=cu+lean*0.13+bend*0.16+(o.headU||0), hv=cv+0.125-bend*0.07+(o.headV||0);
      var hw=0.14*P.sw*tw*(1-Math.abs(tws)*0.2), hb=g.hb*P.r(0.9,1.1)*(turn==='profile'?0.85:1), wa=g.wa*P.r(0.92,1.08)*(turn==='profile'?0.85:1);
      var dv=hw*P.r(0.05,0.08), dF=ws*dv, dB=-ws*dv, tF=tws*0.035, tB=-tws*0.035;
      var sF=[cu+hw*0.75+tF,cv-0.02-dF], sB=[cu-hw*0.75+tB,cv-0.03-dB];
      var hem=o.hem!==undefined?o.hem:g.hem+P.r(-0.02,0.02), lowHem=hem<pv-0.03, hemU=lowHem?pu+(hem-pv)*lean*0.35:pu, wv=pv+0.1, wu=pu+lean*0.1+bend*0.03+ws*0.01+tws*0.02;
      var rot=ws*P.r(0.05,0.1)*(turn==='profile'?0.5:1);
      // arms: the hand goes exactly where it is asked; the bones stretch toward a straight arm if the point is far
      function armOf(s,hd){ if(!hd)return null;
        if(hd.elbow)return {s:[s[0],s[1]],e:L(hd.elbow),h:L(hd.hand)};
        var q=L(hd), du=q[0]-s[0], dq=q[1]-s[1], d=Math.sqrt(du*du+dq*dq), Lb=Math.max(0.17,d/1.78);
        return solveArm(s[0],s[1],q[0],q[1],hd[2]||-1,{L1:Lb,L2:Lb}); }
      var hands=o.hands||[], AF=hands[0]?armOf(sF,hands[0]):(turn==='front'||P.r(0,1)<0.5?solveAngles(sF[0],sF[1],P.r(-0.05,0.1),P.r(0.22,0.32)):solveAngles(sF[0],sF[1],P.r(-0.02,0.08),P.r(0.22,0.3)));
      var AB=hands[1]?armOf(sB,hands[1]):(turn==='front'?solveAngles(sB[0],sB[1],P.r(-0.05,0.1),P.r(0.22,0.32)):null);
      // legs: hips at the pelvis bar; the supporting leg straight because its foot is a full leg away; the free knee toward +u
      var legs=null; if(o.legs!=='skip'){ var hipF=[pu+hb*0.42,pv-0.01], hipB=[pu-hb*0.42,pv-0.01], kF=ik2(hipF,fF,0.27,0.27,1,wt===0), kB=ik2(hipB,fB,0.27,0.27,1,wt===1);
        legs={kind:o.legKind||g.legs,F:{k:kF,f:fF},B:{k:kB,f:fB}}; }
      var S={turn:turn,chest:[cu,cv],hw:hw,dF:dF,dB:dB,tws:tws,pelvis:[pu,pv],rot:rot,ws:ws,hem:hem,hb:hb,wa:wa,hip:P.r(0.10,0.12)*(turn==='profile'?0.85:1),hemU:hemU,waistU:wu,g:g,
        head:{c:[hu,hv],tilt:(o.tilt||0)+bend*0.3,look:o.look||turn,hat:o.hat||'cap'},armF:AF,armB:AB,showB:!!hands[1],legs:legs,noHem:o.noHem,belt:g.belt&&P.r(0,1)<0.6,stoop:bend>0.2};
      var Fg=figure(P,S); occ=Fg.occ;
      out.head=P.map([hu,hv]); out.sF=P.map(Fg.sF); out.sB=P.map(Fg.sB); out.hipF=P.map([pu+hb*0.42,pv]); out.hipB=P.map([pu-hb*0.42,pv]); out.chest=P.map([cu,cv]);
    },ox,oy,sc,fl);
    // occlusion inside the group: a body drawn later stands nearer and cuts the earlier marks it covers; o.behind reverses that —
    // this body's marks are cut by every solid already in the group (a counter, a bike, a nearer body)
    var occG=[], i, j; for(i=0;i<occ.length;i++){ var pg=[]; for(j=0;j<occ[i].length;j++)pg.push(P.map2(occ[i][j],ox,oy,sc,fl)); occG.push(pg); }
    if(o.behind){ var pre=[]; for(i=0;i<s0;i++){ var s=P.solids[i]; pre.push(s.poly?s.poly:discPoly(s.c,s.r)); } clipMarks(P,m0,1e9,pre); }
    else clipMarks(P,0,m0,occG);
    P.bw=1; P.ba=0; out.feet=[o.feet[0]||[ox,0],o.feet[1]||[ox,0]]; out.ox=ox; out.sc=sc; out.fl=fl; P.bodies.push(out); return out; }

  // action groups: one drawing, several bodies, exact shared contact points. Each returns nothing; slots are recorded on P.slots.
  var GROUPS={
    // 逆行电动车: the rider braking (leaning back, one foot down, front wheel turned), a blocker with a hand planted on the handlebar and
    // the weight forward over the front foot, a yielder stepping away with a foot lifted and a hand on the blocker's shoulder, looking back,
    // and a bystander behind the bike with a hand up. All feet and both wheels on the deck line.
    ebike:function(P){ var HB=[0.43,0.68], hat=P.pick(['cap','short','bald','hood','bun']);
      wheel(P,-0.3,0.15,0.15);
      P.m('wheel',ell(0.42,0.15,0.1,0.15,14,0.15)); P.disc(0.42,0.15,0.13);
      P.m('prop',[[-0.13,0.23],[0.2,0.23],[0.3,0.44],[0.37,0.63]]); P.m('prop',[[0.27,0.63],HB]); P.m('prop',[[0.37,0.63],[0.42,0.3]]);
      P.m('prop',[[-0.34,0.3],[-0.22,0.42],[-0.06,0.44]]); P.m('prop',[[-0.24,0.46],[-0.04,0.47]]);
      P.solid([[-0.34,0.3],[-0.06,0.44],[0.2,0.23],[0.3,0.44],[0.37,0.63],[0.2,0.6],[-0.13,0.23]]);
      // round 11 (B10 「把三个人连同车把当成一个受力形重画」): one chain, solved from the bar outward, each joint placed by the one before it and
      // the pull. Rider: hands on the bar, the braking arms straight so the shoulders sit 0.30 behind and above the bar, the hip fixed on the
      // saddle, one foot down. Blocker (facing the bike): hand on the bar; the shoulder 0.30 up the arm's line (the arm a straight strut,
      // 23° above the bar); the hip 0.13 further from the bar and 0.33 down — the torso leans into the bar; the planted foot is the back
      // one, on the strut's line through the hip (the push goes to the ground there), the front foot stepped toward the bike, knee bent.
      // Yielder (facing away, looking back): her trailing hand on the blocker's back shoulder; her shoulder 0.20 along her reach, the hip
      // 0.05 behind it (leaning away), the front foot planted ahead of the hip, the back foot lifted behind. The outlines are the family's
      // rounded masses skinned to these chains (tplFigure o.bones), so the three shapes are three different pulls; folds run along the chains.
      var rS=[HB[0]-0.29,HB[1]+0.12], rH=[-0.02,0.50];
      body(P,{role:'rider',tpl:'rider',tlean:0,tweight:0,wMul:0.92,bones:{hand:HB,shoulder:rS,hip:rH,fF:[0.12,0.02],fB:[0.04,0.03]},ox:0,feet:[[0.12,0],null],wt:0,pu:-0.1,pelvis:0.49,lean:0,twist:0.1,tilt:-0.06,hat:'helmet',garment:'jacket',turn:'tq',
        hands:[[0.34,0.66,-1],null]});
      var bS=[HB[0]+0.28,HB[1]+0.12], bH=[bS[0]+0.13,bS[1]-0.33], bFB=[bH[0]+0.18,0], bFF=[bH[0]-0.24,0];
      var bk=body(P,{role:'blocker',tpl:'grab',tlean:0,tweight:0,wMul:1.12,bones:{hand:[HB[0],HB[1]+0.005],shoulder:bS,hip:bH,fF:bFF,fB:bFB,planted:'fB'},ox:bH[0],fl:-1,feet:[bFF,bFB],wt:0,lean:0,twist:0.2,tilt:0.08,hat:hat,garment:P.pick(['coat','jacket']),turn:'tq',
        hands:[[HB[0],HB[1]+0.005,1],[bS[0]+0.18,1.06,1]]});
      var yH=[bk.sB[0],bk.sB[1]-0.01], yS=[yH[0]+0.23,yH[1]-0.03], yP=[yS[0]-0.03,yS[1]-0.33], yFF=[yP[0]+0.17,0], yFB=[yP[0]-0.14,0.04];
      body(P,{role:'yielder',tpl:'lookBack',tlean:0,tweight:0,wMul:0.86,bones:{handTag:'hB',hand:yH,shoulder:yS,hip:yP,fF:yFF,fB:yFB,planted:'fF'},ox:yP[0],fl:1,sc:0.96,feet:[yFF,yFB],wt:1,lean:0,twist:-0.7,tilt:0.05,look:'back',hat:P.pick(['cap','bun','short','hood']),garment:P.pick(['coat','skirt','jacket']),turn:'profile',
        hands:[null,[yH[0],yH[1],1]]});
      body(P,{role:'bystander',tpl:'point',tlean:0.02,tweight:0,behind:true,ox:-0.95,fl:1,sc:0.98,feet:[[-0.88,0],[-1.03,0]],wt:1,lean:0.03,twist:0.3,tilt:-0.08,hat:P.pick(['cap','brim','bald','short']),garment:P.pick(['coat','jacket','robe']),turn:'tq',
        hands:[[-0.7,0.99,-1],null]});
      P.slots.handlebar=HB; P.slots.deck=[[-1.15,0],[1.62,0]]; },
    // 讲价: buyer and seller both hold one bag, heads bent to it, spines leaning in so they converge above it
    bargain:function(P){ var ob=P.pick(['bag','bag','bowl']), mp=[0.0,ob==='bag'?0.58:0.6], sc=P.r(0.9,0.97);
      body(P,{role:'buyer',tpl:'holdTwo',tlean:0.06,ox:-0.34,fl:1,feet:[[-0.22,0],[-0.46,0.02]],wt:0,lean:0.2,bend:0.18,tilt:0.15,hat:P.pick(['cap','bald','hood','short']),garment:P.pick(['coat','jacket','robe']),turn:'tq',
        hands:[[mp[0]-0.05,mp[1]+0.01,-1],null]});
      body(P,{role:'seller',tpl:'holdTwo',tlean:0.05,ox:0.36,fl:-1,sc:sc,feet:[[0.24,0],[0.48,0]],wt:0,lean:0.17,bend:0.15,tilt:0.12,hat:P.pick(['cap','bun','brim','short']),garment:P.pick(['coat','jacket','skirt']),turn:'tq',
        hands:[[mp[0]+0.05,mp[1]+0.01,-1],null]});
      if(ob==='bag'){ var bg=[[mp[0]-0.05,mp[1]],[mp[0]+0.05,mp[1]],[mp[0]+0.07,mp[1]-0.15],[mp[0]-0.07,mp[1]-0.15],[mp[0]-0.05,mp[1]]]; P.m('prop',bg); P.solid(bg); }
      else { P.m('prop',[[mp[0]-0.08,mp[1]],[mp[0]-0.06,mp[1]-0.06],[mp[0]+0.06,mp[1]-0.06],[mp[0]+0.08,mp[1]]]); P.m('prop',[[mp[0]-0.09,mp[1]+0.005],[mp[0]+0.09,mp[1]+0.005]]); P.solid([[mp[0]-0.08,mp[1]],[mp[0]+0.08,mp[1]],[mp[0]+0.06,mp[1]-0.06],[mp[0]-0.06,mp[1]-0.06]]); }
      P.slots.object=mp; },
    // 抬: two porters under one pole with a load slung from its middle; both spines bent under it, steps in phase, near hands on the pole
    porters:function(P){ var st=P.r(0.11,0.14), sc2=P.r(0.95,1.0);
      var a=body(P,{role:'front',tpl:'carryPole',tlean:0.03,ox:0.44,fl:1,feet:[[0.44+st,0],[0.44-0.09,0.03]],wt:0,lean:0.12,bend:0.32,tilt:0.15,hat:P.pick(['brim','cap','hood']),garment:P.pick(['jacket','shorts']),turn:'tq',
        hands:[null,null]});
      var b=body(P,{role:'back',tpl:'carryPole',tlean:0.03,ox:-0.4,fl:1,sc:sc2,feet:[[-0.4+st,0],[-0.4-0.09,0.03]],wt:0,lean:0.12,bend:0.3,tilt:0.18,hat:P.pick(['brim','cap','short']),garment:P.pick(['jacket','shorts']),turn:'tq',
        hands:[null,null]});
      var p0=[b.sF[0]-0.28,b.sF[1]+0.08], p1=[b.sF[0],b.sF[1]+0.035], p2=[a.sF[0],a.sF[1]+0.035], p3=[a.sF[0]+0.26,a.sF[1]+0.07], mu=(p1[0]+p2[0])/2, mv=(p1[1]+p2[1])/2-0.03;
      P.m('pole',[p0,p1,[mu,mv],p2,p3]);
      var w=P.r(0.1,0.13), top=mv-0.14, hgt=P.r(0.16,0.22);
      P.m('thin',[[mu-0.01,mv],[mu-0.05,top]]); P.m('thin',[[mu+0.01,mv],[mu+0.05,top]]);
      P.m('prop',[[mu-w,top],[mu-w*1.05,top-hgt*0.6],[mu-w*0.8,top-hgt],[mu+w*0.8,top-hgt],[mu+w*1.05,top-hgt*0.6],[mu+w,top],[mu-w,top]]);
      P.solid([[mu-w,top],[mu+w,top],[mu+w,top-hgt],[mu-w,top-hgt]]);
      P.slots.pole=[p0,p3]; P.slots.load=[mu,top-hgt*0.5]; },
    // 凭栏: three on one rail, elbows on it, hips back, legs straight to the deck; one chin on a hand, one turned to the neighbour
    railLean:function(P){ var rv=0.56, xs=[-0.58,0.0,0.6], i;
      P.m('pole',[[-1.0,rv],[1.0,rv-0.004]]); P.m('prop',[[-0.95,rv-0.02],[-0.95,0.0]]); P.m('prop',[[0.95,rv-0.02],[0.95,0.0]]); P.m('thin',[[-1.0,rv*0.45],[1.0,rv*0.45-0.004]]);
      for(i=0;i<3;i++){ var x=xs[i]+P.r(-0.04,0.04), chin=i===1, tq=i===2, sc=P.r(0.94,1.0);
        body(P,{role:'leaner',tpl:'leanRail',tlean:0,tweight:0,ox:x,fl:1,sc:sc,feet:[[x+0.01,0],[x-0.13,i===0?0.03:0]],wt:0,pu:x-0.06,pelvis:0.5,lean:0.42,bend:0.3,tilt:chin?0.2:tq?-0.05:0.08,look:tq?'tq':undefined,
          hat:P.pick(['cap','bun','short','bald','brim','hood']),garment:P.pick(['coat','jacket','skirt','longcoat']),turn:tq?'tq':'profile',
          hands:[chin?null:{elbow:[x+0.15,rv+0.02],hand:[x+0.27,rv+0.07]},null]}); }
      P.solid([[-1.0,rv-0.03],[1.0,rv-0.03],[1.0,rv+0.02],[-1.0,rv+0.02]]);
      P.slots.rail=[[-1.0,rv],[1.0,rv]]; },
    // 递碗: the vendor hands a bowl across the counter, the customer takes it — both hands meet on the bowl, both heads bent to it
    vendorBowl:function(P){ var bowl=[0.22,0.61];
      P.m('pole',[[-0.6,0.47],[0.5,0.462]]); P.m('prop',[[-0.42,0.47],[-0.4,0.6],[-0.16,0.6],[-0.14,0.47]]); P.m('prop',[[-0.44,0.62],[-0.12,0.625]]);
      P.solid([[-0.6,0.45],[0.5,0.45],[0.5,0.48],[-0.6,0.48]]); P.solid([[-0.42,0.47],[-0.4,0.6],[-0.16,0.6],[-0.14,0.47]]);
      body(P,{role:'vendor',tpl:'reachOut',tlean:0.03,behind:true,ox:-0.14,fl:1,feet:[[-0.06,0],[-0.24,0]],wt:0,lean:0.14,bend:0.25,tilt:0.15,hem:0.47,noHem:true,legs:'skip',hat:P.pick(['cap','hood','bald','cap']),garment:P.pick(['jacket','coat']),turn:'tq',
        hands:[[bowl[0]-0.05,bowl[1]+0.005,-1],null]});
      body(P,{role:'customer',tpl:'reachOut',tlean:0.05,ox:0.64,fl:-1,sc:P.r(0.92,0.98),feet:[[0.52,0],[0.76,0]],wt:0,lean:0.16,bend:0.12,tilt:0.18,hat:P.pick(['cap','bald','hood','short','bun']),garment:P.pick(['coat','jacket','robe']),turn:'tq',
        hands:[[bowl[0]+0.06,bowl[1]+0.005,-1],null]});
      P.m('prop',[[bowl[0]-0.07,bowl[1]],[bowl[0]-0.05,bowl[1]-0.055],[bowl[0]+0.05,bowl[1]-0.055],[bowl[0]+0.07,bowl[1]]]); P.m('prop',[[bowl[0]-0.08,bowl[1]+0.005],[bowl[0]+0.08,bowl[1]+0.005]]);
      P.solid([[bowl[0]-0.07,bowl[1]],[bowl[0]+0.07,bowl[1]],[bowl[0]+0.05,bowl[1]-0.055],[bowl[0]-0.05,bowl[1]-0.055]]);
      P.slots.bowl=bowl; P.slots.counter=[[-0.6,0.47],[0.5,0.47]]; }
  };
  var NAMES=[]; for(var k in POSES)NAMES.push(k);

  // ---------------------------------------------------------------- resolve / footprint / build
  function resolve(ctx,spec){ if(spec._fig)return spec._fig;
    var P=newP(ctx,spec); if(spec.pose==='swimmer')P.ballR=3/(spec.h*1.0); P.ebike=spec.kind==='ebike';
    var hh=spec.h*(spec.kind?1:ctx.rr(0.92,1.08)); P.bodies=[]; P.slots={};
    if(spec.kind)(GROUPS[spec.kind]||GROUPS.bargain)(P); else if(spec.tpl&&TPL[spec.tpl])tplFigure(P,spec.tpl,{hat:P.pick(['cap','short','brim','bald','bun','hood'])}); else (POSES[spec.pose]||POSES.stand)(P);
    var tint=spec.tint; if(tint===undefined){ var t=ctx.R(); tint=t<0.40?'indigo':t<0.60?'ochre':t<0.65?'zhusha':'none'; }
    var x0=1e9,x1=-1e9,y0=1e9,y1=-1e9, i, j;
    for(i=0;i<P.solids.length;i++){ var s=P.solids[i]; if(s.poly)for(j=0;j<s.poly.length;j++){ x0=Math.min(x0,s.poly[j][0]); x1=Math.max(x1,s.poly[j][0]); y0=Math.min(y0,s.poly[j][1]); y1=Math.max(y1,s.poly[j][1]); }
      else { x0=Math.min(x0,s.c[0]-s.r); x1=Math.max(x1,s.c[0]+s.r); y0=Math.min(y0,s.c[1]-s.r); y1=Math.max(y1,s.c[1]+s.r); } }
    spec._fig={hh:hh,dir:spec.dir||1,P:P,tint:tint,u0:x0,u1:x1,v0:y0,v1:y1}; return spec._fig; }
  function pip(poly,x,y){ var c=false; for(var i=0,j=poly.length-1;i<poly.length;j=i++){ var a=poly[i], b=poly[j]; if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c; } return c; }

  function footprint(ctx,spec){ var F=resolve(ctx,spec), hh=F.hh, dir=F.dir, X=spec.x, Y=spec.y, sol=F.P.solids, z=spec.z===undefined?spec.y:spec.z;
    var ua=dir>0?F.u0:-F.u1, ub=dir>0?F.u1:-F.u0;
    return {x0:X+ua*hh-1,x1:X+ub*hh+1,y0:Y-F.v1*hh-1,y1:Y-F.v0*hh+1,z:z,
      inside:function(x,y){ var u=(x-X)/(dir*hh), v=(Y-y)/hh;
        for(var i=0;i<sol.length;i++){ var s=sol[i]; if(s.poly){ if(pip(s.poly,u,v))return true; } else { var du=u-s.c[0], dv=v-s.c[1]; if(du*du+dv*dv<s.r*s.r)return true; } } return false; }}; }

  function build(ctx,spec){ var F=resolve(ctx,spec), P=F.P, ST=ctx.ST, C=ctx.C, rr=ctx.rr, hh=F.hh, dir=F.dir, X=spec.x, Y=spec.y, z=spec.z===undefined?spec.y:spec.z;
    var xr=X+Math.max(Math.abs(F.u0),Math.abs(F.u1))*hh, ws=0.82+0.18*hh/55, i, j;
    function T(q){ return [X+dir*q[0]*hh,Y-q[1]*hh]; }
    function poly(pl){ var out=[]; for(var k=0;k<pl.length;k++)out.push(T(pl[k])); return out; }
    for(i=0;i<P.marks.length;i++){ var m=P.marks[i], k=KIND[m.k], gr=ctx.INK[k[0]]; ctx.bline(ST.FIGURES,xr,C.ink,Math.max(50,Math.min(240,Math.round((gr[1]+k[2])*rr(0.94,1.04)+P.am+m.am))),gr[0]*k[1]*ws*P.wm*m.wm,poly(m.pts),z,k[3]&&ctx.INK.style?ctx.INK.style[k[3]]:undefined); }
    // round 10 (D-19 (1)): ink masses (hair, hats, shoes) — 积墨 laid as ruled strokes 0.5 px apart across the polygon, each at full width, so a
    // 2-px crown comes out black (soft dabs at this size are all rim and leave grey); the strokes are z-clipped like every other mark
    for(i=0;i<P.inks.length;i++)(function(pl,ink){ var y0=1e9,y1=-1e9, k, y, al=Math.round(ink*255);
      for(k=0;k<pl.length;k++){ y0=Math.min(y0,pl[k][1]); y1=Math.max(y1,pl[k][1]); }
      for(y=y0+0.25;y<y1;y+=0.5){ var xs=[]; for(k=0;k<pl.length;k++){ var a=pl[k], b=pl[(k+1)%pl.length]; if((a[1]>y)!==(b[1]>y))xs.push(a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1])); }
        xs.sort(function(u,v){ return u-v; }); for(k=0;k+1<xs.length;k+=2){ var xa=xs[k]+rr(-0.15,0.1), xb=xs[k+1]+rr(-0.1,0.15); if(xb-xa<0.3)continue;
          ctx.bline(ST.FIGURES,xr,C.ink,al,0.9*ws*P.wm,[[xa,y],[xb,y]],z,ctx.INK.style?ctx.INK.style.rule:undefined); } } })(poly(P.inks[i].poly),P.inks[i].ink);
    // 赭石: face dot, one dab per hand
    for(i=0;i<P.heads.length;i++)(function(c,r){ ctx.dabs(ST.OCHRE,{x0:c[0]-r,x1:c[0]+r,y0:c[1]-r,y1:c[1]+r,z:z,inside:function(px,py){ var du=px-c[0], dv=py-c[1]; return du*du+dv*dv<r*r*0.8; }},C.ochre,0.35,2.6,2.2); })(T(P.heads[i].c),P.heads[i].r*hh);
    for(i=0;i<P.hands.length;i++)(function(c){ var r=1.7; ctx.dabs(ST.OCHRE,{x0:c[0]-r,x1:c[0]+r,y0:c[1]-r,y1:c[1]+r,z:z,inside:function(px,py){ var du=px-c[0], dv=py-c[1]; return du*du+dv*dv<r*r; }},C.ochre,0.3,2,1.6,null,{pool:true}); })(T(P.hands[i]));
    // tint: 花青 or 赭石 on the garment, 朱砂 on a garment (tourists: on the flag instead)
    var robes=P.robes, reds=P.reds;
    if(F.tint==='indigo')for(i=0;i<robes.length;i++)ctx.wash(ST.INDIGO,poly(robes[i]),C.huaqing,0.22,2.5,2.4,z);
    if(F.tint==='ochre')for(i=0;i<robes.length;i++)ctx.wash(ST.OCHRE,poly(robes[i]),C.ochre,0.24,2.5,2.4,z);
    if(F.tint==='zhusha'){ var tg=reds.length?reds:robes; for(i=0;i<tg.length;i++)ctx.wash(ST.INDIGO,poly(tg[i]),C.zhusha,0.45,2.2,2,z); }
    if(spec.pose==='swimmer')for(i=0;i<reds.length;i++)ctx.wash(ST.INDIGO,poly(reds[i]),C.zhusha,0.55,1.5,1.8,z);
    var slots={}; for(var sk in P.slots){ var sv=P.slots[sk]; slots[sk]=typeof sv[0]==='number'?T(sv):poly(sv); }
    var figs=[]; for(i=0;i<P.bodies.length;i++){ var b=P.bodies[i], hd=[]; for(j=0;j<P.hands.length;j++)hd.push(T(P.hands[j]));
      figs.push({role:b.role,x:X+dir*b.ox*hh,y:Y,h:hh*b.sc,head:T(b.head),shoulders:[T(b.sF),T(b.sB)],feet:[T(b.feet[0]),T(b.feet[1])]}); }
    var fp=footprint(ctx,spec), res={fp:fp,slots:slots,figures:figs}; ctx.reg.figures.push(res); return res; }
  // FIGURE.group: an action group (kinds: ebike bargain porters railLean vendorBowl) drawn as one figure; spec {kind,x,y,h,dir,z,tint}.
  // footprint(ctx,spec) works on the same spec (stamp it first); group() then draws and returns {fp, figures:[{role,x,y,h,head,shoulders,feet}], slots}
  function group(ctx,spec){ if(!spec.kind)spec.kind='bargain'; return build(ctx,spec); }

  var GNAMES=[]; for(var gk in GROUPS)GNAMES.push(gk);
  return {footprint:footprint,build:build,group:group,POSES:POSES,GROUPS:GROUPS,names:NAMES,groupNames:GNAMES,TPL:TPL,tplNames:TPL_NAMES};
})();
