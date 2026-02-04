import { Router } from "express";
import { z } from "zod";

const router = Router();

const draftEmailSchema = z.object({
  type: z.enum(["inspection_summary", "quote_follow_up"]),
  customerName: z.string(),
  projectId: z.string().optional(),
  mainFindings: z.string().optional(),
  notes: z.string().optional()
});

router.post("/draft-email", (req, res) => {
  const parsed = draftEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  const { type, customerName, projectId, mainFindings, notes } = parsed.data;

  let subject: string;
  let body: string;

  if (type === "inspection_summary") {
    subject = `Inspection summary for ${customerName}${
      projectId ? ` (Project ${projectId})` : ""
    }`;
    body = [
      `Hi ${customerName},`,
      "",
      "Thank you for the opportunity to inspect your roof for a potential solar installation.",
      "",
      "Summary of inspection:",
      mainFindings || "- [Add key findings here]",
      "",
      "Next steps:",
      "- Review the attached proposal and confirm if you would like to proceed.",
      "- Let us know if you have any questions about system size, performance, or warranty terms.",
      "",
      notes || "",
      "Kind regards,",
      "[Your name]",
      "[Your company]"
    ]
      .filter(Boolean)
      .join("\n");
  } else {
    subject = `Following up on your solar quote${
      projectId ? ` (Project ${projectId})` : ""
    }`;
    body = [
      `Hi ${customerName},`,
      "",
      "I wanted to follow up on the solar proposal we shared with you.",
      "",
      mainFindings ||
        "The proposed system is designed to balance yield, roof constraints, and budget, with an expected payback period and ROI that suit your profile.",
      "",
      "If you have any questions about system sizing, expected energy yield, or financing options, I’d be happy to help.",
      "",
      "Please let me know if you’d like to adjust the design or schedule a call to walk through the proposal.",
      "",
      notes || "",
      "Kind regards,",
      "[Your name]",
      "[Your company]"
    ]
      .filter(Boolean)
      .join("\n");
  }

  return res.json({ subject, body });
});

export default router;

