#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║           amznon-ai  —  Advanced Coding AI           ║
 * ║              by Md Jamil Islam                       ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * 100% FREE — no credit card, no subscription.
 * Supports (pick any free one):
 *   GROQ_API_KEY   → Groq   (llama-3.3-70b, fastest, free)
 *   GEMINI_API_KEY → Gemini (gemini-1.5-flash, free)
 *   Ollama         → local LLM, no internet, no key
 *
 * Get free keys:
 *   Groq   → https://console.groq.com      (14 400 req/day free)
 *   Gemini → https://aistudio.google.com   (1 500 req/day free)
 *
 * Usage:
 *   node index.js          — chat
 *   node index.js --setup  — change provider / model
 *   node index.js --web    — start browser UI (for phone without Termux)
 */

import readline  from 'readline';
import { spawn, execSync } from 'child_process';
import {
  writeFileSync, readFileSync, existsSync,
  mkdirSync, readdirSync, statSync, unlinkSync, renameSync,
} from 'fs';
import { join, dirname, extname, resolve, basename, relative } from 'path';
import { homedir, platform } from 'os';
import { createServer }      from 'http';
import { createHash }        from 'crypto';

// ── chalk (ESM, safe fallback) ──────────────────────────
const chalk = await import('chalk').then(m => m.default).catch(() => {
  const p = new Proxy(s => s, { get: (_, k) => k === 'level' ? 3 : p });
  return p;
});

// ── Colour palette ──────────────────────────────────────
const C = {
  brand:  chalk.hex('#CC785C'),
  accent: chalk.hex('#e8a87c'),
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
};

// ════════════════════════════════════════════════════════
// CONFIG  — ~/.amznon_config.json
// ════════════════════════════════════════════════════════
const CONFIG_PATH = join(homedir(), '.amznon_config.json');
let CFG = {};

