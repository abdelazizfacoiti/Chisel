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

test('parseMarkerLine extracts item, session, file, line, and marker text', () => {
  const marker = parseMarkerLine(
    '// TODO(chisel:item-2) CHISEL:20260704-a1b2 Add email validation before submit.',
    42,
    'src/form.ts',
  );

  assert.equal(marker.itemId, 'item-2');
  assert.equal(marker.sessionId, '20260704-a1b2');
  assert.equal(marker.file, 'src/form.ts');
  assert.equal(marker.line, 42);
  assert.equal(marker.markerText, 'Add email validation before submit.');
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
    '  // TODO(chisel:item-1) CHISEL:test-session Add validation guard.',
    '}',
  ].join('\n'));
  writeFile(repo, 'node_modules/pkg/index.js', '// TODO(chisel:item-2) CHISEL:test-session Ignore this.');

  const markers = scanMarkers(repo, 'test-session');

  assert.equal(markers.length, 1);
  assert.equal(markers[0].file, 'src/form.ts');
  assert.equal(markers[0].line, 2);
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
  writeFile(repo, 'src/form.ts', '// TODO(chisel:item-1) CHISEL:test-session Add validation guard.\n');
  const out = outputBuffer();

  const result = status({ target: repo, sessionId: 'test-session' }, out.stream);

  assert.equal(result.sessions.length, 1);
  assert.equal(result.markers.length, 1);
  assert.match(out.read(), /receipt: \.chisel\/test-session\.json/);
  assert.match(out.read(), /src\/form\.ts:1 item-1 Add validation guard\./);
});

test('cleanup dry-run reports markers without editing files', () => {
  const repo = tempRepo();
  const file = writeFile(repo, 'src/form.ts', [
    '// TODO(chisel:item-1) CHISEL:test-session Add validation guard.',
    'const keep = true;',
  ].join('\n'));
  const out = outputBuffer();

  const changes = cleanup({ target: repo, sessionId: 'test-session', apply: false }, out.stream);

  assert.equal(changes.length, 1);
  assert.match(out.read(), /Dry run only/);
  assert.match(fs.readFileSync(file, 'utf8'), /CHISEL:test-session/);
});

test('cleanup apply removes only exact session marker lines', () => {
  const repo = tempRepo();
  const file = writeFile(repo, 'src/form.ts', [
    '// TODO(chisel:item-1) CHISEL:test-session Add validation guard.',
    '// TODO(chisel:item-1) CHISEL:other-session Keep other marker.',
    'const keep = true;',
  ].join('\n'));
  const out = outputBuffer();

  cleanup({ target: repo, sessionId: 'test-session', apply: true }, out.stream);
  const content = fs.readFileSync(file, 'utf8');

  assert.doesNotMatch(content, /CHISEL:test-session/);
  assert.match(content, /CHISEL:other-session/);
  assert.match(content, /const keep = true/);
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
  assert.match(doctorOut.read(), /target: codex AGENTS\.md stale/);
  assert.equal(result.failed > 0, true);
});
