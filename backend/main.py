from fastapi import FastAPI, WebSocket
from fastapi.responses import JSONResponse
import asyncio, random, time, math
import psutil  # Sistem metrikleri için

app = FastAPI()

# Allow CORS from React dev server
from fastapi.middleware.cors import CORSMiddleware

origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_sensor_data():
    """Gerçekçi sensör verileri üret"""
    timestamp = time.time()
    
    # Sinüs dalgası tabanlı sıcaklık (20-30°C arası)
    temperature = 25 + 5 * math.sin(timestamp / 10) + random.uniform(-1, 1)
    
    # Rastgele nem (40-80% arası)
    humidity = 60 + 20 * math.sin(timestamp / 15) + random.uniform(-5, 5)
    
    # CPU kullanımı
    cpu_usage = psutil.cpu_percent()
    
    # Bellek kullanımı
    memory = psutil.virtual_memory()
    memory_usage = memory.percent
    
    # Ağ trafiği (simüle)
    network_speed = 50 + 30 * math.sin(timestamp / 5) + random.uniform(-10, 10)
    
    return {
        "timestamp": timestamp,
        "temperature": round(temperature, 2),
        "humidity": round(humidity, 2),
        "cpu_usage": round(cpu_usage, 2),
        "memory_usage": round(memory_usage, 2),
        "network_speed": round(max(0, network_speed), 2),
        "status": "active" if random.random() > 0.1 else "warning"
    }

@app.get("/data")
async def get_data():
    """Tek seferlik veri snapshot'ı"""
    return JSONResponse(content=generate_sensor_data())

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """Canlı veri akışı"""
    await ws.accept()
    try:
        while True:
            data = generate_sensor_data()
            await ws.send_json(data)
            await asyncio.sleep(1)  # Her saniye veri gönder
    except Exception as e:
        print(f"WebSocket error: {e}")
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
