import { Router } from "express";
import { z } from "zod";
import { simpleForecastDemand } from "../forecasting/simpleForecaster";
import { getInventoryRecommendations, runInventoryScenario } from "../inventory/inventoryService";

const router = Router();

const importUsageSchema = z.object({
  materialId: z.string(),
  projectId: z.string().optional(),
  projectType: z.string().optional(),
  records: z.array(
    z.object({
      date: z.string(),
      quantityUsed: z.number()
    })
  )
});

router.post("/import-usage", (req, res) => {
  const parsed = importUsageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  // TODO: persist parsed.data into ProjectMaterialUsage via Prisma.
  // For now, just echo back a success response.
  return res.json({ status: "ok", imported: parsed.data.records.length });
});

router.get("/forecast/:materialId", (req, res) => {
  const materialId = req.params.materialId;
  const horizonDays = Number(req.query.horizonDays ?? 90);

  // TODO: load historical usage for this material from DB.
  const dummyHistory = Array.from({ length: 180 }).map((_, idx) => ({
    date: new Date(Date.now() - (180 - idx) * 24 * 3600 * 1000),
    quantityUsed: 10 + Math.random() * 5
  }));

  const forecast = simpleForecastDemand(dummyHistory, horizonDays);
  return res.json({
    materialId,
    horizonDays,
    forecast,
    lastUpdated: new Date().toISOString()
  });
});

router.get("/inventory/recommendations", (req, res) => {
  const recommendations = getInventoryRecommendations([]);
  return res.json({
    recommendations,
    lastUpdated: new Date().toISOString()
  });
});

router.post("/inventory/scenario", (req, res) => {
  const result = runInventoryScenario(req.body);
  return res.json(result);
});

export default router;

