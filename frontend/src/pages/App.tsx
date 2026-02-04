import React, { useState, useMemo } from "react";
import { downloadSolarQuotationPdf, downloadRoofQuotationPdf } from "../utils/quotationPdf";
import WeatherOverview from "../components/WeatherOverview";

// --- South African indicative pricing (ZAR, excl. VAT unless noted) ---
const SOLAR_RAND_PER_KW_SMALL = 19500;   // 1–5 kW residential
const SOLAR_RAND_PER_KW_MEDIUM = 17500;  // 5–15 kW
const SOLAR_RAND_PER_KW_LARGE = 15500;   // 15+ kW commercial
const SOLAR_BATTERY_ADDON = 85000;        // Indicative battery backup add-on
const ROOF_METAL_RAND_PER_M2 = 520;      // Metal sheet (IBR) supply & install
const ROOF_INDUSTRIAL_RAND_PER_M2 = 480; // Industrial / commercial
const ROOF_ASBESTOS_RAND_PER_M2 = 1200;  // Asbestos removal & make-good
const ROOF_INSULATION_PER_M2 = 85;       // Insulation add-on per m²
const ROOF_REPAIR_FACTOR = 0.45;         // Repair vs new (typical)

function formatZAR(n: number): string {
  return "R " + Math.round(n).toLocaleString("en-ZA");
}

const services = [
  {
    id: "asbestos",
    title: "Asbestos Removal",
    icon: "asbestos",
    description: "Safe, compliant removal and disposal for residential and commercial properties.",
  },
  {
    id: "large-scale",
    title: "Large Scale Projects",
    icon: "arch",
    description: "Design, supply and install for warehouses, factories and multi-building sites.",
  },
  {
    id: "industrial",
    title: "Industrial & Commercial Roofing",
    icon: "building",
    description: "Metal, IBR, insulated and flat roofing for industrial and commercial buildings.",
  },
  {
    id: "solar",
    title: "Solar Solutions",
    icon: "solar",
    description: "Grid-tied and hybrid solar PV, sizing, installation and maintenance.",
  },
];

const coreValues = [
  {
    title: "Specialization",
    description:
      "Chartwell Roofing specialises in the construction of unique and exclusive properties.",
  },
  {
    title: "Quality Control",
    description:
      "We maintain rigorous quality control standards, ensuring adherence to manufacturers' specifications and consistent quality across our projects.",
  },
  {
    title: "Client Satisfaction",
    description:
      "Our work reflects a commitment to excellence, meeting the needs of highly experienced clients.",
  },
];

const ROOF_TYPE_LABELS: Record<"metal" | "industrial" | "asbestos", string> = {
  metal: "Residential / metal sheet (IBR)",
  industrial: "Industrial & commercial",
  asbestos: "Asbestos removal",
};
const ROOF_SCOPE_LABELS: Record<"new" | "repair", string> = {
  new: "New / full replacement",
  repair: "Repair / partial",
};

