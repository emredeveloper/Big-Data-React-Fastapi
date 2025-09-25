from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import JSONResponse, PlainTextResponse
import asyncio, random, time, math
import os
import structlog
import psutil  # Sistem metrikleri için
import httpx
import math
from ml_models import SensorDataML

logger = structlog.get_logger()
app = FastAPI()

# ML modeli başlat
ml_model = SensorDataML()

# Allow CORS from React dev server
from fastapi.middleware.cors import CORSMiddleware

origins_env = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000")
origins = [o.strip() for o in origins_env.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

WEATHER_LAT = float(os.getenv("WEATHER_LAT", "41.015"))  # İstanbul varsayılan
WEATHER_LON = float(os.getenv("WEATHER_LON", "28.979"))
WEATHER_CACHE_TTL = int(os.getenv("WEATHER_CACHE_TTL", "60"))  # saniye

_weather_cache = {"ts": 0.0, "temp": None, "rh": None}
_weather_lock = asyncio.Lock()

async def _fetch_open_meteo_current() -> tuple[float | None, float | None]:
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={WEATHER_LAT}&longitude={WEATHER_LON}"
        "&current=temperature_2m,relative_humidity_2m"
    )
    timeout = httpx.Timeout(5.0, read=5.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()
        current = data.get("current", {})
        temp = current.get("temperature_2m")
        rh = current.get("relative_humidity_2m")
        return temp, rh

async def get_weather_values() -> tuple[float | None, float | None]:
    now = time.time()
    if now - _weather_cache["ts"] < WEATHER_CACHE_TTL and _weather_cache["temp"] is not None:
        return _weather_cache["temp"], _weather_cache["rh"]
    async with _weather_lock:
        # Tekrar kontrol et (double-checked)
        if now - _weather_cache["ts"] < WEATHER_CACHE_TTL and _weather_cache["temp"] is not None:
            return _weather_cache["temp"], _weather_cache["rh"]
        try:
            temp, rh = await _fetch_open_meteo_current()
            _weather_cache.update({"ts": now, "temp": temp, "rh": rh})
            return temp, rh
        except Exception as e:
            logger.warning("weather_fetch_failed", error=str(e))
            # Cache bozma ama en azından None döndür
            return _weather_cache["temp"], _weather_cache["rh"]

async def generate_sensor_data_async():
    """Gerçek verilerle zenginleştirilmiş sensör verileri üretir."""
    timestamp = time.time()
    # Gerçek sıcaklık ve nem
    real_temp, real_rh = await get_weather_values()

    # Fallback/sinyal gürültüsü ekleme
    if real_temp is None:
        temperature = 25 + 5 * math.sin(timestamp / 10) + random.uniform(-1, 1)
    else:
        temperature = float(real_temp) + random.uniform(-0.3, 0.3)

    if real_rh is None:
        humidity = 60 + 20 * math.sin(timestamp / 15) + random.uniform(-5, 5)
    else:
        humidity = float(real_rh) + random.uniform(-1.5, 1.5)

    # CPU kullanımı
    cpu_usage = psutil.cpu_percent()
    # Bellek kullanımı
    memory = psutil.virtual_memory()
    memory_usage = memory.percent
    # Ağ trafiği (simüle)
    network_speed = 50 + 30 * math.sin(timestamp / 5) + random.uniform(-10, 10)

    # Temel veri
    base_data = {
        "timestamp": timestamp,
        "temperature": round(temperature, 2),
        "humidity": round(humidity, 2),
        "cpu_usage": round(cpu_usage, 2),
        "memory_usage": round(memory_usage, 2),
        "network_speed": round(max(0, network_speed), 2),
        "status": "active" if random.random() > 0.1 else "warning"
    }
    
    # ML analizi ekle
    ml_analysis = ml_model.add_data_point(base_data)
    base_data.update(ml_analysis)
    
    return base_data

@app.get("/data")
async def get_data():
    """Tek seferlik veri snapshot'ı"""
    return JSONResponse(content=await generate_sensor_data_async())

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """Canlı veri akışı"""
    await ws.accept()
    try:
        while True:
            data = await generate_sensor_data_async()
            await ws.send_json(data)
            await asyncio.sleep(1)  # Her saniye veri gönder
    except Exception as e:
        logger.warning("websocket_error", error=str(e))
        # Bağlantı zaten kapalıysa tekrar kapatmaya çalışma
        if ws.client_state.name != "DISCONNECTED":
            try:
                await ws.close()
            except:
                pass

@app.get("/stats")
async def get_stats():
    """Sistem istatistikleri"""
    return JSONResponse(content={
        "uptime": time.time(),
        "cpu_count": psutil.cpu_count(),
        "memory_total": psutil.virtual_memory().total,
        "disk_usage": psutil.disk_usage('/').percent
    })

@app.get("/healthz")
async def healthz():
    return PlainTextResponse("ok")

def format_prometheus_metric(name: str, value, metric_type: str = "gauge", help_text: str = "") -> str:
    lines = []
    if help_text:
        lines.append(f"# HELP {name} {help_text}")
    if metric_type:
        lines.append(f"# TYPE {name} {metric_type}")
    lines.append(f"{name} {value}")
    return "\n".join(lines)

@app.get("/metrics")
async def metrics(request: Request):
    snapshot = await generate_sensor_data_async()
    parts = [
        format_prometheus_metric("app_temperature_celsius", snapshot["temperature"], "gauge", "Simulated temperature"),
        format_prometheus_metric("app_humidity_percent", snapshot["humidity"], "gauge", "Simulated humidity"),
        format_prometheus_metric("system_cpu_usage_percent", snapshot["cpu_usage"], "gauge", "CPU usage percent"),
        format_prometheus_metric("system_memory_usage_percent", snapshot["memory_usage"], "gauge", "Memory usage percent"),
        format_prometheus_metric("network_speed_mbps", snapshot["network_speed"], "gauge", "Simulated network speed"),
        format_prometheus_metric("ml_anomaly_detected", 1 if snapshot.get("is_anomaly", False) else 0, "gauge", "Anomaly detected"),
        format_prometheus_metric("ml_anomaly_score", snapshot.get("anomaly_score", 0), "gauge", "Anomaly score"),
    ]
    body = "\n".join(parts) + "\n"
    return PlainTextResponse(body, media_type="text/plain; version=0.0.4")

# ML ile ilgili endpoint'ler
@app.post("/ml/train")
async def train_ml_model():
    """ML modelini eğit"""
    result = ml_model.train_models()
    return JSONResponse(content=result)

@app.get("/ml/performance")
async def get_ml_performance():
    """ML model performans metriklerini getir"""
    metrics = ml_model.get_performance_metrics()
    return JSONResponse(content=metrics)

@app.get("/ml/anomalies")
async def get_recent_anomalies(limit: int = 10):
    """Son anomali tespitlerini getir"""
    anomalies = ml_model.get_recent_anomalies(limit)
    return JSONResponse(content=anomalies)

@app.get("/settings")
async def get_settings():
    """Mevcut ayarları getir"""
    return JSONResponse(content={
        "weather_lat": WEATHER_LAT,
        "weather_lon": WEATHER_LON,
        "weather_cache_ttl": WEATHER_CACHE_TTL,
        "ml_training_samples": len(ml_model.training_data),
        "ml_is_trained": ml_model.is_trained
    })

@app.post("/settings")
async def update_settings(settings: dict):
    """Ayar güncelle"""
    global WEATHER_LAT, WEATHER_LON, WEATHER_CACHE_TTL
    
    if "weather_lat" in settings:
        WEATHER_LAT = float(settings["weather_lat"])
    if "weather_lon" in settings:
        WEATHER_LON = float(settings["weather_lon"])
    if "weather_cache_ttl" in settings:
        WEATHER_CACHE_TTL = int(settings["weather_cache_ttl"])
    
    return JSONResponse(content={"success": True, "message": "Ayarlar güncellendi"})
