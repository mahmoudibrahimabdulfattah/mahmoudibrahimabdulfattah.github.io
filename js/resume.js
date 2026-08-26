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
    // A dead band around the threshold: without it a pixel of scroll jitter is
    // enough to flip the bar back and forth.
    const HYSTERESIS = 12;
    const RELEASE_RATIO = 0.88;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let dockAt = 0;
    let releaseAt = Infinity;
    let pinned = false;
    let settleTimer = 0;

    const measure = () => {
      const wasPinned = pinned;
      floatingContact.classList.remove('is-fixed');
      dockAt = floatingContact.offsetTop + floatingContact.offsetHeight;
      releaseAt = contactStrip ? contactStrip.offsetTop : Infinity;
      floatingContact.classList.toggle('is-fixed', wasPinned);
    };

    // One frame of offset so the bar lifts into place instead of appearing.
    // The timeout is a floor: requestAnimationFrame does not run in a hidden
    // tab, and the bar must never be left stranded at opacity zero.
    const settle = () => {
      if (reducedMotion.matches) return;
      floatingContact.classList.add('is-settling');
      // Force the offset state to be painted; without a read here the browser
      // can batch the add and the remove into one recalc and skip the motion.
      void floatingContact.offsetHeight;
      const clear = () => {
        clearTimeout(settleTimer);
        floatingContact.classList.remove('is-settling');
      };
      settleTimer = setTimeout(clear, 120);
      requestAnimationFrame(() => requestAnimationFrame(clear));
    };

    // Pure arithmetic against cached offsets — no layout read, so this is safe
    // to run straight from the scroll handler on every event.
    const evaluate = () => {
      const y = window.scrollY;
      const stripInView = y + window.innerHeight * RELEASE_RATIO > releaseAt;
      const edge = dockAt + (pinned ? -HYSTERESIS : HYSTERESIS);
      const next = y > edge && !stripInView;

      if (next === pinned) return;
      pinned = next;
      floatingContact.classList.toggle('is-fixed', pinned);
      settle();
    };

    window.addEventListener('scroll', evaluate, { passive: true });
    window.addEventListener('resize', () => { measure(); evaluate(); });

    measure();
    evaluate();
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
