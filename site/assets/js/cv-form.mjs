// Send the CV request in place. Without JavaScript the form still posts to Formspree's own thank-you page.
export function mountCvForm(doc) {
  const form = doc.querySelector('.cv-form');
  if (!form) return;
  const btn = form.querySelector('button'), status = form.querySelector('.status');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    btn.disabled = true;
    status.textContent = 'sending…';
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.reset();
      status.textContent = "sent — I'll be in touch.";
    } catch {
      status.textContent = "couldn't send — try again, or message me on LinkedIn.";
    } finally {
      btn.disabled = false;
    }
  });
}
