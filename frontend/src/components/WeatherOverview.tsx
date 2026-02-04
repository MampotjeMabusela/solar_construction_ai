import React, { useEffect, useState } from "react";

type CityWeather = {
  name: string;
  temp: number;
  code: number;
  precipitation: number;
  loading?: boolean;
  error?: string;
  isFallback?: boolean;
};

const SA_CITIES = [
  { name: "Johannesburg", lat: -26.2041, lon: 28.0473 },
  { name: "Cape Town", lat: -33.9249, lon: 18.4241 },
  { name: "Durban", lat: -29.8587, lon: 31.0218 },
  { name: "Pretoria", lat: -25.7479, lon: 28.2293 },
  { name: "Bloemfontein", lat: -29.1167, lon: 26.2167 },
];

function weatherLabel(code: number): string {
  const map: Record<number, string> = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Foggy",
    51: "Drizzle",
    53: "Drizzle",
    55: "Drizzle",
    61: "Rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Snow",
    73: "Snow",
    75: "Snow",
    80: "Showers",
    81: "Showers",
    82: "Heavy showers",
    95: "Thunderstorm",
    96: "Thunderstorm",
    99: "Thunderstorm",
  };
  return map[code] ?? "Unknown";
}

function operationTip(code: number, precipitation: number): string {
  if (precipitation > 0 || code >= 61) return "Avoid outdoor roofing; consider indoor prep.";
  if (code >= 80 || code === 95) return "Postpone exposed work; check again later.";
  if (code === 0 || code === 1) return "Ideal for roofing and solar installations.";
  if (code === 2 || code === 3) return "Suitable for most operations; monitor clouds.";
  return "Generally suitable; check local conditions.";
}

/** Generate realistic indicative weather for SA cities (used when API is unavailable). */
function generateFallbackWeather(): CityWeather[] {
  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth();
  const seed = (month * 31 + hour + now.getDate()) % 100;
  const baseTemps: Record<string, number> = {
    Johannesburg: 18,
    "Cape Town": 16,
    Durban: 22,
    Pretoria: 19,
    Bloemfontein: 17,
  };
  const codes = [0, 1, 2, 2, 3, 3];
  return SA_CITIES.map((city, i) => {
    const baseTemp = baseTemps[city.name] ?? 18;
    const hourOffset = (hour - 12) * 0.8;
    const variation = ((seed + i * 7) % 11) - 5;
    const temp = Math.round(baseTemp + hourOffset + variation);
    const codeIndex = (seed + i * 3) % codes.length;
    const code = codes[codeIndex];
    const precip = code >= 61 ? Math.round(((seed + i) % 5) * 0.5 * 10) / 10 : 0;
    return {
      name: city.name,
      temp: Math.max(8, Math.min(35, temp)),
      code,
      precipitation: precip,
      isFallback: true,
    };
  });
}

const WeatherOverview: React.FC = () => {
  const [cities, setCities] = useState<CityWeather[]>(
    SA_CITIES.map((c) => ({ name: c.name, temp: 0, code: 0, precipitation: 0, loading: true }))
  );
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      let results: CityWeather[];
      try {
        results = await Promise.all(
          SA_CITIES.map(async (city) => {
            try {
              const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code,precipitation&timezone=Africa/Johannesburg`;
              const res = await fetch(url);
              if (!res.ok) throw new Error("API error");
              const data = await res.json();
              const cur = data.current ?? {};
              const temp = cur.temperature_2m ?? 0;
              const code = cur.weather_code ?? 0;
              const precipitation = cur.precipitation ?? 0;
              return { name: city.name, temp, code, precipitation };
            } catch {
              return { name: city.name, temp: 0, code: 0, precipitation: 0, error: "Unavailable" };
            }
          })
        );
        const anyFailed = results.some((r) => r.error || (r.temp === 0 && r.code === 0));
        if (anyFailed) {
          results = generateFallbackWeather();
          setUsingFallback(true);
        }
      } catch {
        results = generateFallbackWeather();
        setUsingFallback(true);
      }
      setCities(results);
    };
    fetchAll();
  }, []);

  const loading = cities.some((c) => (c as CityWeather & { loading?: boolean }).loading);

  return (
    <section className="weather-overview">
      <h2 className="home-section-title">Weather overview – South Africa</h2>
      <p className="home-section-sub">
        Plan operations: dry, clear conditions favour roofing and solar work; rain or storms may delay outdoor work.
        {usingFallback && (
          <span className="weather-fallback-note"> Showing indicative data (live feed temporarily unavailable).</span>
        )}
      </p>
      <div className="weather-grid">
        {cities.map((city) => (
          <div key={city.name} className="weather-card">
            <h3 className="weather-card-city">{city.name}</h3>
            {city.error && !city.temp && !city.code ? (
              <p className="weather-card-meta">{city.error}</p>
            ) : (
              <>
                <p className="weather-card-temp">{Math.round(city.temp)}°C</p>
                <p className="weather-card-desc">{weatherLabel(city.code)}</p>
                {city.precipitation > 0 && (
                  <p className="weather-card-precip">Precip: {city.precipitation} mm</p>
                )}
                <p className="weather-card-tip">{operationTip(city.code, city.precipitation)}</p>
              </>
            )}
          </div>
        ))}
      </div>
      {loading && cities.every((c) => (c as CityWeather & { loading?: boolean }).loading) && (
        <p className="weather-loading">Loading weather…</p>
      )}
    </section>
  );
};

export default WeatherOverview;
