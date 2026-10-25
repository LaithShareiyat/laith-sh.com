import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentSection } from '../site/assets/js/nav-logic.mjs';

test('currentSection', () => {
  const s = [{ key: 'about', top: 500 }, { key: 'experience', top: 1200 }];
  assert.equal(currentSection(s, 400), null);
  assert.equal(currentSection(s, 600), 'about');
  assert.equal(currentSection(s, 1300), 'experience');
});

test('currentSection at the bottom of the page is the last section', () => {
  // a short last section never reaches the line, e.g. after clicking /cv
  const s = [{ key: 'about', top: -900 }, { key: 'cv', top: 523 }];
  assert.equal(currentSection(s, 128, true), 'cv');
  assert.equal(currentSection(s, 128, false), 'about');
});
