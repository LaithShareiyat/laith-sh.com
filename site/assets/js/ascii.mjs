// Shared ASCII helpers. Pure functions: safe to import in Node (tests, build) and the browser.

export const RAMP = ' .:-=+*#%@';
export const GLYPHS = '!-_\\/[]{}=+*^?#%$';
export const LINE_HEIGHT = 1.05;

// 7-row pixel font for the tagline: capitals 4 px wide, lowercase 3 px
export const F7 = {
  E: ['####', '#...', '###.', '#...', '#...', '####', '....'],
  R: ['###.', '#..#', '#..#', '###.', '#.#.', '#..#', '....'],
  B: ['###.', '#..#', '###.', '#..#', '#..#', '###.', '....'],
  a: ['...', '...', '.##', '#.#', '#.#', '.##', '...'],
  c: ['...', '...', '.##', '#..', '#..', '.##', '...'],
  d: ['..#', '..#', '.##', '#.#', '#.#', '.##', '...'],
  e: ['...', '...', '.#.', '###', '#..', '.##', '...'],
  g: ['...', '...', '.##', '#.#', '.##', '..#', '##.'],
  h: ['#..', '#..', '##.', '#.#', '#.#', '#.#', '...'],
  i: ['#', '.', '#', '#', '#', '#', '.'],
  l: ['#', '#', '#', '#', '#', '#', '.'],
  n: ['...', '...', '##.', '#.#', '#.#', '#.#', '...'],
  r: ['..', '..', '##', '#.', '#.', '#.', '..'],
  s: ['...', '...', '.##', '#..', '..#', '##.', '...'],
  u: ['...', '...', '#.#', '#.#', '#.#', '.##', '...'],
  '·': ['.', '.', '.', '#', '.', '.', '.'],
  ' ': ['..', '..', '..', '..', '..', '..', '..'],
};

// Coverage grid for `text` in the pixel font; each font pixel is `xs` columns wide, letters 1 pixel apart
export function pixelText(text, xs = 2) {
  const chars = [...text];
  for (const c of chars) if (!F7[c]) throw new Error(`pixel font has no glyph for "${c}"`);
  const rows = 7, cols = chars.reduce((n, c) => n + (F7[c][0].length + 1) * xs, -xs), cov = new Float32Array(cols * rows);
  let x0 = 0;
  for (const c of chars) {
    const g = F7[c];
    for (let y = 0; y < rows; y++) for (let x = 0; x < g[y].length * xs; x++) if (g[y][(x / xs) | 0] === '#') cov[x0 + x + y * cols] = 1;
    x0 += (g[0].length + 1) * xs;
  }
  return { cov, cols, rows };
}

// Ramp character for ink coverage `a` (0..1); `boost` densifies it near the cursor
export const rampChar = (a, boost = 0) => RAMP[Math.min(9, Math.max(1, Math.round(a * 9 + boost)))];

// Landing sizes: name and tagline take shares of 90% of the width, then shrink together
// if the block would be taller than 62% of the free height
export function fitLanding({ width, height, upright, nameRows, nameCols, tagRows, tagCols, charWidth }) {
  let nameFont = width * 0.9 * (upright ? 0.92 : 0.78) / (nameCols * charWidth);
  let tagFont = width * 0.9 * (upright ? 0.74 : 0.5) / (tagCols * charWidth);
  const gapOf = fs => 0.1 * nameRows * fs * LINE_HEIGHT;
  const s = Math.min(1, 0.62 * height / ((nameRows * nameFont + tagRows * tagFont) * LINE_HEIGHT + gapOf(nameFont)));
  nameFont *= s;
  tagFont *= s;
  return { nameFont, tagFont, gap: gapOf(nameFont) };
}

// Heading font size that keeps a monospace path within maxWidth
export const fitHeadingFont = ({ text, maxWidth, preferred, charWidth }) =>
  Math.min(preferred, maxWidth / ([...text].length * charWidth));
