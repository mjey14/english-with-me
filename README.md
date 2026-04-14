# English With Me

A personal AI-powered English learning companion — built for a Korean professional targeting Big Tech-level English.

## What it does

Replaces fragmented tools (Google Translate, ad-hoc Claude prompts) with a single app that applies a consistent personal English style across all outputs.

**Convert** — Type in Korean, get 2–3 context-aware English expressions with situation labels and explanations. Tailored to the mode (speaking, messaging, email, writing) and sub-context (work meeting, Slack, WhatsApp, etc.)

**Browse expressions** — Generate 3 native-sounding expressions for a selected context, with Korean equivalents for recall practice.

**Quiz myself** — Flashcard-style review of past conversions and learned expressions. Korean prompt → recall English.

**History** — Full searchable log of all conversions and learned expressions.

**Settings** — Define your English role model (free-text) applied to every AI output. Toggle active modes. Switch between Light / Dark / Warm themes.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Expo (React Native) — iOS + Mac |
| Backend | FastAPI (Python) |
| Database | PostgreSQL |
| AI | OpenAI GPT-4o via LangChain |
| Deployment | Railway (backend) / TestFlight (iOS) |

## Architecture

```
Expo (React Native)
    ↓ REST API
FastAPI + LangChain
    ↓
PostgreSQL          OpenAI GPT-4o
```

- LangChain abstraction layer — model swap (OpenAI → Claude) requires one line change
- Role model prompt injected into every AI call at the system level
- All conversions auto-logged to PostgreSQL; used as Review source material

## Running locally

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # add your API keys
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npx expo start
```

## Environment variables

```
OPENAI_API_KEY=
DATABASE_URL=postgresql://...
LANGCHAIN_API_KEY=      # optional, for LangSmith tracing
LANGCHAIN_TRACING_V2=true
```
