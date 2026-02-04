import { jsPDF } from "jspdf";

const COMPANY = "Chartwell Roofing";
const TAGLINE = "Solar Construction AI – Indicative Quotation";
const CONTACT = "Gauteng: +27 (0)12 335 5157 | info@chartwellroofing.co.za\nWestern Cape: +27 (0)12 329 3788 | adminwc@chartwellroofing.co.za";

function addHeader(doc: jsPDF, title: string): void {
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY, 20, 22);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(TAGLINE, 20, 29);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, 42);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.line(20, 45, 80, 45);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
}

const A4_HEIGHT = 297;
const A4_WIDTH = 210;

function addFooter(doc: jsPDF, pageNumber: number): void {
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `This is an indicative quotation only. Valid for 30 days. Final quote subject to site visit. | ${COMPANY}`,
    20,
    A4_HEIGHT - 10
  );
  doc.text(`Page ${pageNumber}`, A4_WIDTH - 25, A4_HEIGHT - 10);
  doc.setTextColor(0, 0, 0);
}

export type SolarQuoteOptions = {
  systemSizeKw: number;
  systemType: "grid-tied" | "hybrid";
  batteryBackup: boolean;
  totalZAR: number;
};

export function downloadSolarQuotationPdf(options: SolarQuoteOptions): void {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  addHeader(doc, "Solar System – Indicative Quotation");
  let y = 55;
  doc.text(`Date: ${date}`, 20, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Your selection", 20, y);
  y += 7;
  doc.setFont("helvetica", "normal");

  const lines = [
    `System size: ${options.systemSizeKw} kW`,
    `System type: ${options.systemType === "grid-tied" ? "Grid-tied" : "Hybrid (with battery-ready inverter)"}`,
    `Battery backup: ${options.batteryBackup ? "Yes (indicative add-on)" : "No"}`,
  ];
  lines.forEach((line) => {
    doc.text(`• ${line}`, 22, y);
    y += 6;
  });

  y += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, 190, y);
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Indicative total (excl. VAT)", 20, y);
  doc.text(`R ${Math.round(options.totalZAR).toLocaleString("en-ZA")}`, 120, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 12;

  doc.setTextColor(80, 80, 80);
  doc.text("Rates typically R15,500–R19,500 per kW depending on size and equipment. Battery add-on quoted separately.", 20, y, { maxWidth: 170 });
  y += 14;
  doc.text("Contact us for a detailed quote and site assessment.", 20, y);
  y += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Contact", 20, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(CONTACT, 20, y, { maxWidth: 170 });

  addFooter(doc, 1);
  doc.save(`Chartwell-Solar-Quotation-${options.systemSizeKw}kW.pdf`);
}

export type RoofQuoteOptions = {
  roofType: "metal" | "industrial" | "asbestos";
  roofTypeLabel: string;
  areaM2: number;
  scope: "new" | "repair";
  scopeLabel: string;
  insulation: boolean;
  totalZAR: number;
};

export function downloadRoofQuotationPdf(options: RoofQuoteOptions): void {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  addHeader(doc, "Roofing – Indicative Quotation");
  let y = 55;
  doc.text(`Date: ${date}`, 20, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Your selection", 20, y);
  y += 7;
  doc.setFont("helvetica", "normal");

  const lines = [
    `Roof type: ${options.roofTypeLabel}`,
    `Area: ${options.areaM2} m²`,
    `Scope: ${options.scopeLabel}`,
    `Insulation included: ${options.insulation ? "Yes" : "No"}`,
  ];
  lines.forEach((line) => {
    doc.text(`• ${line}`, 22, y);
    y += 6;
  });

  y += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, 190, y);
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Indicative total (excl. VAT)", 20, y);
  doc.text(`R ${Math.round(options.totalZAR).toLocaleString("en-ZA")}`, 120, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 12;

  doc.setTextColor(80, 80, 80);
  doc.text("Rates vary by profile, access and location. Final quote subject to site inspection.", 20, y, { maxWidth: 170 });
  y += 14;
  doc.text("Contact us for a detailed quote and site assessment.", 20, y);
  y += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Contact", 20, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(CONTACT, 20, y, { maxWidth: 170 });

  addFooter(doc, 1);
  doc.save(`Chartwell-Roof-Quotation-${options.areaM2}m2.pdf`);
}
