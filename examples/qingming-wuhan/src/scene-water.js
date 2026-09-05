/* scene-water.js — self-check for mod-water.js. One river band running left (kind confluence, so the 清浊线 and the opposed
   汉江 current are exercised), a cargo boat under way heading left, a moored sampan by the near bank, one bridge pier with a
   分水尖 under a stub of deck. Footprints stamped first; hulls, pier and banks drawn as the boat/arch/tree modules would, so the
   water can be judged against them. */
function sceneBuild(ctx){ var ST=ctx.ST, C=ctx.C, rr=ctx.rr, ri=ctx.ri, x;
  function yTop(x){ return 150+18*Math.sin(x*0.0035)+ctx.noise(x*0.01,2)*10; }
  function yBot(x){ return 398+14*Math.sin(x*0.005+1)+ctx.noise(x*0.012,9)*12; }
  // ---------- phase A: water raster, footprints, boat registry
  var poly=[]; for(x=0;x<=1200;x+=10)poly.push([x,yTop(x)]); for(x=1200;x>=0;x-=10)poly.push([x,yBot(x)]); ctx.masks.stampWater(poly);
  function fpOf(P,z){ var x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for(var k=0;k<P.length;k++){ x0=Math.min(x0,P[k][0]); x1=Math.max(x1,P[k][0]); y0=Math.min(y0,P[k][1]); y1=Math.max(y1,P[k][1]); } return {x0:x0,x1:x1,y0:y0,y1:y1,z:z,inside:ctx.polyInside(P)}; }
  var cargoP=[[778,282],[786,298],[934,298],[942,284],[930,279],[898,279],[893,262],[826,262],[821,279],[790,279]], cargo=fpOf(cargoP,298);
  var sampanP=[[248,372],[254,382],[306,382],[312,371],[300,367],[258,367]], sampan=fpOf(sampanP,382);
  var pierP=[[552,200],[568,200],[568,322],[578,330],[552,330]], pier=fpOf(pierP,330);
  var deckP=[[470,189],[650,189],[650,201],[470,201]], deck=fpOf(deckP,201);
  ctx.masks.stampZ(cargo); ctx.masks.stampZ(sampan); ctx.masks.stampZ(pier); ctx.masks.stampZ(deck);
  ctx.reg.boats.push({fp:cargo,slots:{},seats:[],spec:{x:942,y:298,type:'cargo',len:164,dir:-1,z:298,moving:true}});
  ctx.reg.boats.push({fp:sampan,slots:{},seats:[],spec:{x:312,y:382,type:'sampan',len:64,dir:1,z:382,moving:false}});
  // ---------- phase B
  // banks: 淡墨 起稿 lines, short 皴 down the near bank
  (function(){ var top=[], bot=[], gx, k; for(x=0;x<=1200;x+=6){ top.push([x,yTop(x)]); bot.push([x,yBot(x)]); }
    ctx.chunks(ST.DRAFT,top,C.ink,70,0.5); ctx.chunks(ST.DRAFT,bot,C.ink,85,0.5);
    for(gx=20;gx<1180;gx+=rr(30,90)){ var lean=rr(-0.7,0.3), n=ri(3,6), gy=yBot(gx);
      for(k=0;k<n;k++){ var sx=gx+k*rr(2,4.5), L=rr(3,9)*(k===0||k===n-1?0.7:1), a=Math.PI/2+lean+rr(-0.15,0.15); ctx.line(ST.TREES,sx,C.ink,rr(50,100),rr(0.35,0.55),sx,gy+rr(0,2),sx+Math.cos(a)*L,gy+Math.sin(a)*L); } } })();
  // the cargo boat: bottom, sheer, two plank seams, raked bow and stern, cabin arch with mat hatch, 橹; the sampan; the pier and deck
  (function(){ var Rl=function(st,al,w,a,b,c,d,z){ ctx.rline(st,Math.max(a,c),C.ink,al,w,a,b,c,d,z); }, bx, cy, px;
    Rl(ST.BOATS,200,0.85,786,298,934,298,298); Rl(ST.BOATS,190,0.8,790,279,930,279,298); Rl(ST.BOATS,150,0.6,788,286,932,286,298); Rl(ST.BOATS,150,0.6,787,292,933,292,298);
    ctx.bline(ST.BOATS,786,C.ink,210,0.8,[[778,282],[781,290],[786,298]],298); ctx.bline(ST.BOATS,942,C.ink,210,0.8,[[942,284],[938,292],[934,298]],298);
    ctx.bline(ST.BOATS,898,C.ink,200,0.75,[[821,279],[824,266],[835,262],[884,262],[893,266],[898,279]],298);
    for(bx=828;bx<890;bx+=2.2)Rl(ST.BOATS,rr(60,90),0.4,bx,264,bx+0.3,278,298);
    ctx.bline(ST.BOATS,972,C.ink,190,0.7,[[938,288],[956,296],[972,306]],298);
    Rl(ST.BOATS,200,0.8,254,382,306,382,382); Rl(ST.BOATS,180,0.7,258,367,300,367,382); Rl(ST.BOATS,140,0.55,256,375,304,375,382);
    ctx.bline(ST.BOATS,254,C.ink,200,0.75,[[248,372],[251,377],[254,382]],382); ctx.bline(ST.BOATS,312,C.ink,200,0.75,[[312,371],[309,377],[306,382]],382);
    Rl(ST.JIEHUA,200,0.85,552,200,552,330,330); Rl(ST.JIEHUA,200,0.85,568,200,568,322,330); Rl(ST.JIEHUA,200,0.85,568,322,578,330,330); Rl(ST.JIEHUA,170,0.7,552,330,578,330,330);
    for(cy=208;cy<326;cy+=8.5)Rl(ST.JIEHUA,rr(110,150),0.6,552,cy,568,cy+rr(-0.4,0.4),330);
    Rl(ST.JIEHUA,190,0.85,470,195,650,195,201); Rl(ST.JIEHUA,170,0.7,470,200,650,200,201); for(px=476;px<650;px+=8)Rl(ST.JIEHUA,rr(150,190),0.65,px,189,px,195,201);
    ctx.wash(ST.OCHRE,cargoP,C.ochre,0.3,3,3,298); ctx.wash(ST.OCHRE,sampanP,C.ochre,0.3,3,3,382); })();
  // water
  WATER.build(ctx,{x0:0,x1:1200,yTop:yTop,yBot:yBot,flow:[-1,0],flow2:[-0.45,-1],seam:[430,245],seamLen:250,density:1,kind:'confluence',piers:[{x:560,y:330,w:16}]});
}
