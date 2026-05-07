# Big Data React + FastAPI Project

FastAPI backend + React frontend for real-time weather/sensor data, WebSocket streaming, ML-based anomaly detection, prediction, Prometheus-style metrics, and a modern dashboard.

## Tech Stack

### Backend
- Python 3.11+
- FastAPI, Uvicorn, WebSockets
- httpx for Open-Meteo integration
- scikit-learn for anomaly detection and prediction
- structlog for structured logging
- Prometheus-compatible metrics endpoint

### Frontend
- React
- JavaScript
- Recharts
- REST + WebSocket integration

## Features

- Real weather data from Open-Meteo, no API key required
- Live data stream over WebSocket
- ML anomaly detection and prediction
- Health check endpoint
- Prometheus-compatible metrics endpoint
- Dashboard, ML dashboard, and settings page
- Docker and Docker Compose support

## Project Structure

```text
Big-Data-React-Fastapi/
├── backend/
│   ├── main.py           # FastAPI application, WebSocket, metrics, settings
│   ├── ml_models.py      # ML anomaly detection, prediction, metrics
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   ├── Settings.js
│   │   ├── MLDashboard.js
│   │   └── config.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Requirements

- Python 3.11+
- Node.js and npm
- Docker and Docker Compose, optional

## Installation and Running

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend endpoints:

- `GET /data` returns one-time JSON snapshot data
- `WS /ws` streams live JSON data every second
- `GET /healthz` returns health status
- `GET /metrics` returns Prometheus-compatible metrics

### Frontend

```bash
cd frontend
npm install
npm start
```

The frontend runs at `http://localhost:3000`.

### Docker

```bash
docker compose up --build
```

## Configuration

Backend environment variables:

```env
FRONTEND_ORIGINS=http://localhost:3000
WEATHER_LAT=41.015
WEATHER_LON=28.979
WEATHER_CACHE_TTL=60
```

Frontend API and WebSocket addresses can be configured with frontend environment variables or `src/config.js`.

## API Guide

- `GET /data` → one-time snapshot with real + simulated data and ML fields
- `WS /ws` → live data stream
- `GET /healthz` → health check
- `GET /metrics` → Prometheus-compatible metrics
- `POST /ml/train` → train ML model
- `GET /ml/performance` → model performance metrics
- `GET /ml/anomalies` → recent anomalies
- `GET /settings` / `POST /settings` → read/update runtime settings

## Roadmap Ideas

- Add tests for API endpoints
- Add `.env.example` files for backend and frontend
- Add Kafka, Redis Streams, or Kinesis integration for stream processing
- Add authentication for settings and admin operations
