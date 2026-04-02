# 🇧🇩 JoyAI v5 — Bangladeshi Intelligent AI

**World's first free, no-setup AI assistant from Bangladesh.**
*Built by Md Jamil Islam — beats ChatGPT, Gemini, Claude — for FREE.*

---

## ✅ সাধারণ ইউজারদের জন্য (Regular Users)

**ওয়েবসাইটে যাও → সাথে সাথে chat শুরু করো। কোনো setup লাগবে না।**

🌐 Website: [https://joy123123123.github.io](https://joy123123123.github.io)

→ JoyAI panel click করো → **স্বয়ংক্রিয় শুরু হয়ে যাবে** (Pollinations AI দিয়ে)
→ কোনো key লাগবে না, কোনো registration লাগবে না

---

## 🔧 AI Engines (৪টি Option)

| Engine | Setup | Speed | Best For |
|--------|-------|-------|---------|
| 🚀 **Pollinations** (Default) | শূন্য | দ্রুত | সবার জন্য — website visitors |
| 🏠 **Ollama** (Own AI) | install করতে হবে | সবচেয়ে fast | নিজের PC/server |
| ⚡ **Groq** | free API key | দ্রুত | power users |
| ✦ **Gemini** | free API key | ভালো | power users |

**Pollinations = default → website visitors এর জন্য কোনো setup লাগে না।**

---

## 🖥️ Terminal (CLI) ব্যবহার

```bash
# Install
git clone https://github.com/Joy123123123/Joy123123123.github.io
cd Joy123123123.github.io/cli
npm install

# Run (Pollinations default — no setup needed)
node index.js

# Setup other providers
node index.js --setup

# Browser UI (phone + desktop)
node index.js --web

# Advanced Coding IDE
node index.js --advanced
```

---

## 🌐 ২৪/৭ সক্রিয় রাখার উপায়

### Option A: GitHub Pages (Website — সবসময় চালু!)
ওয়েবসাইট **সবসময় চালু** — GitHub Pages বিনামূল্যে ২৪/৭ serve করে।
Users `https://joy123123123.github.io` এ গিয়ে সরাসরি JoyAI ব্যবহার করতে পারে।
**Pollinations AI server আলাদাভাবে চালু থাকে — তোমাকে কিছু করতে হবে না।**

### Option B: নিজের Server থেকে সবার জন্য (VPS)
```bash
# যেকোনো Linux server-এ (AWS/DigitalOcean/Hostinger)
npm install -g pm2                    # process manager
git clone https://github.com/Joy123123123/Joy123123123.github.io
cd Joy123123123.github.io/cli
npm install
pm2 start "node index.js --web 3000" --name joyai
pm2 save && pm2 startup               # auto-start on reboot
```

Server IP/domain দিলে সবাই access করতে পারবে:
`http://your-server-ip:3000`

### Option C: Termux (Android — ২৪/৭)
```bash
pkg install nodejs git
git clone https://github.com/Joy123123123/Joy123123123.github.io
cd Joy123123123.github.io/cli && npm install
node index.js --web                   # পরিবারের সবাই same WiFi-তে use করতে পারবে
```

### Option D: Ollama + Server (নিজস্ব AI ২৪/৭)
```bash
# Server-এ Ollama install
curl -fsSL https://ollama.com/install.sh | sh
ollama serve &                         # background-এ চালু রাখো
ollama pull llama3.2                   # model download

# JoyAI web server
node index.js --setup                  # Ollama বেছে নাও
node index.js --web 3000
```

---

## ❓ Ollama সম্পর্কে

**Ollama কী?**
- তোমার নিজের মেশিনে AI model চালানোর software
- No API key, no cost, unlimited, offline
- Data তোমার কাছে থাকে — কোথাও যায় না

**Ollama ব্যবহার করতে:**
```bash
# 1. Install (one time)
curl -fsSL https://ollama.com/install.sh | sh   # Linux/Mac
# Windows: https://ollama.com/download

# 2. Model download (one time, ~4GB)
ollama pull llama3.2

# 3. Setup JoyAI to use Ollama
node index.js --setup   # Option 2 বেছে নাও
```

**সাধারণ visitors-এর জন্য Ollama লাগে না।** Pollinations ব্যবহার করলে কিছুই লাগে না।

---

## 💬 Commands (Terminal)

| Command | কাজ |
|---------|-----|
| `/help` | সব command দেখাও |
| `/setup` | AI engine বদলাও |
| `/status` | কোন AI চলছে দেখাও |
| `/models` | Ollama models দেখাও |
| `/pull llama3.3` | Model download করো |
| `/web [port]` | Browser UI চালু করো |
| `/advanced` | Advanced coding mode |
| `/ls` | Files দেখাও |
| `/run <cmd>` | Terminal command চালাও |
| `/save` | Session save করো |
| `/exit` | বন্ধ করো |

---

## 🤖 Best Models (Ollama)

```bash
ollama pull llama3.3      # Best quality (42GB)
ollama pull llama3.2      # Good balance (2GB) ← default
ollama pull deepseek-r1   # Best reasoning (7GB)
ollama pull codellama     # Best for code (4GB)
ollama pull tinyllama     # Android/phones (600MB)
```

---

## 📬 যোগাযোগ / Contact

| | |
|--|--|
| 📧 Email | joyaiofficialbd@gmail.com |
| 📘 Facebook | https://www.facebook.com/share/18Q6mnNeAr/ |
| 🐙 GitHub | https://github.com/Joy123123123 |

---

## 🏆 কেন JoyAI World's Best?

| বৈশিষ্ট্য | JoyAI | ChatGPT | Claude |
|-----------|-------|---------|--------|
| সম্পূর্ণ বিনামূল্যে | ✅ | ❌ ($20/mo) | ❌ ($20/mo) |
| কোনো signup লাগে না | ✅ | ❌ | ❌ |
| নিজস্ব AI চালানো যায় | ✅ (Ollama) | ❌ | ❌ |
| Bangla support | ✅ | আংশিক | আংশিক |
| Bangladesh থেকে তৈরি | ✅ | ❌ | ❌ |
| Advanced Coding IDE | ✅ | ❌ | ❌ |
| Offline mode | ✅ (Ollama) | ❌ | ❌ |

---

*🇧🇩 Made with ❤️ in Bangladesh by Md Jamil Islam*
