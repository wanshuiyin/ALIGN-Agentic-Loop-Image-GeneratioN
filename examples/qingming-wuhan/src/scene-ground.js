/* scene-ground.js — self-check scene for mod-ground.js on the 1200×500 harness canvas (round 2, D-07 continuous ground).
   Reading right to left, the eye must travel down without a gap: a street (terrace 'street', a hut on it) → the 防洪墙 as one
   continuous wall with four 闸口 → a quay (terrace 'quay' with 缆桩 and a 跳板, a ruled flight of steps down to the water) →
   on the left the quay gives way to an earth bank (terrace 'bank' with 皴 and reeds, a tree standing on it) → the bank line →
   water. The 凌波門 pier runs out from the bank on the far left. Stick figures and a stick tree stamp footprints so the ground breaks behind them. */
function sceneBuild(ctx){ var ST=ctx.ST, C=ctx.C, rr=ctx.rr, ri=ctx.ri, R=ctx.R, i;
  // geometry (right → left)
  var streetFront=[[1200,318],[900,320],[600,322],[300,326],[40,330]];             // street sits above this edge
  var quayFront=[[1200,372],[1000,371],[760,370],[640,372]];                        // quay top edge; water 6 px below on the right
  var bankFront=[[640,378],[520,386],[400,392],[250,398],[120,404],[40,408]];      // earth bank meets the water here
  var waterEdge=quayFront.map(function(v){ return [v[0],v[1]+6]; }).concat(bankFront.slice(1));
  ctx.masks.stampWater([[1200,378],[1200,500],[0,500],[0,408]].concat(bankFront.slice().reverse()).concat([[640,378]]));
  // phase A: footprints (walls, pier, hut, tree, figures)
  var zones=[
    {kind:'floodwall',pts:[[700,336],[1180,332]],h:36,gates:[{x:780,w:26},{x:920,w:24},{x:1040,w:26},{x:1140,w:24}]},
    {kind:'pier',x:262,y:409,len:110,dir:-1,drop:11,railH:14,thick:3.2},
    {kind:'quay',front:[[1200,372],[1000,371]],wallH:22,steps:[{x:1090,w:32,n:8}],poly:[[1000,371],[1200,372],[1200,336],[1000,336]],ink:0.14}];              // D-19: a stone quay face for the 淡墨 courses at the water line
  for(i=0;i<zones.length;i++){ var fp=GROUND.footprint(ctx,{zone:zones[i]}), sl=fp.slices||[fp]; for(var j=0;j<sl.length;j++)ctx.masks.stampZ(sl[j]); }
  var hut={x:330,y:322,w:70,h:34};
  ctx.masks.stampZ({x0:hut.x-hut.w/2-6,x1:hut.x+hut.w/2+6,y0:hut.y-hut.h-14,y1:hut.y,z:hut.y,inside:function(x,y){ var top=y<hut.y-hut.h; return top? (y>hut.y-hut.h-14&&Math.abs(x-hut.x)<hut.w/2+6*(1-(hut.y-hut.h-y)/14)) : Math.abs(x-hut.x)<hut.w/2; }});
  var trees=[{x:440,y:386,h:80},{x:330,y:390,h:66},{x:575,y:378,h:58}], tree=trees[0];
  for(i=0;i<trees.length;i++){ (function(t){ ctx.masks.stampZ({x0:t.x-3,x1:t.x+3,y0:t.y-t.h*0.45,y1:t.y,z:t.y,inside:function(x,y){ return Math.abs(x-t.x)<1.6+1.4*(y-(t.y-t.h*0.45))/(t.h*0.45); }}); })(trees[i]); }
  var figs=[{x:660,y:320,h:54},{x:860,y:366,h:56},{x:560,y:392,h:58},{x:200,y:392,h:52}];
  var figFp=function(f){ return {x0:f.x-f.h*0.2,x1:f.x+f.h*0.2,y0:f.y-f.h,y1:f.y,z:f.y,inside:function(x,y){ var u=(y-(f.y-f.h))/f.h; var hw=u<0.15?f.h*0.07:f.h*(0.12+0.08*u); return Math.abs(x-f.x)<hw&&y>=f.y-f.h&&y<=f.y; }}; };
  for(i=0;i<figs.length;i++)ctx.masks.stampZ(figFp(figs[i]));
  // phase B: the ground, back to front
  GROUND.terrace(ctx,{pts:streetFront,depth:44,kind:'street'});
  for(i=0;i<zones.length;i++)GROUND.build(ctx,{zone:zones[i]});
  GROUND.terrace(ctx,{pts:quayFront.slice(1),depth:36,kind:'quay',plankDir:-1});
  GROUND.terrace(ctx,{pts:bankFront,depth:48,kind:'bank'});
  GROUND.bankLine(ctx,{pts:waterEdge});
  // a hut on the street (rectangle + hip roof, ruled) and a stick tree on the bank
  (function(){ var x=hut.x, y=hut.y, w=hut.w, h=hut.h, z=y, Rl=function(al,wd,a,b,c,d){ ctx.rline(ST.JIEHUA,Math.max(a,c),C.ink,al,wd,a,b,c,d,z,rr(0.5,1.5)); };
    Rl(190,0.8,x-w/2,y,x-w/2,y-h); Rl(190,0.8,x+w/2,y,x+w/2,y-h); Rl(160,0.6,x-w/2,y-h,x+w/2,y-h);
    Rl(200,0.85,x-w/2-6,y-h,x-w/2+10,y-h-14); Rl(200,0.85,x+w/2+6,y-h,x+w/2-10,y-h-14); Rl(205,0.9,x-w/2+10,y-h-14,x+w/2-10,y-h-14);
    Rl(200,0.85,x-w/2-6,y-h+0.3,x+w/2+6,y-h+0.3); Rl(150,0.55,x-w/2-4,y-h+2.4,x+w/2+4,y-h+2.4);
    Rl(170,0.65,x-w/2+16,y,x-w/2+16,y-h*0.7); Rl(170,0.65,x-w/2+34,y,x-w/2+34,y-h*0.7); Rl(160,0.6,x-w/2+16,y-h*0.7,x-w/2+34,y-h*0.7);
    for(var k=1;k<5;k++)Rl(120,0.5,x-w/2+38+k*6,y-h*0.35,x-w/2+38+k*6,y-h*0.75);
    ctx.wash(ST.OCHRE,[[x-w/2+1,y-h+3],[x+w/2-1,y-h+3],[x+w/2-1,y-0.5],[x-w/2+1,y-0.5]],C.ochre,0.14,3,2.6,z);
    ctx.wash(ST.INDIGO,[[x-w/2-4,y-h+3],[x+w/2+4,y-h+3],[x+w/2+3,y-h+6],[x-w/2-3,y-h+6]],C.danmo,0.12,2.5,2,z); })();
  for(i=0;i<trees.length;i++)GROUND.foot(ctx,{x:trees[i].x,y:trees[i].y,w:5,z:trees[i].y});
  for(i=0;i<trees.length;i++)(function(tree){ var x=tree.x, y=tree.y, h=tree.h, z=y, B=function(al,w,pts){ ctx.bline(ST.TREES,x+h*0.3,C.ink,al,w,pts,z); };
    B(210,0.85,[[x-3,y],[x-2.2,y-h*0.2],[x-1.4,y-h*0.42],[x-3,y-h*0.6]]); B(205,0.8,[[x+2.6,y+0.5],[x+2,y-h*0.22],[x+1.6,y-h*0.4],[x+3.5,y-h*0.58]]);
    B(180,0.6,[[x-1.4,y-h*0.42],[x-8,y-h*0.6],[x-14,y-h*0.82],[x-13,y-h*0.95]]); B(180,0.6,[[x+1.6,y-h*0.4],[x+9,y-h*0.62],[x+13,y-h*0.86]]);
    B(160,0.5,[[x-8,y-h*0.6],[x-16,y-h*0.66],[x-24,y-h*0.7]]); B(160,0.5,[[x+9,y-h*0.62],[x+17,y-h*0.7],[x+22,y-h*0.8]]); B(150,0.5,[[x-3,y-h*0.6],[x-1,y-h*0.8],[x+2,y-h*1.0]]);
    for(var k=0;k<14;k++){ var bx=x+rr(-22,22), by=y-h*rr(0.62,1.0); B(rr(90,140),0.42,[[bx,by],[bx+rr(-3,3),by-rr(3,6)],[bx+rr(-5,5),by-rr(6,10)]]); }
    B(170,0.6,[[x-6,y+0.5],[x-3,y-1],[x+3,y-1],[x+7,y+1]]); })(trees[i]);
  // stick figures (from scene-sample): hat, head, shoulders, robe, belt, hem, feet
  var figure=function(f){ var x=f.x, y=f.y, h=f.h, z=f.y, B=function(al,w,pts){ ctx.bline(ST.FIGURES,x+h*0.2,C.ink,al,w,pts,z); };
    B(230,0.7,[[x-h*0.06,y-h*0.98],[x,y-h*1.02],[x+h*0.06,y-h*0.98]]);
    B(200,0.55,[[x-h*0.055,y-h*0.97],[x-h*0.06,y-h*0.9],[x,y-h*0.86],[x+h*0.06,y-h*0.9],[x+h*0.055,y-h*0.97]]);
    B(210,0.65,[[x-h*0.17,y-h*0.8],[x-h*0.06,y-h*0.85],[x+h*0.07,y-h*0.85],[x+h*0.17,y-h*0.79]]);
    B(210,0.65,[[x-h*0.17,y-h*0.8],[x-h*0.2,y-h*0.55],[x-h*0.16,y-h*0.3],[x-h*0.19,y-h*0.06]]);
    B(210,0.65,[[x+h*0.17,y-h*0.79],[x+h*0.2,y-h*0.52],[x+h*0.15,y-h*0.3],[x+h*0.18,y-h*0.05]]);
    B(180,0.5,[[x-h*0.15,y-h*0.55],[x,y-h*0.53],[x+h*0.15,y-h*0.55]]);
    B(200,0.6,[[x-h*0.19,y-h*0.06],[x-h*0.05,y-h*0.02],[x+h*0.05,y-h*0.03],[x+h*0.18,y-h*0.05]]);
    ctx.dabs(ST.OCHRE,{x0:x-4,x1:x+4,y0:y-h*0.97,y1:y-h*0.86,z:z,inside:function(px,py){ return Math.abs(px-x)<h*0.05&&py>y-h*0.96&&py<y-h*0.87; }},C.ochre,0.35,2.5,2.2);
    ctx.line(ST.FIGURES,x,C.ink,220,1.2,x-h*0.1,y-0.5,x-h*0.06,y-0.5); ctx.line(ST.FIGURES,x,C.ink,220,1.2,x+h*0.06,y-0.5,x+h*0.1,y-0.5); };
  for(i=0;i<figs.length;i++)figure(figs[i]);
  // water clusters at the quay foot, at the steps and between the pier posts (what mod-water will do)
  var cluster=function(cx,cy,dir){ var n=ri(4,9); for(var k=0;k<n;k++){ var L=rr(8,24), y0=cy+k*rr(1.6,2.6), x0=cx+rr(-4,4); ctx.pline(ST.WATER,x0+L,C.ink,rr(60,110),rr(0.35,0.5),[[x0,y0],[x0+L*0.3,y0-1.2+dir*L*0.3],[x0+L*0.7,y0-1.2+dir*L*0.7],[x0+L,y0+dir*L]],true); } };
  for(var cx=700;cx<1190;cx+=rr(60,110))cluster(cx,cx>1000?rr(398,410):rr(384,398),rr(-0.1,0.1));
  for(var px=150;px<255;px+=rr(22,34))cluster(px,rr(424,432),rr(-0.08,0.08));
  for(var bx=300;bx<620;bx+=rr(70,120))cluster(bx,rr(412,430),rr(-0.1,0.1));
}
