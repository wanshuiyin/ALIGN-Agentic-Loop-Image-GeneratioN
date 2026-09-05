/* scene-tree.js — self-check scene for mod-tree.js in the harness (1200×500, CW=0).
   A near bank with rocks and one of every kind at h 90–140 rooted along it; behind, a 600-px hill (蛇山-shaped ridge) with two
   pines standing on its body and a small 杂 tree at its foot, so the hill's 皴 and wash are cut under their trunks. */
function sceneBuild(ctx){ var i, x;
  var trees=[
    {x:1150,y:414,h:42, kind:'luwei',dir:-1},
    {x:1060,y:410,h:130,kind:'huai', dir:-1},
    {x:880, y:416,h:140,kind:'wutong',dir:1},
    {x:760, y:404,h:110,kind:'za',   dir:-1},
    {x:640, y:412,h:90, kind:'ying', dir:1},
    {x:500, y:408,h:125,kind:'liu',  dir:-1},
    {x:380, y:416,h:95, kind:'tao',  dir:1},
    {x:220, y:410,h:130,kind:'song', dir:1},
    {x:118, y:412,h:40, kind:'luwei',dir:1},
    {x:100, y:410,h:36, kind:'luwei',dir:1},
    {x:700, y:262,h:96, kind:'song', dir:-1},
    {x:540, y:284,h:80, kind:'song', dir:1},
    // the 东湖 grove (D-13 self-check): five trees at h 90–140 standing close, as in front of the hut
    {x:1170,y:338,h:120,kind:'huai', dir:-1},
    {x:1118,y:344,h:140,kind:'za',   dir:1, feature:true, weave:true}, // the central slanting tree: one big limb carries the knot (D-14) AND the crown is woven (D-16: both on one tree)
    {x:1072,y:336,h:96, kind:'huai', dir:1, weave:true}, // the tree next to the featured one: its twigs woven into a mass (D-15)
    {x:1030,y:346,h:132,kind:'wutong',dir:-1},
    {x:985, y:334,h:104,kind:'wutong',dir:-1, weave:true}, // a woven 梧桐 at the grove's end: its balls sit only where twigs cross
    {x:150, y:302,h:130,kind:'za',   dir:1, feature:true, weave:true}, // a lone tree on the far shore with knot AND weave (D-16 self-check at 2.5×)
    {x:300, y:300,h:135,kind:'za',   dir:-1, main:true}]; // the main tree (D-19, B9 tell 5): leaning left, right-side limbs gathered into a knot, left-side limbs reaching out
  var rocks=[{x:150,y:406,h:16,kind:'rock',dir:1},{x:238,y:420,h:20,kind:'rock',dir:-1},{x:545,y:416,h:22,kind:'rock',dir:1},{x:700,y:400,h:12,kind:'rock',dir:-1},{x:960,y:412,h:18,kind:'rock',dir:1},{x:1120,y:404,h:14,kind:'rock',dir:-1},{x:560,y:296,h:10,kind:'rock',dir:1}];
  // the ridge, right to left: rises from the ground at both ends to TWO peaks with a saddle between (D-14: a valley runs down from it)
  var ridge=[]; for(x=950;x>=350;x-=15){ var t=(950-x)/600, p1=Math.exp(-Math.pow((t-0.3)/0.17,2))*58, p2=Math.exp(-Math.pow((t-0.7)/0.15,2))*72, base=Math.sin(t*Math.PI)*14; ridge.push([x,300-p1-p2-base+ctx.noise(x*0.02,9.1)*6]); }
  var hillSpec={pts:ridge,depth:52,tone:'ink'};
  // phase A: every footprint into the z-mask — the hill first, the things standing on it after
  ctx.masks.stampZ(TREE.hillFootprint(ctx,hillSpec));
  var all=trees.concat(rocks);
  for(i=0;i<all.length;i++)ctx.masks.stampZ(TREE.footprint(ctx,all[i]));
  // phase B: ground first (hill, bank), then rocks and trees
  TREE.hill(ctx,hillSpec);
  var near=[];
  for(x=40;x<=1180;x+=12)near.push([x,398+6*Math.sin(x*0.011)+ctx.noise(x*0.01,3.1)*8]);
  TREE.bank(ctx,{pts:near,depth:34,slope:-0.35});
  var farB=[]; for(x=40;x<=330;x+=12)farB.push([x,300+ctx.noise(x*0.02,4.4)*4]);
  TREE.bank(ctx,{pts:farB,depth:14,slope:-0.3,grass:1});
  for(i=0;i<rocks.length;i++)TREE.build(ctx,rocks[i]);
  for(i=0;i<trees.length;i++)TREE.build(ctx,trees[i]);
}
