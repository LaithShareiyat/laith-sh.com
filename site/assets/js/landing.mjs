import { pixelText, fitLanding } from './ascii.mjs';
import { rasterizeLines, paint } from './raster.mjs';
import { run } from './loop.mjs';

const ASSEMBLE = 1.3; // seconds; the longest per-cell delay is 0.7 + 0.6

// The landing's name and tagline as ASCII: assemble once, then brighten around a mouse cursor
export function mountLanding(header, { reducedMotion, charWidth }) {
  const preN = header.querySelector('.ascii-name'), preT = header.querySelector('.ascii-tag');
  const name = header.querySelector('.name').textContent.trim().toUpperCase().split(/\s+/);
  const tagline = header.querySelector('.tagline').textContent.trim();
  let gN, gT, mouse = null, assembling = false, queued = false;

  const fit = () => {
    const W = header.clientWidth, H = header.clientHeight, upright = W < H;
    gN = rasterizeLines(name, { cols: upright ? 80 : 110, fill: 0.98, weight: 800, charWidth });
    gT = pixelText(tagline);
    const f = fitLanding({ width: W, height: H, upright, nameRows: gN.rows, nameCols: gN.cols, tagRows: gT.rows, tagCols: gT.cols, charWidth });
    preN.style.fontSize = f.nameFont + 'px';
    preT.style.fontSize = f.tagFont + 'px';
    preT.style.marginTop = f.gap + 'px';
    for (const g of [gN, gT]) g.delay = Float32Array.from(g.cov, (_, i) => (i % g.cols) / g.cols * 0.7 + Math.random() * 0.6);
  };

  const nearFor = (pre, g) => {
    if (!mouse) return null;
    const r = pre.getBoundingClientRect(), cw = r.width / g.cols, ch = r.height / g.rows;
    return (x, y) => {
      const dx = r.left + (x + 0.5) * cw - mouse.x, dy = r.top + (y + 0.5) * ch - mouse.y;
      return Math.exp(-(dx * dx + dy * dy) / (2 * 55 * 55));
    };
  };
  const draw = t => {
    paint(preN, gN, { t, delay: gN.delay, near: nearFor(preN, gN) });
    paint(preT, gT, { t, delay: gT.delay, near: nearFor(preT, gT) });
  };
  // one repaint per pointer move; nothing runs while the pointer is still
  const redraw = () => {
    if (queued || assembling) return;
    queued = true;
    run(() => { queued = false; draw(Infinity); return false; });
  };

  fit();
  if (reducedMotion) {
    draw(Infinity);
  } else {
    const t0 = performance.now();
    assembling = true;
    run(now => {
      const t = (now - t0) / 1000;
      draw(t);
      if (t < ASSEMBLE) return true;
      assembling = false;
      return false;
    });
    header.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      mouse = { x: e.clientX, y: e.clientY };
      redraw();
    });
    header.addEventListener('pointerleave', () => { mouse = null; redraw(); });
  }

  let timer = 0;
  const refit = () => {
    clearTimeout(timer);
    timer = setTimeout(() => { fit(); if (!assembling) draw(Infinity); }, 150);
  };
  addEventListener('resize', refit);
  addEventListener('orientationchange', refit);
}
