# amznon-ai v2 — Advanced Coding AI

A **real** coding AI assistant — like Claude Code, but **completely FREE**.  
Runs in your terminal **or browser** (for phone users).  
Built by **Md Jamil Islam**.

---

## ✅ Features

| Feature | Details |
|---|---|
| **Free AI** | Groq (14k req/day) · Gemini (1.5k req/day) · Ollama (local) |
| **Writes files** | Creates real files on disk with visual preview |
| **Runs code** | Executes shell commands, shows output + exit code |
| **Multi-file projects** | Can build entire apps from scratch |
| **Browser UI** | Use on your phone — no Termux needed |
| **Bangla + English** | Replies in whatever language you write |
| **Remembers context** | Full conversation memory across turns |
| **Setup wizard** | `--setup` flag to configure API key |

---

## ⚡ Quick Start (2 minutes)

### Step 1 — Get a FREE API key

**Option A: Groq** *(fastest — recommended)*
1. Go to **https://console.groq.com** → Sign up (free)
2. Click **API Keys** → **Create API Key** → copy it

**Option B: Gemini** *(Google — also free)*
1. Go to **https://aistudio.google.com** → Sign in
2. Click **Get API Key** → copy it

**Option C: Ollama** *(100% offline, no key needed)*
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama serve
ollama pull llama3.2
```

---

### Step 2 — Install & configure

```bash
cd cli
npm install
node index.js --setup   # ← pick your provider, paste the key
```

---

### Step 3 — Run!

```bash
node index.js
```

---

## 📱 Use on your Phone (without Termux)

Run the web UI on your PC, then open it on your phone via WiFi:

```bash
# On your PC:
node index.js --web

# Output:
# ┌─ Web UI Started ─────────────────────┐
# │  Local  : http://localhost:3000      │
# │  Mobile : http://192.168.1.5:3000    │  ← open this on your phone
# └──────────────────────────────────────┘
```

Just open the mobile link in your phone's browser — done. No app install needed.

---

## 📱 Termux (Android) — Direct Terminal

```bash
# Install in Termux
pkg update && pkg upgrade
pkg install nodejs git

git clone https://github.com/Joy123123123/Joy123123123.github.io
cd Joy123123123.github.io/cli
npm install

# Configure
node index.js --setup   # choose Groq or Gemini (both work on mobile via WiFi)

# Run
node index.js
```

---

## 🗣 Example Conversations

```
you › create a todo app in node.js with add, list, delete commands

  amznon-ai ▸
  I'll build a CLI todo app with file-based persistence.

┌─ writing → todo.js ────────────────────────────────┐
  1 │ #!/usr/bin/env node                             │
  2 │ import { readFileSync, writeFileSync ... }      │
 ...│                                                 │
└─────────────────────────────────────────────────────┘
  ✓ saved

⚡ run: node todo.js add "Buy groceries"
┌─ node todo.js add...  ✓ ok ─────────────────────────┐
│ ✓ Added: Buy groceries                              │
└─────────────────────────────────────────────────────┘
```

---

## 🛠 All Commands

| Command | What it does |
|---|---|
| `/help` | Show all commands |
| `/setup` | Change AI provider or API key |
| `/status` | Show provider, model, memory usage |
| `/model <name>` | Switch model mid-session |
| `/models` | List installed Ollama models |
| `/cd <path>` | Change working directory |
| `/pwd` | Show current working dir |
| `/ls [path]` | List files |
| `/run <cmd>` | Run a shell command |
| `/web [port]` | Start browser UI for phone |
| `/history` | Show conversation history |
| `/clear-history` | Wipe AI memory |
| `/ctx` | Show context window usage |
| `/save` | Save session to JSON |
| `/clear` | Clear screen |
| `/exit` | Quit |

---

## 🌍 Environment Variables

```bash
GROQ_API_KEY=...        # use Groq
GEMINI_API_KEY=...      # use Gemini
OPENAI_API_KEY=...      # use OpenAI
OLLAMA_HOST=http://...  # custom Ollama host
AI_MODEL=llama3.2       # override model
AI_WORKDIR=/my/project  # starting directory
```

---

## 📦 Make it global

```bash
npm link        # installs amznon-ai globally
amznon-ai       # run from anywhere
```


A personal AI coding assistant that runs in your terminal.  
**100% FREE — no API key, no account, no credit card.**  
Built by **Md Jamil Islam**.

---

## How it works

Uses **[Ollama](https://ollama.com)** — runs AI models locally on your machine.  
No internet required after setup. Your conversations stay private.

```
you › write me a node.js server that serves static files

  amznon-ai ▸
  I'll create a simple Node.js static file server using the built-in http module.

