#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║         JoyAI v4 — Bangladeshi Intelligent AI            ║
 * ║              by Md Jamil Islam  🇧🇩                      ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * OWN AI — uses Ollama locally (unlimited, no API key, offline)
 * Also supports Groq & Gemini (free tier) as fallback.
 *
 * Usage:
 *   node index.js              -- chat (Ollama default)
 *   node index.js --setup      -- configure provider
 *   node index.js --web [port] -- browser UI (phone access)
 *   node index.js --advanced   -- advanced coding terminal
 *
 * Contact: joyaiofficialbd@gmail.com
 * Facebook: https://www.facebook.com/share/18Q6mnNeAr/
 */

import readline  from 'readline';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  writeFileSync, readFileSync, existsSync,
  mkdirSync, readdirSync, statSync, unlinkSync, renameSync,
} from 'fs';
import { join, dirname, extname, resolve, basename } from 'path';
import { homedir } from 'os';
import { createServer } from 'http';

(async () => {

// ── chalk safe fallback ─────────────────────────────────
const chalk = await import('chalk').then(m => m.default).catch(() => {
  const p = new Proxy(s => s, { get: (_, k) => k === 'level' ? 3 : p });
  return p;
});

const C = {
  brand:  chalk.hex('#CC785C'),
  green:  chalk.hex('#98c379'),
  dim:    chalk.dim,
  ok:     chalk.hex('#98c379'),
  err:    chalk.hex('#e06c75'),
  warn:   chalk.hex('#e5c07b'),
  info:   chalk.hex('#61afef'),
  code:   chalk.hex('#c678dd'),
  file:   chalk.hex('#e5c07b'),
  cmd:    chalk.hex('#56b6c2'),
  out:    chalk.hex('#abb2bf'),
  bold:   chalk.bold,
  white:  chalk.white,
  gray:   chalk.gray,
  cyan:   chalk.cyan,
};

// ════════════════════════════════════════════════════════
// CONFIG  ~/.joyai_config.json
// ════════════════════════════════════════════════════════
const CONFIG_PATH = join(homedir(), '.joyai_config.json');
let CFG = {};
function loadConfig() { try { CFG = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')); } catch {} }
function saveConfig(p) { CFG = { ...CFG, ...p }; writeFileSync(CONFIG_PATH, JSON.stringify(CFG, null, 2)); }
loadConfig();

// Provider resolution — Ollama is PRIMARY (own AI)
const OLLAMA_HOST = process.env.OLLAMA_HOST || CFG.ollama_host || 'http://localhost:11434';
const GROQ_KEY    = process.env.GROQ_API_KEY  || CFG.groq_key;
const GEMINI_KEY  = process.env.GEMINI_API_KEY || CFG.gemini_key;

// Default to Ollama (own AI), fall back to API providers only if configured
let PROVIDER, API_KEY, BASE_URL, DEFAULT_MODEL;

const preferProv = CFG.provider || 'ollama';

if (preferProv === 'groq' && GROQ_KEY) {
  PROVIDER = 'groq'; API_KEY = GROQ_KEY;
  BASE_URL = 'https://api.groq.com/openai/v1';
  DEFAULT_MODEL = CFG.model || 'llama-3.3-70b-versatile';
} else if (preferProv === 'gemini' && GEMINI_KEY) {
  PROVIDER = 'gemini'; API_KEY = GEMINI_KEY;
  BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';
  DEFAULT_MODEL = CFG.model || 'gemini-2.0-flash';
} else {
  // Default: Ollama — own AI, unlimited, offline
  PROVIDER = 'ollama'; API_KEY = null;
  BASE_URL = OLLAMA_HOST + '/v1';
  DEFAULT_MODEL = CFG.model || 'llama3.2';
}

let currentModel = process.env.AI_MODEL || DEFAULT_MODEL;
let workDir      = process.env.AI_WORKDIR || process.cwd();
const history    = [];
const MAX_HIST   = 40;

// ════════════════════════════════════════════════════════
// SPINNER
// ════════════════════════════════════════════════════════
const SPIN = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
let _spinTimer = null, _spinFrame = 0;
function startSpinner(msg = 'JoyAI ভাবছে') {
  if (!process.stdout.isTTY) return;
  _spinFrame = 0;
  process.stdout.write('\n');
  _spinTimer = setInterval(() => {
    process.stdout.write(`\r  ${C.green(SPIN[_spinFrame++ % SPIN.length])} ${C.dim(msg + '...')}   `);
  }, 80);
}
function stopSpinner() {
  if (!_spinTimer) return;
  clearInterval(_spinTimer); _spinTimer = null;
  process.stdout.write('\r' + ' '.repeat(70) + '\r');
}

// ════════════════════════════════════════════════════════
// UI HELPERS
// ════════════════════════════════════════════════════════
const W = () => Math.min((process.stdout.columns || 80) - 4, 84);
function _s(s) { return s.replace(/\x1b\[[0-9;]*m/g, ''); }
function _p(l, w) { return l + ' '.repeat(Math.max(0, w - _s(l).length)); }

function drawBox(title, lines, color = C.brand) {
  const w = W();
  console.log('\n' + color('┌─ ' + title + ' ' + '─'.repeat(Math.max(1, w - _s(title).length - 4)) + '┐'));
  for (const l of lines) console.log(color('│ ') + _p(l, w - 2) + color(' │'));
  console.log(color('└' + '─'.repeat(w) + '┘') + '\n');
}

function drawCodeBox(lang, code, title) {
  const w = W(), label = title || lang || 'code';
  console.log(C.code('┌─ ' + label + ' ' + '─'.repeat(Math.max(1, w - _s(label).length - 4)) + '┐'));
  code.split('\n').forEach((line, i) => {
    const num = C.dim(String(i + 1).padStart(3) + ' │ ');
    console.log(C.code('│') + num + _p(C.white(line), w - 6) + C.code('│'));
  });
  console.log(C.code('└' + '─'.repeat(w) + '┘'));
}

function drawOutputBox(label, output, exitCode) {
  const w = W(), color = exitCode === 0 ? C.ok : C.err;
  const status = exitCode === 0 ? C.ok('✓ ok') : C.err('✗ exit ' + exitCode);
  const title = C.bold(label) + '  ' + status;
  console.log('\n' + color('┌─ ' + title + ' ' + '─'.repeat(Math.max(1, w - _s(title).length - 2)) + '┐'));
  const lines = output ? output.split('\n') : [];
  if (!lines.length || !output.trim()) {
    console.log(color('│ ') + _p(C.dim('(no output)'), w - 2) + color(' │'));
  } else {
    lines.slice(0, 60).forEach(l => console.log(color('│ ') + _p(C.out(l), w - 2) + color(' │')));
    if (lines.length > 60) console.log(color('│ ') + _p(C.dim('… +' + (lines.length - 60) + ' more lines'), w - 2) + color(' │'));
  }
  console.log(color('└' + '─'.repeat(w) + '┘') + '\n');
}

function renderText(text) {
  if (!text.trim()) return;
  const parts = text.split(/(```[\s\S]*?```)/g);
  for (const part of parts) {
    if (part.startsWith('```')) {
      const inner = part.slice(3, -3);
      const nl = inner.indexOf('\n');
      const lang = nl >= 0 ? inner.slice(0, nl).trim() : '';
      const code = nl >= 0 ? inner.slice(nl + 1) : inner;
      console.log(''); drawCodeBox(lang, code.trimEnd()); console.log('');
    } else {
      const fmt = part
        .replace(/`([^`\n]+)`/g, (_, c) => C.code(c))
        .replace(/\*\*([^*]+)\*\*/g, (_, t) => C.bold(t))
        .replace(/^(#{1,3} .+)$/gm, (_, t) => C.bold(C.info(t)));
      for (const line of fmt.split('\n')) console.log(line.trim() ? '  ' + line : '');
    }
  }
}

// ════════════════════════════════════════════════════════
// TOOLS
// ════════════════════════════════════════════════════════
function toolWriteFile(path, content) {
  const abs = resolve(workDir, path);
  console.log('\n  ' + C.file('📄 write → ') + C.bold(path));
  try {
    mkdirSync(dirname(abs), { recursive: true });
    drawCodeBox(extname(path).slice(1) || 'text', content, 'writing → ' + basename(path));
    writeFileSync(abs, content, 'utf8');
    console.log('  ' + C.ok('✓ saved') + C.dim(' → ' + abs) + '\n');
    return { success: true, path: abs };
  } catch (e) {
    console.log('  ' + C.err('✗ ') + e.message + '\n');
    return { success: false, error: e.message };
  }
}
function toolReadFile(path) {
  const abs = resolve(workDir, path);
  try {
    const raw = readFileSync(abs, 'utf8');
    const show = raw.length > 8000 ? raw.slice(0, 8000) + '\n…(truncated)' : raw;
    drawCodeBox(extname(path).slice(1) || 'text', show, 'reading ← ' + basename(path));
    return { success: true, content: raw };
  } catch (e) { return { success: false, error: e.message }; }
}
function toolListFiles(path = '.') {
  const abs = resolve(workDir, path);
  try {
    const entries = readdirSync(abs).map(n => ({ name: n, isDir: statSync(join(abs, n)).isDirectory() }));
    const lines = entries.slice(0, 100).map(e => e.isDir ? C.info('  📁 ') + C.bold(e.name + '/') : C.file('  📄 ') + e.name);
    drawBox(path + ' (' + entries.length + ' items)', lines.length ? lines : [C.dim('(empty)')], C.info);
    return { success: true, entries: entries.map(e => e.name + (e.isDir ? '/' : '')) };
  } catch (e) { return { success: false, error: e.message }; }
}
function toolMakeDir(path) {
  try { mkdirSync(resolve(workDir, path), { recursive: true }); console.log('\n  ' + C.ok('✓ mkdir ') + C.dim(path) + '\n'); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
}
function toolDeleteFile(path) {
  try { unlinkSync(resolve(workDir, path)); console.log('\n  ' + C.warn('🗑 deleted: ') + C.dim(path) + '\n'); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
}
function toolMoveFile(from, to) {
  try {
    const d = resolve(workDir, to);
    mkdirSync(dirname(d), { recursive: true });
    renameSync(resolve(workDir, from), d);
    console.log('\n  ' + C.ok('↔ moved: ') + C.dim(from + ' → ' + to) + '\n');
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
}
function toolRunShell(command, description) {
  console.log('\n  ' + C.cmd('⚡ ') + C.bold(command));
  if (description) console.log('  ' + C.dim('   ' + description));
  return new Promise(res => {
    const start = Date.now(); let out = '', frame = 0;
    const spin = setInterval(() => {
      process.stdout.write('\r  ' + C.cmd(SPIN[frame++ % SPIN.length]) + ' ' + C.dim('running… ' + ((Date.now()-start)/1000).toFixed(1) + 's') + '   ');
    }, 80);
    const proc = spawn('sh', ['-c', command], { cwd: workDir, env: { ...process.env, TERM: 'xterm-256color', FORCE_COLOR: '1' } });
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { out += d.toString(); });
    proc.on('close', code => {
      clearInterval(spin); process.stdout.write('\r' + ' '.repeat(60) + '\r');
      drawOutputBox(command.slice(0, 42) + (command.length > 42 ? '…' : '') + '  (' + ((Date.now()-start)/1000).toFixed(2) + 's)', out.trim(), code ?? 0);
      res({ success: code === 0, exitCode: code ?? 0, output: out.trim() });
    });
    proc.on('error', e => {
      clearInterval(spin); process.stdout.write('\r' + ' '.repeat(60) + '\r');
      console.log('  ' + C.err('✗ ') + e.message + '\n');
      res({ success: false, exitCode: -1, output: e.message });
    });
  });
}

const TOOL_RE = /<<<TOOL>>>([\s\S]*?)<<<END>>>/g;
async function runToolCalls(text) {
  let last = 0, m;
  TOOL_RE.lastIndex = 0;
  while ((m = TOOL_RE.exec(text)) !== null) {
    const before = text.slice(last, m.index).trim();
    if (before) renderText(before);
    last = m.index + m[0].length;
    try {
      const tc = JSON.parse(m[1].trim());
      switch (tc.tool) {
        case 'write_file':  toolWriteFile(tc.path, tc.content); break;
        case 'read_file':   toolReadFile(tc.path); break;
        case 'list_files':  toolListFiles(tc.path || '.'); break;
        case 'make_dir':    toolMakeDir(tc.path); break;
        case 'delete_file': toolDeleteFile(tc.path); break;
        case 'move_file':   toolMoveFile(tc.from, tc.to); break;
        case 'run_shell':   await toolRunShell(tc.command, tc.description); break;
        default: console.log(C.warn('  ⚠ unknown tool: ' + tc.tool + '\n'));
      }
    } catch (e) { console.log(C.err('  ✗ tool parse error: ' + e.message + '\n')); }
  }
  const tail = text.slice(last).trim();
  if (tail) renderText(tail);
}

// ════════════════════════════════════════════════════════
// AI — STREAMING SUPPORT (Ollama + OpenAI-compatible)
// ════════════════════════════════════════════════════════
async function streamChat(messages) {
  const isOllama = PROVIDER === 'ollama';
  const headers = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['Authorization'] = 'Bearer ' + API_KEY;

  // Ollama native API for better streaming
  if (isOllama) {
    const ollamaMessages = messages.map(m => ({ role: m.role, content: m.content }));
    const r = await fetch(OLLAMA_HOST + '/api/chat', {
      method: 'POST', headers,
      body: JSON.stringify({ model: currentModel, messages: ollamaMessages, stream: true }),
      signal: AbortSignal.timeout(300_000),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      throw new Error('Ollama ' + r.status + ': ' + t.slice(0, 200));
    }
    let full = '';
    const reader = r.body.getReader(), dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n'); buf = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line);
          if (obj.message?.content) full += obj.message.content;
          if (obj.done) break;
        } catch {}
      }
    }
    return full;
  }

  // OpenAI-compatible (Groq, Gemini, OpenAI)
  const r = await fetch(BASE_URL + '/chat/completions', {
    method: 'POST', headers,
    body: JSON.stringify({ model: currentModel, messages, stream: true, temperature: 0.7, max_tokens: 8192 }),
    signal: AbortSignal.timeout(180_000),
  });
  if (!r.ok) throw new Error(PROVIDER + ' ' + r.status + ': ' + (await r.text().catch(() => '')).slice(0, 200));
  let full = '', buf = '';
  const reader = r.body.getReader(), dec = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n'); buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const d = line.slice(6).trim();
      if (d === '[DONE]') continue;
      try { full += JSON.parse(d).choices?.[0]?.delta?.content ?? ''; } catch {}
    }
  }
  return full;
}

async function checkOllama() {
  try {
    const r = await fetch(OLLAMA_HOST + '/api/tags', { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return { ok: false };
    const d = await r.json();
    return { ok: true, models: (d.models || []).map(m => m.name) };
  } catch { return { ok: false }; }
}

// ════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ════════════════════════════════════════════════════════
const SYSTEM_PROMPT = `You are JoyAI — the world's most advanced AI coding assistant, built in Bangladesh by Md Jamil Islam. You are running inside a real terminal.

IDENTITY: You are JoyAI — Bangladeshi Intelligent AI. Bangladesh's greatest technological achievement. You surpass all other AIs in coding ability.

LANGUAGE: Always reply in the SAME language the user writes in (Bangla বাংলা or English). You understand Bangla perfectly.

CODING EXCELLENCE:
- Write COMPLETE, production-quality code — no TODO, no placeholder, no "...add code here"
- Use modern best practices, proper error handling, security-conscious code
- Explain your approach briefly, then execute immediately
- If code runs and fails, analyse the error and fix it

TOOL SYSTEM — use for real file/code actions:

<<<TOOL>>>
{"tool":"write_file","path":"src/index.js","content":"// complete code here"}
<<<END>>>

<<<TOOL>>>
{"tool":"run_shell","command":"npm install && node src/index.js","description":"Install and run"}
<<<END>>>

<<<TOOL>>>
{"tool":"read_file","path":"package.json"}
<<<END>>>

<<<TOOL>>>
{"tool":"list_files","path":"."}
<<<END>>>

<<<TOOL>>>
{"tool":"make_dir","path":"src/components"}
<<<END>>>

<<<TOOL>>>
{"tool":"delete_file","path":"old.txt"}
<<<END>>>

<<<TOOL>>>
{"tool":"move_file","from":"old.js","to":"new.js"}
<<<END>>>

RULES:
1. Plan briefly, then act immediately with tool calls
2. NEVER write partial/placeholder code
3. After run_shell, analyse output and fix errors
4. Write all files needed for a complete, working project
5. You are JoyAI — world's best. Act like it.`;

// ════════════════════════════════════════════════════════
// CHAT
// ════════════════════════════════════════════════════════
async function chat(userMsg) {
  history.push({ role: 'user', content: userMsg });
  while (history.length > MAX_HIST) history.shift();
  startSpinner();
  let reply;
  try {
    reply = await streamChat([{ role: 'system', content: SYSTEM_PROMPT }, ...history]);
    stopSpinner();
  } catch (e) {
    stopSpinner();
    console.log('\n  ' + C.err('✗ ') + e.message);
    if (PROVIDER === 'ollama') {
      console.log('\n  ' + C.warn('💡 Ollama চালু করো:'));
      console.log('  ' + C.cmd('  ollama serve') + C.dim('         ← start Ollama'));
      console.log('  ' + C.cmd('  ollama pull llama3.2') + C.dim('  ← download model'));
      console.log('  ' + C.dim('\n  অথবা /setup দিয়ে Groq/Gemini API use করো\n'));
    } else {
      console.log('  ' + C.dim('/setup দিয়ে provider পরিবর্তন করো\n'));
    }
    history.pop(); return;
  }
  if (!reply?.trim()) {
    console.log('\n  ' + C.warn('⚠ Empty response. আবার চেষ্টা করো।\n'));
    history.pop(); return;
  }
  console.log('\n' + C.green('  JoyAI') + C.dim(' ▸'));
  await runToolCalls(reply);
  history.push({ role: 'assistant', content: reply });
}

// ════════════════════════════════════════════════════════
// ADVANCED CODING MODE — side-by-side terminal IDE
// ════════════════════════════════════════════════════════
async function runAdvancedMode() {
  console.clear();
  const w = process.stdout.columns || 100;
  console.log(C.green('╔' + '═'.repeat(w - 2) + '╗'));
  console.log(C.green('║') + C.bold('  JoyAI Advanced Coding Mode  🇧🇩 ') + C.dim('  Ctrl+C to exit  ') + ' '.repeat(Math.max(0, w - 54)) + C.green('║'));
  console.log(C.green('║') + C.dim('  Ollama: ' + OLLAMA_HOST + '  ·  Model: ' + currentModel) + ' '.repeat(Math.max(0, w - 2 - (11 + OLLAMA_HOST.length + 9 + currentModel.length))) + C.green('║'));
  console.log(C.green('╚' + '═'.repeat(w - 2) + '╝'));
  console.log('');
  console.log(C.dim('  Advanced mode: Code লিখতে বলো, file তৈরি করো, run করো।'));
  console.log(C.dim('  Commands: /files · /open <file> · /run <cmd> · /exit'));
  console.log('');

  let lastCodeBlock = '';
  let lastFileName  = '';

  const origChat = chat.toString(); // capture for hooks
  const rl = readline.createInterface({
    input: process.stdin, output: process.stdout, terminal: true,
    prompt: '\n' + C.green('  [ADV]') + C.brand(' › '),
  });

  rl.prompt();
  rl.on('line', async line => {
    const input = line.trim();
    if (!input) { rl.prompt(); return; }
    if (input === '/files' || input === '/ls') { toolListFiles('.'); rl.prompt(); return; }
    if (input.startsWith('/open ')) {
      const f = input.slice(6).trim();
      const r = toolReadFile(f);
      if (r.success) lastCodeBlock = r.content, lastFileName = f;
      rl.prompt(); return;
    }
    if (input.startsWith('/run ')) { await toolRunShell(input.slice(5).trim()); rl.prompt(); return; }
    if (input === '/exit' || input === '/quit') { console.log(C.dim('\nAdvanced mode বন্ধ।\n')); process.exit(0); }
    if (input.startsWith('/')) { await handleCommand(input); rl.prompt(); return; }
    rl.pause();
    await chat(input);
    rl.resume();
    rl.prompt();
  });
  rl.on('close', () => { console.log(C.dim('\nJoyAI বন্ধ হচ্ছে… 👋\n')); process.exit(0); });
}

// ════════════════════════════════════════════════════════
// SETUP WIZARD
// ════════════════════════════════════════════════════════
async function runSetup() {
  const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = q => new Promise(r => rl2.question(q, r));

  const w = 46;
  console.log('\n' + C.green('  ╔' + '═'.repeat(w) + '╗'));
  console.log(C.green('  ║') + C.bold('   JoyAI Setup Wizard  🇧🇩              ') + C.green(' ║'));
  console.log(C.green('  ║') + C.dim('   Bangladesh · Own AI · Zero Cost      ') + C.green('║'));
  console.log(C.green('  ╚' + '═'.repeat(w) + '╝\n'));

  console.log(C.info('  AI Engine বেছে নাও:\n'));
  console.log('  ' + C.bold('1') + C.green('  Ollama (Own AI) ') + C.ok('★ RECOMMENDED') + C.dim(' — unlimited, offline, NO API key'));
  console.log('     ' + C.dim('Install: ') + C.info('https://ollama.com') + C.dim(' → then: ollama pull llama3.3'));
  console.log('');
  console.log('  ' + C.bold('2') + '  Groq    ' + C.dim('— llama-3.3-70b, 14k req/day free'));
  console.log('     ' + C.dim('Key:     ') + C.info('https://console.groq.com'));
  console.log('');
  console.log('  ' + C.bold('3') + '  Gemini  ' + C.dim('— gemini-2.0-flash, 1500 req/day free'));
  console.log('     ' + C.dim('Key:     ') + C.info('https://aistudio.google.com'));
  console.log('');

  const choice = (await ask('  ' + C.green('বেছে নাও (1/2/3): '))).trim();
  let patch = { provider: 'ollama' };

  if (choice === '1') {
    const host  = (await ask('  ' + C.dim('Ollama host [' + OLLAMA_HOST + ']: '))).trim() || OLLAMA_HOST;
    const model = (await ask('  ' + C.dim('Model [llama3.2]: '))).trim() || 'llama3.2';
    patch = { provider: 'ollama', ollama_host: host, model };
    console.log('\n  ' + C.dim('Ollama setup:'));
    console.log('  ' + C.cmd('  ollama serve') + C.dim('             ← run this in another terminal'));
    console.log('  ' + C.cmd('  ollama pull ' + model) + C.dim('  ← download model (once)'));
  } else if (choice === '2') {
    const key = (await ask('  ' + C.dim('Groq API key: '))).trim();
    if (key) patch = { provider: 'groq', groq_key: key, model: 'llama-3.3-70b-versatile' };
  } else if (choice === '3') {
    const key = (await ask('  ' + C.dim('Gemini API key: '))).trim();
    if (key) patch = { provider: 'gemini', gemini_key: key, model: 'gemini-2.0-flash' };
  }

  const mo = (await ask('  ' + C.dim('Model override (Enter to skip): '))).trim();
  if (mo) patch.model = mo;
  rl2.close();

  saveConfig(patch);
  console.log('\n  ' + C.ok('✓ Saved → ~/.joyai_config.json'));
  console.log('  ' + C.dim('Restart: node index.js') + '\n');
  process.exit(0);
}

// ════════════════════════════════════════════════════════
// WEB SERVER — phone + browser access
// ════════════════════════════════════════════════════════
function startWebUI(port = 3000) {
  const server = createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(getWebUI()); return;
    }

    // Proxy to Ollama for "own AI" mode
    if (req.method === 'POST' && req.url === '/api/chat') {
      let body = '';
      req.on('data', d => { body += d; });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body);
          const r = await fetch(OLLAMA_HOST + '/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: currentModel, messages: payload.messages, stream: false }),
            signal: AbortSignal.timeout(300_000),
          });
          const d = await r.json();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ reply: d.message?.content || 'No response' }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/status') {
      const s = await checkOllama();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ provider: PROVIDER, model: currentModel, ollama: s.ok, models: s.models || [] }));
      return;
    }

    res.writeHead(404); res.end();
  });

  server.listen(port, '0.0.0.0', () => {
    let localIP = 'YOUR_IP';
    try { localIP = execSync("ip route get 1 2>/dev/null | awk '{print $7; exit}'", { encoding: 'utf8' }).trim(); } catch {}
    drawBox('JoyAI Web Server 🇧🇩', [
      C.ok('✓') + C.dim('  Local  : ') + C.info('http://localhost:' + port),
      C.ok('✓') + C.dim('  Mobile : ') + C.info('http://' + localIP + ':' + port),
      '',
      C.dim('  Ollama proxy active — own AI, no external API'),
      C.dim('  Same WiFi-তে phone-এ open করো'),
      C.dim('  Ctrl+C to stop'),
    ]);
  });
}