function loadConfig() {
  try { CFG = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')); } catch {}
}
function saveConfig(patch = {}) {
  CFG = { ...CFG, ...patch };
  writeFileSync(CONFIG_PATH, JSON.stringify(CFG, null, 2));
}
loadConfig();

// ── Provider detection ──────────────────────────────────
// Priority: env vars → saved config → Ollama
const GROQ_KEY   = process.env.GROQ_API_KEY   || CFG.groq_key;
const GEMINI_KEY = process.env.GEMINI_API_KEY  || CFG.gemini_key;
const OPENAI_KEY = process.env.OPENAI_API_KEY  || CFG.openai_key;
const OLLAMA     = process.env.OLLAMA_HOST     || CFG.ollama_host || 'http://localhost:11434';

let PROVIDER, API_KEY, BASE_URL, DEFAULT_MODEL;

if (GROQ_KEY) {
  PROVIDER  = 'groq';
  API_KEY   = GROQ_KEY;
  BASE_URL  = 'https://api.groq.com/openai/v1';
  DEFAULT_MODEL = CFG.model || 'llama-3.3-70b-versatile';
} else if (GEMINI_KEY) {
  PROVIDER  = 'gemini';
  API_KEY   = GEMINI_KEY;
  BASE_URL  = 'https://generativelanguage.googleapis.com/v1beta/openai';
  DEFAULT_MODEL = CFG.model || 'gemini-1.5-flash';
} else if (OPENAI_KEY) {
  PROVIDER  = 'openai';
  API_KEY   = OPENAI_KEY;
  BASE_URL  = 'https://api.openai.com/v1';
  DEFAULT_MODEL = CFG.model || 'gpt-4o-mini';
} else {
  PROVIDER  = 'ollama';
  API_KEY   = null;
  BASE_URL  = `${OLLAMA}/v1`;
  DEFAULT_MODEL = CFG.model || 'llama3.2';
}

let currentModel = process.env.AI_MODEL || DEFAULT_MODEL;
let workDir      = process.env.AI_WORKDIR || process.cwd();
const history    = [];
const MAX_HIST   = 30;

// ════════════════════════════════════════════════════════
// SPINNER
// ════════════════════════════════════════════════════════
const SPIN = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
let _spinTimer = null, _spinFrame = 0;

function startSpinner(msg = 'Thinking') {
  if (!process.stdout.isTTY) return;
  _spinFrame = 0;
  process.stdout.write('\n');
  _spinTimer = setInterval(() => {
    process.stdout.write(
      `\r  ${C.brand(SPIN[_spinFrame++ % SPIN.length])} ${C.dim(msg + '...')}   `
    );
  }, 80);
}
function stopSpinner() {
  if (!_spinTimer) return;
  clearInterval(_spinTimer);
  _spinTimer = null;
  process.stdout.write('\r' + ' '.repeat(60) + '\r');
}

// ════════════════════════════════════════════════════════
// TERMINAL UI
// ════════════════════════════════════════════════════════
const W = () => Math.min((process.stdout.columns || 80) - 4, 80);

function _stripAnsi(s) { return s.replace(/\x1b\[[0-9;]*m/g, ''); }
function _pad(line, width) {
  const len = _stripAnsi(line).length;
  return line + ' '.repeat(Math.max(0, width - len));
}

function drawBox(title, lines, color = C.brand) {
  const w = W();
  const tClean = _stripAnsi(title);
  const dash   = '─'.repeat(Math.max(1, w - tClean.length - 4));
  console.log('\n' + color(`┌─ ${title} ${dash}┐`));
  for (const line of lines) {
    console.log(color('│ ') + _pad(line, w - 2) + color(' │'));
  }
  console.log(color(`└${'─'.repeat(w)}┘`) + '\n');
}

function drawCodeBox(lang, code, title) {
  const w     = W();
  const label = title || lang || 'code';
  const lClean = _stripAnsi(label);
  const dash  = '─'.repeat(Math.max(1, w - lClean.length - 4));
  console.log(C.code(`┌─ ${label} ${dash}┐`));
  code.split('\n').forEach((line, i) => {
    const num = C.dim(String(i + 1).padStart(3) + ' │ ');
    console.log(C.code('│') + num + _pad(C.white(line), w - 6) + C.code('│'));
  });
  console.log(C.code(`└${'─'.repeat(w)}┘`));
}

function drawOutputBox(label, output, exitCode) {
  const w      = W();
  const status = exitCode === 0 ? C.ok('✓ ok') : C.err(`✗ exit ${exitCode}`);
  const color  = exitCode === 0 ? C.ok : C.err;
  const title  = `${C.bold(label)}  ${status}`;
  const tClean = _stripAnsi(title);
  const dash   = '─'.repeat(Math.max(1, w - tClean.length - 2));
  console.log('\n' + color(`┌─ ${title} ${dash}┐`));
  const lines = output ? output.split('\n') : [];
  if (!lines.length || !output.trim()) {
    console.log(color('│ ') + _pad(C.dim('(no output)'), w - 2) + color(' │'));
  } else {
    lines.slice(0, 50).forEach(line => {
      console.log(color('│ ') + _pad(C.out(line), w - 2) + color(' │'));
    });
    if (lines.length > 50) {
      const more = `… +${lines.length - 50} more lines`;
      console.log(color('│ ') + _pad(C.dim(more), w - 2) + color(' │'));
    }
  }
  console.log(color(`└${'─'.repeat(w)}┘`) + '\n');
}

function drawProgress(label, step, total) {
  const w    = W() - 20;
  const pct  = Math.round((step / total) * 100);
  const fill = Math.round((step / total) * w);
  const bar  = C.ok('█'.repeat(fill)) + C.dim('░'.repeat(w - fill));
  process.stdout.write(`\r  ${C.dim(label)}  [${bar}]  ${C.bold(pct + '%')}  `);
  if (step >= total) process.stdout.write('\n');
}

// ── AI text renderer with code blocks ──────────────────
function renderText(text) {
  if (!text.trim()) return;
  const parts = text.split(/(```[\s\S]*?```)/g);
  for (const part of parts) {
    if (part.startsWith('```')) {
      const inner = part.slice(3, -3);
      const nl    = inner.indexOf('\n');
      const lang  = nl >= 0 ? inner.slice(0, nl).trim() : '';
      const code  = nl >= 0 ? inner.slice(nl + 1) : inner;
      console.log('');
      drawCodeBox(lang, code);
      console.log('');
    } else {
      const fmt = part
        .replace(/`([^`\n]+)`/g,  (_, c) => C.code(c))
        .replace(/\*\*([^*]+)\*\*/g, (_, t) => C.bold(t))
        .replace(/^(#{1,3} .+)$/gm, (_, t) => C.bold(C.info(t)));
      for (const line of fmt.split('\n')) {
        console.log(line.trim() ? '  ' + line : '');
      }
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
    const lang = extname(path).slice(1) || 'text';
    drawCodeBox(lang, content, `writing → ${basename(path)}`);
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
    const raw  = readFileSync(abs, 'utf8');
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
  console.log('\n  ' + C.info('📁 list  : ') + C.bold(path));
  try {
    const entries = readdirSync(abs).map(name => ({
      name,
      isDir: statSync(join(abs, name)).isDirectory(),
    }));
    const lines = entries.slice(0, 80).map(e =>
      e.isDir
        ? C.info('  📁 ') + C.bold(e.name + '/')
        : C.file('  📄 ') + e.name
    );
    drawBox(`${path} (${entries.length} items)`, lines.length ? lines : [C.dim('(empty)')], C.info);
    return { success: true, entries: entries.map(e => e.name + (e.isDir ? '/' : '')) };
  } catch (e) {
    console.log('  ' + C.err('✗ ') + e.message + '\n');
    return { success: false, error: e.message };
  }
}

function toolMakeDir(path) {
  const abs = resolve(workDir, path);
  try {
    mkdirSync(abs, { recursive: true });
    console.log('\n  ' + C.ok('✓ mkdir ') + C.dim(path) + '\n');
    return { success: true };
  } catch (e) {
    console.log('\n  ' + C.err('✗ ') + e.message + '\n');
    return { success: false, error: e.message };
  }
}

function toolDeleteFile(path) {
  const abs = resolve(workDir, path);
  try {
    unlinkSync(abs);
    console.log('\n  ' + C.warn('🗑  deleted: ') + C.dim(path) + '\n');
    return { success: true };
  } catch (e) {
    console.log('\n  ' + C.err('✗ ') + e.message + '\n');
    return { success: false, error: e.message };
  }
}

function toolMoveFile(from, to) {
  const src = resolve(workDir, from);
  const dst = resolve(workDir, to);
  try {
    mkdirSync(dirname(dst), { recursive: true });
    renameSync(src, dst);
    console.log('\n  ' + C.ok('↔  moved: ') + C.dim(`${from} → ${to}`) + '\n');
    return { success: true };
  } catch (e) {
    console.log('\n  ' + C.err('✗ ') + e.message + '\n');
    return { success: false, error: e.message };
  }
}

function toolRunShell(command, description) {
  console.log('\n  ' + C.cmd('⚡ run: ') + C.bold(command));
  if (description) console.log('  ' + C.dim('   ' + description));
  return new Promise(res => {
    const start = Date.now();
    let out = '', frame = 0;
    const spin = setInterval(() => {
      const t = ((Date.now() - start) / 1000).toFixed(1);
      process.stdout.write(`\r  ${C.cmd(SPIN[frame++ % SPIN.length])} ${C.dim(`running… ${t}s`)}   `);
    }, 80);
    const proc = spawn('sh', ['-c', command], {
      cwd: workDir,
      env: { ...process.env, TERM: 'xterm-256color', FORCE_COLOR: '1' },
    });
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { out += d.toString(); });
    proc.on('close', code => {
      clearInterval(spin);
      process.stdout.write('\r' + ' '.repeat(60) + '\r');
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);
      const shortCmd = command.slice(0, 40) + (command.length > 40 ? '…' : '');
      drawOutputBox(`${shortCmd}  (${elapsed}s)`, out.trim(), code ?? 0);
      res({ success: code === 0, exitCode: code ?? 0, output: out.trim() });
    });
    proc.on('error', e => {
      clearInterval(spin);
      process.stdout.write('\r' + ' '.repeat(60) + '\r');
      console.log('  ' + C.err('✗ spawn: ') + e.message + '\n');
      res({ success: false, exitCode: -1, output: e.message });
    });
  });
}

// ── Parse & execute tool calls from AI response ─────────
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
    } catch (e) {
      console.log(C.err(`  ✗ tool error: ${e.message}\n`));
    }
  }
  const tail = text.slice(lastIdx).trim();
  if (tail) renderText(tail);
}

// ════════════════════════════════════════════════════════
// AI PROVIDERS  (all OpenAI-compatible streaming)
// ════════════════════════════════════════════════════════
async function streamChat(messages) {
  const headers = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;

  const r = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model:    currentModel,
      messages,
      stream:   true,
      temperature: 0.7,
      max_tokens:  8192,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    throw new Error(`${PROVIDER} ${r.status}: ${txt.slice(0, 200)}`);
  }

  let full = '';
  const reader  = r.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const obj = JSON.parse(data);
        full += obj.choices?.[0]?.delta?.content ?? '';
      } catch {}
    }
  }
  return full;
}

// ── Check Ollama availability ───────────────────────────
async function checkOllama() {
  try {
    const r = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return { ok: false };
    const d = await r.json();
    return { ok: true, models: (d.models || []).map(m => m.name) };
  } catch { return { ok: false }; }
}

// ════════════════════════════════════════════════════════
// SYSTEM PROMPT  — makes AI think + act like a senior dev
// ════════════════════════════════════════════════════════
const SYSTEM_PROMPT = `You are amznon-ai — an elite AI coding assistant and developer, created by Md Jamil Islam.
You are running inside a real terminal on the user's machine.
You have the ability to perform actual file operations and run real shell commands.

LANGUAGE: Always reply in the same language the user writes in (Bangla or English).

YOUR PERSONALITY:
- Think like a senior developer from a top tech company
- Be precise, confident, and action-oriented
- Write complete, working, production-quality code
- Explain what you are doing, then do it
- If something fails, analyse the error and fix it

YOUR TOOLS — use these to take real action:
When you need to create/edit files, run code, or manage the filesystem, output tool calls
in this exact format (one JSON object between the markers per call):

<<<TOOL>>>
{"tool":"write_file","path":"src/index.js","content":"// your code here"}
<<<END>>>

<<<TOOL>>>
{"tool":"run_shell","command":"node src/index.js","description":"Run the script"}
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

RULES FOR USING TOOLS:
1. Always briefly explain the plan before issuing tool calls
2. Issue tool calls one by one — they execute in order and results are shown to the user
3. After run_shell, the output is displayed — analyse it and respond
4. Write COMPLETE code — no "TODO", no "...", no placeholders
5. For multi-file projects, create all files in logical order
6. If a command fails, fix the issue and retry

CODING STANDARDS:
- Use modern syntax (ES2022+, Python 3.10+, etc.)
- Add proper error handling
- Write clean, commented code only when needed
- Follow industry best practices`;

// ════════════════════════════════════════════════════════
// CHAT
// ════════════════════════════════════════════════════════
async function chat(userMsg) {
  history.push({ role: 'user', content: userMsg });

  // Keep history within limits
  while (history.length > MAX_HIST) history.shift();

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
  ];

  startSpinner('amznon-ai thinking');
  let reply;
  try {
    reply = await streamChat(messages);
    stopSpinner();
  } catch (e) {
    stopSpinner();
    console.log('\n  ' + C.err('✗ ') + e.message);
    if (PROVIDER === 'ollama') {
      console.log('  ' + C.dim('Make sure Ollama is running: ') + C.cmd('ollama serve'));
      console.log('  ' + C.dim('Pull a model: ') + C.cmd(`ollama pull ${currentModel}`));
    }
    console.log('  ' + C.dim('Type /setup to change provider\n'));
    history.pop();
    return;
  }

  if (!reply?.trim()) {
    stopSpinner();
    console.log('\n  ' + C.warn('⚠ Empty response from AI. Try again.\n'));
    history.pop();
    return;
  }

  console.log('\n' + C.brand('  amznon-ai') + C.dim(' ▸'));
  await runToolCalls(reply);
  history.push({ role: 'assistant', content: reply });
}

// ════════════════════════════════════════════════════════
// SETUP WIZARD
// ════════════════════════════════════════════════════════
async function runSetup() {
  const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask  = q => new Promise(r => rl2.question(q, r));

  console.log('\n' + C.brand('  ╔═══════════════════════════════════════╗'));
  console.log(C.brand('  ║') + C.bold('    amznon-ai Setup Wizard           ') + C.brand('║'));
  console.log(C.brand('  ╚═══════════════════════════════════════╝\n'));

  console.log(C.info('  Pick a FREE AI provider:\n'));
  console.log('  ' + C.bold('1') + C.dim('  Groq   ') + C.ok('(RECOMMENDED)') + C.dim(' — llama-3.3-70b, super fast, 14k req/day free'));
  console.log('     ' + C.dim('Sign up → ') + C.info('https://console.groq.com'));
  console.log('');
  console.log('  ' + C.bold('2') + C.dim('  Gemini ') + C.dim(' — gemini-1.5-flash, 1500 req/day free'));
  console.log('     ' + C.dim('Sign up → ') + C.info('https://aistudio.google.com'));
  console.log('');
  console.log('  ' + C.bold('3') + C.dim('  Ollama ') + C.dim(' — 100% local, no internet, no key needed'));
  console.log('     ' + C.dim('Install → ') + C.info('https://ollama.com'));
  console.log('');

  const choice = (await ask('  ' + C.brand('Pick (1/2/3): '))).trim();
  let patch = {};

  if (choice === '1') {
    const key = (await ask('  ' + C.dim('Paste your Groq API key: '))).trim();
    if (key) { patch = { groq_key: key, provider: 'groq', model: 'llama-3.3-70b-versatile' }; }
  } else if (choice === '2') {
    const key = (await ask('  ' + C.dim('Paste your Gemini API key: '))).trim();
    if (key) { patch = { gemini_key: key, provider: 'gemini', model: 'gemini-1.5-flash' }; }
  } else if (choice === '3') {
    const host = (await ask(`  ${C.dim('Ollama host')} [${OLLAMA}]: `)).trim() || OLLAMA;
    const model = (await ask(`  ${C.dim('Model')} [llama3.2]: `)).trim() || 'llama3.2';
    patch = { ollama_host: host, provider: 'ollama', model };
  }

  const modelOverride = (await ask(`  ${C.dim('Override model')} [${patch.model || currentModel}]: `)).trim();
  if (modelOverride) patch.model = modelOverride;

  rl2.close();

  if (Object.keys(patch).length) {
    saveConfig(patch);
    console.log('\n  ' + C.ok('✓ Saved to ~/.amznon_config.json'));
    console.log('  ' + C.dim('Restart with: ') + C.cmd('node index.js') + '\n');
  } else {
    console.log('\n  ' + C.warn('No changes saved.\n'));
  }
  process.exit(0);
}

// ════════════════════════════════════════════════════════
// WEB UI  — for phone without Termux (browser chat)
// ════════════════════════════════════════════════════════
function startWebUI(port = 3000) {
  const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>amznon-ai</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#1a1915;color:#abb2bf;font-family:'JetBrains Mono',monospace,sans-serif;height:100dvh;display:flex;flex-direction:column}
#header{background:#23221e;padding:12px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #333}
#header h1{font-size:16px;color:#CC785C;font-weight:700}
#header span{font-size:11px;color:#666}
#messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.msg{max-width:88%;padding:10px 14px;border-radius:10px;font-size:13px;line-height:1.6;white-space:pre-wrap;word-break:break-word}
.user{align-self:flex-end;background:#CC785C22;border:1px solid #CC785C55;color:#e8d5c8}
.ai{align-self:flex-start;background:#23221e;border:1px solid #333;color:#abb2bf}
.ai code{background:#1a1915;padding:2px 6px;border-radius:4px;color:#c678dd;font-size:12px}
.ai pre{background:#1a1915;padding:10px;border-radius:6px;overflow-x:auto;border-left:3px solid #CC785C;margin:8px 0}
.ai pre code{background:none;padding:0;color:#98c379}
.tool-call{background:#1a1915;border:1px solid #56b6c255;border-radius:8px;padding:8px 12px;margin:6px 0;font-size:11px}
.tool-call .label{color:#56b6c2;font-weight:700;margin-bottom:4px}
.tool-call .detail{color:#888}
.status{font-size:11px;color:#CC785C;display:flex;align-items:center;gap:6px}
.dot{width:7px;height:7px;border-radius:50%;background:#98c379}
.dot.busy{background:#e5c07b;animation:pulse 1s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
#bottom{background:#23221e;border-top:1px solid #333;padding:10px 12px;display:flex;gap:8px}
#inp{flex:1;background:#1a1915;border:1px solid #444;border-radius:8px;padding:10px 14px;color:#e0d9d1;font-size:14px;font-family:inherit;resize:none;outline:none}
#inp:focus{border-color:#CC785C}
#send{background:#CC785C;border:none;border-radius:8px;padding:10px 18px;color:#fff;font-weight:700;cursor:pointer;font-size:14px}
#send:disabled{background:#555;cursor:not-allowed}
.thinking{color:#666;font-style:italic;font-size:13px;align-self:flex-start}
</style>
</head>
<body>
<div id="header">
  <div><h1>amznon-ai</h1><span>by Md Jamil Islam</span></div>
  <div style="margin-left:auto" class="status"><div class="dot" id="dot"></div><span id="prov">${PROVIDER} · ${currentModel}</span></div>
</div>
<div id="messages">
  <div class="msg ai">👋 Hello! I'm <strong>amznon-ai</strong> — your personal coding AI.<br>Ask me anything. I can write code, create files, and run commands.</div>
</div>
<div id="bottom">
  <textarea id="inp" rows="1" placeholder="Ask me anything… (Shift+Enter for new line)"></textarea>
  <button id="send">Send</button>
</div>
<script>
const msgs = document.getElementById('messages');
const inp  = document.getElementById('inp');
const btn  = document.getElementById('send');
const dot  = document.getElementById('dot');

function addMsg(role, text) {
  const d = document.createElement('div');
  d.className = 'msg ' + role;
  if (role === 'ai') {
    // render basic markdown
    let html = text
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/<<<TOOL>>>([\s\S]*?)<<<END>>>/g, (_, tc) => {
        try {
          const t = JSON.parse(tc.trim());
          return \`<div class="tool-call"><div class="label">⚡ \${t.tool}</div><div class="detail">\${t.path||t.command||''}</div></div>\`;
        } catch { return ''; }
      })
      .replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, (_, c) => \`<pre><code>\${c}</code></pre>\`)
      .replace(/\`([^\`\\n]+)\`/g, (_, c) => \`<code>\${c}</code>\`)
      .replace(/\\*\\*([^*]+)\\*\\*/g, (_, t) => \`<strong>\${t}</strong>\`);
    d.innerHTML = html;
  } else {
    d.textContent = text;
  }
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
  return d;
}

async function send() {
  const text = inp.value.trim();
  if (!text) return;
  inp.value = ''; inp.style.height = 'auto';
  btn.disabled = true; dot.className = 'dot busy';
  addMsg('user', text);
  const thinking = document.createElement('div');
  thinking.className = 'thinking'; thinking.textContent = '⠋ thinking…';
  msgs.appendChild(thinking);
  let frame = 0;
  const sp = setInterval(() => { thinking.textContent = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'][frame++%10] + ' thinking…'; }, 80);
  try {
    const r = await fetch('/chat', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({message: text}),
    });
    const d = await r.json();
    clearInterval(sp); thinking.remove();
    addMsg('ai', d.reply || d.error || 'No response');
  } catch(e) {
    clearInterval(sp); thinking.remove();
    addMsg('ai', '✗ Error: ' + e.message);
  }
  btn.disabled = false; dot.className = 'dot';
  msgs.scrollTop = msgs.scrollHeight;
}

btn.addEventListener('click', send);
inp.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  setTimeout(() => { inp.style.height = 'auto'; inp.style.height = inp.scrollHeight + 'px'; }, 0);
});
</script>
</body>
</html>`;

  const server = createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(HTML);
      return;
    }
    if (req.method === 'POST' && req.url === '/chat') {
      let body = '';
      req.on('data', d => { body += d; });
      req.on('end', async () => {
        try {
          const { message } = JSON.parse(body);
          history.push({ role: 'user', content: message });
          while (history.length > MAX_HIST) history.shift();
          const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...history];
          const reply = await streamChat(messages).catch(e => {
            history.pop();
            return `Error: ${e.message}`;
          });
          if (!reply.startsWith('Error:')) history.push({ role: 'assistant', content: reply });
          // also execute tools on server side
          runToolCalls(reply).catch(() => {});
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ reply }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }
    res.writeHead(404); res.end();
  });

  server.listen(port, '0.0.0.0', () => {
    const localIP = (() => {
      try {
        return execSync("ip route get 1 | awk '{print $7; exit}'", { encoding: 'utf8' }).trim();
      } catch {
        return 'YOUR_IP';
      }
    })();
    console.log('');
    drawBox('Web UI Started', [
      C.ok('✓') + C.dim('  Local  : ') + C.info(`http://localhost:${port}`),
      C.ok('✓') + C.dim('  Mobile : ') + C.info(`http://${localIP}:${port}`),
      '',
      C.dim('  Open the mobile link on your phone (same WiFi)'),
      C.dim('  Press Ctrl+C to stop'),
    ]);
  });
}

// ════════════════════════════════════════════════════════
// COMMANDS
// ════════════════════════════════════════════════════════
async function handleCommand(raw) {
  const parts = raw.trim().split(/\s+/);
  const cmd   = parts[0].slice(1).toLowerCase();   // strip leading /
  const args  = parts.slice(1);

  switch (cmd) {
    case 'help': {
      drawBox('amznon-ai — Commands', [
        C.info('/help') + C.dim('                  — this help'),
        C.info('/setup') + C.dim('                 — change AI provider / API key'),
        C.info('/status') + C.dim('                — show provider + model info'),
        C.info('/model <name>') + C.dim('          — switch model mid-session'),
        C.info('/models') + C.dim('                — list models (Ollama only)'),
        C.info('/clear') + C.dim('                 — clear screen'),
        C.info('/history') + C.dim('               — show conversation history'),
        C.info('/clear-history') + C.dim('         — wipe memory'),
        C.info('/cd <path>') + C.dim('             — change working directory'),
        C.info('/pwd') + C.dim('                   — show working dir'),
        C.info('/ls [path]') + C.dim('             — list files'),
        C.info('/run <cmd>') + C.dim('             — run shell command'),
        C.info('/web [port]') + C.dim('            — start browser UI (for phone)'),
        C.info('/save') + C.dim('                  — save session'),
        C.info('/ctx') + C.dim('                   — show context size'),
        C.info('/exit') + C.dim('                  — quit'),
      ]);
      return true;
    }

    case 'setup':
      await runSetup();
      return true;

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
        lines.push(C.dim('  ollama   : ') + (s.ok ? C.ok('running') : C.err('not running')));
      }
      drawBox('Status', lines);
      return true;
    }

    case 'model': {
      if (!args[0]) {
        console.log('\n  ' + C.dim('Current: ') + C.info(currentModel) + '\n');
      } else {
        currentModel = args[0];
        saveConfig({ model: currentModel });
        console.log('\n  ' + C.ok('✓ model → ') + C.info(currentModel) + '\n');
      }
      return true;
    }

    case 'models': {
      if (PROVIDER !== 'ollama') {
        console.log('\n  ' + C.dim('/models only shows local Ollama models. You are using: ') + C.info(PROVIDER) + '\n');
        return true;
      }
      const s = await checkOllama();
      if (!s.ok) {
        console.log('\n  ' + C.err('✗ Ollama not running\n'));
      } else if (!s.models?.length) {
        console.log('\n  ' + C.warn('No models. Pull one: ') + C.cmd('ollama pull llama3.2') + '\n');
      } else {
        drawBox('Ollama Models', s.models.map(m =>
          (m === currentModel ? C.ok('▶ ') : C.dim('  ')) + C.info(m)
        ));
      }
      return true;
    }

    case 'clear':
      console.clear();
      printBanner();
      return true;

    case 'history': {
      if (!history.length) {
        console.log(C.dim('\n  (no history yet)\n'));
      } else {
        console.log('');
        history.forEach((m, i) => {
          const who = m.role === 'user' ? C.brand('you') : C.accent(' ai');
          const pre = m.content.replace(/\n/g, ' ').slice(0, 90);
          console.log('  ' + who + C.dim(` [${i}] `) + pre + (m.content.length > 90 ? C.dim('…') : ''));
        });
        console.log('');
      }
      return true;
    }

    case 'clear-history':
      history.length = 0;
      console.log('\n  ' + C.ok('✓ History cleared\n'));
      return true;

    case 'cd': {
      const target = args.join(' ') || homedir();
      try {
        const abs = resolve(workDir, target);
        process.chdir(abs);
        workDir = abs;
        console.log('\n  ' + C.ok('✓ workdir → ') + C.file(workDir) + '\n');
      } catch (e) {
        console.log('\n  ' + C.err('✗ ') + e.message + '\n');
      }
      return true;
    }

    case 'pwd':
      console.log('\n  ' + C.file(workDir) + '\n');
      return true;

    case 'ls':
      toolListFiles(args[0] || '.');
      return true;

    case 'run': {
      const c = args.join(' ');
      if (c) await toolRunShell(c);
      else   console.log('\n  ' + C.warn('Usage: /run <command>\n'));
      return true;
    }

    case 'web': {
      const port = parseInt(args[0]) || 3000;
      startWebUI(port);
      return true;
    }

    case 'save': {
      const fname = join(workDir, `amznon_session_${Date.now()}.json`);
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
      console.log(C.dim('\nbye 👋\n'));
      process.exit(0);
  }

  console.log('\n  ' + C.warn(`Unknown: /${cmd}`) + C.dim('  (type /help)\n'));
  return true;
}

