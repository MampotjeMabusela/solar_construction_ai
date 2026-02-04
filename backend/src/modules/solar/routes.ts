import { Router } from "express";
import { z } from "zod";

const router = Router();

const siteSchema = z.object({
  latitude: z.number(),
  longitude: z.number()
});

const roofSchema = z.object({
  tiltDeg: z.number(),
  azimuthDeg: z.number(),
  areaM2: z.number(),
  shadingFactor: z.number().min(0).max(1)
});

const scenarioSchema = z.object({
  site: siteSchema,
  roof: roofSchema,
  systemSizeKw: z.number().positive()
});

router.post("/scenarios", async (req, res) => {
  const parsed = scenarioSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  const body = parsed.data;

  try {
    const pvServiceUrl =
      process.env.PV_SERVICE_URL ?? "http://localhost:8001";

    const response = await fetch(`${pvServiceUrl}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        site: body.site,
        roof: {
          tiltDeg: body.roof.tiltDeg,
          azimuthDeg: body.roof.azimuthDeg,
          shadingFactor: body.roof.shadingFactor
        },
        systemSizeKw: body.systemSizeKw,
        lossesPct: 14.0
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: "PV service error", detail: text });
    }

    const simResult = await response.json();

    // TODO: persist Site, SolarScenario and SolarSimulationResult via Prisma.

    return res.json({
      result: {
        annualKwh: simResult.annualKwh,
        monthlyKwh: simResult.monthlyKwh,
        paybackYears: simResult.paybackYears,
        roiPercent: simResult.roiPercent,
        simulatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to call PV service" });
  }
});

export default router;

