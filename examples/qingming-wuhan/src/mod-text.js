/* mod-text.js — 招牌、幌子、匾 and the 拖尾 colophon.
   Readable boards (≤ 14 in the scroll) are 楷 written by the brush-text engine in FINISH; every other sign is an
   unreadable ink mass (blob) built from short dab-runs with dry gaps. Boards, cloth banners and their poles are
   drawn here in JIEHUA (淡墨/朱砂 frame band in INDIGO) so the arch module can leave its signRect empty and pass it on.
   (x,y) of every sign is the centre of its board or cloth. z is the host building's z+2: the board then hides the wall
   lines behind it, and any figure nearer than the building hides the board. */
var TEXT=(function(){
  var KAI='"Kaiti SC","STKaiti","KaiTi","Noto Serif SC"';
  var DEF={pai:[8,24],bian:[24,8],fan:[4,30],plain:[7,7]};

  function rect(x0,y0,x1,y1,z){ return {x0:x0,y0:y0,x1:x1,y1:y1,z:z,inside:function(x,y){ return x>=x0&&x<=x1&&y>=y0&&y<=y1; }}; }

  // Shared layout: the board/cloth rectangle around (x,y), the text origin (centre of the first character) and its pitch.
  // With text: the board is sized from the characters unless w/h are given. Without text (blob): w/h or the style default.
  function layout(ctx,s){
    var text=s.text||'', n=text.length, vertical=s.vertical===undefined?(n?false:(s.h||0)>(s.w||0)):!!s.vertical,
        style=s.style||(n?(vertical?'pai':'bian'):'pai'), size=s.size||14, pitch=size*(vertical?1.12:1.25),
        header=style==='pai'?(n?size*0.5:Math.min(4,(s.h||DEF.pai[1])*0.18)):0, textW=0, textH=0, w, h;
    if(n){ textW=vertical?size:(n-1)*pitch+size; textH=vertical?(n-1)*pitch+size:size;
      if(style==='plain'){ w=textW+size*0.2; h=textH+size*0.2; }
      else if(style==='bian'){ w=textW+size*1.0; h=textH+size*0.6; }
      else if(style==='pai'){ w=textW+size*0.45; h=textH+size*0.9+header; }
      else { w=textW+size*0.5; h=textH+size*1.1; } }
    else { w=DEF[style][0]; h=DEF[style][1]; }
    if(s.w)w=s.w; if(s.h)h=s.h;
    var x0=s.x-w/2, y0=s.y-h/2, x1=x0+w, y1=y0+h, tx, ty;
    if(vertical){ tx=s.x; ty=y0+header+(h-header-textH)/2+size/2; } else { tx=x0+(w-textW)/2+size/2; ty=s.y; }
    // the sign-writer never centres exactly: a little to one side, a hair above the middle (settled once per board in sign())
    tx+=s.dx||0; ty-=s.dy||0;
    return {text:text,n:n,vertical:vertical,style:style,size:size,pitch:pitch,header:header,w:w,h:h,x0:x0,y0:y0,x1:x1,y1:y1,tx:tx,ty:ty,z:s.z===undefined?s.y:s.z};
  }

  function footprint(ctx,s){ var L=layout(ctx,s); return rect(L.x0-1,L.y0-1,L.x1+1,L.y1+1,L.z); }

  // Frame insets scale with the board's short side so an 8-px hanging board keeps an interior.
  function insets(L){ var sh=Math.min(L.w,L.h); return {a:Math.min(1.2,sh*0.1),b:Math.min(2.4,sh*0.2)}; }

  // Board or cloth. Board: outer ruler line, a light inner moulding line, and the band between them laid as pigment dabs —
  // 淡墨 (board='ink') or 朱砂 (board='zhusha'); 'pai' adds the header divider and the tie it hangs from.
  // Cloth ('fan'): pole, two ties, batten, free-hand long edges that sag a little, swallow-tail hem; 朱砂 along both edges when asked.
  function frame(ctx,L,board){
    var ST=ctx.ST, C=ctx.C, rr=ctx.rr, z=L.z, x0=L.x0, y0=L.y0, x1=L.x1, y1=L.y1, cx=(x0+x1)/2, cy=(y0+y1)/2;
    function j(){ return rr(-0.25,0.25); }
    function Rl(al,w,a,b,c,d,over){ ctx.rline(ST.JIEHUA,Math.max(a,c),C.ink,al,w,a,b,c,d,z,over); }
    var bc=board==='zhusha'?C.zhusha:C.danmo, bk=board==='zhusha'?0.62:0.3;
    function band(poly,w){ ctx.wash(ST.INDIGO,poly,bc,bk,Math.max(0.7,w*0.6),Math.max(0.7,w*0.55),z); }
    if(L.style==='fan'){
      var py=y0-rr(1.5,2.5), bl=rr(-0.7,0.7), br=rr(-0.7,0.7), notch=Math.min(L.w*0.35,4);
      Rl(190,0.75,x0-rr(2,4),py,x1+rr(6,12),py-rr(0,1.2));
      ctx.line(ST.JIEHUA,x0+1,C.ink,140,0.45,x0+0.8,y0,x0+0.6,py); ctx.line(ST.JIEHUA,x1,C.ink,140,0.45,x1-0.8,y0,x1-0.6,py);
      Rl(180,0.7,x0,y0,x1,y0,0.3);
      ctx.bline(ST.JIEHUA,x0+1,C.ink,205,0.6,[[x0,y0],[x0+bl,cy],[x0+bl*0.4,y1]],z);
      ctx.bline(ST.JIEHUA,x1,C.ink,205,0.6,[[x1,y0],[x1+br,cy],[x1+br*0.4,y1]],z);
      ctx.bline(ST.JIEHUA,cx,C.ink,200,0.55,[[x0+bl*0.4,y1],[cx,y1-notch]],z); ctx.bline(ST.JIEHUA,x1,C.ink,200,0.55,[[cx,y1-notch],[x1+br*0.4,y1]],z);
      if(board==='zhusha'){ var ew=Math.min(0.9,L.w*0.22);
        band([[x0+0.5,y0+1.2],[x0+0.5+ew,y0+1.2],[x0+0.5+ew+bl*0.4,y1-1.2],[x0+0.5+bl*0.4,y1-1.2]],ew);
        band([[x1-0.5-ew,y0+1.2],[x1-0.5,y0+1.2],[x1-0.5+br*0.4,y1-1.2],[x1-0.5-ew+br*0.4,y1-1.2]],ew); }
      return; }
    var I=insets(L), a=I.a, b=I.b, a0=a*0.45, a1=b-0.15, bw=a1-a0;
    Rl(200,0.8,x0+j(),y0+j(),x1+j(),y0+j()); Rl(200,0.8,x0+j(),y1+j(),x1+j(),y1+j()); Rl(195,0.8,x0+j(),y0+j(),x0+j(),y1+j()); Rl(195,0.8,x1+j(),y0+j(),x1+j(),y1+j());
    Rl(150,0.5,x0+b,y0+b,x1-b,y0+b,0); Rl(150,0.5,x0+b,y1-b,x1-b,y1-b,0); Rl(150,0.5,x0+b,y0+b,x0+b,y1-b,0); Rl(150,0.5,x1-b,y0+b,x1-b,y1-b,0);
    band([[x0+a0,y0+a0],[x1-a0,y0+a0],[x1-a0,y0+a1],[x0+a0,y0+a1]],bw); band([[x0+a0,y1-a1],[x1-a0,y1-a1],[x1-a0,y1-a0],[x0+a0,y1-a0]],bw);
    band([[x0+a0,y0+a1],[x0+a1,y0+a1],[x0+a1,y1-a1],[x0+a0,y1-a1]],bw); band([[x1-a1,y0+a1],[x1-a0,y0+a1],[x1-a0,y1-a1],[x1-a1,y1-a1]],bw);
    if(L.style==='pai'){ Rl(165,0.6,x0+b,y0+L.header,x1-b,y0+L.header,0);
      ctx.line(ST.JIEHUA,cx,C.ink,160,0.5,cx,y0,cx+rr(-1,1),y0-rr(5,9)); }
  }

  // Stamp brush-text items in FINISH; with z, dabs on cells a nearer object occupies are dropped (occlusion by not drawing).
  function stamp(ctx,items,size,z){ var ST=ctx.ST, C=ctx.C, hid=ctx.masks.hidden;
    for(var i=0;i<items.length;i++)(function(it,idx){ var comps=[], c, k;
      for(c=0;c<it.comps.length;c++){ var d=it.comps[c], keep=[];
        for(k=0;k<d.length;k++)if(z===undefined||!hid(d[k].x,d[k].y,z))keep.push(d[k]);
        if(keep.length)comps.push(keep); }
      if(!comps.length)return;
      ctx.add(ST.FINISH,it.x+size*0.5-idx*0.01,function(g){ for(var q=0;q<comps.length;q++)ctx.brush.stampDabs(g,comps[q],C.ink); }); })(items[i],i); }

  // 楷 on a board. Horizontal boards read right → left (the scroll's own direction), so the string is laid out reversed.
  // The characters sit off the board's centre (dx, dy, settled here and written back to the spec so footprint agrees),
  // their pitch is the board's own (s.tight → a touch closer), and the ink load differs from board to board.
  function sign(ctx,s){ var rr=ctx.rr; if(s.dx===undefined)s.dx=rr(-3,3); if(s.dy===undefined)s.dy=rr(1,2);
    var L=layout(ctx,s), board=s.board===undefined?'ink':s.board;
    if(L.style!=='plain'&&board)frame(ctx,L,board);
    var text=L.vertical?L.text:L.text.split('').reverse().join(''), pitch=L.pitch*(s.tight?0.93:1);
    var items=ctx.brush.brushText({text:text,x:L.tx,y:L.ty,size:L.size,font:KAI,horizontal:!L.vertical,perCol:Math.max(1,L.n),lineH:pitch/L.size,over:5,ink:s.ink||0.9,dry:0,warp:0,tilt:0,wander:0,SS:6});
    stamp(ctx,items,L.size,L.z);
    var fp=footprint(ctx,s); ctx.reg.slots.push({kind:'sign',text:L.text,fp:fp}); return {fp:fp,slots:{tx:L.tx,ty:L.ty}}; }

  // One unreadable character: 2–3 horizontal bars (rising a little to the right, as 楷 does), 1–2 verticals, sometimes a
  // 撇 or 捺; each stroke is a run of dabs with a heavier entry, a tapering exit and, on the longer runs, a dry gap.
  function glyph(ctx,gx,gy,gs,z,tone,wt){ var rr=ctx.rr, R=ctx.R, hid=ctx.masks.hidden, out=[], strokes=[], k; wt=wt||1;
    var nh=R()<0.65?3:2, vs=nh===2?[0.3,0.72]:[0.18,0.5,0.82];
    for(k=0;k<nh;k++){ var l=rr(0.6,0.95), u0=0.5-l/2+rr(-0.08,0.08), v=vs[k]+rr(-0.05,0.05); strokes.push([u0,v,u0+l,v-rr(0.02,0.06),0.85]); }
    var nv=R()<0.55?2:1, us=nv===1?[rr(0.4,0.6)]:[rr(0.22,0.38),rr(0.62,0.8)];
    for(k=0;k<nv;k++)strokes.push([us[k],rr(0.05,0.25),us[k]+rr(-0.03,0.03),rr(0.75,0.98),1.1]);
    if(R()<0.65){ if(R()<0.5)strokes.push([rr(0.55,0.7),rr(0.35,0.5),rr(0.8,0.95),rr(0.8,0.95),0.9]); else strokes.push([rr(0.4,0.55),rr(0.3,0.45),rr(0.05,0.2),rr(0.75,0.9),0.8]); }
    var r0=Math.max(0.28,gs*0.085)*Math.pow(wt,0.6), x0=gx-gs/2, y0=gy-gs/2, base=gs<3.5?0.8:0.72;
    for(k=0;k<strokes.length;k++){ var st=strokes[k], ax=x0+st[0]*gs, ay=y0+st[1]*gs, bx=x0+st[2]*gs, by=y0+st[3]*gs, len=Math.sqrt((bx-ax)*(bx-ax)+(by-ay)*(by-ay));
      var m=Math.max(2,Math.round(len/0.55)), gap=len>2.5&&R()<0.4, g0=rr(0.3,0.7), g1=g0+rr(0.08,0.2), a0=ctx.clamp(base*tone*rr(0.85,1.15),0.3,0.92);
      for(var i=0;i<=m;i++){ var t=i/m; if(gap&&t>g0&&t<g1)continue;
        var x=ax+(bx-ax)*t+rr(-0.12,0.12), y=ay+(by-ay)*t+rr(-0.12,0.12); if(z!==undefined&&hid(x,y,z))continue;
        var wm=t<0.15?1.3:t>0.75?1-0.45*(t-0.75)/0.25:1;
        out.push({x:x,y:y,r:r0*st[4]*wm*rr(0.9,1.1),a:a0*rr(0.9,1.05)}); } }
    return out; }

  // Unreadable 6–9 px sign: n pseudo-characters laid down the long axis of the rectangle, inside an optional frame.
  function blob(ctx,s){ var ST=ctx.ST, C=ctx.C, rr=ctx.rr, L=layout(ctx,s), board=s.board===undefined?'ink':s.board;
    if(L.style!=='plain'&&board)frame(ctx,L,board);
    var inset=L.style==='plain'?0:L.style==='fan'?0.6:insets(L).b+0.3, ix0=L.x0+inset, iy0=L.y0+L.header+inset, ix1=L.x1-inset, iy1=L.y1-inset;
    var iw=ix1-ix0, ih=iy1-iy0, along=L.vertical?ih:iw, across=L.vertical?iw:ih;
    var gs=ctx.clamp(across*0.9,2.4,9), n=s.n||(L.style==='fan'?ctx.clamp(Math.round(along/7.5),2,4):ctx.clamp(Math.round(along/(gs*1.3)),2,4)), pitch=along/n, tone=rr(0.82,1);
    // 2–4 characters of unequal weight: one is written heavy, the others lighter or thinner, so the sign is not one even smear
    var wts=[], heavy=ctx.ri(0,n-1), i; for(i=0;i<n;i++)wts.push(i===heavy?rr(1.15,1.4):rr(0.7,1));
    for(i=0;i<n;i++)(function(i){ var c=pitch*(i+0.5)+rr(-0.3,0.3), gx=L.vertical?(ix0+ix1)/2+rr(-0.2,0.2):ix0+c, gy=L.vertical?iy0+c:(iy0+iy1)/2+rr(-0.2,0.2);
      var dabs=glyph(ctx,gx,gy,Math.min(gs,pitch*0.86)*rr(0.9,1.04),L.z,tone*(1-0.03*i)*Math.pow(wts[i],0.5),wts[i]); if(!dabs.length)return;
      ctx.add(ST.FINISH,gx+gs/2-i*0.01,function(g){ ctx.brush.stampDabs(g,dabs,C.ink); }); })(i);
    var fp=footprint(ctx,s); ctx.reg.slots.push({kind:'blob',fp:fp}); return {fp:fp,slots:{}}; }

  // 幌子: hanging cloth banner, 4×30 by default, with a vertical blob.
  function huangzi(ctx,s){ return blob(ctx,{x:s.x,y:s.y,w:s.w||DEF.fan[0],h:s.h||DEF.fan[1],z:s.z,style:'fan',board:s.board,n:s.n}); }

  // One character of the 跋 written with its own load: ink is the brush's state at that moment, not a column setting.
  // Dryness runs along the stroke, not across the glyph: the engine's own dab-dropping stays under 0.1; instead each
  // stroke's dabs (already in writing order) fade over their last stretch, and only a 'dry' character — the last one or
  // two before a re-dip — opens a single fibre gap in the tail of its longer strokes. No character loses more than a
  // fifth of its dabs; the brush movement stays whole and merely pales.
  // `lean` (degrees, signed, |lean| ≤ 0.8 per D-18) is the character's 欹正: the engine writes it upright and the whole
  // character is turned about its own centre afterwards, so the caller owns the sign and can set neighbours against each other.
  function wetChar(ctx,ch,x,y,size,ink,dry,lean){ var rr=ctx.rr, R=ctx.R;
    var items=ctx.brush.brushText({text:ch,x:x,y:y,size:size,font:KAI,perCol:1,dir:-1,lineH:1.08,over:6,ink:ink,wander:0.3,warp:0.012,tilt:lean===undefined?0.8:0,dry:0.08,SS:6});
    var it=items[0], comps=it.comps, c, q;
    if(dry>0.02){ var total=0, i;
      for(c=0;c<comps.length;c++)total+=comps[c].length;
      var budget=Math.floor(total*0.2), lost=0, longest=0;
      for(c=0;c<comps.length;c++)if(comps[c].length>longest)longest=comps[c].length;
      for(c=0;c<comps.length;c++){ var d=comps[c], n=d.length, tail=Math.max(2,Math.round(n*rr(0.3,0.45))), gapStart=n-Math.round(tail*rr(0.5,0.8));
        var gapOn=dry>0.55&&n>=longest*0.6&&n>6, side=R()<0.5?-1:1, keep=[];
        var ex=d[n-1].x-d[0].x, ey=d[n-1].y-d[0].y, el=Math.sqrt(ex*ex+ey*ey)||1; ex/=el; ey/=el;
        for(q=0;q<n;q++){ var u=q<n-tail?0:(q-(n-tail))/tail, fade=(1-0.22*dry)*(1-dry*0.5*u*u);
          if(gapOn&&q>=gapStart&&lost<budget){ var lat=-(d[q].x-d[0].x)*ey+(d[q].y-d[0].y)*ex; if(lat*side>0.12&&R()<0.85){ lost++; continue; } }
          d[q].a*=fade*rr(0.94,1.03); keep.push(d[q]); }
        comps[c]=keep; } }
    if(lean){ var ang=lean*Math.PI/180, cs=Math.cos(ang), sn=Math.sin(ang);
      for(c=0;c<comps.length;c++)for(q=0;q<comps[c].length;q++){ var dd=comps[c][q], px=dd.x-x, py=dd.y-y; dd.x=x+px*cs-py*sn; dd.y=y+px*sn+py*cs; } }
    return it; }

  // 端楷 跋 on the 拖尾: columns right → left from x, ceil(len/perCol) of them, colGap shrunk so the block stays 30 px
  // inside both paper edges; punctuation is dropped (a 跋 has none); the two seals sit below the last column.
  // Every column starts wet and dries toward its end; the brush is dipped again at one character 40–60 % down.
  // No 界格: the sheet is bare. Within a column the hand's size drifts slowly (×0.9–1.1, one swell per 5–9 characters),
  // and the pitch follows the ink itself — the next character begins a small gap below the lowest stroke of the last,
  // so a short character is followed sooner and the column has a rhythm instead of a ruler's step. Consecutive
  // characters lean slightly against each other (alternating ±0.35–0.8°); a character that recurs (江, 漢, 取…) is
  // written with a different load each time. The last character of a column sits 1–2 px high. Columns stay plumb.
  function colophon(ctx,s){ var ST=ctx.ST, rr=ctx.rr, ri=ctx.ri, size=s.size||18, per=s.perCol||14, margin=30;
    var text=s.text.replace(/[,。、,.;:!?\s]/g,''), n=text.length, cols=Math.ceil(n/per), avail=ctx.CW-2*margin;
    var gap=cols>1?Math.min(s.colGap||24,(avail-size)/(cols-1)):0, x0=s.x===undefined?ctx.CW-margin-size/2:s.x, y0=s.y===undefined?margin+size*0.6:s.y;
    var items=[], seen={}, ci, ri_, c, q;
    for(ci=0;ci<cols;ci++){ var col=text.slice(ci*per,(ci+1)*per), m=col.length, cx=x0-ci*gap, dip=m>3?ri(Math.round(m*0.4),Math.round(m*0.6)):m, seg0=0, segLen=dip;
      var lastN=ri(1,2), wk=Math.PI*2/rr(5,9), wph=rr(0,6.3), amp=rr(0.07,0.085), colItems=[], tops=[], bots=[], szs=[];
      for(ri_=0;ri_<m;ri_++){ if(ri_===dip){ seg0=dip; segLen=m-dip; lastN=ri(1,2); }
        var t=segLen>1?(ri_-seg0)/(segLen-1):0, left=seg0+segLen-1-ri_, last=left<lastN, ink=(0.95-0.17*t)*(last?0.92:1), dry=last?rr(0.6,0.85):0.35*t;
        var ch=col.charAt(ri_), rep=seen[ch]||0, sz=size*(1+amp*Math.sin(ri_*wk+wph)+rr(-0.015,0.015)), lean=(ri_%2?1:-1)*rr(0.35,0.8);
        seen[ch]=rep+1; if(rep)ink*=1+(rep%2?-1:1)*rr(0.07,0.11);
        var it=wetChar(ctx,ch,cx,0,sz,ink,dry,lean), top=1e9, bot=-1e9;
        for(c=0;c<it.comps.length;c++)for(q=0;q<it.comps[c].length;q++){ var dd=it.comps[c][q]; if(dd.y-dd.r<top)top=dd.y-dd.r; if(dd.y+dd.r>bot)bot=dd.y+dd.r; }
        if(top>bot){ top=-sz*0.45; bot=sz*0.45; }
        colItems.push(it); tops.push(top); bots.push(bot); szs.push(sz); }
      var cy=y0, prevBot=0;
      for(ri_=0;ri_<m;ri_++){ var itm=colItems[ri_], yy;
        if(ri_===0)yy=cy; else yy=Math.max(cy+szs[ri_-1]*0.8,prevBot+size*rr(0.2,0.3)-tops[ri_]);
        if(ri_===m-1&&m>1)yy-=rr(1,2);
        for(c=0;c<itm.comps.length;c++)for(q=0;q<itm.comps[c].length;q++)itm.comps[c][q].y+=yy;
        itm.y=yy; items.push(itm); cy=yy; prevBot=yy+bots[ri_]; } }
    stamp(ctx,items,size);
    var seals=s.seals||[SEAL_TEXTS[0],SEAL_TEXTS[1]], lx=x0-(cols-1)*gap, ly=items[items.length-1].y+size*0.5, sz2=s.sealSize||20, sy=ly+rr(9,13);
    ctx.sealStamp(ST.FINISH,lx-sz2/2+rr(-1.5,1.5),sy,sz2,seals[0]);
    ctx.sealStamp(ST.FINISH,lx-sz2/2+rr(-0.5,2.5),sy+sz2+rr(4,7),sz2-2,seals[1]);
    return {cols:cols,colGap:gap,x0:x0,y0:y0,bottom:sy+2*sz2+7}; }

  // Collector seals at the right end of the 画心: one in the upper corner, a smaller one in the lower, not aligned.
  function collectorSeals(ctx,s){ s=s||{}; var ST=ctx.ST, rr=ctx.rr, x=s.x===undefined?ctx.SW-36:s.x, t=s.texts||[SEAL_TEXTS[2],SEAL_TEXTS[3]];
    ctx.sealStamp(ST.FINISH,x+rr(-1.5,1.5),rr(22,30),24,t[0]);
    ctx.sealStamp(ST.FINISH,x+rr(1,4),ctx.SH-rr(44,52),19,t[1]); }

  return {footprint:footprint,sign:sign,blob:blob,huangzi:huangzi,colophon:colophon,collectorSeals:collectorSeals};
})();
