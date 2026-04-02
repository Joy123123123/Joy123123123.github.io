#!/usr/bin/env node
/**
 * amznon-ai — Advanced Terminal Coding AI
 * by Md Jamil Islam
 *
 * Completely FREE — uses Ollama (local LLM, no API key needed)
 *
 * Requirements:
 *   - Node.js 18+
 *   - Ollama  →  https://ollama.com
 *
 * Quick start:
 *   ollama serve
 *   ollama pull llama3.2
 *   node index.js
 *
 * Termux (connect to Ollama on your PC via LAN):
 *   export OLLAMA_HOST=http://192.168.x.x:11434
 *   node index.js
 */

import readline  from 'readline';
import { spawn } from 'child_process';
import {
  writeFileSync, readFileSync, existsSync,
  mkdirSync, readdirSync, statSync,
} from 'fs';
import { join, dirname, extname, resolve, basename } from 'path';
import { homedir } from 'os';

// ── chalk (ESM, graceful fallback) ─────────────────────
const chalk = await import('chalk').then(m => m.default).catch(() => {
  const id = s => s;
  const stub = new Proxy(id, { get: () => stub });
  return stub;
});

// ── Colour palette ─────────────────────────────────────
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
};

// ── Config ──────────────────────────────────────────────
const OLLAMA_BASE   = process.env.OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.AI_MODEL    || 'llama3.2';
const MAX_HISTORY   = 40;

let currentModel = DEFAULT_MODEL;
let workDir      = process.cwd();
const history    = [];   // { role, content }[]

// ── Spinner frames ──────────────────────────────────────
const SPIN = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
let spinTimer = null, spinFrame = 0;
function startSpinner(msg = 'Thinking') {
  if (!process.stdout.isTTY) return;
  spinFrame = 0;
  process.stdout.write('\n');
  spinTimer = setInterval(() => {
    process.stdout.write(`\r  ${C.brand(SPIN[spinFrame++ % SPIN.length])} ${C.dim(msg + '...')}   `);
  }, 80);
}
function stopSpinner() {
  if (!spinTimer) return;
  clearInterval(spinTimer);
  spinTimer = null;
  process.stdout.write('\r' + ' '.repeat(50) + '\r');
}

// ── Terminal width helper ───────────────────────────────
const W = () => Math.min((process.stdout.columns || 80) - 4, 78);

