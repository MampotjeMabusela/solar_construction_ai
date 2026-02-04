import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

type InventoryRecommendation = {
  materialId: string;
  materialName: string;
  currentStock: number;
  daysOfCover: number;
  action: "OK" | "WATCH" | "REORDER";
  reorderPoint: number;
  reorderQuantity: number;
};

type ForecastPoint = {
  date: string;
  quantityForecast: number;
};

type MaterialForecast = {
  materialId: string;
  materialName: string;
  recommendation: InventoryRecommendation;
  forecast: ForecastPoint[];
  total30Day: number;
  avgPerDay: number;
};

const REFRESH_INTERVAL_MS = 30000;
const FORECAST_COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  duration = 500,
  className = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = Number(value);
    if (from === to) return;
    prevRef.current = to;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 2);
      setDisplay(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return (
    <span className={className}>
      {Number(display).toFixed(decimals)}
      {suffix}
    </span>
  );
}

const MaterialsDashboard: React.FC = () => {
  const [recommendations, setRecommendations] = useState<InventoryRecommendation[]>([]);
  const [forecasts, setForecasts] = useState<MaterialForecast[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/materials/inventory/recommendations")
      .then((r) => r.json())
      .then((recData) => {
        const recs = recData.recommendations ?? [];
        setLastUpdated(recData.lastUpdated ?? new Date().toISOString());
        if (recs.length === 0) {
          setRecommendations([]);
          setForecasts([]);
          setLoading(false);
          return;
        }
        setRecommendations(recs);
        return Promise.all(
          recs.map((rec: InventoryRecommendation) =>
            fetch(`/materials/forecast/${encodeURIComponent(rec.materialId)}?horizonDays=30`).then(
              (r) => r.json()
            )
          )
        ).then((fcastResponses) => {
          const results: MaterialForecast[] = recs.map((rec: InventoryRecommendation, i: number) => {
            const data = fcastResponses[i] ?? {};
            const forecast: ForecastPoint[] = data.forecast ?? [];
            const total30Day = forecast.reduce((s: number, p: ForecastPoint) => s + p.quantityForecast, 0);
            const avgPerDay = forecast.length ? total30Day / forecast.length : 0;
            return {
              materialId: rec.materialId,
              materialName: rec.materialName,
              recommendation: rec,
              forecast,
              total30Day,
              avgPerDay,
            };
          });
          setForecasts(results);
        });
      })
      .catch((err) => console.error("Failed to load data", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  const actionClass = (action: string) =>
    action === "OK" ? "badge-ok" : action === "WATCH" ? "badge-watch" : "badge-reorder";

  // Combined chart data: one row per day with a key per material
  const combinedChartData =
    forecasts.length > 0 && forecasts[0].forecast.length > 0
      ? forecasts[0].forecast.map((_, dayIdx) => {
          const point: Record<string, string | number> = {
            day: dayIdx + 1,
            name: `Day ${dayIdx + 1}`,
          };
          forecasts.forEach((mf, i) => {
            const p = mf.forecast[dayIdx];
            if (p) point[mf.materialId] = Math.round(p.quantityForecast * 10) / 10;
          });
          return point;
        })
      : [];

  return (
    <section className="materials-page">
      <h2 className="section-heading">Materials Forecasting & Inventory</h2>
      <p className="section-sub">
        Live reorder points and 30-day demand forecast for all materials. Refreshes every 30 seconds.
      </p>
      <div className="live-indicator materials-live" style={{ marginBottom: "1.25rem" }}>
        <span className="live-dot" />
        {lastUpdated ? `Last updated ${formatTimeAgo(lastUpdated)}` : "Loading…"}
      </div>

      <div className="card">
        <h3>Inventory recommendations</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Current stock</th>
                <th>Days of cover</th>
                <th>Reorder point</th>
                <th>Reorder qty</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && recommendations.length === 0 ? (
                <tr>
                  <td colSpan={6}>Loading…</td>
                </tr>
              ) : (
                recommendations.map((rec) => (
                  <tr key={rec.materialId}>
                    <td>{rec.materialName}</td>
                    <td>{rec.currentStock.toFixed(0)}</td>
                    <td>{rec.daysOfCover.toFixed(1)}</td>
                    <td>{rec.reorderPoint.toFixed(0)}</td>
                    <td>{rec.reorderQuantity.toFixed(0)}</td>
                    <td>
                      <span className={`badge ${actionClass(rec.action)}`}>{rec.action}</span>
                    </td>
                  </tr>
                ))
              )}
              {!loading && recommendations.length === 0 && (
                <tr>
                  <td colSpan={6}>No recommendations. Configure materials and import usage data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 30-Day Demand Forecast – hero section */}
      <div className="forecast-hero">
        <div className="forecast-hero-content">
          <span className="forecast-hero-badge">Next 30 days</span>
          <h3 className="forecast-hero-title">Demand forecast for all materials</h3>
          <p className="forecast-hero-sub">
            Daily projected demand so you can plan orders and avoid stockouts.
          </p>
        </div>
      </div>

      {/* Combined trend chart */}
      {combinedChartData.length > 0 && (
        <div className="card forecast-combined-card forecast-animated">
          <h3 className="forecast-combined-title">All materials – daily demand (units/day)</h3>
          <div className="forecast-combined-chart">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={combinedChartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11 }}
                  stroke="var(--text-muted)"
                  tickFormatter={(d) => `D${d}`}
                />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" width={40} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [value, "Units"]}
                  labelFormatter={(label, payload) => {
                    const p = payload?.[0]?.payload as { day?: number } | undefined;
                    return p?.day != null ? `Day ${p.day}` : label;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "0.8125rem" }}
                  formatter={(value) => forecasts.find((f) => f.materialId === value)?.materialName ?? value}
                />
                {forecasts.map((mf, i) => (
                  <Line
                    key={mf.materialId}
                    type="monotone"
                    dataKey={mf.materialId}
                    name={mf.materialName}
                    stroke={FORECAST_COLORS[i % FORECAST_COLORS.length]}
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Per-material forecast cards */}
      <div className="forecast-cards-grid">
        {forecasts.map((mf, idx) => (
          <div
            key={mf.materialId}
            className="forecast-material-card forecast-animated"
            style={{ animationDelay: `${idx * 0.08}s` }}
          >
            <div
              className="forecast-material-card-accent"
              style={{ background: FORECAST_COLORS[idx % FORECAST_COLORS.length] }}
            />
            <div className="forecast-material-card-body">
              <h4 className="forecast-material-name">{mf.materialName}</h4>
              <div className="forecast-material-stats">
                <div className="forecast-stat">
                  <span className="forecast-stat-label">Total 30-day demand</span>
                  <AnimatedNumber
                    value={mf.total30Day}
                    decimals={0}
                    className="forecast-stat-value"
                    duration={600}
                  />
                  <span className="forecast-stat-unit"> units</span>
                </div>
                <div className="forecast-stat">
                  <span className="forecast-stat-label">Avg per day</span>
                  <AnimatedNumber
                    value={mf.avgPerDay}
                    decimals={1}
                    className="forecast-stat-value forecast-stat-value-accent"
                    duration={600}
                  />
                  <span className="forecast-stat-unit"> units</span>
                </div>
                <div className="forecast-stat">
                  <span className="forecast-stat-label">Current stock covers</span>
                  <span className="forecast-stat-value">
                    {mf.recommendation.daysOfCover < 999
                      ? mf.recommendation.daysOfCover.toFixed(0)
                      : "—"}
                  </span>
                  <span className="forecast-stat-unit"> days</span>
                </div>
              </div>
              <div className="forecast-material-chart-wrap">
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart
                    data={mf.forecast.map((p, i) => ({ day: i + 1, value: p.quantityForecast }))}
                    margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id={`grad-${mf.materialId}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={FORECAST_COLORS[idx % FORECAST_COLORS.length]}
                          stopOpacity={0.5}
                        />
                        <stop
                          offset="100%"
                          stopColor={FORECAST_COLORS[idx % FORECAST_COLORS.length]}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" hide />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-light)",
                        borderRadius: "6px",
                        fontSize: "0.8125rem",
                      }}
                      formatter={(v: number) => [v.toFixed(1), "Units/day"]}
                      labelFormatter={(_, p) => (p?.[0] ? `Day ${p[0].payload?.day}` : "")}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={FORECAST_COLORS[idx % FORECAST_COLORS.length]}
                      strokeWidth={2}
                      fill={`url(#grad-${mf.materialId})`}
                      isAnimationActive
                      animationDuration={700}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="forecast-material-action">
                <span className={`badge ${actionClass(mf.recommendation.action)}`}>
                  {mf.recommendation.action}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && forecasts.length === 0 && recommendations.length > 0 && (
        <div className="card">
          <p className="section-sub" style={{ margin: 0 }}>
            Loading 30-day forecasts…
          </p>
        </div>
      )}
    </section>
  );
};

export default MaterialsDashboard;
