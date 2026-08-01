# CursorPM — AI Product Manager Copilot

CursorPM turns a raw JSON export of customer reviews or product feedback into
a prioritized, engineering-ready backlog. Upload a feedback file, click
**Analyze Feedback**, and get back a full dashboard: clustered issues,
priority scores, charts, an AI-written PM summary, and downloadable
engineering tickets — powered by the Grok API.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Run Locally](#run-locally)
- [Run with Docker](#run-with-docker)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [Future Scope](#future-scope)

---

## Overview

Product teams drown in unstructured feedback. CursorPM automates the first
pass of triage a PM would normally do by hand:

1. Classify every review (category, severity, sentiment, confidence).
2. Cluster near-duplicate reports into a single issue ("App crashes",
   "Application closes", "Force stop" → **Application Crash**, frequency 3).
3. Score each issue with a transparent, weighted priority formula.
4. Summarize the findings and draft engineering-ready tickets.
5. Present it all in a searchable, filterable dashboard with export options.

---

## Features

- Drag & drop JSON upload with client-side validation and upload progress
- AI-powered per-review classification via the Grok API
- Local similarity-based clustering (no extra AI round-trip)
- Transparent, deterministic priority scoring formula
- AI-generated PM executive summary
- AI-generated engineering tickets (title, description, acceptance criteria,
  priority, labels, story points)
- Auto-generated `PRD.md`
- Dashboard: stat cards, category/severity/sentiment/priority charts, and a
  searchable / sortable / filterable / paginated issue table
- Exports: `analysis.json`, `analysis.csv`, `analysis.xlsx`, `PRD.md`,
  `EngineeringTasks.json`
- Dark mode, responsive layout, loading skeletons, empty & error states,
  toast notifications
- Retry-with-backoff on outbound AI calls, structured error handling, CORS,
  and request logging on the backend

---

## Architecture

```
┌─────────────────┐      POST /analyze       ┌──────────────────────┐      ┌───────────────┐
│  React frontend  │ ───────────────────────▶ │   FastAPI backend     │ ───▶ │   Grok API     │
│  (Vite, Tailwind) │ ◀─────────────────────── │  (clustering, scoring, │ ◀─── │   (xAI)        │
└─────────────────┘   AnalyzeResponse JSON    │   PRD/export services) │      └───────────────┘
                                               └──────────────────────┘
```

- **Frontend** never talks to Grok directly — it only calls the FastAPI
  backend, which owns the API key.
- **Backend** is organized in layers: `routers/` (HTTP), `services/`
  (business logic: AI calls, clustering, priority scoring, exports),
  `models/` (Pydantic schemas), `core/` (config, logging, exceptions).
- Clustering runs locally (difflib-based text similarity scoped by
  category) so it doesn't require an extra AI call and stays fast and
  deterministic.
- Priority scoring is a transparent weighted formula (severity 35%,
  business impact 25%, frequency 20%, sentiment 10%, confidence 10%), not a
  black box — see `backend/app/services/priority_service.py`.

---

## Folder Structure

```
CursorPM/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py          # Settings via pydantic-settings
│   │   │   ├── exceptions.py      # Typed application errors
│   │   │   └── logging.py         # Logging setup
│   │   ├── models/
│   │   │   └── schemas.py         # Pydantic request/response models
│   │   ├── routers/
│   │   │   ├── analyze.py         # POST /analyze pipeline
│   │   │   └── export.py          # POST /export/{json,csv,xlsx,prd,tasks}
│   │   ├── services/
│   │   │   ├── ai_service.py          # Grok API calls (classification, summary, tasks)
│   │   │   ├── clustering_service.py  # Groups similar reviews into issues
│   │   │   ├── priority_service.py    # Weighted priority formula
│   │   │   ├── aggregation_service.py # Stat cards + chart data
│   │   │   ├── prd_service.py         # PRD.md generation
│   │   │   └── export_service.py      # CSV/XLSX/JSON export builders
│   │   └── utils/
│   │       └── retry.py           # Async retry with exponential backoff
│   ├── main.py                    # FastAPI app, CORS, error handlers
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/client.js          # Axios instance + typed API calls
│   │   ├── hooks/
│   │   │   ├── useAnalysis.js     # Analyze lifecycle (idle/loading/success/error)
│   │   │   └── useTheme.js        # Dark mode
│   │   ├── context/ToastContext.jsx
│   │   ├── components/            # UploadZone, Dashboard, Charts, IssueTable, ...
│   │   ├── App.jsx                # Routes: Upload ("/") and Dashboard ("/dashboard")
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env.example
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Installation

### Prerequisites

- Node.js 18+ and npm
- Python 3.12
- A Grok (xAI) API key — get one at https://console.x.ai/

### 1. Clone / unzip the project

```bash
cd CursorPM
```

### 2. Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Open `backend/.env` and set your key:

```
GROK_API_KEY=your_grok_api_key_here
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
cp .env.example .env
```

---

## Environment Variables

### `backend/.env`

| Variable          | Description                                   | Default                   |
|-------------------|------------------------------------------------|----------------------------|
| `GROK_API_KEY`    | Your xAI Grok API key (**required**)           | —                          |
| `GROK_API_BASE_URL` | Grok API base URL                            | `https://api.x.ai/v1`     |
| `GROK_MODEL`      | Grok model name                                | `grok-2-latest`            |
| `CORS_ORIGINS`    | Comma-separated allowed frontend origins       | `http://localhost:5173,http://localhost:3000` |
| `APP_ENV`         | `development` or `production`                  | `development`               |
| `LOG_LEVEL`       | Python logging level                           | `INFO`                      |

### `frontend/.env`

| Variable              | Description                     | Default                 |
|-----------------------|----------------------------------|--------------------------|
| `VITE_API_BASE_URL`   | URL of the FastAPI backend       | `http://localhost:8000` |

---

## Run Locally

**Backend:**

```bash
cd backend
uvicorn main:app --reload
```

The API is now at `http://localhost:8000` (interactive docs at
`http://localhost:8000/docs`).

**Frontend** (in a second terminal):

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`. Drag in a JSON file (or click **Try sample
data**) and click **Analyze Feedback**.

---

## Run with Docker

```bash
# from the project root, after filling in backend/.env
docker compose up --build
```

- Frontend: `http://localhost:80`
- Backend: `http://localhost:8000`

---

## API Documentation

### `POST /analyze`

Request body:

```json
{
  "reviews": [
    { "id": 1, "review": "App crashes while uploading image." },
    { "id": 2, "review": "Dark mode would be great." }
  ]
}
```

Response: an `AnalyzeResponse` object containing `stats`, `charts`,
`clusters` (the prioritized issue list), `reviews` (per-review AI
classification), `engineering_tasks`, `pm_summary`, and `prd_markdown`. See
`backend/app/models/schemas.py` for the exact shape, or the live schema at
`/docs`.

### `POST /export/{format}`

`format` is one of `json`, `csv`, `xlsx`, `prd`, `tasks`. Body:

```json
{ "analysis": { /* the AnalyzeResponse returned by /analyze */ } }
```

Returns the corresponding file as a binary download.

### `GET /health`

Returns `{"status": "ok", "grok_configured": true, "model": "grok-2-latest"}`
— useful for confirming the API key is loaded before running a real
analysis.

---

## Deployment

### Backend → Render

1. Push this repo to GitHub.
2. Create a new **Web Service** on Render, pointing at `backend/`.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add the environment variables from `backend/.env.example` in Render's
   dashboard (set `GROK_API_KEY` to your real key, and `CORS_ORIGINS` to
   your deployed frontend URL).

### Frontend → Vercel

1. Import the repo in Vercel, set the project root to `frontend/`.
2. Framework preset: Vite.
3. Add environment variable `VITE_API_BASE_URL` pointing at your Render
   backend URL.
4. Deploy.

---

## Screenshots

> _Add screenshots of the upload screen and dashboard here after your first
> run, e.g. `docs/screenshot-upload.png` and `docs/screenshot-dashboard.png`._

---

## Future Scope

- Persist analyses in Supabase so past runs can be revisited and compared
  over time (trend charts, "issues resolved since last run")
- Multi-file / incremental upload (merge new feedback into an existing
  analysis)
- Slack / Jira integration to push generated engineering tasks directly
  into a real backlog
- User accounts and per-team workspaces
- Configurable priority formula weights from the UI
