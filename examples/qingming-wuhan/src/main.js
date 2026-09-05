/* main.js — the composition of 清明上河圖 · 武漢 (plan.md §Stations), read right → left.
   Phase A creates every spec, stamps the water raster and the z-mask (buildings, boats, trees, boards, then the figures the
   crowd grammar places); phase B calls every build() and hands the text module its boards, colophon and seals.
   The ordering loop (sort each stage by descending x, stageStart, checkpoint boundaries at TREES and OCHRE) is
   finishBuild() in tail.js; p.noiseSeed(7) and the seed live in makeCtx (core.js); ALL_TEXT for the font gate is in core.js.
   Every row of shops faces the viewer with its street in front; a row on the near side of a street is roofs only,
   so the street behind it stays visible (a front-facing row would hide it).
   Round 2 (D-06/D-07): hills are TREE.hill bodies stamped first; every row of buildings and every water edge gets a GROUND.terrace
   strip (see the note at terr()) and the water edge one GROUND.bankLine; the bridge deck is knots ('episode') joined by pulsed
   streams and the river under it carries three boat-and-pier episodes with clean water either side; 漢正街/江漢路 are thinned and
   half of each row is roofs only; main draws the 起稿 of the ground plan and the 復勾 of eaves, hulls, deck edge and a tenth of the figures.
   Round 3 (D-08): deck feet are projected onto the deck's breadth (onDeck) and the bridge's near rail is stamped after the figures; the three deck
   incidents are ring / clump / knot episodes; roofs behind a row take `pale`; GROUND.foot under every terrace tree; the 起稿 adds the deck's far kerb,
   the piers, closed hull masses and a pale oval per knot.
   Round 4 (D-10): the three deck incidents and the street vendors are FIGURE.group action groups (agroup) stamped like figures; 戶部巷, 漢正街, 江漢路 and the
   里份 are ARCH.streetRow rows (row: a silent phase-A build places their boards); the 復勾 presses only bearing edges — eave undersides, hull bellies, bank
   lips, the deck edge, tree roots — at the primary grade ×1.15; crowd ovals in the 起稿 are faint and only under four or more.
   Round 5 (D-12): dark planes — one continuous 淡墨 strip (darkPlane/planeRuns) under the bridge's bottom chord, under every bank lip and along every quay
   edge, the 復勾 on its upper edge; the washes main lays itself (bus, train, steamer) gather toward the shaded left end (washFace, light from the upper
   right); the tug under the bridge gets spec.clearance from the beam underside at its stern; 漢陽's nearer tall building is ARCH kind 'cornerHouse'.
   Round 7 (D-14): the bridge's near girder carries a graded 淡墨 band (girderBand) and its far kerb/rail take the texture grade (bridgeCtx); 戶部巷's 積墨 goes
   through the slot's rounded region and feathered foot; the 東湖 grove's central tree gets `feature`; 磨山's saddle deepened for the tree module's valley.
   Round 8 (D-15): girderBand is the near girder's whole belly (deck edge → chord, 0.35 → 0.15), the piers' bearing tops take the heaviest strokes in the
   復勾, bridgeCtx drops the near lattice to structural ×0.8 and the far kerb/rail to texture ×0.8; the tree left of the featured 東湖 tree gets `weave`.
   Round 9 (D-16): girderBand is one smooth pooled wash (no dab speckle) 0.34 → 0.07, the 積墨 sits only at the pier joints (a 10–14 × 6–8 px patch, the FINISH stroke on its
   upper edge) and every pier's oblique side takes 淡墨; the rear 漢正街 row is ARCH 'hzrear'; the second 晴川閣 tree carries feature + weave together.
   Round 10 (D-17/D-18/D-19): 黃鶴樓 at its full 360 px on a deeper 蛇山, its boards/footprints fetched in phase A by silentSlots (a silent ARCH.build on a throwaway generator),
   trees in front kept off its storeys; every named board sized from the arch's signRect (boardAt); 朱砂 ≤ 1 garment per station and none on the deck but the flags; the FINISH
   pass ends with the 折痕 wear along ctx.silkWear (keyed at x −1, drawn last over ink and colour); the 東湖 central tree is the grove's main tree.
   Round 11 (D-21): the bridge spec carries `train:{x,n}` and the arch module draws the cars inside the truss (main's train() is no longer called); the 桥头堡 blocks now run 32 px
   under the deck with a stair on the outer side, so the Wuchang bank cluster stands at the abutment's foot and the pines that stood on the stairs moved off them. Nothing else in
   any spec changed — the water, figures, trees and colophon are the owners' round-11 drawings on the v10 calls. */
