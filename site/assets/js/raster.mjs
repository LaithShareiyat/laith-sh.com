// Text -> coverage grids (how much ink falls in each character cell), and grids -> ASCII spans.
import { GLYPHS, LINE_HEIGHT, rampChar } from './ascii.mjs';

const S = 8; // supersampling per cell side for the name

// Width of one JetBrains Mono character, in em
export function measureCharWidth() {
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;visibility:hidden;font:100px "JetBrains Mono",monospace;white-space:pre';
  probe.textContent = 'M'.repeat(10);
  document.body.append(probe);
  const w = probe.getBoundingClientRect().width / 1000;
  probe.remove();
  return w;
}

// Big Inter Tight lines (the landing name) as a grid `cols` wide
export function rasterizeLines(lines, { cols, fill, weight, charWidth, capEm = 0.72, gapEm = 1.02 }) {
  const sy = charWidth / LINE_HEIGHT, g = document.createElement('canvas').getContext('2d');
  g.font = `${weight} 100px "Inter Tight", sans-serif`;
  const F0 = cols * fill / Math.max(...lines.map(s => g.measureText(s).width)) * 100;
  // whole-row cap height so letter tops start on a row edge (no half-filled row of dots)
  const capR = g.measureText('H').actualBoundingBoxAscent / 100 * F0 * sy;
  let cap = Math.round(capR);
  if (cap / capR * fill > 1) cap = Math.floor(capR);
  const F = F0 * cap / capR, gap = Math.round(cap * gapEm / capEm), pad = 1;
  const rows = pad * 2 + cap + gap * (lines.length - 1), cov = new Float32Array(cols * rows);
  g.font = `${weight} ${F}px "Inter Tight", sans-serif`;
  const cv = document.createElement('canvas'), x = cv.getContext('2d');
  cv.width = cols * S;
  cv.height = rows * S;

  lines.forEach((s, li) => {
    const x0 = (cols - g.measureText(s).width) / 2, top = pad + li * gap, base = top + cap;
    // letters keep the font's own (kerned) positions but are drawn one at a time so we know whose each cell is;
    // the row above the cap line (the hair round letters poke up) is skipped
    const draw = (c, px) => {
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.clearRect(0, 0, cv.width, cv.height);
      x.setTransform(S, 0, 0, S * sy, 0, 0);
      x.font = g.font;
      x.fillText(c, px, base / sy);
      const d = x.getImageData(0, 0, cv.width, cv.height).data, m = new Float32Array(cols * rows);
      for (let y = top; y <= base; y++) for (let i = 0; i < cols; i++) {
        let a = 0;
        for (let v = 0; v < S; v++) for (let u = 0; u < S; u++) a += d[((y * S + v) * cv.width + i * S + u) * 4 + 3];
        m[i + y * cols] = a / (S * S * 255);
      }
      return m;
    };
    const move = (m, dx) => {
      const out = new Float32Array(m.length);
      for (let y = top; y <= base; y++) for (let c = 0; c < cols; c++) if (m[c + y * cols] && c + dx >= 0 && c + dx < cols) out[c + dx + y * cols] = m[c + y * cols];
      return out;
    };
    const edges = (a, b, y) => {
      let r = -1, l = cols;
      for (let c = 0; c < cols; c++) { if (a[c + y * cols] > 0.12) r = c; if (b[c + y * cols] > 0.12 && l === cols) l = c; }
      return [r, l];
    };
    const closest = (a, b) => {
      let gp = Infinity;
      for (let y = top; y <= base; y++) { const [r, l] = edges(a, b, y); if (r >= 0 && l < cols) gp = Math.min(gp, l - r - 1); }
      return gp;
    };

    const xs = [...s].map((c, i) => x0 + g.measureText(s.slice(0, i + 1)).width - g.measureText(c).width);
    const own = [...s].map((c, i) => draw(c, xs[i]));
    // Y and A have parallel slopes, so the font leaves a wide band between them: pull A (and everything
    // after it) in by half the gap beyond one blank column, then re-centre
    let pulled = 0;
    for (let i = 1; i < own.length; i++) if (s[i - 1] + s[i] === 'YA') {
      const k = (closest(own[i - 1], own[i]) - 1) / 2;
      if (k > 0) { for (let j = i; j < own.length; j++) own[j] = draw(s[j], xs[j] -= k); pulled += k; }
    }
    if (pulled >= 1) own.forEach((m, i) => { own[i] = move(m, Math.round(pulled / 2)); });
    // where two neighbours touch on a row, drop the fainter edge cell so a blank column separates them
    for (let y = top; y <= base; y++) for (let i = 1; i < own.length; i++) for (let n = 0; n < 3; n++) {
      const a = own[i - 1], b = own[i], [r, l] = edges(a, b, y), o = y * cols;
      if (r < 0 || l === cols || l - r >= 2) break;
      if (a[r + o] <= b[l + o]) a[r + o] = 0; else b[l + o] = 0;
    }
    own.forEach(m => m.forEach((v, k) => { if (v > cov[k]) cov[k] = v; }));
  });
  return { cov, rows, cols };
}

