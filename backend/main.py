import os
import httpx # Библиотека для асинхронных HTTP запросов
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv # Для загрузки переменных из .env файла
import requests

# Загружаем переменные окружения из .env файла
load_dotenv()
API_KEY = os.getenv("OPENWEATHER_API_KEY")
app = FastAPI()

# --- Настройка CORS ---
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Эндпоинт API ---
@app.get("/api/weather/{city}")
def get_weather(city: str):
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric&lang=ru"
    resp = requests.get(url)
    if resp.status_code != 200:
        raise HTTPException(status_code=404, detail="City not found")
    data = resp.json()
    return {
        "city": data["name"],
        "temp": data["main"]["temp"],
        "description": data["weather"][0]["description"]
    }

@app.get("/api/forecast/{city}")
def get_forecast(city: str):
    url = f"https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}&units=metric&lang=ru"
    resp = requests.get(url)
    if resp.status_code != 200:
        raise HTTPException(status_code=404, detail="City not found")
    data = resp.json()
    forecast = []
    for item in data["list"]:
        forecast.append({
            "dt_txt": item["dt_txt"],
            "temp": item["main"]["temp"],
            "description": item["weather"][0]["description"],
            "icon": item["weather"][0]["icon"]
        })
    return {"city": data["city"]["name"], "forecast": forecast}

@app.post("/api/weather/coords")
async def get_weather_coords(request: Request):
    body = await request.json()
    lat = body.get("lat")
    lon = body.get("lon")
    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="No coords")
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric&lang=ru"
    resp = requests.get(url)
    if resp.status_code != 200:
        raise HTTPException(status_code=404, detail="Not found")
    data = resp.json()
    return {
        "city": data["name"],
        "temp": data["main"]["temp"],
        "description": data["weather"][0]["description"]
    }