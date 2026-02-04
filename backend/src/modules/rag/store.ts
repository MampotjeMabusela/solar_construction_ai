import type { LlmContextChunk } from "../llm/client";

export type InMemoryDocument = {
  id: string;
  title: string;
  docType: string;
  content: string;
};

const documents: InMemoryDocument[] = [];

function seedDefaultDocuments(): void {
  if (documents.length > 0) return;
  const seed: InMemoryDocument[] = [
    {
      id: "faq-warranty",
      title: "Product warranty",
      docType: "faq",
      content:
        "Solar panels come with a 25-year linear performance warranty and 12-year product warranty. Inverter warranty is 10 years extendable to 20. Workmanship on installation is covered for 2 years. Claims must be submitted with proof of purchase and installation certificate."
    },
    {
      id: "faq-lead-times",
      title: "Lead times and delivery",
      docType: "faq",
      content:
        "Standard lead time for roofing sheets and fasteners is 10–14 working days. Sealants and specialist items can take 14–21 days. Express delivery is available for urgent orders at extra cost. Bulk orders over 500 units may require 3–4 weeks. Check stock levels on the portal before placing orders."
    },
    {
      id: "faq-installation",
      title: "Installation guidelines",
      docType: "sop",
      content:
        "Roof preparation must be completed before panel installation. Use only approved mounting systems and follow spacing and torque specs. Maximum tilt 15–40 degrees for optimal yield. Shading from trees or adjacent structures must be assessed; we provide a shading report with each quote. All installations must be signed off by a certified installer."
    },
    {
      id: "faq-quotes",
      title: "Quotes and proposals",
      docType: "faq",
      content:
        "Quotes are valid for 30 days. They include supply and install unless marked supply only. Payment terms are 30% on acceptance, 60% on delivery, 10% on completion. Finance options are available through our partners. For changes to scope, a variation order is required before extra work is carried out."
    },
    {
      id: "faq-inspection",
      title: "Site inspection",
      docType: "sop",
      content:
        "We carry out a site inspection before finalising the design. Inspection covers roof condition, orientation, tilt, shading, and access. Asbestos or structural concerns are flagged and may require a specialist report. You will receive an inspection summary within 2 working days. No obligation to proceed after inspection."
    },
    {
      id: "faq-safety",
      title: "Safety and compliance",
      docType: "sop",
      content:
        "All work complies with local building and electrical regulations. Asbestos-containing materials must be assessed by a licensed contractor before any work; we do not disturb suspected asbestos. Structural changes require engineer sign-off. Fire safety and isolation requirements are included in the design."
    },
    {
      id: "faq-contact",
      title: "Contact and offices",
      docType: "faq",
      content:
        "Chartwell Roofing has offices in Gauteng and Western Cape. Visit the Contact page for phone numbers and addresses. For quotes and support use the website forms or call your nearest branch. Emergency or after-hours issues: leave a message and we respond within one business day."
    },
    {
      id: "faq-solar-systems",
      title: "Solar system types and sizing",
      docType: "faq",
      content:
        "We offer grid-tied, hybrid, and off-grid solar solutions. System sizes typically range from 3 kW to 20 kW for residential; commercial systems are quoted individually. Use our Solar Sizing tool on the website to get an indicative yield. Battery backup is optional; we recommend sizing based on your usage and load-shedding needs."
    },
    {
      id: "faq-maintenance",
      title: "Maintenance and servicing",
      docType: "faq",
      content:
        "Solar panels need minimal maintenance: occasional cleaning of dust and debris. We recommend an annual check of connections and inverter. Monitoring is available via app for supported inverters. If production drops noticeably, book a service visit. Inverter faults are often covered under warranty—keep your installation certificate."
    },
    {
      id: "faq-payment",
      title: "Payment and finance",
      docType: "faq",
      content:
        "Payment terms: 30% on acceptance, 60% on delivery, 10% on completion. We accept EFT and card. Finance is available through partner providers; ask for a quote with finance. Deposits are non-refundable once materials are ordered. Invoices are sent by email; payment reminders at 7 and 14 days."
    },
    {
      id: "faq-complaints",
      title: "Complaints and escalation",
      docType: "faq",
      content:
        "If you are not satisfied, contact your project manager or branch first. Escalation: email support with your project reference and we aim to respond within 2 working days. For warranty or defect claims, include photos and your installation certificate. We follow a formal complaints process and will keep you updated."
    }
  ];
  seed.forEach((d) => documents.push(d));
}

seedDefaultDocuments();

export function addDocument(doc: InMemoryDocument): void {
  documents.push(doc);
}

export function listDocuments(): InMemoryDocument[] {
  return documents;
}

const SYNONYMS: Record<string, string[]> = {
  warranty: ["guarantee", "cover", "covered", "claim", "claims"],
  quote: ["quotation", "quote", "price", "pricing", "cost", "estimate"],
  delivery: ["lead", "time", "when", "arrive", "dispatch", "shipping"],
  install: ["installation", "install", "fitting", "fitted", "mounting"],
  inspection: ["survey", "site visit", "assessment", "check"],
  contact: ["phone", "email", "address", "office", "call", "reach"],
  payment: ["pay", "finance", "deposit", "invoice", "eft"],
  solar: ["panels", "pv", "inverter", "battery", "system", "roof"],
  maintenance: ["service", "servicing", "clean", "repair", "fault"],
  complaint: ["complaints", "issue", "problem", "escalate", "unhappy"]
};

function expandTerms(token: string): string[] {
  const lower = token.toLowerCase();
  const out = new Set<string>([lower]);
  for (const [key, values] of Object.entries(SYNONYMS)) {
    if (key === lower || values.includes(lower)) {
      [key, ...values].forEach((t) => out.add(t));
    }
  }
  return [...out];
}

function textScore(query: string, doc: InMemoryDocument): number {
  const qTokens = query.toLowerCase().split(/\W+/).filter(Boolean);
  const content = `${doc.title} ${doc.content}`.toLowerCase();
  const contentWords = content.split(/\W+/).filter(Boolean);
  const cSet = new Set(contentWords);
  let score = 0;
  for (const t of qTokens) {
    const terms = expandTerms(t);
    for (const term of terms) {
      if (cSet.has(term)) {
        score += 1;
        break;
      }
    }
    if (content.includes(t)) score += 0.5;
  }
  return score;
}

export function searchContext(
  question: string,
  topK = 5
): LlmContextChunk[] {
  const scored = documents
    .map((doc) => ({ doc, score: textScore(question, doc) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map((s) => ({
    title: s.doc.title,
    snippet: s.doc.content.slice(0, 450)
  }));
}