new p5(function(p){
  var ctx=makeCtx(p), A=newApp(p,ctx);

  function build(){
    var ST=ctx.ST, C=ctx.C, R=ctx.R, rr=ctx.rr, ri=ctx.ri, clamp=ctx.clamp, noise=ctx.noise, W=ctx.SW, H=ctx.SH, CWx=ctx.CW, OBL=ctx.OBL, i, j;
    function pwl(pts){ return function(x){ if(x<=pts[0][0])return pts[0][1]; for(var q=1;q<pts.length;q++)if(x<=pts[q][0]){ var a=pts[q-1], b=pts[q]; return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]); } return pts[pts.length-1][1]; }; }
    function hOf(y){ return 60*ctx.depth(y); }
    function pick(arr){ return arr[ri(0,arr.length-1)]; }

    /* ================================================================ rivers
       長江: far bank lost in the upper mist (yTop off-canvas). The near bank LB enters at S2, runs along the 江灘, recedes
       behind 蛇山, comes down the hill's flank to the first pier, runs diagonally under the bridge (deck + 95), climbs the
       龜山 promontory at the far end, passes 南岸嘴 and the 漢江 mouth, and lifts into the mist after x≈1600.
       漢江: a 100-px band from the bottom edge to the confluence, edges RE (南岸嘴) and LE (集家嘴). */
    var LB0=pwl([[1540,-40],[1600,36],[1660,98],[1710,134],[1760,145],[1885,150],[1978,150],[2020,222],[2160,228],[2200,226],[2260,232],[2340,244],[2420,218],[2480,206],[2500,196],[2576,200],[2596,262],[2612,300],[2660,310],[3222,411],[3240,398],[3270,360],[3300,316],[3340,296],[3400,262],[3440,226],[3560,222],[3640,240],[3760,298],[3900,302],[4100,292],[4250,262],[4400,216],[4560,172],[4592,120],[4622,40],[4645,-40]]);
    function LB(x){ return LB0(x)+(noise(x*0.013,3.3)-0.5)*7; }
    function MIST(){ return -30; }
    function REy(x){ return 500-(2175-x)*1.8; }
    function LEy(x){ return 500-(2085-x)*1.8; }
    function LEx(y){ return 2085-(500-y)/1.8; }
    function REx(y){ return 2175-(500-y)/1.8; }
    function hanTop(x){ return Math.max(150,REy(x)); }
    function hanBot(x){ return Math.min(H+30,LEy(x)); }
    var HANFLOW=[-0.486,-0.874];
    // 長江大橋 (S5): right end (3300,330), 9 spans × 80 climbing 125 px leftward, truss 28 → 22; the water under each pier
    var BX=3300, BY=330, BSPAN=80, BN=9, BRISE=125, BZ=330, BL=BSPAN*BN, OY=OBL[1]*14;
    function yD(x){ return BY-BRISE*(BX-x)/BL; }
    function trussH(x){ return 28-6*(BX-x)/BL; }
    function yB(x){ return yD(x)+trussH(x); }
    function bridgeWater(x){ return yD(x)+66; }
    var shoreL=pwl([[4590,40],[4600,80],[4610,120],[4630,150],[4660,168],[4700,176],[4800,180],[4900,174],[5020,178]]);
    function shore(x){ return shoreL(x)+(noise(x*0.02,7.7)-0.5)*5; }

    /* ================================================================ collections and small builders */
    var arch=[], boats=[], trees=[], zones=[], signs=[], blobs=[], groups=[], figs=[], extras=[], stamps=[];
    function hall(o){ arch.push(o); return o; }
    function tree(x,y,h,kind,dir,z){ var t={x:x,y:y,h:Math.round(h),kind:kind,dir:dir===undefined?(R()<0.5?-1:1):dir}; if(z!==undefined)t.z=z; trees.push(t); return t; }
    function boat(o){ boats.push(o); return o; }
    function zone(o){ zones.push(o); return o; }
    function sign(o){ signs.push(o); return o; }
    function blob(o){ blobs.push(o); return o; }
    // opt.hScale places a group at a smaller figure scale (the crowd reads ctx.depth for h and spacing): people on the bridge deck
    function group(spec,opt){ opt=opt||{}; var c=ctx; if(opt.hScale){ c={}; for(var q in ctx)c[q]=ctx[q]; c.depth=function(y){ return ctx.depth(y)*opt.hScale; }; } var g=CROWD.place(c,spec); opt.focus=spec.focus; groups.push({figs:g,opt:opt,kind:spec.kind||'stream'}); return g; }
    function fig(o){ figs.push(o); return o; }
    function box(x0,y0,x1,y1,z){ stamps.push({x0:x0,x1:x1,y0:y0,y1:y1,z:z,inside:function(x,y){ return x>=x0&&x<=x1&&y>=y0&&y<=y1; }}); }
    function keep(f){ ctx.reg.placed=ctx.reg.placed||[]; ctx.reg.placed.push(CROWD.footprint(ctx,{x:f.x,y:f.y,h:f.h,pose:'stand',prop:''})); }
    function figAt(x,y,pose,dir,o){ var f={x:x,y:y,h:hOf(y),pose:pose,dir:dir||1,z:y}; if(o)for(var q in o)f[q]=o[q]; keep(f); return fig(f); }
    // D-10 action groups (FIGURE.group): one drawing of several bodies sharing contact points — spec {kind,x,y,h,dir,z,tint}, y the line every
    // foot stands on. Registered with the crowd grammar at once so the streams and episodes placed after it keep out of its box.
    var agroups=[];
    function agroup(o){ if(o.z===undefined)o.z=o.y; var fp=FIGURE.footprint(ctx,o); ctx.reg.placed=ctx.reg.placed||[]; ctx.reg.placed.push({x0:fp.x0,x1:fp.x1,y0:fp.y0,y1:fp.y1,z:fp.z,d:o.y}); agroups.push(o); return o; }
    // D-10 連續街屋 (ARCH.streetRow): one row is one structure. rowPlan is noise-only, so a silent build in phase A (every stroke function a no-op)
    // gives the same units and board rectangles the real build will draw; the readable boards are laid on those rectangles and stamped with the
    // other signs. Phase B builds the row for real and hands its eaves to the 復勾 and its 幌子 to TEXT.blob.
    var rows=[];
    function silentCtx(){ var o={}, k, no=function(){}; for(k in ctx)o[k]=ctx[k]; o.add=o.line=o.pline=o.rline=o.bline=o.wash=o.dabs=o.chunks=no; o.reg={buildings:[],boats:[],trees:[],figures:[],zones:[],slots:[]}; return o; }
    // round 10 (D-17/D-18): a hall's board rectangles and the 黃鶴樓's body/base footprints are only returned by ARCH.build, so a silent build in phase A fetches
    // them; its drawing rolls on a throwaway generator, so ctx.R is not consumed and every module keeps its dice (geometry never rolls)
    function silentSlots(spec){ var o=silentCtx(), sd=20260910; function Q(){ sd|=0; sd=sd+0x6D2B79F5|0; var t=Math.imul(sd^sd>>>15,1|sd); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }
      o.R=Q; o.rr=function(a,b){ return a+Q()*(b-a); }; o.ri=function(a,b){ return Math.floor(a+Q()*(b-a+1)); }; return ARCH.build(o,spec).slots; }
    // a readable board on an arch signRect: the text sized from the rect's height (12–14 on shops, 14–16 on the 黃鶴樓, 18–20 on the 牌坊), the board the rect itself
    function boardAt(sr,text,z,o){ var sz=clamp(Math.round(sr.h*0.92),10,20), sp={x:sr.cx,y:sr.cy+1,text:text,size:sz,z:z,board:'ink',w:sr.w,h:sr.h,tight:true}; if(sr.vertical)sp.vertical=true; if(o)for(var q in o)sp[q]=o[q]; return sign(sp); }
    function row(o){ if(o.z===undefined)o.z=o.y; rows.push(o); var sl=ARCH.streetRow(silentCtx(),o).slots, k;
      for(k=0;k<sl.signRects.length;k++){ var sr=sl.signRects[k]; sign({x:sr.cx,y:sr.cy+2.5,text:sr.text,size:clamp(Math.round(sr.h*1.05),12,14)-(sr.text.length>2?1:0),z:o.z+2,board:'ink',tight:k===1}); }   // D-18: 12–14 from the rect's height, readable at 1×
      // o.hang: vertical 牌 hung from the upper storey of the colonnade units (which carry no board), one per unit, right → left
      var hang=o.hang||[], hi=0; for(k=sl.units.length-1;k>=0&&hi<hang.length;k--){ var u=sl.units[k]; if(u.kind!=='colon')continue;
        sign({x:u.x1-(u.x1-u.x0)*0.3,y:u.y-o.h*0.47,text:hang[hi++],size:12,vertical:true,z:o.z+2,board:hi===1?'zhusha':'ink'}); }
      return o; }
    // a receding row of shops: each next one up-left of the previous, overlapping it by a few px so the row reads as one street side
    function shopRow(o){ var out=[], x=o.x, y=o.y, q;
      for(q=0;q<o.n;q++){ var w=ri(o.w[0],o.w[1]), dp=ctx.depth(y);
        if(o.roofsFrom!==undefined&&q>=o.roofsFrom){ // D-07: the far half of a row is roofs only — the street runs on but the facades stop
          hall({kind:'hall',x:x,y:y,w:w,d:Math.round(w*0.6),h:ri(9,13),storeys:1,tb:0,bays:1,front:['x'],rise:Math.round(w*rr(0.42,0.55)),tiles:R()<0.5?'indigo':'grey',z:y,pale:(o.pale||1)*Math.max(0.5,1-0.1*(q-o.roofsFrom+1))});
          x+=o.dx-(w-o.w[0]); y+=o.dy; continue; }
        var s={kind:o.kind||'shopfront',x:x,y:y,w:w,d:Math.round(w*rr(0.5,0.7)),h:Math.round(rr(o.h[0],o.h[1])*dp),dir:1,z:y,tb:ri(3,5)}; if(o.pale)s.pale=o.pale;
        if(s.kind==='shopfront'){ s.storeys=o.storeys||2; if(o.roof)s.roof=o.roof; if(o.awn!==undefined)s.awning=R()<o.awn; s.huangziRed=R()<(o.red===undefined?0.22:o.red); }
        else if(s.kind==='colonnade'){ s.storeys=o.storeys||ri(2,3); s.bays=Math.max(2,Math.round(w/24)); }
        if(o.each)o.each(s,q);
        arch.push(s); out.push(s); x+=o.dx-(w-o.w[0]); y+=o.dy; }
      return out; }
    // roofs only — the near side of a street seen from behind; the walls are below the street edge and are not drawn
    function roofRow(o){ var x=o.x, y=o.y, q; for(q=0;q<o.n;q++){ var w=ri(o.w[0],o.w[1]); hall({kind:'hall',x:x,y:y,w:w,d:Math.round(w*0.6),h:8,storeys:1,roof:R()<0.7?'xuanshan':'xieshan',tb:0,bays:1,front:['x'],rise:Math.round(w*rr(0.42,0.55)),tiles:R()<0.5?'indigo':'grey',z:y,pale:Math.max(0.5,1-0.1*q)}); x+=o.dx-(w-o.w[0]); y+=o.dy; } }   // D-08: each roof behind a step paler
    // board centre under the 額枋 of a hall's ground storey (the same arithmetic as hallGeom, so the board is stamped in phase A)
    function boardOn(s,size,text,o){ var tb=s.tb===undefined?Math.round(clamp(s.w*0.05,3,6)):s.tb, ez=s.dougong?6:3, yf=s.y-s.h+ez, yb=s.y-tb, n=s.storeys||(s.kind==='shopfront'?2:1), body=(yb-yf-6*(n-1))/n, top=yb-body;
      var sp={x:s.x-s.w/2,y:top+3+size*0.85,text:text,size:size,z:(s.z===undefined?s.y:s.z)+2,board:'ink'}; if(o)for(var q in o)sp[q]=o[q]; return sign(sp); }
    function treeRow(x0,x1,n,yAt,hr,kinds,o){ var xs=CROWD.spreadAlong(ctx,[[x0,0],[x1,0]],n,0.8), q, out=[]; o=o||{};
      for(q=0;q<n;q++){ var x=xs[q][0], y=yAt(x); out.push(tree(x,y,rr(hr[0],hr[1])*ctx.depth(y),pick(kinds),undefined,o.z)); } return out; }
    /* D-07 continuous ground. A terrace is a strip owning its front edge (given right → left); GROUND.terrace lays the earth behind the
       edge (smaller y). In this scroll the water lies BEHIND the streets and the buildings' feet face the viewer, so most strips are
       given a negative depth: the strip then lies in front of its edge — the wash hugs a row's ground line and dissolves toward the
       blank street centre, the bank's 皴 and wash sit in front of the water line. The water edge itself is one GROUND.bankLine.
       Hills (蛇山, 龜山, 磨山) are TREE.hill bodies stamped before what stands on them. All of these draw at z 0 and stamp nothing. */
    var terraces=[], hills=[];
    function terr(o){ terraces.push(o); return o; }
    function bankLn(pts){ terraces.push({kind:'bankline',pts:pts}); }
    function hillAt(o){ hills.push(o); return o; }
    function fx(x0,x1,f,step){ var pts=[], x, s=step||8; if(x0>x1){ for(x=x0;x>x1;x-=s)pts.push([x,f(x)]); pts.push([x1,f(x1)]); } else { for(x=x0;x<x1;x+=s)pts.push([x,f(x)]); pts.push([x1,f(x1)]); } return pts; }
    function fy(y0,y1,f,step){ var pts=[], y, s=step||8; for(y=y0;y<y1;y+=s)pts.push([f(y),y]); pts.push([f(y1),y1]); return pts; }
    // a row's feet: the strip in front of the buildings' ground line, kerb toward the street
    function feet(pts,depth,o){ var t={kind:o&&o.kind||'street',pts:pts,depth:-(depth||30),ink:o&&o.ink!==undefined?o.ink:0.24}; return terr(t); }
    // 起稿 (DRAFT): a pale underdrawing of the big geometry in 40–90 px pieces, drawn from the same numbers the later stages use
    function draft(pts,w,al){ var q=[], k, s=0, L=0; for(k=1;k<pts.length;k++)L+=Math.abs(pts[k][0]-pts[k-1][0])+Math.abs(pts[k][1]-pts[k-1][1]);
      var piece=rr(40,90), acc=0; for(k=0;k<pts.length;k++){ q.push(pts[k]); if(k>0)acc+=Math.abs(pts[k][0]-pts[k-1][0])+Math.abs(pts[k][1]-pts[k-1][1]);
        if(acc>piece||k===pts.length-1){ if(q.length>=2&&R()<0.88)draftPiece(q,w,al); q=[pts[k]]; acc=0; piece=rr(40,90); } } }
    function draftPiece(q,w,al){ var mxq=-1e9, k, p=[]; for(k=0;k<q.length;k++){ p.push([q[k][0]+rr(-0.8,0.8),q[k][1]+rr(-0.8,0.8)]); if(q[k][0]>mxq)mxq=q[k][0]; }
      ctx.pline(ST.DRAFT,mxq,C.ink,al||rr(35,50),w||0.5,p,p.length>2); }
    // 復勾 (FINISH), D-10(a): only the bearing edges are pressed — eave undersides, hull bellies, bank lips, the rail's lower edge, tree roots — at the
    // primary grade with 15 % more ink; the rest of the scroll is not darkened. A stroke follows its material: eaves and rails are ruled ('rule'), the
    // hull belly and the bank lip are drawn plain (no head, no tail); nothing here is a garment edge.
    var ANCH_AL=ctx.INK.primary[1]*1.15, ANCH_W=ctx.INK.primary[0];
    function fugou(pts,z,style,k){ var q=[], j, mxq=-1e9; k=k||1; for(j=0;j<pts.length;j++){ q.push([pts[j][0]+rr(-0.25,0.25),pts[j][1]+rr(-0.25,0.25)]); if(pts[j][0]>mxq)mxq=pts[j][0]; }
      if(q.length>=2)ctx.bline(ST.FINISH,mxq,C.ink,Math.min(240,ANCH_AL*k),ANCH_W*k,q,z,style||'rock'); }
    // D-12 (a) dark planes: under a bearing edge one narrow CONTINUOUS 淡墨 plane (INDIGO, ink 0.18–0.25 on the silk, 2–4 px), the 復勾 sitting on its
    // upper edge — the same recipe as the arch module's eavePlane (a dense wash at step 1.2 so it reads as one strip, not dabs); `top`/`bot` are the offsets
    // below the polyline, `k` the ink on the silk; the strip is cut by whatever stands in front of it (z)
    function darkPlane(pts,top,bot,k,z,al){ if(pts.length<2)return; var a=[], b=[], q; for(q=0;q<pts.length;q++){ a.push([pts[q][0],pts[q][1]+top]); b.push([pts[q][0],pts[q][1]+bot]); }
      ctx.wash(ST.INDIGO,a.concat(b.reverse()),C.danmo,k*1.9*(al===undefined?1:al),1.2,1.5,z); }
    // Round 6 (B5 tell 3, parameter): 積墨 — on 戶部巷's FRONT row only, one patch per unit from the eave edge down into the counter: 淡墨 laid in bands
    // that thin from 0.35 at the eave to 0.12 at the counter top (the bands are not pooled, so the ink has thickness — noise leaves it thinner in places),
    // two or three pools of 0.45 where the doorway and the counter's underside sit and in the eave's shaded left corner, and one gap per unit where the
    // silk still shows through; nothing else on the scroll darkens. `su` is the arch module's shadeUnderEave slot, `doors` the row's door slots.
    // Round 7 (D-14 「墨團邊緣稍方硬,修邊即可」): every band and pool is laid through the slot's own rounded region (`su.inside`, corners 2.5 px) and its
    // feathered lower edge (`su.pred`, the dabs thinning to nothing over the last 3 px), so no patch ends on a ruled corner
    function jimoBand(su,x0,x1,ya,yb,gx,gw,k,z,pool){ var sin=su.inside, spr=su.pred||null;
      ctx.dabs(ST.INDIGO,{x0:x0,x1:x1,y0:ya,y1:yb,z:z,inside:function(x,y){ return x>=x0&&x<=x1&&y>=ya&&y<=yb&&!(x>gx&&x<gx+gw)&&(!sin||sin(x,y)); }},C.danmo,k*1.9,1.2,1.5,spr,pool?{pool:true}:undefined); }
    function jimo(su,doors,z){ var x0=su.x0, x1=su.x1, y0=su.y0, y1=su.y1, w=x1-x0, hh=y1-y0, b, q; if(w<8||hh<4)return;
      var gx=x0+w*rr(0.2,0.75), gw=Math.max(2,w*rr(0.06,0.1)), nb=clamp(Math.round(hh/3),2,5);
      for(b=0;b<nb;b++){ var u=(b+0.5)/nb; jimoBand(su,x0,x1,y0+hh*b/nb,y0+hh*(b+1)/nb+0.6,gx,gw,0.35-(0.35-0.12)*u,z,false); }
      for(b=0;b<nb;b++){ var u2=(b+0.5)/nb; jimoBand(su,x0,x1,y0+hh*b/nb+0.7,y0+hh*(b+1)/nb+1.2,gx,gw,(0.35-(0.35-0.12)*u2)*0.6,z,false); }   // 積: a second layer over the first, the noise thinning it elsewhere
      for(q=0;q<doors.length;q++){ var d=doors[q]; if(d.x<x0+2||d.x>x1-2)continue; var dy0=Math.max(y0,d.y-(d.h||12)), dw=Math.max(3,d.w*0.5); jimoBand(su,Math.max(x0,d.x-dw),Math.min(x1,d.x+dw),dy0,y1,gx,gw,0.45,z,true); }
      var cw=w*rr(0.45,0.7), cx=x0+rr(0.05,0.3)*w; jimoBand(su,cx,Math.min(x1,cx+cw),y1-2.6,y1,gx,gw,0.45,z,true);
      if(R()<0.6)jimoBand(su,x0,x0+w*rr(0.12,0.22),y0,y0+Math.min(hh*0.45,4.5),gx,gw,0.45,z,true); }
    // a plane laid in pieces along a long edge (bank lips): the strip breathes — 80–200 px runs, the ink a little uneven, never a ruled band
    function planeRuns(pts,top,bot,k,z){ var q=[], j, acc=0, piece=rr(80,200); for(j=0;j<pts.length;j++){ q.push(pts[j]); if(j>0)acc+=Math.abs(pts[j][0]-pts[j-1][0])+Math.abs(pts[j][1]-pts[j-1][1]);
        if(acc>piece||j===pts.length-1){ if(q.length>=2)darkPlane(q,top,bot,k*rr(0.85,1.1),z); q=[pts[j]]; acc=0; piece=rr(80,200); } } }
    // a long bearing edge (bank lip) is pressed in runs of 60–140 px with the brush lifted between them
    function fugouRuns(pts,z,style){ var q=[], k, acc=0, piece=rr(60,140); for(k=0;k<pts.length;k++){ q.push(pts[k]); if(k>0)acc+=Math.abs(pts[k][0]-pts[k-1][0])+Math.abs(pts[k][1]-pts[k-1][1]);
        if(acc>piece||k===pts.length-1){ if(q.length>=2&&R()<0.8)fugou(q,z,style); q=[]; acc=0; piece=rr(60,140); } } }

    /* ================================================================ water rasters */
    (function(){ var poly=[], x;
      for(x=4640;x>=1545;x-=6)poly.push([x,-10]); for(x=1545;x<=4640;x+=6)poly.push([x,LB(x)]); ctx.masks.stampWater(poly);
      ctx.masks.stampWater([[REx(150),150],[2178,H+5],[2085,H+5],[LEx(150),150]]);
      ctx.masks.stampWater([[1005,-10],[1312,-10],[1312,118],[1005,118]]);
      var lake=[[4594,-10],[5020,-10]]; for(x=5020;x>=4594;x-=6)lake.push([x,shore(x)]); ctx.masks.stampWater(lake); })();

    /* ================================================================ S0 引首 (5220–5020): blank silk, seals, three treetops in the mist */
    tree(5032,236,52,'za',-1); tree(5052,242,46,'za',1); tree(5068,234,40,'za',-1);

    /* ================================================================ S1 東湖郊野 (5020–4560) */
    (function(){ var x, q;
      // 磨山: two 淡花青 hill bodies beyond the lake (ridge, 皴 bundles, a wash that dissolves before the foot), pines on the nearer one
      hillAt({pts:[[4998,108],[4966,90],[4936,76],[4906,82],[4872,62],[4838,54],[4804,72],[4772,60],[4742,74],[4704,86],[4664,98],[4624,112]],depth:38,tone:'huaqing'});   // D-14 (B6 tell 4): the saddle at 4804 sits 12 px under both peaks, so the tree module runs a 凹谷 down from it
      hillAt({pts:[[4730,90],[4696,72],[4664,64],[4632,74],[4602,94]],depth:26,tone:'huaqing',z:40});
      tree(4884,88,36,'song',-1); tree(4822,72,34,'song',1); tree(4748,82,30,'song',-1);
      // the lake shore: bank strip in front of the water line, then the water edge as one line
      terr({kind:'bank',pts:fx(5020,4600,shore),depth:-18,ink:0.24}); bankLn(fx(5020,4598,function(x){ return shore(x)+1; }));
      // 凌波門棧橋: level, 100 px into the lake, standing a few px in front of the shore; ten students sit on its near edge with their legs down
      zone({kind:'pier',x:4738,y:184,len:105,dir:-1,drop:11,railH:11,thick:3.2});
      for(q=0;q<10;q++){ var px=4738-(8+q*9.6+rr(-1.2,1.2)), py=184-3.2; fig({x:px,y:py+0.5,h:hOf(py)*0.92,pose:'sitDangle',dir:R()<0.5?1:-1,z:184,tint:R()<0.4?'indigo':'none'}); }
      boat({x:4880,y:126,type:'huazi',len:55,dir:-1}); boat({x:4665,y:108,type:'huazi',len:50,dir:1});
      hall({kind:'hall',x:4992,y:330,w:74,h:40,d:44,roof:'xuanshan',tiles:'grey',tb:3,bays:3});
      hall({kind:'hall',x:4890,y:262,w:62,h:36,d:36,roof:'xuanshan',tiles:'grey',tb:3,bays:2,dir:-1});
      hall({kind:'hall',x:4612,y:334,w:78,h:42,d:46,roof:'xuanshan',tiles:'grey',tb:3,bays:3});
      hall({kind:'hall',x:4588,y:244,w:58,h:34,d:34,roof:'xuanshan',tiles:'grey',tb:3,bays:2});
      hall({kind:'hall',x:4762,y:238,w:34,h:30,d:30,roof:'zanjian',tb:3,bays:2,front:['xx']});
      zone({kind:'field',poly:[[4830,206],[4990,209],[5000,262],[4822,258]],dir:0.08,gap:5,ink:0.14});
      zone({kind:'field',poly:[[4642,264],[4790,270],[4802,330],[4630,326]],dir:-0.1,gap:5.5,ink:0.14});
      zone({kind:'road',poly:[[5020,404],[4570,432],[4570,462],[5020,438]],edges:[[[5020,404],[4570,432]],[[5020,438],[4570,462]]],treepits:[{x:4900,y:452,s:12},{x:4700,y:460,s:12}],wash:0,margin:8});
      feet([[5020,338],[4780,336],[4570,342]],26,{kind:'bank',ink:0.2}); feet([[4930,268],[4760,246],[4570,250]],18,{kind:'bank',ink:0.2}); feet([[5020,408],[4570,436]],22,{kind:'bank',ink:0.18});
      treeRow(5000,4670,12,function(x){ return shore(x)+rr(4,14); },[90,130],['liu']);
      tree(4990,214,70,'tao'); tree(4815,268,66,'tao'); tree(4800,338,74,'tao'); tree(4635,258,64,'tao');
      tree(4735,262,78,'ying'); tree(4790,246,70,'ying'); tree(4660,352,84,'ying');
      treeRow(5010,4580,7,function(){ return rr(226,300); },[70,120],['za','huai']);
      // D-14 (B6 tell 6): the grove's central slanting tree (the second of this row, x≈4860, the one whose trunk the reviewer confirmed) carries the featured limb —
      // one big side limb with a knot of crossing twigs on its outer half and a through-gap of silk beside it; nothing else in the grove moves
      // D-15 (B7 tell 6): the tree beside it (the third of the row, to its left) has its inner twigs woven — arcs curving toward the crown's centre, crossing one another, the rim left sparse
      var grove=treeRow(5000,4580,5,function(){ return rr(350,400); },[80,140],['za','huai','wutong']); grove[1].feature=true; grove[1].main=true; grove[2].weave=true;   // round 10 (B9 tell 5): the central tree is the grove's 主樹 — planned from the root, leaning, its limbs reaching one way
      tree(4897,449,120,'wutong'); tree(4697,457,130,'wutong'); tree(4575,300,110,'huai',1); tree(4568,214,95,'za',-1); tree(4632,178,120,'liu',-1);
      group({kind:'stream',zone:{pts:[[5010,436],[4580,449]],w:11},density:1.6,mix:{walk:4,stand:1,umbrella:0.5,photo:0.6,child:0.8,stick:0.5,cart:2.2,pushbike:3,bag:0.5}});
      figAt(4655,458,'squatSeller',1); group({kind:'cluster',focus:[4655,458],n:3,mix:{stand:3,phone:1,basket:1}});
      group({kind:'cluster',focus:[4746,262],n:3,mix:{stand:3,photo:1,talk:1}});
      figAt(4700,318,'squat',-1); figAt(4930,246,'squat',1,{tint:'none'}); })();   // the sitter on the 東湖 clearing stays plain ink (B6: a held passage) whatever the tint shuffle does

    /* ================================================================ S2 戶部巷 · 中華路碼頭 (4560–4100) */
    (function(){ var q, x;
      // D-18: the 牌坊 at w 140 so its middle bay carries 「戶部巷」 at 18 px on the arch module's framed panel (the characters only — the panel is the board)
      var pf=hall({kind:'paifang',x:4582,y:482,w:140,h:96,sign:'戶部巷'}), pfs=silentSlots(pf);   // 30 px right of v9 so its middle roof no longer covers the lane's first board (熱乾麵)
      boardAt(pfs.signRect,'戶部巷',484,{style:'plain',board:false,size:18});
      // D-10: the lane's near side is one continuous street (連續街屋) — shops stepping in and out, a gate into the 里弄, a corner house at the far
      // end, a paler second rank behind; the second row is a shorter street of the same kind, paler; the third is two roofs and a shop as before.
      // A row's z is its far (lowest) ground line, so everyone standing in the lane in front of it stays in front of it.
      row({x:4480,y:428,w:400,rise:58,z:362,kind:'hubuxiang',h:Math.round(98*ctx.depth(428)),signs:['熱乾麵','豆皮','蔡林記','四季美'],depth:34,jimo:true});   // round 6 (B5 tell 3): the front row alone carries the 積墨 under its eaves; D-18: 蔡林記 on the lane
      row({x:4530,y:352,w:300,rise:46,z:300,kind:'hubuxiang',h:Math.round(84*ctx.depth(352)),signs:['湯包'],pale:0.85,depth:28});   // D-08: the rows behind step paler, so the stack does not compete with the bridge; D-18: 四季美 here
      shopRow({x:4460,y:296,n:3,dx:-48,dy:-9,w:[40,44],h:[62,70],awn:0,pale:0.7,roofsFrom:1});
      hall({kind:'shopfront',x:4200,y:318,w:44,h:64,d:26,storeys:2,tb:3,pale:0.8}); hall({kind:'shopfront',x:4150,y:336,w:42,h:66,d:26,storeys:2,tb:3,pale:0.85});
      zone({kind:'road',poly:[[4560,442],[4110,378],[4110,432],[4560,496]],edges:[[[4560,442],[4110,378]],[[4560,496],[4110,432]]],wash:0,margin:7});
      // the rows stand on their own strips: kerb in front of each ground line, earth dissolving toward the lane
      feet([[4500,432],[4110,354]],32); feet([[4550,356],[4210,288]],26); feet([[4480,300],[4300,266]],20); feet([[4222,340],[4100,322]],18);
      // 中華路碼頭: the quay strip in front of the water line with its railings, steps to the water, the 趸船 and its 跳板, the docked 輪渡, a 海事艇, the ticket booth
      terr({kind:'street',pts:fx(4400,4110,function(x){ return LB(x)+4; }),depth:-24,ink:0.28,quay:true});
      terr({kind:'bank',pts:fx(4590,4400,function(x){ return LB(x)+3; }),depth:-18,ink:0.24});
      bankLn(fx(4596,4100,function(x){ return LB(x)+1; },6));
      var rl1=[]; for(x=4120;x<=4260;x+=8)rl1.push([x,LB(x)+5]); zone({kind:'railing',pts:rl1,h:11});
      var rl2=[]; for(x=4316;x<=4396;x+=8)rl2.push([x,LB(x)+5]); zone({kind:'railing',pts:rl2,h:11});
      hall({kind:'steps',x:4300,y:LB(4290)+30,w:30,n:10,dx:-1.6,dy:-2.9});
      hall({kind:'wharf',x:4335,y:230,len:128,dir:1,bank:[4357,252]});
      hall({kind:'hall',x:4416,y:302,w:26,h:22,d:18,roof:'xuanshan',tb:2,bays:1,front:['d']});
      sign({x:4403,y:302-22+9,text:'輪渡',size:10,w:30,h:14,z:304,board:'zhusha'});
      boat({x:4360,y:200,type:'ferry',len:220,dir:-1,moving:false});
      boat({x:4160,y:262,type:'haishi',len:68,dir:1,moving:true});
      group({kind:'queue',focus:[4357,252],zone:{pts:[[4357,254],[4330,272],[4290,284],[4250,302],[4218,326],[4180,346],[4142,364],[4112,380]]},n:11});
      group({kind:'stream',zone:{pts:[[4300,268],[4130,300]],w:9},density:2.5,mix:'quay'});
      // food stalls on the lane — 熱乾麵 3, 豆皮 2, 湯包 1 (steamer tower, one wisp of 淡墨); customers stand eating from bowls
      var stalls=[[4448,466,'vendorZhaoli',-1,3],[4300,470,'vendorZhaoli',1,2],[4166,458,'vendorZhaoli',-1,3],[4375,460,'vendor',1,2],[4232,472,'vendor',-1,3],[4492,452,'vendor',-1,2]];
      for(q=0;q<stalls.length;q++){ var s=stalls[q];
        if(s[2]==='vendor'){ agroup({kind:'vendorBowl',x:s[0],y:s[1],h:hOf(s[1]),dir:s[3],z:s[1],tint:R()<0.4?'indigo':'none'});   // D-10: vendor and customer meet on one bowl over the counter — one drawing
          group({kind:'episode',shape:'knot',focus:[s[0]-s[3]*hOf(s[1])*0.95,s[1]-2],n:s[4],roles:['eat','eat','stand'],mix:{eat:4,stand:1,phone:1}}); }   // the eaters standing round it
        else group({kind:'episode',shape:'knot',focus:[s[0],s[1]],n:s[4]+1,roles:[{pose:s[2],dir:s[3]},'buy','eat','eat','stand'],mix:{eat:4,stand:1,phone:1}}); }   // D-08 knots at the 蒸籠 stalls: the customer's hand meets the vendor's bowl
      extras.push(function(){ steamer(4478,446,454,5); wisp(4470,424); });
      group({kind:'stream',zone:{pts:[[4552,470],[4120,404]],w:14},density:4,mix:'street'});
      group({kind:'cluster',focus:[4410,342],n:3,mix:{stand:2,phone:2,queue:1}});
      tree(4128,298,120,'wutong',-1); tree(4172,292,112,'wutong',1); tree(4236,286,126,'wutong',-1); tree(4288,268,118,'wutong',1);
      tree(4548,330,124,'wutong',-1); tree(4520,440,138,'wutong',1); tree(4426,494,150,'wutong',-1); tree(4108,490,146,'wutong',1);
      tree(4120,306,96,'liu',-1); tree(4306,254,104,'liu',1); tree(4378,240,92,'liu',-1); tree(4470,228,88,'liu',1); tree(4530,192,84,'liu',-1); tree(4562,186,96,'liu',1); })();

    /* ================================================================ S3 武昌江灘 · 漢陽門 (4100–3760) — the breath */
    (function(){ var x, q, rl1=[], rl2=[];
      // the promenade strip in front of the water line, its railings on the edge, the water edge as one line
      terr({kind:'street',pts:fx(4100,3770,function(x){ return LB(x)+5; }),depth:-26,ink:0.28,quay:true}); bankLn(fx(4100,3768,function(x){ return LB(x)+1; },6));
      for(x=3925;x<=4092;x+=8)rl1.push([x,LB(x)+5]); zone({kind:'railing',pts:rl1,h:11});
      for(x=3778;x<=3868;x+=8)rl2.push([x,LB(x)+5]); zone({kind:'railing',pts:rl2,h:11});
      hall({kind:'steps',x:3905,y:LB(3890)+29,w:34,n:10,dx:-1.6,dy:-2.9});
      // the 江灘 lawn behind the flood wall: the kiosks stand on it just above the coping
      terr({kind:'bank',pts:[[4100,378],[3940,380],[3770,382]],depth:46,ink:0.2});
      hall({kind:'hall',x:3990,y:372,w:36,h:30,d:30,roof:'zanjian',tb:3,bays:2,front:['xx']});
      hall({kind:'hall',x:3840,y:374,w:28,h:22,d:18,roof:'xuanshan',tb:2,bays:1,front:['o']});
      hall({kind:'hall',x:4062,y:372,w:26,h:22,d:18,roof:'xuanshan',tb:2,bays:1,front:['o']});
      zone({kind:'floodwall',pts:[[3770,424],[4100,420]],h:42,gate:{x:3892,w:26}});
      zone({kind:'road',poly:[[4100,434],[3770,438],[3770,494],[4100,490]],edges:[[[4100,434],[3770,438]],[[4100,490],[3770,494]]],wash:0,margin:7});
      feet([[4100,428],[3770,432]],20,{ink:0.2});
      // 頂推船隊 1+4 going downstream, the far 「知音號」, a 海事艇
      boat({x:4041,y:218,type:'barge',len:148,dir:-1,moving:true}); boat({x:3893,y:220,type:'barge',len:148,dir:-1,moving:true});
      boat({x:4041,y:204,type:'barge',len:148,dir:-1,z:198,moving:true}); boat({x:3893,y:206,type:'barge',len:148,dir:-1,z:199,moving:true});
      boat({x:4190,y:222,type:'tug',len:150,dir:-1,moving:true});
      boat({x:3820,y:108,type:'louchuan',len:100,dir:-1,z:108,moving:true});
      boat({x:3990,y:256,type:'haishi',len:66,dir:-1,moving:true});
      // 冬泳隊: four heads in the water with 朱砂 float balls, six on the steps pointing at the bridge, watchers on the bank
      var sw=[[3868,286],[3852,279],[3891,277],[3836,290]]; for(q=0;q<4;q++)fig({x:sw[q][0],y:sw[q][1],h:52,pose:'swimmer',dir:R()<0.5?1:-1,z:sw[q][1],tint:'none'});
      group({kind:'stairs',zone:{pts:[[3888,LB(3890)+29],[3874,LB(3890)+3]],w:12,dir:[-1,0]},n:6,mix:{stand:2,squat:2,climb:1,point:2}},{pointDir:-1});
      group({kind:'cluster',focus:[3862,318],n:3,mix:{stand:3,phone:1,photo:1}});
      // kites: three flyers on the 江灘, lines rising into the blank silk over the river
      var kf=[[4030,346,3960,150],[3958,354,3880,132],[3802,342,3730,168]]; for(q=0;q<3;q++){ var kq=kf[q]; figAt(kq[0],kq[1],'pointing',-1); (function(kq){ extras.push(function(){ kite(kq[0]-14,kq[1]-34,kq[2],kq[3]); }); })(kq); }
      group({kind:'stream',zone:{pts:[[4092,354],[3778,358]],w:12},density:1.8,mix:'quay'});
      group({kind:'stream',zone:{pts:[[4092,464],[3778,468]],w:14},density:1.7,mix:'street'});
      group({kind:'cluster',focus:[3972,392],n:4,mix:'cluster'});
      treeRow(4088,3782,14,function(x){ return LB(x)+rr(6,26); },[80,140],['liu']);
      treeRow(4080,3790,6,function(){ return rr(494,499); },[140,170],['wutong']); })();

    /* ================================================================ S4 蛇山 · 黃鶴樓 (3760–3320) */
    (function(){ var x;
      // 蛇山: a hill body whose ridge is the river's near edge; 黃鶴樓 stands at its foot and the pines on its flank cut the 皴
      // D-17: 蛇山 runs deeper (136) so its toe reaches the 黃鶴樓's 台基 at y 366 — the tower stands ON the hill with its 宝顶 6 px under the top edge
      hillAt({pts:fx(3760,3236,function(x){ return LB(x)+2; }),depth:136,tone:'ink'});
      zone({kind:'road',poly:[[3760,442],[3330,446],[3330,494],[3760,490]],edges:[[[3760,442],[3330,446]],[[3760,490],[3330,494]]],wash:0,margin:7});
      feet([[3760,440],[3330,444]],22,{ink:0.2});
      // D-17 黃鶴樓: the full 360 px, w 140, the heaviest 界畫 on the scroll (the arch module's five bearing tiers); its 「黃鶴樓」 board from the returned signRect,
      // 朱砂-bordered; the side pavilions (白雲閣 stand-in, the 小閣, the 山門 hall) one grade paler; no tree may cross the storeys — only the 台基 (below)
      var hhl=hall({kind:'huanghelou',x:3585,y:366,w:140,h:360,sign:'黃鶴樓',tiles:'ochre'}), hs=silentSlots(hhl);
      boardAt(hs.signRect,'黃鶴樓',hhl.y+2,{board:'zhusha',size:14});
      // D-19 (4): three small 朱砂 marks on the tower's 柱額 — two on the main storey's 額枋 either side of the board, one over the ground-storey door — the only red on the hill
      extras.push(function(){ var m=hs.storeys[2], g0=hs.storeys[0], mk=[[m.x0+(m.x1-m.x0)*0.16,m.y1+12.5],[m.x1-(m.x1-m.x0)*0.16,m.y1+12.5],[(g0.x0+g0.x1)/2,g0.y1+11.5]], q;
        for(q=0;q<mk.length;q++){ var mx=mk[q][0], my=mk[q][1], hw=rr(1.6,2.4); ctx.wash(ST.INDIGO,[[mx-hw,my-0.8],[mx+hw,my-0.8],[mx+hw,my+0.8],[mx-hw,my+0.8]],C.zhusha,0.55,0.9,0.9,hhl.y+1); } });
      hall({kind:'qingchuange',x:3712,y:284,w:60,h:110,tiers:3,tb:6,pale:0.8});
      hall({kind:'hall',x:3660,y:378,w:30,h:26,d:26,roof:'zanjian',tb:3,bays:2,front:['xx'],pale:0.8});
      hall({kind:'hall',x:3700,y:436,w:62,h:36,d:36,roof:'xieshan',dougong:true,tb:4,bays:3,dingding:true,pale:0.85});
      // the long stair climbs from the road to the right end of the 台基; the 18 climbers on it (D-17)
      hall({kind:'steps',x:3672,y:442,w:26,n:14,dx:-4.6,dy:-5.0});
      group({kind:'stairs',zone:{pts:[[3660,442],[3604,374]],w:8},n:18,mix:{climb:6,stand:0.8,point:0.5,child:0.6,stick:0.4,photo:0.5}});
      group({kind:'cluster',focus:[3500,386],n:6,mix:'cluster'}); figAt(3684,298,'photographer',-1); figAt(3704,294,'stand',-1); figAt(3668,300,'phone',1);   // the cluster at the foot of the tower's 石階
      group({kind:'cluster',focus:[3676,440],n:4,mix:{stand:2,phone:1,photo:2,tourist:1}});
      group({kind:'stream',zone:{pts:[[3750,466],[3338,470]],w:14},density:3,mix:'street'});
      treeRow(3740,3420,8,function(x){ return LB(x)+rr(6,30); },[90,130],['song']);
      // the near pines stand beside the tower, not before it: left of the 台基 and among the pavilions on the right
      tree(3406,392,116,'song',-1); tree(3352,442,84,'song',1); tree(3690,410,108,'song',-1); tree(3412,430,84,'song',1); tree(3400,360,100,'song',-1); tree(3742,420,96,'song',1);   // D-21 (B10 ④): the two pines left of the 台基 stood on the 桥头堡's new stair (x 3336–3374, y 330–362) — one moves into the gap between stair and 台基, the other below the stair's foot
      var s4t=treeRow(3750,3340,16,function(){ return rr(330,428); },[60,110],['za','huai','za']), q;
      // D-17 「清掉橫進第二、第三層窗廊的樹枝」: a tree in front of the tower whose crown would reach into the storeys is moved sideways off the body — it may occlude the 台基 only
      for(q=0;q<s4t.length;q++){ var tq=s4t[q]; if(tq.y<=hhl.y-2)continue; var cx=tq.x, cy=tq.y-tq.h*0.62, cw=tq.h*0.34, B=hs.bodyFp;
        if(B.inside(cx,cy)||B.inside(cx-cw,cy)||B.inside(cx+cw,cy)||B.inside(cx,tq.y-tq.h)||B.inside(cx,tq.y-tq.h*0.3)){ tq.x=cx<3515?B.x0-cw-rr(2,10):B.x1+cw+rr(2,10); } } })();

    /* ================================================================ S5 長江大橋 (3320–2560) — the peak */
    (function(){ var x, q;
      hall({kind:'bridge',x:BX,y:BY,spans:BN,span:BSPAN,rise:BRISE,trussH0:28,trussH1:22,water:bridgeWater,fadeFrom:5,approach:{right:0,left:0},pavilion:{right:true,left:true},train:{x:2848,n:7},z:BZ});   // D-21 (B10 ④): the arch module draws the train inside the truss (body on the rail surface, members crossing in front); main's own train() below is no longer called
      // the Wuchang bank under the near spans, 岸雜 in front of the piers, 龜山 pines round the far end
      terr({kind:'bank',pts:fx(3236,2600,function(x){ return LB(x)+3; }),depth:-16,ink:0.24}); bankLn(fx(3236,2600,function(x){ return LB(x)+1+(noise(x*0.045,5.5)-0.5)*5; },6));
      // round 10: a wide 淡赭 bank strip over the blank foreground under the near spans was tried twice (edge at the water, edge at the frame) and read as a diagonal
      // stripe / a lawn patch echoing the bridge, so the slope stays blank; the 岸雜 row is half willows now and two willows stand in the near foreground, crowns under the chord
      treeRow(3240,2700,8,function(x){ return LB(x)+rr(10,42); },[60,110],['liu','za','liu','huai']);
      tree(3104,480,112,'liu',-1); tree(2952,472,100,'liu',1);
      tree(2660,336,72,'song',-1); tree(2624,316,64,'song',1); tree(2440,258,86,'song',-1); tree(2632,286,78,'song',1); tree(2530,246,92,'song',-1); tree(2612,300,58,'song',1);   // D-21 (B10 ④): the Hanyang block (x 2545–2615, foot y 237) hid the pine at 2560,236 whole and cut the crown off the one at 2596,270 — moved to the 龜山 flank beside the tower and right of the block
      tree(2566,214,70,'song',-1); tree(2500,222,84,'song',1); tree(2470,236,66,'za',-1); tree(2640,262,60,'za',1);
      // under the bridge (D-07): three boat-and-pier episodes inside x 2700–3200, clean water 150 px before and after —
      // the folded-mast tug towing a barge pair through piers 2–4, the ferry crossing behind piers 6–7 with people at its rail, a 划子 by pier 1
      var bgA=boat({x:3170,y:350,type:'barge',len:140,dir:-1,moving:true}); boat({x:3170,y:338,type:'barge',len:140,dir:-1,z:332,moving:true});
      // D-12 (2): the tug is passing THROUGH the bridge hole — its clearance is the room between its waterline and the underside of the deck beam (the truss's
      // bottom chord yB) at its stern end, where the climbing beam is lowest; the boat module drops the storeys above it and lays the mast and funnel flat
      boat({x:2990,y:347,z:322,type:'tug',len:150,dir:-1,moving:true,clearance:347-yB(2990)-2,tow:true,towTo:[bgA.x-bgA.len+2,bgA.y-7]});
      boat({x:2880,y:292,type:'ferry',len:230,dir:-1,moving:true});
      boat({x:3230,y:394,type:'huazi',len:48,dir:1});
      // the road deck: knots joined by pulsed streams (D-07) — the tour group scattered by a wrong-way e-bike at mid-span, a photographer's
      // knot at the rail near the Wuchang end, a vendor's knot at the Hanyang end; e-bikes, a bus; the train on the rail deck
      var railPts=[[3294,yD(3294)-4],[2586,yD(2586)-4]], focus=[2618,236], NZ=BZ+8, FZ=BZ+2;
      // people on the deck are drawn at the boats' scale (0.58 of a shore figure): the truss is 28 px, a shore figure 55
      var DS=0.58, mx=2856;   // D-10: the incident sits left of the tug's folded mast, which rises through the crowd at 2915–2960
      // D-08 weight-bearing deck: the crowd grammar spreads feet ±0.25 h round the line it is given; on the deck that spread is projected onto the
      // deck's breadth — near edge yD+0.5 (the bridge's receiving line) to the far kerb yD+OY — so no foot lands in the truss and the nearer figure
      // (larger y, higher z from the grammar) stays in front. Rail leaners (waist-up at the rail top) are left where the grammar put them.
      function onDeck(g){ var k, f; for(k=0;k<g.length;k++){ f=g[k]; if(f.pose==='rail')continue; var d=yD(f.x), h=f.h||30, rel=clamp((f.y-d+0.25*h)/(0.5*h),0,1); f.y=d+0.5+OY*0.9*(1-rel); } return g; }
      // the three incidents, each its own silhouette: the wrong-way e-bike (a broken ring — recoil, block, yield, a gap on the deck's right side, two
      // looking back), the photographers (a low clump at the rail), the vendor (a knot of stacked heads with a short queue tail); the scattered tour group
      // regathers as a plain cluster beside the ring
      // D-10 action groups: the wrong-way e-bike is one drawing — rider braking, the blocker's hand planted on its handlebar, the yielder stepping off with a hand
      // on the blocker's shoulder, a bystander behind — with two looking back on its right and the scattered tour group regathering on its left; the
      // photographers are three leaning on one rail with a photographer crouched beside them; the vendor hands a bowl across his counter, eaters round it
      function hD(x){ return hOf(yD(x))*DS; }
      agroup({kind:'ebike',x:mx,y:yD(mx)+0.5,h:hD(mx),dir:1,z:NZ,tint:'indigo'});
      onDeck(group({kind:'episode',zone:{z:NZ,dir:[-1,0]},focus:[mx+66,yD(mx+66)],n:4,spread:1.0,roles:['look','look','tourist'],mix:{tourist:2,phone:1}},{flags:1,hScale:DS}));
      onDeck(group({kind:'cluster',zone:{z:NZ},focus:[mx-80,yD(mx-80)],n:5,mix:{tourist:4,stand:1,flag:1}},{flags:1,hScale:DS}));
      agroup({kind:'railLean',x:3186,y:yD(3186)+0.5,h:hD(3186),dir:-1,z:NZ,tint:'none'});
      onDeck(group({kind:'episode',zone:{z:NZ},focus:[3232,yD(3232)-2],n:3,spread:1.0,roles:[{pose:'photo',dir:-1},'squat','photo']},{hScale:DS}));
      agroup({kind:'vendorBowl',x:2664,y:yD(2664)+0.5,h:hD(2664),dir:1,z:NZ,tint:'none'});
      onDeck(group({kind:'episode',zone:{z:NZ},focus:[2664+hD(2664)*1.3,yD(2664+40)],n:4,spread:1.0,roles:['eat','eat','stand'],mix:{stand:2,eat:2,phone:1}},{hScale:DS}));
      group({kind:'rail',zone:{pts:railPts,z:NZ},focus:focus,n:34,mix:{rail:4,point:2}},{hScale:DS});
      onDeck(group({kind:'stream',zone:{pts:[[3286,yD(3286)+5],[2594,yD(2594)+5]],w:2,z:NZ},density:5.8,mix:'bridge'},{hScale:DS}));
      onDeck(group({kind:'stream',zone:{pts:[[3284,yD(3284)-5],[2596,yD(2596)-5]],w:2,z:FZ},density:5.0,mix:'bridge'},{hScale:DS}));
      var eb=[3230,3110,2800,2720]; for(q=0;q<4;q++)fig({x:eb[q],y:yD(eb[q])+0.5,h:hOf(yD(eb[q]))*DS,pose:'rideEbike',dir:-1,z:NZ,prop:q%2?'box':undefined,tint:R()<0.4?'indigo':'none'});
      box(2978,yD(3002)-15,3022,yD(2978)+0.5,NZ); extras.push(function(){ bus(3000,yD(3000)+0.5,-1,NZ,175); });
      // 晴川閣 terrace turned toward the bridge; a few on the near bank under the bridge looking up, at the deck's scale
      group({kind:'stream',zone:{pts:[[2496,304],[2404,306]],w:3},n:8,mix:{stand:3,point:3,photo:1,phone:1}},{lookX:2620});
      group({kind:'cluster',focus:[3210,LB(3210)+18],n:3,mix:{stand:2,point:2,photo:1}},{lookX:2900,hScale:0.62});
      group({kind:'cluster',focus:[2600,350],n:4,mix:{stand:3,point:2,photo:2,tourist:1}},{hScale:0.8}); group({kind:'cluster',focus:[3300,382],n:4,mix:{stand:2,photo:2,tourist:2,phone:1}},{hScale:0.66}); })();   // D-21 (B10 ④): the 桥头堡's abutment now runs 32 px under the deck (foot y 362), so the watchers stand at its foot, not inside its wall

    /* ================================================================ S6 龜山 · 晴川閣 · 鐵門關 (2560–2160) */
    (function(){ var x;
      // 龜山: the hill body under the TV tower and 晴川閣, its ridge the river's edge
      hillAt({pts:fx(2600,2165,function(x){ return LB(x)+3; }),depth:92,tone:'ink'});
      hall({kind:'tvtower',x:2540,y:262,h:285,z:262});
      hall({kind:'qingchuange',x:2500,y:300,w:96,h:140,tb:18});
      zone({kind:'floodwall',pts:[[2286,400],[2378,400]],h:58,gate:{x:2332,w:26,drop:12}});
      hall({kind:'hall',x:2370,y:342,w:72,h:30,d:36,roof:'xieshan',dougong:true,tb:0,bays:3,z:402,tiles:'grey',chiwen:true});
      hall({kind:'hall',x:2252,y:336,w:68,h:34,d:40,roof:'xieshan',dougong:true,tb:4,bays:3,dingding:true});
      hall({kind:'hall',x:2196,y:300,w:56,h:30,d:34,roof:'xuanshan',tb:3,bays:2});
      hall({kind:'hall',x:2332,y:308,w:40,h:26,d:24,roof:'xuanshan',tb:3,bays:2}); hall({kind:'hall',x:2452,y:392,w:44,h:26,d:26,roof:'xuanshan',tb:3,bays:2}); hall({kind:'hall',x:2212,y:398,w:46,h:28,d:26,roof:'xuanshan',tb:3,bays:2});
      hall({kind:'paifang',x:2426,y:404,w:64,h:68});
      zone({kind:'road',poly:[[2560,442],[2165,446],[2165,494],[2560,490]],edges:[[[2560,442],[2165,446]],[[2560,490],[2165,494]]],wash:0,margin:7});
      feet([[2560,410],[2165,412]],30,{ink:0.22});
      boat({x:2300,y:196,type:'huazi',len:50,dir:-1});
      group({kind:'stream',zone:{pts:[[2552,466],[2172,470]],w:14},density:2.5,mix:'street'}); group({kind:'cluster',focus:[2220,342],n:3,mix:'cluster'});
      group({kind:'cluster',focus:[2332,404],n:4,mix:'cluster'}); group({kind:'cluster',focus:[2394,406],n:3,mix:{stand:3,tourist:2,photo:1}});
      group({kind:'stream',zone:{pts:[[2450,332],[2200,352]],w:7},density:2.2,mix:'park'});
      treeRow(2590,2170,14,function(x){ return LB(x)+rr(8,40); },[70,120],['song']);
      // D-16 (B8 tell 5): the 晴川閣 tree — the second of the row under the pavilion, a 杂 — carries the knot AND the weave together: the knot's twigs start on
      // the limb and branch into twiglets, the woven arcs round it, the through-gap beside the knot kept open (the 東湖 grove keeps feature / weave apart as before)
      var qct=treeRow(2560,2180,8,function(){ return rr(340,420); },[60,100],['za','huai']); qct[1].kind='za'; qct[1].feature=true; qct[1].weave=true; })();

    /* ================================================================ S7 漢江 · 南岸嘴 · 龍王廟 (2160–1800) */
    (function(){ var q;
      // 南岸嘴: the grass point between the two rivers — bank strips along the 長江 edge and down the 漢江's right edge, one water line round the tip
      terr({kind:'bank',pts:fx(2165,2024,function(x){ return LB(x)+3; }),depth:-14,ink:0.24});
      terr({kind:'bank',pts:fy(226,380,function(y){ return REx(y)+2; }),depth:14,ink:0.24});
      bankLn(fx(2165,2024,function(x){ return LB(x)+1; },6).concat(fy(228,384,function(y){ return REx(y)+1; },6)));
      // 集家嘴: the water edge above the wall, then one continuous 防洪牆 with three 閘口 down to the bottom edge, its quay strip at its foot
      terr({kind:'bank',pts:fy(156,258,function(y){ return LEx(y)-2; }),depth:-12,ink:0.22}); bankLn(fy(156,262,function(y){ return LEx(y)-1; },6));
      zone({kind:'floodwall',pts:[[LEx(262)-4,262],[LEx(502)-4,502]],h:36,gates:[{x:LEx(318)-4,w:22},{x:LEx(396)-4,w:24,drop:8},{x:LEx(466)-4,w:22}]});
      terr({kind:'street',pts:fy(262,500,function(y){ return LEx(y)-6; }),depth:-30,ink:0.28,quay:true});
      hall({kind:'hall',x:1946,y:262,w:66,h:36,d:40,roof:'xieshan',dougong:true,tb:4,bays:3,dingding:true,chiwen:true});
      hall({kind:'paifang',x:1914,y:322,w:56,h:60});
      feet([[1948,266],[1830,262]],22,{ink:0.22}); feet([[1930,326],[1820,320]],18,{ink:0.2});
      var mh=hall({kind:'hall',x:1912,y:198,w:52,h:26,d:24,roof:'xuanshan',tiles:'grey',tb:2,bays:2,front:['dw']}); boardOn(mh,12,'集家嘴');
      hall({kind:'wharf',x:1855,y:142,len:128,dir:1,bank:[1877,162]});
      boat({x:2104,y:384,type:'duchuan',len:84,dir:-1,moving:true});
      boat({x:2140,y:186,type:'barge',len:140,dir:-1}); boat({x:2060,y:130,type:'barge',len:140,dir:-1,moving:true}); boat({x:2256,y:150,type:'tug',len:150,dir:-1,moving:true});
      boat({x:1912,y:110,type:'huazi',len:50,dir:1});
      group({kind:'stream',zone:{pts:[[2062,482],[1992,404],[1938,334],[1908,272]],w:9},density:4,mix:'quay'});
      group({kind:'cluster',focus:[1912,268],n:4,mix:'cluster'});
      group({kind:'queue',focus:[1877,162],zone:{dir:[0.5,0.85]},n:5});
      for(q=0;q<8;q++)tree(REx(190+q*22)+rr(6,16),190+q*22+rr(-4,4),rr(26,44),'luwei',-1);
      treeRow(2150,2030,5,function(x){ return LB(x)+rr(8,24); },[70,110],['liu']); tree(1834,164,90,'liu',-1); tree(1862,182,84,'liu',1); tree(1990,308,96,'liu',-1);
      tree(2090,436,110,'za',1); tree(1880,300,86,'huai',-1); tree(1836,240,80,'za',1); tree(2130,310,70,'za',-1); })();

    /* ================================================================ S8 集家嘴 · 漢正街 (1800–1350) */
    (function(){ var q;
      // row A faces the viewer across the oblique street; row B is the near side, roofs only; row C the far shops at the upper left; 里份 behind row A
      // D-10: row A is one continuous 漢正街 street climbing the oblique (its z the far ground line), row C a shorter one above, the 里份 one 石庫門 row
      row({x:1812,y:458,w:360,rise:126,z:334,kind:'hanzhengjie',h:Math.round(90*ctx.depth(458)),signs:['百貨','布'],depth:30,waterside:true});   // round 6: the 臨水 row — its side lanes step down to the 漢江
      roofRow({x:1660,y:500,n:7,dx:-40,dy:-14,w:[44,52]});
      row({x:1480,y:258,w:250,rise:70,z:190,kind:'hzrear',h:Math.round(68*ctx.depth(258)),pale:0.85});   // D-16 (B8 tell 3): the rear row is one run of joined single-storey houses (ARCH 'hzrear'), not a rank of façades
      row({x:1822,y:232,w:300,rise:18,z:214,kind:'lilong',h:Math.round(84*ctx.depth(232)),pale:0.9,depth:24});
      // the street: the band between row A's ground line and the near roofs
      function yA(x){ return 458-(1812-x)*0.35; } function yBt(x){ return x<=1660?460-(1660-x)*0.35:500; }
      var mid=[], x; for(x=1808;x>=1450;x-=40)mid.push([x,(yA(x)+Math.min(yBt(x),500))/2-2]);
      var edge=[]; for(x=1812;x>=1450;x-=30)edge.push([x,yA(x)+3]);
      zone({kind:'road',poly:[[1812,461],[1450,334],[1450,364],[1660,462],[1812,499]],edges:[edge],wash:0,margin:6});
      feet([[1830,464],[1640,398],[1450,338]],34); feet([[1500,262],[1350,222]],22); feet([[1830,238],[1520,220]],24,{ink:0.22}); terr({kind:'bank',pts:[[1812,372],[1640,330],[1500,296]],depth:-40,ink:0.1});
      // D-07: 漢正街 thinned to ≤ 12 per 100 px — the 扁擔 stream in pulses, six stalls with a bargain at two of them, one 三輪
      // D-10: the two bargains are action groups (four hands on one bag, both heads bent to it) with a couple standing by; two pairs of porters carry one
      // load each under a shared pole down the street; the other stalls keep their keeper and a customer or two
      var vd=[[1770,468,-1],[1660,432,1],[1560,398,-1],[1470,356,1],[1700,482,-1],[1590,442,1]];
      for(q=0;q<vd.length;q++){ figAt(vd[q][0],vd[q][1],q%3===2?'squatSeller':'vendor',vd[q][2]);
        if(q<2){ agroup({kind:'bargain',x:vd[q][0]+vd[q][2]*hOf(vd[q][1])*0.55,y:vd[q][1]-1,h:hOf(vd[q][1]),dir:vd[q][2],z:vd[q][1]-1,tint:R()<0.4?'indigo':'none'}); group({kind:'cluster',focus:[vd[q][0]+vd[q][2]*hOf(vd[q][1])*1.25,vd[q][1]-4],n:2,mix:{stand:3,phone:1,basket:1}}); }
        else group({kind:'cluster',focus:[vd[q][0]+vd[q][2]*10,vd[q][1]-2],n:2,mix:{stand:3,phone:1,basket:1,dan:0.6}}); }
      agroup({kind:'porters',x:1620,y:yA(1620)+16,h:hOf(yA(1620)+16),dir:-1,z:yA(1620)+16,tint:'none'});
      agroup({kind:'porters',x:1500,y:yA(1500)+22,h:hOf(yA(1500)+22),dir:1,z:yA(1500)+22,tint:'ochre'});
      group({kind:'stream',zone:{pts:mid,w:22},density:5,mix:{walk:4,dan:4,cart:1.5,porter:1,bag:1,stand:0.6,phone:0.4,talk:0.6,basket:0.6,child:0.4}},{bags:true,dan:14});
      group({kind:'stream',zone:{pts:[[1472,286],[1354,258]],w:6},density:3.5,mix:{walk:4,dan:2,stand:1}},{bags:true,dan:3});
      figAt(1520,468,'sanlun',-1);
      // mahjong at a doorway: four round one table, drawn once
      figAt(1734,478,'mahjong',-1,{table:true}); figAt(1718,470,'mahjong',1,{table:false}); figAt(1748,470,'mahjong',-1,{table:false}); figAt(1732,464,'mahjong',1,{table:false});
      tree(1790,499,150,'wutong',-1); tree(1712,499,146,'wutong',1); tree(1538,386,120,'wutong',-1); tree(1500,370,116,'wutong',1); tree(1440,350,112,'wutong',-1); tree(1370,394,132,'wutong',1); tree(1560,268,84,'wutong',-1); tree(1420,248,80,'wutong',1); })();   // D-14 (tell 3): the tree that stood at 1600 moved to 1538 — off the through unit (1593–1649) and its lane (1575–1593)

    /* ================================================================ S9 江漢關 · 武漢關碼頭 · 江漢路 (1350–820) */
    (function(){ var x, pts=[], rl1=[];
      var jhg=hall({kind:'jianghanguan',x:1345,y:396,w:150,h:82,d:46,tw:62,sign:'江漢關'}), jhs=silentSlots(jhg);
      boardAt(jhs.signRect,'江漢關',398,{board:'zhusha',size:14});   // D-18: on the arch module's framed board on the tower's first tier, 朱砂-bordered
      boardAt(jhs.wharfSign,'武漢關',398,{board:false,style:'plain',size:10,tight:false});   // the wharf's 「武漢關」 post: the characters on the arch module's own 12×34 板
      terr({kind:'street',pts:fx(1312,1000,function(x){ return 122+(noise(x*0.02,1.1)-0.5)*3; }),depth:-38,ink:0.28,quay:true}); bankLn(fx(1314,1000,function(x){ return 119+(noise(x*0.02,1.1)-0.5)*3; },6));
      for(x=1004;x<=1116;x+=8)rl1.push([x,124]); zone({kind:'railing',pts:rl1,h:11});
      zone({kind:'floodwall',pts:[[1010,168],[1190,166]],h:34,gate:{x:1100,w:28}});
      hall({kind:'hall',x:1062,y:134,w:56,h:28,d:26,roof:'xuanshan',tiles:'grey',tb:2,bays:2});
      hall({kind:'wharf',x:1250,y:110,len:120,dir:1,bank:[1272,130]});
      boat({x:1290,y:100,type:'ferry',len:176,dir:1,moving:true}); boat({x:1080,y:58,type:'louchuan',len:120,dir:-1,z:58,moving:true});   // D-08: the arriving ferry shorter and off the tower's axis, so 江漢關 is not capped by a second mass
      group({kind:'queue',focus:[1272,130],zone:{pts:[[1272,132],[1236,142],[1196,152],[1150,160]]},n:7});
      group({kind:'stream',zone:{pts:[[1300,140],[1020,146]],w:6},density:3,mix:'quay'});
      // 江漢路: 租界 fronts across the street (row 1), roofs on the near side, a far row above; the named shops among them
      // D-10: 江漢路 is one continuous street of 租界 colonnades and shops climbing the oblique, a second one above it, paler; the named shops are its boards
      row({x:1180,y:440,w:360,rise:132,z:310,kind:'jianghanlu',h:Math.round(100*ctx.depth(440)),signs:['老通城','葉開泰'],hang:['藥'],depth:34});   // D-18: 蔡林記 moved to 戶部巷; the hung 牌 here is the 藥 the rear 漢正街 row lost
      roofRow({x:1100,y:500,n:6,dx:-58,dy:-22,w:[54,64]});
      row({x:1180,y:272,w:280,rise:100,z:174,kind:'jianghanlu',h:Math.round(72*ctx.depth(272)),signs:['四季美'],pale:0.8,depth:26});
      function yA(x){ return 440-(1180-x)*0.367; } function yBt(x){ return x<=1100?462-(1100-x)*0.38:500; }
      var mid=[]; for(x=1180;x>=830;x-=50)mid.push([x,(yA(x)+Math.min(yBt(x),500))/2-2]);
      var edge=[]; for(x=1180;x>=830;x-=30)edge.push([x,yA(x)+3]);
      zone({kind:'road',poly:[[1180,443],[830,315],[830,345],[1100,466],[1180,499]],edges:[edge],crossings:[{x:1000,y:392,n:6,ang:-0.35}],treepits:[{x:1040,y:415,s:11},{x:930,y:372,s:11}],wash:0,margin:7});
      feet([[1200,446],[1000,372],[830,312]],34); feet([[1200,278],[940,184]],26); feet([[1360,400],[1190,400]],30,{ink:0.2});
      group({kind:'ring',focus:[1268,452],n:10,r:hOf(452)*1.4,watchers:3},{ring:true});
      group({kind:'stream',zone:{pts:mid,w:24},density:3.5,mix:'street'});
      group({kind:'stream',zone:{pts:[[1176,288],[962,208]],w:6},density:2.5,mix:'street'});
      group({kind:'cluster',focus:[1270,398],n:3,mix:'cluster'}); group({kind:'episode',focus:[1010,yA(1010)+4],n:3,roles:['eat','eat','stand'],mix:{eat:4,stand:1,phone:1}});   // eating outside 蔡林記's end of the row
      tree(1040,415,138,'wutong',-1); tree(930,372,126,'wutong',1); tree(1130,428,144,'wutong',1); tree(870,346,118,'wutong',-1);
      tree(1160,262,96,'wutong',-1); tree(1050,236,92,'wutong',1); tree(950,214,88,'wutong',-1); tree(1395,472,140,'wutong',1); tree(1005,499,150,'wutong',-1); tree(905,499,146,'wutong',1); tree(1215,300,80,'wutong',-1); tree(870,230,80,'wutong',1); })();

    /* ================================================================ S10 中山大道 · 里份 (820–420): ends on a doorway cut in half */
    (function(){
      row({x:812,y:356,w:420,rise:0,z:356,kind:'lilong',h:Math.round(110*ctx.depth(356)),depth:30,edge:true});   // D-10: one 石庫門 row with 天井 gaps and the passage between the pairs; the picture edge cuts its last doorway
      // D-12 (4): of the two tall buildings at 漢陽 the nearer one is a 轉角街屋 at the street corner — 騎樓 arcade along the main street, a chamfered entrance bay, its
      // own side face receding down the side street under a 歇山 roof that turns the corner; the other is a colonnade pinned to a different ending and window rhythm
      hall({kind:'cornerHouse',x:770,y:262,w:96,d:56,h:74,storeys:3,z:262}); hall({kind:'colonnade',x:560,y:258,w:66,h:70,d:34,storeys:2,bays:3,ending:'parapet',pattern:'pair',storeyK:0.92});
      roofRow({x:800,y:500,n:2,dx:-160,dy:0,w:[60,66]});
      zone({kind:'road',poly:[[820,362],[430,364],[430,452],[820,450]],edges:[[[820,362],[430,364]]],crossings:[{x:560,y:428,n:6,ang:0}],busstop:{x:690,y:448,h:40},wash:0,margin:7});
      feet([[830,364],[430,368]],30); feet([[830,266],[500,262]],24);
      box(694,432,740,447,449); extras.push(function(){ bus(717,447,-1,449,200); });
      group({kind:'queue',focus:[690,450],zone:{dir:[1,0.05]},n:6,mix:{queue:4,stand:2,phone:2}});
      group({kind:'stream',zone:{pts:[[814,408],[436,412]],w:18},density:5.5,mix:'street'});
      group({kind:'cluster',focus:[552,360],n:4,mix:'cluster'}); group({kind:'cluster',focus:[768,362],n:3,mix:{stand:2,talk:2,phone:1}});
      tree(760,499,150,'wutong',-1); tree(640,499,146,'wutong',1); tree(556,372,110,'wutong',-1); tree(480,376,104,'wutong',1); })();

    /* ================================================================ marks drawn by main: the train, buses, steamer towers, steam, kites */
    // D-12 (b) colour by face: light comes from the upper right for the whole scroll, so a box main paints (bus body, carriage, steamer) keeps the silk toward its
    // right end and gathers its colour toward the left, shaded end — the wash is laid as dabs kept by a predicate that falls off along x
    function washFace(st,poly,c,ink,step,rad,z){ var x0=1e9,x1=-1e9,y0=1e9,y1=-1e9, q; for(q=0;q<poly.length;q++){ x0=Math.min(x0,poly[q][0]); x1=Math.max(x1,poly[q][0]); y0=Math.min(y0,poly[q][1]); y1=Math.max(y1,poly[q][1]); }
      ctx.dabs(st,{x0:x0,x1:x1,y0:y0,y1:y1,z:z,inside:ctx.polyInside(poly),edge:ctx.polyEdge(poly)},c,ink,step,rad,function(x,y){ var u=(x-x0)/Math.max(1,x1-x0); return R()<1.05-0.95*ctx.smoothstep(0.3,1,u); }); }
    function train(xHead,n){ var carL=38, gap=2.2, q;
      for(q=0;q<n;q++){ var xa=xHead+q*(carL+gap), xb=xa+carL, f=0.85, top=function(x){ return yB(x)-13.5; }, bot=function(x){ return yB(x)-5.4; };
        ctx.rline(ST.JIEHUA,xb,C.ink,150*f,0.7,xa+(q===0?2.2:0),top(xa),xb,top(xb),BZ,0.4); ctx.rline(ST.JIEHUA,xb,C.ink,120*f,0.55,xa,bot(xa)-2.6,xb,bot(xb)-2.6,BZ,0.2);
        ctx.rline(ST.JIEHUA,xa,C.ink,140*f,0.65,xa,bot(xa),xa+(q===0?2.2:0),top(xa),BZ,0.3); ctx.rline(ST.JIEHUA,xb,C.ink,140*f,0.65,xb,bot(xb),xb,top(xb),BZ,0.3);
        for(var wx=xa+3.5;wx<xb-2;wx+=rr(4.2,4.8))ctx.rline(ST.JIEHUA,wx,C.ink,rr(60,85)*f,0.45,wx,top(wx)+1.6,wx,top(wx)+5.2,BZ,0);
        washFace(ST.INDIGO,[[xa,top(xa)+0.5],[xb,top(xb)+0.5],[xb,bot(xb)-0.5],[xa,bot(xa)-0.5]],C.danmo,0.16,2.2,2.2,BZ); } }
    function bus(x,y,dir,z,al){ var L=44, h=15, x0=x-L/2, x1=x+L/2, top=y-h, q;
      ctx.rline(ST.JIEHUA,x1,C.ink,al,0.75,x0+1,top,x1-1,top,z,0.5); ctx.rline(ST.JIEHUA,x1,C.ink,al*0.9,0.7,x0,y-1.2,x1,y-1.2,z,0.4);
      ctx.pline(ST.JIEHUA,x0+1,C.ink,al,0.7,[[x0+1,top],[x0+0.2,top+2],[x0,y-1.2]],true); ctx.pline(ST.JIEHUA,x1,C.ink,al,0.7,[[x1-1,top],[x1-0.2,top+2],[x1,y-1.2]],true);
      for(q=0;q<6;q++){ var wx=x0+4+q*6.6; ctx.rline(ST.JIEHUA,wx+4.6,C.ink,al*0.7,0.5,wx,top+2.2,wx+4.6,top+2.2,z,0); ctx.rline(ST.JIEHUA,wx+4.6,C.ink,al*0.7,0.5,wx,top+8,wx+4.6,top+8,z,0); ctx.rline(ST.JIEHUA,wx,C.ink,al*0.6,0.45,wx,top+2.2,wx,top+8,z,0); ctx.rline(ST.JIEHUA,wx+4.6,C.ink,al*0.6,0.45,wx+4.6,top+2.2,wx+4.6,top+8,z,0); }
      ctx.rline(ST.JIEHUA,x1,C.ink,al*0.6,0.5,x0+1,y-5.4,x1-1,y-5.4,z,0);
      [x0+8,x1-8].forEach(function(cx){ var pts=[]; for(q=0;q<=10;q++){ var a=Math.PI+Math.PI*q/10; pts.push([cx+Math.cos(a)*3.4,y-1.2+Math.sin(a)*3]); } ctx.pline(ST.JIEHUA,cx+3.4,C.ink,al*0.9,0.65,pts,true); });
      washFace(ST.OCHRE,[[x0+0.5,top+0.5],[x1-0.5,top+0.5],[x1-0.5,y-1.6],[x0+0.5,y-1.6]],C.ochre,0.24,2.2,2.2,z);
      darkPlane([[x0+1,y-1.4],[x1-1,y-1.4]],0,2.2,0.2,z); }
    function steamer(x,y,z,n){ var q, rx=6.5, ry=1.6;
      ctx.rline(ST.JIEHUA,x+7.5,C.ink,180,0.7,x-7.5,y,x+7.5,y,z); ctx.rline(ST.JIEHUA,x+7.5,C.ink,170,0.7,x-7.5,y-6,x+7.5,y-6,z); ctx.rline(ST.JIEHUA,x-7.5,C.ink,160,0.65,x-7.5,y-6,x-7.5,y,z); ctx.rline(ST.JIEHUA,x+7.5,C.ink,160,0.65,x+7.5,y-6,x+7.5,y,z);
      washFace(ST.INDIGO,[[x-7,y-5.5],[x+7,y-5.5],[x+7,y-0.5],[x-7,y-0.5]],C.danmo,0.3,2,2,z);
      for(q=0;q<n;q++){ var yb=y-6.5-q*3.8, yt=yb-3.4, pts=[], k; for(k=0;k<=12;k++){ var a=Math.PI+Math.PI*k/12; pts.push([x+Math.cos(a)*rx,yt+Math.sin(a)*ry]); }
        ctx.rline(ST.JIEHUA,x-rx,C.ink,rr(150,180),0.6,x-rx,yb,x-rx,yt,z,0.2); ctx.rline(ST.JIEHUA,x+rx,C.ink,rr(150,180),0.6,x+rx,yb,x+rx,yt,z,0.2);
        ctx.pline(ST.JIEHUA,x+rx,C.ink,rr(140,170),0.55,pts,true); ctx.rline(ST.JIEHUA,x+rx,C.ink,rr(90,120),0.45,x-rx+0.5,yb-0.6,x+rx-0.5,yb-0.6,z,0);
        washFace(ST.OCHRE,[[x-rx+0.5,yt+0.4],[x+rx-0.5,yt+0.4],[x+rx-0.5,yb-0.4],[x-rx+0.5,yb-0.4]],C.ochre,0.2,2,2,z); } }
    function wisp(x,y){ ctx.pline(ST.INDIGO,x+3,C.danmo,26,3.2,[[x,y],[x-2,y-6],[x+1.5,y-12],[x-1,y-19],[x+2.5,y-27],[x+1,y-36]],true); ctx.pline(ST.INDIGO,x+3,C.danmo,18,1.6,[[x+3,y-4],[x+1,y-10],[x+4,y-18],[x+3,y-26]],true); }
    function kite(fx,fy,kx,ky){ var mid=[(fx+kx)/2+rr(-6,6),(fy+ky)/2+rr(4,12)];
      ctx.pline(ST.FIGURES,Math.max(fx,kx),C.ink,105,0.4,[[fx,fy],mid,[kx,ky+3]],true);
      ctx.bline(ST.FIGURES,kx+3,C.ink,205,0.6,[[kx,ky-3.5],[kx+3,ky],[kx,ky+3.5],[kx-3,ky],[kx,ky-3.5]]);
      ctx.bline(ST.FIGURES,kx+2,C.ink,150,0.45,[[kx,ky+3.5],[kx+2,ky+9],[kx-1,ky+15],[kx+1.5,ky+22]]);
      ctx.wash(ST.INDIGO,[[kx,ky-3],[kx+2.6,ky],[kx,ky+3],[kx-2.6,ky]],C.zhusha,0.5,1.4,1.4); }

    /* ================================================================ phase A: stamp everything solid */
    var hillFps=[], rails=[];
    for(i=0;i<hills.length;i++){ hillFps.push(TREE.hillFootprint(ctx,hills[i])); ctx.masks.stampZ(hillFps[i]); }   // hills first: what stands on a hill is nearer and cuts it
    for(i=0;i<arch.length;i++){ var afp=ARCH.footprint(ctx,arch[i]); ctx.masks.stampZ(afp); if(afp.rail)rails.push(afp.rail); }   // D-08: the whole silhouette, eave to 台基; the bridge's near rail is kept for after the figures
    for(i=0;i<rows.length;i++)ctx.masks.stampZ(ARCH.streetRowFootprint(ctx,rows[i]));   // D-10: a street row's union — fronts, flanks, gate wall, second-rank roofs
    for(i=0;i<boats.length;i++)ctx.masks.stampZ(BOAT.footprint(ctx,boats[i]));
    for(i=0;i<trees.length;i++)ctx.masks.stampZ(TREE.footprint(ctx,trees[i]));
    for(i=0;i<zones.length;i++){ var zfp=GROUND.footprint(ctx,{zone:zones[i]}), zsl=zfp.slices||[zfp]; for(j=0;j<zsl.length;j++)ctx.masks.stampZ(zsl[j]); }   // a receding wall per slice, so it does not hide its own near part
    for(i=0;i<signs.length;i++)ctx.masks.stampZ(TEXT.footprint(ctx,signs[i]));
    for(i=0;i<stamps.length;i++)ctx.masks.stampZ(stamps[i]);
    // the picture stops at x=425: everything left of it is blank silk, so the last 里份 doorway is cut in half
    ctx.masks.stampZ({x0:CWx,x1:424,y0:0,y1:H-1,z:65535,inside:function(){ return true; }});
    // the 引首 (x > 5020) is blank silk above the three treetops in the mist: a hill fold that walks off 磨山's ridge end must not hatch into it
    ctx.masks.stampZ({x0:5021,x1:W-1,y0:0,y1:186,z:65535,inside:function(){ return true; }});
    // crews and passengers from the seats the hulls carry; more hands at the folded-mast tug's winch, more passengers on the 漢江渡
    var seatFigs=[];
    for(i=0;i<boats.length;i++){ var bt=boats[i].bt, seats=bt.seats||[], d=bt.dir, L=bt.len, q;
      for(j=0;j<seats.length;j++){ var st=seats[j]; if(bt.type==='louchuan'&&st.y<bt.decks[2].y1)continue; if(!FIGURE.POSES[st.pose])continue;
        seatFigs.push({x:st.x,y:st.y,h:st.h,pose:st.pose,dir:st.dir,z:st.z,tint:R()<0.35?'indigo':'none'}); }
      if(bt.type==='tug'&&bt.clearance)for(q=0;q<2;q++){ var wx=bt.sternX+d*L*(0.13+0.13*q), wy=bt.deckY(wx)-bt.dw, wh=Math.min(36*ctx.depth(bt.y),wy-(bt.y-bt.clearance)-1);   // D-12 (2): the extra winch hands crouch under the beam too
        if(wh>=16)seatFigs.push({x:wx,y:wy,h:wh,pose:'winch',dir:d,z:bt.z,tint:'none'}); }
      if(bt.type==='duchuan')for(q=0;q<8;q++){ var sx=bt.sternX+d*L*(0.3+0.58*q/8)+rr(-3,3); seatFigs.push({x:sx,y:bt.deckY(sx)-bt.dw,h:36*ctx.depth(bt.y),pose:pick(['stand','phone','leanRail','ferryRail']),dir:R()<0.5?1:-1,z:bt.z,tint:R()<0.35?'indigo':'none'}); } }
    // crowd placements → figure-module poses
    var WALK=['walk1','walk2'], wk=0;
    var PMAP={stand:'stand',queue:'queue',phone:'phone',point:'pointing',eat:'eating',squat:'squat',sit:'sitStool',dan:'biandan',porter:'porter',basket:'womanBasket',cart:'cart',pushbike:'pushBike',ebike:'rideEbike',umbrella:'umbrella',stick:'oldStick',photo:'photographer',tourist:'tourist',run:'walk1',sweep:'sweeping',veg:'squatSeller',vendor:'vendor',pole:'poling',row:'rowing',rail:'leanRail',dance:'dancePair',bargain:'bargain',sanlun:'sanlun',recoil:'recoil',yield:'yield',block:'block',look:'look',buy:'buy',vendorZhaoli:'vendorZhaoli'};
    // D-08: recoil/block/look face the incident (+dir), yield walks away from it, look walks on with the head turned back — their dir is never overridden
    function toFig(f,opt){ var pose=f.pose, h=f.h, prop, dir=f.dir, turned=((f.pose==='point'||f.pose==='phone')&&!opt.focus)||/^(recoil|yield|block|look|buy)$/.test(f.pose);
      if(pose==='walk'||pose==='climb'){ pose=WALK[(wk++)&1]; if(f.prop==='flag')pose='tourist'; }
      else if(pose==='talk')pose=(f.prop==='arm'||R()<0.35)?'pointing':'stand';
      else if(pose==='child'){ pose='runChild'; h=f.h*1.85; }
      else pose=PMAP[pose]||'stand';
      if(opt.dan>0&&(pose==='walk1'||pose==='walk2')&&R()<0.5){ pose='biandan'; opt.dan--; }
      if(pose==='biandan')prop=opt.bags?'bags':'baskets';
      if(pose==='rideEbike'&&R()<0.5)prop='box';
      if(pose==='pointing'&&opt.pointDir&&!turned)dir=opt.pointDir;
      if(opt.lookX!==undefined&&!turned&&(pose==='pointing'||pose==='stand'||pose==='photographer'))dir=opt.lookX>f.x?1:-1;
      var tint=f.tint; if(tint==='none'&&R()<0.16)tint='ochre';
      var flag=false; if(f.prop==='flag'&&opt.flags>0){ tint='zhusha'; opt.flags--; flag=true; }
      return {x:f.x,y:f.y,h:h,pose:pose,dir:dir,z:f.z,tint:tint,prop:prop,flag:flag}; }
    var crowdFigs=[];
    for(i=0;i<groups.length;i++){ var G=groups[i], gf=G.figs; for(j=0;j<gf.length;j++){ if(G.opt.ring&&gf[j].pose==='dance'&&(j&1))continue; crowdFigs.push(toFig(gf[j],G.opt)); } }
    var all=figs.concat(seatFigs,crowdFigs), red=[];
    // D-19 (4) 朱砂改分布不加量 — 「朱砂應是停頓」: every figure gets its tint here (one main did not tint is rolled now, so the figure module's own 5 % red roll is never
    // taken), then at most ONE red garment per station and none on the deck but the incident's two flags; the swimmers' float balls, the kites, the 春聯,
    // the 幌子 edges, the boards' 朱砂 borders and the 黃鶴樓's three 柱額 marks are the rest of the budget
    for(i=0;i<all.length;i++)if(all[i].tint===undefined){ var tr=R(); all[i].tint=tr<0.40?'indigo':tr<0.60?'ochre':'none'; }
    var STX=[5020,4560,4100,3760,3320,2560,2160,1800,1350,820,420], seenRed={};
    function stationOf(x){ for(var q=0;q<STX.length-1;q++)if(x>STX[q+1]&&x<=STX[q])return q+1; return 0; }
    for(i=0;i<all.length;i++){ var rf=all[i]; if(rf.tint!=='zhusha'||rf.pose==='swimmer')continue; var sn=stationOf(rf.x), onDeck=rf.z>=BZ&&rf.x<BX&&rf.x>BX-BL;
      if(rf.flag){ red.push(rf); continue; } if(onDeck||seenRed[sn]){ rf.tint='indigo'; continue; } seenRed[sn]=true; red.push(rf); }
    for(i=0;i<all.length;i++)ctx.masks.stampZ(FIGURE.footprint(ctx,all[i]));
    for(i=0;i<agroups.length;i++)ctx.masks.stampZ(FIGURE.footprint(ctx,agroups[i]));   // D-10: the action groups stamp like figures
    for(i=0;i<rails.length;i++)ctx.masks.stampZ(rails[i]);   // the near 栏杆 in front of the deck figures: it hides their shins, they hide the far rail

    /* ================================================================ phase B: draw */
    // 起稿: the whole ground plan in one pale hand before anything is built — bank lines, hill ridges, the bridge deck, the 漢江 edges
    draft(fx(4640,1548,LB,10)); draft(fx(5020,4596,shore,10)); draft(fy(150,500,REx,10)); draft(fy(150,500,LEx,10)); draft(fx(1312,1000,function(){ return 119; },10));
    for(i=0;i<hills.length;i++)draft(hills[i].pts);
    draft(fx(BX,BX-BL,yD,10)); draft(fx(BX,BX-BL,yB,10));
    // D-08: the deck's breadth (far kerb), every pier's two edges down to the water, and the areas the crowds will occupy as pale ovals — all from the
    // geometry the later stages use (the pier list the water band reads, the placed figures themselves)
    var OX=OBL[0]*14; draft(fx(BX+OX,BX-BL+OX,function(x){ return yD(x-OX)+OY; },10));
    for(i=1;i<BN;i++){ var pxq=BX-i*BSPAN, pwq=(14-4*i/BN)/2; draft([[pxq-pwq,yB(pxq)],[pxq-pwq,bridgeWater(pxq)]]); draft([[pxq+pwq,yB(pxq)+1],[pxq+pwq,bridgeWater(pxq)]]); }
    // D-10(b): the crowd ovals are barely there and only where four or more will stand
    for(i=0;i<groups.length;i++)if(/^(episode|cluster|ring|queue)$/.test(groups[i].kind)&&groups[i].figs.length>=4){ var gf=groups[i].figs, bx0=1e9, bx1=-1e9, by0=1e9, by1=-1e9, k;
      for(k=0;k<gf.length;k++){ bx0=Math.min(bx0,gf[k].x-gf[k].h*0.18); bx1=Math.max(bx1,gf[k].x+gf[k].h*0.18); by0=Math.min(by0,gf[k].y-gf[k].h*0.25); by1=Math.max(by1,gf[k].y+gf[k].h*0.12); }
      var ocx=(bx0+bx1)/2, ocy=(by0+by1)/2, orx=(bx1-bx0)/2+2, ory=Math.max(3,(by1-by0)/2), ov=[]; for(k=0;k<=18;k++){ var oa=k/18*Math.PI*2; ov.push([ocx+Math.cos(oa)*orx,ocy+Math.sin(oa)*ory]); } draft(ov,0.45,18); }
    for(i=0;i<zones.length;i++)if(zones[i].kind==='road')draft(zones[i].poly.concat([zones[i].poly[0]]));
    for(i=0;i<zones.length;i++)GROUND.build(ctx,{zone:zones[i]});
    for(i=0;i<hills.length;i++)TREE.hill(ctx,hills[i]);
    for(i=0;i<terraces.length;i++){ var tr=terraces[i]; if(tr.kind==='bankline'){ GROUND.bankLine(ctx,tr); planeRuns(tr.pts,1.2,4,0.2,0); fugouRuns(tr.pts,0,'rock'); }   // D-10(a): the bank lip is a bearing edge — pressed in runs; D-12(a): one continuous 淡墨 plane under the lip, the press on its upper edge
      else { GROUND.terrace(ctx,tr); if(tr.quay)darkPlane(tr.pts,0.8,3.4,0.2,0); } }   // D-12(a): the quay's edge — the coping's face down to the water — one 淡墨 strip
    for(i=0;i<trees.length;i++){ var tt=trees[i], onHill=false; if(tt.kind==='luwei'||tt.x>5020)continue;   // D-08: every tree on a terrace stands in its own small mound
      for(j=0;j<hillFps.length;j++)if(hillFps[j].inside(tt.x,tt.y-1)){ onHill=true; break; }
      if(!onHill){ GROUND.foot(ctx,{x:tt.x,y:tt.y,w:Math.max(6,tt.h*0.09),z:tt.z===undefined?tt.y:tt.z});
        var rw=Math.max(1.6,tt.h*0.022), rz=(tt.z===undefined?tt.y:tt.z)+1;   // D-10(a): the root — where the trunk meets its mound — is pressed on both sides of the trunk
        fugou([[tt.x-rw*2.2,tt.y-1.6],[tt.x-rw*1.1,tt.y-0.2],[tt.x-rw*0.5,tt.y+0.3]],rz,'rock',0.9); fugou([[tt.x+rw*0.5,tt.y+0.3],[tt.x+rw*1.2,tt.y-0.1],[tt.x+rw*2.4,tt.y-1.4]],rz,'rock',0.9); } }
    // the eave underside: the bearing edge under every eave line, one ruled press a hair below the 界畫 line, from the slots the arch module returns
    function eaveUnder(el,z){ if(!el||el.x1-el.x0<8)return; var lift=Math.min(1.5,(el.x1-el.x0)*0.02);
      fugou([[el.x0+1,el.y+1.1-lift*0.5],[el.x0+(el.x1-el.x0)*0.3,el.y+1.3],[el.x0+(el.x1-el.x0)*0.7,el.y+1.3],[el.x1-1,el.y+1.1-lift*0.5]],z,'rule'); }
    // D-14 (B6 tell 1): the far side of the bridge — far kerb, far rail and its posts, everything the arch module rules above the deck edge — retreats to the
    // texture grade, so the near truss keeps the weight; the 桥头堡 at either end and the near rail (below yD−6) are not touched
    function bridgeCtx(){ var o={}, k; for(k in ctx)o[k]=ctx[k];
      // D-15: the far kerb/rail drop one more grade (texture ×0.8); the near truss's verticals and diagonals between deck and chord become structural at 0.8, so the
      // girder's belly (girderBand) reads darker than the lattice — the deck edge, the chord and the piers keep their grades
      o.rline=function(st,x,c,al,w,x1,y1,x2,y2,z,over){ var inL=x1<BX-16&&x1>BX-BL+16&&x2<BX-16&&x2>BX-BL+16;
        if(inL&&y1<yD(x1)-6&&y2<yD(x2)-6){ al*=0.8*ctx.INK.texture[1]/ctx.INK.structural[1]; w=Math.min(w,ctx.INK.texture[0]); }
        else if(inL&&Math.abs(x2-x1)<20&&Math.abs(y2-y1)>16&&y1>=yD(x1)-1&&y2>=yD(x2)-1&&y1<=yB(x1)+1&&y2<=yB(x2)+1){ al*=0.8*ctx.INK.structural[1]/(w>=0.65?165:135); w=Math.min(w,ctx.INK.structural[0]); }
        ctx.rline(st,x,c,al,w,x1,y1,x2,y2,z,over); };
      return o; }
    for(i=0;i<arch.length;i++){ var s=arch[i], rec=ARCH.build(s.edge?edgeCtx(425):s.kind==='bridge'?bridgeCtx():ctx,s), sl=rec.slots, bz=s.z===undefined?s.y:s.z;
      if(sl.ground&&s.kind!=='bridge')draft([[sl.ground.x0-2,sl.ground.y],[sl.ground.x1+2,sl.ground.y]]);   // the building's ground line was in the 起稿
      if(sl.eaveLine&&s.kind!=='bridge'&&s.h>12)eaveUnder(sl.eaveLine,bz+1);
      if(s.kind==='tvtower'){ var tvd=s.y-(s.h||440)*0.7, tvp=[], tk; for(tk=0;tk<=12;tk++){ var ta=Math.PI*tk/12; tvp.push([s.x-45*Math.cos(ta),tvd+11*Math.sin(ta)]); } fugou(tvp,bz+1,'rule',0.9); }   // D-18: the 電視塔's disc bears on its underside — pressed like an eave, so the ring reads at 1×
      if(sl.huangzi)blob({x:sl.huangzi.cx,y:sl.huangzi.cy,w:4,h:30,style:'fan',board:false,z:bz,vertical:true});
      if(s.kind==='shopfront'&&R()<0.35&&sl.ground)blob({x:sl.ground.x1-rr(6,12),y:sl.ground.y-s.h*0.55,w:7,h:22,style:'pai',board:'ink',z:bz,vertical:true}); }
    // D-10 street rows: built for real; every unit's ground line in the 起稿, every eave's underside pressed, the 幌子 handed to the text module
    for(i=0;i<rows.length;i++){ var rw0=rows[i], rrec=ARCH.streetRow(rw0.edge?edgeCtx(425):ctx,rw0), rsl=rrec.slots, k;
      for(k=0;k<rsl.units.length;k++)draft([[rsl.units[k].x1+1,rsl.units[k].y],[rsl.units[k].x0-1,rsl.units[k].y]]);
      for(k=0;k<rsl.eaveLines.length;k++)eaveUnder(rsl.eaveLines[k],rw0.z+1);
      if(rw0.jimo)for(k=0;k<rsl.shadeUnderEave.length;k++)jimo(rsl.shadeUnderEave[k],rsl.doors,rw0.z+1);   // round 6: the 積墨 under 戶部巷's front eaves
      for(k=0;k<rsl.huangzi.length;k++)blob({x:rsl.huangzi[k].cx,y:rsl.huangzi[k].cy,w:4,h:30,style:'fan',board:false,z:rw0.z,vertical:true}); }
    fugou(fx(BX-2,BX-BL+2,yD,14),BZ+1,'rule');   // the rail's lower edge = the bridge's deck edge, the line the deck crowd stands on
    // D-12 (a) → D-14 → D-15 (B7 tell 1, the reviewer's "if the loop stopped here" pick): the near main girder's shade is no longer a band under the chord but the
    // girder's whole belly — the face between the deck edge and the bottom chord, 淡墨 0.35 at the deck's underside grading to 0.15 at the chord, over the full
    // truss depth (28 → 22 px) along the whole near girder, paling with the far spans as the truss does; the near lattice (verticals, diagonals) is dropped to
    // structural ×0.8 in bridgeCtx so the belly reads darker than the members, and the piers' bearing tops take the heaviest strokes of the scroll (below)
    // D-16 (B8 tell 4): 收掉跨中的碎墨 — the belly is one smooth graded wash (pooled dabs, no dropped cells, no per-dab noise), ink 0.3 at the deck's underside to
    // 0.12 at the chord in twelve fine steps so no band edge shows; the darkest ink is no longer spread along the span but concentrated at every 梁墩相接处 (below)
    function girderBand(xa,xb,f){ var NB=12, q, x, a, b, t0, t1, ink;
      function at(x,t){ return yD(x)+0.6+(yB(x)-yD(x)-0.6)*t; }
      for(q=0;q<NB;q++){ t0=0.02+0.96*q/NB; t1=0.02+0.96*(q+1)/NB; ink=(0.34-0.27*Math.pow((q+0.5)/NB,0.8))*1.9*f; a=[]; b=[]; for(x=xa;x>xb;x-=4){ a.push([x,at(x,t0)]); b.push([x,at(x,t1)]); } a.push([xb,at(xb,t0)]); b.push([xb,at(xb,t1)]);
        var poly=a.concat(b.reverse()); ctx.dabs(ST.INDIGO,{x0:xb,x1:xa,y0:Math.min(at(xa,t0),at(xb,t0))-1,y1:Math.max(at(xa,t1),at(xb,t1))+1,z:BZ,inside:ctx.polyInside(poly),edge:ctx.polyEdge(poly)},C.danmo,ink,1.0,1.3,null,{pool:true}); } }
    for(i=0;i<BN;i++){ var bxa=BX-i*BSPAN, bxb=bxa-BSPAN, bf=i>=5?1-0.6*(i-5+1)/(BN-5):1; girderBand(bxa,bxb,bf); }
    fugou(fx(BX-2,BX-BL+2,yB,14),BZ+1,'rule',0.9);
    // D-16 (B8 tell 4): the 積墨 of the near girder sits at the joints only — at every pier a short concentrated patch 10–14 px wide × 6–8 px tall straddling the
    // girder-pier bearing (ink 0.5, pooled, its edges rounded by the dab radius), the 復勾's heaviest stroke on the patch's upper edge; the pier's oblique side
    // face takes a 淡墨 side (0.2) down to the water so the shaft is a block, not a 「浅色板条」
    for(i=1;i<BN;i++){ var ppx=BX-i*BSPAN, ppw0=14-4*i/BN, ppw=ppw0*0.75, ppy=yB(ppx), pf=i>=5?1-0.6*(i-5+1)/(BN-5):1, jw=ppw0*rr(0.85,1.0), jh=rr(6,8), jt=ppy-jh*0.55, jb=ppy+jh*0.45;
      var jp=[[ppx-jw/2,jt+0.6],[ppx-jw/2+1,jt],[ppx+jw/2-1,jt],[ppx+jw/2,jt+0.6],[ppx+jw/2,jb-0.6],[ppx+jw/2-1,jb],[ppx-jw/2+1,jb],[ppx-jw/2,jb-0.6]];
      ctx.dabs(ST.INDIGO,{x0:ppx-jw/2,x1:ppx+jw/2,y0:jt,y1:jb,z:BZ,inside:ctx.polyInside(jp),edge:ctx.polyEdge(jp)},C.danmo,0.5*1.9*pf,0.9,1.2,null,{pool:true});
      var sx0=ppx-ppw0/2, sox=OBL[0]*16, soy=OBL[1]*16, sp=[[sx0,ppy],[sx0+sox,ppy+soy],[sx0+sox,bridgeWater(ppx)+soy],[sx0,bridgeWater(ppx)]];
      ctx.dabs(ST.INDIGO,{x0:sx0+sox,x1:sx0,y0:ppy+soy,y1:bridgeWater(ppx),z:BZ,inside:ctx.polyInside(sp),edge:ctx.polyEdge(sp)},C.danmo,0.2*1.9*pf,1.4,1.4,null,{pool:true});
      ctx.bline(ST.FINISH,ppx+ppw/2,C.ink,Math.min(255,ANCH_AL*1.3*pf),Math.min(0.9,ANCH_W*1.35),[[ppx-ppw/2+rr(-0.3,0.3),jt+0.3],[ppx,jt+0.5],[ppx+ppw/2+rr(-0.3,0.3),jt+0.3]],BZ+1,'rule'); }
    for(i=0;i<boats.length;i++){ BOAT.build(ctx,boats[i]); var bt=boats[i].bt, hx=[], k, xa=Math.min(bt.sternX,bt.bowX), xb=Math.max(bt.sternX,bt.bowX);
      for(k=xa+2;k<xb-2;k+=6)hx.push([k,bt.deckY(k)]); hx.push([xb-2,bt.deckY(xb-2)]);
      draft(hx.concat([[xb-1,bt.y],[xa+1,bt.y],[xa+2,bt.deckY(xa+2)]]));            // the hull in the 起稿 (D-08): one closed pale mass — sheer, stern, waterline, stem
      fugou(bt.wl,bt.z+1,'rule',bt.len>=60?1:0.85); }                                // D-10(a): the hull's belly — the waterline where the dark bilge meets the river — pressed on every boat
    for(i=0;i<trees.length;i++)TREE.build(ctx,trees[i]);
    for(i=0;i<all.length;i++)FIGURE.build(ctx,all[i]);
    for(i=0;i<agroups.length;i++)FIGURE.group(ctx,agroups[i]);   // D-10: the action groups, each one drawing
    // water: one band per stretch so the density follows the plan; the bridge piers are told to the band under them
    var bridgePiers=[]; for(i=1;i<BN;i++){ var px=BX-i*BSPAN; bridgePiers.push({x:px,y:bridgeWater(px),w:14-4*i/BN}); }
    WATER.build(ctx,{x0:4100,x1:4640,yTop:MIST,yBot:LB,flow:[-1,-0.05],density:1,kind:'river'});
    WATER.build(ctx,{x0:3740,x1:4100,yTop:MIST,yBot:LB,flow:[-1,-0.05],density:0.4,kind:'river'});
    WATER.build(ctx,{x0:3400,x1:3740,yTop:MIST,yBot:LB,flow:[-1,-0.05],density:0.3,kind:'river'});
    // D-07: the bridge passage is the densest water of the scroll, with clean river for ~150 px on either side of it
    WATER.build(ctx,{x0:3236,x1:3400,yTop:MIST,yBot:LB,flow:[-1,-0.05],density:0.1,kind:'river'});
    WATER.build(ctx,{x0:2700,x1:3236,yTop:MIST,yBot:LB,flow:[-1,-0.06],density:0.9,kind:'river',piers:bridgePiers.filter(function(pp){ return pp.x>2700; })});
    WATER.build(ctx,{x0:2560,x1:2700,yTop:MIST,yBot:LB,flow:[-1,-0.06],density:0.12,kind:'river',piers:bridgePiers.filter(function(pp){ return pp.x<=2700; })});
    WATER.build(ctx,{x0:2200,x1:2560,yTop:MIST,yBot:LB,flow:[-1,-0.06],density:0.3,kind:'river'});
    WATER.build(ctx,{x0:1640,x1:2200,yTop:MIST,yBot:LB,flow:[-1,-0.07],flow2:HANFLOW,seam:[1935,146],seamLen:250,density:0.9,kind:'confluence'});
    WATER.build(ctx,{x0:1885,x1:2178,yTop:hanTop,yBot:hanBot,flow:HANFLOW,density:1,kind:'river'});
    WATER.build(ctx,{x0:1005,x1:1312,yTop:MIST,yBot:function(){ return 118; },flow:[-1,-0.04],density:0.7,kind:'wake'});
    for(i=0;i<signs.length;i++)TEXT.sign(ctx,signs[i]);
    for(i=0;i<blobs.length;i++)TEXT.blob(ctx,blobs[i]);
    for(i=0;i<extras.length;i++)extras[i]();
    TEXT.colophon(ctx,{text:COLOPHON});
    TEXT.collectorSeals(ctx);
    // D-19 (5) 折損偶爾同時磨斷墨與色: along every 折痕 the silk baked (ctx.silkWear), a pale worn line — silk +30, the crease's own width +0.5, alpha 1.6× its fold —
    // in broken runs of 8–50 px with 6–40 px between, wandering ±0.6 px, keyed at x −1 so it is the last thing drawn and crosses ink and colour alike; nothing is skipped
    (function(){ var wear=ctx.silkWear||[], pale=[Math.min(255,C.silk[0]+30),Math.min(255,C.silk[1]+30),Math.min(255,C.silk[2]+30)], k;
      for(k=0;k<wear.length;k++)(function(cr){ var runs=[], y=rr(-20,10), al=clamp(cr.a*1.6,22,64), w=cr.w+0.5;
        while(y<H){ var len=rr(8,50), gap=rr(6,40); if(R()<0.6&&y+len>0){ var n=Math.max(2,Math.round(len/5)), pts=[], i; for(i=0;i<=n;i++){ var yy=y+len*i/n; pts.push([cr.x+(noise(yy*0.06,cr.x*0.013)-0.5)*1.2,yy]); } runs.push(pts); } y+=len+gap; }
        if(!runs.length)return;
        ctx.add(ST.FINISH,-1,function(g){ g.noFill(); g.strokeCap(g.SQUARE); g.stroke(pale[0],pale[1],pale[2],al); g.strokeWeight(w); var q, i;
          for(q=0;q<runs.length;q++){ g.beginShape(); for(i=0;i<runs[q].length;i++)g.vertex(runs[q][i][0],runs[q][i][1]); g.endShape(); } }); })(wear[k]); })();
    finishBuild(A);
  }

  // a ctx whose ruler lines stop at x=cut, for the building the picture edge cuts: its underdrawing does not run on into the blank
  function edgeCtx(cut){ var o={}, k; for(k in ctx)o[k]=ctx[k];
    o.rline=function(st,x,c,al,w,x1,y1,x2,y2,z,over){ if(x1<cut&&x2<cut)return; if(x1<cut||x2<cut){ var t=(cut-x1)/(x2-x1), yc=y1+(y2-y1)*t; if(x1<cut){ x1=cut; y1=yc; } else { x2=cut; y2=yc; } } ctx.rline(st,x,c,al,w,x1,y1,x2,y2,z,over); };
    return o; }

  attachApp(A,build);
});
