import { currentSection } from './nav-logic.mjs';

// The prompt follows the section you are reading, the scroll hint fades, and [ menu ] opens the phone menu
export function mountNav(doc) {
  const bar = doc.querySelector('.bar'), cwd = bar.querySelector('.cwd'), hint = doc.querySelector('.hint');
  const links = [...doc.querySelectorAll('.bar a[data-sec], .menu a[data-sec]')];
  const sections = [...doc.querySelectorAll('section[data-sec]')];
  const fixed = doc.body.dataset.cwd; // project pages have a fixed path

  const update = () => {
    if (hint) hint.style.opacity = scrollY > 8 ? 0 : 1;
    const atBottom = innerHeight + scrollY >= doc.documentElement.scrollHeight - 2;
    const key = fixed ? 'projects' : currentSection(sections.map(s => ({ key: s.dataset.sec, top: s.getBoundingClientRect().top })), bar.getBoundingClientRect().bottom + 80, atBottom);
    cwd.textContent = fixed || '~/laith-sh' + (key ? '/' + key : '');
    links.forEach(a => a.classList.toggle('on', a.dataset.sec === key));
  };
  addEventListener('scroll', update, { passive: true });
  update();

  const btn = bar.querySelector('.menu-btn'), menu = doc.getElementById('menu');
  const setMenu = open => {
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? '[ close ]' : '[ menu ]';
    if (open) menu.querySelector('a')?.focus();
  };
  btn.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  doc.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); btn.focus(); }
  });
}
