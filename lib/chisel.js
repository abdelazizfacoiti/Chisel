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

const PACKAGE_VERSION = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'),
).version;

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'target',
  'coverage',
  '.next',
  'out',
]);

const LOCK_FILES = new Set([
  'package-lock.json',
  'npm-shrinkwrap.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'Cargo.lock',
  'Gemfile.lock',
  'Pipfile.lock',
  'poetry.lock',
  'composer.lock',
]);

function usage() {
  return `Chisel

Usage:
  chisel install --only codex [--target .] [--dry-run] [--force]
  chisel --only codex [--target .] [--dry-run] [--force]
  chisel --all [--target .] [--dry-run] [--force]
  chisel status [session-id] [--target .]
  chisel cleanup <session-id> [--target .] [--dry-run] [--apply]
  chisel doctor [--provider codex|copilot|claude|gemini|cursor|opencode|all] [--target .]
  chisel --doctor [--provider codex|copilot|claude|gemini|cursor|opencode|all] [--target .]
  chisel --list-providers
  chisel --print codex

Targets:
  ${Object.keys(TARGETS).join(', ')}
`;
}

function defaultInstallOpts() {
  return {
    only: [],
    all: false,
    target: process.cwd(),
    dryRun: false,
    force: false,
    help: false,
    listProviders: false,
    printProvider: null,
    doctor: false,
    provider: 'all',
    withCodexPrompt: false,
  };
}

function parseInstallArgs(argv) {
  const opts = defaultInstallOpts();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--list-providers') opts.listProviders = true;
    else if (arg === '--doctor') opts.doctor = true;
    else if (arg === '--print') {
      opts.printProvider = readFlagValue(argv, ++i, '--print');
    } else if (arg === '--provider') {
      opts.provider = readFlagValue(argv, ++i, '--provider');
    } else if (arg === '--all') opts.all = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--force') opts.force = true;
    else if (arg === '--with-codex-prompt') opts.withCodexPrompt = true;
    else if (arg === '--only') {
      opts.only.push(readFlagValue(argv, ++i, '--only'));
    } else if (arg === '--target') {
      opts.target = path.resolve(readFlagValue(argv, ++i, '--target'));
    } else if (arg === '--') {
      continue;
    } else {
      throw new Error(`unknown flag: ${arg}\n\n${usage()}`);
    }
  }
  return opts;
}

function parseTargetArgs(argv) {
  const opts = {
    target: process.cwd(),
    dryRun: true,
    apply: false,
    provider: 'all',
    sessionId: null,
  };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--target') {
      opts.target = path.resolve(readFlagValue(argv, ++i, '--target'));
    } else if (arg === '--provider') {
      opts.provider = readFlagValue(argv, ++i, '--provider');
    } else if (arg === '--apply') {
      opts.apply = true;
      opts.dryRun = false;
    } else if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else {
      rest.push(arg);
    }
  }
  opts.rest = rest;
  return opts;
}

function readFlagValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
  return value;
}

function providerFiles(id) {
  const files = TARGETS[id];
  if (!files) throw new Error(`unknown target: ${id}\n\n${usage()}`);
  return files;
}

function providerIds(provider) {
  if (!provider || provider === 'all') return Object.keys(TARGETS);
  providerFiles(provider);
  return [provider];
}

function expandDest(destRel, opts) {
  if (destRel.startsWith('~/')) {
    const home = process.env.HOME || process.env.USERPROFILE;
    if (!home) throw new Error(`cannot resolve home directory for ${destRel}`);
    return path.join(home, destRel.slice(2));
  }
  return path.join(opts.target, destRel);
}

function fileStatus(srcRel, destRel, opts) {
  const src = path.join(ROOT, srcRel);
  const dest = expandDest(destRel, opts);
  if (!fs.existsSync(src)) return { status: 'missing-source', srcRel, destRel, src, dest };
  if (!fs.existsSync(dest)) return { status: 'missing', srcRel, destRel, src, dest };
  const same = fs.readFileSync(src).equals(fs.readFileSync(dest));
  return { status: same ? 'current' : 'stale', srcRel, destRel, src, dest };
}

function copyFile(srcRel, destRel, opts) {
  const status = fileStatus(srcRel, destRel, opts);
  if (status.status === 'missing-source') throw new Error(`missing source file: ${srcRel}`);
  if (status.status === 'current' && !opts.force) return { status: 'skipped-exists', destRel };
  if (status.status === 'stale' && !opts.force) return { status: 'skipped-stale', destRel };
  if (!opts.dryRun) {
    fs.mkdirSync(path.dirname(status.dest), { recursive: true });
    fs.copyFileSync(status.src, status.dest);
  }
  return { status: opts.dryRun ? 'would-write' : 'written', destRel };
}

