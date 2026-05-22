(function () {
  'use strict';

  /* ── CONFIG ─────────────────────────────────────────────── */
  var BACKEND_URL = 'https://tracker-ospectra-ai.onrender.com/api/chat';
  var STORAGE_KEY = 'ospectra_chat_history';
  var VID_KEY     = 'ospectra_visitor_id'; // ← must match your tracker.js localStorage key exactly

  /* ── STATE ───────────────────────────────────────────────── */
  var messages = [];
  var isOpen   = false;
  var isTyping = false;

  /* ── VISITOR ID ──────────────────────────────────────────── */
  function getVisitorId() {
    return localStorage.getItem(VID_KEY) || null;
  }

  /* ── HISTORY (localStorage) ──────────────────────────────── */
  function saveHistory() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40))); } catch (e) {}
  }

  function loadHistory() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) { messages = parsed; return true; }
      }
    } catch (e) {}
    messages = [];
    return false;
  }

  /* ── DETECT RETURNING VISITOR ────────────────────────────── */
  // Returns true if there is an existing conversation in history
  function isReturningVisitor() {
    return messages.length > 1; // more than just the welcome message
  }

  /* ── DOM HELPERS ─────────────────────────────────────────── */
  function el(id) { return document.getElementById(id); }

  function now() {
    var d = new Date(), h = d.getHours(), m = d.getMinutes();
    return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'AM' : 'PM');
  }

  function appendMessage(role, text, showTime) {
    var container = el('ospectra-chat-messages');
    var div = document.createElement('div');
    div.className = 'ospectra-msg ' + (role === 'assistant' ? 'bot' : 'user');
    div.innerHTML = text.replace(/\n/g, '<br>');
    container.appendChild(div);

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

  /* ── SMART WELCOME MESSAGE ───────────────────────────────── */
  // No intro, no "I'm ARIA" — just get right to the point.
  // If returning visitor: acknowledge the history, pick up where they left off.
  // If brand new: short, warm opener — no self-introduction.
  function getWelcomeMessage() {
    if (isReturningVisitor()) {
      // Find their last user message for context
      var lastUserMsg = '';
      for (var i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') { lastUserMsg = messages[i].content; break; }
      }
      // Returning visitor — no intro, just continue
      return "Welcome back 👋 — picking up where we left off. What can I help you with?";
    }
    // Brand new visitor — no "I'm ARIA", just a warm, direct opener
    return "Hey! 👋 What brings you to Ospectra today?\n\nFeel free to ask anything — product, pricing, or how it works.";
  }

  /* ── QUICK REPLY CHIPS ───────────────────────────────────── */
  function showQuickReplies() {
    var chips = [
      "What does Ospectra do?",
      "Show me pricing",
      "I want a demo",
      "How does visitor tracking work?"
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
        var qr = el('ospectra-qr-wrapper');
        if (qr) qr.remove();
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
    messages.forEach(function (m) { appendMessage(m.role, m.content, false); });
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

    var qr = el('ospectra-qr-wrapper');
    if (qr) qr.remove();

    appendMessage('user', text);
    messages.push({ role: 'user', content: text });
    saveHistory();

    isTyping = true;
    var sendBtn = el('ospectra-chat-send');
    if (sendBtn) sendBtn.disabled = true;
    showTyping();

    fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages, visitor_id: getVisitorId() })
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
      console.error('[Ospectra Chat] fetch error:', err);
      hideTyping();
      isTyping = false;
      if (sendBtn) sendBtn.disabled = false;
      appendMessage('assistant', "I ran into a quick issue — please try again in a moment.");
    });
  }

  /* ── OPEN / CLOSE ────────────────────────────────────────── */
  function openChat() {
    isOpen = true;
    el('ospectra-chat-window').classList.add('open');
    el('ospectra-chat-bubble').style.animation = 'none';
    var dot = el('ospectra-chat-bubble').querySelector('.notif-dot');
    if (dot) dot.remove();
    setTimeout(function () { el('ospectra-chat-input').focus(); }, 280);
  }

  function closeChat() {
    isOpen = false;
    el('ospectra-chat-window').classList.remove('open');
  }

  function toggleChat() {
    if (isOpen) closeChat(); else openChat();
  }

  /* ── SVG ICONS ───────────────────────────────────────────── */

  // Cloud-spark bubble icon (replaces generic chat bubble)
  var BUBBLE_ICON =
    '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      // Cloud base shape
      '<path d="M24 14.5C24 10.358 20.642 7 16.5 7C13.032 7 10.103 9.202 9.107 12.3C8.739 12.215 8.356 12.17 7.962 12.17C5.225 12.17 3 14.395 3 17.132C3 19.869 5.225 22.094 7.962 22.094H24.056C26.237 22.094 28 20.332 28 18.15C28 16.068 26.393 14.362 24.339 14.217C24.113 14.313 24 14.5 24 14.5Z" fill="white" opacity="0.95"/>' +
      // Spark / lightning bolt
      '<path d="M17.5 14L14.5 19H16.5L15.5 23L20 17H17.5L18.5 14H17.5Z" fill="#8B7FF0"/>' +
    '</svg>';

  // Ospectra "O" logo mark for header (geometric, no robot)
  var HEADER_LOGO =
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      // Outer circle
      '<circle cx="12" cy="12" r="9" stroke="white" stroke-width="1.8" opacity="0.9"/>' +
      // Inner dot / core
      '<circle cx="12" cy="12" r="3.5" fill="white" opacity="0.9"/>' +
      // Arc accent top-right
      '<path d="M17.5 6.5 A8 8 0 0 1 21 12" stroke="white" stroke-width="1.8" stroke-linecap="round" opacity="0.5"/>' +
    '</svg>';

  /* ── WIDGET HTML INJECTION ───────────────────────────────── */
  function injectWidget() {
    var wrapper = document.createElement('div');
    wrapper.id = 'ospectra-chat-root';

    wrapper.innerHTML =
      // ── Chat window ──────────────────────────────────────
      '<div id="ospectra-chat-window" role="dialog" aria-label="Ospectra AI Chat">' +
        '<div id="ospectra-chat-header">' +
          '<div class="chat-avatar">' + HEADER_LOGO + '</div>' +
          '<div class="chat-info">' +
            '<div class="chat-name">Ospectra AI</div>' +
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
            '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="white"/></svg>' +
          '</button>' +
        '</div>' +
        '<div id="ospectra-chat-footer">Powered by Ospectra AI</div>' +
      '</div>' +

      // ── Bubble button ─────────────────────────────────────
      '<button id="ospectra-chat-bubble" aria-label="Open chat">' +
        '<span class="notif-dot"></span>' +
        BUBBLE_ICON +
      '</button>';

    document.body.appendChild(wrapper);

    /* ── Event listeners ── */
    el('ospectra-chat-bubble').addEventListener('click', toggleChat);
    el('ospectra-chat-close').addEventListener('click', closeChat);
    el('ospectra-chat-send').addEventListener('click', function () { handleSend(); });

    el('ospectra-chat-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });

    el('ospectra-chat-input').addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 84) + 'px';
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) closeChat();
    });

    /* ── Init: load history or show welcome ── */
    var hadHistory = loadHistory();

    if (!hadHistory) {
      // Brand new visitor
      var welcomeMsg = getWelcomeMessage();
      messages.push({ role: 'assistant', content: welcomeMsg });
      saveHistory();
      renderHistory();
      showQuickReplies(); // chips only for new visitors
    } else {
      // Returning visitor: render existing conversation + a short "welcome back" if not already there
      var lastMsg = messages[messages.length - 1];
      var alreadyWelcomed = lastMsg && lastMsg.role === 'assistant' && lastMsg.content.indexOf('Welcome back') !== -1;

      if (!alreadyWelcomed) {
        var returnMsg = { role: 'assistant', content: getWelcomeMessage() };
        messages.push(returnMsg);
        saveHistory();
      }
      renderHistory();
      // No quick reply chips for returning visitors — they know what they want
    }
  }

  /* ── INIT ────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWidget);
  } else {
    injectWidget();
  }

})();