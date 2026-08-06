import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "pcmo-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  // Force the correct NODE_ENV for the dependency optimizer (pre-bundling).
  // If the shell has NODE_ENV=production (e.g. after a prior `npm run build`),
  // Vite's optimizer would resolve react/jsx-dev-runtime to its production
  // build where jsxDEV is undefined, causing "_jsxDEV is not a function" and a
  // blank page in dev. Defining it here (driven by Vite's `mode`) makes the dev
  // server robust regardless of the ambient environment variable.
  optimizeDeps: {
    esbuildOptions: {
      define: {
        "process.env.NODE_ENV": JSON.stringify(mode === "development" ? "development" : "production"),
      },
    },
  },
  esbuild: {
    define: {
      "process.env.NODE_ENV": JSON.stringify(mode === "development" ? "development" : "production"),
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
