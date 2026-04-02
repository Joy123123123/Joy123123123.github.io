#!/usr/bin/env node
/**
 * amznon-ai — Terminal AI assistant (Claude Code style)
 * Usage:  node index.js [--provider openai|anthropic|openrouter]
 *
 * Set ONE of these env vars before running:
 *   OPENAI_API_KEY       → uses OpenAI  (gpt-4o-mini by default)
 *   ANTHROPIC_API_KEY    → uses Anthropic (claude-3-haiku by default)
 *   OPENROUTER_API_KEY   → uses OpenRouter (free models available)
 *
 * You can override the model:
 *   AI_MODEL=gpt-4o node index.js
 */

import readline from 'readline';
import { createRequire } from 'module';
import { Writable } from 'stream';

// ── Lazy-load chalk (ESM) ──────────────────────────────
const { default: chalk } = await import('chalk').catch(() => ({
  default: {
    bold: s => s, dim: s => s, cyan: s => s, green: s => s,
    yellow: s => s, red: s => s, gray: s => s, white: s => s,
    hex: () => s => s,
  }
}));

// ── Brand colours (matches amznon.me site) ─────────────
const brand  = chalk.hex('#CC785C');
const accent = chalk.hex('#d98a6e');
const dim    = chalk.dim;
const ok     = chalk.hex('#98c379');
const err    = chalk.red;
const info   = chalk.hex('#7eb8d4');
const reset  = '\x1b[0m';

// ── Detect provider ────────────────────────────────────
const OPENAI_KEY     = process.env.OPENAI_API_KEY;
const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

let PROVIDER, API_KEY, DEFAULT_MODEL;

if (ANTHROPIC_KEY) {
  PROVIDER      = 'anthropic';
  API_KEY       = ANTHROPIC_KEY;
  DEFAULT_MODEL = 'claude-3-haiku-20240307';
} else if (OPENROUTER_KEY) {
  PROVIDER      = 'openrouter';
  API_KEY       = OPENROUTER_KEY;
  DEFAULT_MODEL = 'mistralai/mistral-7b-instruct:free';
} else if (OPENAI_KEY) {
  PROVIDER      = 'openai';
  API_KEY       = OPENAI_KEY;
  DEFAULT_MODEL = 'gpt-4o-mini';
} else {
  PROVIDER      = 'none';
  DEFAULT_MODEL = 'none';
}

const MODEL = process.env.AI_MODEL || DEFAULT_MODEL;

// ── Conversation history ───────────────────────────────
const history = [];

const SYSTEM_PROMPT = `You are amznon-ai, a helpful and concise terminal assistant created by Md Jamil Islam (amznon.me).
You answer questions clearly, write clean code when asked, and keep responses tight.
You support Bangla and English — reply in whatever language the user writes in.`;

// ── HTTP helpers (built-in fetch, Node 18+) ────────────
async function callOpenAI(messages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
    }),
  });
  return streamSSE(res);
}

async function callAnthropic(messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: messages.filter(m => m.role !== 'system'),
      stream: true,
    }),
  });
  return streamAnthropicSSE(res);
}

async function callOpenRouter(messages) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      'HTTP-Referer': 'https://amznon.me',
      'X-Title': 'amznon-ai',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
    }),
  });
  return streamSSE(res);
}

// Stream OpenAI-compatible SSE
async function streamSSE(res) {
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API error ${res.status}: ${txt}`);
  }
  let full = '';
  process.stdout.write(accent('\namznon-ai ') + dim('▸ '));

  const reader = res.body.getReader();
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
        const delta = obj.choices?.[0]?.delta?.content ?? '';
        if (delta) {
          process.stdout.write(delta);
          full += delta;
        }
      } catch {}
    }
  }
  process.stdout.write('\n\n');
  return full;
}

// Stream Anthropic SSE
async function streamAnthropicSSE(res) {
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${txt}`);
  }
  let full = '';
  process.stdout.write(accent('\namznon-ai ') + dim('▸ '));

  const reader = res.body.getReader();
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
      try {
        const obj = JSON.parse(data);
        if (obj.type === 'content_block_delta') {
          const delta = obj.delta?.text ?? '';
          if (delta) {
            process.stdout.write(delta);
            full += delta;
          }
        }
      } catch {}
    }
  }
  process.stdout.write('\n\n');
  return full;
}

