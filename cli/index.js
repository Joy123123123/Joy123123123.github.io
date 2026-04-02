#!/usr/bin/env node
/**
 * JoyAI — Bangladeshi Intelligent AI
 * by Md Jamil Islam
 *
 * 100% FREE. Bangla + English. Bangladesh-made.
 *
 * Free providers:
 *   GROQ_API_KEY   -> Groq (llama-3.3-70b, 14k req/day free)
 *   GEMINI_API_KEY -> Gemini (gemini-1.5-flash, 1.5k req/day free)
 *   Ollama         -> fully local, no key needed
 *
 * Usage:
 *   node index.js          -- chat
 *   node index.js --setup  -- configure provider
 *   node index.js --web    -- browser UI for phone
 */

import readline  from 'readline';
import { spawn, execSync } from 'child_process';
import {
  writeFileSync, readFileSync, existsSync,
  mkdirSync, readdirSync, statSync, unlinkSync, renameSync,
} from 'fs';
import { join, dirname, extname, resolve, basename } from 'path';
import { homedir }      from 'os';
import { createServer } from 'http';

// Async IIFE to support top-level await on all Node versions
(async () => {

// chalk with safe fallback
const chalk = await import('chalk').then(m => m.default).catch(() => {
  const p = new Proxy(s => s, { get: (_, k) => k === 'level' ? 3 : p });
  return p;
});

const C = {
  brand:  chalk.hex('#CC785C'),
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
  green:  chalk.hex('#98c379'),
};

// CONFIG
const CONFIG_PATH = join(homedir(), '.joyai_config.json');
let CFG = {};
function loadConfig() { try { CFG = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')); } catch {} }
function saveConfig(patch = {}) { CFG = { ...CFG, ...patch }; writeFileSync(CONFIG_PATH, JSON.stringify(CFG, null, 2)); }
loadConfig();

const GROQ_KEY   = process.env.GROQ_API_KEY   || CFG.groq_key;
const GEMINI_KEY = process.env.GEMINI_API_KEY  || CFG.gemini_key;
const OPENAI_KEY = process.env.OPENAI_API_KEY  || CFG.openai_key;
const OLLAMA     = process.env.OLLAMA_HOST     || CFG.ollama_host || 'http://localhost:11434';

let PROVIDER, API_KEY, BASE_URL, DEFAULT_MODEL;
if (GROQ_KEY) {
  PROVIDER = 'groq'; API_KEY = GROQ_KEY;
  BASE_URL = 'https://api.groq.com/openai/v1';
  DEFAULT_MODEL = CFG.model || 'llama-3.3-70b-versatile';
} else if (GEMINI_KEY) {
  PROVIDER = 'gemini'; API_KEY = GEMINI_KEY;
  BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';
  DEFAULT_MODEL = CFG.model || 'gemini-1.5-flash';
} else if (OPENAI_KEY) {
  PROVIDER = 'openai'; API_KEY = OPENAI_KEY;
  BASE_URL = 'https://api.openai.com/v1';
  DEFAULT_MODEL = CFG.model || 'gpt-4o-mini';
} else {
  PROVIDER = 'ollama'; API_KEY = null;
  BASE_URL = `${OLLAMA}/v1`;
  DEFAULT_MODEL = CFG.model || 'llama3.2';
}

let currentModel = process.env.AI_MODEL || DEFAULT_MODEL;
let workDir      = process.env.AI_WORKDIR || process.cwd();
const history    = [];
const MAX_HIST   = 30;

// SPINNER
const SPIN = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
let _spinTimer = null, _spinFrame = 0;
function startSpinner(msg = 'Thinking') {
  if (!process.stdout.isTTY) return;
  _spinFrame = 0;
  process.stdout.write('\n');
  _spinTimer = setInterval(() => {
    process.stdout.write(`\r  ${C.brand(SPIN[_spinFrame++ % SPIN.length])} ${C.dim(msg + '...')}   `);
  }, 80);
}
function stopSpinner() {
  if (!_spinTimer) return;
  clearInterval(_spinTimer); _spinTimer = null;
  process.stdout.write('\r' + ' '.repeat(60) + '\r');
}

// UI helpers
const W = () => Math.min((process.stdout.columns || 80) - 4, 80);
function _s(s) { return s.replace(/\x1b\[[0-9;]*m/g, ''); }
function _p(line, w) { return line + ' '.repeat(Math.max(0, w - _s(line).length)); }

function drawBox(title, lines, color = C.brand) {
  const w = W();
  console.log('\n' + color(`┌─ ${title} ${'─'.repeat(Math.max(1, w - _s(title).length - 4))}┐`));
  for (const l of lines) console.log(color('│ ') + _p(l, w - 2) + color(' │'));
  console.log(color(`└${'─'.repeat(w)}┘`) + '\n');
}

function drawCodeBox(lang, code, title) {
  const w = W(), label = title || lang || 'code';
  console.log(C.code(`┌─ ${label} ${'─'.repeat(Math.max(1, w - _s(label).length - 4))}┐`));
  code.split('\n').forEach((line, i) => {
    const num = C.dim(String(i + 1).padStart(3) + ' │ ');
    console.log(C.code('│') + num + _p(C.white(line), w - 6) + C.code('│'));
  });
  console.log(C.code(`└${'─'.repeat(w)}┘`));
}

function drawOutputBox(label, output, exitCode) {
  const w = W(), color = exitCode === 0 ? C.ok : C.err;
  const title = `${C.bold(label)}  ${exitCode === 0 ? C.ok('✓ ok') : C.err('✗ exit ' + exitCode)}`;
  console.log('\n' + color(`┌─ ${title} ${'─'.repeat(Math.max(1, w - _s(title).length - 2))}┐`));
  const lines = output ? output.split('\n') : [];
  if (!lines.length || !output.trim()) {
    console.log(color('│ ') + _p(C.dim('(no output)'), w - 2) + color(' │'));
  } else {
    lines.slice(0, 50).forEach(line => console.log(color('│ ') + _p(C.out(line), w - 2) + color(' │')));
    if (lines.length > 50) console.log(color('│ ') + _p(C.dim(`… +${lines.length - 50} more`), w - 2) + color(' │'));
  }
  console.log(color(`└${'─'.repeat(w)}┘`) + '\n');
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
      console.log(''); drawCodeBox(lang, code); console.log('');
    } else {
      const fmt = part
        .replace(/`([^`\n]+)`/g, (_, c) => C.code(c))
        .replace(/\*\*([^*]+)\*\*/g, (_, t) => C.bold(t))
        .replace(/^(#{1,3} .+)$/gm, (_, t) => C.bold(C.info(t)));
      for (const line of fmt.split('\n')) console.log(line.trim() ? '  ' + line : '');
    }
  }
}

// TOOLS
function toolWriteFile(path, content) {
  const abs = resolve(workDir, path);
  console.log('\n  ' + C.file('📄 write → ') + C.bold(path));
  try {
    mkdirSync(dirname(abs), { recursive: true });
    drawCodeBox(extname(path).slice(1) || 'text', content, `writing → ${basename(path)}`);
    writeFileSync(abs, content, 'utf8');
    console.log('  ' + C.ok('✓ saved → ') + C.dim(abs) + '\n');
    return { success: true, path: abs };
  } catch (e) {
    console.log('  ' + C.err('✗ ') + e.message + '\n');
    return { success: false, error: e.message };
  }
}

function toolReadFile(path) {
  const abs = resolve(workDir, path);
  console.log('\n  ' + C.info('📖 read ← ') + C.bold(path));
  try {
    const raw = readFileSync(abs, 'utf8');
    const show = raw.length > 6000 ? raw.slice(0, 6000) + '\n…(truncated)' : raw;
    drawCodeBox(extname(path).slice(1) || 'text', show, `reading ← ${basename(path)}`);
    return { success: true, content: raw };
  } catch (e) {
    console.log('  ' + C.err('✗ ') + e.message + '\n');
    return { success: false, error: e.message };
  }
}

function toolListFiles(path = '.') {
  const abs = resolve(workDir, path);
  console.log('\n  ' + C.info('📁 list : ') + C.bold(path));
  try {
    const entries = readdirSync(abs).map(name => ({ name, isDir: statSync(join(abs, name)).isDirectory() }));
    const lines = entries.slice(0, 80).map(e => e.isDir ? C.info('  📁 ') + C.bold(e.name + '/') : C.file('  📄 ') + e.name);
    drawBox(`${path} (${entries.length} items)`, lines.length ? lines : [C.dim('(empty)')], C.info);
    return { success: true, entries: entries.map(e => e.name + (e.isDir ? '/' : '')) };
  } catch (e) {
    console.log('  ' + C.err('✗ ') + e.message + '\n');
    return { success: false, error: e.message };
  }
}

function toolMakeDir(path) {
  const abs = resolve(workDir, path);
  try { mkdirSync(abs, { recursive: true }); console.log('\n  ' + C.ok('✓ mkdir ') + C.dim(path) + '\n'); return { success: true }; }
  catch (e) { console.log('\n  ' + C.err('✗ ') + e.message + '\n'); return { success: false, error: e.message }; }
}

function toolDeleteFile(path) {
  const abs = resolve(workDir, path);
  try { unlinkSync(abs); console.log('\n  ' + C.warn('🗑 deleted: ') + C.dim(path) + '\n'); return { success: true }; }
  catch (e) { console.log('\n  ' + C.err('✗ ') + e.message + '\n'); return { success: false, error: e.message }; }
}

function toolMoveFile(from, to) {
  const src = resolve(workDir, from), dst = resolve(workDir, to);
  try {
    mkdirSync(dirname(dst), { recursive: true }); renameSync(src, dst);
    console.log('\n  ' + C.ok('↔ moved: ') + C.dim(`${from} → ${to}`) + '\n'); return { success: true };
  } catch (e) { console.log('\n  ' + C.err('✗ ') + e.message + '\n'); return { success: false, error: e.message }; }
}

function toolRunShell(command, description) {
  console.log('\n  ' + C.cmd('⚡ run: ') + C.bold(command));
  if (description) console.log('  ' + C.dim('   ' + description));
  return new Promise(res => {
    const start = Date.now(); let out = '', frame = 0;
    const spin = setInterval(() => {
      process.stdout.write(`\r  ${C.cmd(SPIN[frame++ % SPIN.length])} ${C.dim(`running… ${((Date.now()-start)/1000).toFixed(1)}s`)}   `);
    }, 80);
    const proc = spawn('sh', ['-c', command], { cwd: workDir, env: { ...process.env, TERM: 'xterm-256color', FORCE_COLOR: '1' } });
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { out += d.toString(); });
    proc.on('close', code => {
      clearInterval(spin); process.stdout.write('\r' + ' '.repeat(60) + '\r');
      const elapsed = ((Date.now()-start)/1000).toFixed(2);
      drawOutputBox(`${command.slice(0,40)}${command.length>40?'…':''}  (${elapsed}s)`, out.trim(), code ?? 0);
      res({ success: code === 0, exitCode: code ?? 0, output: out.trim() });
    });
    proc.on('error', e => {
      clearInterval(spin); process.stdout.write('\r' + ' '.repeat(60) + '\r');
      console.log('  ' + C.err('✗ spawn: ') + e.message + '\n');
      res({ success: false, exitCode: -1, output: e.message });
    });
  });
}

const TOOL_RE = /<<<TOOL>>>([\s\S]*?)<<<END>>>/g;
async function runToolCalls(text) {
  let lastIdx = 0, m;
  TOOL_RE.lastIndex = 0;
  while ((m = TOOL_RE.exec(text)) !== null) {
    const before = text.slice(lastIdx, m.index).trim();
    if (before) renderText(before);
    lastIdx = m.index + m[0].length;
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
        default: console.log(C.warn(`  ⚠ unknown tool: ${tc.tool}\n`));
      }
    } catch (e) { console.log(C.err(`  ✗ tool error: ${e.message}\n`)); }
  }
  const tail = text.slice(lastIdx).trim();
  if (tail) renderText(tail);
}

// PROVIDER
async function streamChat(messages) {
  const headers = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['Authorization'] = 'Bearer ' + API_KEY;
  const r = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST', headers,
    body: JSON.stringify({ model: currentModel, messages, stream: true, temperature: 0.7, max_tokens: 8192 }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!r.ok) throw new Error(`${PROVIDER} ${r.status}: ${(await r.text().catch(()=>'')).slice(0,200)}`);
  let full = '', buf = '';
  const reader = r.body.getReader(), decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n'); buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try { full += JSON.parse(data).choices?.[0]?.delta?.content ?? ''; } catch {}
    }
  }
  return full;
}

async function checkOllama() {
  try {
    const r = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return { ok: false };
    const d = await r.json();
    return { ok: true, models: (d.models || []).map(m => m.name) };
  } catch { return { ok: false }; }
}

// SYSTEM PROMPT
const SYSTEM_PROMPT = `You are JoyAI — an elite AI coding assistant built in Bangladesh by Md Jamil Islam.
You are the most advanced Bangladeshi AI ever made. You run inside a real terminal.

LANGUAGE: Always reply in the SAME language the user writes in (Bangla or English).
You understand Bangla perfectly. Bangladesh is your home and you are proud of it.

YOUR PERSONALITY:
- Think like a world-class senior developer
- Be precise, confident, and action-oriented  
- Write complete, working, production-quality code — no TODO, no placeholders
- Explain what you're doing, then do it immediately
- If something fails, analyse the error and fix it

YOUR TOOLS — use these for REAL file/code actions:

<<<TOOL>>>
{"tool":"write_file","path":"file.js","content":"complete code here"}
<<<END>>>

<<<TOOL>>>
{"tool":"run_shell","command":"node file.js","description":"What this does"}
<<<END>>>

<<<TOOL>>>
{"tool":"read_file","path":"file.js"}
<<<END>>>

<<<TOOL>>>
{"tool":"list_files","path":"."}
<<<END>>>

<<<TOOL>>>
{"tool":"make_dir","path":"src"}
<<<END>>>

<<<TOOL>>>
{"tool":"delete_file","path":"old.txt"}
<<<END>>>

<<<TOOL>>>
{"tool":"move_file","from":"a.js","to":"b.js"}
<<<END>>>

RULES: Always explain first. Write COMPLETE code. Issue tool calls in order. After run_shell analyse output. Fix errors immediately.`;

// CHAT
async function chat(userMsg) {
  history.push({ role: 'user', content: userMsg });
  while (history.length > MAX_HIST) history.shift();
  startSpinner('JoyAI ভাবছে');
  let reply;
  try {
    reply = await streamChat([{ role: 'system', content: SYSTEM_PROMPT }, ...history]);
    stopSpinner();
  } catch (e) {
    stopSpinner();
    console.log('\n  ' + C.err('✗ ') + e.message);
    if (PROVIDER === 'ollama') {
      console.log('  ' + C.dim('Ollama চালু আছে? Run: ') + C.cmd('ollama serve'));
      console.log('  ' + C.dim('Model নেই? Run:       ') + C.cmd(`ollama pull ${currentModel}`));
    }
    console.log('  ' + C.dim('/setup দিয়ে provider কনফিগার করো\n'));
    history.pop(); return;
  }
  if (!reply?.trim()) {
    console.log('\n  ' + C.warn('⚠ Empty response. আবার চেষ্টা করো।\n'));
    history.pop(); return;
  }
  console.log('\n' + C.brand('  JoyAI') + C.dim(' ▸'));
  await runToolCalls(reply);
  history.push({ role: 'assistant', content: reply });
}

// SETUP
async function runSetup() {
  const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = q => new Promise(r => rl2.question(q, r));

  console.log('\n' + C.brand('  ╔══════════════════════════════════════╗'));
  console.log(C.brand('  ║') + C.bold('     JoyAI Setup Wizard 🇧🇩           ') + C.brand('║'));
  console.log(C.brand('  ║') + C.dim('     Bangladesh • Zero Cost • Free    ') + C.brand('║'));
  console.log(C.brand('  ╚══════════════════════════════════════╝\n'));
  console.log(C.info('  একটা FREE AI provider বেছে নাও:\n'));
  console.log('  ' + C.bold('1') + '  Groq   ' + C.ok('★ RECOMMENDED') + C.dim(' — llama-3.3-70b, দিনে 14k request ফ্রি'));
  console.log('     ' + C.dim('Sign up → ') + C.info('https://console.groq.com'));
  console.log('');
  console.log('  ' + C.bold('2') + '  Gemini  ' + C.dim(' — gemini-1.5-flash, দিনে 1500 request ফ্রি'));
  console.log('     ' + C.dim('Sign up → ') + C.info('https://aistudio.google.com'));
  console.log('');
  console.log('  ' + C.bold('3') + '  Ollama  ' + C.dim(' — সম্পূর্ণ offline/local, কোনো key লাগবে না'));
  console.log('     ' + C.dim('Install → ') + C.info('https://ollama.com'));
  console.log('');

  const choice = (await ask('  ' + C.brand('বেছে নাও (1/2/3): '))).trim();
  let patch = {};

  if (choice === '1') {
    const key = (await ask('  ' + C.dim('Groq API key paste করো: '))).trim();
    if (key) patch = { groq_key: key, provider: 'groq', model: 'llama-3.3-70b-versatile' };
  } else if (choice === '2') {
    const key = (await ask('  ' + C.dim('Gemini API key paste করো: '))).trim();
    if (key) patch = { gemini_key: key, provider: 'gemini', model: 'gemini-1.5-flash' };
  } else if (choice === '3') {
    const host  = (await ask(`  ${C.dim('Ollama host')} [${OLLAMA}]: `)).trim() || OLLAMA;
    const model = (await ask(`  ${C.dim('Model name')} [llama3.2]: `)).trim() || 'llama3.2';
    patch = { ollama_host: host, provider: 'ollama', model };
  }

  const mo = (await ask(`  ${C.dim('Model override (optional, Enter skip): ')}`)).trim();
  if (mo) patch.model = mo;
  rl2.close();

  if (Object.keys(patch).length) {
    saveConfig(patch);
    console.log('\n  ' + C.ok('✓ ~/.joyai_config.json এ save হয়েছে'));
    console.log('  ' + C.dim('Restart: ') + C.cmd('node index.js') + '\n');
  } else {
    console.log('\n  ' + C.warn('কোনো পরিবর্তন save হয়নি।\n'));
  }
  process.exit(0);
}

// WEB UI
function startWebUI(port = 3000) {
  const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>JoyAI - Bangladeshi Intelligent AI</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0f0f0d;color:#c8c4bb;font-family:system-ui,sans-serif;height:100dvh;display:flex;flex-direction:column;overflow:hidden}
#hdr{background:#1a1917;padding:10px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #2a2926;flex-shrink:0}
.logo{font-size:18px;font-weight:800;color:#CC785C;letter-spacing:-.5px}.logo b{color:#98c379}
.sub{font-size:11px;color:#5e5a53}.badge{margin-left:auto;font-size:10px;background:#28a74518;color:#98c379;border:1px solid #28a74530;padding:2px 8px;border-radius:20px}
#msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px}
.msg{max-width:88%;padding:10px 14px;border-radius:12px;font-size:13.5px;line-height:1.65;word-break:break-word}
.user{align-self:flex-end;background:#CC785C22;border:1px solid #CC785C44;color:#e8d5c8;border-bottom-right-radius:3px}
.ai{align-self:flex-start;background:#1a1917;border:1px solid #2a2926;color:#c8c4bb;border-bottom-left-radius:3px;white-space:pre-wrap}
.ai b{color:#e8d5c8}.ai code{background:#0f0f0d;padding:2px 6px;border-radius:4px;color:#c678dd;font-size:12px;font-family:monospace}
.ai pre{background:#0f0f0d;padding:12px;border-radius:8px;overflow-x:auto;border-left:3px solid #CC785C;margin:6px 0;font-size:12px;line-height:1.6}
.ai pre code{background:none;padding:0;color:#98c379}
.think{color:#5e5a53;font-size:12px;align-self:flex-start;padding:6px 12px}
#setup{flex:1;display:flex;align-items:center;justify-content:center;padding:20px;flex-direction:column;gap:16px;text-align:center}
#setup h2{color:#CC785C;font-size:20px;font-weight:800}#setup p{color:#8a8578;font-size:13px;line-height:1.6;max-width:300px}
.pb{display:flex;flex-direction:column;gap:4px;background:#1a1917;border:1px solid #2a2926;border-radius:10px;padding:14px 18px;cursor:pointer;width:100%;max-width:320px;text-align:left;transition:border-color .2s}
.pb:hover{border-color:#CC785C}.pb .pn{font-size:15px;font-weight:700;color:#e8d5c8}.pb .pd{font-size:11px;color:#5e5a53}.pb .pf{font-size:10px;color:#98c379;margin-top:2px}
.kf{display:none;flex-direction:column;gap:10px;width:100%;max-width:320px}
.kf input{background:#1a1917;border:1px solid #2a2926;border-radius:8px;padding:10px 13px;color:#e8d5c8;font-size:14px;outline:none;width:100%}
.kf input:focus{border-color:#CC785C}.kf button{background:#CC785C;border:none;border-radius:8px;padding:11px;color:#fff;font-weight:700;cursor:pointer;font-size:14px}
.kf .hint{font-size:11px;color:#5e5a53;text-align:left}.kf a{color:#61afef}
#btm{background:#1a1917;border-top:1px solid #2a2926;padding:10px 12px;display:flex;gap:8px;flex-shrink:0}
textarea#inp{flex:1;background:#0f0f0d;border:1px solid #2a2926;border-radius:8px;padding:9px 13px;color:#e8d5c8;font-size:14px;font-family:inherit;resize:none;outline:none;max-height:140px;min-height:40px}
textarea#inp:focus{border-color:#CC785C}
#sendbtn{background:#CC785C;border:none;border-radius:8px;padding:9px 16px;color:#fff;font-weight:700;cursor:pointer;font-size:14px;flex-shrink:0}
#sendbtn:disabled{background:#2a2926;color:#5e5a53;cursor:not-allowed}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#2a2926;border-radius:2px}
</style>
</head>
<body>
<div id="hdr">
  <div class="logo">Joy<b>AI</b></div>
  <div class="sub">🇧🇩 Bangladeshi Intelligent AI</div>
  <div class="badge" id="badge">free</div>
</div>
<div id="setup">
  <h2>🚀 JoyAI Setup</h2>
  <p>একটা free AI provider বেছে নাও। কোনো credit card লাগবে না।</p>
  <button class="pb" onclick="pickProv('groq')">
    <span class="pn">⚡ Groq</span>
    <span class="pd">llama-3.3-70b — fastest, best quality</span>
    <span class="pf">★ দিনে 14,400 request FREE</span>
  </button>
  <button class="pb" onclick="pickProv('gemini')">
    <span class="pn">✦ Google Gemini</span>
    <span class="pd">gemini-1.5-flash — smart and capable</span>
    <span class="pf">★ দিনে 1,500 request FREE</span>
  </button>
  <div class="kf" id="kf">
    <div class="hint" id="kh"></div>
    <input id="ki" type="password" placeholder="API key paste করো..." autocomplete="off">
    <button onclick="saveK()">শুরু করো →</button>
    <div class="hint" id="kl"></div>
  </div>
</div>
<div id="msgs" style="display:none"></div>
<div id="btm" style="display:none">
  <textarea id="inp" rows="1" placeholder="JoyAI কে জিজ্ঞেস করো… (Bangla বা English)"></textarea>
  <button id="sendbtn">Send</button>
</div>
<script>
let prov='',key='',hist=[];
const SYS='You are JoyAI, an elite AI built in Bangladesh by Md Jamil Islam. Reply in the same language the user writes in (Bangla or English). Be precise and helpful. Write complete code when asked.';

function pickProv(p){
  prov=p;
  document.getElementById('kf').style.display='flex';
  const info={groq:['console.groq.com → API Keys','https://console.groq.com'],gemini:['aistudio.google.com → Get API Key','https://aistudio.google.com']};
  document.getElementById('kh').textContent='Free key: '+info[p][0];
  document.getElementById('kl').innerHTML='<a href="'+info[p][1]+'" target="_blank">'+info[p][1]+'</a>';
  document.getElementById('ki').focus();
}

function saveK(){
  const k=document.getElementById('ki').value.trim();
  if(!k){alert('API key দাও');return;}
  key=k;
  localStorage.setItem('joyai_p',prov);
  localStorage.setItem('joyai_k',k);
  document.getElementById('badge').textContent='🇧🇩 '+prov;
  startChat();
}

function startChat(){
  document.getElementById('setup').style.display='none';
  document.getElementById('msgs').style.display='flex';
  document.getElementById('btm').style.display='flex';
  addMsg('ai','আমি **JoyAI** — তোমার personal AI assistant। Bangla বা English যেকোনো ভাষায় কথা বলো। আমি code লিখতে, প্রশ্নের উত্তর দিতে, এবং যেকোনো কাজে সাহায্য করতে পারি! 🇧🇩');
}

function addMsg(role,text){
  const msgs=document.getElementById('msgs');
  const d=document.createElement('div');
  d.className='msg '+role;
  if(role==='ai'){
    let h=text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\`\`\`([\s\S]*?)\`\`\`/g,(_,c)=>'<pre><code>'+c+'</code></pre>')
      .replace(/\`([^\`\n]+)\`/g,(_,c)=>'<code>'+c+'</code>')
      .replace(/\*\*([^*]+)\*\*/g,(_,t)=>'<b>'+t+'</b>');
    d.innerHTML=h;
  } else {
    d.textContent=text;
  }
  msgs.appendChild(d);
  msgs.scrollTop=msgs.scrollHeight;
  return d;
}

async function send(){
  const inp=document.getElementById('inp'),btn=document.getElementById('sendbtn');
  const text=inp.value.trim();
  if(!text||!key)return;
  inp.value='';inp.style.height='auto';btn.disabled=true;
  addMsg('user',text);
  hist.push({role:'user',content:text});
  if(hist.length>20)hist=hist.slice(-20);
  const t=document.createElement('div');
  t.className='think';t.textContent='⠋ ভাবছি…';
  document.getElementById('msgs').appendChild(t);
  document.getElementById('msgs').scrollTop=999999;
  const fr=['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];let fi=0;
  const sp=setInterval(()=>{t.textContent=fr[fi++%10]+' ভাবছি…';},80);
  try{
    const url=prov==='groq'?'https://api.groq.com/openai/v1/chat/completions':'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    const model=prov==='groq'?'llama-3.3-70b-versatile':'gemini-1.5-flash';
    const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},body:JSON.stringify({model,messages:[{role:'system',content:SYS},...hist],max_tokens:4096})});
    const d=await r.json();
    clearInterval(sp);t.remove();
    const reply=d.choices?.[0]?.message?.content||d.error?.message||'No response';
    hist.push({role:'assistant',content:reply});
    addMsg('ai',reply);
  }catch(e){
    clearInterval(sp);t.remove();
    addMsg('ai','✗ Error: '+e.message);
  }
  btn.disabled=false;
  document.getElementById('msgs').scrollTop=999999;
}

document.getElementById('sendbtn').addEventListener('click',send);
document.getElementById('inp').addEventListener('keydown',e=>{
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}
  setTimeout(()=>{const el=document.getElementById('inp');el.style.height='auto';el.style.height=Math.min(el.scrollHeight,140)+'px';},0);
});

const sp=localStorage.getItem('joyai_p'),sk=localStorage.getItem('joyai_k');
if(sp&&sk){prov=sp;key=sk;document.getElementById('badge').textContent='🇧🇩 '+sp;startChat();}
else{document.getElementById('setup').style.display='flex';}
</script>
</body>
</html>`;

  const server = createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(HTML); return;
    }
    res.writeHead(404); res.end();
  });

  server.listen(port, '0.0.0.0', () => {
    let localIP = 'YOUR_LOCAL_IP';
    try { localIP = execSync("ip route get 1 2>/dev/null | awk '{print $7; exit}'", { encoding: 'utf8' }).trim(); } catch {}
    drawBox('JoyAI Web UI 🇧🇩', [
      C.ok('✓') + C.dim('  Local  : ') + C.info(`http://localhost:${port}`),
      C.ok('✓') + C.dim('  Mobile : ') + C.info(`http://${localIP}:${port}`),
      '',
      C.dim('  Same WiFi-তে phone-এ Mobile link open করো'),
      C.dim('  API key browser-এ save হয়ে যাবে'),
      C.dim('  Ctrl+C to stop'),
    ]);
  });
}

// COMMANDS
async function handleCommand(raw) {
  const parts = raw.trim().split(/\s+/);
  const cmd = parts[0].slice(1).toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case 'help':
      drawBox('JoyAI Commands 🇧🇩', [
        C.info('/help') + C.dim('                  — এই help দেখাও'),
        C.info('/setup') + C.dim('                 — AI provider কনফিগার করো'),
        C.info('/status') + C.dim('                — provider + model info'),
        C.info('/model <name>') + C.dim('          — model বদলাও'),
        C.info('/models') + C.dim('                — Ollama models দেখাও'),
        C.info('/clear') + C.dim('                 — screen clear করো'),
        C.info('/history') + C.dim('               — conversation history'),
        C.info('/clear-history') + C.dim('         — memory মুছে ফেলো'),
        C.info('/cd <path>') + C.dim('             — directory বদলাও'),
        C.info('/pwd') + C.dim('                   — current directory'),
        C.info('/ls [path]') + C.dim('             — files list করো'),
        C.info('/run <cmd>') + C.dim('             — shell command চালাও'),
        C.info('/web [port]') + C.dim('            — browser UI শুরু করো (phone-এর জন্য)'),
        C.info('/save') + C.dim('                  — session save করো'),
        C.info('/ctx') + C.dim('                   — context usage দেখাও'),
        C.info('/exit') + C.dim('                  — বন্ধ করো'),
      ]);
      return true;

    case 'setup': await runSetup(); return true;

    case 'status': {
      const lines = [
        C.dim('  provider : ') + C.info(PROVIDER),
        C.dim('  model    : ') + C.info(currentModel),
        C.dim('  base_url : ') + C.gray(BASE_URL),
        C.dim('  workdir  : ') + C.file(workDir),
        C.dim('  history  : ') + C.ok(history.length + ' messages'),
      ];
      if (PROVIDER === 'ollama') {
        const s = await checkOllama();
        lines.push(C.dim('  ollama   : ') + (s.ok ? C.ok('running ✓') : C.err('not running — ollama serve')));
      }
      drawBox('JoyAI Status 🇧🇩', lines);
      return true;
    }

    case 'model':
      if (!args[0]) { console.log('\n  ' + C.dim('Current: ') + C.info(currentModel) + '\n'); }
      else { currentModel = args[0]; saveConfig({ model: currentModel }); console.log('\n  ' + C.ok('✓ model → ') + C.info(currentModel) + '\n'); }
      return true;

    case 'models': {
      if (PROVIDER !== 'ollama') { console.log('\n  ' + C.dim('/models shows Ollama models. Using: ') + C.info(PROVIDER) + '\n'); return true; }
      const s = await checkOllama();
      if (!s.ok) console.log('\n  ' + C.err('✗ Ollama not running — ') + C.cmd('ollama serve') + '\n');
      else if (!s.models?.length) console.log('\n  ' + C.warn('No models — ') + C.cmd('ollama pull llama3.2') + '\n');
      else drawBox('Ollama Models', s.models.map(m => (m === currentModel ? C.ok('▶ ') : C.dim('  ')) + C.info(m)));
      return true;
    }

    case 'clear': console.clear(); printBanner(); return true;

    case 'history':
      if (!history.length) { console.log(C.dim('\n  (কোনো history নেই)\n')); }
      else {
        console.log('');
        history.forEach((m, i) => {
          const who = m.role === 'user' ? C.brand('তুমি  ') : C.ok('JoyAI');
          console.log('  ' + who + C.dim(` [${i}] `) + m.content.replace(/\n/g, ' ').slice(0, 90) + (m.content.length > 90 ? C.dim('…') : ''));
        });
        console.log('');
      }
      return true;

    case 'clear-history': history.length = 0; console.log('\n  ' + C.ok('✓ History মুছে ফেলা হয়েছে\n')); return true;

    case 'cd': {
      const target = args.join(' ') || homedir();
      try { const abs = resolve(workDir, target); process.chdir(abs); workDir = abs; console.log('\n  ' + C.ok('✓ workdir → ') + C.file(workDir) + '\n'); }
      catch (e) { console.log('\n  ' + C.err('✗ ') + e.message + '\n'); }
      return true;
    }

    case 'pwd': console.log('\n  ' + C.file(workDir) + '\n'); return true;
    case 'ls': toolListFiles(args[0] || '.'); return true;

    case 'run': {
      const c = args.join(' ');
      if (c) await toolRunShell(c);
      else console.log('\n  ' + C.warn('Usage: /run <command>\n'));
      return true;
    }

    case 'web': {
      const port = parseInt(args[0]) || 3000;
      startWebUI(port);
      return true;
    }

    case 'save': {
      const fname = join(workDir, `joyai_session_${Date.now()}.json`);
      writeFileSync(fname, JSON.stringify({ provider: PROVIDER, model: currentModel, history }, null, 2));
      console.log('\n  ' + C.ok('✓ saved → ') + C.file(fname) + '\n');
      return true;
    }

    case 'ctx': {
      const chars = history.reduce((a, m) => a + m.content.length, 0);
      console.log('\n  ' + C.dim('messages : ') + C.info(String(history.length)));
      console.log('  ' + C.dim('chars    : ') + C.info(String(chars)));
      console.log('  ' + C.dim('~tokens  : ') + C.info(String(Math.round(chars / 4))) + '\n');
      return true;
    }

    case 'exit':
    case 'quit':
      console.log(C.dim('\nJoyAI বন্ধ হচ্ছে… bye 👋\n'));
      process.exit(0);
  }

  console.log('\n  ' + C.warn(`অপরিচিত command: /${cmd}`) + C.dim('  (/help দেখো)\n'));
  return true;
}

