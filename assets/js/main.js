/* =====================================================
   amznon.me — JoyAI v4 JS
   ===================================================== */

// ── Panel navigation ─────────────────────────────────
const navItems   = document.querySelectorAll('.nav-item');
const panels     = document.querySelectorAll('.panel');
const panelTitle = document.getElementById('panel-title');

function switchPanel(id) {
  panels.forEach(p   => p.classList.toggle('active', p.id === `panel-${id}`));
  navItems.forEach(n => n.classList.toggle('active', n.dataset.panel === id));
  if (panelTitle) {
    panelTitle.textContent = id === 'joyai' ? 'JoyAI 🇧🇩' : id.charAt(0).toUpperCase() + id.slice(1);
  }
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
  "I build full-stack web apps, APIs, and AI tools.",
  "Try JoyAI — Bangladesh's own AI assistant 🇧🇩"
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
      setTimeout(() => { cursor.remove(); if (onDone) onDone(); }, 600);
    }
  }
  tick();
}

const styleEl = document.createElement('style');
styleEl.textContent = '@keyframes blink-cursor{0%,100%{opacity:1}50%{opacity:0}}';
document.head.appendChild(styleEl);

setTimeout(() => {
  function nextMessage() {
    if (msgIdx < messages.length) typeMessage(messages[msgIdx++], () => setTimeout(nextMessage, 400));
  }
  nextMessage();
}, 900);