// ── Mock reply (no API key) ────────────────────────────
function mockReply(userMsg) {
  const replies = [
    'No API key set. Export OPENAI_API_KEY, ANTHROPIC_API_KEY, or OPENROUTER_API_KEY first.',
    'Try: export OPENAI_API_KEY=sk-... then restart.',
  ];
  const r = replies[0];
  process.stdout.write(accent('\namznon-ai ') + dim('▸ ') + err(r) + '\n\n');
  return r;
}

// ── Send message ───────────────────────────────────────
async function chat(userMsg) {
  if (PROVIDER === 'none') return mockReply(userMsg);

  history.push({ role: 'user', content: userMsg });

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
  ];

  let reply;
  try {
    if (PROVIDER === 'anthropic') {
      reply = await callAnthropic(messages);
    } else if (PROVIDER === 'openrouter') {
      reply = await callOpenRouter(messages);
    } else {
      reply = await callOpenAI(messages);
    }
    history.push({ role: 'assistant', content: reply });
  } catch (e) {
    process.stdout.write('\n' + err(`Error: ${e.message}`) + '\n\n');
  }
}

// ── Banner ─────────────────────────────────────────────
function printBanner() {
  console.log('');
  console.log(brand.bold('  ╔═══════════════════════════════════════╗'));
  console.log(brand.bold('  ║') + chalk.bold('  amznon-ai  ') + dim('by Md Jamil Islam') + brand.bold('    ║'));
  console.log(brand.bold('  ╚═══════════════════════════════════════╝'));
  console.log('');
  if (PROVIDER === 'none') {
    console.log(err('  ⚠  No API key found. Set one of:'));
    console.log(dim('     OPENAI_API_KEY   / ANTHROPIC_API_KEY / OPENROUTER_API_KEY'));
  } else {
    console.log(ok('  ✓') + dim(`  Provider : `) + info(PROVIDER));
    console.log(ok('  ✓') + dim(`  Model    : `) + info(MODEL));
  }
  console.log('');
  console.log(dim('  Commands: /help  /clear  /history  /exit'));
  console.log('');
}

// ── Built-in commands ──────────────────────────────────
function handleCommand(cmd) {
  switch (cmd.trim().toLowerCase()) {
    case '/help':
      console.log(info('\nCommands:'));
      console.log('  /help      — show this help');
      console.log('  /clear     — clear terminal screen');
      console.log('  /history   — print conversation history');
      console.log('  /exit      — quit\n');
      return true;
    case '/clear':
      console.clear();
      printBanner();
      return true;
    case '/history':
      if (history.length === 0) {
        console.log(dim('\n  (no history yet)\n'));
      } else {
        console.log('');
        history.forEach((m, i) => {
          const label = m.role === 'user' ? brand('you') : accent('ai');
          console.log(label + dim(` [${i}] `) + m.content.slice(0, 120) + (m.content.length > 120 ? '…' : ''));
        });
        console.log('');
      }
      return true;
    case '/exit':
    case '/quit':
      console.log(dim('\nbye 👋\n'));
      process.exit(0);
  }
  return false;
}

// ── Readline REPL ──────────────────────────────────────
printBanner();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
  prompt: brand('you') + dim(' › '),
});

rl.prompt();

rl.on('line', async (line) => {
  const input = line.trim();
  if (!input) { rl.prompt(); return; }
  if (handleCommand(input)) { rl.prompt(); return; }

  // pause readline while streaming
  rl.pause();
  await chat(input);
  rl.resume();
  rl.prompt();
});

rl.on('close', () => {
  console.log(dim('\nbye 👋\n'));
  process.exit(0);
});
