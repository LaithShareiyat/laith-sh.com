import { fitHeadingFont } from './ascii.mjs';
import { rasterizeElement, paint } from './raster.mjs';
import { run } from './loop.mjs';

const HOLD = 1.5, SWEEP = 0.8; // seconds: ASCII holds, then a left-to-right sweep reveals the real text

// Path headings: fit long paths to the column, assemble as ASCII when scrolled into view, then resolve into
// type; afterwards the cursor x-rays the ASCII back in a small circle (CSS mask on --mx/--my)
export function mountHeadings(root, { reducedMotion, charWidth }) {
  const heads = [...root.querySelectorAll('.hwrap')].map(w => ({ w, ph: w.querySelector('.ph'), ov: w.querySelector('.ov') }));

  const fit = h => {
    h.ph.style.fontSize = '';
    const box = getComputedStyle(h.w.parentElement);
    const maxWidth = h.w.parentElement.clientWidth - parseFloat(box.paddingLeft) - parseFloat(box.paddingRight);
    const preferred = parseFloat(getComputedStyle(h.ph).fontSize);
    h.ph.style.fontSize = fitHeadingFont({ text: h.ph.textContent, maxWidth, preferred, charWidth }) + 'px';
  };
  const build = h => {
    h.g = rasterizeElement(h.ph, { cell: parseFloat(h.ph.style.fontSize) < 36 ? 1.9 : 2.4, charWidth });
    h.ov.style.fontSize = h.g.font + 'px';
  };
  const start = h => {
    build(h);
    const delay = Float32Array.from(h.g.cov, (_, i) => (i % h.g.cols) / h.g.cols * 0.7 + Math.random() * 0.4);
    const t0 = performance.now();
    run(now => {
      const t = (now - t0) / 1000, p = Math.min(1, Math.max(0, (t - HOLD) / SWEEP));
      if (p < 1) {
        h.ph.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
        paint(h.ov, h.g, { t, delay, sweepFrom: p });
        return true;
      }
      h.ph.style.clipPath = '';
      paint(h.ov, h.g);
      h.w.classList.add('done');
      return false;
    });
  };

  heads.forEach(fit);
  if (reducedMotion) return;

  const byWrap = new Map(heads.map(h => [h.w, h]));
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    start(byWrap.get(e.target));
  }), { rootMargin: '0px 0px -60px 0px' });

  for (const h of heads) {
    io.observe(h.w);
    h.w.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = h.w.getBoundingClientRect();
      h.w.style.setProperty('--mx', e.clientX - r.left + 'px');
      h.w.style.setProperty('--my', e.clientY - r.top + 'px');
    });
    h.w.addEventListener('pointerleave', () => {
      h.w.style.setProperty('--mx', '-999px');
      h.w.style.setProperty('--my', '-999px');
    });
  }

  let timer = 0;
  addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => heads.forEach(h => {
      fit(h);
      if (h.w.classList.contains('done')) { build(h); paint(h.ov, h.g); }
    }), 150);
  });
}