// BANNER
function printBanner() {
  const w = Math.min(W(), 56);
  const pb = { groq: C.ok(' GROQ '), gemini: C.info(' GEMINI '), openai: C.info(' OPENAI '), ollama: C.warn(' OLLAMA ') }[PROVIDER] || C.dim(' ? ');
  console.log('');
  console.log(C.brand('  ╔' + '═'.repeat(w) + '╗'));
  console.log(C.brand('  ║') + '  ' + C.bold('Joy') + C.green.bold('AI') +
    C.dim('  Bangladeshi Intelligent AI  🇧🇩') + ' '.repeat(Math.max(1, w - 36)) + C.brand('║'));
  console.log(C.brand('  ║') + '  ' + C.dim('by Md Jamil Islam') +
    ' '.repeat(Math.max(1, w - 19)) + C.brand('║'));
  console.log(C.brand('  ╚' + '═'.repeat(w) + '╝'));
  console.log('');
  console.log('  ' + pb + C.dim(' · ') + C.info(currentModel));
  console.log('  ' + C.dim('workdir: ') + C.file(workDir));
  console.log('');
  console.log(C.dim('  /help · /setup · /web [port] · /exit'));
  console.log(C.dim('  Bangla ও English দুটোতেই কথা বলো 🇧🇩'));
  console.log('');
}

