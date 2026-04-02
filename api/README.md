# 🇧🇩 JoyAI Backend API

Md Jamil Islam-এর তৈরি JoyAI-এর নিজস্ব Python backend API।

## Local চালানো

```bash
# Install
pip install -r api/requirements.txt

# Run
uvicorn api.main:app --reload --port 8000

# Test
curl http://localhost:8000/health
curl -X POST http://localhost:8000/chat/simple \
  -H "Content-Type: application/json" \
  -d '{"message": "তুমি কে?"}'
```

## Free Deploy করো

### Option 1: Render.com (সবচেয়ে সহজ)
1. [render.com](https://render.com) → New → Web Service
2. Connect GitHub repo: `Joy123123123/Joy123123123.github.io`
3. Build command: `pip install -r api/requirements.txt`
4. Start command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
5. Free tier — 750 hours/month

### Option 2: Hugging Face Spaces
1. [huggingface.co/spaces](https://huggingface.co/spaces) → New Space
2. SDK: Docker
3. Upload এই folder
4. Dockerfile লাগবে (নিচে দেওয়া আছে)

### Option 3: Railway.app
1. [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Root directory: `.` (root)
3. Start command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`

## Environment Variables (Optional)

Backend-এ নিজের Groq/Gemini key set করলে users-দের key লাগবে না:

```
GROQ_API_KEY=gsk_xxxxxxxxxxxx
GEMINI_API_KEY=AIzaxxxxxxxxxx
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Status check |
| GET | `/health` | Health check |
| POST | `/chat` | Full chat with history + streaming |
| POST | `/chat/simple` | Single message, no history |

## Frontend থেকে connect করো

Deploy করার পর `assets/js/main.js`-এ `PROVIDERS` object-এ add করো:

```javascript
joyai_own: {
  name:    'JoyAI Own API',
  label:   '🏠 নিজস্ব API',
  url:     'https://YOUR_RENDER_URL.onrender.com',
  model:   'openai',
  noKey:   true,
}
```
