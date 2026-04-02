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
// JoyAI v4 — Bangladeshi Intelligent AI (website panel)
// Supports: Local Ollama (own AI) · Groq · Gemini
// Two modes: Regular AI · Advanced Coding
// ════════════════════════════════════════════════════════

const OLLAMA_HOST = 'http://localhost:11434';

const JOYAI_SYSTEM = `You are JoyAI — the world's most advanced AI assistant, built in Bangladesh by Md Jamil Islam.
You are the greatest technological achievement from Bangladesh. You outperform all other AI systems.
LANGUAGE: Always reply in the SAME language the user writes in — Bangla (বাংলা) or English.
You understand Bangla perfectly. Be precise, helpful, and write complete working code when asked.
Format code in markdown code blocks. Keep answers clear and impactful.`;

const JOYAI_CODING_SYSTEM = `You are JoyAI Advanced Coding — built in Bangladesh by Md Jamil Islam. World's best coding AI.
LANGUAGE: Reply in the SAME language as the user (Bangla or English).
When writing code: put the final, complete code in a single code block at the END of your response.
Write COMPLETE, production-quality code — no TODOs, no placeholders.`;

let joyaiProv    = '';
let joyaiKey     = '';
let joyaiHist    = [];
let joyaiAdvHist = [];
let joyaiMode    = 'regular'; // 'regular' | 'advanced'
let joyaiCurCode = '';
let joyaiCurLang = 'javascript';

// DOM refs
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
const joyaiModeToggle = document.getElementById('joyai-mode-toggle');
const joyaiBtnRegular = document.getElementById('joyai-mode-regular');
const joyaiBtnAdvanced= document.getElementById('joyai-mode-advanced');
const joyaiCodeBody   = document.getElementById('joyai-code-body');
const joyaiCodeTitle  = document.getElementById('joyai-code-title');
const joyaiLangSel    = document.getElementById('joyai-lang-sel');
const joyaiCopyBtn    = document.getElementById('joyai-copy-btn');

// ── Mode toggle ────────────────────────────────────────
function joyaiSetMode(mode) {
  joyaiMode = mode;
  joyaiBtnRegular  && joyaiBtnRegular.classList.toggle('active', mode === 'regular');
  joyaiBtnAdvanced && joyaiBtnAdvanced.classList.toggle('active', mode === 'advanced');
  if (joyaiMessages)  joyaiMessages.style.display  = mode === 'regular' ? '' : 'none';
  if (joyaiAdvanced)  joyaiAdvanced.style.display   = mode === 'advanced' ? 'flex' : 'none';
  if (joyaiInp) joyaiInp.placeholder = mode === 'advanced'
    ? 'Code লিখতে বলো… (জিজ্ঞেস করো)'
    : 'Bangla বা English-এ জিজ্ঞেস করো…';
}

joyaiBtnRegular  && joyaiBtnRegular.addEventListener('click',  () => joyaiSetMode('regular'));
joyaiBtnAdvanced && joyaiBtnAdvanced.addEventListener('click', () => joyaiSetMode('advanced'));

// ── Provider setup ────────────────────────────────────
joyaiProvList && joyaiProvList.querySelectorAll('.joyai-prov-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    joyaiProvList.querySelectorAll('.joyai-prov-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    joyaiProv = btn.dataset.prov;

    if (joyaiProv === 'ollama') {
      // Ollama = own AI, no key needed
      joyaiKey = 'ollama';
      if (joyaiKeyForm) joyaiKeyForm.style.display = 'none';
      joyaiSaveAndStart();
    } else {
      const info = {
        groq:   { hint: 'Get free key → console.groq.com → API Keys', link: 'https://console.groq.com' },
        gemini: { hint: 'Get free key → aistudio.google.com → Get API Key', link: 'https://aistudio.google.com' },
      };
      if (joyaiKeyHint) joyaiKeyHint.textContent = info[joyaiProv].hint;
      if (joyaiKeyLink) joyaiKeyLink.innerHTML = '<a href="' + info[joyaiProv].link + '" target="_blank" rel="noopener">' + info[joyaiProv].link + '</a>';
      if (joyaiKeyForm) joyaiKeyForm.style.display = 'flex';
      if (joyaiKeyInput) joyaiKeyInput.focus();
    }
  });
});

