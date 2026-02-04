from datetime import datetime, timedelta
from typing import List

import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel


class HistoryPoint(BaseModel):
  date: datetime
  quantityUsed: float


class ForecastRequest(BaseModel):
  materialId: str
  history: List[HistoryPoint]
  horizonDays: int = 90


class ForecastPoint(BaseModel):
  date: datetime
  quantityForecast: float


class ForecastResponse(BaseModel):
  materialId: str
  horizonDays: int
  forecast: List[ForecastPoint]


app = FastAPI(title="Forecasting Service")


@app.get("/health")
def health() -> dict:
  return {"status": "ok"}


@app.post("/forecast/material", response_model=ForecastResponse)
def forecast_material(req: ForecastRequest) -> ForecastResponse:
  """
  Simple baseline forecaster using moving average.
  Could be replaced with ARIMA/Prophet/LSTM later.
  """
  if not req.history:
    today = datetime.utcnow().date()
    forecast = [
      ForecastPoint(date=datetime.combine(today + timedelta(days=i + 1), datetime.min.time()), quantityForecast=0.0)
      for i in range(req.horizonDays)
    ]
    return ForecastResponse(materialId=req.materialId, horizonDays=req.horizonDays, forecast=forecast)

  values = np.array([h.quantityUsed for h in req.history], dtype=float)
  window = min(30, len(values))
  avg = float(values[-window:].mean())

  last_date = max(h.date for h in req.history).date()
  forecast = []
  for i in range(req.horizonDays):
    d = last_date + timedelta(days=i + 1)
    forecast.append(
      ForecastPoint(
        date=datetime.combine(d, datetime.min.time()),
        quantityForecast=avg,
      )
    )

  return ForecastResponse(materialId=req.materialId, horizonDays=req.horizonDays, forecast=forecast)


if __name__ == "__main__":
  import uvicorn

  uvicorn.run(app, host="0.0.0.0", port=8002)

