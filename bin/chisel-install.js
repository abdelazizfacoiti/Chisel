#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const TARGETS = {
  copilot: [
    ['providers/copilot/copilot-instructions.md', '.github/copilot-instructions.md'],
  ],
  codex: [
    ['providers/codex/AGENTS.md', 'AGENTS.md'],
    ['providers/codex/.codex/config.toml', '.codex/config.toml'],
    ['providers/codex/.codex/prompts/chisel.md', '.codex/prompts/chisel.md'],
  ],
  claude: [
    ['providers/claude/CLAUDE.md', 'CLAUDE.md'],
  ],
  gemini: [
    ['providers/gemini/GEMINI.md', 'GEMINI.md'],
  ],
  cursor: [
    ['providers/cursor/chisel.mdc', '.cursor/rules/chisel.mdc'],
  ],
  opencode: [
    ['providers/opencode/AGENTS.md', '.opencode/AGENTS.md'],
  ],
};

function usage() {
  return `Chisel installer

Usage:
  chisel --only codex [--target .] [--dry-run] [--force]
  chisel --all [--target .] [--dry-run] [--force]

Targets:
  ${Object.keys(TARGETS).join(', ')}
`;
}

function parseArgs(argv) {
  const opts = { only: [], all: false, target: process.cwd(), dryRun: false, force: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--all') opts.all = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--force') opts.force = true;
    else if (arg === '--only') {
      const value = argv[++i];
      if (!value || value.startsWith('--')) throw new Error('--only requires a target');
      opts.only.push(value);
    } else if (arg === '--target') {
      const value = argv[++i];
      if (!value || value.startsWith('--')) throw new Error('--target requires a path');
      opts.target = path.resolve(value);
    } else if (arg === '--') {
      continue;
    } else {
      throw new Error(`unknown flag: ${arg}\n\n${usage()}`);
    }
  }
  return opts;
}

function copyFile(srcRel, destRel, opts) {
  const src = path.join(ROOT, srcRel);
  const dest = path.join(opts.target, destRel);
  if (!fs.existsSync(src)) throw new Error(`missing source file: ${srcRel}`);
  if (fs.existsSync(dest) && !opts.force) return { status: 'skipped-exists', destRel };
  if (!opts.dryRun) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
  return { status: opts.dryRun ? 'would-write' : 'written', destRel };
}

function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) {
    process.stdout.write(usage());
    return;
  }
  const ids = opts.all ? Object.keys(TARGETS) : opts.only;
  if (!ids.length) throw new Error(`choose --only <target> or --all\n\n${usage()}`);
  for (const id of ids) {
    const files = TARGETS[id];
    if (!files) throw new Error(`unknown target: ${id}\n\n${usage()}`);
    process.stdout.write(`chisel ${id}${opts.dryRun ? ' (dry run)' : ''}\n`);
    for (const [src, dest] of files) {
      const result = copyFile(src, dest, opts);
      process.stdout.write(`  ${result.status}: ${result.destRel}\n`);
    }
  }
}

try {
  main(process.argv.slice(2));
} catch (err) {
  process.stderr.write((err && err.message ? err.message : String(err)) + '\n');
  process.exit(1);
}