// ── Animated counters ─────────────────────────────────
let countersStarted = false;
function startCounters() {
  if (countersStarted) return;
  countersStarted = true;
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    const start  = performance.now();
    function step(now) {
      const t = Math.min((now - start) / 1200, 1);
      el.textContent = Math.round((1 - Math.pow(1 - t, 3)) * target);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

// ════════════════════════════════════════════════════════════════════
// JoyAI v4 — Bangladeshi Intelligent AI
//
// Provider hierarchy:
//   1. pollinations  — DEFAULT, zero setup, free, works for ALL users
//   2. groq          — faster, needs free API key
//   3. gemini        — Google, needs free API key
//   4. ollama        — local/power-user, runs on own machine
// ════════════════════════════════════════════════════════════════════

// ── Provider config ────────────────────────────────────
const PROVIDERS = {
  pollinations: {
    name:    'Pollinations AI',
    label:   '🚀 Free · No Setup',
    url:     'https://text.pollinations.ai/openai',
    model:   'openai',       // uses OpenAI-compatible routing
    noKey:   true,
  },
  groq: {
    name:    'Groq',
    label:   '⚡ Groq',
    url:     'https://api.groq.com/openai/v1',
    model:   'llama-3.3-70b-versatile',
    noKey:   false,
    keyHint: 'Get free key → console.groq.com → API Keys',
    keyLink: 'https://console.groq.com',
  },
  gemini: {
    name:    'Gemini',
    label:   '✦ Gemini',
    url:     'https://generativelanguage.googleapis.com/v1beta/openai',
    model:   'gemini-2.0-flash',
    noKey:   false,
    keyHint: 'Get free key → aistudio.google.com → Get API Key',
    keyLink: 'https://aistudio.google.com',
  },
  ollama: {
    name:    'Local Ollama',
    label:   '🏠 Own AI (Ollama)',
    url:     'http://localhost:11434',
    model:   'llama3.2',
    noKey:   true,
  },
};

// ── System prompts ────────────────────────────────────
const SYS_REGULAR = `You are JoyAI — the world's most advanced AI assistant built in Bangladesh by Md Jamil Islam.
You are Bangladesh's greatest technological achievement. You help with everything.
LANGUAGE: Always reply in the SAME language the user writes in — Bangla (বাংলা) or English. You understand Bangla perfectly.
Be precise, helpful, friendly. Format code in markdown code blocks. Keep answers clear and complete.
Contact: joyaiofficialbd@gmail.com | Facebook: fb.com/JoyAI`;

const SYS_CODING = `You are JoyAI Advanced Coding — built in Bangladesh by Md Jamil Islam. World's best coding AI.
LANGUAGE: Reply in the SAME language as the user (Bangla or English).
When writing code: include the COMPLETE, final, production-ready code in a single code block at the END of your reply.
Never use placeholder comments. Write everything. Explain briefly then show the full code.`;

// ── State ─────────────────────────────────────────────
let joyaiProv    = 'pollinations';
let joyaiKey     = '';
let joyaiHist    = [];
let joyaiAdvHist = [];
let joyaiMode    = 'regular';
let joyaiCurCode = '';
let joyaiCurLang = 'javascript';

// ── DOM refs ──────────────────────────────────────────
const joyaiSetup      = document.getElementById('joyai-setup');
const joyaiChat       = document.getElementById('joyai-chat');
const joyaiMessages   = document.getElementById('joyai-messages');
const joyaiAdvMessages= document.getElementById('joyai-adv-messages');
const joyaiAdvanced   = document.getElementById('joyai-advanced');
const joyaiInp        = document.getElementById('joyai-inp');
const joyaiSend       = document.getElementById('joyai-send');
const joyaiProvList   = document.getElementById('joyai-prov-list');
const joyaiKeyForm    = document.getElementById('joyai-key-form');
const joyaiKeyInput   = document.getElementById('joyai-key-input');
const joyaiKeySave    = document.getElementById('joyai-key-save');
const joyaiKeyHint    = document.getElementById('joyai-key-hint');
const joyaiKeyLink    = document.getElementById('joyai-key-link');
const joyaiReset      = document.getElementById('joyai-reset');
const joyaiProvLabel  = document.getElementById('joyai-prov-label');
const joyaiBtnRegular = document.getElementById('joyai-mode-regular');
const joyaiBtnAdvanced= document.getElementById('joyai-mode-advanced');
const joyaiCodeBody   = document.getElementById('joyai-code-body');
const joyaiCodeTitle  = document.getElementById('joyai-code-title');
const joyaiLangSel    = document.getElementById('joyai-lang-sel');
const joyaiCopyBtn    = document.getElementById('joyai-copy-btn');
const joyaiModeToggle = document.getElementById('joyai-mode-toggle');

// ── Mode toggle ────────────────────────────────────────
function joyaiSetMode(mode) {
  joyaiMode = mode;
  joyaiBtnRegular  && joyaiBtnRegular.classList.toggle('active', mode === 'regular');
  joyaiBtnAdvanced && joyaiBtnAdvanced.classList.toggle('active', mode === 'advanced');
  if (joyaiMessages) joyaiMessages.style.display  = mode === 'regular' ? '' : 'none';
  if (joyaiAdvanced) joyaiAdvanced.style.display   = mode === 'advanced' ? 'flex' : 'none';
  if (joyaiInp) joyaiInp.placeholder = mode === 'advanced'
    ? 'Code লিখতে বলো… (e.g. "একটা calculator app বানাও")'
    : 'JoyAI কে জিজ্ঞেস করো… (Bangla বা English)';
}

joyaiBtnRegular  && joyaiBtnRegular.addEventListener('click',  () => joyaiSetMode('regular'));
joyaiBtnAdvanced && joyaiBtnAdvanced.addEventListener('click', () => joyaiSetMode('advanced'));

// ── Start chat (auto or after selection) ───────────────
function joyaiStartChat(isAutoStart) {
  if (joyaiSetup) joyaiSetup.style.display = 'none';
  if (joyaiChat)  joyaiChat.classList.add('active');
  const cfg = PROVIDERS[joyaiProv] || PROVIDERS.pollinations;
  if (joyaiProvLabel) joyaiProvLabel.textContent = cfg.label + (joyaiProv === 'pollinations' ? ' · 🇧🇩 Free' : ' · free');
  joyaiSetMode('regular');
  if (!joyaiMessages.children.length) {
    const greeting = isAutoStart
      ? 'আমি **JoyAI** 🇧🇩 — Bangladesh থেকে তৈরি। Bangla বা English যেকোনো ভাষায় কথা বলো!\n\n**💬 Regular**: যেকোনো প্রশ্ন, explanation, coding help\n**💻 Coding**: Code লিখো, edit করো — side-by-side editor সহ\n\nআমি সম্পূর্ণ বিনামূল্যে চলছি — কোনো setup লাগেনি। 🚀'
      : 'আমি **JoyAI** 🇧🇩 — Bangladesh থেকে তৈরি world\'s best AI। Bangla বা English যেকোনো ভাষায় কথা বলো।\n\n**💬 Regular Mode**: যেকোনো প্রশ্ন, explanation, coding help\n**💻 Coding Mode**: Code লিখো — side-by-side editor সহ';
    joyaiAddMsg('ai', greeting, joyaiMessages);
  }
}

// ── Provider selection buttons ──────────────────────────
joyaiProvList && joyaiProvList.querySelectorAll('.joyai-prov-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    joyaiProvList.querySelectorAll('.joyai-prov-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    joyaiProv = btn.dataset.prov;
    const cfg = PROVIDERS[joyaiProv];

    if (cfg.noKey) {
      // Pollinations or Ollama — no key needed
      joyaiKey = joyaiProv === 'ollama' ? 'ollama' : 'free';
      if (joyaiKeyForm) joyaiKeyForm.style.display = 'none';
      joyaiSaveAndStart();
    } else {
      if (joyaiKeyHint) joyaiKeyHint.textContent = cfg.keyHint;
      if (joyaiKeyLink) joyaiKeyLink.innerHTML = '<a href="' + cfg.keyLink + '" target="_blank" rel="noopener">' + cfg.keyLink + '</a>';
      if (joyaiKeyForm) joyaiKeyForm.style.display = 'flex';
      if (joyaiKeyInput) joyaiKeyInput.focus();
    }
  });
});

