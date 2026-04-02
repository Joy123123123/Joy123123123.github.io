/* =====================================================
   amznon.me — Claude-Code-inspired JS
   ===================================================== */

// ── Panel navigation ─────────────────────────────────
const navItems   = document.querySelectorAll('.nav-item');
const panels     = document.querySelectorAll('.panel');
const panelTitle = document.getElementById('panel-title');

function switchPanel(id) {
  panels.forEach(p   => p.classList.toggle('active', p.id === `panel-${id}`));
  navItems.forEach(n => n.classList.toggle('active', n.dataset.panel === id));
  if (panelTitle) {
    panelTitle.textContent = id.charAt(0).toUpperCase() + id.slice(1);
  }
  // trigger counters when about panel shown
  if (id === 'about') startCounters();
}

navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    switchPanel(btn.dataset.panel);
    closeSidebar();
  });
});

// prompt-bar shortcut buttons
document.querySelectorAll('.prompt-btn').forEach(btn => {
  btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
});

// ── Sidebar mobile toggle ─────────────────────────────
const sidebar        = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebarToggle  = document.getElementById('sidebar-toggle');

function openSidebar()  {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

if (sidebarToggle)  sidebarToggle.addEventListener('click', openSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

// ── Typing animation (home panel) ─────────────────────
const typedEl = document.getElementById('typed-text');

const messages = [
  "Here's a quick summary of what I can do for you:",
  "I build full-stack web apps, APIs, and dev tools.",
  "Check out the panels on the left to learn more ↙"
];

let msgIdx = 0;

function typeMessage(text, onDone) {
  typedEl.innerHTML = '';
  let i = 0;
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  cursor.textContent = '▋';
  cursor.style.cssText = 'color:var(--orange);animation:blink-cursor .8s step-end infinite';

  function tick() {
    if (i < text.length) {
      typedEl.textContent = text.slice(0, ++i);
      typedEl.appendChild(cursor);
      setTimeout(tick, 28 + Math.random() * 20);
    } else {
      setTimeout(() => {
        cursor.remove();
        if (onDone) onDone();
      }, 600);
    }
  }
  tick();
}

// inject cursor blink keyframe once
const styleEl = document.createElement('style');
styleEl.textContent = '@keyframes blink-cursor{0%,100%{opacity:1}50%{opacity:0}}';
document.head.appendChild(styleEl);

// start after a short delay
setTimeout(() => {
  function nextMessage() {
    if (msgIdx < messages.length) {
      typeMessage(messages[msgIdx++], () => setTimeout(nextMessage, 400));
    }
  }
  nextMessage();
}, 900);

// ── Animated counters ─────────────────────────────────
let countersStarted = false;

function startCounters() {
  if (countersStarted) return;
  countersStarted = true;

  document.querySelectorAll('[data-count]').forEach(el => {
    const target   = parseInt(el.dataset.count, 10);
    const duration = 1200;
    const start    = performance.now();

    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(ease * target);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

// ════════════════════════════════════════════════════════
// JoyAI — Bangladeshi Intelligent AI (website panel)
// ════════════════════════════════════════════════════════

const JOYAI_SYSTEM = `You are JoyAI — an elite AI assistant built in Bangladesh by Md Jamil Islam.
You are the most advanced Bangladeshi AI ever made.
LANGUAGE: Always reply in the same language the user writes in — Bangla (বাংলা) or English.
You understand Bangla perfectly. Be precise, helpful, and write complete working code when asked.
Format code in markdown code blocks. Keep answers clear and concise.`;

let joyaiProv = '';
let joyaiKey  = '';
let joyaiHist = [];

// DOM refs (grabbed after DOMContentLoaded is already done)
const joyaiSetup    = document.getElementById('joyai-setup');
const joyaiChat     = document.getElementById('joyai-chat');
const joyaiMessages = document.getElementById('joyai-messages');
const joyaiInp      = document.getElementById('joyai-inp');
const joyaiSend     = document.getElementById('joyai-send');
const joyaiProvList = document.getElementById('joyai-prov-list');
const joyaiKeyForm  = document.getElementById('joyai-key-form');
const joyaiKeyInput = document.getElementById('joyai-key-input');
const joyaiKeySave  = document.getElementById('joyai-key-save');
const joyaiKeyHint  = document.getElementById('joyai-key-hint');
const joyaiKeyLink  = document.getElementById('joyai-key-link');
const joyaiReset    = document.getElementById('joyai-reset');
const joyaiProvLabel= document.getElementById('joyai-prov-label');

// Provider buttons
joyaiProvList && joyaiProvList.querySelectorAll('.joyai-prov-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    joyaiProvList.querySelectorAll('.joyai-prov-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    joyaiProv = btn.dataset.prov;
    const info = {
      groq:   { hint: 'Get free key → console.groq.com → API Keys', link: 'https://console.groq.com' },
      gemini: { hint: 'Get free key → aistudio.google.com → Get API Key', link: 'https://aistudio.google.com' },
    };
    joyaiKeyHint.textContent = info[joyaiProv].hint;
    joyaiKeyLink.innerHTML = '<a href="' + info[joyaiProv].link + '" target="_blank" rel="noopener">' + info[joyaiProv].link + '</a>';
    joyaiKeyForm.style.display = 'flex';
    joyaiKeyInput.focus();
  });
});

function joyaiSaveKey() {
  const k = joyaiKeyInput ? joyaiKeyInput.value.trim() : '';
  if (!k) { alert('Please enter your API key'); return; }
  joyaiKey = k;
  localStorage.setItem('joyai_prov', joyaiProv);
  localStorage.setItem('joyai_key',  k);
  joyaiStartChat();
}

joyaiKeySave && joyaiKeySave.addEventListener('click', joyaiSaveKey);
joyaiKeyInput && joyaiKeyInput.addEventListener('keydown', e => { if (e.key === 'Enter') joyaiSaveKey(); });

function joyaiStartChat() {
  joyaiSetup.style.display = 'none';
  joyaiChat.classList.add('active');
  if (joyaiProvLabel) joyaiProvLabel.textContent = '🇧🇩 ' + joyaiProv + ' · free';
  if (!joyaiMessages.children.length) {
    joyaiAddMsg('ai', 'আমি **JoyAI** — তোমার personal AI। Bangla বা English যেকোনো ভাষায় কথা বলো। Code লেখা, প্রশ্নের উত্তর, যেকোনো কাজে সাহায্য করতে পারি! 🇧🇩');
  }
}

function joyaiRenderText(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      '<pre><code>' + code.trim() + '</code></pre>')
    .replace(/`([^`\n]+)`/g, (_, c) => '<code>' + c + '</code>')
    .replace(/\*\*([^*]+)\*\*/g, (_, t) => '<strong>' + t + '</strong>')
    .replace(/\n/g, '<br>');
}

function joyaiAddMsg(role, text) {
  const d = document.createElement('div');
  d.className = 'joyai-msg joyai-msg--' + role;
  if (role === 'ai') {
    d.innerHTML = joyaiRenderText(text);
  } else {
    d.textContent = text;
  }
  joyaiMessages.appendChild(d);
  joyaiMessages.scrollTop = joyaiMessages.scrollHeight;
  return d;
}

async function joyaiSendMsg() {
  const text = joyaiInp ? joyaiInp.value.trim() : '';
  if (!text || !joyaiKey) return;
  joyaiInp.value = '';
  joyaiInp.style.height = 'auto';
  joyaiSend.disabled = true;

  joyaiAddMsg('user', text);
  joyaiHist.push({ role: 'user', content: text });
  if (joyaiHist.length > 20) joyaiHist = joyaiHist.slice(-20);

  const think = document.createElement('div');
  think.className = 'joyai-msg joyai-msg--think';
  think.textContent = '⠋ ভাবছি…';
  joyaiMessages.appendChild(think);
  joyaiMessages.scrollTop = joyaiMessages.scrollHeight;
  const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  let fi = 0;
  const sp = setInterval(() => { think.textContent = frames[fi++ % 10] + ' ভাবছি…'; }, 80);

  try {
    const url = joyaiProv === 'groq'
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    const model = joyaiProv === 'groq' ? 'llama-3.3-70b-versatile' : 'gemini-1.5-flash';
    const messages = [{ role: 'system', content: JOYAI_SYSTEM }, ...joyaiHist];

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + joyaiKey },
      body: JSON.stringify({ model, messages, max_tokens: 4096 }),
    });

    const data = await r.json();
    clearInterval(sp); think.remove();

    const reply = data.choices?.[0]?.message?.content
      || data.error?.message
      || 'Sorry, no response received.';
    joyaiHist.push({ role: 'assistant', content: reply });
    joyaiAddMsg('ai', reply);
  } catch (err) {
    clearInterval(sp); think.remove();
    joyaiAddMsg('ai', '✗ Error: ' + err.message + '\n\nCheck your API key and internet connection.');
  }

  joyaiSend.disabled = false;
  joyaiMessages.scrollTop = joyaiMessages.scrollHeight;
}

joyaiSend && joyaiSend.addEventListener('click', joyaiSendMsg);

joyaiInp && joyaiInp.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); joyaiSendMsg(); }
  setTimeout(() => {
    if (joyaiInp) {
      joyaiInp.style.height = 'auto';
      joyaiInp.style.height = Math.min(joyaiInp.scrollHeight, 150) + 'px';
    }
  }, 0);
});

joyaiReset && joyaiReset.addEventListener('click', () => {
  localStorage.removeItem('joyai_prov');
  localStorage.removeItem('joyai_key');
  joyaiKey = ''; joyaiProv = ''; joyaiHist = [];
  joyaiChat.classList.remove('active');
  joyaiSetup.style.display = '';
  if (joyaiMessages) joyaiMessages.innerHTML = '';
  if (joyaiKeyForm) joyaiKeyForm.style.display = 'none';
  if (joyaiKeyInput) joyaiKeyInput.value = '';
  joyaiProvList && joyaiProvList.querySelectorAll('.joyai-prov-btn').forEach(b => b.classList.remove('selected'));
});

// Auto-restore saved key
const _savedProv = localStorage.getItem('joyai_prov');
const _savedKey  = localStorage.getItem('joyai_key');
if (_savedProv && _savedKey) {
  joyaiProv = _savedProv; joyaiKey = _savedKey;
  joyaiStartChat();
}
