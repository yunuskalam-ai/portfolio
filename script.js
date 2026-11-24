(function () {
  'use strict';

  const root = document.documentElement;
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const menuToggle = document.querySelector('.menu-toggle');
  const primaryNav = document.getElementById('primary-nav');
  const navLinks = Array.from(document.querySelectorAll('[data-nav]'));
  const railDots = Array.from(document.querySelectorAll('.rail-dots span'));
  const revealItems = Array.from(document.querySelectorAll('.reveal'));
  const progressBar = document.querySelector('.scroll-progress');
  const emailButton = document.querySelector('[data-email]');
  const yearNodes = Array.from(document.querySelectorAll('[data-year]'));

  function getStoredTheme() {
    try {
      return localStorage.getItem('theme');
    } catch (error) {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      return;
    }
  }

  function syncThemeLabel() {
    if (!themeToggle) return;
    const isDark = root.dataset.theme === 'dark';
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    themeToggle.setAttribute('title', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  if (themeToggle) {
    syncThemeLabel();
    themeToggle.addEventListener('click', function () {
      const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = nextTheme;
      storeTheme(nextTheme);
      syncThemeLabel();
    });
  }

  const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const onThemeChange = function (event) {
    if (getStoredTheme()) return;
    root.dataset.theme = event.matches ? 'dark' : 'light';
    syncThemeLabel();
  };

  if (typeof themeQuery.addEventListener === 'function') {
    themeQuery.addEventListener('change', onThemeChange);
  } else if (typeof themeQuery.addListener === 'function') {
    themeQuery.addListener(onThemeChange);
  }

  function closeMenu() {
    if (!menuToggle || !primaryNav) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.querySelector('.menu-toggle-label').textContent = 'Menu';
    primaryNav.classList.remove('is-open');
  }

  function openMenu() {
    if (!menuToggle || !primaryNav) return;
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.querySelector('.menu-toggle-label').textContent = 'Close';
    primaryNav.classList.add('is-open');
  }

  if (menuToggle && primaryNav) {
    menuToggle.addEventListener('click', function () {
      if (menuToggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
      } else {
        openMenu();
      }
    });

    primaryNav.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu();
    });

    document.addEventListener('click', function (event) {
      if (menuToggle.getAttribute('aria-expanded') !== 'true') return;
      if (primaryNav.contains(event.target) || menuToggle.contains(event.target)) return;
      closeMenu();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 720) closeMenu();
    });
  }

  function setActiveSection(id) {
    navLinks.forEach(function (link) {
      const isActive = link.dataset.nav === id;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    const sectionIds = ['work', 'capabilities', 'about', 'contact'];
    const activeIndex = sectionIds.indexOf(id);
    railDots.forEach(function (dot, index) {
      dot.classList.toggle('is-active', index === activeIndex);
    });
  }

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-32% 0px -58% 0px', threshold: 0 }
    );

    ['work', 'capabilities', 'about', 'contact'].forEach(function (id) {
      const section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });

    const revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add('is-visible');
    });
  }

  let progressTicking = false;

  function updateProgress() {
    const scrollable = root.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    if (progressBar) progressBar.style.transform = 'scaleX(' + progress + ')';
    progressTicking = false;
  }

  function requestProgressUpdate() {
    if (progressTicking) return;
    progressTicking = true;
    window.requestAnimationFrame(updateProgress);
  }

  window.addEventListener('scroll', requestProgressUpdate, { passive: true });
  window.addEventListener('resize', requestProgressUpdate);
  updateProgress();

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    document.execCommand('copy');
    helper.remove();
  }

  if (emailButton) {
    const copyLabel = emailButton.querySelector('.copy-label');
    let resetTimer;

    emailButton.addEventListener('click', async function () {
      const email = emailButton.dataset.email;
      if (!email) return;

      try {
        await copyText(email);
        emailButton.classList.add('is-copied');
        copyLabel.textContent = 'Copied';
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(function () {
          emailButton.classList.remove('is-copied');
          copyLabel.textContent = 'Copy';
        }, 2200);
      } catch (error) {
        copyLabel.textContent = 'Select';
        window.location.href = 'mailto:' + email;
      }
    });
  }

  yearNodes.forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });
})();