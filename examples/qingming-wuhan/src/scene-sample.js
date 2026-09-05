/* scene-sample.js — the scene the harness renders when proving itself.
   Two huts, a figure in front of one (its footprint stamped first, so the hut's ruler lines break behind it),
   a bare tree, a bank with a water cluster, a sign and a seal: every ctx primitive once. */
function sceneBuild(ctx){ var ST=ctx.ST, C=ctx.C, rr=ctx.rr, ri=ctx.ri, i;
  // ---------- phase A: footprints into the z-mask
  var huts=[{x:760,y:400,w:120,d:70,h:62},{x:560,y:330,w:96,d:56,h:52}];
  var fps=huts.map(function(s){ return SAMPLE.footprint(ctx,s); });
  for(i=0;i<fps.length;i++)ctx.masks.stampZ(fps[i]);
  var fig={x:712,y:428,h:58};
  var figFp={x0:fig.x-fig.h*0.2,x1:fig.x+fig.h*0.2,y0:fig.y-fig.h,y1:fig.y,z:fig.y,inside:function(x,y){ var u=(y-(fig.y-fig.h))/fig.h; var hw=u<0.15?fig.h*0.07:fig.h*(0.12+0.08*u); return Math.abs(x-fig.x)<hw&&y>=fig.y-fig.h&&y<=fig.y; }};
  ctx.masks.stampZ(figFp);
  // ---------- phase B
  for(i=0;i<huts.length;i++)SAMPLE.build(ctx,huts[i]);
  // a standing figure in 白描: hat, head, shoulder line, robe, belt, hem, feet — 7 strokes
  (function(){ var x=fig.x, y=fig.y, h=fig.h, z=fig.y, B=function(al,w,pts){ ctx.bline(ST.FIGURES,x+h*0.2,C.ink,al,w,pts,z); };
    B(230,0.7,[[x-h*0.06,y-h*0.98],[x,y-h*1.02],[x+h*0.06,y-h*0.98]]);
    B(200,0.55,[[x-h*0.055,y-h*0.97],[x-h*0.06,y-h*0.9],[x,y-h*0.86],[x+h*0.06,y-h*0.9],[x+h*0.055,y-h*0.97]]);
    B(210,0.65,[[x-h*0.17,y-h*0.8],[x-h*0.06,y-h*0.85],[x+h*0.07,y-h*0.85],[x+h*0.17,y-h*0.79]]);
    B(210,0.65,[[x-h*0.17,y-h*0.8],[x-h*0.2,y-h*0.55],[x-h*0.16,y-h*0.3],[x-h*0.19,y-h*0.06]]);
    B(210,0.65,[[x+h*0.17,y-h*0.79],[x+h*0.2,y-h*0.52],[x+h*0.15,y-h*0.3],[x+h*0.18,y-h*0.05]]);
    B(180,0.5,[[x-h*0.15,y-h*0.55],[x,y-h*0.53],[x+h*0.15,y-h*0.55]]);
    B(200,0.6,[[x-h*0.19,y-h*0.06],[x-h*0.05,y-h*0.02],[x+h*0.05,y-h*0.03],[x+h*0.18,y-h*0.05]]);
    ctx.dabs(ST.OCHRE,{x0:x-4,x1:x+4,y0:y-h*0.97,y1:y-h*0.86,z:z,inside:function(px,py){ return Math.abs(px-x)<h*0.05&&py>y-h*0.96&&py<y-h*0.87; }},C.ochre,0.35,2.5,2.2);
    ctx.wash(ST.INDIGO,[[x-h*0.16,y-h*0.78],[x+h*0.16,y-h*0.78],[x+h*0.17,y-h*0.08],[x-h*0.17,y-h*0.08]],C.huaqing,0.25,3,3,z);
    ctx.line(ST.FIGURES,x,C.ink,220,1.2,x-h*0.1,y-0.5,x-h*0.06,y-0.5); ctx.line(ST.FIGURES,x,C.ink,220,1.2,x+h*0.06,y-0.5,x+h*0.1,y-0.5); })();
  // a bare tree: double-line trunk with a knot, three levels of branches thinning, 蟹爪 tips
  (function(){ var x=380, y=420, H=130, z=y;
    ctx.bline(ST.TREES,x,C.ink,215,0.85,[[x-5,y],[x-4,y-H*0.3],[x-3,y-H*0.55],[x-1,y-H*0.75]],z);
    ctx.bline(ST.TREES,x,C.ink,215,0.85,[[x+4,y],[x+3,y-H*0.28],[x+2,y-H*0.5],[x+2,y-H*0.72]],z);
    ctx.bline(ST.TREES,x,C.ink,180,0.5,[[x-4,y-H*0.4],[x-2,y-H*0.42],[x-1,y-H*0.39],[x-3,y-H*0.37]],z);
    function branch(bx,by,ang,len,w,lvl){ var ex=bx+Math.cos(ang)*len, ey=by+Math.sin(ang)*len, mx=(bx+ex)/2+Math.cos(ang+Math.PI/2)*rr(-3,3), my=(by+ey)/2+Math.sin(ang+Math.PI/2)*rr(-3,3);
      ctx.bline(ST.TREES,Math.max(bx,ex),C.ink,lvl>2?150:200,w,[[bx,by],[mx,my],[ex,ey]],z);
      if(lvl>=3){ var n=ri(3,5); for(var k=0;k<n;k++){ var a=ang+rr(-0.9,0.9), L=rr(3,6); ctx.line(ST.TREES,ex,C.ink,170,0.4,ex,ey,ex+Math.cos(a)*L,ey+Math.sin(a)*L+1.5); } return; }
      var m=ri(2,3); for(var j=0;j<m;j++){ var da=(j-(m-1)/2)*rr(0.45,0.7)+rr(-0.15,0.15); branch(ex,ey,ang+da,len*rr(0.55,0.7),w*0.65,lvl+1); } }
    branch(x-1,y-H*0.75,-Math.PI/2+0.25,H*0.22,0.7,1); branch(x+1,y-H*0.72,-Math.PI/2-0.4,H*0.2,0.7,1); branch(x-3,y-H*0.5,-Math.PI/2-0.9,H*0.17,0.6,1);
    ctx.wash(ST.OCHRE,[[x-5,y],[x+4,y],[x+2,y-H*0.7],[x-1,y-H*0.7]],C.ochre,0.3,2.5,2.5,z);
    ctx.wash(ST.INDIGO,[[x-5,y],[x-1,y],[x-1,y-H*0.65],[x-4,y-H*0.6]],C.danmo,0.2,2.5,2,z); })();
  // bank: broken 淡墨 edge, short 皴, then a water cluster below and a 花青 band
  (function(){ var pts=[]; for(var x=120;x<=1100;x+=6)pts.push([x,455+3*Math.sin(x*0.02)+ctx.noise(x*0.01)*6]);
    ctx.chunks(ST.DRAFT,pts,C.ink,80,0.5);
    for(var gx=140;gx<1080;gx+=rr(30,90)){ var lean=rr(-0.7,0.3), n=ri(3,6), gy=455+3*Math.sin(gx*0.02)+ctx.noise(gx*0.01)*6;
      for(var k=0;k<n;k++){ var sx=gx+k*rr(2,4.5), L=rr(3,9)*(k===0||k===n-1?0.7:1), a=Math.PI/2+lean+rr(-0.15,0.15); ctx.line(ST.TREES,sx,C.ink,rr(50,100),rr(0.35,0.55),sx,gy+rr(0,2),sx+Math.cos(a)*L,gy+Math.sin(a)*L); } }
    ctx.wash(ST.OCHRE,[[120,458],[1100,458],[1100,480],[120,480]],C.ochre,0.18,3.5,3.5);
    for(var cx=200;cx<1050;cx+=rr(60,140)){ var n=ri(4,9), cy=rr(468,490), dir=rr(-0.15,0.15);
      for(var i=0;i<n;i++){ var L=rr(8,24), y0=cy+i*rr(1.6,2.6), x0=cx+rr(-4,4); ctx.pline(ST.WATER,x0+L,C.ink,rr(60,110),rr(0.35,0.5),[[x0,y0],[x0+L*0.3,y0-1.2+dir*L*0.3],[x0+L*0.7,y0-1.2+dir*L*0.7],[x0+L,y0+dir*L]],true); } }
    var band=[]; for(var bx=140;bx<=1080;bx+=8)band.push([bx,484+Math.sin(bx*0.03)*1.5]); ctx.chunks(ST.INDIGO,band,C.huaqing,14,10,1e9); })();
  // ink proof (D-08): the same 30-px wavy stroke in the three grades, x6 each; a junction of two strokes (a 衣纹 meeting the
  // shoulder line — no bead where they touch); three 90-px rules; five thin water plines; a seal at 2x — top-left, on bare silk
  (function(){ var G=[ctx.INK.primary,ctx.INK.structural,ctx.INK.texture], x0=40, y0=40;
    for(var r=0;r<3;r++)for(var k=0;k<6;k++){ var bx=x0+k*38, by=y0+r*14, pts=[]; for(var t=0;t<=30;t+=5)pts.push([bx+t,by+2.2*Math.sin(t*0.42)]);
      ctx.bline(ST.FIGURES,bx+30,C.ink,G[r][1],G[r][0],pts); }
    ctx.rline(ST.JIEHUA,x0+90,C.ink,ctx.INK.structural[1],ctx.INK.structural[0],x0,y0+48,x0+90,y0+48);
    ctx.rline(ST.JIEHUA,x0+90,C.ink,ctx.INK.texture[1],ctx.INK.texture[0],x0,y0+54,x0+90,y0+54);
    ctx.rline(ST.JIEHUA,x0+90,C.ink,ctx.INK.primary[1],ctx.INK.primary[0],x0,y0+60,x0+90,y0+60);
    ctx.rline(ST.JIEHUA,x0+90,C.ink,ctx.INK.primary[1],ctx.INK.primary[0],x0+90,y0+48,x0+90,y0+60);
    for(var q=0;q<5;q++){ var wx=x0+120+q*22, wp=[]; for(var u=0;u<=20;u+=4)wp.push([wx+u,y0+50+1.5*Math.sin(u*0.5)]); ctx.pline(ST.WATER,wx+20,C.ink,90,0.45,wp,true); }
    // junction: a primary shoulder line and a structural fold that starts on it
    ctx.bline(ST.FIGURES,x0+265,C.ink,ctx.INK.primary[1],ctx.INK.primary[0],[[x0+235,y0+62],[x0+250,y0+56],[x0+265,y0+57]]);
    ctx.bline(ST.FIGURES,x0+265,C.ink,ctx.INK.structural[1],ctx.INK.structural[0],[[x0+250,y0+56],[x0+248,y0+70],[x0+252,y0+84]]);
    // D-10(c) material styles, left to right: garment (default), branch, rock, rule — the same 40-px wavy stroke at structural grade, x2 each
    var SY=[ctx.INK.style.garment,ctx.INK.style.branch,ctx.INK.style.rock,ctx.INK.style.rule];
    for(var sr=0;sr<4;sr++)for(var sk=0;sk<2;sk++){ var sx=x0+sr*52, sy=y0+100+sk*10, sp=[]; for(var st2=0;st2<=40;st2+=5)sp.push([sx+st2,sy+2.5*Math.sin(st2*0.3)]);
      ctx.bline(ST.FIGURES,sx+40,C.ink,ctx.INK.structural[1],ctx.INK.structural[0],sp,undefined,SY[sr]); }
    ctx.sealStamp(ST.FINISH,x0+290,y0+30,36,'取法'); ctx.sealStamp(ST.FINISH,x0+340,y0+30,36,'珍藏'); ctx.sealStamp(ST.FINISH,x0+390,y0+30,36,'審定'); ctx.sealStamp(ST.FINISH,x0+440,y0+30,36,'不取景'); })();
  // sign in 楷 and a collector seal
  (function(){ var items=ctx.brush.brushText({text:'熱乾麵',x:668,y:352,size:11,font:'"Kaiti SC","STKaiti","KaiTi","Noto Serif SC"',horizontal:true,lineH:1.05,over:5,ink:0.9,dry:0,warp:0,tilt:0,wander:0});
    for(var i=0;i<items.length;i++)(function(it){ ctx.add(ST.FINISH,it.x,function(g){ for(var c=0;c<it.comps.length;c++)ctx.brush.stampDabs(g,it.comps[c],C.ink); }); })(items[i]);
    ctx.rline(ST.FINISH,706,C.zhusha,150,0.6,664,346,706,346); ctx.rline(ST.FINISH,706,C.zhusha,150,0.6,664,363,706,363);
    ctx.sealStamp(ST.FINISH,1160,28,16,'珍藏'); ctx.sealStamp(ST.FINISH,1160,50,16,'審定'); })();
}
