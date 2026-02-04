import express from "express";
import cors from "cors";
import materialsRouter from "./modules/materials/routes";
import solarRouter from "./modules/solar/routes";
import ragRouter from "./modules/rag/routes";
import supportRouter from "./modules/support/routes";
import analyticsRouter from "./modules/analytics/routes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/materials", materialsRouter);
app.use("/solar", solarRouter);
app.use("/rag", ragRouter);
app.use("/support", supportRouter);
app.use("/analytics", analyticsRouter);

export default app;

