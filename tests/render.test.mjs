import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { escapeHtml, renderIndex, renderProject } from '../build/render.mjs';

const site = JSON.parse(readFileSync(new URL('../content/site.json', import.meta.url), 'utf8'));
const index = edit => { const s = structuredClone(site); edit?.(s); return renderIndex(s, { year: 2026 }); };
const count = (html, str) => html.split(str).length - 1;

test('escapeHtml', () => {
  assert.equal(escapeHtml(`a & <b> "c" 'd'`), 'a &amp; &lt;b&gt; &quot;c&quot; &#39;d&#39;');
});

test('landing has the real name and tagline', () => {
  const html = index();
  assert.ok(html.includes('<h1 class="name">Laith Shareiyat</h1>'));
  assert.ok(html.includes('Engineer · Researcher · Builder'));
});

test('ASCII layers are hidden from screen readers and html starts without the js class', () => {
  const html = index();
  const pres = html.match(/<pre\b[^>]*>/g);
  assert.ok(pres.length >= 3);
  for (const p of pres) assert.ok(p.includes('aria-hidden="true"'), p);
  assert.ok(!/<html[^>]*class=/.test(html));
});

test('sections are path headings with matching nav links', () => {
  const html = index();
  assert.ok(html.includes('<h2 class="ph">/experience</h2>'));
  assert.ok(html.includes('href="/#experience"'));
});

test('content text is escaped', () => {
  const html = index(s => { s.publications[0].title = 'Graphs & <Trees> "now"'; });
  assert.ok(html.includes('Graphs &amp; &lt;Trees&gt; &quot;now&quot;'));
  assert.ok(!html.includes('<Trees>'));
});

test("Laith's name is bold among authors; missing links are left out", () => {
  const html = index(s => { s.publications[1].pdf = 'https://example.org/p.pdf'; });
  assert.ok(html.includes('<b>L. Shareiyat</b>'));
  assert.equal(count(html, '[pdf]'), 1);
  assert.equal(count(index(), '[pdf]'), 0);
});

test('an empty section disappears with its menu links', () => {
  const html = index(s => { s.publications = []; });
  assert.ok(!html.includes('id="publications"'));
  assert.ok(!html.includes('/#publications'));
  assert.ok(index().includes('/#publications'));
});

test('every project card opens its own page', () => {
  const html = index();
  for (const p of site.projects) assert.equal(count(html, `href="/projects/${p.slug}/"`), 1, p.slug);
});

test('a project page shows only the parts that are filled in', () => {
  const sparse = site.projects.find(p => !p.problem);
  assert.ok(!renderProject(site, sparse, { year: 2026 }).includes('The problem'));
  const full = site.projects.find(p => p.problem);
  assert.ok(renderProject(site, full, { year: 2026 }).includes('The problem'));
});

test('email link only when an email is set', () => {
  assert.equal(count(index(), 'mailto:'), 0);
  assert.equal(count(index(s => { s.links.email = 'hi@example.org'; }), 'mailto:'), 1);
});

test('CV request form only when an endpoint is set, and the CV itself is never linked', () => {
  const url = 'https://formspree.io/f/abc123';
  const html = index(s => { s.links.cvForm = url; });
  assert.equal(count(html, '<form'), 1);
  assert.ok(html.includes(`action="${url}"`) && html.includes('method="POST"'));
  for (const name of ['name', 'email', '_gotcha']) assert.ok(new RegExp(`<input[^>]*name="${name}"`).test(html), name);
  assert.ok(/<textarea[^>]*name="message"[^>]*required/.test(html));
  assert.equal(count(index(), '<form'), 0);
  for (const html2 of [html, index()]) assert.ok(!/cv\.pdf|download cv/i.test(html2));
});

test('project page: back link, path heading, prompt and headline result', () => {
  const p = site.projects[0];
  const html = renderProject(site, p, { year: 2026 });
  assert.ok(html.includes('>cd ..</a>'));
  assert.ok(html.includes(`/projects/${p.slug}</h1>`));
  assert.ok(html.includes(`data-cwd="~/laith-sh/projects/${p.slug}"`));
  assert.ok(html.includes(p.result.stat));
});

test('footer: rights notice and source link', () => {
  const html = index();
  assert.ok(html.includes('© 2026 Laith Shareiyat · All rights reserved'));
  assert.ok(html.includes(`<a href="${site.repo}">source ↗</a>`));
});
