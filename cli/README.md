# 🇧🇩 JoyAI — Bangladeshi Intelligent AI

**World's best free AI assistant built in Bangladesh by Md Jamil Islam.**

> Beats ChatGPT, Claude, Gemini — for free. Zero cost. Your own AI.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🏠 **Own AI (Ollama)** | Runs on YOUR machine — unlimited, offline, NO API key |
| 💬 **Regular Chat** | Bangla + English, any topic |
| 💻 **Advanced Coding** | Side-by-side terminal IDE, write/run/fix code |
| 🌐 **Web UI** | Browser + mobile access on same WiFi |
| ⚡ **Groq (Cloud)** | llama-3.3-70b, 14,400 req/day FREE |
| ✦ **Gemini (Cloud)** | gemini-2.0-flash, 1,500 req/day FREE |
| 📁 **File Tools** | Read, write, run files — real terminal actions |
| 🔄 **Streaming** | Real-time responses |
| 🇧🇩 **Bangla UI** | Full Bangla + English support |

---

## 🚀 Quick Start

### Option 1: Own AI (Ollama — recommended)

```bash
# 1. Install Ollama (one time)
curl -fsSL https://ollama.com/install.sh | sh

# 2. Download a model (one time, ~4GB)
ollama pull llama3.2

# 3. Start JoyAI
cd cli
npm install
node index.js
```

### Option 2: Cloud AI (free API key)

```bash
# Groq (14,400 req/day free)
# Get key: https://console.groq.com

cd cli && npm install
node index.js --setup   # choose provider + enter key
node index.js
```

---

## 📱 Phone / Browser Access

```bash
# Start web server (on your PC/laptop)
node index.js --web

# Opens at:
#   Local:  http://localhost:3000
#   Mobile: http://YOUR_IP:3000  (same WiFi)
```

The web UI:
- **Regular AI**: Chat in Bangla/English
- **Advanced Coding**: Side-by-side code editor
- **Own AI**: Connects to your local Ollama (no external API)

---

## 💻 Advanced Coding Mode

```bash
node index.js --advanced
```

Features:
- AI writes complete, production code
- View files in visual code editor
- Run shell commands directly
- `write_file`, `read_file`, `run_shell` tools
- Language selection: JS, Python, TS, HTML, CSS, Bash, Go, Rust...

---

## 📦 Termux (Android)

```bash
# Install Termux from F-Droid
pkg install nodejs git curl

# Install Ollama for Android (Termux)
curl -fsSL https://ollama.com/install.sh | sh
ollama pull tinyllama  # smaller model for phone

# Run JoyAI
git clone https://github.com/Joy123123123/Joy123123123.github.io
cd Joy123123123.github.io/cli
npm install
node index.js
```

---

## ⌨️ Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/setup` | Configure AI engine |
| `/status` | Show provider + Ollama status |
| `/models` | List Ollama models |
| `/pull <model>` | Download Ollama model |
| `/model <name>` | Switch model |
| `/web [port]` | Start browser UI |
| `/advanced` | Advanced coding mode |
| `/ls [path]` | List files |
| `/run <cmd>` | Run shell command |
| `/cd <path>` | Change directory |
| `/ctx` | Token usage |
| `/save` | Save session |
| `/exit` | Quit |

---

## 🤖 Recommended Models

| Model | Size | Best For |
|-------|------|---------|
| `llama3.3` | 42GB | Best quality |
| `llama3.2` | 2GB | Great balance ✓ default |
| `deepseek-r1` | 7GB | Best reasoning |
| `codellama` | 4GB | Best for code |
| `tinyllama` | 600MB | Android/phones |

```bash
ollama pull llama3.3      # best
ollama pull deepseek-r1   # reasoning
ollama pull codellama     # coding
```

---

## 📬 Contact

- **Email**: joyaiofficialbd@gmail.com
- **Facebook**: https://www.facebook.com/share/18Q6mnNeAr/
- **GitHub**: https://github.com/Joy123123123

---

## 🏆 Why JoyAI is the Best

- **Zero external dependency** — Ollama runs 100% locally
- **Truly unlimited** — no rate limits, no quotas, no payment
- **Privacy** — your data never leaves your machine
- **Better than ChatGPT** — llama3.3 70B matches GPT-4 quality
- **Bangladesh-made** 🇧🇩 — the world's first truly free AI platform from Bangladesh

---

*Made with ❤️ in Bangladesh — by Md Jamil Islam*
