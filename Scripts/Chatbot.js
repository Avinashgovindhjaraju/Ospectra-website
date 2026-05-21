(function () {
  'use strict';

  /* ── CONFIG ─────────────────────────────────────────────── */
  var BACKEND_URL  = 'https://tracker-ospectra-ai.onrender.com/api/chat';
  var WELCOME_MSG  = "Hey! 👋 I'm ARIA, Ospectra's AI assistant.\n\nI can help with product questions, pricing, demos, or anything else. What brings you here today?";
  var STORAGE_KEY  = 'ospectra_chat_history';
  var VID_KEY      = 'ospectra_visitor_id';  // ← CHECK YOUR tracker.js AND UPDATE THIS IF DIFFERENT

  /* ── STATE ───────────────────────────────────────────────── */
  var messages  = [];    // full conversation history
  var isOpen    = false;
  var isTyping  = false;

  /* ── VISITOR ID ──────────────────────────────────────────── */
  function getVisitorId() {
    // If this doesn't work, open your tracker.js and search:
    //   localStorage.setItem('???', ...)
    // Then update VID_KEY above to match.
    return localStorage.getItem(VID_KEY) || null;
  }

  /* ── HISTORY (localStorage) ──────────────────────────────── */
  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch (e) {}
  }

  function loadHistory() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) messages = parsed;
      }
    } catch (e) {
      messages = [];
    }
  }

  /* ── DOM HELPERS ─────────────────────────────────────────── */
  function el(id) { return document.getElementById(id); }

  function now() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'AM' : 'PM');
  }

  function appendMessage(role, text, showTime) {
    var container = el('ospectra-chat-messages');

    var div = document.createElement('div');
    div.className = 'ospectra-msg ' + (role === 'assistant' ? 'bot' : 'user');

    // Handle newlines in text → <br>
    div.innerHTML = text.replace(/\n/g, '<br>');

    container.appendChild(div);

    // Timestamp
    if (showTime !== false) {
      var timeEl = document.createElement('div');
      timeEl.className = 'ospectra-msg-time ' + (role === 'assistant' ? 'bot-time' : 'user-time');
      timeEl.textContent = now();
      container.appendChild(timeEl);
    }

    scrollToBottom();
    return div;
  }

  function showTyping() {
    var div = document.createElement('div');
    div.className = 'ospectra-typing';
    div.id = 'ospectra-typing-indicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    el('ospectra-chat-messages').appendChild(div);
    scrollToBottom();
  }

  function hideTyping() {
    var t = el('ospectra-typing-indicator');
    if (t) t.remove();
  }

  function scrollToBottom() {
    var msgs = el('ospectra-chat-messages');
    msgs.scrollTop = msgs.scrollHeight;
  }

  /* ── QUICK REPLY CHIPS (first message only) ──────────────── */
  function showQuickReplies() {
    var chips = [
      "What does Ospectra AI do?",
      "Show me pricing",
      "I want a demo",
      "How does tracking work?"
    ];

    var container = el('ospectra-chat-messages');

    var wrapper = document.createElement('div');
    wrapper.className = 'ospectra-quick-replies';
    wrapper.id = 'ospectra-qr-wrapper';

    chips.forEach(function (label) {
      var chip = document.createElement('button');
      chip.className = 'ospectra-qr-chip';
      chip.textContent = label;
      chip.addEventListener('click', function () {
        // Remove chips on first use
        var qr = el('ospectra-qr-wrapper');
        if (qr) qr.remove();
        // Send as user message
        handleSend(label);
      });
      wrapper.appendChild(chip);
    });

    container.appendChild(wrapper);
    scrollToBottom();
  }

  /* ── RENDER FULL HISTORY ─────────────────────────────────── */
  function renderHistory() {
    var container = el('ospectra-chat-messages');
    container.innerHTML = '';

    messages.forEach(function (m, i) {
      appendMessage(m.role, m.content, false);
    });

    scrollToBottom();
  }

  /* ── SEND LOGIC ──────────────────────────────────────────── */
  function handleSend(textOverride) {
    var input = el('ospectra-chat-input');
    var text = textOverride || input.value.trim();

    if (!text || isTyping) return;

    if (!textOverride) {
      input.value = '';
      input.style.height = 'auto';
    }

    // Remove quick replies on first user message
    var qr = el('ospectra-qr-wrapper');
    if (qr) qr.remove();

    appendMessage('user', text);
    messages.push({ role: 'user', content: text });
    saveHistory();

    // Lock send button + show typing
    isTyping = true;
    var sendBtn = el('ospectra-chat-send');
    if (sendBtn) sendBtn.disabled = true;
    showTyping();

    var visitorId = getVisitorId();

    fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages, visitor_id: visitorId })
    })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      hideTyping();
      isTyping = false;
      if (sendBtn) sendBtn.disabled = false;

      var reply = (data && data.reply) ? data.reply : "I didn't catch that — could you try again?";
      appendMessage('assistant', reply);
      messages.push({ role: 'assistant', content: reply });
      saveHistory();
    })
    .catch(function (err) {
      console.error('[ARIA] fetch error:', err);
      hideTyping();
      isTyping = false;
      if (sendBtn) sendBtn.disabled = false;

      var errMsg = "I ran into a quick issue — please try again in a moment.";
      appendMessage('assistant', errMsg);
    });
  }

  /* ── OPEN / CLOSE ────────────────────────────────────────── */
  function openChat() {
    isOpen = true;
    el('ospectra-chat-window').classList.add('open');
    // Remove pulse after first open
    el('ospectra-chat-bubble').style.animation = 'none';
    var dot = el('ospectra-chat-bubble').querySelector('.notif-dot');
    if (dot) dot.remove();
    setTimeout(function () {
      el('ospectra-chat-input').focus();
    }, 280);
  }

  function closeChat() {
    isOpen = false;
    el('ospectra-chat-window').classList.remove('open');
  }

  function toggleChat() {
    if (isOpen) closeChat(); else openChat();
  }

  /* ── WIDGET HTML INJECTION ───────────────────────────────── */
  function injectWidget() {
    var wrapper = document.createElement('div');
    wrapper.id = 'ospectra-chat-root';

    wrapper.innerHTML =
      // Chat window
      '<div id="ospectra-chat-window" role="dialog" aria-label="Ospectra AI Chat">' +
        '<div id="ospectra-chat-header">' +
          '<div class="chat-avatar">🤖</div>' +
          '<div class="chat-info">' +
            '<div class="chat-name">ARIA · Ospectra AI</div>' +
            '<div class="chat-status">' +
              '<span class="chat-status-dot"></span>' +
              'Online · Replies instantly' +
            '</div>' +
          '</div>' +
          '<button id="ospectra-chat-close" aria-label="Close chat">✕</button>' +
        '</div>' +
        '<div id="ospectra-chat-messages" role="log" aria-live="polite"></div>' +
        '<div id="ospectra-chat-input-area">' +
          '<textarea id="ospectra-chat-input" placeholder="Ask me anything..." rows="1" aria-label="Type your message"></textarea>' +
          '<button id="ospectra-chat-send" aria-label="Send message">' +
            '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>' +
          '</button>' +
        '</div>' +
        '<div id="ospectra-chat-footer">Powered by Ospectra AI</div>' +
      '</div>' +

      // Bubble
      '<button id="ospectra-chat-bubble" aria-label="Open chat">' +
        '<span class="notif-dot"></span>' +
        '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>' +
      '</button>';

    document.body.appendChild(wrapper);

    /* Event listeners */
    el('ospectra-chat-bubble').addEventListener('click', toggleChat);
    el('ospectra-chat-close').addEventListener('click', closeChat);
    el('ospectra-chat-send').addEventListener('click', function () { handleSend(); });

    el('ospectra-chat-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // Auto-resize textarea
    el('ospectra-chat-input').addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 84) + 'px';
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) closeChat();
    });

    /* Load history or show welcome */
    loadHistory();

    if (messages.length === 0) {
      var welcome = { role: 'assistant', content: WELCOME_MSG };
      messages.push(welcome);
      saveHistory();
      renderHistory();
      // Show quick reply chips after welcome
      showQuickReplies();
    } else {
      renderHistory();
    }
  }

  /* ── INIT ────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWidget);
  } else {
    injectWidget();
  }

})();