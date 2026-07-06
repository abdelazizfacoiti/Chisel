'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const TARGETS = {
  copilot: [
    ['lib/chisel.js', '.chisel/chisel.js'],
    ['providers/copilot/copilot-instructions.md', '.github/copilot-instructions.md'],
    ['providers/copilot/.github/prompts/chisel.prompt.md', '.github/prompts/chisel.prompt.md'],
  ],
  codex: [
    ['lib/chisel.js', '.chisel/chisel.js'],
    ['providers/codex/AGENTS.md', 'AGENTS.md'],
    ['providers/codex/.codex/config.toml', '.codex/config.toml'],
    ['providers/codex/.codex/prompts/chisel.md', '.codex/prompts/chisel.md'],
    ['providers/codex/.codex-plugin/plugin.json', '.codex-plugin/plugin.json'],
    ['skills/chisel/SKILL.md', '.agents/skills/chisel/SKILL.md'],
  ],
  claude: [
    ['lib/chisel.js', '.chisel/chisel.js'],
    ['providers/claude/CLAUDE.md', 'CLAUDE.md'],
    ['providers/claude/.claude/commands/chisel.md', '.claude/commands/chisel.md'],
    ['providers/claude/.claude/hooks/chisel-guard.js', '.claude/hooks/chisel-guard.js'],
  ],
  gemini: [
    ['lib/chisel.js', '.chisel/chisel.js'],
    ['providers/gemini/GEMINI.md', 'GEMINI.md'],
  ],
  cursor: [
    ['lib/chisel.js', '.chisel/chisel.js'],
    ['providers/cursor/chisel.mdc', '.cursor/rules/chisel.mdc'],
  ],
  opencode: [
    ['lib/chisel.js', '.chisel/chisel.js'],
    ['providers/opencode/AGENTS.md', '.opencode/AGENTS.md'],
  ],
};

const OPTIONAL_TARGETS = {
  codexPrompt: [
    ['providers/codex/.codex/prompts/chisel.md', '~/.codex/prompts/chisel.md'],
  ],
};

const PACKAGE_VERSION = readPackageVersion();

function readPackageVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    if (pkg.name === 'chisel' && pkg.version) return pkg.version;
  } catch (err) {
    // Repo-local installed CLI copies do not carry Chisel's package.json.
  }
  return 'local';
}

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
  chisel insert --slug <slug> --item <item-id> --file <path> --anchor <text> --position before|after --instruction <text> [--target .]
  chisel pass start <slug> [--task <task>] [--target .]
  chisel pass end <slug> [--target .]
  chisel scan <query> [--target .]
  chisel cleanup [session-id] [--target .] [--dry-run] [--apply] [--discard-staged]
  chisel verify [session-id] [--target .]
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
    discardStaged: false,
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
    } else if (arg === '--discard-staged') {
      opts.discardStaged = true;
    } else if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else {
      rest.push(arg);
    }
  }
  opts.rest = rest;
  return opts;
}

function parseInsertArgs(argv) {
  const opts = {
    target: process.cwd(),
    file: null,
    anchor: null,
    position: null,
    sessionSlug: null,
    itemId: null,
    instruction: null,
    task: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--target') opts.target = path.resolve(readFlagValue(argv, ++i, '--target'));
    else if (arg === '--file') opts.file = readFlagValue(argv, ++i, '--file');
    else if (arg === '--anchor') opts.anchor = readFlagValue(argv, ++i, '--anchor');
    else if (arg === '--position') opts.position = readFlagValue(argv, ++i, '--position');
    else if (arg === '--slug') opts.sessionSlug = readFlagValue(argv, ++i, '--slug');
    else if (arg === '--item') opts.itemId = readFlagValue(argv, ++i, '--item');
    else if (arg === '--instruction') opts.instruction = readFlagValue(argv, ++i, '--instruction');
    else if (arg === '--task') opts.task = readFlagValue(argv, ++i, '--task');
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else throw new Error(`unknown insert flag: ${arg}\n\n${usage()}`);
  }
  return opts;
}

function parsePassArgs(argv) {
  const opts = {
    target: process.cwd(),
    action: argv[0] || null,
    slug: argv[1] || null,
    task: '',
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--target') opts.target = path.resolve(readFlagValue(argv, ++i, '--target'));
    else if (arg === '--task') opts.task = readFlagValue(argv, ++i, '--task');
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else throw new Error(`unknown pass flag: ${arg}\n\n${usage()}`);
  }
  return opts;
}

function parseScanArgs(argv) {
  const opts = {
    target: process.cwd(),
    query: null,
  };
  const terms = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--target') opts.target = path.resolve(readFlagValue(argv, ++i, '--target'));
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else terms.push(arg);
  }
  opts.query = terms.join(' ').trim();
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
  if (!opts.dryRun && ids.includes('claude')) {
    const registered = registerClaudeHook(opts);
    countInstallResult(summary, registered.status);
    out.write(`  ${registered.status}: ${registered.destRel}\n`);
  }
  postInstallHint(ids, opts, summary, out);
  return summary;
}

function registerClaudeHook(opts) {
  const destRel = '.claude/settings.json';
  const dest = path.join(opts.target, destRel);
  let settings = {};
  if (fs.existsSync(dest)) {
    try {
      settings = JSON.parse(fs.readFileSync(dest, 'utf8'));
    } catch (err) {
      return { status: 'skipped-stale', destRel };
    }
  }
  settings.hooks = settings.hooks || {};
  settings.hooks.PreToolUse = settings.hooks.PreToolUse || [];
  const command = 'node ${CLAUDE_PROJECT_DIR}/.claude/hooks/chisel-guard.js';
  const matcher = 'Edit|Write|MultiEdit';
  let group = settings.hooks.PreToolUse.find((entry) => entry.matcher === matcher);
  if (!group) {
    group = { matcher, hooks: [] };
    settings.hooks.PreToolUse.push(group);
  }
  group.hooks = group.hooks || [];
  if (!group.hooks.some((hook) => hook.command === command)) {
    group.hooks.push({ type: 'command', command });
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(settings, null, 2) + '\n', 'utf8');
  return { status: 'written', destRel };
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
  const unverifiedSessions = findUnverifiedSessions(opts.target);
  const failed = checks.filter((check) => !check.ok).length;
  out.write(`\n${checks.length - failed}/${checks.length} checks passed.\n`);
  if (unverifiedSessions.length) {
    out.write('Hints:\n');
    for (const sessionId of unverifiedSessions) {
      out.write(`  run \`chisel verify ${sessionId}\` to audit that marker pass.\n`);
    }
  }
  if (failed) out.write('Run `chisel install --only <provider> --force` to refresh stale or missing provider files.\n');
  return { checks, failed, unverifiedSessions };
}

function doctorStatusLabel(status) {
  if (status === 'current') return 'current';
  if (status === 'stale') return 'stale';
  if (status === 'missing') return 'missing';
  return status;
}