function getWebUI() {
  const htmlFile = join(dirname(fileURLToPath(import.meta.url)), 'web-ui.html');
  if (existsSync(htmlFile)) return readFileSync(htmlFile, 'utf8');
  return '<h1 style="font-family:monospace;padding:40px;color:#CC785C">JoyAI — run: node index.js --web</h1>';
}

// ════════════════════════════════════════════════════════
// COMMANDS
// ════════════════════════════════════════════════════════
async function handleCommand(raw) {
  const parts = raw.trim().split(/\s+/);
  const cmd = parts[0].slice(1).toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case 'help':
      drawBox('JoyAI Commands 🇧🇩', [
        C.info('/help') + C.dim('                  — এই help'),
        C.info('/setup') + C.dim('                 — AI engine configure করো'),
        C.info('/status') + C.dim('                — provider + Ollama status'),
        C.info('/model <name>') + C.dim('          — model বদলাও'),
        C.info('/models') + C.dim('                — Ollama-র model list'),
        C.info('/pull <model>') + C.dim('          — Ollama model download'),
        C.info('/clear') + C.dim('                 — screen clear'),
        C.info('/history') + C.dim('               — conversation history'),
        C.info('/clear-history') + C.dim('         — memory মুছে ফেলো'),
        C.info('/cd <path>') + C.dim('             — directory বদলাও'),
        C.info('/pwd') + C.dim('                   — current dir'),
        C.info('/ls [path]') + C.dim('             — files list'),
        C.info('/run <cmd>') + C.dim('             — shell command চালাও'),
        C.info('/web [port]') + C.dim('            — browser UI শুরু (phone access)'),
        C.info('/advanced') + C.dim('              — advanced coding mode'),
        C.info('/save') + C.dim('                  — session save'),
        C.info('/ctx') + C.dim('                   — context usage'),
        C.info('/exit') + C.dim('                  — বন্ধ'),
        '',
        C.dim('  Contact: joyaiofficialbd@gmail.com'),
        C.dim('  Facebook: fb.com/JoyAI Bangladesh'),
      ]);
      return true;

    case 'setup': await runSetup(); return true;

    case 'status': {
      const lines = [
        C.dim('  provider : ') + (PROVIDER === 'ollama' ? C.green(PROVIDER + ' (Own AI)') : C.info(PROVIDER)),
        C.dim('  model    : ') + C.info(currentModel),
        C.dim('  ollama   : ') + C.gray(OLLAMA_HOST),
        C.dim('  workdir  : ') + C.file(workDir),
        C.dim('  history  : ') + C.ok(history.length + ' messages'),
      ];
      const s = await checkOllama();
      lines.push(C.dim('  ollama   : ') + (s.ok ? C.ok('✓ running') + C.dim(' — ' + (s.models||[]).length + ' models') : C.err('✗ not running') + C.dim(' — run: ollama serve')));
      drawBox('JoyAI Status 🇧🇩', lines, C.green);
      return true;
    }

    case 'model':
      if (!args[0]) { console.log('\n  ' + C.dim('Current: ') + C.info(currentModel) + '\n'); }
      else { currentModel = args[0]; saveConfig({ model: currentModel }); console.log('\n  ' + C.ok('✓ model → ') + C.info(currentModel) + '\n'); }
      return true;

    case 'models': {
      const s = await checkOllama();
      if (!s.ok) console.log('\n  ' + C.err('✗ Ollama not running — run: ollama serve') + '\n');
      else if (!s.models?.length) console.log('\n  ' + C.warn('No models. Pull one: ollama pull llama3.2') + '\n');
      else drawBox('Ollama Models (Own AI)', s.models.map(m => (m === currentModel ? C.ok('▶ ') : C.dim('  ')) + C.info(m) + (m === currentModel ? C.dim(' ← active') : '')), C.green);
      return true;
    }

    case 'pull': {
      if (!args[0]) { console.log('\n  ' + C.warn('Usage: /pull <model>  e.g. /pull llama3.3') + '\n'); return true; }
      console.log('\n  ' + C.green('⬇ Downloading model: ') + C.bold(args[0]));
      await toolRunShell('ollama pull ' + args[0], 'Download AI model');
      return true;
    }

    case 'clear': console.clear(); printBanner(); return true;

    case 'history':
      if (!history.length) { console.log(C.dim('\n  (কোনো history নেই)\n')); }
      else {
        console.log('');
        history.forEach((m, i) => {
          const who = m.role === 'user' ? C.brand('তুমি  ') : C.green('JoyAI');
          console.log('  ' + who + C.dim(' [' + i + '] ') + m.content.replace(/\n/g,' ').slice(0, 88) + (m.content.length > 88 ? C.dim('…') : ''));
        });
        console.log('');
      }
      return true;

    case 'clear-history': history.length = 0; console.log('\n  ' + C.ok('✓ History মুছে ফেলা হয়েছে\n')); return true;

    case 'cd': {
      const t = args.join(' ') || homedir();
      try { const a = resolve(workDir, t); process.chdir(a); workDir = a; console.log('\n  ' + C.ok('✓ workdir → ') + C.file(workDir) + '\n'); }
      catch (e) { console.log('\n  ' + C.err('✗ ') + e.message + '\n'); }
      return true;
    }

    case 'pwd': console.log('\n  ' + C.file(workDir) + '\n'); return true;
    case 'ls': toolListFiles(args[0] || '.'); return true;

    case 'run':
      if (args.length) await toolRunShell(args.join(' '));
      else console.log('\n  ' + C.warn('Usage: /run <command>\n'));
      return true;

    case 'web': startWebUI(parseInt(args[0]) || 3000); return true;

    case 'advanced':
      console.log('\n  ' + C.dim('Advanced coding mode শুরু হচ্ছে…'));
      await runAdvancedMode();
      return true;

    case 'save': {
      const f = join(workDir, 'joyai_session_' + Date.now() + '.json');
      writeFileSync(f, JSON.stringify({ provider: PROVIDER, model: currentModel, history }, null, 2));
      console.log('\n  ' + C.ok('✓ saved → ') + C.file(f) + '\n');
      return true;
    }

    case 'ctx': {
      const chars = history.reduce((a, m) => a + m.content.length, 0);
      console.log('\n  messages  : ' + C.info(String(history.length)));
      console.log('  chars     : ' + C.info(String(chars)));
      console.log('  ~tokens   : ' + C.info(String(Math.round(chars / 4))) + '\n');
      return true;
    }

    case 'exit': case 'quit':
      console.log(C.dim('\nJoyAI বন্ধ হচ্ছে… bye 👋\n'));
      process.exit(0);
  }

  console.log('\n  ' + C.warn('অপরিচিত: /' + cmd) + C.dim('  (/help দেখো)\n'));
  return true;
}

