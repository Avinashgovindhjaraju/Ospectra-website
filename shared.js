// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', function() {
  initializePage();
  initializeCookieBanner();
  initializeNavbarScroll();
  initializeDemoModal();
  initializeMobileMenu();
  updateActiveNavLink();
  initializeAuthNavbar();
});

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
    loginBtn.onclick = function() { window.location.href = 'Login.html'; };
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
      window.ospTrack('form_submit', {
        element:      'Contact Form Submit',
        visitor_name: firstName.value.trim(),
        email:        email.value.trim(),
      });
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
      window.ospTrack('form_submit', {
        element:      'Book a Demo Form Submit',
        visitor_name: nameInput.value.trim(),
        email:        emailInput.value.trim(),
      });
      showNotif('Demo request sent! Our team will reach out within 24hrs. 🎯');
      closeDemo();
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
  mobileLinks.forEach(link => { link.addEventListener('click', toggleMenu); });
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
// OSPECTRA LEAD TRACKER — shared.js v4
// Enrichment: Hunter.io (email → person + company) + IPinfo (IP → geo)
// =============================================================
(function () {
  'use strict';

  const API = 'https://tracker-ospectra-ai.onrender.com/api';

  // ── Visitor ID (cookie + localStorage, 1 year) ────────────────
  function getVid() {
    let v = null;
    try { v = localStorage.getItem('osp_vid'); } catch(e) {}
    if (!v) v = _getCookie('osp_vid');
    if (!v) {
      v = 'v_' + Math.random().toString(36).slice(2, 14) + Date.now().toString(36);
      try { localStorage.setItem('osp_vid', v); } catch(e) {}
      _setCookie('osp_vid', v, 365);
    }
    return v;
  }

  // ── Session ID (sessionStorage, tab-scoped) ───────────────────
  function getSid() {
    let s = null;
    try { s = sessionStorage.getItem('osp_sid'); } catch(e) {}
    if (!s) {
      s = 's_' + Math.random().toString(36).slice(2, 14);
      try { sessionStorage.setItem('osp_sid', s); } catch(e) {}
    }
    return s;
  }

  // ── Cookie helpers ────────────────────────────────────────────
  function _setCookie(name, value, days) {
    try {
      const exp = new Date(Date.now() + days * 86400000).toUTCString();
      document.cookie = name + '=' + value + ';expires=' + exp + ';path=/;SameSite=Lax';
    } catch(e) {}
  }
  function _getCookie(name) {
    try {
      const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return m ? m[2] : null;
    } catch(e) { return null; }
  }

  // ── Canvas fingerprint ────────────────────────────────────────
  function getFingerprint() {
    try {
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('ospectra-fp', 2, 15);
      const canvasData = c.toDataURL().slice(-40);
      const raw = [
        navigator.userAgent, screen.width + 'x' + screen.height,
        screen.colorDepth, Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.language, (navigator.languages || []).join(','),
        navigator.hardwareConcurrency || 0, navigator.deviceMemory || 0,
        new Date().getTimezoneOffset(), canvasData, navigator.platform || ''
      ].join('|');
      let hash = 0;
      for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash) + raw.charCodeAt(i); hash |= 0;
      }
      return 'fp_' + Math.abs(hash).toString(36) + '_' + raw.length.toString(36);
    } catch(e) { return 'fp_err_' + Math.random().toString(36).slice(2); }
  }

  // ── Real IP via ipify ─────────────────────────────────────────
  // Render's proxy makes request.remote_addr always 127.0.0.1.
  // We fetch the visitor's real public IP client-side and send it
  // as real_ip so IPinfo geo enrichment works correctly.
  let _realIP = null;
  try { _realIP = sessionStorage.getItem('osp_real_ip'); } catch(e) {}

  function fetchRealIP(cb) {
    if (_realIP) { cb(_realIP); return; }
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => {
        _realIP = d.ip || null;
        try { if (_realIP) sessionStorage.setItem('osp_real_ip', _realIP); } catch(e) {}
        cb(_realIP);
      })
      .catch(() => cb(null));
  }

  // ── Extract identity fields from stored user object ───────────
  // Priority: server-returned name/email > email-prefix fallback.
  // Server (server.js) now returns name, email, company on login.
  function _extractUser(user) {
    if (!user) return { displayName: null, email: null, company: null };
    const displayName = user.name
      || user.full_name
      || (user.username
            ? user.username.split('@')[0]
                .replace(/[._\-]+/g, ' ')
                .replace(/\b\w/g, function(c) { return c.toUpperCase(); })
            : null);
    const email = user.email
      || (user.username && user.username.includes('@') ? user.username : null);
    const company = user.company || null;
    return { displayName: displayName, email: email, company: company };
  }

  // ── Core send — all identity fields at TOP LEVEL ──────────────
  // track.py reads email, visitor_name, real_ip directly from the
  // root of the JSON body — this triggers Hunter enrichment when
  // email is present, and IPinfo geo for all visitors.
  function send(eventType, extra) {
    extra = extra || {};
    const payload = {
      visitor_id:   getVid(),
      session_id:   getSid(),
      fingerprint:  getFingerprint(),
      event_type:   eventType,
      page:         window.location.pathname,
      referrer:     document.referrer || null,
      timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen:       screen.width + 'x' + screen.height,
      element:      extra.element      || null,
      email:        extra.email        || null,
      visitor_name: extra.visitor_name || null,
      real_ip:      _realIP            || null,
      extra: Object.assign({
        viewport: window.innerWidth + 'x' + window.innerHeight,
        lang:     navigator.language,
        real_ip:  _realIP || null,
      }, extra),
    };
    fetch(API + '/track', {
      method:    'POST',
      headers:   { 'Content-Type': 'application/json' },
      keepalive: true,
      body:      JSON.stringify(payload),
    }).catch(function() {});
  }

  window.ospTrack = send;

  // ── 1. Fetch real IP then fire page_view ──────────────────────
  fetchRealIP(function(ip) {
    _realIP = ip;
    send('page_view');
  });

  // ── 2. Re-identify returning logged-in users on every page load
  // Fires user_identified 500ms after page_view with email at top
  // level — track.py triggers Hunter enrichment for this visitor.
  (function identifyReturningUser() {
    try {
      const stored = localStorage.getItem('ospectra_user');
      if (!stored) return;
      const user = JSON.parse(stored);
      if (!user) return;
      const u = _extractUser(user);
      if (!u.email && !u.displayName) return;
      setTimeout(function() {
        send('user_identified', {
          element:      'Auto-identified (returning user)',
          email:        u.email,
          visitor_name: u.displayName,
          company:      u.company,
        });
        console.log('[osp] returning user identified →', u.displayName, u.email);
      }, 500);
    } catch(e) {}
  })();

  // ── 3. Click tracking ─────────────────────────────────────────
  document.addEventListener('click', function(e) {
    const el    = e.target.closest('button, a, [data-track]') || e.target;
    const label = (
      (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80)
    ) || el.getAttribute('aria-label')
      || el.getAttribute('title')
      || el.getAttribute('data-track')
      || el.id
      || el.tagName;
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'button' || el.type === 'submit') {
      const form = el.closest('form');
      send('form_submit', {
        element: label.trim(),
        form_id: form ? (form.id || form.className) : null,
      });
    } else {
      send('click', { element: label.trim(), tag: tag, href: el.href || null });
    }
  });

  // ── 4. Scroll depth ───────────────────────────────────────────
  const scrollFired = {};
  window.addEventListener('scroll', function() {
    const docH = document.documentElement.scrollHeight;
    if (!docH) return;
    const pct = Math.round(((window.scrollY + window.innerHeight) / docH) * 100);
    [25, 50, 75, 90].forEach(function(d) {
      if (pct >= d && !scrollFired[d]) { scrollFired[d] = true; send('scroll_' + d, { depth: d }); }
    });
  }, { passive: true });

  // ── 5. Email capture ──────────────────────────────────────────
  // When visitor types email and tabs away — fires enrichment
  // immediately via Hunter email-finder + companies/find.
  document.addEventListener('change', function(e) {
    const el = e.target;
    if ((el.type === 'email' || el.name === 'email' || el.id === 'email') && el.value) {
      send('email_captured', {
        element: 'Email Field',
        email:   el.value.trim(),
      });
    }
  });

  // ── 6. Name capture ───────────────────────────────────────────
  document.addEventListener('change', function(e) {
    const el = e.target;
    const ph = (el.placeholder || '').toLowerCase();
    if (
      (el.name === 'name' || el.id === 'name' || ph.includes('name')) &&
      el.value && el.value.trim().length > 1
    ) {
      send('name_captured', {
        element:      'Name Field',
        visitor_name: el.value.trim(),
      });
    }
  });

  // ── 7. Field focus ────────────────────────────────────────────
  let focusTimer = null;
  document.addEventListener('focusin', function(e) {
    const el = e.target;
    if (el.tagName && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName.toUpperCase())) {
      clearTimeout(focusTimer);
      focusTimer = setTimeout(function() {
        send('field_focus', {
          element:    el.name || el.id || el.placeholder || el.type,
          field_type: el.type,
        });
      }, 1500);
    }
  });

  // ── 8. Time on page ───────────────────────────────────────────
  const timeFired = {};
  [30, 60, 120].forEach(function(sec) {
    setTimeout(function() {
      if (!timeFired[sec]) { timeFired[sec] = true; send('time_on_page', { seconds: sec }); }
    }, sec * 1000);
  });

  // ── 9. Page exit ──────────────────────────────────────────────
  window.addEventListener('beforeunload', function() {
    send('page_exit', { element: window.location.pathname });
  });

  // ── 10. Login tracking ────────────────────────────────────────
  // Watches localStorage for 'ospectra_user' write (login/signup).
  // Sends email at top level → track.py triggers Hunter enrichment.
  // server.js now returns name + email + company on login so
  // _extractUser() gets the real name instead of email-prefix guess.
  const _origSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, value) {
    _origSetItem(key, value);
    if (key === 'ospectra_user') {
      try {
        const user = JSON.parse(value);
        if (!user) return;
        const u = _extractUser(user);
        if (u.email || u.displayName) {
          send('user_login', {
            element:      'Login',
            email:        u.email,
            visitor_name: u.displayName,
            company:      u.company,
          });
          console.log('[osp] user_login fired →', u.displayName, u.email, u.company);
        }
      } catch(e) {
        console.warn('[osp] login tracking parse error', e);
      }
    }
  };

  // ── 11. Heartbeat every 20s ───────────────────────────────────
  // Keeps last_seen fresh — dashboard shows LIVE if last_seen < 60s
  setInterval(function() {
    send('heartbeat', { element: window.location.pathname });
  }, 20000);

  // ── 12. SPA navigation ────────────────────────────────────────
  let lastPage = window.location.pathname;
  function checkPageChange() {
    if (window.location.pathname !== lastPage) {
      lastPage = window.location.pathname;
      Object.keys(scrollFired).forEach(function(k) { delete scrollFired[k]; });
      send('page_view');
    }
  }
  setInterval(checkPageChange, 1500);
  const _push = history.pushState;
  history.pushState = function() { _push.apply(history, arguments); setTimeout(checkPageChange, 100); };
  window.addEventListener('popstate', function() { setTimeout(checkPageChange, 100); });

})();
// ═══════════════════════════════════════════════════════════════
// END OF OSPECTRA TRACKER — shared.js v4
// ═══════════════════════════════════════════════════════════════