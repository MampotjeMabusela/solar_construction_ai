from datetime import datetime
from typing import List

from fastapi import FastAPI
from pydantic import BaseModel

# pvlib is optional for this MVP; if it fails to import
# (e.g. due to NumPy version issues) we fall back to a
# simple heuristic model implemented below.
try:  # pragma: no cover - best‑effort optional import
    import pvlib  # type: ignore
except Exception:  # noqa: BLE001
    pvlib = None


class Site(BaseModel):
    latitude: float
    longitude: float


class Roof(BaseModel):
    tiltDeg: float
    azimuthDeg: float
    shadingFactor: float = 1.0


class SimulationRequest(BaseModel):
    site: Site
    roof: Roof
    systemSizeKw: float
    lossesPct: float = 14.0


class SimulationResult(BaseModel):
    annualKwh: float
    monthlyKwh: List[float]
    paybackYears: float
    roiPercent: float


app = FastAPI(title="PV Simulation Service")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/simulate", response_model=SimulationResult)
def simulate(req: SimulationRequest) -> SimulationResult:
    """
    Very simplified PV simulation.

    If pvlib is available, this is where you would use its
    clear-sky and PVSystem models. For now, we use a rule-of-thumb
    yearly yield per kW and adjust for tilt/orientation and shading.
    """
    base_yield_per_kw = 1400.0  # kWh/kW/year, adjust per region later

    # crude orientation factor: favor tilts around 25–35° and azimuth near 180°
    tilt_factor = max(0.6, min(1.1, 1.0 - abs(req.roof.tiltDeg - 30.0) / 90.0))
    azimuth_factor = max(0.6, min(1.1, 1.0 - abs(req.roof.azimuthDeg - 180.0) / 180.0))
    shading_factor = max(0.0, min(1.0, req.roof.shadingFactor))

    system_yield = (
        base_yield_per_kw
        * req.systemSizeKw
        * tilt_factor
        * azimuth_factor
        * shading_factor
        * (1.0 - req.lossesPct / 100.0)
    )

    monthly = [system_yield / 12.0 for _ in range(12)]

    # very rough financials: assume fixed cost per kW and fixed energy price
    cost_per_kw = 1200.0
    energy_price_per_kwh = 0.25
    total_cost = cost_per_kw * req.systemSizeKw
    yearly_savings = system_yield * energy_price_per_kwh
    payback_years = total_cost / yearly_savings if yearly_savings > 0 else 0.0
    roi_percent = (yearly_savings / total_cost) * 100.0 if total_cost > 0 else 0.0

    return SimulationResult(
        annualKwh=system_yield,
        monthlyKwh=monthly,
        paybackYears=payback_years,
        roiPercent=roi_percent,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)

