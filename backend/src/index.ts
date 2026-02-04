import dotenv from "dotenv";
import { createServer } from "http";
import app from "./app";

dotenv.config();

const port = Number(process.env.PORT) || 4000;
const server = createServer(app);

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\nPort ${port} is already in use. Either:\n  1. Stop the other process using port ${port}\n  2. Or set PORT=4001 and update frontend vite.config.ts proxy to http://localhost:4001\n`);
  }
});

server.listen(port, () => {
  console.log(`Backend API listening on http://localhost:${port}`);
});

