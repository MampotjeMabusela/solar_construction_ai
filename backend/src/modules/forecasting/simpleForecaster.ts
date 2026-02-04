export type UsagePoint = {
  date: Date;
  quantityUsed: number;
};

export type ForecastPoint = {
  date: Date;
  quantityForecast: number;
};

export function simpleForecastDemand(
  history: UsagePoint[],
  horizonDays: number
): ForecastPoint[] {
  if (history.length === 0) {
    const today = new Date();
    return Array.from({ length: horizonDays }).map((_, i) => ({
      date: new Date(today.getTime() + (i + 1) * 24 * 3600 * 1000),
      quantityForecast: 0
    }));
  }

  const sorted = [...history].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  const values = sorted.map((p) => p.quantityUsed);
  const window = Math.min(30, values.length);
  const slice = values.slice(values.length - window);
  const avg =
    slice.reduce((sum, v) => sum + v, 0) / (slice.length || 1);

  const lastDate = sorted[sorted.length - 1].date;
  return Array.from({ length: horizonDays }).map((_, i) => ({
    date: new Date(lastDate.getTime() + (i + 1) * 24 * 3600 * 1000),
    quantityForecast: avg
  }));
}

