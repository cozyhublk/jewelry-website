// Manarhey site behaviour: menu, scroll reveals, tagline reveal, nav state, booking form.

// Set this to a form service URL (Formspree, Basin, your own API) to receive bookings.
// While it is empty the form validates and shows the confirmation, but nothing is sent.
const FORM_ENDPOINT = '';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Hero entrance ---------- */
const markLoaded = () => document.documentElement.classList.add('is-loaded');
requestAnimationFrame(() => requestAnimationFrame(markLoaded));
// Fallback for browsers that pause animation frames (background tabs, previews).
setTimeout(markLoaded, 400);

/* ---------- Header: solid once scrolled, hidden while scrolling down ---------- */
const header = document.getElementById('site-header');
let lastY = window.scrollY;
let headerTicking = false;

function updateHeader() {
  headerTicking = false;
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 8);
  const menuOpen = document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'true';
  if (!menuOpen && Math.abs(y - lastY) > 4) {
    header.classList.toggle('is-hidden', y > lastY && y > 240);
  }
  lastY = y;
}

window.addEventListener('scroll', () => {
  if (!headerTicking) {
    headerTicking = true;
    requestAnimationFrame(updateHeader);
  }
}, { passive: true });
updateHeader();

/* ---------- Mobile menu ---------- */
const toggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('mobile-menu');

function setMenu(open) {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) {
    header.classList.remove('is-hidden');
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('is-open'));
  } else {
    menu.classList.remove('is-open');
    setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 300);
  }
}

toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    toggle.focus();
  }
});

/* ---------- Scroll reveals ---------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .media-reveal').forEach((el) => revealObserver.observe(el));

/* ---------- Tagline word reveal ---------- */
const tagline = document.querySelector('[data-reveal-words]');

if (tagline) {
  // Wrap each word in a span, keeping the <br> line breaks.
  const parts = tagline.innerHTML.split(/(<br\s*\/?>)/i);
  tagline.innerHTML = parts
    .map((part) => (/^<br/i.test(part)
      ? part
      : part.split(/(\s+)/).map((w) => (w.trim() ? `<span class="word">${w}</span>` : w)).join('')))
    .join('');
  const words = [...tagline.querySelectorAll('.word')];

  if (reducedMotion) {
    words.forEach((w) => w.classList.add('is-lit'));
  } else {
    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = tagline.getBoundingClientRect();
      const vh = window.innerHeight;
      // Starts when the text top reaches 80% of the viewport, finishes when its bottom reaches 45%.
      const start = vh * 0.8;
      const end = vh * 0.45;
      const progress = (start - rect.top) / (start - end + rect.height);
      const lit = Math.max(0, Math.min(words.length, Math.floor(progress * (words.length + 1))));
      words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    // Only listen while the tagline is near the viewport.
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        window.addEventListener('scroll', onScroll, { passive: true });
        update();
      } else {
        window.removeEventListener('scroll', onScroll);
        update();
      }
    }).observe(tagline);
  }
}

/* ---------- Current section in nav ---------- */
const navLinks = [...document.querySelectorAll('.header-nav .nav-link')];
// Watch every top level section so the highlight clears on sections with no nav link.
const sections = [...document.querySelectorAll('main > section[id]')];

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const id = `#${entry.target.id}`;
    navLinks.forEach((a) => {
      if (a.getAttribute('href') === id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-45% 0px -50% 0px' });

sections.forEach((s) => navObserver.observe(s));

/* ---------- "Ask about this piece" preselects the form ---------- */
const interest = document.getElementById('f-interest');
document.querySelectorAll('[data-interest]').forEach((link) => {
  link.addEventListener('click', () => {
    const value = link.dataset.interest;
    const option = [...interest.options].find((o) => o.value === value);
    if (option) interest.value = value;
  });
});

/* ---------- Booking form ---------- */
const form = document.getElementById('booking-form');
const done = document.getElementById('booking-done');
const doneText = document.getElementById('booking-done-text');
const status = form.querySelector('.form-status');
const submit = form.querySelector('button[type="submit"]');
const submitLabel = submit.querySelector('.btn-label');

const rules = {
  name: (v) => (v.trim().length < 2 ? 'Enter your full name so we know who to expect.' : ''),
  phone: (v) => (v.replace(/[^\d]/g, '').length < 7 ? 'Enter a phone or WhatsApp number with at least 7 digits.' : ''),
  email: (v) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'This email looks incomplete. Check it or leave it empty.' : ''),
};

function validateField(input) {
  const rule = rules[input.name];
  if (!rule) return true;
  const message = rule(input.value);
  const error = document.getElementById(`${input.id}-error`);
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  error.textContent = message;
  error.hidden = !message;
  return !message;
}

Object.keys(rules).forEach((name) => {
  const input = form.elements[name];
  input.addEventListener('blur', () => { if (input.value) validateField(input); });
  input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') validateField(input); });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const inputs = Object.keys(rules).map((n) => form.elements[n]);
  const valid = inputs.map(validateField).every(Boolean);
  if (!valid) {
    const firstBad = inputs.find((i) => i.getAttribute('aria-invalid') === 'true');
    firstBad.focus();
    status.textContent = 'Some details need a second look before we can send this.';
    return;
  }

  const data = Object.fromEntries(new FormData(form));
  submit.setAttribute('aria-busy', 'true');
  submit.disabled = true;
  submitLabel.textContent = 'Sending your request';
  status.textContent = '';

  try {
    if (FORM_ENDPOINT) {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(String(res.status));
    } else {
      await new Promise((r) => setTimeout(r, 600));
      console.warn('FORM_ENDPOINT is empty: the booking was validated but not sent.');
    }
    const firstName = data.name.trim().split(/\s+/)[0];
    doneText.textContent = `Thank you, ${firstName}. We will contact you on ${data.phone.trim()} to confirm your ${data.where === 'Video call' ? 'video call' : 'studio visit'}.`;
    form.hidden = true;
    done.hidden = false;
    done.focus();
  } catch (err) {
    status.textContent = 'Your request did not send. Check your connection and try again, or call the studio.';
  } finally {
    submit.removeAttribute('aria-busy');
    submit.disabled = false;
    submitLabel.textContent = 'Request my viewing';
  }
});

document.getElementById('booking-reset').addEventListener('click', () => {
  form.reset();
  form.querySelectorAll('[aria-invalid]').forEach((i) => i.removeAttribute('aria-invalid'));
  done.hidden = true;
  form.hidden = false;
  form.elements.name.focus();
});
