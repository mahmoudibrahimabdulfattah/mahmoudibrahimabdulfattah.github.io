(() => {
  const themeButton = document.querySelector('[data-theme-toggle]');
  const themeLabel = document.querySelector('[data-theme-label]');
  const themeColor = document.querySelector('[data-theme-color]');
  const themePreference = window.matchMedia('(prefers-color-scheme: dark)');

  const applyTheme = (theme, persist = false) => {
    const isDark = theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    themeButton?.setAttribute('aria-pressed', String(isDark));
    if (themeLabel) themeLabel.textContent = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    themeColor?.setAttribute('content', isDark ? '#0c111d' : '#ffffff');
    if (persist) {
      try { localStorage.setItem('mk-theme', isDark ? 'dark' : 'light'); } catch (_) {}
    }
  };

  applyTheme(document.documentElement.dataset.theme || (themePreference.matches ? 'dark' : 'light'));

  themeButton?.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme, true);
  });

  themePreference.addEventListener?.('change', (event) => {
    try {
      if (localStorage.getItem('mk-theme')) return;
    } catch (_) {}
    applyTheme(event.matches ? 'dark' : 'light');
  });

  const careerStartYear = 2020;
  const currentYear = new Date().getFullYear();
  const years = Math.max(1, currentYear - careerStartYear);

  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = String(currentYear);
  });

  document.querySelectorAll('[data-years]').forEach((element) => {
    element.textContent = `${years}+ years`;
  });

  const menuButton = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');

  const closeMenu = () => {
    if (!menuButton || !menu) return;
    menuButton.setAttribute('aria-expanded', 'false');
    const label = menuButton.querySelector('.sr-only');
    if (label) label.textContent = 'Open navigation';
    menu.dataset.open = 'false';
    document.body.classList.remove('menu-open');
  };

  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      const willOpen = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(willOpen));
      const label = menuButton.querySelector('.sr-only');
      if (label) label.textContent = willOpen ? 'Close navigation' : 'Open navigation';
      menu.dataset.open = String(willOpen);
      document.body.classList.toggle('menu-open', willOpen);
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  const floatingContact = document.querySelector('.floating-contact');
  const contactStrip = document.querySelector('.contact-strip');

  if (floatingContact) {
    let contactThreshold = floatingContact.offsetTop + floatingContact.offsetHeight;
    let contactStripVisible = false;

    const syncFloatingContact = () => {
      const shouldPin = window.scrollY > contactThreshold && !contactStripVisible;
      floatingContact.classList.toggle('is-fixed', shouldPin);
    };

    const measureFloatingContact = () => {
      floatingContact.classList.remove('is-fixed');
      contactThreshold = floatingContact.offsetTop + floatingContact.offsetHeight;
      syncFloatingContact();
    };

    // The closing contact strip already offers the same action, so retire the
    // floating bar instead of stacking two identical calls to action.
    if (contactStrip && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        contactStripVisible = entries[0].isIntersecting;
        syncFloatingContact();
      }, { rootMargin: '0px 0px -12% 0px' }).observe(contactStrip);
    }

    window.addEventListener('scroll', syncFloatingContact, { passive: true });
    window.addEventListener('resize', measureFloatingContact);
    syncFloatingContact();
  }

  const navigationLinks = Array.from(document.querySelectorAll('.primary-nav a[href^="#"]'));
  const sections = navigationLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      navigationLinks.forEach((link) => {
        const isCurrent = link.getAttribute('href') === `#${visible.target.id}`;
        if (isCurrent) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }, {
      rootMargin: '-18% 0px -68% 0px',
      threshold: [0, .2, .45]
    });

    sections.forEach((section) => observer.observe(section));
  }
})();
