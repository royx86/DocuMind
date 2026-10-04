# DocuMind — AI-Powered Document Q&A + Study Platform

> **Upload any document. Ask questions. Get cited answers. Generate practice quizzes and flashcards.**

DocuMind is a full-stack RAG (Retrieval-Augmented Generation) application built with **FastAPI + PostgreSQL** on the backend and **React + Vite + TailwindCSS** on the frontend. It allows users to upload PDF/TXT documents, chat with them, generate multiple-choice quizzes, and study with AI-generated flashcards.
## Live: https://prolific-joy-production-a605.up.railway.app

---

## 🚀 Features

| Feature | Description |
|---|---|
| **Cited Q&A** | Ask questions in plain English; every answer links back to exact page numbers |
| **Practice Quizzes** | AI generates MCQs from your document at Easy / Medium / Hard difficulty |
| **Flashcards** | AI-powered flip-card sessions with spaced-repetition tracking |
| **Multi-Document Chat** | Cross-reference and compare multiple documents in one conversation |
| **Strict vs Moderate Mode** | Control whether answers stay document-only or supplement with general AI knowledge |
| **Quiz History** | Review past quiz attempts and scores |
| **Dark / Light Theme** | Full theme toggle with persistent preference |

---

## 🏗️ Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — async Python web framework
- [SQLAlchemy 2.x](https://www.sqlalchemy.org/) — async ORM (`AsyncSession`)
- [asyncpg](https://magicstack.github.io/asyncpg/) — high-performance PostgreSQL driver
- [Groq Cloud API](https://console.groq.com/) — LLM (LLaMA 3.3 70B) for quiz & chat generation
- [python-jose](https://python-jose.readthedocs.io/) — JWT authentication
- [bcrypt](https://pypi.org/project/bcrypt/) — password hashing
- [pypdf](https://pypdf.readthedocs.io/) — PDF text extraction

**Frontend**
- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [TailwindCSS v4](https://tailwindcss.com/)
- [React Router v7](https://reactrouter.com/)
- [lucide-react](https://lucide.dev/) — icons

**Infrastructure**
- [PostgreSQL 16](https://www.postgresql.org/) — primary database
- [Docker + Docker Compose](https://docs.docker.com/compose/) — containerised deployment
- [Nginx](https://nginx.org/) — static file serving + API proxy

---

## 🛠️ Local Development (without Docker)

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL 14+ running locally

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — for local Postgres change the DATABASE_URL host from `postgres` to `localhost`
# and add GROQ_API_KEY if you want hosted AI generation

# Run the dev server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set API URL for local dev
echo "VITE_API_URL=http://localhost:8000/api" > .env.local

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🐳 Docker Compose Deployment

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Description |
|---|---|
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | Database name |
| `DATABASE_URL` | Full asyncpg connection URL |
| `SECRET_KEY` | Long random JWT secret (use `openssl rand -hex 32`) |
| `GROQ_API_KEY` | From [console.groq.com](https://console.groq.com) (free) |
| `GROQ_MODEL` | e.g. `llama-3.3-70b-versatile` |

For Docker Compose, keep the database hostname in `DATABASE_URL` as `postgres`.
For a backend running directly on the host, use `localhost` (or the hostname of your managed database).
Set `CORS_ORIGINS` to the exact deployed frontend origin, such as
`["https://app.example.com"]`. Comma-separated values are also accepted; do not include
an API path or trailing slash.

### 2. Start all services

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

Verify the application and database connection after startup:

```bash
curl -fsS http://localhost:8080/health
curl -fsS http://localhost:8000/api/health
```

Both health endpoints return HTTP `503` when PostgreSQL is unavailable. The backend retries
database initialization during startup, and Compose waits for the backend health check before
starting the frontend.

### 3. Stop services

```bash
docker compose down
# To also delete database volume:
docker compose down -v
```

---

## 🌐 Cloud Deployment Tips

### Railway / Render / Fly.io (Backend)

1. Set all environment variables from `.env` as platform secrets
2. Use `DATABASE_URL` pointing to a managed Postgres instance
3. The app reads `DATABASE_URL` and normalises `postgres://` → `postgresql+asyncpg://` automatically

### Vercel / Netlify (Frontend)

1. Build command: `npm run build`
2. Output directory: `dist`
3. Set `VITE_API_URL` to your deployed backend URL (e.g. `https://api.yourdomain.com/api`)
4. Configure rewrites so all routes fall back to `index.html`

---

## 📁 Project Structure

```
qna/
├── backend/
│   ├── app/
│   │   ├── config.py          # Pydantic settings
│   │   ├── database.py        # Async SQLAlchemy engine
│   │   ├── main.py            # FastAPI app + CORS + lifespan
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── routers/           # Route handlers (auth, docs, chat, quiz)
│   │   ├── services/          # Business logic (RAG, auth, quiz, docs)
│   │   └── utils/             # Helpers (PDF extractor, security)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/             # Route-level components
│   │   ├── components/        # Reusable UI components
│   │   ├── services/          # API client
│   │   ├── hooks/             # Custom React hooks
│   │   └── context/           # React context (auth, theme)
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── .env                       # Root environment variables
```

---

## 🔑 Getting a Free Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (free — no credit card required)
3. Create an API key
4. Set `GROQ_API_KEY=gsk_...` in your `.env`
5. Default model: `llama-3.3-70b-versatile`

The app includes a built-in local fallback quiz generator that works even without an API key.

---

## 📝 License

MIT — free to use, modify, and distribute.
