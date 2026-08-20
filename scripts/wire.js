/**
 * dsh-usage-plugin — wiring script (LEGACY fallback).
 *
 * PREFERRED INSTALL: this package declares `dsh.bundle`, so it auto-activates
 * with a single command and NO manual wiring:
 *
 *   dsh plugin --profile web add @feiyang666/dsh-usage-plugin
 *
 * This script exists only for the manual fallback path (installing the package
 * by hand into a profile's node_modules): it appends the plugin row to the
 * profile's `cordis.patch.yml` so the plugin loads with the web app:
 *
 *   npm run wire
 *
 * It is idempotent: running it again never duplicates the row. If it cannot
 * find a profile patch it prints what to add manually and exits non-zero.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkgDir = resolve(here, "..");
const ROW_ID = "usage-plugin";
const PACKAGE_NAME = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8")).name || "dsh-usage-plugin";

function candidateRoots() {
  const roots = [];
  // When installed at <profilesRoot>/node_modules/dsh-usage-plugin, the
  // profiles root is two levels up; try several depths for other layouts.
  for (let up = 1; up <= 4; up++) {
    let p = pkgDir;
    for (let i = 0; i < up; i++) p = resolve(p, "..");
    roots.push(p);
  }
  if (process.env.DSH_HOME) {
    roots.push(join(process.env.DSH_HOME, "profiles"));
    roots.push(process.env.DSH_HOME);
  }
  return roots;
}

function findPatches(roots) {
  const seen = new Set();
  const patches = [];
  for (const root of roots) {
    let entries;
    try {
      entries = readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === "node_modules") continue;
      const patch = join(root, entry.name, "cordis.patch.yml");
      if (existsSync(patch) && !seen.has(patch)) {
        seen.add(patch);
        patches.push(patch);
      }
    }
  }
  return patches;
}

function alreadyWired(text) {
  return text.includes(`id: ${ROW_ID}`);
}

function wire(patchPath) {
  const text = readFileSync(patchPath, "utf8");
  if (alreadyWired(text)) {
    console.log(`[dsh-usage-plugin] already wired in ${patchPath}`);
    return true;
  }
  const block =
    "\n# " + PACKAGE_NAME + ": usage & cost tracking (installed via npm).\n" +
    "- insert:\n" +
    "    - id: " + ROW_ID + "\n" +
    "      name: '" + PACKAGE_NAME + "'\n" +
    "      inject:\n" +
    "        - fs\n" +
    "        - webServer\n" +
    "        - subprocess\n" +
    "        - credentials\n" +
    "        - settings\n" +
    "        - sandboxPolicy\n" +
    "        - agents\n";
  writeFileSync(patchPath, text.endsWith("\n") ? text + block : text + "\n" + block, "utf8");
  console.log(`[dsh-usage-plugin] wired into ${patchPath}`);
  return true;
}

const patches = findPatches(candidateRoots());
if (patches.length === 0) {
  console.error(
    "[dsh-usage-plugin] no DSH profile patch found. Preferred: install with `dsh plugin --profile web add " + PACKAGE_NAME + "` (auto-wires via dsh.bundle, no manual editing).\n" +
    "Manual fallback — add this row to your profile's cordis.patch.yml, then restart the app:\n\n" +
    "- insert:\n" +
    "    - id: " + ROW_ID + "\n" +
    "      name: '" + PACKAGE_NAME + "'\n"
  );
  process.exit(1);
}
let ok = true;
for (const patch of patches) ok = wire(patch) && ok;
if (ok) {
  console.log("[dsh-usage-plugin] done. Restart the DeepSeek Harness web app for the plugin to load.");
}
process.exit(ok ? 0 : 1);