/* scene-arch.js — self-check scene for mod-arch.js on the 1200×500 harness (D-10 round).
   Two street rows (連續街屋) overlapping at 40 %: a 戶部巷 row in front with signs, a 漢正街 row behind and paler; a 里份 row; a 江漢路 row;
   plus the older kinds so nothing regressed: 江漢關, the 歇山 hall behind a canopy, a bridge piece, 牌坊, 趸船, steps, embankment, 电视塔. */
function sceneBuild(ctx){ var specs=[
  {kind:'jianghanguan',x:1170,y:300,w:200,h:90,d:56,sign:'江漢關'},
  {kind:'hall',x:860,y:270,w:150,d:70,h:72,roof:'xieshan',dougong:true,chiwen:true,dingding:true,bays:5,sign:'葉開泰'},
  {kind:'bridge',x:380,y:150,spans:3,span:80,first:1,total:9,rise:15,water:280,approach:{right:0,left:0},pavilion:{right:true,left:false},train:{x:200,n:4}},
  {kind:'paifang',x:520,y:280,w:80,h:80,sign:'戶部巷'},
  {kind:'wharf',x:120,y:280,len:100},
  {kind:'steps',x:960,y:250,w:36,n:8},
  {kind:'embankment',x:1190,y:496,w:70,h:14},
  {kind:'tvtower',x:520,y:280,h:260},
  // round 10 (D-17): 黄鹤楼 at its full 360 px, on a stone 台基 with 石阶, the 「黃鶴樓」 board under the main eave
  {kind:'huanghelou',x:700,y:392,w:150,h:360,sign:'黃鶴樓',z:392},
  // D-10: the row behind, 40 % overlapped by the row in front (the front row's z is higher)
  {kind:'streetRow',row:'hanzhengjie',x:1010,y:402,w:300,h:80,pale:0.85,z:402},
  // round 6 (tell 6): a 漢正街 waterside row of six units at 1× — sheds, houses, lanes with steps to the water
  {kind:'streetRow',row:'hanzhengjie',x:460,y:335,w:330,h:84,z:335,waterside:true,signs:['布','百貨']},
  // round 9 (D-16, tell 3c): the rear 漢正街 row as ONE connected mass (row kind 'hzrear') behind the waterside row, the way main.js's y:258 row should be built
  {kind:'streetRow',row:'hzrear',x:340,y:150,w:250,h:64,z:150,pale:0.85,rise:10},
  {kind:'streetRow',row:'hubuxiang',x:1150,y:474,w:460,h:96,signs:['熱乾麵','老通城'],z:474,cornerHouse:true},   // D-12 (4): ends in a corner house
  {kind:'cornerHouse',x:1190,y:330,w:96,d:56,h:74,storeys:3,z:330,sign:'民衆樂園'},
  // D-12 (d): two tall buildings side by side that must differ (storey height, window rhythm, ending)
  {kind:'colonnade',x:1000,y:330,w:70,h:72,d:36,storeys:2,bays:3,z:330},{kind:'colonnade',x:925,y:330,w:66,h:70,d:34,storeys:2,bays:3,z:330},
  {kind:'streetRow',row:'lilong',x:470,y:470,w:330,h:104,z:470},
  {kind:'streetRow',row:'jianghanlu',x:1080,y:250,w:300,h:90,z:250,pale:0.8,signs:['亨達利']}], i;
  for(i=0;i<specs.length;i++){ var fp=ARCH.footprint(ctx,specs[i]); ctx.masks.stampZ(fp); if(fp.rail)ctx.masks.stampZ(fp.rail); }
  var cx=740, cy=220, canopy={x0:cx-42,x1:cx+42,y0:cy-40,y1:cy+40,z:340,inside:function(x,y){ var dx=(x-cx)/42, dy=(y-cy)/38; return dx*dx+dy*dy<1; }};
  ctx.masks.stampZ(canopy);
  for(i=0;i<specs.length;i++){ var rec=ARCH.build(ctx,specs[i]);
    // round 7: the integrator's 積墨 under 戶部巷's eaves, laid the way main.js's jimo does but through the slot's rounded `inside` and feathered `pred` (the self-check of D-14's 修邊)
    if(specs[i].row==='hubuxiang')for(var k=0;k<rec.slots.shadeUnderEave.length;k++)(function(su){ var hh=su.y1-su.y0, nb=Math.max(2,Math.round(hh/3)), b;
      for(b=0;b<nb;b++)(function(ya,yb,ink){ ctx.dabs(ctx.ST.INDIGO,{x0:su.x0,x1:su.x1,y0:ya,y1:yb,z:su.z,inside:function(x,y){ return y>=ya&&y<=yb&&su.inside(x,y); }},ctx.C.danmo,ink*1.9,1.2,1.5,su.pred); })(su.y0+hh*b/nb,su.y0+hh*(b+1)/nb+0.6,0.35-0.23*(b+0.5)/nb); })(rec.slots.shadeUnderEave[k]); }
  ctx.add(ctx.ST.TREES,cx+42,function(g){ g.noStroke(); g.fill(60,70,40,40); g.ellipse(cx,cy,84,76); });
}
