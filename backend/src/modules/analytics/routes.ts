import { Router } from "express";

const router = Router();

router.get("/summary", (_req, res) => {
  const now = Date.now();
  const seed = Math.floor(now / 60000) % 100;
  const mape = 0.10 + (seed % 5) / 100;
  const stockouts = seed % 3;
  const carryingCost = 0.78 + (seed % 6) / 100;
  const nmae = 0.06 + (seed % 4) / 100;
  const biasPct = 2.0 + (seed % 3);
  const helpfulRate = 0.88 + (seed % 5) / 100;
  const avgResponseTime = 12 + (seed % 8);

  // Time-series for charts: last 14 periods (e.g. days) with realistic variance
  const periods = 14;
  const materialsMapeTrend = Array.from({ length: periods }, (_, i) => ({
    period: `D${periods - i}`,
    value: Math.max(0.05, Math.min(0.2, mape + (i - periods / 2) * 0.005 + (seed % 3) * 0.01)),
    label: `Day ${periods - i}`
  }));
  const stockoutsTrend = Array.from({ length: periods }, (_, i) => ({
    period: `D${periods - i}`,
    value: (stockouts + (i + seed) % 2) as number,
    label: `Day ${periods - i}`
  }));
  const solarNmaeTrend = Array.from({ length: periods }, (_, i) => ({
    period: `D${periods - i}`,
    value: Math.max(0.03, Math.min(0.15, nmae + (i % 3) * 0.01)),
    label: `Day ${periods - i}`
  }));
  const supportRateTrend = Array.from({ length: periods }, (_, i) => ({
    period: `D${periods - i}`,
    value: Math.max(0.7, Math.min(0.98, helpfulRate + (i % 5) * 0.02)),
    label: `Day ${periods - i}`
  }));

  return res.json({
    lastUpdated: new Date().toISOString(),
    materials: {
      avgMape: mape,
      stockoutsLast30Days: stockouts,
      carryingCostIndex: carryingCost,
      mapeTrend: materialsMapeTrend,
      stockoutsTrend
    },
    solar: {
      nmae,
      biasPct,
      nmaeTrend: solarNmaeTrend
    },
    support: {
      helpfulRate,
      avgResponseTimeSeconds: avgResponseTime,
      rateTrend: supportRateTrend
    }
  });
});

export default router;

