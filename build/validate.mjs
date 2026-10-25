import { pixelText } from '../site/assets/js/ascii.mjs';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Every problem in the content file as "<path>: <problem>"; an empty list means the file is usable
export function validateSite(site) {
  const errors = [];
  const text = (v, path) => { if (typeof v !== 'string' || !v.trim()) errors.push(`${path}: required text`); };
  const optText = (v, path) => { if (v != null && typeof v !== 'string') errors.push(`${path}: must be text or null`); };
  const list = (v, path) => {
    if (Array.isArray(v)) return v.map(x => x ?? {});
    errors.push(`${path}: must be a list`);
    return [];
  };

  for (const k of ['name', 'tagline', 'description', 'url', 'repo', 'about', 'now']) text(site[k], k);
  if (typeof site.tagline === 'string') {
    try { pixelText(site.tagline); } catch (e) { errors.push(`tagline: ${e.message}`); }
  }

  const links = site.links ?? {};
  text(links.linkedin, 'links.linkedin');
  text(links.github, 'links.github');
  optText(links.email, 'links.email');
  if (links.cvForm != null && !(typeof links.cvForm === 'string' && links.cvForm.startsWith('https://'))) {
    errors.push('links.cvForm: must be an https:// URL or null');
  }

  list(site.experience, 'experience').forEach((x, i) => {
    for (const k of ['from', 'to', 'role', 'org']) text(x[k], `experience[${i}].${k}`);
    list(x.points, `experience[${i}].points`).forEach((p, j) => text(p, `experience[${i}].points[${j}]`));
  });

  const seen = new Set();
  list(site.projects, 'projects').forEach((p, i) => {
    const at = `projects[${i}]`;
    if (typeof p.slug !== 'string' || !SLUG.test(p.slug)) errors.push(`${at}.slug: "${p.slug}" must be lowercase words joined by hyphens`);
    else if (seen.has(p.slug)) errors.push(`${at}.slug: duplicate slug "${p.slug}"`);
    else seen.add(p.slug);
    text(p.name, `${at}.name`);
    text(p.pitch, `${at}.pitch`);
    list(p.tags, `${at}.tags`).forEach((t, j) => text(t, `${at}.tags[${j}]`));
    for (const k of ['code', 'role', 'year', 'problem', 'approach']) optText(p[k], `${at}.${k}`);
    if (p.figure != null) { text(p.figure.src, `${at}.figure.src`); text(p.figure.alt, `${at}.figure.alt`); }
    if (p.result != null) { text(p.result.stat, `${at}.result.stat`); text(p.result.text, `${at}.result.text`); }
  });

  list(site.publications, 'publications').forEach((p, i) => {
    const at = `publications[${i}]`;
    text(p.title, `${at}.title`);
    text(p.venue, `${at}.venue`);
    if (!Number.isInteger(p.year)) errors.push(`${at}.year: must be a whole number`);
    list(p.authors, `${at}.authors`).forEach((a, j) => text(a, `${at}.authors[${j}]`));
    for (const k of ['url', 'pdf', 'doi', 'bibtex']) optText(p[k], `${at}.${k}`);
  });

  return errors;
}
