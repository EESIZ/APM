#!/usr/bin/env node
// Zero-dependency status checker for the manager-owned WHIPS runtime ledger.

import process from "node:process";
import { resolve } from "node:path";
import { evaluateWhips, formatStatus, loadWhips } from "./lib/whips.mjs";

const args = process.argv.slice(2);
if (args.some((arg) => arg === "--help" || arg === "-h")) {
  console.log("usage: whips-check.mjs [--status] [--json] [--root DIR]");
  process.exit(0);
}

const rootIndex = args.indexOf("--root");
if (rootIndex !== -1 && !args[rootIndex + 1]) {
  console.error("whips-check: --root requires a directory");
  process.exit(2);
}
const allowed = new Set(["--status", "--json", "--root"]);
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--root") { index += 1; continue; }
  if (!allowed.has(arg)) {
    console.error(`whips-check: unknown option ${arg}`);
    process.exit(2);
  }
}

const root = resolve(rootIndex === -1 ? process.cwd() : args[rootIndex + 1]);
const loaded = loadWhips(root);
const result = evaluateWhips(loaded.document);

if (args.includes("--json")) {
  console.log(JSON.stringify({
    active: result.document.active,
    complete: result.complete,
    scope: result.document.scope,
    file: loaded.file,
    counts: result.counts,
    errors: result.errors,
    duties: result.duties,
  }, null, 2));
} else {
  console.log(formatStatus(result));
}

if (!result.document.active || result.complete) process.exit(0);
process.exit(result.errors.length ? 2 : 1);
