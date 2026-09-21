# DocuMind — Document Q&A + Exam Practice Platform

DocuMind is a modern, production-style full-stack platform that transforms documents into interactive study guides. Users can upload PDFs, notes, or research papers, converse with their documents through AI-powered Q&A with exact page citations, and practice for exams with customized multiple-choice quizzes that feature backend scoring and question-by-question explanations.

The visual design is directly inspired by the 9 provided design reference screens (`Screen-1` to `Screen-9`), featuring a clean, responsive interface, split-view document reader, and seamless study workflows.

---

## 1. Project Overview

DocuMind bridges the gap between passive reading and active recall. Rather than reading static documents, students and professionals can:
- **Read & Review**: Inspect documents side-by-side with an interactive AI assistant in a split-view workspace.
- **Ask & Verify**: Ask natural language questions and receive accurate answers with clickable page source badges that jump directly to the referenced page in the document reader.
- **Test & Learn**: Generate custom practice quizzes with chosen question counts (5, 10, 15, 20) and difficulty levels (Easy, Medium, Hard). Answers are validated on the backend to prevent answer leakage, and immediate explanations are revealed upon submission.
- **Track Progress**: Review historical conversations and past quiz attempts with complete scorecard analytics.

---

## 2. Features

- **User Authentication**: Secure registration, login, and JWT-based session management with encrypted passwords.
- **Document Management**:
  - Drag-and-drop file upload supporting PDF, TXT, MD, and CSV files up to 50 MB.
  - Automatic text extraction, page counting, and file size formatting.
  - Multi-page document viewer with thumbnail navigation, zoom controls, and page jumping.
- **Document Q&A (RAG Engine)**:
  - Contextual question answering grounded strictly in uploaded documents.
  - Page-level source citations (`Page X · Section Title`) that link directly to the document viewer.
  - Support for Google Gemini (2.0 Flash / 1.5 Flash), OpenAI (GPT-4o-mini), or a smart built-in offline extractive RAG engine when no API key is supplied.
  - Follow-up questions and persistent conversation histories.
- **Exam Quiz System**:
  - Practice quiz generation from any document.
  - Configurable question counts (5, 10, 15, 20) and difficulties (Easy, Medium, Hard).
  - 4-option multiple-choice questions with randomized option placement.
  - Single-question interactive stepper with real-time progress indicators.
  - Immediate feedback: instant correct/incorrect visual feedback and in-depth explanations upon submission.
  - Backend score validation to prevent client-side answer tampering.
  - Quiz result summary with percentage, correct/incorrect count, action buttons (Retry, New Quiz, Back to Document), and question review.
  - Quiz history tracking for past attempts and performance analysis.
- **Modern UI/UX**:
  - Design based on reference screens: deep indigo branding (`#24235b`), OKLCH blue tokens, Inter typography, and shadcn-style cards and buttons.
  - Split-view reader workspace (Screen-6) and mobile-responsive layout (Screen-9).
  - Toast notifications and confirmation dialogs for destructive actions.

---

## 3. Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Language**: TypeScript / JavaScript
- **Styling**: Tailwind CSS v4, `@tailwindcss/vite`, `tw-animate-css`
- **Component Primitives**: shadcn/ui design tokens (`class-variance-authority`, `clsx`, `tailwind-merge`)
- **Icons**: `lucide-react`
- **Routing**: `react-router-dom` v7

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Server**: Uvicorn (ASGI)
- **Database**: PostgreSQL (with SQLAlchemy 2.0 async + `asyncpg` / `psycopg2-binary`)
- **Security**: bcrypt password hashing, Python-Jose (JWT)
- **PDF Extraction**: `pypdf`
- **HTTP Client**: `httpx`

### AI / RAG Layer
- **Offline / Built-in Engine**: Intelligent TF-IDF and keyword similarity matcher with page-indexed extractive synthesis and distractor generation (requires zero API keys).
- **External AI Providers**: Groq (`GROQ_API_KEY`, `GROQ_MODEL`), Google Gemini (`GEMINI_API_KEY`), and OpenAI (`OPENAI_API_KEY`) configurable via environment variables or user settings.

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL 16 Alpine with persistent volume

