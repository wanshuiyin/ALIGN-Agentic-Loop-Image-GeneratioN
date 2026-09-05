/* scene-text.js — self-check for mod-text: three readable boards, six blobs, a figure standing in front of a 幌子,
   the colophon on the 220 px sheet with its two seals, collector seals at the right end.
   Three bare shopfronts (ruler lines only) give the signs something to hang on. */
function sceneBuild(ctx){ var ST=ctx.ST, C=ctx.C, rr=ctx.rr, ri=ctx.ri, i;
  var shops=[{x:1160,y:430,w:150,h:95},{x:920,y:440,w:170,h:100},{x:660,y:420,w:140,h:90}];
  var signs=[
    {fn:'sign',x:1085,y:352,text:'江漢關',size:18,style:'bian',board:'zhusha',z:432},
    {fn:'huangzi',x:1158,y:362,w:4,h:30,board:'zhusha',z:432},
    {fn:'sign',x:908,y:384,text:'蔡林記',size:13,vertical:true,style:'pai',z:442},
    {fn:'sign',x:812,y:358,text:'熱乾麵',size:14,style:'bian',z:442,tight:true},
    {fn:'sign',x:770,y:378,text:'豆皮',size:11,vertical:true,style:'pai',z:442},
    {fn:'sign',x:600,y:336,text:'四季美',size:12,style:'bian',z:422},
    {fn:'blob',x:858,y:386,w:24,h:8,style:'bian',z:442},
    {fn:'blob',x:652,y:362,w:8,h:24,style:'pai',z:422},
    {fn:'huangzi',x:562,y:365,w:4,h:34,z:422},
    {fn:'blob',x:612,y:352,w:22,h:7,style:'plain',z:422}];
  var fig={x:558,y:432,h:58};
  // ---------- phase A: footprints into the z-mask (shops, then signs at z+2, then the figure)
  for(i=0;i<shops.length;i++)(function(s){ ctx.masks.stampZ({x0:s.x-s.w-6,x1:s.x+6,y0:s.y-s.h-14,y1:s.y,z:s.y,inside:function(x,y){ return x>=s.x-s.w-6&&x<=s.x+6&&y>=s.y-s.h-14&&y<=s.y; }}); })(shops[i]);
  for(i=0;i<signs.length;i++){ var sp=signs[i]; ctx.masks.stampZ(TEXT.footprint(ctx,sp.fn==='huangzi'?{x:sp.x,y:sp.y,w:sp.w,h:sp.h,style:'fan',z:sp.z}:sp)); }
  ctx.masks.stampZ({x0:fig.x-fig.h*0.2,x1:fig.x+fig.h*0.2,y0:fig.y-fig.h,y1:fig.y,z:fig.y,inside:function(x,y){ var u=(y-(fig.y-fig.h))/fig.h; var hw=u<0.15?fig.h*0.07:fig.h*(0.12+0.08*u); return Math.abs(x-fig.x)<hw&&y>=fig.y-fig.h&&y<=fig.y; }});
  // ---------- phase B
  function shop(s){ var x=s.x, y=s.y, w=s.w, h=s.h, z=s.y, k, R=function(al,wd,a,b,c,d){ ctx.rline(ST.JIEHUA,Math.max(a,c),C.ink,al,wd,a,b,c,d,z); };
    ctx.line(ST.DRAFT,x,C.ink,70,0.5,x-w,y+0.5,x,y+0.5);
    R(180,0.8,x-w,y,x,y); R(150,0.6,x-w,y-3,x,y-3);
    for(k=0;k<=3;k++){ var px=x-w+k*w/3; R(rr(170,200),0.75,px,y-3,px,y-h); R(rr(140,170),0.6,px+2,y-3,px+2,y-h); }
    R(190,0.85,x-w-3,y-h,x+3,y-h); R(170,0.7,x-w-2,y-h+4,x+2,y-h+4); R(160,0.65,x-w-2,y-h+7,x+2,y-h+7);
    var top=y-h-14; R(200,0.9,x-w-6,top,x+6,top); for(var vx=x-w-4;vx<=x+4;vx+=rr(3.2,3.9))R(rr(70,110),0.45,vx,top,vx+1.5,y-h-0.5);
    var wx0=x-w*0.9, wx1=x-w*0.72, wy0=y-h*0.75, wy1=y-h*0.3; R(170,0.7,wx0,wy0,wx1,wy0); R(170,0.7,wx0,wy1,wx1,wy1); for(var bx=wx0+2;bx<wx1;bx+=2.2)R(rr(90,130),0.45,bx,wy0,bx,wy1);
    R(170,0.7,x-w*0.28,y-3,x-w*0.28,y-h*0.85); R(170,0.7,x-w*0.06,y-3,x-w*0.06,y-h*0.85); R(170,0.7,x-w*0.28,y-h*0.85,x-w*0.06,y-h*0.85);
    ctx.wash(ST.OCHRE,[[x-w,y-3],[x,y-3],[x,y-h],[x-w,y-h]],C.ochre,0.22,3,3,z);
    ctx.wash(ST.INDIGO,[[x-w,y-h],[x,y-h],[x,y-h+4],[x-w,y-h+4]],C.danmo,0.2,2.5,2.5,z); }
  for(i=0;i<shops.length;i++)shop(shops[i]);
  for(i=0;i<signs.length;i++)TEXT[signs[i].fn](ctx,signs[i]);
  // the figure: hat, head, shoulders, robe, belt, hem, feet — its footprint was stamped nearer than the 幌子 behind it
  (function(){ var x=fig.x, y=fig.y, h=fig.h, z=fig.y, B=function(al,w,pts){ ctx.bline(ST.FIGURES,x+h*0.2,C.ink,al,w,pts,z); };
    B(230,0.7,[[x-h*0.06,y-h*0.98],[x,y-h*1.02],[x+h*0.06,y-h*0.98]]);
    B(200,0.55,[[x-h*0.055,y-h*0.97],[x-h*0.06,y-h*0.9],[x,y-h*0.86],[x+h*0.06,y-h*0.9],[x+h*0.055,y-h*0.97]]);
    B(210,0.65,[[x-h*0.17,y-h*0.8],[x-h*0.06,y-h*0.85],[x+h*0.07,y-h*0.85],[x+h*0.17,y-h*0.79]]);
    B(210,0.65,[[x-h*0.17,y-h*0.8],[x-h*0.2,y-h*0.55],[x-h*0.16,y-h*0.3],[x-h*0.19,y-h*0.06]]);
    B(210,0.65,[[x+h*0.17,y-h*0.79],[x+h*0.2,y-h*0.52],[x+h*0.15,y-h*0.3],[x+h*0.18,y-h*0.05]]);
    B(180,0.5,[[x-h*0.15,y-h*0.55],[x,y-h*0.53],[x+h*0.15,y-h*0.55]]);
    B(200,0.6,[[x-h*0.19,y-h*0.06],[x-h*0.05,y-h*0.02],[x+h*0.05,y-h*0.03],[x+h*0.18,y-h*0.05]]);
    ctx.dabs(ST.OCHRE,{x0:x-4,x1:x+4,y0:y-h*0.97,y1:y-h*0.86,z:z,inside:function(px,py){ return Math.abs(px-x)<h*0.05&&py>y-h*0.96&&py<y-h*0.87; }},C.ochre,0.35,2.5,2.2);
    ctx.line(ST.FIGURES,x,C.ink,220,1.2,x-h*0.1,y-0.5,x-h*0.06,y-0.5); ctx.line(ST.FIGURES,x,C.ink,220,1.2,x+h*0.06,y-0.5,x+h*0.1,y-0.5); })();
  // 拖尾 and the right end
  TEXT.colophon(ctx,{text:COLOPHON,size:18,perCol:14,colGap:24});
  TEXT.collectorSeals(ctx);
}
