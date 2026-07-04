'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  cleanup,
  doctor,
  isIgnoredPath,
  main,
  parseMarkerBlock,
  parseMarkerLine,
  scanMarkers,
  status,
} = require('../lib/chisel');

function tempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'chisel-test-'));
}

function writeFile(root, relPath, content) {
  const filePath = path.join(root, relPath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

function outputBuffer() {
  let output = '';
  return {
    stream: {
      write(chunk) {
        output += chunk;
      },
    },
    read() {
      return output;
    },
  };
}

test('parseMarkerBlock extracts item, session, tracking line, instruction line, and marker text', () => {
  const marker = parseMarkerBlock([
    '// CHISEL:20260704153000-a1b2c3 item-2',
    '// TODO: Add email validation before submit.',
  ], 0, 'src/form.ts');

  assert.equal(marker.itemId, 'item-2');
  assert.equal(marker.sessionId, '20260704153000-a1b2c3');
  assert.equal(marker.file, 'src/form.ts');
  assert.equal(marker.line, 1);
  assert.equal(marker.instructionLine, 2);
  assert.equal(marker.markerText, 'Add email validation before submit.');
});

test('parseMarkerLine still accepts the old single-line marker format', () => {
  const marker = parseMarkerLine(
    '// TODO(chisel:item-2) CHISEL:20260704153000-a1b2c3 Add email validation before submit.',
    42,
    'src/form.ts',
  );

  assert.equal(marker.itemId, 'item-2');
  assert.equal(marker.sessionId, '20260704153000-a1b2c3');
  assert.equal(marker.line, 42);
  assert.equal(marker.instructionLine, 42);
});

test('isIgnoredPath skips generated, vendor, build, binary, and lock-file paths', () => {
  assert.equal(isIgnoredPath('node_modules/pkg/index.js'), true);
  assert.equal(isIgnoredPath('.git/config'), true);
  assert.equal(isIgnoredPath('dist/app.js'), true);
  assert.equal(isIgnoredPath('src/package-lock.json'), true);
  assert.equal(isIgnoredPath('src/form.ts'), false);
});

test('scanMarkers returns active markers and skips ignored paths', () => {
  const repo = tempRepo();
  writeFile(repo, 'src/form.ts', [
    'function submit() {',
    '  // CHISEL:test-session item-1',
    '  // TODO: Add validation guard.',
    '}',
  ].join('\n'));
  writeFile(repo, 'node_modules/pkg/index.js', [
    '// CHISEL:test-session item-2',
    '// TODO: Ignore this.',
  ].join('\n'));

  const markers = scanMarkers(repo, 'test-session');

  assert.equal(markers.length, 1);
  assert.equal(markers[0].file, 'src/form.ts');
  assert.equal(markers[0].line, 2);
  assert.equal(markers[0].instructionLine, 3);
  assert.equal(markers[0].itemId, 'item-1');
});

test('status combines JSON receipts with marker scan fallback', () => {
  const repo = tempRepo();
  writeFile(repo, '.chisel/test-session.json', JSON.stringify({
    sessionId: 'test-session',
    createdAt: '2026-07-04T00:00:00.000Z',
    task: 'add validation',
    provider: 'codex',
    mode: 'plan-comments',
    plan: [],
    insertedComments: [],
    filesTouched: [],
    status: 'comments_inserted',
  }, null, 2));
  writeFile(repo, 'src/form.ts', [
    '// CHISEL:test-session item-1',
    '// TODO: Add validation guard.',
  ].join('\n'));
  const out = outputBuffer();

  const result = status({ target: repo, sessionId: 'test-session' }, out.stream);

  assert.equal(result.sessions.length, 1);
  assert.equal(result.markers.length, 1);
  assert.match(out.read(), /receipt: \.chisel\/test-session\.json/);
  assert.match(out.read(), /src\/form\.ts:1\/2 item-1 Add validation guard\./);
});

test('cleanup dry-run reports markers without editing files', () => {
  const repo = tempRepo();
  const file = writeFile(repo, 'src/form.ts', [
    '// CHISEL:20260704153000-a1b2c3 item-1',
    '// TODO: Add validation guard.',
    'const keep = true;',
  ].join('\n'));
  const out = outputBuffer();

  const result = cleanup({ target: repo, sessionId: '20260704153000-a1b2c3', apply: false }, out.stream);

  assert.equal(result.changes.length, 1);
  assert.equal(result.skippedInline.length, 0);
  assert.match(out.read(), /Dry run only/);
  assert.match(out.read(), /remove line 1: \/\/ CHISEL:20260704153000-a1b2c3 item-1/);
  assert.match(out.read(), /remove line 2: \/\/ TODO: Add validation guard\./);
  assert.match(fs.readFileSync(file, 'utf8'), /CHISEL:20260704153000-a1b2c3/);
});

test('cleanup removes both lines of a two-line marker and skips inline code markers', () => {
  const repo = tempRepo();
  const file = writeFile(repo, 'src/form.ts', [
    '// CHISEL:20260704153000-a1b2c3 item-1',
    '// TODO: Add validation guard.',
    'const keep = true; // CHISEL:20260704153000-a1b2c3 item-2',
    '// TODO: Do not delete inline marker.',
    '// CHISEL:20260704153000-z9y8x7 item-1',
    '// TODO: Keep other marker.',
    'const keep = true;',
  ].join('\n'));
  const out = outputBuffer();

  const result = cleanup({ target: repo, sessionId: '20260704153000-a1b2c3', apply: true }, out.stream);
  const content = fs.readFileSync(file, 'utf8');

  assert.equal(result.changes.length, 1);
  assert.equal(result.skippedInline.length, 2);
  assert.doesNotMatch(content, /^\/\/ CHISEL:20260704153000-a1b2c3 item-1/m);
  assert.doesNotMatch(content, /^\/\/ TODO: Add validation guard\./m);
  assert.match(content, /const keep = true; \/\/ CHISEL:20260704153000-a1b2c3 item-2/);
  assert.match(content, /^\/\/ TODO: Do not delete inline marker\.$/m);
  assert.match(content, /CHISEL:20260704153000-z9y8x7/);
  assert.match(content, /const keep = true/);
  assert.match(out.read(), /skipped-inline: 2/);
  assert.match(out.read(), /remove it manually/);
});

test('legacy installer command still installs Codex files', () => {
  const repo = tempRepo();
  const out = outputBuffer();

  main([
    '--only',
    'codex',
    '--target',
    repo,
  ], out.stream);

  assert.match(out.read(), /chisel codex/);
  assert.match(out.read(), /Chisel installed/);
  assert.equal(fs.existsSync(path.join(repo, 'AGENTS.md')), true);
  assert.equal(fs.existsSync(path.join(repo, '.codex/config.toml')), true);
  assert.equal(fs.existsSync(path.join(repo, '.agents/skills/chisel/SKILL.md')), true);
});

test('install subcommand supports the clearer v0.2 form', () => {
  const repo = tempRepo();
  const out = outputBuffer();

  main([
    'install',
    '--only',
    'codex',
    '--target',
    repo,
  ], out.stream);

  assert.match(out.read(), /chisel codex/);
  assert.equal(fs.existsSync(path.join(repo, 'AGENTS.md')), true);
});

test('installer reports stale files and provider doctor detects them', () => {
  const repo = tempRepo();
  const installOut = outputBuffer();
  const secondInstallOut = outputBuffer();
  const doctorOut = outputBuffer();

  main(['install', '--only', 'codex', '--target', repo], installOut.stream);
  fs.writeFileSync(path.join(repo, 'AGENTS.md'), 'local edits\n', 'utf8');

  main(['install', '--only', 'codex', '--target', repo], secondInstallOut.stream);
  const result = doctor({ target: repo, provider: 'codex' }, doctorOut.stream);

  assert.match(secondInstallOut.read(), /skipped-stale: AGENTS\.md/);
  assert.match(doctorOut.read(), /chisel installed version: 0\.2\.0/);
  assert.match(doctorOut.read(), /target: codex AGENTS\.md stale/);
  assert.equal(result.failed > 0, true);
});