// ── Box drawing helpers ─────────────────────────────────
function drawBox(title, lines, color = C.brand) {
  const w = W();
  const titleClean = title.replace(/\x1b\[[0-9;]*m/g, '');
  const dashes = '─'.repeat(Math.max(0, w - titleClean.length - 4));
  console.log('\n' + color(`┌─ ${title} ${dashes}┐`));
  for (const line of lines) {
    const clean = line.replace(/\x1b\[[0-9;]*m/g, '');
    const pad   = ' '.repeat(Math.max(0, w - clean.length - 2));
    console.log(color('│ ') + line + pad + color(' │'));
  }
  console.log(color(`└${'─'.repeat(w)}┘`) + '\n');
}

function drawCodeBox(lang, code, title) {
  const w     = W();
  const label = title || lang || 'code';
  const dash  = '─'.repeat(Math.max(0, w - label.length - 4));
  console.log(C.code(`┌─ ${label} ${dash}┐`));
  code.split('\n').forEach((line, i) => {
    const num   = C.dim(String(i + 1).padStart(3) + ' │ ');
    const clean = line.replace(/\x1b\[[0-9;]*m/g, '');
    const pad   = ' '.repeat(Math.max(0, w - clean.length - 7));
    console.log(C.code('│') + num + C.white(line) + pad + C.code('│'));
  });
  console.log(C.code(`└${'─'.repeat(w)}┘`));
}

function drawOutputBox(label, output, exitCode) {
  const w      = W();
  const status = exitCode === 0 ? C.ok('✓ ok') : C.err(`✗ exit ${exitCode}`);
  const title  = `${label}  ${status}`;
  const tClean = title.replace(/\x1b\[[0-9;]*m/g, '');
  const color  = exitCode === 0 ? C.ok : C.err;
  const dash   = '─'.repeat(Math.max(0, w - tClean.length - 2));
  console.log('\n' + color(`┌─ ${title} ${dash}┐`));
  const lines = output.split('\n');
  if (!output.trim()) {
    lines[0] = C.dim('(no output)');
  }
  const shown = lines.slice(0, 40);
  for (const line of shown) {
    const clean = line.replace(/\x1b\[[0-9;]*m/g, '');
    const pad   = ' '.repeat(Math.max(0, w - clean.length - 2));
    console.log(color('│ ') + C.out(line) + pad + color(' │'));
  }
  if (lines.length > 40) {
    const more = `… +${lines.length - 40} more lines`;
    console.log(color('│ ') + C.dim(more) + ' '.repeat(Math.max(0, w - more.length - 2)) + color(' │'));
  }
  console.log(color(`└${'─'.repeat(w)}┘`) + '\n');
}

// ── AI text renderer ────────────────────────────────────
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
        .replace(/`([^`\n]+)`/g, (_, c) => C.code(c))
        .replace(/\*\*([^*]+)\*\*/g, (_, t) => C.bold(t))
        .replace(/\*([^*\n]+)\*/g, (_, t) => C.dim(t));
      for (const line of fmt.split('\n')) {
        console.log(line.trim() ? '  ' + line : '');
      }
    }
  }
}

// ════════════════════════════════════════════════════════
// TOOL IMPLEMENTATIONS
// ════════════════════════════════════════════════════════

function toolWriteFile(path, content) {
  const abs = resolve(workDir, path);
  const dir = dirname(abs);
  console.log('\n  ' + C.file('📄 Creating: ') + C.bold(path));
  try {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const lang = extname(path).slice(1) || 'text';
    drawCodeBox(lang, content, `writing → ${path}`);
    writeFileSync(abs, content, 'utf8');
    console.log('  ' + C.ok('✓ ') + C.dim('saved → ') + C.file(abs) + '\n');
    return { success: true, path: abs };
  } catch (e) {
    console.log('  ' + C.err('✗ ') + e.message + '\n');
    return { success: false, error: e.message };
  }
}

function toolReadFile(path) {
  const abs = resolve(workDir, path);
  console.log('\n  ' + C.info('📖 Reading: ') + C.bold(path));
  try {
    const content = readFileSync(abs, 'utf8');
    const preview = content.length > 4000 ? content.slice(0, 4000) + '\n…(truncated)' : content;
    drawCodeBox(extname(path).slice(1) || 'text', preview, `reading ← ${path}`);
    return { success: true, content };
  } catch (e) {
    console.log('  ' + C.err('✗ ') + e.message + '\n');
    return { success: false, error: e.message };
  }
}

function toolListFiles(path = '.') {
  const abs = resolve(workDir, path);
  console.log('\n  ' + C.info('📁 Listing: ') + C.bold(path));
  try {
    const entries = readdirSync(abs).map(name => {
      const isDir = statSync(join(abs, name)).isDirectory();
      return { name, isDir };
    });
    const lines = entries.slice(0, 60).map(e =>
      e.isDir
        ? C.info('  📁 ') + C.bold(e.name + '/')
        : C.file('  📄 ') + e.name
    );
    drawBox(`files in ${path}`, lines.length ? lines : [C.dim('(empty)')], C.info);
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
    console.log('\n  ' + C.ok('✓ ') + C.dim('Created dir: ') + C.file(path) + '\n');
    return { success: true };
  } catch (e) {
    console.log('\n  ' + C.err('✗ ') + e.message + '\n');
    return { success: false, error: e.message };
  }
}

function toolRunShell(command, description) {
  console.log('\n  ' + C.cmd('⚡ Run: ') + C.bold(command));
  if (description) console.log('  ' + C.dim('   ' + description));
  return new Promise(res => {
    const start = Date.now();
    let out = '';
    let frame = 0;
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
      process.stdout.write('\r' + ' '.repeat(50) + '\r');
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);
      drawOutputBox(`${command.slice(0, 36)}  (${elapsed}s)`, out.trim(), code ?? 0);
      res({ success: code === 0, exitCode: code ?? 0, output: out.trim() });
    });
    proc.on('error', e => {
      clearInterval(spin);
      process.stdout.write('\r' + ' '.repeat(50) + '\r');
      console.log('  ' + C.err('✗ spawn error: ') + e.message + '\n');
      res({ success: false, exitCode: -1, output: e.message });
    });
  });
}

// ── Tool call parser + executor ─────────────────────────
async function runToolCalls(text) {
  const re = /<<<TOOL>>>([\s\S]*?)<<<END>>>/g;
  let lastIdx = 0, m;
  while ((m = re.exec(text)) !== null) {
    const before = text.slice(lastIdx, m.index).trim();
    if (before) renderText(before);
    lastIdx = m.index + m[0].length;
    try {
      const tc = JSON.parse(m[1].trim());
      switch (tc.tool) {
        case 'write_file': await toolWriteFile(tc.path, tc.content);  break;
        case 'run_shell':  await toolRunShell(tc.command, tc.description); break;
        case 'read_file':  toolReadFile(tc.path);  break;
        case 'list_files': toolListFiles(tc.path || '.'); break;
        case 'make_dir':   toolMakeDir(tc.path); break;
        default: console.log(C.warn(`  ⚠ unknown tool: ${tc.tool}\n`));
      }
    } catch (e) {
      console.log(C.err(`  ✗ tool parse error: ${e.message}\n`));
    }
  }
  const tail = text.slice(lastIdx).trim();
  if (tail) renderText(tail);
}

// ════════════════════════════════════════════════════════
// OLLAMA
// ════════════════════════════════════════════════════════
async function ollamaStatus() {
  try {
    const r = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    const d = await r.json();
    return { ok: true, models: (d.models || []).map(m => m.name) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function ollamaChat(messages) {
  const r = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: currentModel,
      messages,
      stream: true,
      options: { temperature: 0.7, num_ctx: 8192 },
    }),
  });
  if (!r.ok) throw new Error(`Ollama ${r.status}: ${await r.text()}`);

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
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        full += obj.message?.content ?? '';
      } catch {}
    }
  }
  return full;
}

// ── System prompt ───────────────────────────────────────
const SYSTEM_PROMPT = `You are amznon-ai, an advanced personal coding AI assistant created by Md Jamil Islam.
You run inside a terminal. You are smart, precise, and capable.
You understand Bangla and English — always reply in the same language the user writes in.

CAPABILITIES — you can perform real actions using TOOL CALLS:

When the user asks you to create files, run code, list directories, or execute any command,
output tool calls in this EXACT format (valid JSON between the markers, one call per block):

<<<TOOL>>>
{"tool":"write_file","path":"hello.js","content":"console.log('hi');"}
<<<END>>>

<<<TOOL>>>
{"tool":"run_shell","command":"node hello.js","description":"Run the script"}
<<<END>>>

<<<TOOL>>>
{"tool":"read_file","path":"package.json"}
<<<END>>>

<<<TOOL>>>
{"tool":"list_files","path":"."}
<<<END>>>

<<<TOOL>>>
{"tool":"make_dir","path":"src"}
<<<END>>>

RULES:
1. Always briefly explain what you are about to do before tool calls.
2. Use \`\`\`lang ... \`\`\` fenced blocks when showing code in your explanation text.
3. For multi-step tasks, issue tool calls one after another — they execute in order.
4. After a run_shell result, analyse the output and explain what happened.
5. Write complete, working code — no placeholders, no TODO stubs.
6. If a command fails, explain why and suggest a fix.
7. Keep explanations concise — be a senior dev, not a professor.`;

// ════════════════════════════════════════════════════════
// CHAT
// ════════════════════════════════════════════════════════
async function chat(userMsg) {
  history.push({ role: 'user', content: userMsg });
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-MAX_HISTORY),
  ];

  startSpinner('amznon-ai thinking');
  let reply;
  try {
    reply = await ollamaChat(messages);
    stopSpinner();
  } catch (e) {
    stopSpinner();
    console.log('\n  ' + C.err('✗ ') + e.message);
    console.log('  ' + C.dim('Is Ollama running? Try: ') + C.cmd('ollama serve'));
    console.log('  ' + C.dim('Need a model? Try: ') + C.cmd(`ollama pull ${currentModel}`) + '\n');
    history.pop();
    return;
  }

  console.log('\n' + C.brand('  amznon-ai') + C.dim(' ▸'));
  await runToolCalls(reply);
  history.push({ role: 'assistant', content: reply });
}

// ════════════════════════════════════════════════════════
// BUILT-IN COMMANDS
// ════════════════════════════════════════════════════════
async function handleCommand(raw) {
  const parts = raw.slice(1).trim().split(/\s+/);
  const cmd   = parts[0]?.toLowerCase();
  const args  = parts.slice(1);

  switch (cmd) {
    case 'help': {
      drawBox('amznon-ai — Commands', [
        C.info('/help') + C.dim('                  — this help'),
        C.info('/clear') + C.dim('                 — clear screen'),
        C.info('/history') + C.dim('               — show chat history'),
        C.info('/clear-history') + C.dim('         — wipe history'),
        C.info('/model <name>') + C.dim('          — switch model (e.g. /model llama3.2)'),
        C.info('/models') + C.dim('                — list installed Ollama models'),
        C.info('/status') + C.dim('                — check Ollama connection'),
        C.info('/cd <path>') + C.dim('             — change working directory'),
        C.info('/pwd') + C.dim('                   — show working directory'),
        C.info('/ls [path]') + C.dim('             — list files'),
        C.info('/run <cmd>') + C.dim('             — run a shell command'),
        C.info('/save') + C.dim('                  — save session to JSON'),
        C.info('/exit') + C.dim('                  — quit'),
      ]);
      return true;
    }

    case 'clear':
      console.clear();
      printBanner(null);
      return true;

    case 'history': {
      if (!history.length) {
        console.log(C.dim('\n  (no history yet)\n'));
      } else {
        console.log('');
        history.forEach((m, i) => {
          const who = m.role === 'user' ? C.brand('you') : C.accent('ai');
          const pre = m.content.replace(/\n/g, ' ').slice(0, 100);
          console.log('  ' + who + C.dim(` [${i}] `) + pre + (m.content.length > 100 ? C.dim('…') : ''));
        });
        console.log('');
      }
      return true;
    }

    case 'clear-history':
      history.length = 0;
      console.log('\n  ' + C.ok('✓') + C.dim(' History cleared\n'));
      return true;

    case 'model': {
      if (!args[0]) {
        console.log('\n  ' + C.dim('Current model: ') + C.info(currentModel) + '\n');
      } else {
        currentModel = args[0];
        console.log('\n  ' + C.ok('✓') + C.dim(' Model → ') + C.info(currentModel) + '\n');
      }
      return true;
    }

    case 'models': {
      const s = await ollamaStatus();
      if (!s.ok) {
        console.log('\n  ' + C.err('✗ Ollama not reachable: ') + s.error + '\n');
      } else if (!s.models.length) {
        console.log('\n  ' + C.warn('No models. Pull one: ') + C.cmd('ollama pull llama3.2') + '\n');
      } else {
        drawBox('Installed Models', s.models.map(m =>
          (m === currentModel ? C.ok('▶ ') : C.dim('  ')) + C.info(m)
        ));
      }
      return true;
    }

    case 'status': {
      const s = await ollamaStatus();
      drawBox('Ollama Status',
        s.ok
          ? [
              C.ok('✓') + C.dim('  host  : ') + C.info(OLLAMA_BASE),
              C.ok('✓') + C.dim('  model : ') + C.info(currentModel),
              C.dim('  avail : ') + C.info(s.models.join(', ') || '(none)'),
            ]
          : [
              C.err('✗') + C.dim('  Ollama not running'),
              C.dim('  error : ') + C.err(s.error),
              '',
              C.dim('  fix   : ') + C.cmd('ollama serve'),
              C.dim('  model : ') + C.cmd(`ollama pull ${currentModel}`),
            ],
        s.ok ? C.ok : C.err
      );
      return true;
    }

    case 'cd': {
      const target = args.join(' ') || homedir();
      try {
        const abs = resolve(workDir, target);
        process.chdir(abs);
        workDir = abs;
        console.log('\n  ' + C.ok('✓') + C.dim(' workdir → ') + C.file(workDir) + '\n');
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

    case 'save': {
      const fname = join(workDir, `amznon_session_${Date.now()}.json`);
      writeFileSync(fname, JSON.stringify({ model: currentModel, history }, null, 2));
      console.log('\n  ' + C.ok('✓') + C.dim(' Saved → ') + C.file(fname) + '\n');
      return true;
    }

    case 'exit':
    case 'quit':
      console.log(C.dim('\nbye 👋\n'));
      process.exit(0);
  }

  console.log('\n  ' + C.warn(`Unknown command: /${cmd}`) + C.dim('  (type /help)\n'));
  return true;
}

// ════════════════════════════════════════════════════════
// BANNER
// ════════════════════════════════════════════════════════
function printBanner(status) {
  const w = Math.min(W(), 54);
  console.log('');
  console.log(C.brand('  ╔' + '═'.repeat(w) + '╗'));
  const t1 = '  amznon-ai';
  const t2 = '  Advanced Coding AI  ';
  const pad1 = ' '.repeat(Math.max(1, Math.floor((w - t1.length - 18) / 2)));
  const pad2 = ' '.repeat(Math.max(1, Math.floor((w - t2.length) / 2)));
  console.log(C.brand('  ║') + pad1 + C.bold(t1) + C.dim('  by Md Jamil Islam') + pad1 + C.brand('║'));
  console.log(C.brand('  ║') + pad2 + C.dim(t2) + pad2 + C.brand('║'));
  console.log(C.brand('  ╚' + '═'.repeat(w) + '╝'));
  console.log('');

  if (status === null) {
    // skip (after /clear)
  } else if (status?.ok) {
    console.log(C.ok('  ✓') + C.dim('  Ollama  : ') + C.info('connected'));
    console.log(C.ok('  ✓') + C.dim('  Model   : ') + C.info(currentModel));
    if (status.models.length && !status.models.includes(currentModel)) {
      console.log(C.warn('  ⚠') + C.dim(`  Model "${currentModel}" not found locally.`));
      console.log(C.dim(`     Pull it: `) + C.cmd(`ollama pull ${currentModel}`));
    }
  } else {
    console.log(C.err('  ✗') + C.dim('  Ollama not running'));
    console.log(C.dim('     Start : ') + C.cmd('ollama serve'));
    console.log(C.dim('     Model : ') + C.cmd(`ollama pull ${currentModel}`));
  }

  console.log('');
  console.log(C.dim('  /help for commands · just type to chat · /exit to quit'));
  console.log('');
}

// ════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════
const status = await ollamaStatus();
printBanner(status);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
  prompt: '\n' + C.brand('  you') + C.dim(' › '),
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