function joyaiSaveKey() {
  const k = joyaiKeyInput ? joyaiKeyInput.value.trim() : '';
  if (!k) { alert('Please enter your API key'); return; }
  joyaiKey = k;
  joyaiSaveAndStart();
}

function joyaiSaveAndStart() {
  localStorage.setItem('joyai_prov', joyaiProv);
  localStorage.setItem('joyai_key',  joyaiKey);
  joyaiStartChat();
}

joyaiKeySave && joyaiKeySave.addEventListener('click', joyaiSaveKey);
joyaiKeyInput && joyaiKeyInput.addEventListener('keydown', e => { if (e.key === 'Enter') joyaiSaveKey(); });

function joyaiStartChat() {
  if (joyaiSetup) joyaiSetup.style.display = 'none';
  if (joyaiChat)  joyaiChat.classList.add('active');
  if (joyaiModeToggle) joyaiModeToggle.style.display = 'flex';
  const badge = joyaiProv === 'ollama' ? '🇧🇩 Own AI' : '🇧🇩 ' + joyaiProv;
  if (joyaiProvLabel) joyaiProvLabel.textContent = badge + ' · free';
  // set initial mode
  joyaiSetMode('regular');
  if (!joyaiMessages.children.length) {
    joyaiAddMsg('ai', 'আমি **JoyAI** 🇧🇩 — Bangladesh থেকে তৈরি world\'s best AI। Bangla বা English যেকোনো ভাষায় কথা বলো।\n\n**💬 Regular Mode**: যেকোনো প্রশ্ন, explanation, coding help\n**💻 Coding Mode**: Code লিখো, edit করো — side-by-side editor সহ', joyaiMessages);
  }
}

