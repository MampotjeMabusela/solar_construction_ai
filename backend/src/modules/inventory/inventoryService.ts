export type MaterialInventoryInput = {
  materialId: string;
  materialName: string;
  avgDailyDemand: number;
  demandStdDev: number;
  leadTimeDays: number;
  safetyStockDays: number;
  onHandQty: number;
};

export type InventoryRecommendation = {
  materialId: string;
  materialName: string;
  currentStock: number;
  daysOfCover: number;
  reorderPoint: number;
  reorderQuantity: number;
  action: "OK" | "WATCH" | "REORDER";
};

// z-score equivalent for desired service level; 1.65 ~ 95%
const SERVICE_LEVEL_Z = 1.65;

export function getInventoryRecommendations(
  items: MaterialInventoryInput[]
): InventoryRecommendation[] {
  if (items.length === 0) {
    // Realistic demo set; onHandQty varies slightly by time so data feels live
    const t = Math.floor(Date.now() / 60000);
    const drift = (i: number) => (t + i) % 7 - 3;
    items = [
      {
        materialId: "demo-sheet",
        materialName: "Roofing Sheet 0.55mm BMT",
        avgDailyDemand: 22,
        demandStdDev: 5,
        leadTimeDays: 14,
        safetyStockDays: 5,
        onHandQty: Math.max(80, 185 + drift(0) * 4)
      },
      {
        materialId: "demo-fastener",
        materialName: "Self-drilling Fastener M6",
        avgDailyDemand: 210,
        demandStdDev: 45,
        leadTimeDays: 10,
        safetyStockDays: 4,
        onHandQty: Math.max(200, 1180 + drift(1) * 15)
      },
      {
        materialId: "demo-sealant",
        materialName: "Sealant 310ml Cartridge",
        avgDailyDemand: 35,
        demandStdDev: 10,
        leadTimeDays: 12,
        safetyStockDays: 5,
        onHandQty: Math.max(50, 320 + drift(2) * 8)
      },
      {
        materialId: "demo-clip",
        materialName: "Roof Clip Universal",
        avgDailyDemand: 85,
        demandStdDev: 18,
        leadTimeDays: 7,
        safetyStockDays: 3,
        onHandQty: Math.max(100, 520 + drift(3) * 12)
      }
    ];
  }

  return items.map((m) => {
    const leadTimeDemandMean = m.avgDailyDemand * m.leadTimeDays;
    const leadTimeDemandStd =
      m.demandStdDev * Math.sqrt(m.leadTimeDays || 1);
    const safetyStock =
      SERVICE_LEVEL_Z * leadTimeDemandStd +
      m.avgDailyDemand * m.safetyStockDays;
    const reorderPoint = leadTimeDemandMean + safetyStock;
    const daysOfCover =
      m.avgDailyDemand > 0 ? m.onHandQty / m.avgDailyDemand : Infinity;

    const reorderQuantity = Math.max(
      0,
      Math.round(reorderPoint * 1.5 - m.onHandQty)
    );

    let action: InventoryRecommendation["action"] = "OK";
    if (m.onHandQty <= reorderPoint) {
      action = "REORDER";
    } else if (daysOfCover < m.leadTimeDays + m.safetyStockDays) {
      action = "WATCH";
    }

    return {
      materialId: m.materialId,
      materialName: m.materialName,
      currentStock: m.onHandQty,
      daysOfCover,
      reorderPoint,
      reorderQuantity,
      action
    };
  });
}

export function runInventoryScenario(input: unknown): {
  summary: string;
} {
  // For MVP, just echo a simple textual summary. Later we can compute
  // stockout probabilities and carrying cost impact.
  return {
    summary:
      "Scenario simulation endpoint is wired but not yet using real data. " +
      "You can extend it to compute stockout risk and carrying costs.",
  };
}

