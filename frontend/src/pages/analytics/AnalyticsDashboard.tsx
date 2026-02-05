import React, { useEffect, useState, useCallback, useRef } from "react";
import { apiUrl } from "../../api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type TrendPoint = { period: string; value: number; label?: string };

type AnalyticsSummary = {
  lastUpdated: string;
  materials: {
    avgMape: number;
    stockoutsLast30Days: number;
    carryingCostIndex: number;
    mapeTrend?: TrendPoint[];
    stockoutsTrend?: TrendPoint[];
  };
  solar: {
    nmae: number;
    biasPct: number;
    nmaeTrend?: TrendPoint[];
  };
  support: {
    helpfulRate: number;
    avgResponseTimeSeconds: number;
    rateTrend?: TrendPoint[];
  };
};

const REFRESH_INTERVAL_MS = 30000;
const RETRY_DELAY_MS = 5000;

function formatTimeAgo(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function normalizeSummary(data: unknown): AnalyticsSummary | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const materials = d.materials as Record<string, unknown> | undefined;
  const solar = d.solar as Record<string, unknown> | undefined;
  const support = d.support as Record<string, unknown> | undefined;
  if (!materials || !solar || !support) return null;
  return {
    lastUpdated: typeof d.lastUpdated === "string" ? d.lastUpdated : new Date().toISOString(),
    materials: {
      avgMape: Number(materials.avgMape) || 0,
      stockoutsLast30Days: Number(materials.stockoutsLast30Days) ?? 0,
      carryingCostIndex: Number(materials.carryingCostIndex) || 0,
      mapeTrend: Array.isArray(materials.mapeTrend) ? materials.mapeTrend as TrendPoint[] : undefined,
      stockoutsTrend: Array.isArray(materials.stockoutsTrend) ? materials.stockoutsTrend as TrendPoint[] : undefined,
    },
    solar: {
      nmae: Number(solar.nmae) || 0,
      biasPct: Number(solar.biasPct) || 0,
      nmaeTrend: Array.isArray(solar.nmaeTrend) ? solar.nmaeTrend as TrendPoint[] : undefined,
    },
    support: {
      helpfulRate: Number(support.helpfulRate) || 0,
      avgResponseTimeSeconds: Number(support.avgResponseTimeSeconds) ?? 0,
      rateTrend: Array.isArray(support.rateTrend) ? support.rateTrend as TrendPoint[] : undefined,
    },
  };
}

// Animated number that counts toward the target value
function AnimatedValue({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  duration = 500,
  className = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
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
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 2);
      setDisplay(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {Number(display).toFixed(decimals)}
      {suffix}
    </span>
  );
}

// Circular progress ring (e.g. for helpful rate)
function GaugeRing({
  value,
  max = 1,
  size = 80,
  strokeWidth = 8,
  color = "var(--accent)",
  bgColor = "var(--border-light)",
  label,
  className = "",
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  label?: string;
  className?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value / max));
  const offset = circumference * (1 - pct);

  return (
    <div className={`gauge-ring-wrap ${className}`}>
      <div className="gauge-ring-svg-wrap" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="gauge-ring-fill"
          />
        </svg>
        <span className="gauge-ring-value">{(pct * 100).toFixed(0)}%</span>
      </div>
      {label && <span className="gauge-ring-label">{label}</span>}
    </div>
  );
}

const CHART_COLORS = {
  area: "var(--accent)",
  areaFill: "rgba(245, 158, 11, 0.2)",
  bar: "var(--accent)",
  barGood: "var(--success)",
  barWarn: "var(--warning)",
  barBad: "var(--danger)",
};

