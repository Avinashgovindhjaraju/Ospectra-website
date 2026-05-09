// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', function() {
  initializePage();
  initializeCookieBanner();
  initializeNavbarScroll();
  initializeDemoModal();
  initializeMobileMenu();
  updateActiveNavLink();
  initializeAuthNavbar();

// ===== AUTH NAVBAR (LOGIN STATE) =====
function initializeAuthNavbar() {
  const user = JSON.parse(localStorage.getItem('ospectra_user'));
  const navCtas = document.querySelector('.nav-ctas');
  if (!navCtas) return;
  navCtas.innerHTML = '';
  if (user && user.username) {
    const welcome = document.createElement('span');
    welcome.textContent = `Welcome, ${user.username.split('@')[0]}`;
    welcome.style.marginRight = '12px';
    welcome.style.fontWeight = '600';
    welcome.style.color = 'var(--accent)';
    navCtas.appendChild(welcome);
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn-login';
    logoutBtn.textContent = 'Logout';
    logoutBtn.onclick = function() {
      localStorage.removeItem('ospectra_user');
      window.location.href = 'index.html';
    };
    navCtas.appendChild(logoutBtn);
  } else {
    const loginBtn = document.createElement('button');
    loginBtn.className = 'btn-login';
    loginBtn.textContent = 'Log in';
    loginBtn.onclick = function() {
      window.location.href = 'Login.html';
    };
    navCtas.appendChild(loginBtn);
    const trialBtn = document.createElement('button');
    trialBtn.className = 'btn-trial';
    trialBtn.textContent = 'Start free trial';
    trialBtn.onclick = function() { showNotif('Free trial coming soon! 🚀'); };
    navCtas.appendChild(trialBtn);
    const demoBtn = document.createElement('button');
    demoBtn.className = 'btn-demo';
    demoBtn.textContent = 'Book a Demo';
    demoBtn.onclick = function() { openDemo(); };
    navCtas.appendChild(demoBtn);
  }
}
});

// ===== UPDATE ACTIVE NAV LINK BASED ON CURRENT PAGE =====
function updateActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href && (href.includes(currentPage) || (currentPage === 'index' && href.includes('index.html')))) {
      link.classList.add('active');
    }
  });
}

// ===== INITIALIZE PAGE-SPECIFIC FEATURES =====
function initializePage() {
  if (document.querySelector('.career-filters')) initializeCareerFiltering();
  if (document.querySelector('.faq-item')) initializeFAQ();
  if (document.querySelector('.contact-form')) initializeContactForm();
  if (document.querySelector('#demo-modal')) initializeDemoForm();
}

// ===== CAREER FILTERING =====
function initializeCareerFiltering() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const jobCards   = document.querySelectorAll('.job-card');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const dept = btn.getAttribute('data-dept');
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      jobCards.forEach(card => {
        if (dept === 'all' || card.getAttribute('data-dept') === dept) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
  filterBtns[0]?.classList.add('active');
}

// ===== FAQ ACCORDION =====
function initializeFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    header.addEventListener('click', () => {
      faqItems.forEach(other => { if (other !== item) other.classList.remove('open'); });
      item.classList.toggle('open');
    });
  });
}

// ===== CONTACT FORM =====
function initializeContactForm() {
  const form       = document.querySelector('.contact-form');
  const submitBtn  = document.querySelector('.contact-form .btn-submit');
  const successMsg = document.querySelector('.form-success');
  if (!form) return;
  submitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const firstName = form.querySelector('input[placeholder="John"]');
    const email     = form.querySelector('input[type="email"]');
    if (firstName && firstName.value.trim() && email && email.value.trim()) {
      // ── Track contact form submission ──────────────────────────
      ospTrack('form_submit', {
        element:      'contact-form',
        visitor_name: firstName.value.trim(),
        email:        email.value.trim(),
      });
      // ──────────────────────────────────────────────────────────
      form.style.display = 'none';
      if (successMsg) successMsg.classList.add('show');
      showNotif("Message sent! We'll get back to you soon. ✅");
      setTimeout(() => {
        form.style.display = 'block';
        form.reset();
        if (successMsg) successMsg.classList.remove('show');
      }, 3000);
    } else {
      showNotif('Please fill in all fields.');
    }
  });
}