// ════════════════════════════════════════════════════════
// BANNER
// ════════════════════════════════════════════════════════
function printBanner() {
  const w = Math.min(W(), 56);
  const providerBadge = {
    groq:   C.ok(' GROQ '),
    gemini: C.info(' GEMINI '),
    openai: C.info(' OPENAI '),
    ollama: C.warn(' OLLAMA '),
  }[PROVIDER] || C.dim(' UNKNOWN ');

  console.log('');
  console.log(C.brand('  ╔' + '═'.repeat(w) + '╗'));
  console.log(C.brand('  ║') + '  ' + C.bold('amznon') + C.brand.bold('-') + C.bold('ai') +
    C.dim('  Advanced Coding AI') + ' '.repeat(Math.max(1, w - 26)) + C.brand('║'));
  console.log(C.brand('  ║') + '  ' + C.dim('by Md Jamil Islam') +
    ' '.repeat(Math.max(1, w - 19)) + C.brand('║'));
  console.log(C.brand('  ╚' + '═'.repeat(w) + '╝'));
  console.log('');
  console.log('  ' + providerBadge + C.dim(' · ') + C.info(currentModel));
  console.log('  ' + C.dim('workdir: ') + C.file(workDir));
  console.log('');
  console.log(C.dim('  /help · /setup · /web · /exit'));
  console.log('');
}