function commentSyntaxForFile(relFile) {
  const ext = path.extname(relFile).toLowerCase();
  const lineTokenMap = new Map([
    ['.js', '//'],
    ['.jsx', '//'],
    ['.ts', '//'],
    ['.tsx', '//'],
    ['.go', '//'],
    ['.rs', '//'],
    ['.java', '//'],
    ['.c', '//'],
    ['.cc', '//'],
    ['.cpp', '//'],
    ['.cs', '//'],
    ['.kt', '//'],
    ['.kts', '//'],
    ['.swift', '//'],
    ['.php', '//'],
    ['.py', '#'],
    ['.rb', '#'],
    ['.sh', '#'],
    ['.bash', '#'],
    ['.zsh', '#'],
    ['.yml', '#'],
    ['.yaml', '#'],
    ['.toml', '#'],
    ['.sql', '--'],
  ]);
  const blockTokenMap = new Map([
    ['.css', { open: '/*', close: '*/' }],
    ['.scss', { open: '/*', close: '*/' }],
    ['.sass', { open: '/*', close: '*/' }],
    ['.html', { open: '<!--', close: '-->' }],
    ['.htm', { open: '<!--', close: '-->' }],
  ]);
  return {
    lineToken: lineTokenMap.get(ext) || null,
    blockToken: blockTokenMap.get(ext) || null,
  };
}

function formatStandaloneComment(relFile, content) {
  const syntax = commentSyntaxForFile(relFile);
  if (syntax.lineToken) return `${syntax.lineToken} ${content}`;
  if (syntax.blockToken) return `${syntax.blockToken.open} ${content} ${syntax.blockToken.close}`;
  return `// ${content}`;
}

function markerBlockFor(relFile, slug, itemId, instruction) {
  return [
    formatStandaloneComment(relFile, `CHISEL:${slug} ${itemId}`),
    formatStandaloneComment(relFile, `TODO: ${instruction}`),
  ];
}

function stageBodyLinePrefix(relFile) {
  const syntax = commentSyntaxForFile(relFile);
  return syntax.lineToken;
}

function stageBodyBlockToken(relFile) {
  const syntax = commentSyntaxForFile(relFile);
  return syntax.blockToken;
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
  const content = parseStandaloneCommentContent(line);
  if (!content) return null;
  const match = content.match(/^TODO\(chisel:(item-\d+)\)\s+CHISEL:([^\s<>)]+)\s*(.*)$/);
  if (!match) return null;
  const comment = line.trim();
  return {
    type: 'marker',
    itemId: match[1],
    sessionId: match[2],
    markerText: cleanMarkerText(match[3]),
    file,
    line: lineNumber,
    instructionLine: lineNumber,
    comment,
    format: 'single-line',
  };
}

function parseMarkerBlock(lines, index, file) {
  const trackingLine = lines[index];
  const trackingContent = parseStandaloneCommentContent(trackingLine);
  if (trackingContent) {
    const trackingMatch = trackingContent.match(/^CHISEL:([^\s]+)\s+(item-\d+)$/);
    if (trackingMatch && typeof lines[index + 1] === 'string') {
      const instructionContent = parseStandaloneCommentContent(lines[index + 1]);
      if (instructionContent) {
        const instructionMatch = instructionContent.match(/^TODO:\s+(.+)$/);
        if (instructionMatch) {
          return {
            type: 'marker',
            itemId: trackingMatch[2],
            sessionId: trackingMatch[1],
            markerText: cleanMarkerText(instructionMatch[1]),
            file,
            line: index + 1,
            instructionLine: index + 2,
            comment: `${trackingLine.trim()}\n${lines[index + 1].trim()}`,
            format: 'two-line',
          };
        }
      }
    }
  }
  return parseMarkerLine(trackingLine, index + 1, file);
}

function parseStageBoundaryLine(line) {
  const content = parseStandaloneCommentContent(line);
  if (!content) return null;
  const match = content.match(/^CHISEL-STAGE:([^\s]+)\s+(item-\d+)\s+(begin|end)$/);
  if (!match) return null;
  return {
    sessionId: match[1],
    itemId: match[2],
    boundary: match[3],
  };
}

function parseStageMarkerBlock(lines, index, file) {
  const begin = parseStageBoundaryLine(lines[index]);
  if (!begin || begin.boundary !== 'begin') return null;
  for (let i = index + 1; i < lines.length; i++) {
    const end = parseStageBoundaryLine(lines[i]);
    if (end && end.boundary === 'end' && end.sessionId === begin.sessionId && end.itemId === begin.itemId) {
      let markerText = 'staged block';
      if (index >= 2) {
        const marker = parseMarkerBlock(lines, index - 2, file);
        if (marker && marker.sessionId === begin.sessionId && marker.itemId === begin.itemId) {
          markerText = marker.markerText;
        }
      }
      return {
        type: 'staged',
        sessionId: begin.sessionId,
        itemId: begin.itemId,
        markerText,
        file,
        line: index + 1,
        instructionLine: index + 1,
        stageBeginLine: index + 1,
        stageEndLine: i + 1,
        stageBodyStart: index + 2,
        stageBodyEnd: i,
        format: 'staged',
      };
    }
  }
  return null;
}

function cleanMarkerText(text) {
  return text
    .replace(/\s*-->\s*$/, '')
    .replace(/\s*\*\/\s*$/, '')
    .trim();
}