---

## 4. Project Structure

```text
qna/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app initialization, middleware, lifespan
│   │   ├── config.py            # Environment configuration with pydantic-settings
│   │   ├── database.py          # Async SQLAlchemy engine, sessionmaker, retry logic
│   │   ├── models/              # SQLAlchemy database models
│   │   │   ├── user.py          # User accounts
│   │   │   ├── document.py      # Documents and extracted text
│   │   │   ├── conversation.py  # Chat conversations
│   │   │   ├── message.py       # Chat messages and sources
│   │   │   └── quiz.py          # Quizzes and QuizQuestions
│   │   ├── schemas/             # Pydantic schemas (request/response validation)
│   │   │   ├── auth.py
│   │   │   ├── document.py
│   │   │   ├── chat.py
│   │   │   └── quiz.py
│   │   ├── routers/             # API route handlers
│   │   │   ├── auth.py          # /api/auth (register, login, me)
│   │   │   ├── documents.py     # /api/documents (upload, list, view, delete)
│   │   │   ├── chat.py          # /api/chat (conversations, messages)
│   │   │   └── quiz.py          # /api/quiz (generate, answer, submit, history)
│   │   ├── services/            # Core business logic
│   │   │   ├── auth_service.py
│   │   │   ├── document_service.py
│   │   │   ├── rag_service.py   # Page-grounded RAG & source citations
│   │   │   └── quiz_service.py  # MCQ generation & backend validation
│   │   └── utils/
│   │       ├── security.py      # Password hashing & JWT
│   │       └── pdf_extractor.py # PDF text extraction and page tracking
│   ├── uploads/                 # Storage for uploaded document files
│   ├── Dockerfile               # Backend Docker build instructions
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Backend environment template
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # Reusable UI primitives (Button, Card, Input, etc.)
│   │   │   ├── layout/          # Sidebar, Header, MobileNav, AppLayout
│   │   │   ├── documents/       # DocumentCard, UploadModal, DocumentViewer
│   │   │   ├── chat/            # ChatInterface, MessageItem, SourcePill, ChatInput
│   │   │   └── quiz/            # QuizSetupModal, QuizCard, QuizResult, QuizHistoryList
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx    # Screen-2 overview, quick ask, recent activity
│   │   │   ├── Documents.tsx    # Screen-3 document library & dropzone
│   │   │   ├── DocumentWorkspace.tsx # Screen-6 split reader & Q&A
│   │   │   ├── Chat.tsx         # Screen-5 dedicated chat workspace
│   │   │   ├── Quiz.tsx         # Interactive practice quiz runner
│   │   │   ├── History.tsx      # Screen-7 chat history & quiz attempts
│   │   │   ├── Settings.tsx     # Screen-8 profile & AI configurations
│   │   │   ├── Login.tsx        # Screen-1 login page
│   │   │   └── Register.tsx     # Registration page
│   │   ├── services/
│   │   │   └── api.ts           # Centralized API service with JWT auth headers
│   │   ├── hooks/
│   │   │   ├── useAuth.tsx      # Auth state and login/logout functions
│   │   │   └── useToast.tsx     # Toast notification system
│   │   ├── types/               # TypeScript interfaces
│   │   ├── lib/
│   │   │   └── utils.ts         # Classnames (cn) and date formatting helpers
│   │   ├── App.tsx              # React router configuration
│   │   ├── main.tsx             # React entry point
│   │   └── index.css            # Tailwind CSS & OKLCH blue tokens
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── Screen-1/ ... Screen-9/      # Provided design reference screen folders
├── docker-compose.yml           # Multi-container orchestration (FastAPI + PostgreSQL)
├── .env.example                 # Root environment variables template
└── README.md                    # Project documentation
```

---

## 5. Requirements

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Python**: v3.11 or higher
- **Docker & Docker Compose**: (Optional, recommended for production deployment)

