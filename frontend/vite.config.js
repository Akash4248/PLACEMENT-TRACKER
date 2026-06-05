import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ["recharts"],
          motion: ["framer-motion"],
          react: ["react", "react-dom", "react-router-dom"],
          spreadsheet: ["xlsx"],
          vendor: ["axios", "react-hook-form", "react-icons"],
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
