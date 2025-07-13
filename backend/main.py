from fastapi import FastAPI, WebSocket
from fastapi.responses import JSONResponse
import asyncio, random

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

@app.get("/data")
async def get_data():
    sample = {"timestamp": asyncio.get_event_loop().time(),
              "value": random.random()}
    return JSONResponse(content=sample)

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            data = {"ts": asyncio.get_event_loop().time(), "v": random.random()}
            await ws.send_json(data)
            await asyncio.sleep(1)
    except Exception:
        await ws.close()
