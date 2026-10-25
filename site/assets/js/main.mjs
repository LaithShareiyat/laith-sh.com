import { measureCharWidth } from './raster.mjs';
import { mountLanding } from './landing.mjs';
import { mountHeadings } from './headings.mjs';
import { mountNav } from './nav.mjs';
import { mountCvForm } from './cv-form.mjs';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

async function start() {
  mountNav(document);
  mountCvForm(document);
  // the ASCII is drawn from these fonts, so wait for them
  await Promise.all(['800 100px "Inter Tight"', '400 100px "JetBrains Mono"', '500 44px "JetBrains Mono"'].map(f => document.fonts.load(f)));
  const charWidth = measureCharWidth();
  const landing = document.querySelector('.landing');
  if (landing) mountLanding(landing, { reducedMotion, charWidth });
  mountHeadings(document, { reducedMotion, charWidth });
}

// if anything fails, fall back to the plain-text page rather than leave parts of it hidden
start().catch(e => {
  document.documentElement.classList.remove('js');
  console.error(e);
});
