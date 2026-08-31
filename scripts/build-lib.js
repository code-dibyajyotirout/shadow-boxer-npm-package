import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

console.log("[build:lib] Starting Shadow Boxer library build...");

// 1. Clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. Compile TypeScript declarations and JavaScript modules
console.log("[build:lib] Compiling TypeScript source files...");
try {
  execSync("node node_modules/typescript/lib/tsc.js -p tsconfig.lib.json", {
    cwd: rootDir,
    stdio: "inherit",
  });
} catch (error) {
  console.error("[build:lib] TypeScript compilation failed:", error);
  process.exit(1);
}

// 3. Copy CSS stylesheet to dist
const cssSrc = path.join(rootDir, "src", "style.css");
const cssDest = path.join(distDir, "style.css");
if (fs.existsSync(cssSrc)) {
  fs.copyFileSync(cssSrc, cssDest);
  console.log("[build:lib] Copied style.css to dist/style.css");
}

console.log("[build:lib] Library build completed successfully.");
