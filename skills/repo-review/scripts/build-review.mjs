#!/usr/bin/env node
// Usage: node build-review.mjs <findings.json> [output=review.html]
// Validates findings, assigns stable ids, and injects them into assets/review-template.html.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CATEGORIES = ["security", "bug", "performance", "tech-debt", "feature"];
const PRIORITIES = ["P0", "P1", "P2", "P3"];
const EFFORTS = ["S", "M", "L"];
const REQUIRED = ["category", "priority", "effort", "title", "file", "description", "evidence", "recommendation"];

const [inputPath, outputPath = "review.html"] = process.argv.slice(2);
if (!inputPath) {
  console.error("Usage: node build-review.mjs <findings.json> [output=review.html]");
  process.exit(2);
}

const raw = JSON.parse(readFileSync(inputPath, "utf8"));
const findings = Array.isArray(raw) ? raw : raw.findings;
if (!Array.isArray(findings) || findings.length === 0) {
  console.error("Input must be an array of findings, or { findings: [...] }, with at least one entry.");
  process.exit(1);
}

const errors = [];
const seen = new Map();
findings.forEach((f, i) => {
  const at = `finding #${i + 1}${f.title ? ` ("${f.title}")` : ""}`;
  for (const key of REQUIRED) {
    if (typeof f[key] !== "string" || !f[key].trim()) errors.push(`${at}: "${key}" must be a non-empty string`);
  }
  if (f.category && !CATEGORIES.includes(f.category)) errors.push(`${at}: category "${f.category}" not in ${CATEGORIES.join("|")}`);
  if (f.priority && !PRIORITIES.includes(f.priority)) errors.push(`${at}: priority "${f.priority}" not in ${PRIORITIES.join("|")}`);
  if (f.effort && !EFFORTS.includes(f.effort)) errors.push(`${at}: effort "${f.effort}" not in ${EFFORTS.join("|")}`);
  if (f.line !== undefined && !(Number.isInteger(f.line) && f.line > 0)) errors.push(`${at}: line must be a positive integer when present`);
  // Stable id: re-running the scan keeps checkbox state for findings that did not change identity.
  f.id = f.id || createHash("sha1").update(`${f.category}|${f.file}|${f.title}`).digest("hex").slice(0, 10);
  if (seen.has(f.id)) errors.push(`${at}: duplicates ${seen.get(f.id)} (same category, file and title)`);
  seen.set(f.id, at);
});
if (errors.length) {
  console.error(`${errors.length} problem(s) in ${inputPath}:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

const git = (cmd) => {
  try {
    return execSync(`git ${cmd}`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
};
const root = git("rev-parse --show-toplevel") || process.cwd();
const data = {
  repo: raw.repo || basename(root),
  commit: git("rev-parse --short HEAD"),
  branch: git("rev-parse --abbrev-ref HEAD"),
  generated: new Date().toISOString(),
  findings,
};

const templatePath = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "review-template.html");
const template = readFileSync(templatePath, "utf8");
if (!template.includes("__REVIEW_DATA__")) {
  console.error(`Template ${templatePath} is missing the __REVIEW_DATA__ placeholder.`);
  process.exit(1);
}
// Escape characters that could close the <script> block or break JS parsing.
const json = JSON.stringify(data)
  .replace(/</g, "\\u003c")
  .replace(/\u2028/g, "\\u2028")
  .replace(/\u2029/g, "\\u2029");
writeFileSync(outputPath, template.replace("__REVIEW_DATA__", () => json));

const count = (key, values) => values.map((v) => `${v}: ${findings.filter((f) => f[key] === v).length}`).join("  ");
console.log(`Wrote ${resolve(outputPath)} (${findings.length} findings)`);
console.log(`By priority  ${count("priority", PRIORITIES)}`);
console.log(`By category  ${count("category", CATEGORIES)}`);