// A laid-out element's own text (a heading) as a grid of `cell`-px cells; `font` is the ASCII font size to use
export function rasterizeElement(el, { cell, charWidth }) {
  const cs = getComputedStyle(el), W = el.offsetWidth, H = el.offsetHeight;
  const font = cell / charWidth, ch = font * LINE_HEIGHT, cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / ch), SS = 3;
  const cv = document.createElement('canvas'), g = cv.getContext('2d');
  cv.width = Math.ceil(cols * cell * SS);
  cv.height = Math.ceil(rows * ch * SS);
  g.scale(SS, SS);
  g.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const m = g.measureText(el.textContent), lineH = parseFloat(cs.lineHeight);
  g.fillText(el.textContent, 0, (lineH - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent);
  const d = g.getImageData(0, 0, cv.width, cv.height).data, cov = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const x0 = Math.floor(x * cell * SS), x1 = Math.floor((x + 1) * cell * SS), y0 = Math.floor(y * ch * SS), y1 = Math.floor((y + 1) * ch * SS);
    let a = 0, n = 0;
    for (let v = y0; v < y1; v++) for (let u = x0; u < x1; u++) { a += d[(v * cv.width + u) * 4 + 3]; n++; }
    cov[x + y * cols] = a / (n * 255);
  }
  return { cov, cols, rows, font };
}

// Write a grid into a <pre>: scramble glyphs before each cell's delay, then the ramp; `near(x, y)` (0..1)
// brightens cells by the cursor; cells left of `sweepFrom` (0..1 of the width) are cleared
export function paint(pre, g, { t = Infinity, delay = null, near = null, sweepFrom = 0 } = {}) {
  let html = '', run = '', cls = '';
  const flush = () => { if (run) html += cls ? `<i class="${cls}">${run}</i>` : run; run = ''; };
  for (let y = 0; y < g.rows; y++) {
    for (let x = 0; x < g.cols; x++) {
      const o = x + y * g.cols, a = g.cov[o], fx = x / g.cols;
      let c = ' ', k = '';
      if (a > 0.12 && fx >= sweepFrom) {
        if (delay && t < delay[o]) {
          c = GLYPHS[(Math.random() * GLYPHS.length) | 0];
          k = 'g';
        } else {
          const n = near ? near(x, y) : 0;
          c = rampChar(a, n * 3);
          k = n > 0.35 || (sweepFrom > 0 && fx - sweepFrom < 0.05) ? 'h' : a < 0.45 ? 'e' : '';
        }
      }
      if (k !== cls) { flush(); cls = k; }
      run += c;
    }
    run += '\n';
  }
  flush();
  pre.innerHTML = html;
}