┌─ writing → server.js ─────────────────────────────┐
  1 │ const http = require('http');                  │
  2 │ const fs   = require('fs');                    │
  ...
└───────────────────────────────────────────────────┘
  ✓ saved → /home/you/server.js

⚡ Run: node server.js
┌─ node server.js  ✓ ok ────────────────────────────┐
│ Server running at http://localhost:3000            │
└───────────────────────────────────────────────────┘
```

---

## Setup — PC / Mac / Linux

```bash
# 1. Install Ollama
#    Linux/Mac:
curl -fsSL https://ollama.com/install.sh | sh
#    Windows: download from https://ollama.com

# 2. Start Ollama
ollama serve

# 3. Pull a free model (pick one)
ollama pull llama3.2          # 2GB — fast, good for chat + code
ollama pull codellama         # 4GB — better for coding tasks
ollama pull mistral           # 4GB — well-rounded

# 4. Go to cli folder and install
cd cli
npm install

# 5. Run!
node index.js
```

---

## Setup — Termux (Android)

Termux cannot run Ollama directly — but you can connect to Ollama running on your PC over WiFi.

```bash
# ── On your PC (same WiFi network) ──
ollama serve   # starts Ollama, listens on 0.0.0.0:11434 by default
# Find your PC's local IP (e.g. 192.168.1.5):
#   Windows: ipconfig
#   Mac/Linux: ip addr

# ── In Termux ──
pkg update && pkg upgrade
pkg install nodejs git

git clone https://github.com/Joy123123123/Joy123123123.github.io
cd Joy123123123.github.io/cli
npm install

# Point to your PC's Ollama
export OLLAMA_HOST=http://192.168.1.5:11434

# Run!
node index.js
```

> **Tip:** Add the export to `~/.bashrc` so you don't have to type it every time.

---

## Override the model

```bash
AI_MODEL=codellama node index.js
AI_MODEL=mistral   node index.js
```

---

## Commands

| Command           | What it does                                   |
|-------------------|------------------------------------------------|
| `/help`           | Show all commands                              |
| `/status`         | Check Ollama connection + model info           |
| `/models`         | List all installed models                      |
| `/model <name>`   | Switch to a different model mid-session        |
| `/cd <path>`      | Change working directory                       |
| `/pwd`            | Show current working directory                 |
| `/ls [path]`      | List files in a directory                      |
| `/run <cmd>`      | Run a shell command and see the output         |
| `/history`        | Print conversation history                     |
| `/clear-history`  | Wipe conversation memory                       |
| `/save`           | Save session to a JSON file                    |
| `/clear`          | Clear the screen                               |
| `/exit`           | Quit                                           |

---

## What the AI can do

When you ask it to do something, it performs **real actions** — not just shows code:

- **Create files** — writes actual files to disk with visual preview
- **Run commands** — executes shell commands, shows output + exit code
- **Read files** — reads any file and can analyse/modify it
- **List directories** — shows file trees
- **Multi-step tasks** — e.g. "create a React app, install deps, and run it"

---

## Make it a global command (optional)

```bash
# Inside the cli/ folder:
npm link

# Now type from anywhere:
amznon-ai
```

Or add an alias to `~/.bashrc`:
```bash
alias ai='node /path/to/cli/index.js'
```

