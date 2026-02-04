import React, { useState } from "react";

type SolarResult = {
  annualKwh: number;
  monthlyKwh: number[];
  paybackYears: number;
  roiPercent: number;
  simulatedAt?: string;
};

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return d.toLocaleString();
}

const SolarWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [site, setSite] = useState({ latitude: -33.87, longitude: 151.21 });
  const [roof, setRoof] = useState({
    tiltDeg: 25,
    azimuthDeg: 180,
    areaM2: 55,
    shadingFactor: 0.92,
  });
  const [systemSizeKw, setSystemSizeKw] = useState(6.6);
  const [result, setResult] = useState<SolarResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/solar/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site, roof, systemSizeKw }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error.detail || "Simulation failed");
        return;
      }
      setResult(data.result);
      setStep(3);
    } catch (e) {
      setError("Could not reach simulation service. Is the PV service running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2 className="section-heading">Solar Yield Prediction & Sizing</h2>
      <p className="section-sub">
        Enter site and roof details, then run a simulation for annual yield and ROI.
      </p>

      {step === 1 && (
        <div className="wizard-step">
          <h3>Step 1: Site location</h3>
          <div className="row">
            <label>
              Latitude
              <input
                type="number"
                step="any"
                value={site.latitude}
                onChange={(e) => setSite({ ...site, latitude: Number(e.target.value) })}
              />
            </label>
            <label>
              Longitude
              <input
                type="number"
                step="any"
                value={site.longitude}
                onChange={(e) => setSite({ ...site, longitude: Number(e.target.value) })}
              />
            </label>
          </div>
          <button type="button" onClick={() => setStep(2)}>
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="wizard-step">
          <h3>Step 2: Roof & system sizing</h3>
          <div className="row">
            <label>
              Tilt (deg)
              <input
                type="number"
                value={roof.tiltDeg}
                onChange={(e) => setRoof({ ...roof, tiltDeg: Number(e.target.value) })}
              />
            </label>
            <label>
              Azimuth (deg)
              <input
                type="number"
                value={roof.azimuthDeg}
                onChange={(e) => setRoof({ ...roof, azimuthDeg: Number(e.target.value) })}
              />
            </label>
          </div>
          <div className="row">
            <label>
              Roof area (m²)
              <input
                type="number"
                value={roof.areaM2}
                onChange={(e) => setRoof({ ...roof, areaM2: Number(e.target.value) })}
              />
            </label>
            <label>
              Shading factor (0–1)
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={roof.shadingFactor}
                onChange={(e) => setRoof({ ...roof, shadingFactor: Number(e.target.value) })}
              />
            </label>
          </div>
          <label>
            System size (kW)
            <input
              type="number"
              step={0.1}
              value={systemSizeKw}
              onChange={(e) => setSystemSizeKw(Number(e.target.value))}
            />
          </label>
          <div style={{ marginTop: "1rem" }}>
            <button type="button" onClick={runSimulation} disabled={loading}>
              {loading ? "Running simulation…" : "Run simulation"}
            </button>
            <button type="button" className="secondary" onClick={() => setStep(1)}>
              Back
            </button>
          </div>
          {error && (
            <p style={{ color: "var(--danger)", marginTop: "0.75rem" }}>{error}</p>
          )}
        </div>
      )}

      {step === 3 && result && (
        <div className="solar-result-card">
          <h3>Step 3: Results</h3>
          {result.simulatedAt && (
            <div className="live-indicator" style={{ marginBottom: "0.75rem" }}>
              <span className="live-dot" />
              Simulated {formatTimeAgo(result.simulatedAt)}
            </div>
          )}
          <div className="metric">
            Estimated annual yield: <strong>{result.annualKwh.toFixed(0)} kWh</strong>
          </div>
          <div className="metric">
            Estimated payback: <strong>{result.paybackYears.toFixed(1)} years</strong>
          </div>
          <div className="metric">
            Estimated ROI: <strong>{result.roiPercent.toFixed(1)}%</strong>
          </div>
          <h4 style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>Monthly yield (kWh)</h4>
          <div className="monthly-list">
            {result.monthlyKwh.map((v, i) => (
              <span key={i}>
                M{i + 1}: {v.toFixed(0)}
              </span>
            ))}
          </div>
          <div style={{ marginTop: "1rem" }}>
            <button type="button" className="secondary" onClick={() => setStep(2)}>
              New scenario
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default SolarWizard;
