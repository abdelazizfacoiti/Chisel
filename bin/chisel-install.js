#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const TARGETS = {
  copilot: [
    ['providers/copilot/copilot-instructions.md', '.github/copilot-instructions.md'],
    ['providers/copilot/.github/prompts/chisel.prompt.md', '.github/prompts/chisel.prompt.md'],
  ],
  codex: [
    ['providers/codex/AGENTS.md', 'AGENTS.md'],
    ['providers/codex/.codex/config.toml', '.codex/config.toml'],
    ['skills/chisel/SKILL.md', '.agents/skills/chisel/SKILL.md'],
  ],
  claude: [
    ['providers/claude/CLAUDE.md', 'CLAUDE.md'],
    ['providers/claude/.claude/commands/chisel.md', '.claude/commands/chisel.md'],
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

const OPTIONAL_TARGETS = {
  codexPrompt: [
    ['providers/codex/.codex/prompts/chisel.md', '~/.codex/prompts/chisel.md'],
  ],
};

function usage() {
  return `Chisel installer

Usage:
  chisel --only codex [--target .] [--dry-run] [--force]
  chisel --only codex --with-codex-prompt [--dry-run] [--force]
  chisel --all [--target .] [--dry-run] [--force]
  chisel --list-providers
  chisel --print codex
  chisel --doctor [--target .]

Targets:
  ${Object.keys(TARGETS).join(', ')}
`;
}

function parseArgs(argv) {
  const opts = {
    only: [],
    all: false,
    target: process.cwd(),
    dryRun: false,
    force: false,
    help: false,
    listProviders: false,
    printProvider: null,
    doctor: false,
    withCodexPrompt: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--list-providers') opts.listProviders = true;
    else if (arg === '--doctor') opts.doctor = true;
    else if (arg === '--print') {
      const value = argv[++i];
      if (!value || value.startsWith('--')) throw new Error('--print requires a provider');
      opts.printProvider = value;
    }
    else if (arg === '--all') opts.all = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--force') opts.force = true;
    else if (arg === '--with-codex-prompt') opts.withCodexPrompt = true;
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

function providerFiles(id) {
  const files = TARGETS[id];
  if (!files) throw new Error(`unknown target: ${id}\n\n${usage()}`);
  return files;
}

function expandDest(destRel, opts) {
  if (destRel.startsWith('~/')) {
    const home = process.env.HOME || process.env.USERPROFILE;
    if (!home) throw new Error(`cannot resolve home directory for ${destRel}`);
    return path.join(home, destRel.slice(2));
  }
  return path.join(opts.target, destRel);
}

function copyFile(srcRel, destRel, opts) {
  const src = path.join(ROOT, srcRel);
  const dest = expandDest(destRel, opts);
  if (!fs.existsSync(src)) throw new Error(`missing source file: ${srcRel}`);
  if (fs.existsSync(dest) && !opts.force) return { status: 'skipped-exists', destRel };
  if (!opts.dryRun) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
  return { status: opts.dryRun ? 'would-write' : 'written', destRel };
}

function listProviders() {
  process.stdout.write(Object.keys(TARGETS).join('\n') + '\n');
}

function printProvider(id) {
  const files = providerFiles(id);
  process.stdout.write(`# Chisel provider: ${id}\n\n`);
  for (const [srcRel, destRel] of files) {
    const src = path.join(ROOT, srcRel);
    process.stdout.write(`## ${destRel}\n\n`);
    process.stdout.write(fs.readFileSync(src, 'utf8').trimEnd() + '\n\n');
  }
}

function doctor(opts) {
  const checks = [];
  const add = (ok, label) => checks.push({ ok, label });
  add(fs.existsSync(path.join(ROOT, 'skills/chisel/SKILL.md')), 'source: skill exists');
  add(fs.existsSync(path.join(ROOT, '.codex-plugin/plugin.json')), 'source: Codex plugin manifest exists');
  add(fs.existsSync(path.join(ROOT, 'providers/copilot/.github/prompts/chisel.prompt.md')), 'source: Copilot prompt file exists');
  add(fs.existsSync(path.join(ROOT, 'providers/claude/.claude/commands/chisel.md')), 'source: Claude command file exists');
  add(fs.existsSync(path.join(opts.target, '.git')), 'target: appears to be a git repo');
  add(fs.existsSync(path.join(opts.target, '.agents/skills/chisel/SKILL.md')), 'target: Codex skill installed');
  add(fs.existsSync(path.join(opts.target, 'AGENTS.md')), 'target: AGENTS.md exists');

  for (const check of checks) {
    process.stdout.write(`${check.ok ? 'ok' : 'miss'} ${check.label}\n`);
  }
  const failed = checks.filter((check) => !check.ok).length;
  process.stdout.write(`\n${checks.length - failed}/${checks.length} checks passed.\n`);
  if (failed) process.stdout.write('Run `chisel --only codex --force` in the target repo to install the Codex skill.\n');
  if (failed) process.exitCode = 1;
}

function postInstallHint(ids, opts, summary) {
  if (opts.dryRun) return;
  process.stdout.write('\n');
  if (summary.written === 0 && summary.skippedExists > 0) {
    process.stdout.write('Chisel already installed. No files changed.\n');
    process.stdout.write('Use `--force` to refresh installed files from this version.\n\n');
  } else if (summary.written > 0 && summary.skippedExists > 0) {
    process.stdout.write('Chisel updated. Some files were already present and were left unchanged.\n\n');
  } else {
    process.stdout.write('Chisel installed.\n\n');
  }
  if (ids.includes('codex')) {
    process.stdout.write('Try Codex:\n  $chisel add validation to the checkout form\n\n');
  } else if (ids.includes('claude')) {
    process.stdout.write('Try Claude Code:\n  /chisel add validation to the checkout form\n\n');
  } else {
    process.stdout.write('Try:\n  use Chisel for this task: add validation to the checkout form\n\n');
  }
  process.stdout.write('Remember: Chisel plans, places markers, then stops. Use inline completion at each marker.\n');
}

function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) {
    process.stdout.write(usage());
    return;
  }
  if (opts.listProviders) {
    listProviders();
    return;
  }
  if (opts.printProvider) {
    printProvider(opts.printProvider);
    return;
  }
  if (opts.doctor) {
    doctor(opts);
    return;
  }
  const ids = opts.all ? Object.keys(TARGETS) : opts.only;
  if (!ids.length) throw new Error(`choose --only <target> or --all\n\n${usage()}`);
  const summary = {
    written: 0,
    skippedExists: 0,
    wouldWrite: 0,
  };
  for (const id of ids) {
    const files = providerFiles(id);
    process.stdout.write(`chisel ${id}${opts.dryRun ? ' (dry run)' : ''}\n`);
    for (const [src, dest] of files) {
      const result = copyFile(src, dest, opts);
      if (result.status === 'written') summary.written += 1;
      else if (result.status === 'skipped-exists') summary.skippedExists += 1;
      else if (result.status === 'would-write') summary.wouldWrite += 1;
      process.stdout.write(`  ${result.status}: ${result.destRel}\n`);
    }
  }
  if (opts.withCodexPrompt) {
    process.stdout.write(`chisel codex-prompt${opts.dryRun ? ' (dry run)' : ''}\n`);
    for (const [src, dest] of OPTIONAL_TARGETS.codexPrompt) {
      const result = copyFile(src, dest, opts);
      if (result.status === 'written') summary.written += 1;
      else if (result.status === 'skipped-exists') summary.skippedExists += 1;
      else if (result.status === 'would-write') summary.wouldWrite += 1;
      process.stdout.write(`  ${result.status}: ${result.destRel}\n`);
    }
    process.stdout.write('  note: Codex custom prompts are deprecated; invoke as /prompts:chisel after restart.\n');
  }
  postInstallHint(ids, opts, summary);
}

try {
  main(process.argv.slice(2));
} catch (err) {
  process.stderr.write((err && err.message ? err.message : String(err)) + '\n');
  process.exit(1);
}