---

## 6. Local Development Setup

### 1. Clone or Open the Repository
```bash
git clone https://github.com/your-username/documind.git
cd documind
```

### 2. Backend Setup
Navigate into the `backend/` directory:
```bash
cd backend
```

Create a virtual environment:
- **Linux/macOS**:
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  ```
- **Windows (Command Prompt)**:
  ```cmd
  python -m venv .venv
  .venv\Scripts\activate.bat
  ```
- **Windows (PowerShell)**:
  ```powershell
  python -m venv .venv
  .venv\Scripts\Activate.ps1
  ```

Install dependencies:
```bash
pip install -r requirements.txt
```

Create `.env` file:
```bash
cp .env.example .env
```
*(Optionally set your `GEMINI_API_KEY` or `OPENAI_API_KEY` in `.env` if you wish to use external AI providers. If left empty, DocuMind uses its built-in smart extractive RAG engine.)*

Run the FastAPI development server:
```bash
uvicorn app.main:app --reload --port 8000
```
The backend API is now running at `http://127.0.0.1:8000`.

### 3. Frontend Setup
In a new terminal window, navigate to the `frontend/` directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 7. PostgreSQL Setup Without Docker

If you prefer running PostgreSQL natively on your machine rather than through Docker:

1. **Install PostgreSQL** (e.g. via `apt install postgresql`, `brew install postgresql`, or the Windows installer).
2. **Start the PostgreSQL Service**:
   - Linux: `sudo systemctl start postgresql`
   - macOS: `brew services start postgresql`
   - Windows: Start the PostgreSQL service via `services.msc`.
3. **Create the Database and User**:
   ```sql
   CREATE USER postgres WITH PASSWORD 'postgrespassword';
   CREATE DATABASE qna_db OWNER postgres;
   GRANT ALL PRIVILEGES ON DATABASE qna_db TO postgres;
   ```
4. **Update `backend/.env`**:
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:postgrespassword@localhost:5432/qna_db
   ```
5. When the backend boots, `init_db()` automatically connects and initializes all required tables (`users`, `documents`, `conversations`, `messages`, `quizzes`, `quiz_questions`).

---

## 8. Docker Setup

To run the complete backend and PostgreSQL stack using Docker Compose:

### 1. Build and Start Containers
```bash
docker compose up --build
```
This command:
- Launches a `postgres:16-alpine` container with a healthcheck.
- Builds the `backend` Docker container using `backend/Dockerfile`.
- Waits until PostgreSQL is healthy before launching the FastAPI application.
- Mounts the `documind_postgres_data` named volume so database records persist across restarts.
- Exposes port `8000` for FastAPI and port `5432` for PostgreSQL.

### 2. Inspect Running Containers & Logs
Check container status:
```bash
docker compose ps
```

View aggregated logs:
```bash
docker compose logs -f
```

View backend logs only:
```bash
docker compose logs -f backend
```

### 3. Stop or Restart Containers
Stop containers without deleting data:
```bash
docker compose down
```

Restart containers:
```bash
docker compose restart
```

Rebuild after making backend changes:
```bash
docker compose up --build -d
```

---

## 9. Environment Variables

Create `.env` files based on `.env.example`:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://postgres:postgrespassword@localhost:5432/qna_db` |
| `SECRET_KEY` | JWT secret key for token signing | `your-super-secret-key-change-this-in-production-min-32-chars` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time in minutes | `10080` (7 days) |
| `UPLOAD_DIR` | Directory where uploaded files are stored | `./backend/uploads` |
| `CORS_ORIGINS` | JSON array of allowed frontend origins | Local Vite URLs |
| `GROQ_API_KEY` | Groq Cloud API key | *(configured)* |
| `GROQ_MODEL` | Groq model identifier | `openai/gpt-oss-120b` |
| `GEMINI_API_KEY` | Optional Google Gemini API key | *(empty - uses Groq or local offline RAG)* |
| `OPENAI_API_KEY` | Optional OpenAI API key | *(empty - uses Groq or local offline RAG)* |

