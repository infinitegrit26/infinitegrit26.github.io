// ==========================================================
// Portfolio interactivity — no frameworks, no build step.
// Everything below is small vanilla-JS. Edit ROLES to change
// the typing effect in the hero section.
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Day/night mode toggle ---- */
  const themeToggle = document.getElementById('themeToggle');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const syncThemeColor = () => {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    themeColor?.setAttribute('content', light ? '#f7f7fa' : '#0c0d13');
    themeToggle?.setAttribute('aria-pressed', String(light));
  };
  syncThemeColor();
  themeToggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
    syncThemeColor();
  });

  /* ---- Typing effect ---- */
  const ROLES = [
    'Senior Software Engineer',
    'Distributed Systems Builder',
    'Agentic AI Engineer'
  ];

  const typedEl = document.getElementById('typed');
  let roleIndex = 0, charIndex = 0, deleting = false;

  function typeLoop() {
    const current = ROLES[roleIndex];
    if (!deleting) {
      charIndex++;
      typedEl.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(typeLoop, 1600);
        return;
      }
    } else {
      charIndex--;
      typedEl.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % ROLES.length;
      }
    }
    setTimeout(typeLoop, deleting ? 40 : 85);
  }
  if (typedEl) {
    if (reduceMotion) typedEl.textContent = ROLES[0];
    else typeLoop();
  }

  /* ---- Mobile nav toggle ---- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const setNav = (open) => {
    navLinks?.classList.toggle('open', open);
    navToggle?.setAttribute('aria-expanded', String(open));
  };
  navToggle?.addEventListener('click', () => setNav(!navLinks.classList.contains('open')));
  navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setNav(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks?.classList.contains('open')) {
      setNav(false);
      navToggle?.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (navLinks?.classList.contains('open') && !e.target.closest('#navbar')) setNav(false);
  });

  /* ---- Navbar background on scroll + back-to-top button ---- */
  const navbar = document.getElementById('navbar');
  const backToTop = document.getElementById('backToTop');
  const onScroll = () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 40);
    backToTop?.classList.toggle('visible', window.scrollY > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Highlight the nav link for the section in view ---- */
  const linkFor = new Map();
  navLinks?.querySelectorAll('a[href^="#"]').forEach(a => {
    const section = document.querySelector(a.getAttribute('href'));
    if (section) linkFor.set(section, a);
  });
  const hero = document.getElementById('hero');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      linkFor.forEach(a => a.classList.remove('active'));
      linkFor.get(entry.target)?.classList.add('active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  linkFor.forEach((_, section) => sectionObserver.observe(section));
  if (hero) sectionObserver.observe(hero); // clears the highlight while the hero is in view

  /* ---- Scroll-reveal animations ---- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const revealTargets = document.querySelectorAll(
      '.section-head, .about-grid, .skills-group, .timeline-item, .project-card, .achievement-card, .post-card, .post-list, .contact-panel'
    );
    revealTargets.forEach(el => {
      // Stagger siblings in the same grid so cards cascade in.
      const siblings = [...el.parentElement.children].filter(c => c.matches(el.tagName.toLowerCase() + '.' + el.classList[0]));
      const i = siblings.indexOf(el);
      if (i > 0) el.style.setProperty('--reveal-delay', `${Math.min(i % 4, 3) * 70}ms`);
      el.classList.add('reveal');
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach(el => observer.observe(el));
  }

  /* ---- Copy email ---- */
  const copyBtn = document.getElementById('copyEmail');
  copyBtn?.addEventListener('click', async () => {
    const email = copyBtn.dataset.email;
    const label = copyBtn.querySelector('.copy-email-label');
    try {
      await navigator.clipboard.writeText(email);
      copyBtn.classList.add('is-copied');
      label.textContent = 'Copied to clipboard';
      setTimeout(() => {
        copyBtn.classList.remove('is-copied');
        label.textContent = email;
      }, 2000);
    } catch (e) {
      window.location.href = `mailto:${email}`;
    }
  });

  /* ---- Footer year ---- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
