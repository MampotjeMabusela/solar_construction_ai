import React, { useEffect, useState } from "react";

type CityWeather = {
  name: string;
  temp: number;
  code: number;
  precipitation: number;
  windSpeedKmh?: number;
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

/** Small SVG icons for weather overview */
const IconSun: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const IconCloud: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden>
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

const IconRain: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden>
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    <path d="M8 14v4M12 14v4M16 14v4" />
  </svg>
);

const IconWind: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden>
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10 0h8a2 2 0 1 1 0 4h-8M2 16h6a2 2 0 1 1 0 4H2" />
  </svg>
);

/** Pick condition icon from weather code: sun, cloud, or rain */
function ConditionIcon({ code, size = 22 }: { code: number; size?: number }) {
  if (code === 0 || code === 1) return <IconSun size={size} className="weather-icon weather-icon-sun" />;
  if ((code >= 51 && code <= 55) || code >= 61 || code >= 80) return <IconRain size={size} className="weather-icon weather-icon-rain" />;
  return <IconCloud size={size} className="weather-icon weather-icon-cloud" />;
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
    const windSpeedKmh = 5 + ((seed + i * 2) % 12);
    return {
      name: city.name,
      temp: Math.max(8, Math.min(35, temp)),
      code,
      precipitation: precip,
      windSpeedKmh,
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
              const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code,precipitation,wind_speed_10m&timezone=Africa/Johannesburg`;
              const res = await fetch(url);
              if (!res.ok) throw new Error("API error");
              const data = await res.json();
              const cur = data.current ?? {};
              const temp = cur.temperature_2m ?? 0;
              const code = cur.weather_code ?? 0;
              const precipitation = cur.precipitation ?? 0;
              const windSpeedKmh = cur.wind_speed_10m != null ? Number(cur.wind_speed_10m) : undefined;
              return { name: city.name, temp, code, precipitation, windSpeedKmh };
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
                <div className="weather-card-condition">
                  <ConditionIcon code={city.code} />
                  <p className="weather-card-temp">{Math.round(city.temp)}°C</p>
                </div>
                <p className="weather-card-desc">{weatherLabel(city.code)}</p>
                <div className="weather-card-stats">
                  <span className="weather-stat" title="Condition">
                    <ConditionIcon code={city.code} size={16} />
                    <span>{weatherLabel(city.code)}</span>
                  </span>
                  <span className="weather-stat" title="Precipitation">
                    <IconRain size={16} className="weather-icon weather-icon-rain" />
                    <span>{city.precipitation > 0 ? `${city.precipitation} mm` : "0 mm"}</span>
                  </span>
                  <span className="weather-stat" title="Wind speed">
                    <IconWind size={16} className="weather-icon weather-icon-wind" />
                    <span>{city.windSpeedKmh != null ? `${Math.round(city.windSpeedKmh)} km/h` : "—"}</span>
                  </span>
                </div>
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