function joyaiSaveKey() {
  const k = joyaiKeyInput ? joyaiKeyInput.value.trim() : '';
  if (!k) { alert('API key দাও'); return; }
  joyaiKey = k;
  joyaiSaveAndStart();
}

function joyaiSaveAndStart() {
  localStorage.setItem('joyai_prov', joyaiProv);
  localStorage.setItem('joyai_key',  joyaiKey);
  joyaiStartChat(false);
}

joyaiKeySave  && joyaiKeySave.addEventListener('click', joyaiSaveKey);
joyaiKeyInput && joyaiKeyInput.addEventListener('keydown', e => { if (e.key === 'Enter') joyaiSaveKey(); });

// ── Rendering ──────────────────────────────────────────
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function joyaiRenderText(text, isAdvanced) {
  // In advanced mode: capture last code block for editor
  if (isAdvanced) {
    const all = [...text.matchAll(/```(\w*)\n?([\s\S]*?)```/g)];
    if (all.length) {
      const last = all[all.length - 1];
      joyaiCurLang = last[1] || 'javascript';
      joyaiCurCode = last[2].trim();
      // Update editor asynchronously so the message renders first
      setTimeout(joyaiUpdateCodeEditor, 0);
    }
  }

  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      '<pre><code>' + code.trim() + '</code></pre>')
    .replace(/`([^`\n]+)`/g, (_, c) => '<code>' + c + '</code>')
    .replace(/\*\*([^*]+)\*\*/g, (_, t) => '<strong>' + t + '</strong>')
    .replace(/\n/g, '<br>');
}

function joyaiAddMsg(role, text, container) {
  // container must be explicitly passed; default only as last resort
  const el = container || joyaiMessages;
  const d  = document.createElement('div');
  d.className = 'joyai-msg joyai-msg--' + role;
  if (role === 'ai') {
    d.innerHTML = joyaiRenderText(text, joyaiMode === 'advanced');
  } else {
    d.textContent = text;
  }
  el.appendChild(d);
  el.scrollTop = el.scrollHeight;
  return d;
}

// ── Code editor ────────────────────────────────────────
function joyaiUpdateCodeEditor() {
  if (!joyaiCodeBody) return;
  if (joyaiLangSel) joyaiLangSel.value = joyaiCurLang || 'javascript';
  if (joyaiCodeTitle) joyaiCodeTitle.textContent = 'code.' + (joyaiCurLang || 'txt');
  const lines = joyaiCurCode.split('\n').map((line, i) =>
    '<span class="joyai-line-num">' + (i + 1) + '</span>' + escHtml(line)
  ).join('\n');
  joyaiCodeBody.innerHTML = lines;
}

joyaiLangSel && joyaiLangSel.addEventListener('change', () => {
  joyaiCurLang = joyaiLangSel.value;
  if (joyaiCodeTitle) joyaiCodeTitle.textContent = 'code.' + joyaiCurLang;
});

joyaiCopyBtn && joyaiCopyBtn.addEventListener('click', async () => {
  const text = joyaiCurCode || (joyaiCodeBody ? joyaiCodeBody.innerText.replace(/^\d+\s*/gm, '') : '');
  try {
    await navigator.clipboard.writeText(text);
    joyaiCopyBtn.textContent = 'Copied!';
    joyaiCopyBtn.style.color = 'var(--green)';
  } catch {
    // Fallback: select the text
    const r = document.createRange();
    r.selectNodeContents(joyaiCodeBody);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(r);
    document.execCommand('copy');
    joyaiCopyBtn.textContent = 'Copied!';
    joyaiCopyBtn.style.color = 'var(--green)';
  }
  setTimeout(() => { joyaiCopyBtn.textContent = 'Copy'; joyaiCopyBtn.style.color = ''; }, 1500);
});

// ── AI call ────────────────────────────────────────────
async function joyaiCallAI(msgs) {
  const cfg = PROVIDERS[joyaiProv] || PROVIDERS.pollinations;

  // Ollama — native API call
  if (joyaiProv === 'ollama') {
    const r = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: localStorage.getItem('joyai_ollama_model') || 'llama3.2',
        messages: msgs.map(m => ({ role: m.role, content: m.content })),
        stream: false,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!r.ok) throw new Error('Ollama error ' + r.status + ': ' + (await r.text()).slice(0, 100));
    const d = await r.json();
    return d.message?.content || 'No response';
  }

  // Pollinations / Groq / Gemini — OpenAI-compatible
  const url = joyaiProv === 'groq'
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : joyaiProv === 'gemini'
    ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
    : 'https://text.pollinations.ai/openai';

  const headers = { 'Content-Type': 'application/json' };
  // Pollinations: no key needed; Groq/Gemini: use stored key
  if (joyaiProv !== 'pollinations') {
    headers['Authorization'] = 'Bearer ' + joyaiKey;
  }

  const r = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model:      cfg.model,
      messages:   msgs,
      max_tokens: 8192,
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!r.ok) throw new Error(cfg.name + ' error ' + r.status + ': ' + (await r.text()).slice(0, 120));
  const d = await r.json();
  return d.choices?.[0]?.message?.content || d.error?.message || 'No response';
}

// ── Send message ───────────────────────────────────────
async function joyaiSendMsg() {
  const text = joyaiInp ? joyaiInp.value.trim() : '';
  if (!text) return;
  joyaiInp.value = '';
  joyaiInp.style.height = 'auto';
  if (joyaiSend) joyaiSend.disabled = true;

  const isAdv  = joyaiMode === 'advanced';
  const hist   = isAdv ? joyaiAdvHist : joyaiHist;
  const msgCon = isAdv ? joyaiAdvMessages : joyaiMessages;

  joyaiAddMsg('user', text, msgCon);
  hist.push({ role: 'user', content: text });
  if (hist.length > 24) hist.splice(0, 2);  // keep last 24 messages

  // Thinking indicator
  const think = document.createElement('div');
  think.className = 'joyai-msg joyai-msg--think';
  think.textContent = '⠋ ভাবছি…';
  msgCon.appendChild(think);
  msgCon.scrollTop = msgCon.scrollHeight;
  const fr = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  let fi = 0;
  const sp = setInterval(() => { think.textContent = fr[fi++ % 10] + ' ভাবছি…'; }, 80);

  try {
    const sys = isAdv ? SYS_CODING : SYS_REGULAR;
    const reply = await joyaiCallAI([{ role: 'system', content: sys }, ...hist]);
    clearInterval(sp); think.remove();
    hist.push({ role: 'assistant', content: reply });
    joyaiAddMsg('ai', reply, msgCon);
  } catch (err) {
    clearInterval(sp); think.remove();
    let errMsg = '✗ ' + err.message;
    if (joyaiProv === 'ollama') {
      errMsg += '\n\n**Ollama চালু করো:** Terminal-এ:\n```\nollama serve\nollama pull llama3.2\n```\nঅথবা ⚙ দিয়ে "Instant Free" বেছে নাও।';
    } else if (joyaiProv === 'pollinations') {
      errMsg += '\n\nInternet connection check করো। ব্যর্থ হলে ⚙ দিয়ে অন্য provider বেছে নাও।';
    } else {
      errMsg += '\n\nAPI key সঠিক কিনা check করো অথবা ⚙ দিয়ে provider বদলাও।';
    }
    joyaiAddMsg('ai', errMsg, msgCon);
  }

  if (joyaiSend) joyaiSend.disabled = false;
  msgCon.scrollTop = msgCon.scrollHeight;
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

// ── Reset / Change AI ─────────────────────────────────
joyaiReset && joyaiReset.addEventListener('click', () => {
  // Don't clear history — just show provider selection
  if (joyaiChat)  joyaiChat.classList.remove('active');
  if (joyaiSetup) joyaiSetup.style.display = '';
  if (joyaiKeyForm)  joyaiKeyForm.style.display = 'none';
  if (joyaiKeyInput) joyaiKeyInput.value = '';
  joyaiProvList && joyaiProvList.querySelectorAll('.joyai-prov-btn').forEach(b => b.classList.remove('selected'));
});

// ── Auto-start with Pollinations (no setup needed) ─────
(function joyaiInit() {
  const savedProv = localStorage.getItem('joyai_prov');
  const savedKey  = localStorage.getItem('joyai_key');

  if (savedProv && savedKey) {
    // Restore saved session
    joyaiProv = savedProv;
    joyaiKey  = savedKey;
    joyaiStartChat(savedProv === 'pollinations');
  } else {
    // First visit — auto-start with Pollinations (zero setup)
    joyaiProv = 'pollinations';
    joyaiKey  = 'free';
    localStorage.setItem('joyai_prov', 'pollinations');
    localStorage.setItem('joyai_key',  'free');
    joyaiStartChat(true);
  }
})();