const AnalyticsDashboard: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const prevUpdatedRef = useRef<string | null>(null);

  const fetchSummary = useCallback(() => {
    setError(null);
    fetch(apiUrl("/analytics/summary"))
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const normalized = normalizeSummary(data);
        if (normalized) {
          setSummary(normalized);
          if (prevUpdatedRef.current !== normalized.lastUpdated) {
            prevUpdatedRef.current = normalized.lastUpdated;
            setTick((t) => t + 1);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load analytics", err);
        setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSummary();
    const id = setInterval(fetchSummary, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchSummary]);

  useEffect(() => {
    if (!error) return;
    const retryId = setTimeout(fetchSummary, RETRY_DELAY_MS);
    return () => clearTimeout(retryId);
  }, [error, fetchSummary]);

  if (loading && !summary) {
    return (
      <section>
        <h2 className="section-heading">Analytics & Evaluation</h2>
        <p className="section-sub">Loading live KPIs…</p>
        <div className="analytics-skeleton" />
      </section>
    );
  }

  if (!summary) {
    return (
      <section>
        <h2 className="section-heading">Analytics & Evaluation</h2>
        <p className="section-sub">
          {error ? "Could not load analytics. Make sure the backend is running on port 4000." : "Loading…"}
        </p>
        {error && (
          <p className="section-sub" style={{ marginTop: "0.5rem" }}>
            <button type="button" onClick={fetchSummary}>Retry now</button>
            <span style={{ marginLeft: "0.75rem", color: "var(--text-muted)" }}>Auto-retry in 5s</span>
          </p>
        )}
      </section>
    );
  }

  const mapePct = summary.materials.avgMape * 100;
  const stockouts = summary.materials.stockoutsLast30Days;
  const nmaePct = summary.solar.nmae * 100;
  const helpfulPct = summary.support.helpfulRate * 100;

  return (
    <section className="analytics-page">
      <div className="analytics-header">
        <div>
          <h2 className="section-heading">Analytics & Evaluation</h2>
          <p className="section-sub">
            Live KPIs for forecasting, solar yield, and support. Updates every 30 seconds.
          </p>
        </div>
        <div className={`live-indicator live-indicator-badge ${tick > 0 ? "live-pulse" : ""}`}>
          <span className="live-dot" />
          <span>Last updated {formatTimeAgo(summary.lastUpdated)}</span>
        </div>
      </div>

      {/* Materials section */}
      <div className="analytics-section">
        <h3 className="analytics-section-title">Materials forecasting</h3>
        <div className="analytics-cards-row">
          <div className="kpi-card kpi-card-animated">
            <div className="kpi-card-header">
              <span className="kpi-card-label">Avg MAPE</span>
              <span className="kpi-card-hint">Lower is better</span>
            </div>
            <AnimatedValue
              value={mapePct}
              decimals={1}
              suffix="%"
              className="kpi-card-value kpi-card-value-accent"
            />
          </div>
          <div className="kpi-card kpi-card-animated">
            <div className="kpi-card-header">
              <span className="kpi-card-label">Stockouts (30d)</span>
            </div>
            <AnimatedValue value={stockouts} className="kpi-card-value" />
          </div>
          <div className="kpi-card kpi-card-animated">
            <div className="kpi-card-header">
              <span className="kpi-card-label">Carrying cost index</span>
            </div>
            <AnimatedValue
              value={summary.materials.carryingCostIndex}
              decimals={2}
              className="kpi-card-value"
            />
          </div>
        </div>
        <div className="analytics-charts-row">
          {summary.materials.mapeTrend && summary.materials.mapeTrend.length > 0 && (
            <div className="chart-card chart-card-animated">
              <h4>MAPE trend (14 days)</h4>
              <div className="chart-inner chart-inner-fixed-h">
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={summary.materials.mapeTrend} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mapeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.area} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={CHART_COLORS.area} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="var(--text-muted)" tickFormatter={(v) => `${(Number(v) * 100).toFixed(0)}%`} width={32} />
                    <Tooltip formatter={(v: number) => [(v * 100).toFixed(1) + "%", "MAPE"]} contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-light)" }} />
                    <Area type="monotone" dataKey="value" stroke={CHART_COLORS.area} strokeWidth={2} fill="url(#mapeGrad)" isAnimationActive animationDuration={400} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {summary.materials.stockoutsTrend && summary.materials.stockoutsTrend.length > 0 && (
            <div className="chart-card chart-card-animated">
              <h4>Stockouts trend (14 days)</h4>
              <div className="chart-inner chart-inner-fixed-h">
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={summary.materials.stockoutsTrend} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="var(--text-muted)" width={28} />
                    <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-light)" }} />
                    <Bar dataKey="value" fill={CHART_COLORS.bar} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={400}>
                      {summary.materials.stockoutsTrend.map((entry, i) => (
                        <Cell key={i} fill={entry.value === 0 ? CHART_COLORS.barGood : CHART_COLORS.barWarn} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Solar section */}
      <div className="analytics-section">
        <h3 className="analytics-section-title">Solar yield prediction</h3>
        <div className="analytics-cards-row">
          <div className="kpi-card kpi-card-animated">
            <div className="kpi-card-header">
              <span className="kpi-card-label">NMAE</span>
              <span className="kpi-card-hint">Lower is better</span>
            </div>
            <AnimatedValue value={nmaePct} decimals={1} suffix="%" className="kpi-card-value kpi-card-value-accent" />
          </div>
          <div className="kpi-card kpi-card-animated">
            <div className="kpi-card-header">
              <span className="kpi-card-label">Bias</span>
            </div>
            <AnimatedValue value={summary.solar.biasPct} decimals={1} suffix="%" className="kpi-card-value" />
          </div>
        </div>
        {summary.solar.nmaeTrend && summary.solar.nmaeTrend.length > 0 && (
          <div className="chart-card chart-card-animated chart-card-wide">
            <h4>NMAE trend (14 days)</h4>
            <div className="chart-inner chart-inner-fixed-h-lg">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={summary.solar.nmaeTrend} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="nmaeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.area} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CHART_COLORS.area} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--text-muted)" tickFormatter={(v) => `${(Number(v) * 100).toFixed(0)}%`} width={32} />
                  <Tooltip formatter={(v: number) => [(v * 100).toFixed(1) + "%", "NMAE"]} contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-light)" }} />
                  <Area type="monotone" dataKey="value" stroke={CHART_COLORS.area} strokeWidth={2} fill="url(#nmaeGrad)" isAnimationActive animationDuration={400} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Support section */}
      <div className="analytics-section">
        <h3 className="analytics-section-title">Support assistant</h3>
        <div className="analytics-support-row">
          <div className="chart-card chart-card-animated support-gauge-card">
            <h4>Helpful answer rate</h4>
            <GaugeRing
              value={summary.support.helpfulRate}
              max={1}
              size={120}
              strokeWidth={10}
              color={helpfulPct >= 90 ? "var(--success)" : helpfulPct >= 75 ? "var(--accent)" : "var(--warning)"}
              label="Target 90%"
            />
          </div>
          <div className="chart-card chart-card-animated support-response-card">
            <h4>Avg response time</h4>
            <div className="response-time-value">
              <AnimatedValue value={summary.support.avgResponseTimeSeconds} suffix="s" className="kpi-card-value kpi-card-value-large" />
            </div>
            <p className="kpi-card-hint">seconds per answer</p>
          </div>
          {summary.support.rateTrend && summary.support.rateTrend.length > 0 && (
            <div className="chart-card chart-card-animated chart-card-flex">
              <h4>Helpful rate trend (14 days)</h4>
              <div className="chart-inner chart-inner-fixed-h">
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={summary.support.rateTrend} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--success)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                    <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} stroke="var(--text-muted)" tickFormatter={(v) => `${(Number(v) * 100).toFixed(0)}%`} width={32} />
                    <Tooltip formatter={(v: number) => [(v * 100).toFixed(1) + "%", "Rate"]} contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-light)" }} />
                    <Area type="monotone" dataKey="value" stroke="var(--success)" strokeWidth={2} fill="url(#rateGrad)" isAnimationActive animationDuration={400} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AnalyticsDashboard;
