import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/materials": "http://localhost:4001",
      "/solar": "http://localhost:4001",
      "/rag": "http://localhost:4001",
      "/support": "http://localhost:4001",
      "/analytics": "http://localhost:4001",
      "/health": "http://localhost:4001"
    }
  }
});

