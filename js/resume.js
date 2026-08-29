(() => {
  const locale = document.documentElement.lang === 'ar' ? 'ar' : 'en';
  const copy = locale === 'ar' ? {
    switchToLight: 'التبديل إلى الوضع الفاتح',
    switchToDark: 'التبديل إلى الوضع الداكن',
    showLessWork: 'عرض مشاريع أقل',
    showMoreWork: 'عرض 5 مشاريع أخرى',
    hideDetails: 'إخفاء تفاصيل المشروع',
    viewDetails: 'عرض تفاصيل المشروع',
    openNavigation: 'فتح قائمة التنقل',
    closeNavigation: 'إغلاق قائمة التنقل',
    years: (years) => `${years}+ سنوات`
  } : {
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
    showLessWork: 'Show less work',
    showMoreWork: 'Show 5 more projects',
    hideDetails: 'Hide project details',
    viewDetails: 'View project details',
    openNavigation: 'Open navigation',
    closeNavigation: 'Close navigation',
    years: (years) => `${years}+ years`
  };

  const themeButton = document.querySelector('[data-theme-toggle]');
  const themeLabel = document.querySelector('[data-theme-label]');
  const themeColor = document.querySelector('[data-theme-color]');
  const themePreference = window.matchMedia('(prefers-color-scheme: dark)');

  const applyTheme = (theme, persist = false) => {
    const isDark = theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    themeButton?.setAttribute('aria-pressed', String(isDark));
    if (themeLabel) themeLabel.textContent = isDark ? copy.switchToLight : copy.switchToDark;
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
    element.textContent = copy.years(years);
  });

  const workToggle = document.querySelector('[data-work-toggle]');
  const workMore = document.querySelector('#work-more');
  const workToggleLabel = workToggle?.querySelector('[data-work-toggle-label]');

  if (workToggle && workMore && workToggleLabel) {
    const setWorkExpanded = (expanded) => {
      workToggle.setAttribute('aria-expanded', String(expanded));
      workToggleLabel.textContent = expanded ? copy.showLessWork : copy.showMoreWork;
      workMore.setAttribute('aria-hidden', String(!expanded));
      workMore.toggleAttribute('inert', !expanded);
    };

    // Progressive enhancement: the extra projects and no button are the HTML
    // defaults. Collapse them only after this working control is available.
    workMore.classList.add('is-initializing');
    setWorkExpanded(false);
    workToggle.hidden = false;
    requestAnimationFrame(() => workMore.classList.remove('is-initializing'));

    workToggle.addEventListener('click', () => {
      setWorkExpanded(workToggle.getAttribute('aria-expanded') !== 'true');
    });
  }

  const newsToggle = document.querySelector('[data-news-toggle]');
  const newsDetails = document.querySelector('#news-shorts-details');
  const newsToggleLabel = newsToggle?.querySelector('[data-news-toggle-label]');

  if (newsToggle && newsDetails && newsToggleLabel) {
    const setNewsExpanded = (expanded) => {
      newsToggle.setAttribute('aria-expanded', String(expanded));
      newsToggleLabel.textContent = expanded ? copy.hideDetails : copy.viewDetails;
      newsDetails.setAttribute('aria-hidden', String(!expanded));
      newsDetails.toggleAttribute('inert', !expanded);
    };

    newsToggle.hidden = false;
    setNewsExpanded(false);

    newsToggle.addEventListener('click', () => {
      setNewsExpanded(newsToggle.getAttribute('aria-expanded') !== 'true');
    });
  }

  const menuButton = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');

  const closeMenu = () => {
    if (!menuButton || !menu) return;
    menuButton.setAttribute('aria-expanded', 'false');
    const label = menuButton.querySelector('.sr-only');
    if (label) label.textContent = copy.openNavigation;
    menu.dataset.open = 'false';
    document.body.classList.remove('menu-open');
  };

  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      const willOpen = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(willOpen));
      const label = menuButton.querySelector('.sr-only');
      if (label) label.textContent = willOpen ? copy.closeNavigation : copy.openNavigation;
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
  const header = document.querySelector('[data-header]');

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
    let naturalHeight = 0;

    // The only read that needs the bar un-docked: while docked the inner element
    // is out of flow and the wrapper collapses to its min-height. Undocking to
    // read it forces two reflows, so it is kept out of the hot path below.
    const measureHeight = () => {
      const wasPinned = pinned;
      floatingContact.classList.remove('is-fixed');
      naturalHeight = floatingContact.offsetHeight;
      floatingContact.classList.toggle('is-fixed', wasPinned);
    };

    // Pure reads. The wrapper never leaves the flow, so its offsetTop is valid
    // whether or not the bar is docked.
    const measure = () => {
      const headerHeight = header?.offsetHeight || 0;
      dockAt = floatingContact.offsetTop + naturalHeight - headerHeight;
      releaseAt = contactStrip ? contactStrip.offsetTop : Infinity;
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
    window.addEventListener('resize', () => { measureHeight(); measure(); evaluate(); });

    // Both disclosures animate `grid-template-rows` over .45s, so a single
    // measurement on click would read a mid-animation height. The observer
    // fires throughout each expansion and keeps the threshold correct.
    const disclosureInners = document.querySelectorAll('.work-more-inner, .news-details-inner');
    if (disclosureInners.length && typeof ResizeObserver === 'function') {
      const disclosureObserver = new ResizeObserver(() => { measure(); evaluate(); });
      disclosureInners.forEach((panel) => disclosureObserver.observe(panel));
    }

    // The observer above covers the frames of the expansion, but it is delivered
    // by the rendering loop, which does not run in a background tab. The click
    // and the timeout floor are what actually guarantee the threshold is correct
    // once the panel has settled — the same reason `settle()` carries a timeout
    // next to its requestAnimationFrame.
    const disclosureControls = document.querySelectorAll('[data-work-toggle], [data-news-toggle]');
    const disclosurePanels = document.querySelectorAll('#work-more, #news-shorts-details');
    const remeasure = () => { measure(); evaluate(); };

    if (disclosureControls.length) {
      let panelTimer = 0;
      disclosureControls.forEach((control) => {
        control.addEventListener('click', () => {
          remeasure();
          clearTimeout(panelTimer);
          panelTimer = setTimeout(remeasure, 500);
        });
      });
    }

    disclosurePanels.forEach((panel) => {
      panel.addEventListener('transitionend', (event) => {
        if (event.propertyName === 'grid-template-rows') remeasure();
      });
    });

    measureHeight();
    measure();
    evaluate();
  }

  const brandName = document.querySelector('[data-brand-name]');
  const heroName = document.querySelector('.identity-name');

  if (header && brandName && heroName) {
    // The header takes the name back at the moment the hero's own copy of it
    // goes under the header, so the name is never visible in both places and
    // never absent from both.
    const BRAND_HYSTERESIS = 10;
    let revealAt = 0;
    let revealed = false;

    const measureBrand = () => {
      revealAt = heroName.offsetTop + heroName.offsetHeight - header.offsetHeight;
    };

    const evaluateBrand = () => {
      const edge = revealAt + (revealed ? -BRAND_HYSTERESIS : BRAND_HYSTERESIS);
      const next = window.scrollY > edge;
      if (next === revealed) return;
      revealed = next;
      header.setAttribute('data-scrolled', String(revealed));
    };

    window.addEventListener('scroll', evaluateBrand, { passive: true });
    window.addEventListener('resize', () => { measureBrand(); evaluateBrand(); });

    measureBrand();
    evaluateBrand();
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

  const languageSwitch = document.querySelector('[data-language-switch]');
  if (languageSwitch) {
    const baseTarget = languageSwitch.dataset.languageTarget || languageSwitch.getAttribute('href') || '';
    const syncLanguageTarget = () => {
      languageSwitch.setAttribute('href', `${baseTarget}${window.location.hash}`);
    };
    syncLanguageTarget();
    window.addEventListener('hashchange', syncLanguageTarget);
  }
})();