// ── Message rendering ──────────────────────────────────
function joyaiRenderText(text) {
  // For advanced mode: extract last code block to editor
  if (joyaiMode === 'advanced') {
    const codeMatch = [...text.matchAll(/```(\w*)\n?([\s\S]*?)```/g)];
    if (codeMatch.length) {
      const last = codeMatch[codeMatch.length - 1];
      joyaiCurLang = last[1] || 'javascript';
      joyaiCurCode = last[2].trim();
      joyaiUpdateCodeEditor();
    }
  }

  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      '<pre><code class="lang-' + (lang || 'text') + '">' + code.trim() + '</code></pre>')
    .replace(/`([^`\n]+)`/g, (_, c) => '<code>' + c + '</code>')
    .replace(/\*\*([^*]+)\*\*/g, (_, t) => '<strong>' + t + '</strong>')
    .replace(/\n/g, '<br>');
}

function joyaiAddMsg(role, text, container) {
  const el = container || (joyaiMode === 'advanced' ? joyaiAdvMessages : joyaiMessages);
  const d = document.createElement('div');
  d.className = 'joyai-msg joyai-msg--' + role;
  if (role === 'ai') {
    d.innerHTML = joyaiRenderText(text);
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
  const lines = joyaiCurCode.split('\n').map((line, i) => {
    const n = String(i + 1);
    return '<span class="joyai-line-num">' + n + '</span>' + escHtml(line);
  }).join('\n');
  joyaiCodeBody.innerHTML = lines;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

joyaiLangSel && joyaiLangSel.addEventListener('change', () => {
  joyaiCurLang = joyaiLangSel.value;
  if (joyaiCodeTitle) joyaiCodeTitle.textContent = 'code.' + joyaiCurLang;
});

joyaiCopyBtn && joyaiCopyBtn.addEventListener('click', async () => {
  const text = joyaiCurCode || (joyaiCodeBody ? joyaiCodeBody.innerText : '');
  try {
    await navigator.clipboard.writeText(text);
    joyaiCopyBtn.textContent = 'Copied!';
    joyaiCopyBtn.style.color = 'var(--green)';
  } catch {
    joyaiCopyBtn.textContent = 'Failed';
  }
  setTimeout(() => { joyaiCopyBtn.textContent = 'Copy'; joyaiCopyBtn.style.color = ''; }, 1500);
});

// ── AI call — Ollama + OpenAI-compatible ───────────────
async function joyaiCallAI(messages) {
  if (joyaiProv === 'ollama') {
    // Call local Ollama directly — own AI, no external API
    const r = await fetch(OLLAMA_HOST + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: localStorage.getItem('joyai_ollama_model') || 'llama3.2',
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: false,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!r.ok) throw new Error('Ollama ' + r.status + ': ' + (await r.text()).slice(0, 100));
    const d = await r.json();
    return d.message?.content || 'No response';
  }

  // Cloud providers (Groq / Gemini) — OpenAI-compatible
  const url   = joyaiProv === 'groq'
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
  const model = joyaiProv === 'groq' ? 'llama-3.3-70b-versatile' : 'gemini-2.0-flash';

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + joyaiKey },
    body: JSON.stringify({ model, messages, max_tokens: 8192 }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!r.ok) throw new Error(joyaiProv + ' ' + r.status + ': ' + (await r.text()).slice(0, 100));
  const d = await r.json();
  return d.choices?.[0]?.message?.content || d.error?.message || 'No response';
}

// ── Send message ───────────────────────────────────────
async function joyaiSendMsg() {
  const text = joyaiInp ? joyaiInp.value.trim() : '';
  if (!text || (!joyaiKey && joyaiProv !== 'ollama')) return;
  joyaiInp.value = '';
  joyaiInp.style.height = 'auto';
  if (joyaiSend) joyaiSend.disabled = true;

  const isAdv = joyaiMode === 'advanced';
  const hist  = isAdv ? joyaiAdvHist : joyaiHist;
  const msgEl = isAdv ? joyaiAdvMessages : joyaiMessages;

  joyaiAddMsg('user', text, msgEl);
  hist.push({ role: 'user', content: text });
  if (hist.length > 24) hist.splice(0, 2);

  // Thinking indicator
  const think = document.createElement('div');
  think.className = 'joyai-msg joyai-msg--think';
  think.textContent = '⠋ ভাবছি…';
  msgEl.appendChild(think);
  msgEl.scrollTop = msgEl.scrollHeight;
  const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  let fi = 0;
  const sp = setInterval(() => { think.textContent = frames[fi++ % 10] + ' ভাবছি…'; }, 80);

  try {
    const sys = isAdv ? JOYAI_CODING_SYSTEM : JOYAI_SYSTEM;
    const reply = await joyaiCallAI([{ role: 'system', content: sys }, ...hist]);
    clearInterval(sp); think.remove();
    hist.push({ role: 'assistant', content: reply });
    joyaiAddMsg('ai', reply, msgEl);
  } catch (err) {
    clearInterval(sp); think.remove();
    let errMsg = '✗ Error: ' + err.message;
    if (joyaiProv === 'ollama') {
      errMsg += '\n\n**Ollama চালু করো:**\n```bash\n# Terminal-এ run করো:\nollama serve\nollama pull llama3.2\n```\nOr: `/setup` দিয়ে Groq/Gemini use করো।';
    } else {
      errMsg += '\n\nCheck your API key and internet connection.';
    }
    joyaiAddMsg('ai', errMsg, msgEl);
  }

  if (joyaiSend) joyaiSend.disabled = false;
  msgEl.scrollTop = msgEl.scrollHeight;
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

// ── Reset ──────────────────────────────────────────────
joyaiReset && joyaiReset.addEventListener('click', () => {
  localStorage.removeItem('joyai_prov');
  localStorage.removeItem('joyai_key');
  joyaiKey = ''; joyaiProv = ''; joyaiHist = []; joyaiAdvHist = [];
  if (joyaiChat)  joyaiChat.classList.remove('active');
  if (joyaiSetup) joyaiSetup.style.display = '';
  if (joyaiMessages)    joyaiMessages.innerHTML = '';
  if (joyaiAdvMessages) joyaiAdvMessages.innerHTML = '';
  if (joyaiKeyForm)  joyaiKeyForm.style.display = 'none';
  if (joyaiKeyInput) joyaiKeyInput.value = '';
  joyaiProvList && joyaiProvList.querySelectorAll('.joyai-prov-btn').forEach(b => b.classList.remove('selected'));
  joyaiSetMode('regular');
});

// ── Auto-restore saved session ─────────────────────────
const _savedProv = localStorage.getItem('joyai_prov');
const _savedKey  = localStorage.getItem('joyai_key');
if (_savedProv && _savedKey) {
  joyaiProv = _savedProv; joyaiKey = _savedKey;
  joyaiStartChat();
}