function install(opts, out = process.stdout) {
  const ids = opts.all ? Object.keys(TARGETS) : opts.only;
  if (!ids.length) throw new Error(`choose --only <target> or --all\n\n${usage()}`);
  const summary = {
    written: 0,
    skippedExists: 0,
    skippedStale: 0,
    wouldWrite: 0,
  };
  for (const id of ids) {
    const files = providerFiles(id);
    out.write(`chisel ${id}${opts.dryRun ? ' (dry run)' : ''}\n`);
    for (const [src, dest] of files) {
      const result = copyFile(src, dest, opts);
      countInstallResult(summary, result.status);
      out.write(`  ${result.status}: ${result.destRel}\n`);
    }
  }
  if (opts.withCodexPrompt) {
    out.write(`chisel codex-prompt${opts.dryRun ? ' (dry run)' : ''}\n`);
    for (const [src, dest] of OPTIONAL_TARGETS.codexPrompt) {
      const result = copyFile(src, dest, opts);
      countInstallResult(summary, result.status);
      out.write(`  ${result.status}: ${result.destRel}\n`);
    }
    out.write('  note: Codex custom prompts are deprecated; invoke as /prompts:chisel after restart.\n');
  }
  postInstallHint(ids, opts, summary, out);
  return summary;
}

function countInstallResult(summary, status) {
  if (status === 'written') summary.written += 1;
  else if (status === 'skipped-exists') summary.skippedExists += 1;
  else if (status === 'skipped-stale') summary.skippedStale += 1;
  else if (status === 'would-write') summary.wouldWrite += 1;
}

function postInstallHint(ids, opts, summary, out = process.stdout) {
  if (opts.dryRun) return;
  out.write('\n');
  if (summary.written === 0 && summary.skippedStale > 0) {
    out.write('Chisel already installed, but some files differ from this version.\n');
    out.write('Use `--force` to refresh stale installed files.\n\n');
  } else if (summary.written === 0 && summary.skippedExists > 0) {
    out.write('Chisel already installed. No files changed.\n');
    out.write('Use `--force` to refresh installed files from this version.\n\n');
  } else if (summary.written > 0 && (summary.skippedExists > 0 || summary.skippedStale > 0)) {
    out.write('Chisel updated. Some files were already present and were left unchanged.\n\n');
  } else {
    out.write('Chisel installed.\n\n');
  }
  if (ids.includes('codex')) {
    out.write('Try Codex:\n  $chisel add validation to the checkout form\n\n');
  } else if (ids.includes('claude')) {
    out.write('Try Claude Code:\n  /chisel add validation to the checkout form\n\n');
  } else {
    out.write('Try:\n  use Chisel for this task: add validation to the checkout form\n\n');
  }
  out.write('Remember: Chisel plans, places markers, then stops. Use inline completion or implement by hand at each marker.\n');
}

function listProviders(out = process.stdout) {
  out.write(Object.keys(TARGETS).join('\n') + '\n');
}

function printProvider(id, out = process.stdout) {
  const files = providerFiles(id);
  out.write(`# Chisel provider: ${id}\n\n`);
  for (const [srcRel, destRel] of files) {
    const src = path.join(ROOT, srcRel);
    out.write(`## ${destRel}\n\n`);
    out.write(fs.readFileSync(src, 'utf8').trimEnd() + '\n\n');
  }
}

function doctor(opts, out = process.stdout) {
  const checks = [];
  const add = (ok, label) => checks.push({ ok, label });
  out.write(`chisel installed version: ${PACKAGE_VERSION}\n`);
  add(fs.existsSync(path.join(ROOT, 'skills/chisel/SKILL.md')), 'source: skill exists');
  add(fs.existsSync(path.join(ROOT, '.codex-plugin/plugin.json')), 'source: Codex plugin manifest exists');
  add(fs.existsSync(opts.target), `target: ${opts.target} exists`);
  add(fs.existsSync(path.join(opts.target, '.git')), 'target: appears to be a git repo');

  for (const id of providerIds(opts.provider)) {
    for (const [srcRel, destRel] of providerFiles(id)) {
      const status = fileStatus(srcRel, destRel, opts);
      add(status.status !== 'missing-source', `source: ${id} ${srcRel}`);
      add(status.status === 'current', `target: ${id} ${destRel} ${doctorStatusLabel(status.status)}`);
    }
  }

  for (const check of checks) {
    out.write(`${check.ok ? 'ok' : 'miss'} ${check.label}\n`);
  }
  const failed = checks.filter((check) => !check.ok).length;
  out.write(`\n${checks.length - failed}/${checks.length} checks passed.\n`);
  if (failed) out.write('Run `chisel install --only <provider> --force` to refresh stale or missing provider files.\n');
  return { checks, failed };
}

