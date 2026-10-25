import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../build/build.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const site = JSON.parse(await readFile(join(root, 'content/site.json'), 'utf8'));
const exists = p => access(p).then(() => true, () => false);

test('build writes the index, a page per project and the static assets', async () => {
  const out = await mkdtemp(join(tmpdir(), 'site-'));
  await build({ root, out });
  assert.ok(await exists(join(out, 'index.html')));
  for (const p of site.projects) assert.ok(await exists(join(out, 'projects', p.slug, 'index.html')), p.slug);
  assert.ok(await exists(join(out, 'assets/js/ascii.mjs')));
  const top = await readdir(out);
  assert.ok(!top.includes('docs') && !top.includes('content'), top.join(','));
});

test('invalid content stops the build with every problem listed', async () => {
  const bad = await mkdtemp(join(tmpdir(), 'bad-'));
  await mkdir(join(bad, 'content'));
  await mkdir(join(bad, 'site'));
  await writeFile(join(bad, 'content/site.json'), JSON.stringify({ ...site, name: '', about: '' }));
  await assert.rejects(build({ root: bad, out: join(bad, 'dist') }), e => /name: required text/.test(e.message) && /about: required text/.test(e.message));
  assert.ok(!(await exists(join(bad, 'dist'))));
});
