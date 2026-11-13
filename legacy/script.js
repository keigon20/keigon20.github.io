const header = document.querySelector('[data-header]');
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Mobile nav
const toggle = document.querySelector('[data-nav-toggle]');
const menu = document.querySelector('[data-nav-menu]');
if (toggle && menu) {
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.dataset.open = String(open);
  };

  setOpen(false);
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    setOpen(open);
  });

  // Close on link click
  menu.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => setOpen(false));
  });
}

// Contact form: no backend. Copy message to clipboard.
const form = document.getElementById('contactForm');
const hint = document.getElementById('formHint');
if (form && hint) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const name = fd.get('name');
    const email = fd.get('email');
    const message = fd.get('message');

    const payload = `Name: ${name}\nEmail: ${email}\n\n${message}`;

    try {
      await navigator.clipboard.writeText(payload);
      hint.textContent = 'Message copied to clipboard. Paste it into your email.';
    } catch {
      hint.textContent = 'Could not access clipboard. Select the message and copy manually.';
    }

    form.reset();
  });
}
