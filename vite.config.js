import { readFileSync, writeFileSync } from "node:fs";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));

// Copia la versión de package.json al manifest.json de dist/
const manifestVersion = () => ({
  name: "manifest-version",
  apply: "build",
  closeBundle() {
    const file = "dist/manifest.json";
    const manifest = JSON.parse(readFileSync(file, "utf8"));
    manifest.version = pkg.version;
    writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n");
  },
});

// Super Productivity sirve index.html por srcdoc: todo debe ir inline en un solo archivo.
// public/ (manifest.json, plugin.js, icon.svg) se copia tal cual a dist/.
export default defineConfig({
  plugins: [viteSingleFile(), manifestVersion()],
  build: { outDir: "dist", emptyOutDir: true },
});