function doctorStatusLabel(status) {
  if (status === 'current') return 'current';
  if (status === 'stale') return 'stale';
  if (status === 'missing') return 'missing';
  return status;
}

function isIgnoredPath(relPath) {
  const normalized = relPath.split(path.sep).join('/');
  const segments = normalized.split('/');
  if (segments.some((segment) => IGNORED_DIRS.has(segment))) return true;
  const base = segments[segments.length - 1];
  return LOCK_FILES.has(base);
}

function isBinaryFile(filePath) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(512);
    const bytes = fs.readSync(fd, buffer, 0, buffer.length, 0);
    return buffer.subarray(0, bytes).includes(0);
  } finally {
    fs.closeSync(fd);
  }
}

function walkFiles(rootDir) {
  const files = [];
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(rootDir, fullPath);
      if (isIgnoredPath(relPath)) continue;
      if (entry.isDirectory()) visit(fullPath);
      else if (entry.isFile() && !isBinaryFile(fullPath)) files.push(fullPath);
    }
  }
  if (fs.existsSync(rootDir)) visit(rootDir);
  return files;
}

function parseMarkerLine(line, lineNumber, file) {
  const match = line.match(/TODO\(chisel:(item-\d+)\)\s+CHISEL:([^\s<>)]+)\s*(.*)$/);
  if (!match) return null;
  const comment = line.trim();
  return {
    itemId: match[1],
    sessionId: match[2],
    markerText: cleanMarkerText(match[3]),
    file,
    line: lineNumber,
    comment,
  };
}

function cleanMarkerText(text) {
  return text
    .replace(/\s*-->\s*$/, '')
    .replace(/\s*\*\/\s*$/, '')
    .trim();
}

function isStandaloneMarkerLine(line, sessionId) {
  const trimmed = line.trim();
  const markerPattern = new RegExp(
    '^(?:\\/\\/|#|--|\\/\\*|<!--)\\s*TODO\\(chisel:item-\\d+\\)\\s+CHISEL:'
      + escapeRegExp(sessionId)
      + '\\b.*?(?:\\*\\/|-->)?\\s*$',
  );
  return markerPattern.test(trimmed);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function scanMarkers(target, sessionId = null) {
  const markers = [];
  for (const filePath of walkFiles(target)) {
    const relFile = path.relative(target, filePath).split(path.sep).join('/');
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const marker = parseMarkerLine(lines[i], i + 1, relFile);
      if (marker && (!sessionId || marker.sessionId === sessionId)) markers.push(marker);
    }
  }
  return markers;
}

function readSessionRecords(target, sessionId = null) {
  const dir = path.join(target, '.chisel');
  if (!fs.existsSync(dir)) return [];
  const records = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.json') && !entry.name.endsWith('.md')) continue;
    const id = entry.name.replace(/\.(json|md)$/, '');
    if (sessionId && id !== sessionId) continue;
    const file = path.join('.chisel', entry.name).split(path.sep).join('/');
    if (entry.name.endsWith('.json')) {
      const record = readJsonRecord(path.join(dir, entry.name));
      records.push({ sessionId: id, file, type: 'json', record });
    } else {
      records.push({ sessionId: id, file, type: 'markdown', record: null });
    }
  }
  return records.sort((a, b) => a.sessionId.localeCompare(b.sessionId) || a.type.localeCompare(b.type));
}

function readJsonRecord(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return { parseError: err.message };
  }
}

