import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // HTML entry + sources live under src/renderer/ (spec §5 tree).
  root: "src/renderer",
  // Load apps/desktop-cashier/.env — relative to root (src/renderer),
  // so ../.. climbs out of src/renderer AND src.
  envDir: "../..",
  // Relative base so the packaged app works from file:// too.
  base: "./",
  build: {
    // Sits at apps/desktop-cashier/dist/renderer next to dist/main + dist/preload.
    outDir: "../../dist/renderer",
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 3449,
    strictPort: true,
  },
});
