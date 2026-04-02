# amznon-ai — Terminal AI Assistant

A Claude Code-style AI assistant you run directly from your terminal.  
Built by **Md Jamil Islam** ([amznon.me](https://amznon.me)).

---

## Requirements

- **Node.js 18+** (has built-in `fetch`)
- An API key from **one** of:
  - [OpenAI](https://platform.openai.com/api-keys) — free trial available
  - [Anthropic](https://console.anthropic.com/) — `claude-3-haiku` (cheapest)
  - [OpenRouter](https://openrouter.ai/) — has **free** models (no credit card needed)

---

## Setup

```bash
# 1. Go into the cli folder
cd cli

# 2. Install dependencies (only chalk)
npm install

# 3. Export your API key (pick one)
export OPENAI_API_KEY=sk-...
# OR
export ANTHROPIC_API_KEY=sk-ant-...
# OR
export OPENROUTER_API_KEY=sk-or-...    # Free models available!

# 4. Run it
node index.js
```

---

## Free option — OpenRouter

OpenRouter has genuinely free models. No credit card needed:

```bash
# 1. Sign up at https://openrouter.ai/
# 2. Get your free API key
# 3. Run:
export OPENROUTER_API_KEY=sk-or-...
node index.js
```

The default free model is `mistralai/mistral-7b-instruct:free`.  
You can override:
```bash
AI_MODEL=google/gemma-3-27b-it:free node index.js
```

---

## Override the model

```bash
# Use GPT-4o instead of GPT-4o-mini
AI_MODEL=gpt-4o node index.js

# Use Claude 3.5 Sonnet
AI_MODEL=claude-3-5-sonnet-20241022 node index.js
```

---

## Terminal commands

| Command     | What it does              |
|-------------|--------------------------|
| `/help`     | Show available commands   |
| `/clear`    | Clear the screen          |
| `/history`  | Print conversation so far |
| `/exit`     | Quit                      |

---

## Make it global (optional)

```bash
# Inside the cli/ folder:
npm link

# Now you can run from anywhere:
amznon-ai
```

---

## Add to shell profile (optional)

```bash
# Add to ~/.bashrc or ~/.zshrc:
alias ai='node /path/to/Joy123123123.github.io/cli/index.js'

# Then just type:
ai
```