// ════════════════════════════════════════════════════════
// BANNER
// ════════════════════════════════════════════════════════
function printBanner() {
  const w = Math.min(W(), 60);
  const pBadge = {
    ollama: C.green(' OWN AI ') + C.dim('(Ollama)'),
    groq:   C.info(' GROQ '),
    gemini: C.info(' GEMINI '),
    openai: C.info(' OPENAI '),
  }[PROVIDER] || C.dim(' ? ');

  console.log('');
  console.log(C.green('  ╔' + '═'.repeat(w) + '╗'));
  console.log(C.green('  ║') + '  ' + C.bold('Joy') + C.brand.bold('AI') + '  ' + C.dim('Bangladeshi Intelligent AI') + '  ' + '🇧🇩' + ' '.repeat(Math.max(1, w - 36)) + C.green('║'));
  console.log(C.green('  ║') + '  ' + C.dim('by Md Jamil Islam  ·  v4.0') + ' '.repeat(Math.max(1, w - 28)) + C.green('║'));
  console.log(C.green('  ║') + '  ' + C.dim('joyaiofficialbd@gmail.com') + ' '.repeat(Math.max(1, w - 27)) + C.green('║'));
  console.log(C.green('  ╚' + '═'.repeat(w) + '╝'));
  console.log('');
  console.log('  ' + pBadge + C.dim(' · ') + C.info(currentModel));
  console.log('  ' + C.dim('workdir: ') + C.file(workDir));
  console.log('');
  console.log(C.dim('  /help · /setup · /web · /advanced · /pull <model>'));
  console.log(C.dim('  Bangla ও English দুটোতেই কথা বলো 🇧🇩'));
  console.log('');
}