function status(opts, out = process.stdout) {
  const sessionId = opts.sessionId || null;
  const markers = scanMarkers(opts.target, sessionId);
  const records = readSessionRecords(opts.target, sessionId);
  const sessions = Array.from(new Set([
    ...records.map((record) => record.sessionId),
    ...markers.map((marker) => marker.sessionId),
  ])).sort();

  out.write('Chisel status\n');
  out.write(`target: ${opts.target}\n`);
  if (sessionId) out.write(`session: ${sessionId}\n`);
  out.write(`sessions: ${sessions.length}\n`);
  out.write(`markers: ${markers.length}\n\n`);

  for (const id of sessions) {
    const sessionRecords = records.filter((record) => record.sessionId === id);
    const sessionMarkers = markers.filter((marker) => marker.sessionId === id);
    out.write(`session ${id}\n`);
    for (const record of sessionRecords) {
      out.write(`  receipt: ${record.file}${record.record && record.record.parseError ? ' (invalid json)' : ''}\n`);
    }
    for (const marker of sessionMarkers) {
      out.write(`  ${marker.file}:${marker.line} ${marker.itemId} ${marker.markerText}\n`);
    }
    if (!sessionRecords.length && sessionMarkers.length) out.write('  receipt: missing\n');
  }
  if (!sessions.length) out.write('No Chisel sessions or markers found.\n');
  return { sessions, markers, records };
}

function cleanup(opts, out = process.stdout) {
  const sessionId = opts.sessionId;
  if (!sessionId) throw new Error(`cleanup requires a session id\n\n${usage()}`);
  const markerNeedle = `CHISEL:${sessionId}`;
  const changes = [];
  const skippedInline = [];
  for (const filePath of walkFiles(opts.target)) {
    const relFile = path.relative(opts.target, filePath).split(path.sep).join('/');
    const original = fs.readFileSync(filePath, 'utf8');
    const lines = original.split(/\r?\n/);
    const kept = [];
    const removed = [];
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].includes(markerNeedle)) {
        kept.push(lines[i]);
        continue;
      }
      if (isStandaloneMarkerLine(lines[i], sessionId)) {
        removed.push({ line: i + 1, text: lines[i].trim() });
      } else {
        skippedInline.push({ file: relFile, line: i + 1, text: lines[i].trim() });
        kept.push(lines[i]);
      }
    }
    if (removed.length) {
      changes.push({ file: relFile, removed });
      if (opts.apply) fs.writeFileSync(filePath, kept.join('\n'), 'utf8');
    }
  }

  out.write(`Chisel cleanup ${opts.apply ? 'apply' : 'dry-run'}\n`);
  out.write(`session: ${sessionId}\n`);
  out.write(`markers: ${changes.reduce((sum, change) => sum + change.removed.length, 0)}\n`);
  for (const change of changes) {
    out.write(`${change.file}\n`);
    for (const removed of change.removed) out.write(`  remove line ${removed.line}: ${removed.text}\n`);
  }
  if (skippedInline.length) {
    out.write(`skipped-inline: ${skippedInline.length}\n`);
    for (const skipped of skippedInline) {
      out.write(`  warning ${skipped.file}:${skipped.line}: marker shares a line with other content, remove it manually\n`);
    }
  }
  if (!changes.length && !skippedInline.length) out.write('No matching markers found.\n');
  if (!opts.apply) out.write('Dry run only. Re-run with `--apply` to remove these marker lines.\n');
  return { changes, skippedInline };
}

function main(argv, out = process.stdout) {
  const [command, ...rest] = argv;
  if (!command || command === '--help' || command === '-h') {
    out.write(usage());
    return null;
  }
  if (command === 'install') {
    const opts = parseInstallArgs(rest);
    if (opts.help) {
      out.write(usage());
      return null;
    }
    return install(opts, out);
  }
  if (command === 'status') {
    const opts = parseTargetArgs(rest);
    opts.sessionId = opts.rest[0] || null;
    return status(opts, out);
  }
  if (command === 'cleanup') {
    const opts = parseTargetArgs(rest);
    opts.sessionId = opts.rest[0];
    return cleanup(opts, out);
  }
  if (command === 'doctor') {
    const opts = parseTargetArgs(rest);
    return doctor(opts, out);
  }

  const opts = parseInstallArgs(argv);
  if (opts.help) {
    out.write(usage());
    return null;
  }
  if (opts.listProviders) {
    listProviders(out);
    return null;
  }
  if (opts.printProvider) {
    printProvider(opts.printProvider, out);
    return null;
  }
  if (opts.doctor) return doctor(opts, out);
  return install(opts, out);
}

module.exports = {
  TARGETS,
  cleanup,
  doctor,
  fileStatus,
  install,
  isIgnoredPath,
  isStandaloneMarkerLine,
  main,
  parseMarkerLine,
  printProvider,
  readSessionRecords,
  scanMarkers,
  status,
  usage,
  walkFiles,
};
