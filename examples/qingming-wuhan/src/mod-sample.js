/* mod-sample.js — a stand-in module in the contract shape, used only by harness.html.
   A one-storey 悬山 hut: (x,y) = ground contact of the front-right corner, w frontage, d depth along ctx.OBL, h eave height.
   ctx.OBL points up-left, so the visible flank is the left one, receding from (x-w,y). */
var SAMPLE=(function(){
  function geom(ctx,s){ var ox=ctx.OBL[0]*s.d, oy=ctx.OBL[1]*s.d, rise=s.w*0.22, x=s.x, y=s.y, w=s.w, h=s.h;
    return {ox:ox,oy:oy,rise:rise,
      front:[[x-w,y],[x,y],[x,y-h],[x-w,y-h]],
      side:[[x-w,y],[x-w+ox,y+oy],[x-w+ox,y+oy-h],[x-w,y-h]],
      gable:[[x-w,y-h],[x,y-h],[x-w/2,y-h-rise]],
      roof:[[x-w/2,y-h-rise],[x-w,y-h],[x-w+ox,y+oy-h],[x-w/2+ox,y+oy-h-rise]],
      sil:[[x-w,y],[x,y],[x,y-h],[x-w/2,y-h-rise],[x-w/2+ox,y+oy-h-rise],[x-w+ox,y+oy-h],[x-w+ox,y+oy]]}; }
  function footprint(ctx,s){ var G=geom(ctx,s), P=G.sil, x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for(var i=0;i<P.length;i++){ x0=Math.min(x0,P[i][0]); x1=Math.max(x1,P[i][0]); y0=Math.min(y0,P[i][1]); y1=Math.max(y1,P[i][1]); }
    return {x0:x0,x1:x1,y0:y0,y1:y1,z:s.z===undefined?s.y:s.z,inside:ctx.polyInside(P)}; }
  function build(ctx,s){ var ST=ctx.ST, C=ctx.C, rr=ctx.rr, G=geom(ctx,s), z=s.z===undefined?s.y:s.z, x=s.x, y=s.y, w=s.w, h=s.h, ox=G.ox, oy=G.oy, rise=G.rise, i;
    var R=function(al,wd,a,b,c,d){ ctx.rline(ST.JIEHUA,Math.max(a,c),C.ink,al,wd,a,b,c,d,z); };
    // 起稿: footprint line
    ctx.line(ST.DRAFT,x,C.ink,70,0.5,x-w,y+0.5,x,y+0.5); ctx.line(ST.DRAFT,x-w,C.ink,70,0.5,x-w,y+0.5,x-w+ox,y+oy+0.5);
    // 界画: 台基, corner posts as line pairs, 额枋, eaves, ridge, gable, 瓦垄
    R(180,0.8,x-w,y,x,y); R(180,0.8,x-w,y,x-w+ox,y+oy); R(150,0.6,x-w,y-3,x,y-3);
    for(i=0;i<=3;i++){ var px=x-w+i*w/3; R(rr(170,200),0.75,px,y-3,px,y-h); R(rr(140,170),0.6,px+2,y-3,px+2,y-h); }
    R(190,0.85,x-w-2,y-h,x+2,y-h); R(170,0.7,x-w-2,y-h+3,x+2,y-h+3);
    R(200,0.9,x-w-4,y-h,x-w/2,y-h-rise); R(200,0.9,x-w/2,y-h-rise,x+4,y-h);
    R(200,0.9,x-w/2,y-h-rise,x-w/2+ox,y+oy-h-rise); R(190,0.85,x-w,y-h,x-w+ox,y+oy-h); R(180,0.8,x-w+ox,y+oy-h,x-w+ox,y+oy);
    var n=Math.round(Math.abs(ox)/3.4); for(i=1;i<n;i++){ var t=i/n, ax=x-w/2+ox*t, ay=y-h-rise+oy*t, bx=x-w+ox*t, by=y-h+oy*t; R(rr(70,110),0.45,ax,ay,bx,by); }
    // 直棂窗 in the middle bay, 板门 in the right bay
    var wx0=x-w*0.62, wx1=x-w*0.4, wy0=y-h*0.78, wy1=y-h*0.32; R(170,0.7,wx0,wy0,wx1,wy0); R(170,0.7,wx0,wy1,wx1,wy1); for(var bx2=wx0+2;bx2<wx1;bx2+=2.2)R(rr(90,130),0.45,bx2,wy0,bx2,wy1);
    R(170,0.7,x-w*0.25,y-3,x-w*0.25,y-h*0.85); R(170,0.7,x-w*0.08,y-3,x-w*0.08,y-h*0.85); R(170,0.7,x-w*0.25,y-h*0.85,x-w*0.08,y-h*0.85);
    // colour: 赭石 on wall and posts, 花青 on the roof slope thinning toward the eave, 淡墨 under the eave; 复勾 of the eave line
    ctx.wash(ST.OCHRE,G.front,C.ochre,0.3,3,3,z); ctx.wash(ST.OCHRE,G.side,C.ochre2,0.28,3,3,z);
    ctx.dabs(ST.INDIGO,{x0:x-w+ox,x1:x-w/2,y0:y+oy-h-rise,y1:y-h,z:z,inside:ctx.polyInside(G.roof),edge:ctx.polyEdge(G.roof)},C.huaqing,0.3,3,3,function(px,py){ var u=(py-(y-h-rise))/(rise+Math.abs(oy)); return ctx.R()>u*0.8; });
    ctx.wash(ST.INDIGO,[[x-w,y-h],[x,y-h],[x,y-h+4],[x-w,y-h+4]],C.danmo,0.2,2.5,2.5,z);
    ctx.bline(ST.FINISH,x,C.ink,105,0.6,[[x-w-3,y-h+0.3],[x-w/2,y-h-0.2],[x+3,y-h+0.3]],z);
    var fp=footprint(ctx,s); ctx.reg.buildings.push({fp:fp,slots:{}}); return {fp:fp,slots:{}}; }
  return {footprint:footprint,build:build};
})();
