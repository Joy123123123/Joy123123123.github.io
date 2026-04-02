# JoyAI — Bangladeshi Intelligent AI 🇧🇩

**World-class free coding AI** by Md Jamil Islam.  
Works on **Terminal** (Termux/Linux/Mac/Windows) and **Mobile browser** — no credit card, no subscription.

```
   JoyAI  Bangladeshi Intelligent AI  🇧🇩
   by Md Jamil Islam
   GROQ · llama-3.3-70b-versatile
```

---

## Features

- �� **100% Free** — Groq (14k req/day), Gemini (1.5k req/day), or local Ollama
- 🇧🇩 **Bangla + English** — কথা বলো যেকোনো ভাষায়
- 💻 **Real coding** — writes files, runs commands, reads code, fixes errors
- 📱 **Mobile support** — browser UI works on any phone
- 🌐 **Multi-platform** — Termux, Linux, macOS, Windows WSL
- ✨ **Visual UI** — spinner, code boxes with line numbers, output boxes

---

## Quick Start

### Option 1 — Groq (Recommended, fastest)

```bash
# 1. Get free key (30 seconds):
#    https://console.groq.com → Sign up → API Keys

# 2. Install & run
cd cli
npm install
GROQ_API_KEY=gsk_YOUR_KEY node index.js

# Or save key permanently:
node index.js --setup
```

### Option 2 — Gemini (Google, free)

```bash
# 1. Get free key:
#    https://aistudio.google.com → Get API Key

GEMINI_API_KEY=AIza_YOUR_KEY node index.js
```

### Option 3 — Ollama (Fully offline, no key)

```bash
# Install Ollama: https://ollama.com
ollama serve
ollama pull llama3.2

node index.js   # auto-detects Ollama
```

---

## Termux (Android phone)

```bash
pkg update && pkg upgrade
pkg install nodejs git
git clone https://github.com/Joy123123123/Joy123123123.github.io
cd Joy123123123.github.io/cli
npm install

# Setup (choose Groq or Gemini — both free):
node index.js --setup

# Chat:
node index.js
```

---

## Mobile Browser (no Termux needed)

On any device with a browser:

```bash
# Start web server (on your computer or server):
node index.js --web 3000

# Then open on phone:
# http://YOUR_COMPUTER_IP:3000
```

Or use the **JoyAI** tab on the website at [amznon.me](https://amznon.me).

---

## Commands

| Command | কাজ |
|---|---|
| `/help` | সব command দেখাও |
| `/setup` | Provider configure করো |
| `/status` | Current provider/model |
| `/model <name>` | Model বদলাও |
| `/web [port]` | Browser UI শুরু করো |
| `/ls [path]` | Files দেখাও |
| `/run <cmd>` | Shell command চালাও |
| `/cd <path>` | Directory বদলাও |
| `/history` | Conversation history |
| `/save` | Session save করো |
| `/exit` | বন্ধ করো |

---

## AI Tool System

JoyAI can take **real actions** — not just answer:

- `write_file` — Code লিখে file তৈরি করে
- `run_shell` — Command চালায়, output দেখায়
- `read_file` — File পড়ে বোঝে
- `list_files` — Directory দেখায়
- `make_dir` — Folder তৈরি করে
- `delete_file` / `move_file` — File manage করে

**Example:**
```
তুমি › Express.js দিয়ে একটা REST API তৈরি করো

JoyAI ▸
  📄 write → server.js
  ⚡ run: npm init -y && npm install express
  ⚡ run: node server.js
  ✓ Server running on port 3000
```

---

## Free Tier Limits

| Provider | Free Limit | Speed |
|---|---|---|
| Groq | 14,400 req/day | ⚡ Fastest |
| Gemini | 1,500 req/day | ✓ Good |
| Ollama | Unlimited | 🔒 Local |

---

**Made in Bangladesh 🇧🇩 by Md Jamil Islam**  
[amznon.me](https://amznon.me) · [GitHub](https://github.com/Joy123123123)