// ===== DEMO FORM =====
function initializeDemoForm() {
  const demoSubmitBtn = document.querySelector('#demo-modal .btn-submit');
  if (!demoSubmitBtn) return;
  demoSubmitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const nameInput  = document.querySelector('#demo-modal input[placeholder="Your full name"]');
    const emailInput = document.querySelector('#demo-modal input[placeholder="you@company.com"]');
    if (nameInput && nameInput.value.trim() && emailInput && emailInput.value.trim()) {
      // ── Track demo booking — HIGH VALUE EVENT ──────────────────
      ospTrack('form_submit', {
        element:      'book-a-demo',
        visitor_name: nameInput.value.trim(),
        email:        emailInput.value.trim(),
      });
      // ──────────────────────────────────────────────────────────
      showNotif('Demo request sent! Our team will reach out within 24hrs. 🎯');
      closeDemo();
      setTimeout(() => {
        document.querySelector('#demo-modal form')?.reset();
      }, 500);
    } else {
      showNotif('Please fill in all required fields.');
    }
  });
}

// ===== COOKIE BANNER =====
function initializeCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;
  if (localStorage.getItem('cookies-accepted')) banner.style.display = 'none';
}

function acceptCookies() {
  localStorage.setItem('cookies-accepted', 'true');
  document.getElementById('cookie-banner').style.animation = 'slideDown 0.4s ease forwards';
  setTimeout(() => { document.getElementById('cookie-banner').style.display = 'none'; }, 400);
  showNotif('Cookies accepted! Thank you 🍪');
}

function declineCookies() {
  document.getElementById('cookie-banner').style.animation = 'slideDown 0.4s ease forwards';
  setTimeout(() => { document.getElementById('cookie-banner').style.display = 'none'; }, 400);
}

// ===== NOTIFICATION TOAST =====
let notifTimer;
function showNotif(msg) {
  const n = document.getElementById('notif');
  if (!n) return;
  n.textContent = msg;
  n.classList.add('show');
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => n.classList.remove('show'), 3000);
}

// ===== DEMO MODAL =====
function initializeDemoModal() {
  const modal = document.getElementById('demo-modal');
  if (!modal) return;
  modal.addEventListener('click', function(e) {
    if (e.target === this) closeDemo();
  });
}

function openDemo() {
  const modal = document.getElementById('demo-modal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    // ── Track demo modal open ──────────────────────────────────
    ospTrack('click', { element: 'book-a-demo-button' });
    // ──────────────────────────────────────────────────────────
  }
}

function closeDemo() {
  const modal = document.getElementById('demo-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// ===== MOBILE MENU =====
function initializeMobileMenu() {
  const mobileLinks = document.querySelectorAll('.mobile-menu a');
  mobileLinks.forEach(link => {
    link.addEventListener('click', toggleMenu);
  });
}

function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('open');
}

// ===== NAVBAR SCROLL EFFECT =====
function initializeNavbarScroll() {
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) {
      nav.style.background = window.scrollY > 30
        ? 'rgba(10,10,46,0.98)'
        : 'rgba(10,10,46,0.85)';
    }
  });
}

// ===== PAGE NAVIGATION HELPERS =====
function navigateTo(page) {
  window.location.href = page + '.html';
}

window.addEventListener('load', () => {
  window.scrollTo({ top: 0, behavior: 'instant' });
  updateActiveNavLink();
});

window.addEventListener('popstate', updateActiveNavLink);