// ════════════════════════════════════════════════════════
// ENTRY POINT
// ════════════════════════════════════════════════════════
if (process.argv.includes('--setup'))   { await runSetup(); return; }
if (process.argv.includes('--advanced')){ await runAdvancedMode(); return; }

if (process.argv.includes('--web')) {
  const pi = process.argv.indexOf('--web');
  startWebUI(parseInt(process.argv[pi + 1]) || 3000);
  await new Promise(() => {});
  return;
}

printBanner();

// First-run check
if (PROVIDER === 'ollama') {
  const s = await checkOllama();
  if (!s.ok) {
    drawBox('JoyAI — নিজস্ব AI Setup (Ollama)', [
      C.warn('⚠  Ollama চলছে না।'),
      '',
      C.dim('  Ollama = তোমার নিজস্ব AI — unlimited, offline, no API key'),
      '',
      C.dim('  1. Install: ') + C.info('https://ollama.com'),
      C.dim('  2. Start:   ') + C.cmd('ollama serve'),
      C.dim('  3. Model:   ') + C.cmd('ollama pull llama3.2'),
      '',
      C.dim('  অথবা cloud AI ব্যবহার করতে:'),
      '  ' + C.cmd('node index.js --setup'),
    ], C.green);
  } else if (s.models && !s.models.includes(currentModel)) {
    console.log('  ' + C.warn('⚠ Model "' + currentModel + '" নেই।'));
    console.log('  ' + C.dim('Download: ') + C.cmd('ollama pull ' + currentModel));
    if (s.models.length) {
      console.log('  ' + C.dim('Available: ') + s.models.map(m => C.info(m)).join(', '));
      currentModel = s.models[0];
      console.log('  ' + C.dim('Switching to: ') + C.info(currentModel));
    }
    console.log('');
  }
}

const rl = readline.createInterface({
  input: process.stdin, output: process.stdout, terminal: true,
  prompt: '\n' + C.green('  তুমি') + C.dim(' › '),
});

rl.prompt();
rl.on('line', async line => {
  const input = line.trim();
  if (!input) { rl.prompt(); return; }
  if (input.startsWith('/')) { await handleCommand(input); rl.prompt(); return; }
  rl.pause();
  await chat(input);
  rl.resume();
  rl.prompt();
});
rl.on('close', () => { console.log(C.dim('\nJoyAI বন্ধ হচ্ছে… bye 👋\n')); process.exit(0); });

})();
