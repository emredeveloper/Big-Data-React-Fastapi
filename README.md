# Big Data React + FastAPI Project

FastAPI backend + React frontend. Real weather data (Open‑Meteo), WebSocket live stream, ML-based anomaly detection and prediction, Prometheus metrics and modern dashboard.

## Tech Stack

- Backend
  - Python 3.11+
  - FastAPI, Uvicorn, websockets
  - httpx (Open‑Meteo integration)
  - scikit‑learn (Isolation Forest + Linear Regression)
  - structlog (logging)
- Frontend
  - React (Create React App)
  - JavaScript (ES6+)
  - Recharts (charts)

## File Structure

```text
Big data - React - AI/
├── backend/
│   ├── main.py           # FastAPI application + ML endpoints + metrics
│   ├── ml_models.py      # ML (anomaly detection, prediction, metrics)
│   ├── requirements.txt
│   └── venv/         # Python virtual environment
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js        # Dashboard + navigation
│   │   ├── Settings.js   # Settings page
│   │   ├── MLDashboard.js# ML performance page
│   │   ├── config.js     # API/WS addresses
│   ├── package.json
│   └── node_modules/
├── .gitignore
└── README.md
```

## Features

- Real data: Temperature/humidity from Open‑Meteo (no key required)
- Live stream: Data every second via WebSocket
- ML: Anomaly detection with Isolation Forest, prediction with Random Forest
- Observability: `/healthz` and Prometheus-compatible `/metrics`
- UI: Modern dashboard, ML dashboard, Settings page
- Docker: Backend/Frontend Dockerfile ve `docker-compose.yml`

### Requirements

- Python 3.8 or higher
- Node.js ve npm
- Git (opsiyonel)

### Installation and Running

1. **Backend**

   ```cmd
   cd backend
   python -m venv venv
   venv\Scripts\activate   # For Windows
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

   - Service returns one-time JSON snapshot data from `http://127.0.0.1:8000/data` endpoint.
   - `ws://127.0.0.1:8000/ws` WebSocket endpoint broadcasts real-time JSON data every second.

2. **Frontend**

   ```cmd
   cd frontend
   npm install
   npm start
   ```

   - Application runs at `http://localhost:3000`.
   - Dashboard, ML Dashboard and Settings are accessible via menu.

3. **Docker (optional)**

   ```bash
   docker compose up --build
   ```

### Important

- CORS is managed via `FRONTEND_ORIGINS` env (development: `http://localhost:3000`).
- WebSocket address and API address are configured via frontend `.env` or `src/config.js`.
- `.gitignore` file includes Python and Node.js compiled files, virtual environments and build folders.

### API Guide

- `GET /data` → one-time snapshot (real+simulated data, including ML fields)
- `WS /ws` → live data stream
- `GET /healthz` → health check
- `GET /metrics` → Prometheus metrics (including ML metrics)
- `POST /ml/train` → train model
- `GET /ml/performance` → model performance metrics
- `GET /settings` / `POST /settings` → read/update settings

## Usage

1. First, run the backend server.
2. Then, start the frontend application.
3. Open `http://localhost:3000` in your browser. You will see "Snapshot" data and real-time stream list.

---

> The project development can be easily integrated with Big Data or real-time data processing (stream processing) infrastructures. For example; it can be extended with Kafka, Kinesis, Redis Streams etc.