const App: React.FC = () => {
  const [solarKw, setSolarKw] = useState(6);
  const [solarSystemType, setSolarSystemType] = useState<"grid-tied" | "hybrid">("grid-tied");
  const [solarBattery, setSolarBattery] = useState(false);
  const [roofType, setRoofType] = useState<"metal" | "industrial" | "asbestos">("metal");
  const [roofArea, setRoofArea] = useState(200);
  const [roofScope, setRoofScope] = useState<"new" | "repair">("new");
  const [roofInsulation, setRoofInsulation] = useState(false);

  const solarQuote = useMemo(() => {
    let rate = SOLAR_RAND_PER_KW_SMALL;
    if (solarKw > 15) rate = SOLAR_RAND_PER_KW_LARGE;
    else if (solarKw > 5) rate = SOLAR_RAND_PER_KW_MEDIUM;
    let total = solarKw * rate;
    if (solarBattery) total += SOLAR_BATTERY_ADDON;
    return total;
  }, [solarKw, solarBattery]);

  const roofQuote = useMemo(() => {
    let perM2 = ROOF_METAL_RAND_PER_M2;
    if (roofType === "industrial") perM2 = ROOF_INDUSTRIAL_RAND_PER_M2;
    else if (roofType === "asbestos") perM2 = ROOF_ASBESTOS_RAND_PER_M2;
    const factor = roofScope === "repair" ? ROOF_REPAIR_FACTOR : 1;
    let total = roofArea * perM2 * factor;
    if (roofInsulation) total += roofArea * ROOF_INSULATION_PER_M2;
    return total;
  }, [roofType, roofArea, roofScope, roofInsulation]);

  const handleDownloadSolarPdf = () => {
    downloadSolarQuotationPdf({
      systemSizeKw: solarKw,
      systemType: solarSystemType,
      batteryBackup: solarBattery,
      totalZAR: solarQuote,
    });
  };

  const handleDownloadRoofPdf = () => {
    downloadRoofQuotationPdf({
      roofType,
      roofTypeLabel: ROOF_TYPE_LABELS[roofType],
      areaM2: roofArea,
      scope: roofScope,
      scopeLabel: ROOF_SCOPE_LABELS[roofScope],
      insulation: roofInsulation,
      totalZAR: roofQuote,
    });
  };

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="home-hero">
        <h1 className="home-hero-title">Solar Construction AI by ChartWell Roofing</h1>
        <p className="home-hero-sub">
          Forecast materials, size solar systems, and get support—all in one place. Use the navigation to explore.
        </p>
      </section>

      {/* Services We Offer */}
      <section className="home-section home-services">
        <h2 className="home-section-title">The services we offer</h2>
        <div className="home-services-grid">
          {services.map((s, i) => (
            <div
              key={s.id}
              className="home-service-card home-animated"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="home-service-icon-wrap">
                {s.icon === "asbestos" && <IconHouse />}
                {s.icon === "arch" && <IconArch />}
                {s.icon === "building" && <IconBuilding />}
                {s.icon === "solar" && <IconSolar />}
              </div>
              <h3 className="home-service-title">{s.title}</h3>
              <p className="home-service-desc">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Core Values */}
      <section className="home-section home-values">
        <h2 className="home-section-title home-section-title-underline">Our core values</h2>
        <div className="home-values-grid">
          {coreValues.map((v, i) => (
            <div
              key={v.title}
              className="home-value-card home-animated"
              style={{ animationDelay: `${0.2 + i * 0.08}s` }}
            >
              <div className="home-value-icon-wrap">
                <span className="home-value-asterisk" aria-hidden>*</span>
              </div>
              <h3 className="home-value-title">{v.title.toUpperCase()}</h3>
              <p className="home-value-desc">{v.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Weather overview – South Africa */}
      <WeatherOverview />

      {/* Request a quotation */}
      <section className="home-section home-quotation">
        <h2 className="home-section-title">Request a quotation</h2>
        <p className="home-section-sub">
          Indicative estimates for the South African market. Final quotes depend on site visit and scope.
        </p>
        <div className="home-quote-grid">
          {/* Solar quotation */}
          <div className="home-quote-card home-animated" style={{ animationDelay: "0.35s" }}>
            <h3 className="home-quote-card-title">Solar system</h3>
            <p className="home-quote-card-hint">By size and power (kW)</p>
            <div className="home-quote-field">
              <label htmlFor="solar-kw">System size (kW)</label>
              <div className="home-quote-slider-wrap">
                <input
                  id="solar-kw"
                  type="range"
                  min={1}
                  max={50}
                  value={solarKw}
                  onChange={(e) => setSolarKw(Number(e.target.value))}
                  className="home-quote-slider"
                  aria-label="System size in kilowatts"
                />
                <span className="home-quote-slider-value">{solarKw} kW</span>
              </div>
            </div>
            <div className="home-quote-field">
              <label htmlFor="solar-type">System type</label>
              <select
                id="solar-type"
                value={solarSystemType}
                onChange={(e) => setSolarSystemType(e.target.value as "grid-tied" | "hybrid")}
                className="home-quote-select"
                aria-label="System type"
              >
                <option value="grid-tied">Grid-tied</option>
                <option value="hybrid">Hybrid (battery-ready)</option>
              </select>
            </div>
            <div className="home-quote-field home-quote-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={solarBattery}
                  onChange={(e) => setSolarBattery(e.target.checked)}
                  aria-label="Include battery backup"
                />
                <span>Include battery backup (indicative add-on)</span>
              </label>
            </div>
            <div className="home-quote-result">
              <span className="home-quote-result-label">Indicative total (excl. VAT)</span>
              <span className="home-quote-result-value">{formatZAR(solarQuote)}</span>
            </div>
            <p className="home-quote-disclaimer">Roughly R15,500–R19,500/kW depending on size and equipment.</p>
            <button type="button" className="home-quote-download" onClick={handleDownloadSolarPdf}>
              Download quotation (PDF)
            </button>
          </div>

          {/* Roof quotation */}
          <div className="home-quote-card home-animated" style={{ animationDelay: "0.4s" }}>
            <h3 className="home-quote-card-title">Roofing</h3>
            <p className="home-quote-card-hint">Type, area and scope</p>
            <div className="home-quote-field">
              <label htmlFor="roof-type">Roof type</label>
              <select
                id="roof-type"
                value={roofType}
                onChange={(e) => setRoofType(e.target.value as "metal" | "industrial" | "asbestos")}
                className="home-quote-select"
                aria-label="Roof type"
              >
                <option value="metal">Residential / metal sheet (IBR)</option>
                <option value="industrial">Industrial & commercial</option>
                <option value="asbestos">Asbestos removal</option>
              </select>
            </div>
            <div className="home-quote-field">
              <label htmlFor="roof-area">Area (m²)</label>
              <input
                id="roof-area"
                type="number"
                min={10}
                max={5000}
                value={roofArea}
                onChange={(e) => setRoofArea(Number(e.target.value) || 10)}
                className="home-quote-input"
                aria-label="Roof area in square metres"
              />
            </div>
            <div className="home-quote-field">
              <label htmlFor="roof-scope">Scope</label>
              <select
                id="roof-scope"
                value={roofScope}
                onChange={(e) => setRoofScope(e.target.value as "new" | "repair")}
                className="home-quote-select"
                aria-label="Scope of work"
              >
                <option value="new">New / full replacement</option>
                <option value="repair">Repair / partial</option>
              </select>
            </div>
            <div className="home-quote-field home-quote-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={roofInsulation}
                  onChange={(e) => setRoofInsulation(e.target.checked)}
                  aria-label="Include insulation"
                />
                <span>Include insulation (add-on per m²)</span>
              </label>
            </div>
            <div className="home-quote-result">
              <span className="home-quote-result-label">Indicative total (excl. VAT)</span>
              <span className="home-quote-result-value">{formatZAR(roofQuote)}</span>
            </div>
            <p className="home-quote-disclaimer">Rates vary by profile, access and location.</p>
            <button type="button" className="home-quote-download" onClick={handleDownloadRoofPdf}>
              Download quotation (PDF)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

function IconHouse() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" className="home-service-icon">
      <path d="M24 4L8 16v24h12V28h8v12h12V16L24 4z" />
      <path d="M24 4v12" strokeLinecap="round" />
    </svg>
  );
}
function IconArch() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" className="home-service-icon">
      <path d="M8 40V24a8 8 0 0116 0v16M24 8v32M24 8a8 8 0 018 8v24" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 40V24a8 8 0 00-16 0v16" strokeLinecap="round" />
    </svg>
  );
}
function IconBuilding() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" className="home-service-icon">
      <rect x="6" y="8" width="36" height="34" rx="2" />
      <path d="M14 18h4M14 26h4M14 34h4M24 18h4M24 26h4M24 34h4M34 18h4M34 26h4M34 34h4" strokeLinecap="round" />
    </svg>
  );
}
function IconSolar() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" className="home-service-icon">
      <rect x="8" y="14" width="32" height="20" rx="1" />
      <path d="M24 10v4M24 34v4M14 24h-4M38 24h4M17 17l2.8 2.8M28 28l2.8 2.8M31 17l-2.8 2.8M20 28l-2.8 2.8" strokeLinecap="round" />
      <path d="M16 24h4l2-6 2 6h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default App;
