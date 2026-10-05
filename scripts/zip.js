// Empaqueta dist/ en dist/plugin.zip para subirlo a Super Productivity.
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";

rmSync("dist/plugin.zip", { force: true });
execFileSync("zip", ["-r", "plugin.zip", ".", "-x", "plugin.zip"], { cwd: "dist", stdio: "inherit" });
