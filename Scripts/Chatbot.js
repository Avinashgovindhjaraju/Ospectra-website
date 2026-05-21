(function () {
  'use strict';

  /* ── CONFIG ─────────────────────────────────────────────── */
  var BACKEND_URL = 'https://tracker-ospectra-ai.onrender.com/api/chat';
  var VID_KEY     = 'ospectra_visitor_id'; // ← match your tracker.js localStorage key
  var STORAGE_KEY = 'ospectra_chat_v2';

  /* ── STATE ───────────────────────────────────────────────── */
  var messages = [];
  var isOpen   = false;
  var isTyping = false;
  var emailKnown = false; // track if we already have their email

  /* ── VISITOR DATA ────────────────────────────────────────── */
  function getVisitorId() {
    return localStorage.getItem(VID_KEY) || null;
  }

  /* ── HISTORY ─────────────────────────────────────────────── */
  function saveHistory() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50))); } catch(e){}
  }

  function loadHistory() {
    try {
      var s = localStorage.getItem(STORAGE_KEY);
      if (s) { var p = JSON.parse(s); if (Array.isArray(p)) messages = p; }
    } catch(e) { messages = []; }
  }

  function isReturningVisitor() {
    // true if we have saved messages (they've chatted before)
    return messages.length > 0;
  }

  function hasEmailInHistory() {
    // check if any user message looks like an email — means we already collected it
    return messages.some(function(m) {
      return m.role === 'user' && /\S+@\S+\.\S+/.test(m.content);
    });
  }

  /* ── DOM ─────────────────────────────────────────────────── */
  function el(id) { return document.getElementById(id); }

  function now() {
    var d = new Date(), h = d.getHours(), m = d.getMinutes();
    return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'AM' : 'PM');
  }

  function appendBotMessage(text) {
    var container = el('ospectra-chat-messages');

    var row = document.createElement('div');
    row.className = 'ospectra-msg-row bot-row';

    var avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = 'O';

    var bubble = document.createElement('div');
    bubble.className = 'ospectra-msg bot';
    bubble.innerHTML = text.replace(/\n/g, '<br>');

    row.appendChild(avatar);
    row.appendChild(bubble);
    container.appendChild(row);
    scrollBottom();
    return bubble;
  }

  function appendUserMessage(text) {
    var container = el('ospectra-chat-messages');

    var row = document.createElement('div');
    row.className = 'ospectra-msg-row user-row';

    var bubble = document.createElement('div');
    bubble.className = 'ospectra-msg user';
    bubble.innerHTML = text.replace(/\n/g, '<br>');

    row.appendChild(bubble);
    container.appendChild(row);
    scrollBottom();
  }

  function showTyping() {
    var container = el('ospectra-chat-messages');
    var row = document.createElement('div');
    row.className = 'ospectra-typing-row';
    row.id = 'ospectra-typing-row';

    var avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = 'O';

    var dots = document.createElement('div');
    dots.className = 'ospectra-typing';
    dots.innerHTML = '<span></span><span></span><span></span>';

    row.appendChild(avatar);
    row.appendChild(dots);
    container.appendChild(row);
    scrollBottom();
  }

  function hideTyping() {
    var t = el('ospectra-typing-row');
    if (t) t.remove();
  }

  function scrollBottom() {
    var c = el('ospectra-chat-messages');
    if (c) c.scrollTop = c.scrollHeight;
  }

  /* ── QUICK CHIPS ─────────────────────────────────────────── */
  function showQuickReplies(chips) {
    // remove old chips first
    var old = document.getElementById('ospectra-qr-wrapper');
    if (old) old.remove();

    var container = el('ospectra-chat-messages');
    var wrapper = document.createElement('div');
    wrapper.className = 'ospectra-quick-replies';
    wrapper.id = 'ospectra-qr-wrapper';

    chips.forEach(function(label) {
      var chip = document.createElement('button');
      chip.className = 'ospectra-qr-chip';
      chip.textContent = label;
      chip.addEventListener('click', function() {
        var qr = document.getElementById('ospectra-qr-wrapper');
        if (qr) qr.remove();
        handleSend(label);
      });
      wrapper.appendChild(chip);
    });

    container.appendChild(wrapper);
    scrollBottom();
  }

  /* ── RENDER HISTORY ──────────────────────────────────────── */
  function renderHistory() {
    var container = el('ospectra-chat-messages');
    container.innerHTML = '';
    messages.forEach(function(m) {
      if (m.role === 'assistant') appendBotMessage(m.content);
      else appendUserMessage(m.content);
    });
    scrollBottom();
  }

  /* ── SEND ────────────────────────────────────────────────── */
  function handleSend(textOverride) {
    var input = el('ospectra-chat-input');
    var text = textOverride || (input ? input.value.trim() : '');
    if (!text || isTyping) return;

    if (!textOverride && input) {
      input.value = '';
      input.style.height = 'auto';
    }

    // remove chips on first real send
    var qr = document.getElementById('ospectra-qr-wrapper');
    if (qr) qr.remove();

    appendUserMessage(text);
    messages.push({ role: 'user', content: text });
    saveHistory();

    isTyping = true;
    var sendBtn = el('ospectra-chat-send');
    if (sendBtn) sendBtn.disabled = true;
    showTyping();

    fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages,
        visitor_id: getVisitorId(),
        email_known: hasEmailInHistory()
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      hideTyping();
      isTyping = false;
      if (sendBtn) sendBtn.disabled = false;
      var reply = (data && data.reply) ? data.reply : "Sorry, something went wrong — try again.";
      appendBotMessage(reply);
      messages.push({ role: 'assistant', content: reply });
      saveHistory();
    })
    .catch(function(err) {
      console.error('[Ospectra Chat]', err);
      hideTyping();
      isTyping = false;
      if (sendBtn) sendBtn.disabled = false;
      appendBotMessage("I ran into a quick issue — please try again.");
    });
  }

  /* ── OPEN / CLOSE ────────────────────────────────────────── */
  function openChat() {
    isOpen = true;
    el('ospectra-chat-window').classList.add('open');
    // Remove pulse + notif dot after first open
    el('ospectra-chat-bubble').style.setProperty('--pulse', 'none');
    var dot = document.getElementById('ospectra-notif-dot');
    if (dot) dot.style.display = 'none';
    setTimeout(function() { var inp = el('ospectra-chat-input'); if(inp) inp.focus(); }, 280);
  }

  function closeChat() {
    isOpen = false;
    el('ospectra-chat-window').classList.remove('open');
  }

  function toggleChat() { if (isOpen) closeChat(); else openChat(); }

  /* ── INJECT HTML ─────────────────────────────────────────── */
  function injectWidget() {
    var root = document.createElement('div');
    root.id = 'ospectra-chat-root';

    root.innerHTML =
      // Window
      '<div id="ospectra-chat-window" role="dialog" aria-label="Ospectra AI Chat">' +
        '<div id="ospectra-chat-header">' +
          // Ospectra logo — clean letter mark
          '<div class="chat-logo">O</div>' +
          '<div class="chat-info">' +
            '<div class="chat-name">Ospectra AI</div>' +
            '<div class="chat-status"><span class="chat-status-dot"></span>Online</div>' +
          '</div>' +
          '<button id="ospectra-book-btn">Book a Meeting</button>' +
          '<button id="ospectra-chat-close" aria-label="Close">&#10005;</button>' +
        '</div>' +
        '<div id="ospectra-chat-messages" role="log" aria-live="polite"></div>' +
        '<div id="ospectra-chat-input-area">' +
          '<textarea id="ospectra-chat-input" placeholder="Type your message..." rows="1" aria-label="Message"></textarea>' +
          '<button id="ospectra-chat-send" aria-label="Send">' +
            '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>' +
          '</button>' +
        '</div>' +
        '<div id="ospectra-chat-footer">Powered by <strong>Ospectra AI</strong></div>' +
      '</div>' +

      // Bubble — cloud SVG (no robot)
      '<button id="ospectra-chat-bubble" aria-label="Chat with us">' +
        '<span id="ospectra-notif-dot"></span>' +
        '<svg class="bubble-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
          '<path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>' +
        '</svg>' +
      '</button>';

    document.body.appendChild(root);

    /* Events */
    el('ospectra-chat-bubble').addEventListener('click', toggleChat);
    el('ospectra-chat-close').addEventListener('click', closeChat);
    el('ospectra-chat-send').addEventListener('click', function() { handleSend(); });

    el('ospectra-chat-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });

    el('ospectra-chat-input').addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 80) + 'px';
    });

    el('ospectra-book-btn').addEventListener('click', function() {
      handleSend("I want to book a meeting");
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) closeChat();
    });

    /* Load or init */
    loadHistory();

    if (messages.length === 0) {
      // Brand new visitor — no intro, just a natural opener
      var firstMsg = { role: 'assistant', content: "Hey! What brings you to Ospectra AI today?" };
      messages.push(firstMsg);
      saveHistory();
      renderHistory();
      // Show initial chips for new visitors
      showQuickReplies([
        "What does Ospectra AI do?",
        "Show me pricing",
        "I want a demo",
        "How does lead tracking work?"
      ]);
    } else {
      // Returning visitor — just render history, no greeting
      renderHistory();
      // No chips — they already know the product
    }
  }

  /* ── INIT ────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWidget);
  } else {
    injectWidget();
  }

})();