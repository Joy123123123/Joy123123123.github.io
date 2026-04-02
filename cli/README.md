# amznon-ai — Advanced Terminal Coding AI

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

