import { readFile, rm, cp, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSite } from './validate.mjs';
import { renderIndex, renderProject } from './render.mjs';

// content/site.json + site/ -> out/ (index page, one page per project, static assets)
export async function build({ root, out }) {
  const site = JSON.parse(await readFile(join(root, 'content/site.json'), 'utf8'));
  const errors = validateSite(site);
  if (errors.length) throw new Error(`content/site.json has ${errors.length} problem(s):\n  ${errors.join('\n  ')}`);

  const year = new Date().getFullYear();
  await rm(out, { recursive: true, force: true });
  await cp(join(root, 'site'), out, { recursive: true });
  await writeFile(join(out, 'index.html'), renderIndex(site, { year }));
  for (const p of site.projects) {
    await mkdir(join(out, 'projects', p.slug), { recursive: true });
    await writeFile(join(out, 'projects', p.slug, 'index.html'), renderProject(site, p, { year }));
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('..', import.meta.url));
  build({ root, out: join(root, 'dist') }).catch(e => {
    console.error(e.message);
    process.exit(1);
  });
}
