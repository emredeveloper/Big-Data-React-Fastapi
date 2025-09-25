# Big Data React + FastAPI Project

FastAPI backend + React frontend. Gerçek hava durumu verisi (Open‑Meteo), WebSocket canlı akış, ML tabanlı anomali tespiti ve tahmin, Prometheus metrikleri ve modern bir dashboard.

## Teknoloji Yığını

- Backend
  - Python 3.11+
  - FastAPI, Uvicorn, websockets
  - httpx (Open‑Meteo entegrasyonu)
  - scikit‑learn (Isolation Forest + Linear Regression)
  - structlog (loglama)
- Frontend
  - React (Create React App)
  - JavaScript (ES6+)
  - Recharts (grafikler)

## Dosya Yapısı

```text
Big data - React - AI/
├── backend/
│   ├── main.py           # FastAPI uygulaması + ML endpoint'leri + metrics
│   ├── ml_models.py      # ML (anomali tespiti, tahmin, metrikler)
│   ├── requirements.txt
│   └── venv/         # Python sanal ortam
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js        # Dashboard + navigasyon
│   │   ├── Settings.js   # Ayarlar sayfası
│   │   ├── MLDashboard.js# ML performans sayfası
│   │   ├── config.js     # API/WS adresleri
│   ├── package.json
│   └── node_modules/
├── .gitignore
└── README.md
```

## Özellikler

- Gerçek veri: Open‑Meteo'dan sıcaklık/nem (anahtar gerektirmez)
- Canlı akış: WebSocket ile her saniye veri
- ML: Isolation Forest ile anomali, Random Forest ile tahmin
- Gözlemlenebilirlik: `/healthz` ve Prometheus uyumlu `/metrics`
- UI: Modern dashboard, ML dashboard, Ayarlar sayfası
- Docker: Backend/Frontend Dockerfile ve `docker-compose.yml`

### Gereksinimler

- Python 3.8 veya üstü
- Node.js ve npm
- Git (opsiyonel)

### Kurulum ve Çalıştırma

1. **Backend**

   ```cmd
   cd backend
   python -m venv venv
   venv\Scripts\activate   # Windows için
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

   - Servis `http://127.0.0.1:8000/data` endpoint'inden tek seferlik JSON snapshot verisi döner.
   - `ws://127.0.0.1:8000/ws` WebSocket endpoint'i, her saniye bir anlık JSON veri yayını yapar.

2. **Frontend**

   ```cmd
   cd frontend
   npm install
   npm start
   ```

   - Uygulama `http://localhost:3000` adresinde çalışır.
   - Dashboard, ML Dashboard ve Ayarlar menü üzerinden erişilebilir.

3. **Docker (opsiyonel)**

   ```bash
   docker compose up --build
   ```

### Önemli

- CORS, `FRONTEND_ORIGINS` env ile yönetilir (geliştirmede `http://localhost:3000`).
- WebSocket adresi ve API adresi frontend `.env` veya `src/config.js` üzerinden yapılandırılır.
- `.gitignore` dosyası, Python ve Node.js derlenmiş dosyalarını, sanal ortamları ve build klasörlerini içerir.

### API Rehber

- `GET /data` → tek seferlik snapshot (gerçek+simüle veri, ML alanları dahil)
- `WS /ws` → canlı veri akışı
- `GET /healthz` → sağlık kontrolü
- `GET /metrics` → Prometheus metrikleri (ML metrikleri dahil)
- `POST /ml/train` → modeli eğit
- `GET /ml/performance` → model performans metrikleri
- `GET /settings` / `POST /settings` → ayarlar oku/güncelle

## Kullanım

1. Önce backend sunucusunu çalıştırın.
2. Ardından frontend uygulamasını başlatın.
3. Tarayıcıda `http://localhost:3000` adresini açın. "Snapshot" verisini ve anlık stream listesini göreceksiniz.

---

> Projenin geliştirilmesi, büyük veri (Big Data) ya da gerçek zamanlı veri işleme (stream processing) altyapılarına kolayca entegre edilebilir. Örneğin; Kafka, Kinesis, Redis Streams vb. ile genişletilebilir.