// ENTRY POINT
if (process.argv.includes('--setup')) { await runSetup(); return; }

if (process.argv.includes('--web')) {
  const pi = process.argv.indexOf('--web');
  startWebUI(parseInt(process.argv[pi + 1]) || 3000);
  await new Promise(() => {});
  return;
}

printBanner();

if (!GROQ_KEY && !GEMINI_KEY && !OPENAI_KEY) {
  const s = await checkOllama();
  if (!s.ok) {
    drawBox('JoyAI — Quick Setup', [
      C.warn('⚠  কোনো AI provider নেই।'),
      '',
      C.dim('  সবচেয়ে সহজ — Groq (দিনে 14k request FREE):'),
      '  1. ' + C.info('https://console.groq.com') + C.dim(' → sign up → API Keys'),
      '  2. ' + C.cmd('node index.js --setup') + C.dim(' → Groq বেছে নাও'),
      '',
      C.dim('  Phone browser-এ use করতে:'),
      '     ' + C.cmd('node index.js --web'),
    ], C.warn);
  }
}

const rl = readline.createInterface({
  input: process.stdin, output: process.stdout, terminal: true,
  prompt: '\n' + C.brand('  তুমি') + C.dim(' › '),
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

rl.on('close', () => {
  console.log(C.dim('\nJoyAI বন্ধ হচ্ছে… bye 👋\n'));
  process.exit(0);
});

})();
