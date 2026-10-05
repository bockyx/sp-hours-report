// Empaqueta dist/ en dist/<name>-<version>.zip para subirlo a Super Productivity.
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, rmSync } from "node:fs";

const { name, version } = JSON.parse(readFileSync("package.json", "utf8"));
const zip = `${name}-${version}.zip`;

for (const f of readdirSync("dist")) if (f.endsWith(".zip")) rmSync(`dist/${f}`);
execFileSync("zip", ["-r", zip, ".", "-x", "*.zip"], { cwd: "dist", stdio: "inherit" });
console.log(`dist/${zip}`);
