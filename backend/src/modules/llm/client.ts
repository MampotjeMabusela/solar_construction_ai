type LlmMode = "support_answer" | "email_draft";

export type LlmContextChunk = {
  title: string;
  snippet: string;
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function hasIntent(question: string, words: string[]): boolean {
  const q = normalize(question);
  return words.some((w) => q.includes(w));
}

function noContextReply(question: string): string {
  const q = normalize(question);
  if (hasIntent(question, ["warranty", "guarantee", "cover", "claim"]))
    return "I don't have the latest warranty doc to hand. Our panels typically have a **25-year performance warranty** and **12-year product warranty**; inverters **10 years** (extendable to 20). Workmanship is **2 years**. I’d confirm the exact terms for your product with the team. — Andy";
  if (hasIntent(question, ["lead time", "delivery", "when", "how long", "arrive", "dispatch"]))
    return "Lead times vary by product: usually **10–14 days** for sheets and fasteners, up to **21 days** for some sealants. Express options are available. For your exact order I’d check stock and get you a date. Need a specific product? — Andy";
  if (hasIntent(question, ["quote", "quotation", "price", "cost", "estimate", "how much"]))
    return "Quotes are **valid 30 days** and normally include supply and install. For a tailored quote we’d need site details and system size. You can request one on our **Home** or **Contact** page—or I can note that you’d like a call from sales. — Andy";
  if (hasIntent(question, ["inspection", "survey", "site visit", "assessment"]))
    return "We do a **site inspection** before final design—roof condition, shading, access. You’ll get a summary within **2 working days**. No obligation to proceed. Want me to suggest you request one via the Contact page? — Andy";
  if (hasIntent(question, ["contact", "phone", "email", "address", "call", "office", "reach"]))
    return "You can find our **Gauteng and Western Cape** contact details on the **Contact** page (phone and address). For quotes and support, use the website or call your nearest branch. I’m here for quick questions; for complex or urgent matters the team will help. — Andy";
  if (hasIntent(question, ["hello", "hi", "hey", "good morning", "good afternoon"]))
    return "Hi! I’m **Andy**, your support assistant. You can ask me about installations, warranties, lead times, quotes, inspections, payment, maintenance, or how to contact us. What would you like to know? — Andy";
  if (hasIntent(question, ["thanks", "thank you", "cheers", "bye", "goodbye"]))
    return "You’re welcome! If you need anything else, just ask. Have a good one! — Andy";
  if (hasIntent(question, ["human", "agent", "person", "speak to someone", "real person"]))
    return "I can’t transfer you to a person from here, but you’ll get a quick response if you **call your nearest branch** or use the **Contact** page. Mention what you asked about and they’ll pick it up. — Andy";
  if (hasIntent(question, ["solar", "panel", "inverter", "battery", "system", "sizing"]))
    return "We offer **grid-tied, hybrid, and off-grid** solar; typical residential sizes are **3–20 kW**. Use the **Solar Sizing** tool on this site for an indicative yield. Battery backup is optional—we can factor in load-shedding. For a formal quote we’d need a site inspection. Want more detail on warranties or lead times? — Andy";
  if (hasIntent(question, ["maintenance", "service", "repair", "fault", "cleaning"]))
    return "Panels need **minimal maintenance**—occasional cleaning. We recommend an **annual check** of connections and inverter. If production drops, book a service visit; inverter faults are often covered under warranty. Need warranty or contact details? — Andy";
  if (hasIntent(question, ["payment", "pay", "finance", "deposit", "invoice"]))
    return "Standard terms: **30% on acceptance, 60% on delivery, 10% on completion**. We accept EFT and card; **finance** is available through partners—ask when you get a quote. Invoices are sent by email. — Andy";
  if (hasIntent(question, ["complaint", "issue", "problem", "escalate", "unhappy"]))
    return "Sorry to hear that. Please **contact your project manager or branch** first. For escalation, use the **Contact** page with your project reference—we aim to respond within **2 working days**. For warranty claims, include photos and your installation certificate. — Andy";
  return "I couldn’t find a precise match in our docs. Try asking about **warranties**, **lead times**, **quotes**, **inspections**, **contact details**, or **solar sizing**. For anything urgent or very specific, the team on the **Contact** page can help. — Andy";
}

function withNextSteps(reply: string, topic: string): string {
  const steps: Record<string, string> = {
    warranty: "\n\n**Next step:** Request your certificate from the team or ask for a callback.",
    quote: "\n\n**Next step:** Use the quote forms on the Home page or Contact to request a formal quote.",
    inspection: "\n\n**Next step:** Request a site inspection via the Contact page.",
    contact: "\n\n**Next step:** Open the Contact page for phone numbers and addresses.",
    complaint: "\n\n**Next step:** Email or call with your project reference for a formal response.",
  };
  return reply + (steps[topic] ?? "");
}

function answerAsAndy(question: string, contextChunks: LlmContextChunk[]): string {
  const q = normalize(question);
  if (contextChunks.length === 0) return noContextReply(question);

  const combined = contextChunks.map((c) => c.snippet).join(" ").slice(0, 800);
  const titles = contextChunks.map((c) => c.title).join(", ");

  if (hasIntent(question, ["warranty", "guarantee", "cover", "claim"])) {
    let reply = "Here’s what I found:\n\n• **Panels:** 25-year linear performance warranty, 12-year product warranty.\n• **Inverter:** 10 years (extendable to 20).\n• **Workmanship:** 2 years.\n\nClaims need proof of purchase and installation certificate.";
    return withNextSteps(reply + " — Andy", "warranty");
  }
  if (hasIntent(question, ["lead time", "delivery", "when", "how long", "arrive"])) {
    let reply = "**Lead times:**\n\n• Roofing sheets & fasteners: **10–14** working days.\n• Sealants & specialist items: **14–21** days.\n• Bulk (500+ units): can be **3–4 weeks**.\n\nExpress delivery is available at extra cost. I can suggest you check stock on the portal or ask the team for your specific order.";
    return withNextSteps(reply + " — Andy", "quote");
  }
  if (hasIntent(question, ["quote", "quotation", "price", "cost", "payment", "finance"])) {
    let reply = "**Quotes & payment:**\n\n• Quotes **valid 30 days**; usually include supply and install unless marked otherwise.\n• Payment: **30%** on acceptance, **60%** on delivery, **10%** on completion.\n• Finance is available through partners—ask when you get a quote.\n• Scope changes need a **variation order** before extra work.";
    return withNextSteps(reply + " — Andy", "quote");
  }
  if (hasIntent(question, ["inspection", "survey", "site visit"])) {
    let reply = "We do a **site inspection** before finalising the design. It covers roof condition, orientation, tilt, shading, and access. You’ll get a summary within **2 working days**. No obligation to proceed. Asbestos or structural concerns may require a specialist report.";
    return withNextSteps(reply + " — Andy", "inspection");
  }
  if (hasIntent(question, ["install", "installation", "mounting", "roof"])) {
    return "Based on our guidelines: roof prep first, then panels. We use approved mounting systems; tilt **15–40°** for optimal yield. Shading is assessed and included in the quote. A **certified installer** must sign off. If you’d like a quote or inspection, use the Home or Contact page. — Andy";
  }
  if (hasIntent(question, ["contact", "phone", "email", "address", "call"])) {
    return withNextSteps("Our **Gauteng and Western Cape** offices are on the **Contact** page with phone and address. Use the website forms or call your nearest branch for quotes and support. — Andy", "contact");
  }
  if (hasIntent(question, ["solar", "panel", "inverter", "battery", "sizing"])) {
    return "We offer **grid-tied, hybrid, and off-grid** solar; typical residential **3–20 kW**. Use the **Solar Sizing** tool on this site for an indicative yield. Battery backup is optional. Site inspection is needed for a final design. — Andy";
  }
  if (hasIntent(question, ["maintenance", "service", "repair", "cleaning"])) {
    return "Panels need **minimal maintenance** (occasional cleaning). We recommend an **annual check** of connections and inverter. If production drops, book a service visit; keep your installation certificate for warranty claims. — Andy";
  }
  if (hasIntent(question, ["complaint", "issue", "problem", "escalate"])) {
    return withNextSteps("Contact your project manager or branch first. To escalate: use the Contact page with your **project reference**; we aim to respond within **2 working days**. For defects, include photos and your installation certificate. — Andy", "complaint");
  }
  if (hasIntent(question, ["safety", "compliance", "asbestos", "regulation"])) {
    return "We comply with local building and electrical regulations. Asbestos must be assessed by a licensed contractor; we don’t disturb suspected asbestos. Structural changes need engineer sign-off. Fire and isolation requirements are in the design. — Andy";
  }

  const summary = combined.slice(0, 320).trim() + (combined.length > 320 ? "…" : "");
  return `Based on ${titles}:\n\n${summary}\n\nIf you need the full details or something specific (e.g. warranty, lead time, quote), ask and I’ll narrow it down. — Andy`;
}

export async function generateAnswerWithContext(
  question: string,
  contextChunks: LlmContextChunk[],
  mode: LlmMode
): Promise<string> {
  if (mode === "support_answer") {
    return answerAsAndy(question, contextChunks);
  }

  const contextText =
    contextChunks.length === 0
      ? "No internal documents were found for this query.\n\n"
      : contextChunks
          .map((c, i) => `Source ${i + 1} - ${c.title}:\n${c.snippet}\n`)
          .join("\n");
  return (
    "Here is a draft email based on the provided context:\n\n" +
    contextText +
    "\nPlease review, edit, and personalize this draft before sending. — Andy"
  );
}
