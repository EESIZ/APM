#!/usr/bin/env node
// Install or remove persistent APM manager-runtime hooks for Claude Code.
// Installer structure adapted from unlazy by Leonxlnx (MIT).

import {
  existsSync, lstatSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const HELP = `usage: install-hooks.mjs [--shared | --global] [--allow-emergency-release] [--uninstall]

  default       install into .claude/settings.local.json for this project
  --shared      install into .claude/settings.json for this project
  --global      install into ~/.claude/settings.json
  --allow-emergency-release
                release the manager after six unchanged Stop blocks (off by default)
  --uninstall   remove only APM runtime handlers and preserve sibling hooks`;

function usage(message) {
  console.error(`install-hooks: ${message}`);
  console.error("run install-hooks.mjs --help for usage");
  process.exit(2);
}

const args = process.argv.slice(2);
const known = new Set(["--shared", "--global", "--allow-emergency-release", "--uninstall", "--help", "-h"]);
for (const arg of args) if (!known.has(arg)) usage(`unknown option ${arg}`);
if (args.includes("--help") || args.includes("-h")) { console.log(HELP); process.exit(0); }
const shared = args.includes("--shared");
const global = args.includes("--global");
const allowEmergencyRelease = args.includes("--allow-emergency-release");
const uninstall = args.includes("--uninstall");
if (shared && global) usage("--shared and --global are mutually exclusive");

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const script = fileURLToPath(new URL("./manager-hook.mjs", import.meta.url));
const target = global
  ? join(homedir(), ".claude", "settings.json")
  : join(process.cwd(), ".claude", shared ? "settings.json" : "settings.local.json");
const backup = `${target}.apm.bak`;

let raw = "";
let settings = {};
if (existsSync(target)) {
  try {
    const info = lstatSync(target);
    if (info.isSymbolicLink() || !info.isFile()) throw new Error("target must be a regular file");
    raw = readFileSync(target, "utf8");
    settings = JSON.parse(raw);
  } catch (error) {
    console.error(`Refusing to touch ${target}: ${error.message}`);
    process.exit(1);
  }
}
if (!isObject(settings) || (settings.hooks !== undefined && !isObject(settings.hooks))) {
  console.error(`Refusing to touch ${target}: settings and hooks must be JSON objects.`);
  process.exit(1);
}

const quote = (value) => process.platform === "win32"
  ? `"${String(value).replace(/"/g, '""')}"`
  : `'${String(value).replace(/'/g, "'\\''")}'`;
const command = (mode) => `${quote(process.execPath)} ${quote(script)} ${mode} --apm-runtime${mode === "stop" && allowEmergencyRelease ? " --allow-emergency-release" : ""}`;
const events = ["PreToolUse", "SubagentStop", "Stop"];

function isOurHandler(handler) {
  return isObject(handler) && typeof handler.command === "string" &&
    handler.command.includes("manager-hook.mjs") && handler.command.includes("--apm-runtime");
}

function cleanGroups(groups) {
  if (groups === undefined) return { groups: [], removed: 0 };
  if (!Array.isArray(groups)) throw new Error("hook event must be an array");
  let removed = 0;
  const output = [];
  for (const group of groups) {
    if (!isObject(group) || !Array.isArray(group.hooks)) throw new Error("hook group must contain a hooks array");
    const hooks = group.hooks.filter((handler) => {
      if (!isOurHandler(handler)) return true;
      removed += 1;
      return false;
    });
    if (hooks.length) output.push({ ...group, hooks });
  }
  return { groups: output, removed };
}

let removed = 0;
const hooks = { ...(settings.hooks || {}) };
try {
  for (const event of events) {
    const cleaned = cleanGroups(hooks[event]);
    removed += cleaned.removed;
    if (cleaned.groups.length) hooks[event] = cleaned.groups;
    else delete hooks[event];
  }
} catch (error) {
  console.error(`Refusing to touch ${target}: ${error.message}.`);
  process.exit(1);
}

if (uninstall && removed === 0) {
  console.log(`No APM runtime hook handlers found in ${target}; nothing changed.`);
  process.exit(0);
}

if (!uninstall) {
  hooks.PreToolUse = [...(hooks.PreToolUse || []), {
    matcher: "^(Agent|Task)$",
    hooks: [{ type: "command", command: command("pre-agent"), timeout: 10 }],
  }, {
    matcher: "^(Bash|Shell|Read|Write|Edit|MultiEdit|NotebookEdit|Glob|Grep|WebFetch|WebSearch|TaskCreate|TaskGet|TaskUpdate|TaskList|TodoWrite|TeamCreate|TeamDelete)$",
    hooks: [{ type: "command", command: command("pre-manager-tool"), timeout: 10 }],
  }];
  hooks.SubagentStop = [...(hooks.SubagentStop || []), {
    hooks: [{ type: "command", command: command("subagent-stop"), timeout: 10 }],
  }];
  hooks.Stop = [...(hooks.Stop || []), {
    hooks: [{ type: "command", command: command("stop"), timeout: 20 }],
  }];
}

const next = { ...settings };
if (Object.keys(hooks).length) next.hooks = hooks;
else delete next.hooks;

function writeAtomic(file, content) {
  mkdirSync(dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  writeFileSync(temp, content, "utf8");
  try {
    if (existsSync(file)) rmSync(file, { force: true });
    renameSync(temp, file);
  } catch (error) {
    rmSync(temp, { force: true });
    throw error;
  }
}

const nextRaw = JSON.stringify(next, null, 2) + "\n";
if (raw && raw === nextRaw) {
  console.log(`Already ${uninstall ? "uninstalled" : "installed"} in ${target}.`);
  process.exit(0);
}
try {
  if (raw) writeAtomic(backup, raw);
  writeAtomic(target, nextRaw);
} catch (error) {
  console.error(`Could not update ${target}: ${error.message}`);
  process.exit(1);
}

if (uninstall) {
  console.log(`Removed ${removed} APM runtime hook handler(s) from ${target}. Sibling hooks were preserved.`);
} else {
  console.log(`Installed APM manager-runtime hooks into ${target}\n` +
    "  PreToolUse: blocks uncontracted Agent dispatch\n" +
    "  PreToolUse: blocks manager leaf work and non-WHIPS task ledgers\n" +
    "  SubagentStop: returns malformed worker reports\n" +
    "  Stop: keeps the manager working while WHIPS duties remain\n" +
    `  stop gate: ${allowEmergencyRelease ? "six-block emergency release enabled" : "strict"}\n` +
    `  backup: ${raw ? backup : "not needed for a new file"}` +
    (shared ? "\n  warning: shared settings contain machine-specific Node and skill paths" : ""));
}
