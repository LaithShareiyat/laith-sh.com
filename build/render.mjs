// Content -> static HTML. Every content string goes through esc(); markup below is the only raw HTML.

export const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const esc = escapeHtml;

const sectionsOf = site => [
  ['about', true],
  ['experience', site.experience.length > 0],
  ['projects', site.projects.length > 0],
  ['publications', site.publications.length > 0],
  ['cv', true],
].filter(([, on]) => on).map(([key]) => key);

const heading = (tag, path) => `<div class="hwrap"><${tag} class="ph">/${esc(path)}</${tag}><pre class="ov" aria-hidden="true"></pre></div>`;

function head(site, { title, description, path }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(site.url + path)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(site.url + path)}">
<meta property="og:image" content="${esc(site.url)}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#1C1C1C">
<link rel="icon" href="data:,">
<link rel="stylesheet" href="/assets/css/site.css">
<script>if ('noModule' in HTMLScriptElement.prototype) document.documentElement.classList.add('js')</script>
<script type="module" src="/assets/js/main.mjs"></script>
</head>`;
}

function nav(site) {
  const paths = sectionsOf(site).map(k => `<a href="/#${k}" data-sec="${k}">/${k}</a>`).join('');
  const ext = `<a href="${esc(site.links.linkedin)}">linkedin ↗</a><a href="${esc(site.links.github)}">github ↗</a>`;
  return `<nav class="bar"><a class="cwd" href="/#top">~/laith-sh</a><span class="paths">${paths}</span><span class="ext">${ext}</span><button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu">[ menu ]</button></nav>
<div id="menu" class="menu" hidden><div class="paths">${paths}</div><div class="ext">${ext}</div></div>`;
}

const footer = (site, year) => `<footer class="foot"><span>© ${year} ${esc(site.name)} · All rights reserved</span><a href="${esc(site.repo)}">source ↗</a></footer>`;

const experience = site => site.experience.map(x => `<div class="xp"><p class="when">${esc(x.from)} — ${esc(x.to)}</p><div><h3 class="role">${esc(x.role)} <span>· ${esc(x.org)}</span></h3><ul>${x.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div></div>`).join('');

const codeLink = p => p.code ? `<a class="code" href="${esc(p.code)}">code ↗</a>` : '';

const projects = site => `<div class="grid">${site.projects.map((p, i) => `<article class="card"><p class="num">${String(i + 1).padStart(2, '0')}</p><h3><a class="card-link" href="/projects/${esc(p.slug)}/">${esc(p.name)}</a></h3><p class="pitch">${esc(p.pitch)}</p><p class="tags">${p.tags.map(esc).join(' · ')}</p><p class="links"><span class="open" aria-hidden="true">open →</span>${codeLink(p)}</p></article>`).join('')}</div>`;

function publications(site) {
  const surname = site.name.split(' ').at(-1);
  const link = (url, label) => url ? `<a href="${esc(url)}">${label}</a>` : '';
  return site.publications.map(p => {
    const authors = p.authors.map(a => a.includes(surname) ? `<b>${esc(a)}</b>` : esc(a)).join(', ');
    const doi = p.doi && (p.doi.startsWith('http') ? p.doi : `https://doi.org/${p.doi}`);
    return `<div class="pub"><p class="t">${p.url ? `<a href="${esc(p.url)}">${esc(p.title)}</a>` : esc(p.title)}</p><p class="au">${authors}</p><p class="meta"><span>${esc(p.venue)} · ${esc(p.year)}</span>${link(p.pdf, '[pdf]')}${link(doi, '[doi]')}${link(p.bibtex, '[bibtex]')}</p></div>`;
  }).join('');
}

const cvForm = action => `<details class="cv-req"><summary>request cv →</summary><form class="cv-form" action="${esc(action)}" method="POST">
<label>name<input name="name" required autocomplete="name"></label>
<label>email<input name="email" type="email" required autocomplete="email"></label>
<label class="full"><span>company <em>(optional)</em></span><input name="company" autocomplete="organization"></label>
<label class="full">why you'd like my CV<textarea name="message" required placeholder="The role or project you have in mind, and why you're interested"></textarea></label>
<label class="hp" aria-hidden="true">leave this empty<input name="_gotcha" tabindex="-1" autocomplete="off"></label>
<div class="act full"><button type="submit">send request</button><p class="status" role="status"></p></div>
</form></details>`;

function cv(site) {
  const { linkedin, github, email, cvForm: action } = site.links;
  const contact = `<a href="${esc(linkedin)}">linkedin ↗</a><a href="${esc(github)}">github ↗</a>${email ? `<a href="mailto:${esc(email)}">${esc(email)}</a>` : ''}`;
  return `<p class="lede">Want the full CV? Send a request and I'll email it over.</p>${action ? cvForm(action) : ''}<p class="contact">${contact}</p>`;
}

export function renderIndex(site, { year }) {
  const body = {
    about: () => `<p class="lede">${esc(site.about)}</p><p class="now">now → ${esc(site.now)}</p>`,
    experience: () => experience(site),
    projects: () => projects(site),
    publications: () => publications(site),
    cv: () => cv(site),
  };
  return `${head(site, { title: site.name, description: site.description, path: '/' })}
<body>
${nav(site)}
<header class="landing" id="top"><h1 class="name">${esc(site.name)}</h1><p class="tagline">${esc(site.tagline)}</p><pre class="ascii-name" aria-hidden="true"></pre><pre class="ascii-tag" aria-hidden="true"></pre><span class="hint" aria-hidden="true">scroll ↓</span></header>
<main>
${sectionsOf(site).map(k => `<section id="${k}" data-sec="${k}">${heading('h2', k)}${body[k]()}</section>`).join('\n')}
</main>
${footer(site, year)}
</body>
</html>
`;
}

export function renderProject(site, p, { year }) {
  const meta = [p.role && `<span>role: ${esc(p.role)}</span>`, p.year && `<span>${esc(p.year)}</span>`, `<span>${p.tags.map(esc).join(' · ')}</span>`, codeLink(p)].filter(Boolean).join('');
  const figure = p.figure ? `<figure><img src="${esc(p.figure.src)}" alt="${esc(p.figure.alt)}"></figure>` : '';
  return `${head(site, { title: `${p.name} · ${site.name}`, description: p.pitch, path: `/projects/${p.slug}/` })}
<body data-cwd="~/laith-sh/projects/${esc(p.slug)}">
${nav(site)}
<main class="case">
<p class="crumb"><a class="back" href="/#projects">cd ..</a></p>
${heading('h1', `projects/${p.slug}`)}
<p class="metarow">${meta}</p>
<p class="pitch">${esc(p.pitch)}</p>
${p.problem ? `<h2>The problem</h2><p>${esc(p.problem)}</p>` : ''}
${p.approach ? `<h2>The approach</h2><p>${esc(p.approach)}</p>${figure}` : figure}
${p.result ? `<h2>The result</h2><p class="stat">${esc(p.result.stat)}</p><p>${esc(p.result.text)}</p>` : ''}
</main>
${footer(site, year)}
</body>
</html>
`;
}
