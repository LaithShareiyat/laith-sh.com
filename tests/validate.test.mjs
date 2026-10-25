import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateSite } from '../build/validate.mjs';

const site = JSON.parse(readFileSync(new URL('../content/site.json', import.meta.url), 'utf8'));
const errorsAfter = edit => { const s = structuredClone(site); edit(s); return validateSite(s); };
const mentions = (errors, text) => errors.some(e => e.includes(text));

test('placeholder content is valid', () => {
  assert.deepEqual(validateSite(site), []);
});

test('missing name is reported', () => {
  assert.ok(mentions(errorsAfter(s => delete s.name), 'name'));
});

test('tagline letter missing from the pixel font is reported', () => {
  assert.ok(mentions(errorsAfter(s => { s.tagline = 'Engineer · Designer'; }), 'no glyph for "D"'));
});

test('duplicate project slug is reported', () => {
  assert.ok(mentions(errorsAfter(s => { s.projects[1].slug = s.projects[0].slug; }), 'duplicate slug'));
});

test('slug that is not url-safe is reported', () => {
  assert.ok(mentions(errorsAfter(s => { s.projects[0].slug = 'My Project'; }), 'slug'));
});

test('result without a stat is reported', () => {
  assert.ok(mentions(errorsAfter(s => { s.projects[0].result = { text: 'faster' }; }), 'result.stat'));
});

test('email that is not text is reported', () => {
  assert.ok(mentions(errorsAfter(s => { s.links.email = 42; }), 'links.email'));
});

test('cvForm must be https', () => {
  assert.ok(mentions(errorsAfter(s => { s.links.cvForm = 'http://formspree.io/f/abc'; }), 'cvForm'));
  assert.deepEqual(errorsAfter(s => { s.links.cvForm = 'https://formspree.io/f/abc'; }), []);
});

test('every problem is collected, not just the first', () => {
  assert.equal(errorsAfter(s => { delete s.name; delete s.about; }).length, 2);
});
