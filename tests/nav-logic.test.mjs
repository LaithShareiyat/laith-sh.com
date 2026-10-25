import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentSection } from '../site/assets/js/nav-logic.mjs';

test('currentSection', () => {
  const s = [{ key: 'about', top: 500 }, { key: 'experience', top: 1200 }];
  assert.equal(currentSection(s, 400), null);
  assert.equal(currentSection(s, 600), 'about');
  assert.equal(currentSection(s, 1300), 'experience');
});