For a separate frontend deployment, set `VITE_API_URL` in the frontend build
environment to the public backend URL, for example `https://api.example.com/api`.
Set `CORS_ORIGINS` on the backend to a JSON array containing the frontend URL,
for example `["https://app.example.com"]`. Also set a strong `SECRET_KEY` in
the deployed backend environment.

---

## 10. Database Migrations

The application uses SQLAlchemy declarative models. On startup, `init_db()` automatically executes `Base.metadata.create_all` with exponential backoff retries.

If you wish to use Alembic for versioned schema migrations:
1. Initialize Alembic (if not already initialized):
   ```bash
   alembic init alembic
   ```
2. Generate a new migration revision:
   ```bash
   alembic revision --autogenerate -m "Initial schema"
   ```
3. Apply migrations:
   ```bash
   alembic upgrade head
   ```

---

## 11. API Documentation

FastAPI provides interactive, self-documenting API specifications out of the box:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

Key endpoints:
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET  /api/auth/me` — Retrieve current authenticated user profile
- `GET  /api/documents` — List user's documents
- `POST /api/documents/upload` — Upload a document file (multipart/form-data)
- `GET  /api/documents/{id}` — Get document details and text preview
- `GET  /api/documents/{id}/file` — Stream document file for reading
- `DELETE /api/documents/{id}` — Delete document and associated data
- `POST /api/chat/{document_id}` — Ask a question about a document
- `GET  /api/chat/conversations` — List user's conversations
- `GET  /api/chat/conversations/{id}` — Retrieve conversation messages and sources
- `DELETE /api/chat/conversations/{id}` — Delete a conversation
- `POST /api/quiz/generate` — Generate multiple-choice quiz
- `POST /api/quiz/{id}/answer` — Validate a single question and reveal explanation
- `POST /api/quiz/{id}/submit` — Submit quiz for final scoring and full review
- `GET  /api/quiz/history` — List past quiz attempts and scores
- `GET  /api/quiz/{id}` — Retrieve details of a specific quiz attempt

---

## 12. Troubleshooting

### 1. PostgreSQL Connection Failed
- **Symptoms**: `ConnectionRefusedError` or `Is the server running on host localhost?`
- **Fix**: If using Docker, ensure `docker compose up postgres` is running. If running locally, check `pg_isready` and ensure the database `qna_db` exists.

### 2. Port Already in Use
- **Symptoms**: `[Errno 98] Address already in use: 8000` or `5173`
- **Fix**: Identify the process using the port (`lsof -i :8000` or `lsof -i :5173`) and stop it, or specify an alternative port:
  ```bash
  uvicorn app.main:app --port 8001
  ```
  In Vite: `npm run dev -- --port 5174`.

### 3. Frontend Cannot Connect to Backend / CORS Errors
- **Symptoms**: `NetworkError when attempting to fetch resource`
- **Fix**: Check that the backend is running on `http://127.0.0.1:8000`. The Vite development server is configured with an automatic proxy in `vite.config.ts` mapping `/api` requests to `http://127.0.0.1:8000`.

### 4. Document Upload Fails
- **Symptoms**: `File exceeds maximum allowed size` or `Unsupported file format`
- **Fix**: Ensure the uploaded file is a supported format (`.pdf`, `.txt`, `.md`, `.csv`, `.json`) and smaller than 50 MB.

### 5. AI API Key Issues
- **Symptoms**: Timeout or empty answer when using external AI
- **Fix**: If `GEMINI_API_KEY` or `OPENAI_API_KEY` is invalid or expired, DocuMind will automatically fallback to its local extractive RAG and quiz engine so your workflow is never interrupted.

---

## 13. Development Workflow

For day-to-day development, we recommend running the frontend and backend in separate terminals:
1. **Backend**:
   ```bash
   cd backend
   source .venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
Vite's hot-module replacement (HMR) and FastAPI's auto-reload will instantly reflect any code edits without requiring manual restarts.