function parseStandaloneCommentContent(line) {
  const trimmed = line.trim();
  const patterns = [
    /^\/\/\s*(.*?)\s*$/,
    /^#\s*(.*?)\s*$/,
    /^--\s*(.*?)\s*$/,
    /^\/\*\s*(.*?)\s*\*\/$/,
    /^<!--\s*(.*?)\s*-->$/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function isStandaloneMarkerLine(line) {
  return parseStandaloneCommentContent(line) !== null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isGitRepo(target) {
  return fs.existsSync(path.join(target, '.git'));
}

function manifestPath(target, slug) {
  return path.join(target, '.chisel', `${slug}.json`);
}

function readManifest(target, slug) {
  const file = manifestPath(target, slug);
  if (!fs.existsSync(file)) return null;
  const record = readJsonRecord(file);
  if (!record || record.parseError || record.slug !== slug || !Array.isArray(record.items)) return null;
  return record;
}

function writeManifest(target, manifest) {
  const dir = path.join(target, '.chisel');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(manifestPath(target, manifest.slug), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

function upsertManifestItem(target, opts, result) {
  const slug = opts.sessionSlug;
  const existing = readManifest(target, slug);
  const manifest = existing || {
    slug,
    task: opts.task || '',
    createdAt: new Date().toISOString(),
    active: true,
    items: [],
  };
  if (opts.task && !manifest.task) manifest.task = opts.task;
  const item = {
    itemId: opts.itemId,
    file: result.file,
    diffHunk: result.diffHunk,
    anchor: result.anchor,
    position: result.position,
    instruction: opts.instruction,
    markerBlock: result.markerBlock,
  };
  const index = manifest.items.findIndex((entry) => entry.itemId === item.itemId);
  if (index === -1) manifest.items.push(item);
  else manifest.items[index] = item;
  writeManifest(target, manifest);
  return manifest;
}

function setPassActive(opts, out = process.stdout) {
  if (!['start', 'end'].includes(opts.action) || !opts.slug) {
    throw new Error(`pass requires start|end and a slug\n\n${usage()}`);
  }
  const existing = readManifest(opts.target, opts.slug);
  const manifest = existing || {
    slug: opts.slug,
    task: opts.task || '',
    createdAt: new Date().toISOString(),
    active: true,
    items: [],
  };
  if (opts.task && !manifest.task) manifest.task = opts.task;
  manifest.active = opts.action === 'start';
  writeManifest(opts.target, manifest);
  out.write(`Chisel pass ${opts.action}: ${opts.slug}\n`);
  out.write(`active: ${manifest.active ? 'yes' : 'no'}\n`);
  return manifest;
}

function gitAddFile(target, relFile) {
  childProcess.execFileSync('git', ['add', '--', relFile], {
    cwd: target,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function gitResetFile(target, relFile) {
  try {
    childProcess.execFileSync('git', ['reset', 'HEAD', '--', relFile], {
      cwd: target,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    // A missing HEAD or unstaged path should not hide a successful cleanup.
  }
}

function gitCachedDiffForFiles(target, files) {
  if (!files.length) return '';
  try {
    return childProcess.execFileSync('git', ['diff', '--cached', '--', ...files], {
      cwd: target,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    if (typeof err.stdout === 'string') return err.stdout;
    if (Buffer.isBuffer(err.stdout)) return err.stdout.toString('utf8');
    return '';
  }
}

function readGitIndexFile(target, relFile) {
  try {
    return childProcess.execFileSync('git', ['show', `:${relFile}`], {
      cwd: target,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    return null;
  }
}

function commandExists(command) {
  const result = childProcess.spawnSync(command, ['--version'], {
    encoding: 'utf8',
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  return !result.error;
}

function scanRepo(opts, out = process.stdout) {
  if (!opts.query) throw new Error(`scan requires a query\n\n${usage()}`);
  const useRg = commandExists('rg');
  const command = useRg ? 'rg' : 'git';
  const args = useRg
    ? ['-n', '--fixed-strings', '--', opts.query]
    : ['grep', '-n', '--fixed-strings', '--', opts.query];
  const result = childProcess.spawnSync(command, args, {
    cwd: opts.target,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const output = result.stdout || '';
  const lines = output.split(/\r?\n/).filter(Boolean).slice(0, 20);
  out.write(`Chisel scan: ${opts.query}\n`);
  if (!lines.length) {
    out.write('No matches found.\n');
    return { query: opts.query, matches: [] };
  }
  for (const line of lines) out.write(`${line}\n`);
  return { query: opts.query, matches: lines };
}

function requireInsertOpts(opts) {
  const required = ['file', 'anchor', 'position', 'sessionSlug', 'itemId', 'instruction'];
  for (const key of required) {
    if (!opts[key]) throw new Error(`insert requires --${key === 'sessionSlug' ? 'slug' : key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`);
  }
  if (!['before', 'after'].includes(opts.position)) {
    throw new Error('insert requires --position before|after');
  }
}

function findAnchorLine(lines, anchor) {
  const matches = [];
  for (let i = 0; i < lines.length; i++) {
    let index = lines[i].indexOf(anchor);
    while (index !== -1) {
      matches.push(i);
      index = lines[i].indexOf(anchor, index + anchor.length);
    }
  }
  return matches;
}

function syntaxCheckText(target, relFile, content) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'chisel-syntax-'));
  try {
    const tempFile = path.join(tempRoot, relFile);
    fs.mkdirSync(path.dirname(tempFile), { recursive: true });
    fs.writeFileSync(tempFile, content, 'utf8');
    return syntaxCheckFile(tempRoot, relFile);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function unifiedDiff(oldText, newText, relFile) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'chisel-diff-'));
  try {
    const oldFile = path.join(tempRoot, 'a', relFile);
    const newFile = path.join(tempRoot, 'b', relFile);
    fs.mkdirSync(path.dirname(oldFile), { recursive: true });
    fs.mkdirSync(path.dirname(newFile), { recursive: true });
    fs.writeFileSync(oldFile, oldText, 'utf8');
    fs.writeFileSync(newFile, newText, 'utf8');
    try {
      return childProcess.execFileSync('git', ['diff', '--no-index', '--', oldFile, newFile], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      const output = typeof err.stdout === 'string' ? err.stdout : String(err.stdout || '');
      return output
        .replaceAll(oldFile.split(path.sep).join('/'), `a/${relFile}`)
        .replaceAll(newFile.split(path.sep).join('/'), `b/${relFile}`);
    }
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function insertMarker(opts) {
  requireInsertOpts(opts);
  const relFile = opts.file.split(path.sep).join('/');
  const filePath = path.resolve(opts.target, relFile);
  const targetRoot = path.resolve(opts.target);
  if (!filePath.startsWith(targetRoot + path.sep) && filePath !== targetRoot) {
    return { success: false, file: relFile, error: `file is outside target: ${relFile}` };
  }
  if (!fs.existsSync(filePath)) {
    return { success: false, file: relFile, error: `file not found: ${relFile}` };
  }

  const before = fs.readFileSync(filePath, 'utf8');
  const lines = before.split(/\r?\n/);
  const matches = findAnchorLine(lines, opts.anchor);
  if (matches.length === 0) {
    return { success: false, file: relFile, error: `anchor not found in ${relFile}: ${opts.anchor}` };
  }
  if (matches.length > 1) {
    return { success: false, file: relFile, error: `anchor is ambiguous in ${relFile}: ${matches.length} matches for ${opts.anchor}` };
  }

  const anchorIndent = (lines[matches[0]].match(/^\s*/) || [''])[0];
  const markerLines = markerBlockFor(relFile, opts.sessionSlug, opts.itemId, opts.instruction)
    .map((line) => `${anchorIndent}${line}`);
  const insertAt = opts.position === 'before' ? matches[0] : matches[0] + 1;
  const nextLines = [
    ...lines.slice(0, insertAt),
    ...markerLines,
    ...lines.slice(insertAt),
  ];
  const after = nextLines.join('\n');
  const syntaxCheck = syntaxCheckText(opts.target, relFile, after);
  if (syntaxCheck.status === 'fail') {
    return {
      success: false,
      file: relFile,
      error: `syntax check failed for ${relFile}: ${syntaxCheck.message}`,
      syntaxCheck,
    };
  }

  const diffHunk = unifiedDiff(before, after, relFile);
  fs.writeFileSync(filePath, after, 'utf8');

  const result = {
    success: true,
    file: relFile,
    diffHunk,
    itemId: opts.itemId,
    markerBlock: markerLines.join('\n'),
    anchor: opts.anchor,
    position: opts.position,
  };
  if (syntaxCheck.status === 'skipped') {
    result.warning = `unverified: ${syntaxCheck.message.replace(/^skipped:\s*/, '')}`;
  }
  upsertManifestItem(opts.target, opts, result);
  if (isGitRepo(opts.target)) {
    gitAddFile(opts.target, relFile);
  }
  return result;
}

function scanMarkers(target, sessionId = null) {
  const markers = [];
  for (const filePath of walkFiles(target)) {
    const relFile = path.relative(target, filePath).split(path.sep).join('/');
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const marker = parseMarkerBlock(lines, i, relFile);
      if (marker && (!sessionId || marker.sessionId === sessionId)) {
        markers.push(marker);
        if (marker.format === 'two-line') i += 1;
        continue;
      }
      const staged = parseStageMarkerBlock(lines, i, relFile);
      if (staged && (!sessionId || staged.sessionId === sessionId)) {
        markers.push(staged);
        i = staged.stageEndLine - 1;
      }
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

function slugFromTask(task) {
  const stopWords = new Set(['a', 'an', 'and', 'for', 'in', 'of', 'on', 'the', 'to', 'with']);
  const words = String(task || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word && !stopWords.has(word))
    .slice(0, 4);
  return words.length ? words.join('-') : 'chisel-pass';
}

function generateSlug(target, task) {
  const base = slugFromTask(task);
  let slug = base;
  let suffix = 2;
  while (fs.existsSync(manifestPath(target, slug))) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

function sessionSummaries(target) {
  const records = readSessionRecords(target);
  const markers = scanMarkers(target);
  const sessions = new Map();

  for (const record of records) {
    if (!sessions.has(record.sessionId)) {
      sessions.set(record.sessionId, {
        sessionId: record.sessionId,
        task: null,
        fileCount: 0,
      });
    }
    const entry = sessions.get(record.sessionId);
    if (record.type === 'json' && record.record) {
      if (!entry.task && typeof record.record.task === 'string' && record.record.task.trim()) {
        entry.task = record.record.task.trim();
      }
      if (Array.isArray(record.record.filesTouched) && record.record.filesTouched.length) {
        entry.fileCount = Math.max(entry.fileCount, new Set(record.record.filesTouched).size);
      } else if (Array.isArray(record.record.insertedComments) && record.record.insertedComments.length) {
        entry.fileCount = Math.max(
          entry.fileCount,
          new Set(record.record.insertedComments.map((comment) => comment.file).filter(Boolean)).size,
        );
      }
      if (Array.isArray(record.record.items) && record.record.items.length) {
        entry.itemCount = Math.max(entry.itemCount || 0, record.record.items.length);
      }
    }
  }

  for (const marker of markers) {
    const entry = sessions.get(marker.sessionId);
    if (!entry) continue;
    const relatedMarkers = markers.filter((item) => item.sessionId === marker.sessionId);
    entry.fileCount = Math.max(entry.fileCount, new Set(relatedMarkers.map((item) => item.file)).size);
  }

  return Array.from(sessions.values())
    .map((entry) => ({
      sessionId: entry.sessionId,
      task: entry.task || '(task unavailable)',
      fileCount: entry.fileCount,
      itemCount: entry.itemCount || 0,
    }))
    .sort((a, b) => b.sessionId.localeCompare(a.sessionId));
}

function writeSessionChoices(command, summaries, out = process.stdout) {
  out.write('Multiple Chisel passes found in this repo. Pass one explicitly:\n');
  for (const summary of summaries) {
    const count = summary.itemCount || summary.fileCount || 0;
    out.write(`  ${summary.sessionId}  ${summary.task}  ${count} item${count === 1 ? '' : 's'}\n`);
  }
  out.write(`Run \`chisel ${command} <slug>\`.\n`);
}

function resolveSessionId(opts, out = process.stdout, command = 'status') {
  if (opts.sessionId) return opts.sessionId;
  const summaries = sessionSummaries(opts.target);
  if (!summaries.length) {
    out.write('No active Chisel passes found in this repo.\n');
    return null;
  }
  if (summaries.length === 1) {
    out.write(`no slug given, using latest: ${summaries[0].sessionId}\n`);
    return summaries[0].sessionId;
  }
  writeSessionChoices(command, summaries, out);
  return null;
}

function findUnverifiedSessions(target) {
  const records = readSessionRecords(target);
  const sessions = new Map();
  for (const record of records) {
    if (!sessions.has(record.sessionId)) {
      sessions.set(record.sessionId, { verified: false });
    }
    const entry = sessions.get(record.sessionId);
    if (record.type === 'json') {
      if (record.record && record.record.verification && record.record.verification.verifiedAt) {
        entry.verified = true;
      }
    }
  }
  return Array.from(sessions.entries())
    .filter(([, entry]) => !entry.verified)
    .map(([sessionId]) => sessionId)
    .sort();
}

function status(opts, out = process.stdout) {
  const sessionId = resolveSessionId(opts, out, 'status');
  if (!sessionId) {
    const summaries = sessionSummaries(opts.target);
    return {
      sessionId: null,
      sessions: summaries.map((summary) => summary.sessionId),
      markers: [],
      records: [],
    };
  }
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
      if (marker.type === 'staged') {
        out.write(`  ${marker.file}:${marker.stageBeginLine}-${marker.stageEndLine} [staged] ${marker.itemId} ${marker.markerText}\n`);
      } else {
        out.write(`  ${marker.file}:${marker.line}/${marker.instructionLine} ${marker.itemId} ${marker.markerText}\n`);
      }
    }
    if (!sessionRecords.length && sessionMarkers.length) out.write('  receipt: missing\n');
  }
  if (!sessions.length) out.write('No Chisel sessions or markers found.\n');
  return { sessions, markers, records };
}

function parseAllMarkersInFile(target, relFile) {
  const filePath = path.join(target, relFile);
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const markers = [];
  for (let i = 0; i < lines.length; i++) {
    const marker = parseMarkerBlock(lines, i, relFile);
    if (marker) {
      markers.push(marker);
      if (marker.format === 'two-line') i += 1;
      continue;
    }
    const staged = parseStageMarkerBlock(lines, i, relFile);
    if (staged) {
      markers.push(staged);
      i = staged.stageEndLine - 1;
    }
  }
  return markers;
}

function isMarkerCommentLine(line) {
  const content = parseStandaloneCommentContent(line);
  if (!content) return false;
  return /^CHISEL:[^\s]+\s+item-\d+$/.test(content)
    || /^CHISEL-STAGE:[^\s]+\s+item-\d+\s+(begin|end)$/.test(content)
    || /^TODO:\s+.+$/.test(content)
    || /^TODO\(chisel:item-\d+\)\s+CHISEL:[^\s<>)]+/.test(content);
}

function stageBodyLinesForMarker(lines, marker, relFile) {
  const body = lines.slice(marker.stageBodyStart - 1, marker.stageBodyEnd);
  const lineToken = stageBodyLinePrefix(relFile);
  if (lineToken) {
    return body.map((line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith(lineToken)) {
        throw new Error(`cannot unstage: expected ${lineToken} line comments in ${marker.file}:${marker.stageBeginLine}`);
      }
      if (trimmed === lineToken) return '';
      const prefix = `${lineToken} `;
      const lineStart = line.indexOf(trimmed);
      const content = trimmed.startsWith(prefix) ? trimmed.slice(prefix.length) : trimmed.slice(lineToken.length);
      return line.slice(0, lineStart) + content;
    });
  }
  const blockToken = stageBodyBlockToken(relFile);
  if (blockToken) {
    if (body.length < 2) throw new Error(`cannot unstage: missing wrapped staged body in ${marker.file}:${marker.stageBeginLine}`);
    if (body[0].trim() !== blockToken.open || body[body.length - 1].trim() !== blockToken.close) {
      throw new Error(`cannot unstage: expected ${blockToken.open} ... ${blockToken.close} wrapper in ${marker.file}:${marker.stageBeginLine}`);
    }
    return body.slice(1, -1);
  }
  throw new Error(`cannot unstage: unsupported file type for ${marker.file}`);
}

function renderStagedBody(relFile, originalLines) {
  const lineToken = stageBodyLinePrefix(relFile);
  if (lineToken) {
    return originalLines.map((line) => (line.length ? `${lineToken} ${line}` : lineToken));
  }
  const blockToken = stageBodyBlockToken(relFile);
  if (blockToken) {
    const joined = originalLines.join('\n');
    if (joined.includes(blockToken.open) || joined.includes(blockToken.close)) {
      return { error: 'cannot stage: contains nested comment' };
    }
    return [blockToken.open, ...originalLines, blockToken.close];
  }
  return { error: 'cannot stage: unsupported file type' };
}

function buildVerifiedViewFromLines(lines, relFile) {
  const normalized = [];
  for (let i = 0; i < lines.length; i++) {
    const marker = parseMarkerBlock(lines, i, relFile);
    if (marker) {
      if (marker.format === 'two-line') i += 1;
      continue;
    }
    const staged = parseStageMarkerBlock(lines, i, relFile);
    if (staged) {
      normalized.push(...stageBodyLinesForMarker(lines, staged, relFile));
      i = staged.stageEndLine - 1;
      continue;
    }
    normalized.push(lines[i]);
  }
  return normalized;
}

function buildVerifiedView(text, relFile) {
  return buildVerifiedViewFromLines(text.split(/\r?\n/), relFile).join('\n');
}

function readHeadFile(target, relFile) {
  try {
    return childProcess.execFileSync('git', ['show', `HEAD:${relFile}`], {
      cwd: target,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    if (typeof err.stderr === 'string' && /exists on disk, but not in 'HEAD'|path .* does not exist in 'HEAD'|fatal: Path/.test(err.stderr)) {
      return '';
    }
    if (typeof err.stdout === 'string' && err.stdout.length) return err.stdout;
    return '';
  }
}

function parseRawDiffRanges(diffText) {
  const ranges = new Map();
  let currentFile = null;
  let oldLine = 0;
  let newLine = 0;
  for (const line of diffText.split(/\r?\n/)) {
    if (line.startsWith('+++ ')) {
      const raw = line.slice(4).trim();
      currentFile = raw === '/dev/null' ? null : raw.replace(/^b\//, '');
      if (currentFile && !ranges.has(currentFile)) ranges.set(currentFile, []);
      continue;
    }
    if (line.startsWith('@@ ')) {
      const match = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLine = Number(match[1]);
        newLine = Number(match[2]);
      }
      continue;
    }
    if (!currentFile || !line.length) continue;
    if (line.startsWith('diff --git ') || line.startsWith('index ') || line.startsWith('--- ') || line.startsWith('\\ No newline at end of file')) continue;
    if (line.startsWith('+')) {
      ranges.get(currentFile).push(newLine);
      newLine += 1;
      continue;
    }
    if (line.startsWith('-')) {
      ranges.get(currentFile).push(oldLine);
      oldLine += 1;
      continue;
    }
    if (line.startsWith(' ')) {
      oldLine += 1;
      newLine += 1;
    }
  }
  return ranges;
}

function parseUnifiedDiff(diffText) {
  const files = new Map();
  let currentFile = null;
  let oldLine = 0;
  let newLine = 0;

  for (const line of diffText.split(/\r?\n/)) {
    if (line.startsWith('+++ ')) {
      const raw = line.slice(4).trim();
      if (raw === '/dev/null') {
        currentFile = null;
        continue;
      }
      currentFile = raw.replace(/^b\//, '');
      if (!files.has(currentFile)) files.set(currentFile, []);
      continue;
    }
    if (line.startsWith('@@ ')) {
      const match = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLine = Number(match[1]);
        newLine = Number(match[2]);
      }
      continue;
    }
    if (!currentFile || !line.length) continue;
    if (line.startsWith('diff --git ') || line.startsWith('index ') || line.startsWith('--- ')) continue;
    if (line.startsWith('\\ No newline at end of file')) continue;
    if (line.startsWith('+')) {
      const text = line.slice(1);
      if (!isMarkerCommentLine(text)) {
        files.get(currentFile).push({ type: 'added', line: newLine, text });
      }
      newLine += 1;
      continue;
    }
    if (line.startsWith('-')) {
      const text = line.slice(1);
      if (!isMarkerCommentLine(text)) {
        files.get(currentFile).push({ type: 'removed', line: oldLine, text });
      }
      oldLine += 1;
      continue;
    }
    if (line.startsWith(' ')) {
      oldLine += 1;
      newLine += 1;
    }
  }

  return Array.from(files.entries())
    .map(([file, violations]) => ({ file, violations }))
    .filter((entry) => entry.violations.length > 0);
}

function gitDiffForFiles(target, files) {
  if (!files.length) return '';
  try {
    return childProcess.execFileSync('git', ['diff', '--', ...files], {
      cwd: target,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    if (typeof err.stdout === 'string') return err.stdout;
    if (Buffer.isBuffer(err.stdout)) return err.stdout.toString('utf8');
    throw err;
  }
}

function syntaxCheckFile(target, relFile) {
  const ext = path.extname(relFile).toLowerCase();
  const run = (command, args) => childProcess.spawnSync(command, args, {
    cwd: target,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
    const result = run('node', ['--check', relFile]);
    if (result.error) {
      return { file: relFile, status: 'skipped', message: 'skipped: node is unavailable for syntax check' };
    }
    if (result.status === 0) {
      return { file: relFile, status: 'pass', message: 'ok: node --check passed' };
    }
    if (ext === '.ts' || ext === '.tsx') {
      return { file: relFile, status: 'skipped', message: 'skipped: needs tsc' };
    }
    if (ext === '.jsx') {
      return { file: relFile, status: 'skipped', message: 'skipped: needs a JSX-aware parser' };
    }
    return {
      file: relFile,
      status: 'fail',
      message: cleanProcessMessage(result.stderr || result.stdout || 'node --check failed'),
    };
  }

  if (ext === '.py') {
    const result = run('python3', ['-m', 'py_compile', relFile]);
    if (result.error) {
      return { file: relFile, status: 'skipped', message: 'skipped: python3 is unavailable for syntax check' };
    }
    if (result.status === 0) {
      return { file: relFile, status: 'pass', message: 'ok: python3 -m py_compile passed' };
    }
    return {
      file: relFile,
      status: 'fail',
      message: cleanProcessMessage(result.stderr || result.stdout || 'python3 -m py_compile failed'),
    };
  }

  return { file: relFile, status: 'skipped', message: 'skipped: no syntax check available for this file type' };
}

function cleanProcessMessage(message) {
  return String(message)
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' | ');
}

function collapseViolationRange(violations) {
  const lines = violations.map((violation) => violation.line).sort((a, b) => a - b);
  if (!lines.length) return 'unknown location';
  return lines[0] === lines[lines.length - 1]
    ? `line ${lines[0]}`
    : `lines ${lines[0]}-${lines[lines.length - 1]}`;
}

function updateVerificationReceipt(target, sessionId, verification) {
  const receiptPath = path.join(target, '.chisel', `${sessionId}.json`);
  if (!fs.existsSync(receiptPath)) return false;
  const record = readJsonRecord(receiptPath);
  if (!record || record.parseError) return false;
  record.verification = verification;
  fs.writeFileSync(receiptPath, JSON.stringify(record, null, 2) + '\n', 'utf8');
  return true;
}

function verifyManifestSession(opts, manifest, out = process.stdout) {
  const sessionId = manifest.slug;
  const filesTouched = Array.from(new Set(manifest.items.map((item) => item.file))).sort();
  const sessionMarkers = scanMarkers(opts.target, sessionId);
  const itemIds = new Set();
  const duplicateItems = [];
  for (const marker of sessionMarkers.filter((entry) => entry.type !== 'staged')) {
    if (itemIds.has(marker.itemId) && !duplicateItems.includes(marker.itemId)) duplicateItems.push(marker.itemId);
    itemIds.add(marker.itemId);
  }

  const recordedIds = new Set(manifest.items.map((item) => item.itemId));
  const unrecordedMarkers = sessionMarkers
    .filter((marker) => marker.type !== 'staged' && !recordedIds.has(marker.itemId))
    .map((marker) => ({ file: marker.file, violations: [{ line: marker.line }] }));
  const missingMarkers = [];
  for (const item of manifest.items) {
    const filePath = path.join(opts.target, item.file);
    const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
    if (!item.markerBlock || !current.includes(item.markerBlock)) {
      missingMarkers.push(item);
    }
  }

  let nonMarkerChanges = [];
  if (isGitRepo(opts.target)) {
    const cachedDiff = gitCachedDiffForFiles(opts.target, filesTouched);
    nonMarkerChanges = parseUnifiedDiff(cachedDiff);
  } else {
    nonMarkerChanges = [];
  }
  nonMarkerChanges.push(...unrecordedMarkers);

  const syntaxChecks = filesTouched.map((file) => syntaxCheckFile(opts.target, file));
  const syntaxFailures = syntaxChecks.filter((check) => check.status === 'fail');
  const sessionVariants = sessionMarkers.length ? [sessionId] : [];
  const pass = manifest.items.length > 0
    && missingMarkers.length === 0
    && duplicateItems.length === 0
    && nonMarkerChanges.length === 0
    && syntaxFailures.length === 0;

  const verification = {
    verifiedAt: new Date().toISOString(),
    passed: pass,
    markerCount: sessionMarkers.length,
    filesTouched,
    duplicateItems,
    sessionVariants,
    nonMarkerChanges,
    syntaxChecks,
  };
  manifest.verification = verification;
  writeManifest(opts.target, manifest);

  out.write('Chisel verify\n');
  out.write(`target: ${opts.target}\n`);
  out.write(`session: ${sessionId}\n`);
  out.write(`markers: ${sessionMarkers.length}\n`);
  out.write(`files: ${filesTouched.length}\n`);
  out.write(`result: ${pass ? 'PASS' : 'FAIL'}\n\n`);

  if (missingMarkers.length) {
    out.write('Missing recorded markers:\n');
    for (const item of missingMarkers) out.write(`  ${item.file} ${item.itemId}: recorded marker block not found\n`);
  }
  if (duplicateItems.length) {
    out.write(`Duplicate item ids were found: ${duplicateItems.join(', ')}\n`);
  }
  if (nonMarkerChanges.length) {
    out.write('Non-marker changes:\n');
    for (const entry of nonMarkerChanges) {
      out.write(`  ${entry.file}: real code was added or removed outside recorded marker hunks near ${collapseViolationRange(entry.violations)}.\n`);
    }
  }

  out.write('Syntax checks:\n');
  for (const check of syntaxChecks) {
    out.write(`  ${check.status} ${check.file}: ${check.message}\n`);
  }
  if (!syntaxChecks.length) {
    out.write('  skipped: no touched files were found for syntax checks.\n');
  }
  out.write(`Receipt updated: .chisel/${sessionId}.json\n`);

  return {
    sessionId,
    pass,
    markers: sessionMarkers,
    duplicateItems,
    sessionVariants,
    nonMarkerChanges,
    syntaxChecks,
    receiptUpdated: true,
  };
}

function stageBlock(opts, out = process.stdout) {
  const relFile = opts.file;
  const filePath = path.join(opts.target, relFile);
  if (!fs.existsSync(filePath)) {
    return { ok: false, reason: `cannot stage: missing file ${relFile}` };
  }

  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split(/\r?\n/);
  const startIndex = opts.startLine - 1;
  const endIndex = opts.endLine - 1;
  if (startIndex < 0 || endIndex < startIndex || endIndex >= lines.length) {
    return { ok: false, reason: `cannot stage: invalid line range ${opts.startLine}-${opts.endLine}` };
  }

  const renderedBody = renderStagedBody(relFile, lines.slice(startIndex, endIndex + 1));
  if (renderedBody && renderedBody.error) {
    return { ok: false, reason: renderedBody.error };
  }

  const nextLines = [
    ...lines.slice(0, startIndex),
    formatStandaloneComment(relFile, `CHISEL:${opts.sessionId} ${opts.itemId}`),
    formatStandaloneComment(relFile, `TODO: ${opts.markerText}`),
    formatStandaloneComment(relFile, `CHISEL-STAGE:${opts.sessionId} ${opts.itemId} begin`),
    ...renderedBody,
    formatStandaloneComment(relFile, `CHISEL-STAGE:${opts.sessionId} ${opts.itemId} end`),
    ...lines.slice(endIndex + 1),
  ];

  if (opts.apply === false) {
    return {
      ok: true,
      staged: false,
      file: relFile,
      sessionId: opts.sessionId,
      itemId: opts.itemId,
      preview: nextLines.join('\n'),
    };
  }

  fs.writeFileSync(filePath, nextLines.join('\n'), 'utf8');
  const syntaxCheck = syntaxCheckFile(opts.target, relFile);
  if (syntaxCheck.status !== 'pass') {
    fs.writeFileSync(filePath, original, 'utf8');
    if (out) out.write(`stage refused ${relFile}: ${syntaxCheck.message}\n`);
    return { ok: false, reason: syntaxCheck.message, syntaxCheck };
  }

  return {
    ok: true,
    staged: true,
    file: relFile,
    sessionId: opts.sessionId,
    itemId: opts.itemId,
    syntaxCheck,
  };
}

function unstageBlock(opts) {
  const relFile = opts.file;
  const filePath = path.join(opts.target, relFile);
  if (!fs.existsSync(filePath)) {
    return { ok: false, reason: `cannot unstage: missing file ${relFile}` };
  }
  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split(/\r?\n/);
  const restored = [];
  const changes = [];

  for (let i = 0; i < lines.length; i++) {
    const staged = parseStageMarkerBlock(lines, i, relFile);
    if (
      staged
      && (!opts.sessionId || staged.sessionId === opts.sessionId)
      && (!opts.itemId || staged.itemId === opts.itemId)
    ) {
      const pairedMarker = i >= 2 ? parseMarkerBlock(lines, i - 2, relFile) : null;
      if (
        pairedMarker
        && pairedMarker.sessionId === staged.sessionId
        && pairedMarker.itemId === staged.itemId
        && pairedMarker.format === 'two-line'
      ) {
        restored.splice(-2, 2);
      }
      restored.push(...stageBodyLinesForMarker(lines, staged, relFile));
      changes.push({
        file: relFile,
        sessionId: staged.sessionId,
        itemId: staged.itemId,
        beginLine: staged.stageBeginLine,
        endLine: staged.stageEndLine,
      });
      i = staged.stageEndLine - 1;
      continue;
    }
    restored.push(lines[i]);
  }

  if (opts.apply !== false && changes.length) {
    fs.writeFileSync(filePath, restored.join('\n'), 'utf8');
  }

  return {
    ok: true,
    file: relFile,
    changes,
    content: restored.join('\n'),
  };
}

function verifySession(opts, out = process.stdout) {
  const sessionId = resolveSessionId(opts, out, 'verify');
  if (!sessionId) {
    return {
      sessionId: null,
      pass: false,
      markers: [],
      duplicateItems: [],
      sessionVariants: [],
      nonMarkerChanges: [],
      syntaxChecks: [],
      receiptUpdated: false,
    };
  }
  const manifest = readManifest(opts.target, sessionId);
  if (manifest && manifest.items.some((item) => item.diffHunk)) {
    return verifyManifestSession(opts, manifest, out);
  }

  const sessionMarkers = scanMarkers(opts.target, sessionId);
  const filesTouched = Array.from(new Set(sessionMarkers.map((marker) => marker.file))).sort();
  const sessionPrefix = sessionId.includes('-') ? sessionId.split('-')[0] : sessionId;
  const familyMarkers = [];
  const sessionVariants = new Set();
  for (const file of filesTouched) {
    for (const marker of parseAllMarkersInFile(opts.target, file)) {
      if (marker.sessionId === sessionId) {
        sessionVariants.add(marker.sessionId);
        familyMarkers.push(marker);
        continue;
      }
      if (sessionPrefix && marker.sessionId.startsWith(`${sessionPrefix}-`)) {
        sessionVariants.add(marker.sessionId);
        familyMarkers.push(marker);
      }
    }
  }
  if (sessionMarkers.length) sessionVariants.add(sessionId);

  const itemIds = new Set();
  const duplicateItems = [];
  for (const marker of (familyMarkers.length ? familyMarkers : sessionMarkers).filter((entry) => entry.type !== 'staged')) {
    if (itemIds.has(marker.itemId) && !duplicateItems.includes(marker.itemId)) duplicateItems.push(marker.itemId);
    itemIds.add(marker.itemId);
  }

  const nonMarkerChanges = [];
  if (fs.existsSync(path.join(opts.target, '.git')) && filesTouched.length) {
    const diff = gitDiffForFiles(opts.target, filesTouched);
    const ranges = parseRawDiffRanges(diff);
    for (const file of filesTouched) {
      const current = fs.readFileSync(path.join(opts.target, file), 'utf8');
      const head = readHeadFile(opts.target, file);
      const normalizedCurrent = buildVerifiedView(current, file);
      const normalizedHead = buildVerifiedView(head, file);
      if (normalizedCurrent !== normalizedHead) {
        const violations = (ranges.get(file) || []).map((line) => ({ line }));
        nonMarkerChanges.push({
          file,
          violations: violations.length ? violations : [{ line: 0 }],
        });
      }
    }
  }

  const syntaxChecks = filesTouched.map((file) => syntaxCheckFile(opts.target, file));
  const syntaxFailures = syntaxChecks.filter((check) => check.status === 'fail');
  const pass = sessionMarkers.length > 0
    && duplicateItems.length === 0
    && sessionVariants.size <= 1
    && nonMarkerChanges.length === 0
    && syntaxFailures.length === 0;

  const verification = {
    verifiedAt: new Date().toISOString(),
    passed: pass,
    markerCount: sessionMarkers.length,
    filesTouched,
    duplicateItems,
    sessionVariants: Array.from(sessionVariants).sort(),
    nonMarkerChanges: nonMarkerChanges.map((entry) => ({
      file: entry.file,
      violations: entry.violations,
    })),
    syntaxChecks,
  };
  const receiptUpdated = updateVerificationReceipt(opts.target, sessionId, verification);

  out.write('Chisel verify\n');
  out.write(`target: ${opts.target}\n`);
  out.write(`session: ${sessionId}\n`);
  out.write(`markers: ${sessionMarkers.length}\n`);
  out.write(`files: ${filesTouched.length}\n`);
  out.write(`result: ${pass ? 'PASS' : 'FAIL'}\n\n`);

  if (!sessionMarkers.length) {
    out.write('No active markers were found for this session. Nothing to audit.\n');
  }
  if (sessionVariants.size > 1) {
    out.write(`Mixed session id variants were found for this pass: ${Array.from(sessionVariants).sort().join(', ')}\n`);
  }
  if (duplicateItems.length) {
    out.write(`Duplicate item ids were found: ${duplicateItems.join(', ')}\n`);
  }
  if (nonMarkerChanges.length) {
    out.write('Non-marker changes:\n');
    for (const entry of nonMarkerChanges) {
      out.write(`  ${entry.file}: real code was added or removed outside marker comments near ${collapseViolationRange(entry.violations)}.\n`);
    }
  }

  out.write('Syntax checks:\n');
  for (const check of syntaxChecks) {
    out.write(`  ${check.status} ${check.file}: ${check.message}\n`);
  }
  if (!syntaxChecks.length) {
    out.write('  skipped: no touched files were found for syntax checks.\n');
  }
  if (receiptUpdated) {
    out.write(`Receipt updated: .chisel/${sessionId}.json\n`);
  } else {
    out.write('Receipt update skipped: no valid JSON receipt found.\n');
  }

  return {
    sessionId,
    pass,
    markers: sessionMarkers,
    duplicateItems,
    sessionVariants: Array.from(sessionVariants).sort(),
    nonMarkerChanges,
    syntaxChecks,
    receiptUpdated,
  };
}

function cleanupManifest(opts, manifest, out = process.stdout) {
  const changes = [];
  const refused = [];

  for (const item of manifest.items) {
    const filePath = path.join(opts.target, item.file);
    if (!fs.existsSync(filePath)) {
      refused.push({ file: item.file, itemId: item.itemId, reason: 'file is missing' });
      continue;
    }
    const original = fs.readFileSync(filePath, 'utf8');
    if (!item.markerBlock || !original.includes(item.markerBlock)) {
      refused.push({ file: item.file, itemId: item.itemId, reason: 'recorded marker block no longer matches the file' });
      continue;
    }
    const next = original.replace(item.markerBlock + '\n', '').replace(item.markerBlock, '');
    changes.push({
      file: item.file,
      itemId: item.itemId,
      diffHunk: item.diffHunk,
      content: next,
    });
  }

  out.write(`Chisel cleanup ${opts.apply ? 'apply' : 'dry-run'}\n`);
  out.write(`session: ${manifest.slug}\n`);
  out.write(`markers: ${changes.length}\n`);
  for (const change of changes) {
    out.write(`${change.file}\n`);
    out.write(`  reverse ${change.itemId}\n`);
  }
  if (refused.length) {
    out.write(`refused: ${refused.length}\n`);
    for (const item of refused) out.write(`  ${item.file} ${item.itemId}: ${item.reason}\n`);
  }
  if (!opts.apply) {
    out.write('Dry run only. Re-run with `--apply` to reverse recorded marker hunks.\n');
  } else if (!refused.length) {
    for (const change of changes) {
      fs.writeFileSync(path.join(opts.target, change.file), change.content, 'utf8');
      if (isGitRepo(opts.target)) gitResetFile(opts.target, change.file);
    }
    manifest.active = false;
    writeManifest(opts.target, manifest);
  }

  return {
    changes,
    refused,
    stagedActions: [],
    skippedInline: [],
  };
}

function cleanup(opts, out = process.stdout) {
  const sessionId = resolveSessionId(opts, out, 'cleanup');
  if (!sessionId) return { changes: [], stagedActions: [], skippedInline: [] };
  const manifest = readManifest(opts.target, sessionId);
  if (manifest && manifest.items.some((item) => item.diffHunk)) {
    return cleanupManifest(opts, manifest, out);
  }
  const markerNeedle = `CHISEL:${sessionId}`;
  const changes = [];
  const stagedActions = [];
  const skippedInline = [];
  for (const filePath of walkFiles(opts.target)) {
    const relFile = path.relative(opts.target, filePath).split(path.sep).join('/');
    const original = fs.readFileSync(filePath, 'utf8');
    const lines = original.split(/\r?\n/);
    const kept = [];
    const removed = [];
    for (let i = 0; i < lines.length; i++) {
      const staged = parseStageMarkerBlock(lines, i, relFile);
      if (staged && staged.sessionId === sessionId) {
        if (opts.discardStaged) {
          for (let lineNumber = staged.stageBeginLine; lineNumber <= staged.stageEndLine; lineNumber++) {
            removed.push({ line: lineNumber, text: lines[lineNumber - 1].trim() });
          }
          stagedActions.push({ file: relFile, itemId: staged.itemId, action: 'discarded' });
          i = staged.stageEndLine - 1;
          continue;
        }
        const restoredLines = stageBodyLinesForMarker(lines, staged, relFile);
        stagedActions.push({ file: relFile, itemId: staged.itemId, action: 'unstaged' });
        kept.push(...restoredLines);
        i = staged.stageEndLine - 1;
        continue;
      }
      const marker = parseMarkerBlock(lines, i, relFile);
      if (marker && marker.sessionId === sessionId) {
        if (marker.format === 'two-line') {
          const trackingStandalone = isStandaloneMarkerLine(lines[i]);
          const instructionStandalone = isStandaloneMarkerLine(lines[i + 1] || '');
          if (trackingStandalone && instructionStandalone) {
            removed.push({ line: i + 1, text: lines[i].trim() });
            removed.push({ line: i + 2, text: (lines[i + 1] || '').trim() });
            i += 1;
            continue;
          }
          skippedInline.push({ file: relFile, line: i + 1, text: lines[i].trim() });
          if (typeof lines[i + 1] === 'string') {
            skippedInline.push({ file: relFile, line: i + 2, text: lines[i + 1].trim() });
            kept.push(lines[i], lines[i + 1]);
            i += 1;
            continue;
          }
          kept.push(lines[i]);
          continue;
        }
        if (isStandaloneMarkerLine(lines[i])) {
          removed.push({ line: i + 1, text: lines[i].trim() });
          continue;
        }
        skippedInline.push({ file: relFile, line: i + 1, text: lines[i].trim() });
        kept.push(lines[i]);
        continue;
      }
      if (lines[i].includes(markerNeedle)) {
        skippedInline.push({ file: relFile, line: i + 1, text: lines[i].trim() });
        const nextContent = typeof lines[i + 1] === 'string'
          ? parseStandaloneCommentContent(lines[i + 1])
          : null;
        if (nextContent && /^TODO:\s+/.test(nextContent)) {
          skippedInline.push({ file: relFile, line: i + 2, text: lines[i + 1].trim() });
          kept.push(lines[i], lines[i + 1]);
          i += 1;
          continue;
        }
      }
      kept.push(lines[i]);
    }
    if (removed.length) {
      changes.push({ file: relFile, removed });
    }
    if ((removed.length || stagedActions.some((action) => action.file === relFile)) && opts.apply) {
      fs.writeFileSync(filePath, kept.join('\n'), 'utf8');
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
  if (stagedActions.length) {
    out.write(`staged-blocks: ${stagedActions.length}\n`);
    for (const action of stagedActions) {
      out.write(`  ${action.action} ${action.file} ${action.itemId}\n`);
    }
  }
  if (!changes.length && !stagedActions.length && !skippedInline.length) out.write('No matching markers found.\n');
  if (!opts.apply) out.write('Dry run only. Re-run with `--apply` to remove marker lines and unstage staged blocks.\n');
  return { changes, stagedActions, skippedInline };
}

function main(argv, out = process.stdout) {
  argv = argv[0] === '--' ? argv.slice(1) : argv;
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
  if (command === 'insert') {
    const opts = parseInsertArgs(rest);
    if (opts.help) {
      out.write(usage());
      return null;
    }
    const result = insertMarker(opts);
    if (!result.success) {
      out.write(`Chisel insert failed\n${result.error}\n`);
      return { failed: 1, ...result };
    }
    out.write(`Chisel insert ${result.itemId}\n`);
    if (result.warning) out.write(`warning: ${result.warning}\n`);
    out.write(result.diffHunk.trimEnd() + '\n');
    return result;
  }
  if (command === 'pass') {
    const opts = parsePassArgs(rest);
    if (opts.help) {
      out.write(usage());
      return null;
    }
    return setPassActive(opts, out);
  }
  if (command === 'scan') {
    const opts = parseScanArgs(rest);
    if (opts.help) {
      out.write(usage());
      return null;
    }
    return scanRepo(opts, out);
  }
  if (command === 'cleanup') {
    const opts = parseTargetArgs(rest);
    opts.sessionId = opts.rest[0];
    return cleanup(opts, out);
  }
  if (command === 'verify') {
    const opts = parseTargetArgs(rest);
    opts.sessionId = opts.rest[0];
    return verifySession(opts, out);
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

if (require.main === module) {
  try {
    const result = main(process.argv.slice(2));
    if (result && result.failed) process.exitCode = 1;
  } catch (err) {
    process.stderr.write((err && err.message ? err.message : String(err)) + '\n');
    process.exit(1);
  }
}

module.exports = {
  TARGETS,
  cleanup,
  doctor,
  fileStatus,
  generateSlug,
  install,
  insertMarker,
  isIgnoredPath,
  isStandaloneMarkerLine,
  main,
  parseMarkerBlock,
  parseMarkerLine,
  printProvider,
  readSessionRecords,
  scanMarkers,
  scanRepo,
  setPassActive,
  stageBlock,
  status,
  unstageBlock,
  verifySession,
  usage,
  walkFiles,
};
