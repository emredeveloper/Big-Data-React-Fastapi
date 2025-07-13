# Big Data React + FastAPI Project

Bu proje, bir Python FastAPI tabanlı backend servisi ve React tabanlı frontend uygulamasından oluşur. Backend, REST ve WebSocket ile hem tek seferlik "big data" benzeri JSON snapshot verisi sağlayan, hem de anlık (streaming) veri sunan bir API sunar. Frontend ise bu verileri alıp kullanıcıya gösterir.

## Teknoloji Yığını

- Backend
  - Python 3.8+
  - FastAPI
  - Uvicorn (ASGI sunucu)
  - websockets (WebSocket desteği)
- Frontend
  - React (Create React App)
  - JavaScript (ES6+)

## Dosya Yapısı

```text
Big data - React - AI/
├── backend/
│   ├── main.py       # FastAPI uygulaması
│   ├── requirements.txt
│   └── venv/         # Python sanal ortam
├── frontend/
│   ├── public/
│   ├── src/
│   │   └── App.js    # React ana bileşeni
│   ├── package.json
│   └── node_modules/
├── .gitignore
└── README.md
```

## README İçeriği

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
   - Snapshot verisini ve WebSocket stream verilerini `App.js` içinde render eder.

### Önemli Bilgiler

- CORS, `http://localhost:3000` adresinden gelen istekler için FastAPI içinde `CORSMiddleware` ile etkinleştirildi.
- WebSocket desteği için `websockets` paketi yüklendi.
- `.gitignore` dosyası, Python ve Node.js derlenmiş dosyalarını, sanal ortamları ve build klasörlerini içerir.

## Kullanım

1. Önce backend sunucusunu çalıştırın.
2. Ardından frontend uygulamasını başlatın.
3. Tarayıcıda `http://localhost:3000` adresini açın. "Snapshot" verisini ve anlık stream listesini göreceksiniz.

---

> Projenin geliştirilmesi, büyük veri (Big Data) ya da gerçek zamanlı veri işleme (stream processing) altyapılarına kolayca entegre edilebilir. Örneğin; Kafka, Kinesis, Redis Streams vb. ile genişletilebilir.
