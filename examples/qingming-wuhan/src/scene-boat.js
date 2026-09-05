/* scene-boat.js — self-check scene for mod-boat.js (1200×500, CW=0): ferry, tug with folded mast, 2×2 barge convoy pushed by a
   tug, 楼船, 海事艇, 划子, 汉江渡船, and two 汴河 cargo boats; water band across the middle; figures on the seats.
   D-12 (2): a tug under a drawn beam line at clearance 40 (bottom middle). */
function sceneBuild(ctx){ var i;
  var boats=[
    {x:1180,y:300,type:'ferry',len:260,dir:-1,moving:true},
    {x:880, y:395,type:'song', len:190,dir:1,ropeTo:[1010,262]},
    {x:640, y:290,type:'tug',  len:165,dir:1,mastFolded:true},
    {x:1150,y:470,type:'louchuan',len:170,dir:-1,moving:true},
    {x:470, y:420,type:'barge',len:190,dir:1},{x:470,y:406,type:'barge',len:190,dir:1,z:400},
    {x:280, y:420,type:'barge',len:190,dir:1},{x:280,y:406,type:'barge',len:190,dir:1,z:400},
    {x:62,  y:422,type:'tug',  len:150,dir:1,moving:true,tow:true,towTo:[92,417]},
    {x:380, y:300,type:'haishi',len:80,dir:-1,moving:true},
    {x:960, y:340,type:'huazi',len:55,dir:1},
    {x:760, y:470,type:'duchuan',len:120,dir:-1},
    {x:230, y:298,type:'song', len:150,dir:-1},
    {x:615,y:468,type:'tug',  len:150,dir:-1,moving:true,clearance:40,z:469}
  ];
  ctx.masks.stampWater([[0,250],[1200,250],[1200,500],[0,500]]);
  for(i=0;i<boats.length;i++)ctx.masks.stampZ(BOAT.footprint(ctx,boats[i]));
  // the beam line the clearance tug must stay under: a ruled line 40 px above its waterline, drawn in front of everything
  ctx.rline(ctx.ST.FINISH,630,ctx.C.ink,220,0.9,452,428,630,428,999);
  var recs=[]; for(i=0;i<boats.length;i++)recs.push(BOAT.build(ctx,boats[i]));
  if(typeof FIGURE!=='undefined'){ var figs=[], k; for(i=0;i<recs.length;i++)for(k=0;k<recs[i].seats.length;k++){ var st=recs[i].seats[k]; if(FIGURE.POSES[st.pose])figs.push({x:st.x,y:st.y,h:st.h,pose:st.pose,dir:st.dir,z:st.z}); }
    for(i=0;i<figs.length;i++)ctx.masks.stampZ(FIGURE.footprint(ctx,figs[i])); for(i=0;i<figs.length;i++)FIGURE.build(ctx,figs[i]); }
}
