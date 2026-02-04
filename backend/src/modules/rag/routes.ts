import { Router } from "express";
import { z } from "zod";
import { addDocument, listDocuments, searchContext } from "./store";
import { generateAnswerWithContext } from "../llm/client";

const router = Router();

const docSchema = z.object({
  title: z.string(),
  docType: z.string(),
  content: z.string()
});

router.post("/documents", (req, res) => {
  const parsed = docSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }
  const { title, docType, content } = parsed.data;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  addDocument({ id, title, docType, content });
  return res.json({ id, status: "indexed" });
});

router.get("/documents", (_req, res) => {
  return res.json({ documents: listDocuments() });
});

const querySchema = z.object({
  question: z.string()
});

router.post("/query", async (req, res) => {
  const parsed = querySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }
  const { question } = parsed.data;

  const contextChunks = searchContext(question, 5);
  const answer = await generateAnswerWithContext(
    question,
    contextChunks,
    "support_answer"
  );

  return res.json({
    answer,
    sources: contextChunks
  });
});

export default router;

