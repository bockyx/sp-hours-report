import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Super Productivity sirve index.html por srcdoc: todo debe ir inline en un solo archivo.
// public/ (manifest.json, plugin.js, icon.svg) se copia tal cual a dist/.
export default defineConfig({
  plugins: [viteSingleFile()],
  build: { outDir: "dist", emptyOutDir: true },
});
