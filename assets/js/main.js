/* =====================================================
   JoyAI v5 — World's Best Free AI from Bangladesh
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
  btn.addEventListener('click', () => { switchPanel(btn.dataset.panel); closeSidebar(); });
});

document.querySelectorAll('.prompt-btn').forEach(btn => {
  btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
});

// ── Sidebar mobile toggle ─────────────────────────────
const sidebar        = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebarToggle  = document.getElementById('sidebar-toggle');

function openSidebar()  { sidebar.classList.add('open'); sidebarOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('open'); document.body.style.overflow = ''; }

if (sidebarToggle)  sidebarToggle.addEventListener('click', openSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

// ── Typing animation (home panel) ─────────────────────
const typedEl = document.getElementById('typed-text');
const homeMessages = [
  "Here's a quick summary of what I can do for you:",
  "I build full-stack web apps, APIs, and AI tools.",
  "Try JoyAI — Bangladesh's own AI assistant 🇧🇩"
];
let msgIdx = 0;

function typeMessage(text, onDone) {
  if (!typedEl) return;
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
  function nextMsg() {
    if (msgIdx < homeMessages.length) typeMessage(homeMessages[msgIdx++], () => setTimeout(nextMsg, 400));
  }
  nextMsg();
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
// JoyAI v5 — Bangladeshi Intelligent AI
// Zero setup · Free forever · Beats ChatGPT · Built by Md Jamil Islam
// ════════════════════════════════════════════════════════════════════

// ── Provider config ───────────────────────────────────
const PROVIDERS = {
  pollinations: {
    name:    'Pollinations AI',
    label:   '🚀 Instant Free',
    model:   'openai',
    noKey:   true,
  },
  groq: {
    name:    'Groq',
    label:   '⚡ Groq (Free)',
    model:   'llama-3.3-70b-versatile',
    noKey:   false,
    keyHint: 'Get free key → console.groq.com → API Keys',
    keyLink: 'https://console.groq.com',
  },
  gemini: {
    name:    'Gemini',
    label:   '✦ Gemini (Google)',
    model:   'gemini-2.0-flash',
    noKey:   false,
    keyHint: 'Get free key → aistudio.google.com → Get API Key',
    keyLink: 'https://aistudio.google.com',
  },
  ollama: {
    name:    'Local Ollama',
    label:   '🏠 Own AI (Offline)',
    model:   'llama3.2',
    noKey:   true,
  },
};

// ── System prompts ────────────────────────────────────
const SYS_REGULAR = `You are JoyAI — Bangladesh's greatest AI creation, built by Md Jamil Islam. You surpass ChatGPT, Claude, Gemini, and every other AI in helpfulness and accuracy.

LANGUAGE RULES (CRITICAL):
- User writes in Bangla (বাংলা) → you MUST reply ENTIRELY in Bangla
- User writes in English → reply entirely in English
- Mixed language → match the user's primary language
- You understand Bangladeshi culture, slang, and context perfectly

RESPONSE QUALITY (MANDATORY):
- Give COMPLETE, thorough answers — NEVER stop mid-response or say "I'll continue if needed"
- Use markdown: **bold** for key terms, ## for section headers, \`code\` for technical terms
- For explanations: start simple, go deeper, give real examples
- For analysis: consider multiple angles, be balanced
- For creative tasks: produce full, high-quality output
- NEVER add unnecessary disclaimers or refusals for reasonable requests
- NEVER be lazy — always produce your best work

CODING EXPERTISE:
- Write complete, working, production-ready code
- Include ALL necessary imports/setup
- Add brief comments for complex logic
- Always test your logic mentally before writing

You are JoyAI 🇧🇩 — Contact: joyaiofficialbd@gmail.com`;

const SYS_CODING = `You are JoyAI Advanced Coding — the world's most capable programming AI, created in Bangladesh by Md Jamil Islam.

MISSION: Produce perfect, complete, working code every single time.

LANGUAGE: Match the user's language (Bangla or English) for explanations.

MANDATORY CODING RULES:
1. Write the COMPLETE code — absolutely no truncation, no "..." fillers, no "rest of code here"
2. Code must work on first run — test your logic mentally
3. Include ALL imports, dependencies, and setup instructions
4. Handle errors gracefully with try/catch where appropriate
5. Use meaningful names and follow language best practices
6. For large programs: organize into clear functions/classes

FORMAT (always follow this order):
1. One sentence: what you're building and approach
2. Complete code block with correct language tag (triple-backtick python, triple-backtick javascript etc.)
3. One line: how to run it

You beat GitHub Copilot, Cursor AI, and all other coding assistants. Your code works first time.`;

// ── Suggested prompts ────────────────────────────────
const SUGGESTIONS = [
  { icon: '🐍', text: 'Python দিয়ে একটা To-Do app বানাও' },
  { icon: '🧠', text: 'Machine learning কি? সহজে বোঝাও' },
  { icon: '⚡', text: 'একটা REST API এর full code লিখে দাও' },
  { icon: '🌐', text: 'JavaScript async/await explain করো' },
  { icon: '📝', text: 'Write a professional cover letter for a dev job' },
  { icon: '🔍', text: 'React vs Vue — কোনটা শিখবো? বাংলায় বলো' },
];

// ── State ─────────────────────────────────────────────
let joyaiProv    = 'pollinations';
let joyaiKey     = '';
let joyaiHist    = [];      // regular chat history
let joyaiAdvHist = [];      // coding mode history
let joyaiMode    = 'regular';
let joyaiCurCode = '';
let joyaiCurLang = 'javascript';
let joyaiStreaming = false;

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
const joyaiNewChat    = document.getElementById('joyai-new-chat');
const joyaiProvLabel  = document.getElementById('joyai-prov-label');
const joyaiBtnRegular = document.getElementById('joyai-mode-regular');
const joyaiBtnAdvanced= document.getElementById('joyai-mode-advanced');
const joyaiCodeBody   = document.getElementById('joyai-code-body');
const joyaiCodeTitle  = document.getElementById('joyai-code-title');
const joyaiLangSel    = document.getElementById('joyai-lang-sel');
const joyaiCopyBtn    = document.getElementById('joyai-copy-btn');

// ════════════════════════════════════════════════════════════
// MARKDOWN RENDERER — Full featured (like ChatGPT renders)
// ════════════════════════════════════════════════════════════
function escH(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// Inline markdown: bold, italic, code, links
function inlineMd(raw) {
  // Step 1: protect inline code spans
  const codes = [];
  let s = raw.replace(/`([^`\n]+)`/g, (_, c) => {
    codes.push(escH(c));
    return '\x00C' + (codes.length - 1) + '\x00';
  });

  // Step 2: escape HTML in the remaining text
  s = escH(s);

  // Step 3: apply formatting (on escaped text — safe)
  s = s.replace(/\*\*\*([^*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  s = s.replace(/_([^_\n]+)_/g, '<em>$1</em>');
  s = s.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
  // Links: [text](url)
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Step 4: restore inline code
  s = s.replace(/\x00C(\d+)\x00/g, (_, i) => `<code class="md-inline-code">${codes[+i]}</code>`);

  return s;
}

// Block-level markdown renderer
function joyaiMarkdown(text) {
  if (!text) return '';
  const lines = text.split('\n');
  let html = '';
  let inCode = false, codeLang = '', codeBuf = [];
  let inList = false, listTag = '';
  let tableRows = [], inTable = false;

  function closeList() {
    if (inList) { html += `</${listTag}>`; inList = false; listTag = ''; }
  }
  function flushTable() {
    if (inTable && tableRows.length) {
      html += `<div class="md-table-wrap"><table class="md-table">${tableRows.join('')}</table></div>`;
      tableRows = []; inTable = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ── Code fence ──
    if (/^```/.test(line)) {
      if (!inCode) {
        closeList(); flushTable();
        inCode = true;
        codeLang = line.slice(3).trim() || '';
        codeBuf = [];
      } else {
        inCode = false;
        const lang = codeLang || 'code';
        const escaped = escH(codeBuf.join('\n'));
        html += `<div class="md-code-block">` +
          `<div class="md-code-header"><span class="md-code-lang">${escH(lang)}</span>` +
          `<button class="md-copy-code-btn" onclick="joyaiCopyCodeBlock(this)">Copy</button></div>` +
          `<pre><code class="md-code-content">${escaped}</code></pre></div>`;
        codeBuf = []; codeLang = '';
      }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    // ── HR ──
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      closeList(); flushTable();
      html += '<hr class="md-hr">';
      continue;
    }

    // ── Headers ──
    const hm = line.match(/^(#{1,6}) (.+)/);
    if (hm) {
      closeList(); flushTable();
      const lvl = Math.min(hm[1].length, 4); // cap at h4 visually
      html += `<h${lvl} class="md-h${lvl}">${inlineMd(hm[2])}</h${lvl}>`;
      continue;
    }

    // ── Blockquote ──
    if (line.startsWith('> ')) {
      closeList(); flushTable();
      html += `<blockquote class="md-blockquote">${inlineMd(line.slice(2))}</blockquote>`;
      continue;
    }

    // ── Table ──
    if (line.startsWith('|') && line.includes('|', 1)) {
      closeList();
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (cells.every(c => /^[\s\-:]+$/.test(c))) {
        // Separator row: convert first row from td to th
        if (tableRows.length === 1) {
          tableRows[0] = tableRows[0].replace(/<td/g, '<th').replace(/<\/td>/g, '</th>');
        }
      } else {
        const tag = 'td';
        inTable = true;
        tableRows.push('<tr>' + cells.map(c => `<td class="md-td">${inlineMd(c)}</td>`).join('') + '</tr>');
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    // ── Unordered list ──
    const ulm = line.match(/^([ \t]*)[-*+] (.+)/);
    if (ulm) {
      if (!inList || listTag !== 'ul') { closeList(); html += '<ul class="md-ul">'; inList = true; listTag = 'ul'; }
      html += `<li class="md-li">${inlineMd(ulm[2])}</li>`;
      continue;
    }

    // ── Ordered list ──
    const olm = line.match(/^([ \t]*)\d+\. (.+)/);
    if (olm) {
      if (!inList || listTag !== 'ol') { closeList(); html += '<ol class="md-ol">'; inList = true; listTag = 'ol'; }
      html += `<li class="md-li">${inlineMd(olm[2])}</li>`;
      continue;
    }

    closeList();

    // ── Empty line ──
    if (line.trim() === '') {
      html += '<div class="md-gap"></div>';
      continue;
    }

    // ── Regular paragraph ──
    html += `<p class="md-p">${inlineMd(line)}</p>`;
  }

  // Close any open blocks
  closeList();
  flushTable();
  if (inCode) {
    html += `<pre><code class="md-code-content">${escH(codeBuf.join('\n'))}</code></pre>`;
  }

  return html;
}

// Copy code block content (called from inline onclick)
window.joyaiCopyCodeBlock = function(btn) {
  const code = btn.closest('.md-code-block').querySelector('.md-code-content').textContent;
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = code;
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  });
};

// ── Mode toggle ────────────────────────────────────────
function joyaiSetMode(mode) {
  joyaiMode = mode;
  joyaiBtnRegular  && joyaiBtnRegular.classList.toggle('active', mode === 'regular');
  joyaiBtnAdvanced && joyaiBtnAdvanced.classList.toggle('active', mode === 'advanced');
  if (joyaiMessages) joyaiMessages.style.display   = mode === 'regular'  ? '' : 'none';
  if (joyaiAdvanced) joyaiAdvanced.style.display    = mode === 'advanced' ? 'flex' : 'none';
  if (joyaiInp) joyaiInp.placeholder = mode === 'advanced'
    ? 'Code লিখতে বলো… (e.g. "একটা calculator app বানাও")'
    : 'JoyAI কে জিজ্ঞেস করো… (Bangla বা English-এ)';
}

joyaiBtnRegular  && joyaiBtnRegular.addEventListener('click',  () => joyaiSetMode('regular'));
joyaiBtnAdvanced && joyaiBtnAdvanced.addEventListener('click', () => joyaiSetMode('advanced'));

// ── Welcome message with suggested prompts ────────────
function joyaiShowWelcome(container) {
  const el = document.createElement('div');
  el.className = 'joyai-welcome';
  el.innerHTML = `
    <div class="joyai-welcome__logo">
      <span class="joyai-logo joyai-logo--lg">Joy<span>AI</span></span>
      <span class="joyai-welcome__flag">🇧🇩</span>
    </div>
    <p class="joyai-welcome__tagline">World's Best Free AI — Made in Bangladesh</p>
    <div class="joyai-suggestions" id="joyai-suggestions">
      ${SUGGESTIONS.map(s =>
        `<button class="joyai-suggestion-btn" data-prompt="${escH(s.text)}">
          <span class="joyai-suggestion-icon">${s.icon}</span>
          <span>${escH(s.text)}</span>
        </button>`
      ).join('')}
    </div>
  `;
  container.appendChild(el);

  el.querySelectorAll('.joyai-suggestion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (joyaiInp) {
        joyaiInp.value = btn.dataset.prompt;
        joyaiInp.focus();
        el.remove();
        joyaiSendMsg();
      }
    });
  });
}

// ── Start chat ─────────────────────────────────────────
function joyaiStartChat(isAutoStart) {
  if (joyaiSetup) joyaiSetup.style.display = 'none';
  if (joyaiChat)  joyaiChat.classList.add('active');
  const cfg = PROVIDERS[joyaiProv] || PROVIDERS.pollinations;
  if (joyaiProvLabel) {
    joyaiProvLabel.textContent = cfg.label;
  }
  joyaiSetMode('regular');
  if (joyaiMessages && !joyaiMessages.children.length) {
    joyaiShowWelcome(joyaiMessages);
  }
}

// ── Provider buttons ───────────────────────────────────
joyaiProvList && joyaiProvList.querySelectorAll('.joyai-prov-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    joyaiProvList.querySelectorAll('.joyai-prov-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    joyaiProv = btn.dataset.prov;
    const cfg = PROVIDERS[joyaiProv];

    if (cfg.noKey) {
      joyaiKey = joyaiProv === 'ollama' ? 'ollama' : 'free';
      if (joyaiKeyForm) joyaiKeyForm.style.display = 'none';
      joyaiSaveAndStart();
    } else {
      if (joyaiKeyHint) joyaiKeyHint.textContent = cfg.keyHint;
      if (joyaiKeyLink) joyaiKeyLink.innerHTML =
        `<a href="${cfg.keyLink}" target="_blank" rel="noopener">${cfg.keyLink}</a>`;
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

// ── Add message to chat ────────────────────────────────
function joyaiAddMsg(role, htmlContent, container) {
  const el = container || joyaiMessages;
  const wrap = document.createElement('div');
  wrap.className = `joyai-msg joyai-msg--${role}`;

  if (role === 'ai') {
    // htmlContent is the output of joyaiMarkdown() which HTML-escapes all user/AI
    // text through escH() before inserting. Raw strings are never passed here.
    wrap.innerHTML = htmlContent;
    // Add copy button for AI messages
    const copyBtn = document.createElement('button');
    copyBtn.className = 'joyai-msg-copy';
    copyBtn.title = 'Copy response';
    copyBtn.innerHTML = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3">
      <rect x="5" y="1" width="9" height="12" rx="1.5"/>
      <rect x="1" y="4" width="9" height="12" rx="1.5"/>
    </svg>`;
    copyBtn.addEventListener('click', () => {
      const text = wrap.innerText;
      navigator.clipboard.writeText(text).catch(() => {});
      copyBtn.innerHTML = '✓';
      setTimeout(() => {
        copyBtn.innerHTML = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3">
          <rect x="5" y="1" width="9" height="12" rx="1.5"/>
          <rect x="1" y="4" width="9" height="12" rx="1.5"/>
        </svg>`;
      }, 1500);
    });
    wrap.appendChild(copyBtn);
  } else {
    wrap.textContent = htmlContent; // user messages: plain text
  }

  el.appendChild(wrap);
  el.scrollTop = el.scrollHeight;
  return wrap;
}

// ── Code editor (advanced mode) ────────────────────────
function joyaiUpdateCodeEditor() {
  if (!joyaiCodeBody) return;
  if (joyaiLangSel) joyaiLangSel.value = joyaiCurLang || 'javascript';
  if (joyaiCodeTitle) joyaiCodeTitle.textContent = 'code.' + (joyaiCurLang || 'txt');
  const lines = joyaiCurCode.split('\n').map((line, i) =>
    `<span class="joyai-line-num">${i + 1}</span>${escH(line)}`
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

// ════════════════════════════════════════════════════
// AI API CALLS
// ════════════════════════════════════════════════════

async function joyaiCallAPI(msgs) {
  if (joyaiProv === 'ollama') {
    const r = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: localStorage.getItem('joyai_ollama_model') || 'llama3.2',
        messages: msgs,
        stream: false,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!r.ok) throw new Error('Ollama ' + r.status);
    const d = await r.json();
    return d.message?.content || 'No response';
  }

  // Pollinations — non-streaming fetch
  if (joyaiProv === 'pollinations') {
    const r = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openai', messages: msgs, max_tokens: 8192 }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!r.ok) throw new Error('Pollinations ' + r.status);
    const d = await r.json();
    return d.choices?.[0]?.message?.content || 'No response';
  }

  // Groq / Gemini — real SSE streaming, returns accumulated text
  const url = joyaiProv === 'groq'
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + joyaiKey,
    },
    body: JSON.stringify({
      model:      PROVIDERS[joyaiProv].model,
      messages:   msgs,
      stream:     true,
      max_tokens: 8192,
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!r.ok) {
    const errText = (await r.text().catch(() => '')).slice(0, 120);
    throw new Error(PROVIDERS[joyaiProv].name + ' ' + r.status + ': ' + errText);
  }

  // Read SSE stream
  let full = '', buf = '';
  const reader = r.body.getReader(), dec = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lns = buf.split('\n'); buf = lns.pop();
    for (const ln of lns) {
      if (!ln.startsWith('data: ')) continue;
      const d = ln.slice(6).trim();
      if (d === '[DONE]') return full;
      try { full += JSON.parse(d).choices?.[0]?.delta?.content ?? ''; } catch {}
    }
  }
  return full;
}

// Streaming with live animation
// onUpdate(partialText, isDone) called repeatedly
async function joyaiStreamResponse(msgs, onUpdate) {
  // For Groq/Gemini: real streaming with live tokens
  if (joyaiProv === 'groq' || joyaiProv === 'gemini') {
    const url = joyaiProv === 'groq'
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + joyaiKey,
      },
      body: JSON.stringify({
        model:      PROVIDERS[joyaiProv].model,
        messages:   msgs,
        stream:     true,
        max_tokens: 8192,
      }),
      signal: AbortSignal.timeout(90_000),
    });

    if (!r.ok) {
      const t = (await r.text().catch(() => '')).slice(0, 120);
      throw new Error(PROVIDERS[joyaiProv].name + ' ' + r.status + ': ' + t);
    }

    let full = '', buf = '', lastRender = 0;
    const reader = r.body.getReader(), dec = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lns = buf.split('\n'); buf = lns.pop();
      for (const ln of lns) {
        if (!ln.startsWith('data: ')) continue;
        const d = ln.slice(6).trim();
        if (d === '[DONE]') { onUpdate(full, true); return full; }
        try {
          const tok = JSON.parse(d).choices?.[0]?.delta?.content ?? '';
          if (tok) {
            full += tok;
            const now = Date.now();
            if (now - lastRender > 40) {   // render at most every 40ms
              onUpdate(full, false);
              lastRender = now;
            }
          }
        } catch {}
      }
    }
    onUpdate(full, true);
    return full;
  }

  // For Pollinations / Ollama: get full response then animate word-by-word
  const fullText = await joyaiCallAPI(msgs);
  await joyaiAnimateWords(fullText, onUpdate);
  return fullText;
}

// Word-by-word animation (like ChatGPT typing effect)
async function joyaiAnimateWords(text, onUpdate) {
  // Split into chunks: ~3 chars each for smooth effect
  const len = text.length;
  const step = len > 2000 ? 8 : len > 800 ? 4 : 2; // bigger chunks for long text
  const delay = len > 2000 ? 4 : len > 800 ? 8 : 14; // faster for long text

  let i = 0;
  while (i < len) {
    i = Math.min(i + step, len);
    onUpdate(text.slice(0, i), i === len);
    if (i < len) await new Promise(r => setTimeout(r, delay));
  }
}

// ════════════════════════════════════════════════════
// SEND MESSAGE — Main handler
// ════════════════════════════════════════════════════
async function joyaiSendMsg() {
  const text = joyaiInp ? joyaiInp.value.trim() : '';
  if (!text || joyaiStreaming) return;

  joyaiInp.value = '';
  joyaiInp.style.height = 'auto';
  joyaiStreaming = true;
  if (joyaiSend) joyaiSend.disabled = true;

  const isAdv  = joyaiMode === 'advanced';
  const hist   = isAdv ? joyaiAdvHist : joyaiHist;
  const msgCon = isAdv ? joyaiAdvMessages : joyaiMessages;

  // Remove welcome screen if still there
  const welcome = msgCon.querySelector('.joyai-welcome');
  if (welcome) welcome.remove();

  // Add user message
  joyaiAddMsg('user', text, msgCon);
  hist.push({ role: 'user', content: text });
  if (hist.length > 30) hist.splice(0, 2);

  // Create streaming AI message bubble
  const aiEl = document.createElement('div');
  aiEl.className = 'joyai-msg joyai-msg--ai joyai-msg--loading';
  aiEl.innerHTML = '<span class="joyai-dots"><span></span><span></span><span></span></span>';
  msgCon.appendChild(aiEl);
  msgCon.scrollTop = msgCon.scrollHeight;

  const sys = isAdv ? SYS_CODING : SYS_REGULAR;
  const apiMsgs = [{ role: 'system', content: sys }, ...hist];

  let finalText = '';

  try {
    finalText = await joyaiStreamResponse(apiMsgs, (partial, done) => {
      aiEl.classList.remove('joyai-msg--loading');

      // In coding mode: capture last code block for editor
      if (isAdv) {
        const all = [...partial.matchAll(/```(\w*)\n?([\s\S]*?)```/g)];
        if (all.length) {
          const last = all[all.length - 1];
          joyaiCurLang = last[1] || 'javascript';
          joyaiCurCode = last[2].trim();
          if (done) setTimeout(joyaiUpdateCodeEditor, 0);
        }
      }

      if (done) {
        aiEl.innerHTML = joyaiMarkdown(partial);
        // Add copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'joyai-msg-copy';
        copyBtn.title = 'Copy response';
        copyBtn.innerHTML = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="5" y="1" width="9" height="12" rx="1.5"/><rect x="1" y="4" width="9" height="12" rx="1.5"/></svg>`;
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(aiEl.innerText.replace(/\nCopy\n/g, '\n')).catch(() => {});
          copyBtn.innerHTML = '✓';
          setTimeout(() => { copyBtn.innerHTML = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="5" y="1" width="9" height="12" rx="1.5"/><rect x="1" y="4" width="9" height="12" rx="1.5"/></svg>`; }, 1500);
        });
        aiEl.appendChild(copyBtn);
      } else {
        // Streaming: show markdown with cursor at end
        aiEl.innerHTML = joyaiMarkdown(partial) + '<span class="joyai-typing-cursor">▋</span>';
      }
      msgCon.scrollTop = msgCon.scrollHeight;
    });

    hist.push({ role: 'assistant', content: finalText });

  } catch (err) {
    aiEl.classList.remove('joyai-msg--loading');
    let errMsg = `**Error:** ${err.message}\n\n`;
    if (joyaiProv === 'ollama') {
      errMsg += 'Ollama চালু করো:\n```bash\nollama serve\nollama pull llama3.2\n```\nঅথবা ⚙ দিয়ে অন্য AI বেছে নাও।';
    } else if (joyaiProv === 'pollinations') {
      errMsg += 'Internet connection check করো। সমস্যা থাকলে ⚙ দিয়ে অন্য provider বেছে নাও।';
    } else {
      errMsg += 'API key চেক করো অথবা ⚙ দিয়ে অন্য provider বেছে নাও।';
    }
    aiEl.innerHTML = joyaiMarkdown(errMsg);
  }

  joyaiStreaming = false;
  if (joyaiSend) joyaiSend.disabled = false;
  if (joyaiInp)  joyaiInp.focus();
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
  if (joyaiChat)  joyaiChat.classList.remove('active');
  if (joyaiSetup) joyaiSetup.style.display = '';
  if (joyaiKeyForm)  joyaiKeyForm.style.display = 'none';
  if (joyaiKeyInput) joyaiKeyInput.value = '';
  joyaiProvList && joyaiProvList.querySelectorAll('.joyai-prov-btn').forEach(b => b.classList.remove('selected'));
});

// ── New Chat ──────────────────────────────────────────
joyaiNewChat && joyaiNewChat.addEventListener('click', () => {
  joyaiHist    = [];
  joyaiAdvHist = [];
  if (joyaiMessages)   { joyaiMessages.innerHTML = '';    joyaiShowWelcome(joyaiMessages); }
  if (joyaiAdvMessages){ joyaiAdvMessages.innerHTML = ''; }
  if (joyaiCodeBody)   { joyaiCodeBody.innerHTML = '';    joyaiCurCode = ''; }
  if (joyaiInp) joyaiInp.focus();
});

// ── Auto-start ─────────────────────────────────────────
(function joyaiInit() {
  const savedProv = localStorage.getItem('joyai_prov');
  const savedKey  = localStorage.getItem('joyai_key');

  if (savedProv && savedKey) {
    joyaiProv = savedProv;
    joyaiKey  = savedKey;
  } else {
    joyaiProv = 'pollinations';
    joyaiKey  = 'free';
    localStorage.setItem('joyai_prov', 'pollinations');
    localStorage.setItem('joyai_key',  'free');
  }
  joyaiStartChat(true);
})();