// =============================================================
// ██████╗ ███████╗██████╗ ███████╗ ██████╗████████╗██████╗  █████╗
// ██╔══██╗██╔════╝██╔══██╗██╔════╝██╔════╝╚══██╔══╝██╔══██╗██╔══██╗
// ██████╔╝█████╗  ██████╔╝█████╗  ██║        ██║   ██████╔╝███████║
// ██╔═══╝ ██╔══╝  ██╔══██╗██╔══╝  ██║        ██║   ██╔══██╗██╔══██║
// ██║     ███████╗██║  ██║██║     ╚██████╗   ██║   ██║  ██║██║  ██║
// ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝      ╚═════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝
// OSPECTRA LEAD TRACKER — tracks all visitor activity on this website
// Sends data to FastAPI backend → visible in dashboard.html
// =============================================================
(function () {
  'use strict';

  // ✅ Change to your Render URL when deploying to production
  const API = 'http://localhost:8000/api';

  // ─── Visitor ID (persists across sessions via localStorage) ──
  function getVid() {
    let v = localStorage.getItem('osp_vid');
    if (!v) {
      v = 'v_' + Math.random().toString(36).slice(2, 14);
      localStorage.setItem('osp_vid', v);
    }
    return v;
  }

  // ─── Session ID (resets each browser tab session) ────────────
  function getSid() {
    let s = sessionStorage.getItem('osp_sid');
    if (!s) {
      s = 's_' + Math.random().toString(36).slice(2, 14);
      sessionStorage.setItem('osp_sid', s);
    }
    return s;
  }

  // ─── Canvas fingerprint (identifies returning visitors) ──────
  function getFingerprint() {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('ospectra-fp-🔍', 2, 2);
    const canvasData = c.toDataURL().slice(-50);
    const raw = [
      navigator.userAgent,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.language,
      navigator.hardwareConcurrency || 0,
      new Date().getTimezoneOffset(),
      canvasData,
    ].join('|');
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    return 'fp_' + Math.abs(hash).toString(36) + '_' + raw.length.toString(36);
  }

  // ─── Core send function ───────────────────────────────────────
  // This is exposed globally so contact/demo forms can call it too
  window.ospTrack = function (eventType, extra) {
    extra = extra || {};
    fetch(API + '/track', {
      method:    'POST',
      headers:   { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        visitor_id:  getVid(),
        session_id:  getSid(),
        fingerprint: getFingerprint(),
        event_type:  eventType,
        page:        window.location.pathname,
        referrer:    document.referrer || null,
        timezone:    Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen:      screen.width + 'x' + screen.height,
        extra:       Object.assign({
          viewport: window.innerWidth + 'x' + window.innerHeight,
          lang:     navigator.language,
        }, extra),
        // Top-level fields the backend reads directly
        email:        extra.email        || null,
        visitor_name: extra.visitor_name || null,
        timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen:       screen.width + 'x' + screen.height,
      }),
    }).catch(function () {});
  };

  // ─── 1. Page view — fires immediately on every page ──────────
  window.ospTrack('page_view');

  // ─── 2. Click tracking — every button and link ───────────────
  document.addEventListener('click', function (e) {
    const el    = e.target.closest('button, a, [data-track]') || e.target;
    const label = (el.innerText || '').trim().slice(0, 80)
                  || el.getAttribute('aria-label')
                  || el.getAttribute('title')
                  || el.id
                  || el.tagName;
    // Skip "Book a Demo" — tracked separately in openDemo()
    if (label === 'book-a-demo-button') return;
    window.ospTrack('click', { element: label, tag: el.tagName.toLowerCase(), href: el.href || null });
  });

  // ─── 3. Email capture — when user types in email field ───────
  document.addEventListener('change', function (e) {
    const el = e.target;
    if ((el.type === 'email' || el.name === 'email' || el.id === 'email') && el.value) {
      window.ospTrack('email_captured', { email: el.value.trim() });
    }
  });

  // ─── 4. Name capture — when user types in name field ─────────
  document.addEventListener('change', function (e) {
    const el = e.target;
    if (
      (el.name === 'name' || el.id === 'name' ||
       (el.placeholder && el.placeholder.toLowerCase().includes('name'))) &&
      el.value && el.value.trim().length > 1
    ) {
      window.ospTrack('name_captured', { visitor_name: el.value.trim() });
    }
  });

  // ─── 5. Scroll depth tracking ────────────────────────────────
  const scrollFired = {};
  window.addEventListener('scroll', function () {
    const pct = Math.round(
      ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
    );
    [25, 50, 75, 90].forEach(function (d) {
      if (pct >= d && !scrollFired[d]) {
        scrollFired[d] = true;
        window.ospTrack('scroll_' + d, { depth: d });
      }
    });
  }, { passive: true });

  // ─── 6. Time on page (30s, 60s, 2min) ────────────────────────
  const timeFired = {};
  [30, 60, 120].forEach(function (sec) {
    setTimeout(function () {
      if (!timeFired[sec]) {
        timeFired[sec] = true;
        window.ospTrack('time_on_page', { seconds: sec });
      }
    }, sec * 1000);
  });

  // ─── 7. Page exit ─────────────────────────────────────────────
  window.addEventListener('beforeunload', function () {
    window.ospTrack('page_exit', { page: window.location.pathname });
  });

  // ─── 8. Login tracking — detect when user logs in ────────────
  // Watches localStorage for ospectra_user being set
  const _origSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    _origSetItem(key, value);
    if (key === 'ospectra_user') {
      try {
        const user = JSON.parse(value);
        if (user && user.username) {
          window.ospTrack('user_login', {
            email:        user.username,
            visitor_name: user.username.split('@')[0],
          });
        }
      } catch (e) {}
    }
  };

  // ─── 9. SPA navigation support ───────────────────────────────
  let lastPage = window.location.pathname;
  setInterval(function () {
    if (window.location.pathname !== lastPage) {
      lastPage = window.location.pathname;
      window.ospTrack('page_view');
    }
  }, 1500);

})();
// ═════════════════════════════════════════════════════════════
// END OF OSPECTRA TRACKER
// ═════════════════════════════════════════════════════════════