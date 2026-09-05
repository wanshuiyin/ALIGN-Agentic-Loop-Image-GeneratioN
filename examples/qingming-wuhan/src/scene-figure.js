/* scene-figure.js — self-check for mod-figure.js.
   Row 1: fourteen figures at h 55, mixed poses, both directions, unequal spacing. Row 2: the same idea at h 32 (the bridge scale).
   Row 3: every remaining pose once at h 55 (sanlun, the carriers, riders and sitters); row 4: the five action groups (FIGURE.group) at h 55, plus an ebike group at h 32 at the end of row 2; then the 热干面 queue and
   the stall cluster. Footprints are stamped first so overlapping figures clip each other. */
function sceneBuild(ctx){ var specs=[], i, r;
  function place(spec,cursor){ var fp=FIGURE.footprint(ctx,spec); spec.x+=cursor-fp.x0; fp=FIGURE.footprint(ctx,spec); ctx.masks.stampZ(fp); specs.push(spec); return fp.x1; }
  // round 9: row 0 = every silhouette template once at h 55, in TPL order
  var tn=FIGURE.tplNames, tc=14; for(i=0;i<tn.length;i++){ var ts={x:0,y:60,h:55,tpl:tn[i],dir:1,tint:i%3?'none':'indigo'}; tc=place(ts,tc)+5; }
  // round 11: row 1 = a street row of ten at h 55 with the four action outlines among the walkers (挑 biandan · 提 porter · 扶 pushBike ·
  // 转身 yield / pointing / look) — the check is that each figure's shape is its action, not its coat width
  var mix=['biandan','walk1','porter','look','pushBike','queue','yield','stand','pointing','walk2'];
  var mix2=['walk1','stand','walk2','phone','walk1','pointing','walk2','bargain','look','walk1','photographer','walk2','tourist','oldStick'];
  var rows=[[120,55,mix],[215,32,mix2.slice().reverse()],
    [330,55,['sanlun','biandan','umbrella','eating','squat','sitStool','pushBike','rideEbike','leadChild','porter','pair','womanBasket','cart','sweeping','dancePair','runChild']],
    [412,55,['g:ebike','g:bargain','g:porters','g:railLean','g:vendorBowl']]];
  for(r=0;r<rows.length;r++){ var y=rows[r][0], h=rows[r][1], names=rows[r][2], cursor=18;
    for(i=0;i<names.length;i++){ var nm=names[i], spec=nm.slice(0,2)==='g:'?{x:0,y:y+(i%3)*2,h:h,kind:nm.slice(2),dir:(i+r)%2?-1:1}:{x:0,y:y+(i%3)*2,h:h,pose:nm,dir:(i+r)%2?-1:1};
      cursor=place(spec,cursor)+ctx.rr(6,18)*h/55; }
    if(r===1){ var eb={x:0,y:y,h:32,kind:'ebike',dir:-1}; place(eb,cursor+20); } }
  // queue: a vendor shaking the 笊篱 behind his counter, six waiting toward him, spaced half a height, y staggered so fronts clip backs
  var qy=470, vend={x:118,y:qy,h:55,pose:'vendorZhaoli',dir:1}; ctx.masks.stampZ(FIGURE.footprint(ctx,vend)); specs.push(vend);
  var qposes=['queue','phone','queue','stand','phone','queue'], tints=['indigo','none','ochre','indigo','none','zhusha'];
  var qx=186; for(i=0;i<qposes.length;i++){ var q={x:qx,y:qy+(i%2?4:0)-(i===3?2:0),h:55,pose:qposes[i],dir:-1,tint:tints[i]}; ctx.masks.stampZ(FIGURE.footprint(ctx,q)); specs.push(q); qx+=ctx.rr(23,32); }
  // cluster round a stall: vendor behind the counter, two eating, one on the phone, a parent with child, a bargaining pair
  var sv={x:880,y:454,h:55,pose:'vendor',dir:1}, cl=[sv,{x:880+0.72*55,y:454,h:55,pose:'buy',dir:-1,tint:'indigo'},
    {x:952,y:470,h:56,pose:'eating',dir:-1,tint:'indigo'},{x:812,y:474,h:57,pose:'eating',dir:1,tint:'none'},
    {x:1000,y:480,h:58,pose:'phone',dir:-1,tint:'ochre'},{x:760,y:478,h:58,pose:'leadChild',dir:1,tint:'indigo'},{x:1085,y:474,h:57,pose:'bargain',dir:1,tint:'none'}];
  for(i=0;i<cl.length;i++){ ctx.masks.stampZ(FIGURE.footprint(ctx,cl[i])); specs.push(cl[i]); }
  // ground lines under the rows so feet have something to stand on
  for(r=0;r<rows.length;r++){ var pts=[]; for(var x=10;x<=1190;x+=8)pts.push([x,rows[r][0]+2+ctx.noise(x*0.02,r)*3]); ctx.chunks(ctx.ST.DRAFT,pts,ctx.C.ink,70,0.5); }
  for(i=0;i<specs.length;i++){ if(specs[i].kind)FIGURE.group(ctx,specs[i]); else FIGURE.build(ctx,specs[i]); }
}
