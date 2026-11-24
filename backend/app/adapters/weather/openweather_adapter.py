"""OpenWeatherMap adapter."""
from typing import Dict, Any, Optional
from app.core.config import settings


HEAT_THRESHOLD_C = 36.0
RAIN_CONDITIONS = {200, 201, 202, 210, 211, 212, 221, 230, 231, 232,
                   300, 301, 302, 310, 311, 312, 313, 314, 321,
                   500, 501, 502, 503, 504, 511, 520, 521, 522, 531,
                   600, 601, 602, 611, 612, 613, 615, 616, 620, 621, 622}


class OpenWeatherAdapter:

    BASE_URL = "https://api.openweathermap.org/data/2.5"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENWEATHER_API_KEY

    async def get_weather(self, lat: float, lon: float) -> Dict[str, Any]:
        if not self.api_key:
            return self._unavailable_response()

        import aiohttp
        async with aiohttp.ClientSession() as session:
            # Current weather
            url = f"{self.BASE_URL}/weather"
            params = {"lat": lat, "lon": lon, "appid": self.api_key, "units": "metric"}
            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status != 200:
                    return self._unavailable_response()
                current = await resp.json()

            # Hourly forecast
            fc_url = f"{self.BASE_URL}/forecast"
            async with session.get(fc_url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                forecast_raw = await resp.json() if resp.status == 200 else {"list": []}

        temp = current["main"]["temp"]
        feels_like = current["main"]["feels_like"]
        condition_id = current["weather"][0]["id"]
        condition_text = current["weather"][0]["description"].capitalize()
        humidity = current["main"]["humidity"]
        wind_speed = current.get("wind", {}).get("speed", 0) * 3.6  # m/s to km/h

        is_rain = condition_id in RAIN_CONDITIONS
        is_extreme_heat = temp > HEAT_THRESHOLD_C

        is_suitable = not is_rain and not is_extreme_heat
        reason = None
        if is_extreme_heat:
            reason = f"Extreme heat ({temp:.0f}°C)"
        elif is_rain:
            reason = f"{condition_text}"

        # Hourly forecast simplified
        hourly = []
        for item in forecast_raw.get("list", [])[:8]:
            hourly.append({
                "time": item["dt_txt"],
                "temp_c": item["main"]["temp"],
                "condition": item["weather"][0]["description"],
                "condition_code": item["weather"][0]["id"],
            })

        return {
            "temperature_celsius": round(temp, 1),
            "feels_like_celsius": round(feels_like, 1),
            "humidity_percent": humidity,
            "condition": condition_text,
            "condition_code": condition_id,
            "wind_speed_kmh": round(wind_speed, 1),
            "is_suitable_outdoor": is_suitable,
            "unsuitable_reason": reason,
            "hourly_forecast": hourly,
        }

    def _unavailable_response(self) -> Dict[str, Any]:
        return {
            "temperature_celsius": None,
            "condition": None,
            "is_suitable_outdoor": True,
            "unsuitable_reason": None,
            "hourly_forecast": [],
        }
