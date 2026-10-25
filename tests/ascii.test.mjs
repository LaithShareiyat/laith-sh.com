import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pixelText, rampChar, fitLanding, fitHeadingFont } from '../site/assets/js/ascii.mjs';

test('pixelText spacing: one pixel = 2 cols, 1-pixel gap', () => {
  const g = pixelText('Ei'); // E is 4 wide, i is 1 wide
  assert.equal(g.rows, 7);
  assert.equal(g.cols, (4 + 1) * 2 + (1 + 1) * 2 - 2); // 12
});

test('pixelText rejects missing glyph', () => {
  assert.throws(() => pixelText('Ez'), /no glyph for "z"/);
});

test('rampChar', () => {
  assert.equal(rampChar(1), '@');
  assert.equal(rampChar(0.5), '+');
  assert.equal(rampChar(0.01), '.');
});

test('fitLanding: width-limited on a laptop', () => {
  const f = fitLanding({ width: 1440, height: 856, upright: false, nameRows: 22, nameCols: 110, tagRows: 7, tagCols: 212, charWidth: 0.6 });
  assert.ok(Math.abs(f.nameFont - 1440 * 0.9 * 0.78 / (110 * 0.6)) < 1e-9);
  assert.ok(Math.abs(f.tagFont - 1440 * 0.9 * 0.5 / (212 * 0.6)) < 1e-9);
});

test('fitLanding: height-limited block fits 62% of free height', () => {
  const f = fitLanding({ width: 2560, height: 1040, upright: false, nameRows: 22, nameCols: 110, tagRows: 7, tagCols: 212, charWidth: 0.6 });
  const block = (22 * f.nameFont + 7 * f.tagFont) * 1.05 + f.gap;
  assert.ok(Math.abs(block - 0.62 * 1040) < 1e-6);
});

test('fitLanding: upright uses 92% / 74%', () => {
  const f = fitLanding({ width: 390, height: 780, upright: true, nameRows: 16, nameCols: 80, tagRows: 7, tagCols: 212, charWidth: 0.6 });
  assert.ok(Math.abs(f.nameFont - 390 * 0.9 * 0.92 / (80 * 0.6)) < 1e-9);
});

test('fitHeadingFont shrinks long paths only', () => {
  assert.equal(fitHeadingFont({ text: '/cv', maxWidth: 350, preferred: 30, charWidth: 0.6 }), 30);
  assert.equal(fitHeadingFont({ text: '/projects/a-very-long-project-slug', maxWidth: 350, preferred: 30, charWidth: 0.6 }), 350 / (34 * 0.6));
});