// ════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════

// Handle CLI flags
if (process.argv.includes('--setup')) { await runSetup(); process.exit(0); }
if (process.argv.includes('--web')) {
  const pi = process.argv.indexOf('--web');
  startWebUI(parseInt(process.argv[pi + 1]) || 3000);
  // keep alive
  await new Promise(() => {});
}

printBanner();

// First-run hint
if (!GROQ_KEY && !GEMINI_KEY && !OPENAI_KEY) {
  const s = await checkOllama();
  if (!s.ok) {
    drawBox('Quick Setup', [
      C.warn('⚠  No AI provider configured.'),
      '',
      C.dim('  Fastest free option → Groq (14 000 req/day):'),
      '  1. ' + C.info('https://console.groq.com') + C.dim(' → sign up → API Keys'),
      '  2. ' + C.cmd('node index.js --setup') + C.dim(' → choose Groq → paste key'),
      '',
      C.dim('  OR for fully offline: install Ollama + run ') + C.cmd('ollama serve'),
    ], C.warn);
  }
}

const rl = readline.createInterface({
  input:    process.stdin,
  output:   process.stdout,
  terminal: true,
  prompt:   '\n' + C.brand('  you') + C.dim(' › '),
});

rl.prompt();

rl.on('line', async line => {
  const input = line.trim();
  if (!input)            { rl.prompt(); return; }
  if (input.startsWith('/')) {
    await handleCommand(input);
    rl.prompt();
    return;
  }
  rl.pause();
  await chat(input);
  rl.resume();
  rl.prompt();
});

rl.on('close', () => {
  console.log(C.dim('\nbye 👋\n'));
  process.exit(0);
});

