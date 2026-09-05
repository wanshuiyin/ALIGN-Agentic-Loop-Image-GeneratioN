# Plan

- **Canvas** 4270 × 500 逻辑像素(左 270 px 拖尾纸 + 4000 px 画心),离屏缓冲 pixelDensity 2;页面视口 930 × 500 可拖动,下方全卷缩略图带视口框和笔锋位置点。
- **Stages** 十道,见 reference.md;播放总长 120 s,每道等分;每道内笔触按 x 从右到左排序。
- **Stroke objects** `{x, f(g)}`,f 内不含随机;绢底预烘焙成图,按 50 px 竖条揭开。
- **Occlusion** 山按 yb 排序(远→近),每座山记录挡在它前面的山;生成任何笔触前查 `hiddenBy`;水纹、船、桥用两张 1 px 栅格 mask(近山 / 近山+远山)判水陆。
- **Replay** 前进只画新增;后退回到最近的阶段快照(stage 4、stage 8 起点)再重放。
- **Controls** 播放/暂停、速度 0.5–4×、进度条、十个工序按钮、"镜头自右向左展卷"、一键录制 WebM(artifact 内走 downloads 能力,本地走浏览器下载)。
- **Hash switches** `#p=` 进度、`#cam=` 视口、`#seq=` 拖动序列(供渲染与 G-01 用)。
- **Fonts** Ma Shan Zheng(Google)+ 本机 Xingkai SC;`document.fonts.load` 传全文。
