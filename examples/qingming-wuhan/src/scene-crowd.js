/* scene-crowd.js — self-check for mod-crowd.js on the 1200×500 harness.
   A stream of 40 on an oblique street band, a queue of 6 (+ straggler) to a counter, an episode of 6 round a vendor and one of 5 round a fallen e-bike rider,
   a rail row of 12 on a deck, a 广场舞 ring of 10 with 5 watching, 9 on a stair; two stamped obstacles (the counter, a trunk).
   Figures are stick stubs — body, head, a prop tick — so only the placement is on show. Footprint boxes in faint 淡墨. */
function sceneBuild(ctx){ var ST=ctx.ST, C=ctx.C, i;
  // obstacles, stamped so nobody stands inside them
  var counter={x0:896,x1:942,y0:228,y1:268,z:268}, trunk={x0:596,x1:606,y0:270,y1:398,z:398}, kerb={x0:700,x1:790,y0:340,y1:352,z:352};
  [counter,trunk,kerb].forEach(function(b){ b.inside=function(x,y){ return x>=b.x0&&x<=b.x1&&y>=b.y0&&y<=b.y1; }; ctx.masks.stampZ(b);
    ctx.rline(ST.JIEHUA,b.x1,C.ink,180,0.8,b.x0,b.y1,b.x1,b.y1); ctx.rline(ST.JIEHUA,b.x1,C.ink,180,0.8,b.x0,b.y0,b.x0,b.y1);
    ctx.rline(ST.JIEHUA,b.x1,C.ink,180,0.8,b.x1,b.y0,b.x1,b.y1); ctx.rline(ST.JIEHUA,b.x1,C.ink,180,0.8,b.x0,b.y0,b.x1,b.y0); });
  // zone guides: band edges, rail with posts, stair treads
  var band=[[1180,318],[760,352],[300,392]], railPts=[[300,170],[720,158]], stair=[[150,470],[210,300],[235,250]], bw=36;
  var edge=function(sign){ return band.map(function(p){ return [p[0],p[1]+sign*bw]; }); };
  ctx.chunks(ST.DRAFT,edge(-1).slice().reverse(),C.ink,60,0.5); ctx.chunks(ST.DRAFT,edge(1).slice().reverse(),C.ink,60,0.5);
  ctx.rline(ST.JIEHUA,720,C.ink,190,0.8,300,170,720,158); ctx.rline(ST.JIEHUA,720,C.ink,150,0.6,300,182,720,170);
  for(var px=304;px<720;px+=8){ var t=(px-300)/420, ry=170-12*t; ctx.rline(ST.JIEHUA,px,C.ink,150,0.6,px,ry,px,ry+12); }
  var L=0; for(i=1;i<stair.length;i++)L+=Math.hypot(stair[i][0]-stair[i-1][0],stair[i][1]-stair[i-1][1]);
  for(var q=0;q<L;q+=7){ var acc=0, k=1; while(k<stair.length-1&&acc+Math.hypot(stair[k][0]-stair[k-1][0],stair[k][1]-stair[k-1][1])<q){ acc+=Math.hypot(stair[k][0]-stair[k-1][0],stair[k][1]-stair[k-1][1]); k++; }
    var a=stair[k-1], b=stair[k], d=Math.hypot(b[0]-a[0],b[1]-a[1]), u=(q-acc)/d, sx=a[0]+(b[0]-a[0])*u, sy=a[1]+(b[1]-a[1])*u; ctx.rline(ST.JIEHUA,sx+9,C.ink,140,0.6,sx-9,sy,sx+9,sy); }
  // ---------- phase A: place, then stamp every figure's footprint
  var groups=[
    CROWD.place(ctx,{kind:'queue',focus:[944,262],zone:{dir:[1,0.1]},n:6}),
    // the three bridge silhouettes in a row on the street band: e-bike ring with its gap (right), photographers' clump at a stamped kerb (middle), vendor's knot + queue tail (left)
    CROWD.place(ctx,{kind:'episode',focus:[1010,336],n:8,zone:{w:30,dir:[-1,0]},roles:[{pose:'ebike',prop:'ebike',dir:1},'tourist','point']}),
    CROWD.place(ctx,{kind:'episode',focus:[740,352],n:5,zone:{w:30,dir:[-1,0]},roles:[{pose:'photo',dir:1}]}),
    CROWD.place(ctx,{kind:'episode',focus:[440,380],n:7,zone:{w:30,dir:[-1,0]},roles:[{pose:'vendor',dir:1},'eat','stand','eat']}),
    CROWD.place(ctx,{kind:'ring',focus:[900,445],n:10,watchers:5}),
    CROWD.place(ctx,{kind:'rail',zone:{pts:railPts,z:165},focus:[510,240],n:12}),
    CROWD.place(ctx,{kind:'stairs',zone:{pts:stair},n:9}),
    CROWD.place(ctx,{kind:'stream',zone:{pts:band,w:bw},n:52,mix:'street'})];
  var figs=[]; groups.forEach(function(g){ figs=figs.concat(g); });
  (ctx.reg.gaps||[]).forEach(function(b){ ctx.pline(ST.DRAFT,b.x1,C.zhusha,70,0.5,[[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1],[b.x0,b.y0]]); });
  for(i=0;i<figs.length;i++)ctx.masks.stampZ(CROWD.footprint(ctx,figs[i]));
  // ---------- phase B: faint footprint boxes, then the stubs
  function stick(f){ var h=f.h, x=f.x, y=f.y, d=f.dir, z=f.z, cut=f.pose==='rail'?0.45:0, ht=(f.pose==='sit'||f.pose==='squat')?0.58:1, top=y-h*ht, foot=y-h*cut;
    var col=f.tint==='indigo'?C.huaqing:f.tint==='zhusha'?C.zhusha:C.ink, fp=CROWD.footprint(ctx,f);
    ctx.pline(ST.DRAFT,fp.x1,C.ink,38,0.4,[[fp.x0,fp.y0],[fp.x1,fp.y0],[fp.x1,fp.y1],[fp.x0,fp.y1],[fp.x0,fp.y0]]);
    ctx.bline(ST.FIGURES,x+h*0.1,col,210,0.7,[[x-d*h*0.02,foot],[x+d*h*0.02,top+h*0.5],[x+d*h*0.03,top+h*0.16]],z);
    var hx=x+d*h*0.035, hy=top+h*0.075, r=h*0.06, pts=[]; for(var k=0;k<=10;k++){ var a=k/10*Math.PI*2; pts.push([hx+Math.cos(a)*r,hy+Math.sin(a)*r]); }
    ctx.pline(ST.FIGURES,hx+r,col,200,0.6,pts,true);
    if(f.prop==='dan')ctx.line(ST.FIGURES,x+h*0.34,col,190,0.7,x-h*0.34,top+h*0.24,x+h*0.34,top+h*0.22);
    else if(f.prop==='umbrella')ctx.pline(ST.FIGURES,x+h*0.3,col,190,0.6,[[x-h*0.3,top-h*0.02],[x,top-h*0.14],[x+h*0.3,top-h*0.02]],true);
    else if(f.prop==='bike'||f.prop==='ebike'||f.prop==='cart'){ var wx=x+d*h*0.26, wy=y-h*0.09, wr=h*0.09, wp=[]; for(var j=0;j<=10;j++){ var b=j/10*Math.PI*2; wp.push([wx+Math.cos(b)*wr,wy+Math.sin(b)*wr]); } ctx.pline(ST.FIGURES,wx+wr,col,180,0.5,wp,true); }
    else if(f.prop==='arm')ctx.line(ST.FIGURES,x+h*0.2,col,190,0.6,x+d*h*0.04,top+h*0.28,x+d*h*0.2,top+h*0.06);
    else if(f.prop==='phone')ctx.line(ST.FIGURES,x+h*0.1,col,190,0.6,x+d*h*0.02,top+h*0.3,x+d*h*0.1,top+h*0.2);
    else if(f.prop==='flag')ctx.line(ST.FIGURES,x+h*0.12,col,190,0.6,x+d*h*0.12,top+h*0.3,x+d*h*0.12,top-h*0.12);
    else if(f.prop==='bag'||f.prop==='basket'||f.prop==='sack')ctx.line(ST.FIGURES,x+h*0.12,col,190,0.7,x-d*h*0.08,top+h*0.5,x-d*h*0.12,top+h*0.62);
    if(f.pose!=='rail')ctx.line(ST.FIGURES,x+h*0.04,col,220,1.2,x-h*0.04,foot-0.5,x+h*0.04,foot-0.5); }
  for(i=0;i<figs.length;i++)stick(figs[i]);
}
