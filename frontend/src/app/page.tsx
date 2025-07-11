'use client';

import { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import Image from 'next/image';

interface WeatherData {
  city: string;
  temp: number;
  description: string;
}

interface ForecastItem {
  dt_txt: string;
  temp: number;
  description: string;
  icon: string;
}

export default function Home() {
  const [city, setCity] = useState('Almaty');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [geoWeather, setGeoWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWeather = async (cityName: string) => {
    setLoading(true);
    setError('');
    setWeather(null);
    try {
      const response = await axios.get(`http://localhost:8000/api/weather/${cityName}`);
      setWeather(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось загрузить данные о погоде.');
    } finally {
      setLoading(false);
    }
  };

  const fetchForecast = async (cityName: string) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/forecast/${cityName}`);
      setForecast(response.data.forecast); // убираем slice(0, 5)
    } catch (err) {
      setForecast([]);
    }
  };

  const fetchGeoWeather = async (lat: number, lon: number) => {
    try {
      const response = await axios.post('http://localhost:8000/api/weather/coords', { lat, lon });
      setGeoWeather(response.data);
    } catch (err) {
      setGeoWeather(null);
    }
  };

  useEffect(() => {
    fetchWeather(city);
    fetchForecast(city);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchGeoWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => {}
      );
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (city.trim()) {
      fetchWeather(city.trim());
      fetchForecast(city.trim());
    }
  };

  function getDailyForecast(forecast: ForecastItem[]) {
    // Группируем по дате
    const grouped: { [date: string]: ForecastItem[] } = {};
    forecast.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(item);
    });
  
    // Для каждой даты ищем прогноз, ближайший к 12:00
    const result: ForecastItem[] = [];
    Object.keys(grouped).slice(0, 5).forEach(date => {
      const dayForecasts = grouped[date];
      // Ищем ближайший к 12:00
      let best = dayForecasts[0];
      let minDiff = Math.abs(Number(best.dt_txt.split(' ')[1].split(':')[0]) - 12);
      dayForecasts.forEach(item => {
        const hour = Number(item.dt_txt.split(' ')[1].split(':')[0]);
        const diff = Math.abs(hour - 12);
        if (diff < minDiff) {
          minDiff = diff;
          best = item;
        }
      });
      result.push(best);
    });
    return result;
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 to-purple-300 p-4">
      <div className="w-full max-w-sm bg-white/50 backdrop-blur-md p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">Погода</h1>
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Введите город"
            className="flex-grow p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          <button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-600 text-white font-bold p-2 rounded-lg disabled:bg-blue-300">
            {loading ? '...' : '➔'}
          </button>
        </form>

        {loading && <p className="text-center text-gray-700">Загрузка...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {weather && (
          <div className="flex flex-col items-center text-center text-gray-900">
            <h2 className="text-3xl font-semibold">{weather.city}</h2>
            <p className="text-6xl font-light">{Math.round(weather.temp)}°C</p>
            <p className="text-lg capitalize">{weather.description}</p>
          </div>
        )}

        {forecast.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2">Прогноз на 5 дней:</h3>
            <ul>
              {getDailyForecast(forecast).map((item, idx) => (
                <li key={idx} className="text-gray-800 flex items-center gap-2">
                  <img
                    src={`https://openweathermap.org/img/wn/${item.icon}@2x.png`}
                    alt={item.description}
                    width={40}
                    height={40}
                  />
                  <span>{item.dt_txt.split(' ')[0]}: {item.temp}°C, {item.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {geoWeather && (
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2">Погода по вашему местоположению:</h3>
            <p className="text-gray-800">Город: {geoWeather.city}</p>
            <p className="text-gray-800">Температура: {geoWeather.temp}°C</p>
            <p className="text-gray-800">Описание: {geoWeather.description}</p>
          </div>
        )}
      </div>
    </main>
  );
}