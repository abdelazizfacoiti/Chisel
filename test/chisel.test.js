'use strict';

const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
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
  stageBlock,
  status,
  unstageBlock,
  verifySession,
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

function run(command, args, cwd) {
  return childProcess.execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function initGitRepo(root) {
  run('git', ['init'], root);
  run('git', ['config', 'user.name', 'Chisel Test'], root);
  run('git', ['config', 'user.email', 'chisel@example.com'], root);
}

function commitAll(root, message) {
  run('git', ['add', '.'], root);
  run('git', ['commit', '-m', message], root);
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
    '  // CHISEL-STAGE:test-session item-1 begin',
    '  //   return true;',
    '  // CHISEL-STAGE:test-session item-1 end',
    '}',
  ].join('\n'));
  writeFile(repo, 'node_modules/pkg/index.js', [
    '// CHISEL:test-session item-2',
    '// TODO: Ignore this.',
  ].join('\n'));

  const markers = scanMarkers(repo, 'test-session');

  assert.equal(markers.length, 2);
  assert.equal(markers[0].file, 'src/form.ts');
  assert.equal(markers[0].line, 2);
  assert.equal(markers[0].instructionLine, 3);
  assert.equal(markers[0].itemId, 'item-1');
  assert.equal(markers[1].type, 'staged');
  assert.equal(markers[1].stageBeginLine, 4);
  assert.equal(markers[1].stageEndLine, 6);
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

test('status with no session id auto-selects the only session', () => {
  const repo = tempRepo();
  writeFile(repo, '.chisel/20260704153000-a1b2c3.json', JSON.stringify({
    sessionId: '20260704153000-a1b2c3',
    task: 'add validation',
    filesTouched: ['src/form.ts'],
  }, null, 2));
  writeFile(repo, 'src/form.ts', [
    '// CHISEL:20260704153000-a1b2c3 item-1',
    '// TODO: Add validation guard.',
  ].join('\n'));
  const out = outputBuffer();

  const result = status({ target: repo }, out.stream);

  assert.deepEqual(result.sessions, ['20260704153000-a1b2c3']);
  assert.match(out.read(), /no session id given, using latest: 20260704153000-a1b2c3/);
  assert.match(out.read(), /Chisel status/);
  assert.match(out.read(), /session: 20260704153000-a1b2c3/);
});

test('status with no session id lists multiple sessions and does not guess', () => {
  const repo = tempRepo();
  writeFile(repo, '.chisel/20260704153000-a1b2c3.json', JSON.stringify({
    sessionId: '20260704153000-a1b2c3',
    task: 'add validation',
    filesTouched: ['src/form.ts'],
  }, null, 2));
  writeFile(repo, '.chisel/20260705140000-z9y8x7.json', JSON.stringify({
    sessionId: '20260705140000-z9y8x7',
    task: 'tweak checkout',
    filesTouched: ['src/cart.ts', 'src/cart-view.tsx'],
  }, null, 2));
  const out = outputBuffer();

  const result = status({ target: repo }, out.stream);

  assert.deepEqual(result.sessions, ['20260705140000-z9y8x7', '20260704153000-a1b2c3']);
  assert.match(out.read(), /Multiple Chisel sessions found in this repo\. Pass one explicitly:/);
  assert.match(out.read(), /20260705140000-z9y8x7  tweak checkout  2 files/);
  assert.match(out.read(), /20260704153000-a1b2c3  add validation  1 file/);
  assert.doesNotMatch(out.read(), /Chisel status/);
});

test('status with no session id and no sessions prints a clear message', () => {
  const repo = tempRepo();
  const out = outputBuffer();

  const result = status({ target: repo }, out.stream);

  assert.deepEqual(result.sessions, []);
  assert.match(out.read(), /No Chisel sessions found in this repo\./);
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

test('cleanup with no session id auto-selects the only session', () => {
  const repo = tempRepo();
  writeFile(repo, '.chisel/20260704153000-a1b2c3.json', JSON.stringify({
    sessionId: '20260704153000-a1b2c3',
    task: 'add validation',
  }, null, 2));
  const file = writeFile(repo, 'src/form.ts', [
    '// CHISEL:20260704153000-a1b2c3 item-1',
    '// TODO: Add validation guard.',
  ].join('\n'));
  const out = outputBuffer();

  const result = cleanup({ target: repo, apply: false }, out.stream);

  assert.equal(result.changes.length, 1);
  assert.match(out.read(), /no session id given, using latest: 20260704153000-a1b2c3/);
  assert.match(out.read(), /session: 20260704153000-a1b2c3/);
  assert.match(fs.readFileSync(file, 'utf8'), /CHISEL:20260704153000-a1b2c3/);
});

test('cleanup with no session id lists multiple sessions and does not guess', () => {
  const repo = tempRepo();
  writeFile(repo, '.chisel/20260704153000-a1b2c3.json', JSON.stringify({
    sessionId: '20260704153000-a1b2c3',
    task: 'add validation',
    filesTouched: ['src/form.ts'],
  }, null, 2));
  writeFile(repo, '.chisel/20260705140000-z9y8x7.json', JSON.stringify({
    sessionId: '20260705140000-z9y8x7',
    task: 'tweak checkout',
    filesTouched: ['src/cart.ts', 'src/cart-view.tsx'],
  }, null, 2));
  const out = outputBuffer();

  const result = cleanup({ target: repo, apply: false }, out.stream);

  assert.equal(result.changes.length, 0);
  assert.match(out.read(), /Multiple Chisel sessions found in this repo\. Pass one explicitly:/);
  assert.match(out.read(), /Run `chisel cleanup <session-id>`\./);
});

test('cleanup with no session id and no sessions prints a clear message', () => {
  const repo = tempRepo();
  const out = outputBuffer();

  const result = cleanup({ target: repo, apply: false }, out.stream);

  assert.equal(result.changes.length, 0);
  assert.match(out.read(), /No Chisel sessions found in this repo\./);
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
  assert.equal(fs.existsSync(path.join(repo, '.codex/prompts/chisel.md')), true);
  assert.equal(fs.existsSync(path.join(repo, '.codex-plugin/plugin.json')), true);
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
  assert.equal(fs.existsSync(path.join(repo, '.codex/prompts/chisel.md')), true);
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

test('verify passes for a clean markers-only session', () => {
  const repo = tempRepo();
  initGitRepo(repo);
  writeFile(repo, 'src/form.js', [
    'function submit() {',
    '  return true;',
    '}',
  ].join('\n'));
  writeFile(repo, '.chisel/20260704153000-a1b2c3.json', JSON.stringify({
    sessionId: '20260704153000-a1b2c3',
    task: 'add validation',
  }, null, 2));
  commitAll(repo, 'baseline');

  writeFile(repo, 'src/form.js', [
    'function submit() {',
    '  // CHISEL:20260704153000-a1b2c3 item-1',
    '  // TODO: Add email validation before submit.',
    '  return true;',
    '}',
  ].join('\n'));

  const out = outputBuffer();
  const result = verifySession({ target: repo, sessionId: '20260704153000-a1b2c3' }, out.stream);
  const receipt = JSON.parse(fs.readFileSync(path.join(repo, '.chisel/20260704153000-a1b2c3.json'), 'utf8'));

  assert.equal(result.pass, true);
  assert.equal(result.nonMarkerChanges.length, 0);
  assert.match(out.read(), /result: PASS/);
  assert.equal(receipt.verification.passed, true);
});

test('verify with no session id auto-selects the only session', () => {
  const repo = tempRepo();
  initGitRepo(repo);
  writeFile(repo, 'src/form.js', [
    'function submit() {',
    '  return true;',
    '}',
  ].join('\n'));
  writeFile(repo, '.chisel/20260704153000-a1b2c3.json', JSON.stringify({
    sessionId: '20260704153000-a1b2c3',
    task: 'add validation',
  }, null, 2));
  commitAll(repo, 'baseline');

  writeFile(repo, 'src/form.js', [
    'function submit() {',
    '  // CHISEL:20260704153000-a1b2c3 item-1',
    '  // TODO: Add email validation before submit.',
    '  return true;',
    '}',
  ].join('\n'));
  const out = outputBuffer();

  const result = verifySession({ target: repo }, out.stream);

  assert.equal(result.pass, true);
  assert.match(out.read(), /no session id given, using latest: 20260704153000-a1b2c3/);
  assert.match(out.read(), /session: 20260704153000-a1b2c3/);
  assert.match(out.read(), /result: PASS/);
});

test('verify with no session id lists multiple sessions and does not guess', () => {
  const repo = tempRepo();
  writeFile(repo, '.chisel/20260704153000-a1b2c3.json', JSON.stringify({
    sessionId: '20260704153000-a1b2c3',
    task: 'add validation',
    filesTouched: ['src/form.ts'],
  }, null, 2));
  writeFile(repo, '.chisel/20260705140000-z9y8x7.json', JSON.stringify({
    sessionId: '20260705140000-z9y8x7',
    task: 'tweak checkout',
    filesTouched: ['src/cart.ts', 'src/cart-view.tsx'],
  }, null, 2));
  const out = outputBuffer();

  const result = verifySession({ target: repo }, out.stream);

  assert.equal(result.pass, false);
  assert.match(out.read(), /Multiple Chisel sessions found in this repo\. Pass one explicitly:/);
  assert.match(out.read(), /Run `chisel verify <session-id>`\./);
});

test('verify with no session id and no sessions prints a clear message', () => {
  const repo = tempRepo();
  const out = outputBuffer();

  const result = verifySession({ target: repo }, out.stream);

  assert.equal(result.pass, false);
  assert.match(out.read(), /No Chisel sessions found in this repo\./);
});

test('stageBlock stages a JS block and verify accepts staged-only changes', () => {
  const repo = tempRepo();
  initGitRepo(repo);
  writeFile(repo, '.chisel/20260705120000-a1b2c3.json', JSON.stringify({
    sessionId: '20260705120000-a1b2c3',
    task: 'replace old submit logic',
  }, null, 2));
  writeFile(repo, 'src/form.js', [
    'function submit() {',
    '  return true;',
    '}',
  ].join('\n'));
  commitAll(repo, 'baseline');

  const stageOut = outputBuffer();
  const staged = stageBlock({
    target: repo,
    file: 'src/form.js',
    startLine: 2,
    endLine: 2,
    sessionId: '20260705120000-a1b2c3',
    itemId: 'item-1',
    markerText: 'Replace old submit logic with validation-aware flow.',
  }, stageOut.stream);
  const content = fs.readFileSync(path.join(repo, 'src/form.js'), 'utf8');
  const verifyOut = outputBuffer();
  const result = verifySession({ target: repo, sessionId: '20260705120000-a1b2c3' }, verifyOut.stream);

  assert.equal(staged.ok, true);
  assert.match(content, /\/\/ CHISEL:20260705120000-a1b2c3 item-1/);
  assert.match(content, /\/\/ CHISEL-STAGE:20260705120000-a1b2c3 item-1 begin/);
  assert.match(content, /\/\/   return true;/);
  assert.equal(result.pass, true);
  assert.match(verifyOut.read(), /result: PASS/);
});

test('stageBlock refuses nested block comments in block-comment-only files', () => {
  const repo = tempRepo();
  writeFile(repo, 'src/styles.css', [
    '.card {',
    '  color: red;',
    '  /* nested */',
    '}',
  ].join('\n'));

  const result = stageBlock({
    target: repo,
    file: 'src/styles.css',
    startLine: 1,
    endLine: 4,
    sessionId: '20260705120000-a1b2c3',
    itemId: 'item-1',
    markerText: 'Replace legacy card styling.',
  });

  assert.equal(result.ok, false);
  assert.match(result.reason, /cannot stage: contains nested comment/);
});

test('unstageBlock restores original code exactly', () => {
  const repo = tempRepo();
  writeFile(repo, 'src/form.js', [
    'function submit() {',
    '  return true;',
    '}',
  ].join('\n'));
  const original = fs.readFileSync(path.join(repo, 'src/form.js'), 'utf8');

  const staged = stageBlock({
    target: repo,
    file: 'src/form.js',
    startLine: 2,
    endLine: 2,
    sessionId: '20260705120000-a1b2c3',
    itemId: 'item-1',
    markerText: 'Replace old submit logic with validation-aware flow.',
  });
  assert.equal(staged.ok, true);

  const unstaged = unstageBlock({
    target: repo,
    file: 'src/form.js',
    sessionId: '20260705120000-a1b2c3',
    itemId: 'item-1',
    apply: true,
  });

  assert.equal(unstaged.ok, true);
  assert.equal(fs.readFileSync(path.join(repo, 'src/form.js'), 'utf8'), original);
});

test('verify fails when real code changes slip in beside markers', () => {
  const repo = tempRepo();
  initGitRepo(repo);
  writeFile(repo, 'src/form.js', [
    'function submit() {',
    '  return true;',
    '}',
  ].join('\n'));
  commitAll(repo, 'baseline');

  writeFile(repo, 'src/form.js', [
    'function submit() {',
    '  // CHISEL:20260704153000-a1b2c3 item-1',
    '  // TODO: Add email validation before submit.',
    '  const valid = /@/.test(email);',
    '  return valid;',
    '}',
  ].join('\n'));

  const out = outputBuffer();
  const result = verifySession({ target: repo, sessionId: '20260704153000-a1b2c3' }, out.stream);

  assert.equal(result.pass, false);
  assert.equal(result.nonMarkerChanges.length, 1);
  assert.match(out.read(), /result: FAIL/);
  assert.match(out.read(), /real code was added or removed outside marker comments/);
});

test('verify ignores staged ranges but still catches violations outside them', () => {
  const repo = tempRepo();
  initGitRepo(repo);
  writeFile(repo, 'src/form.js', [
    'function submit() {',
    '  return true;',
    '}',
  ].join('\n'));
  commitAll(repo, 'baseline');

  const staged = stageBlock({
    target: repo,
    file: 'src/form.js',
    startLine: 2,
    endLine: 2,
    sessionId: '20260705120000-a1b2c3',
    itemId: 'item-1',
    markerText: 'Replace old submit logic with validation-aware flow.',
  });
  assert.equal(staged.ok, true);

  writeFile(repo, 'src/form.js', [
    'function submitLater() {',
    '  // CHISEL:20260705120000-a1b2c3 item-1',
    '  // TODO: Replace old submit logic with validation-aware flow.',
    '  // CHISEL-STAGE:20260705120000-a1b2c3 item-1 begin',
    '  //   return true;',
    '  // CHISEL-STAGE:20260705120000-a1b2c3 item-1 end',
    '}',
  ].join('\n'));

  const out = outputBuffer();
  const result = verifySession({ target: repo, sessionId: '20260705120000-a1b2c3' }, out.stream);

  assert.equal(result.pass, false);
  assert.equal(result.nonMarkerChanges.length, 1);
  assert.match(out.read(), /result: FAIL/);
  assert.match(out.read(), /real code was added or removed outside marker comments/);
});

test('cleanup unstages staged blocks by default and discards them when requested', () => {
  const repo = tempRepo();
  writeFile(repo, 'src/form.js', [
    'function submit() {',
    '  return true;',
    '}',
  ].join('\n'));

  const staged = stageBlock({
    target: repo,
    file: 'src/form.js',
    startLine: 2,
    endLine: 2,
    sessionId: '20260705120000-a1b2c3',
    itemId: 'item-1',
    markerText: 'Replace old submit logic with validation-aware flow.',
  });
  assert.equal(staged.ok, true);

  const out = outputBuffer();
  const result = cleanup({ target: repo, sessionId: '20260705120000-a1b2c3', apply: true }, out.stream);
  const restored = fs.readFileSync(path.join(repo, 'src/form.js'), 'utf8');

  assert.equal(result.stagedActions.length, 1);
  assert.match(out.read(), /unstaged src\/form\.js item-1/);
  assert.equal(restored, [
    'function submit() {',
    '  return true;',
    '}',
  ].join('\n'));

  const restaged = stageBlock({
    target: repo,
    file: 'src/form.js',
    startLine: 2,
    endLine: 2,
    sessionId: '20260705120000-a1b2c3',
    itemId: 'item-1',
    markerText: 'Replace old submit logic with validation-aware flow.',
  });
  assert.equal(restaged.ok, true);

  const discardOut = outputBuffer();
  cleanup({
    target: repo,
    sessionId: '20260705120000-a1b2c3',
    apply: true,
    discardStaged: true,
  }, discardOut.stream);
  const discarded = fs.readFileSync(path.join(repo, 'src/form.js'), 'utf8');

  assert.equal(discarded, [
    'function submit() {',
    '}',
  ].join('\n'));
  assert.match(discardOut.read(), /discarded src\/form\.js item-1/);
});

test('verify fails on duplicate item ids or mixed session id variants', () => {
  const repo = tempRepo();
  initGitRepo(repo);
  writeFile(repo, 'src/form.js', [
    'function submit() {',
    '  return true;',
    '}',
  ].join('\n'));
  commitAll(repo, 'baseline');

  writeFile(repo, 'src/form.js', [
    'function submit() {',
    '  // CHISEL:20260704153000-a1b2c3 item-1',
    '  // TODO: Add email validation before submit.',
    '  // CHISEL:20260704153000-z9y8x7 item-1',
    '  // TODO: Add duplicate marker with mixed session id.',
    '  return true;',
    '}',
  ].join('\n'));

  const out = outputBuffer();
  const result = verifySession({ target: repo, sessionId: '20260704153000-a1b2c3' }, out.stream);

  assert.equal(result.pass, false);
  assert.deepEqual(result.duplicateItems, ['item-1']);
  assert.deepEqual(result.sessionVariants, ['20260704153000-a1b2c3', '20260704153000-z9y8x7']);
  assert.match(out.read(), /Mixed session id variants were found/);
  assert.match(out.read(), /Duplicate item ids were found/);
});

test('verify fails when a touched file does not parse', () => {
  const repo = tempRepo();
  initGitRepo(repo);
  writeFile(repo, 'src/form.js', [
    'function submit() {',
    '  return true;',
    '}',
  ].join('\n'));
  commitAll(repo, 'baseline');

  writeFile(repo, 'src/form.js', [
    'function submit() {',
    '  // CHISEL:20260704153000-a1b2c3 item-1',
    '  // TODO: Add email validation before submit.',
    '  /*',
    '}',
  ].join('\n'));

  const out = outputBuffer();
  const result = verifySession({ target: repo, sessionId: '20260704153000-a1b2c3' }, out.stream);

  assert.equal(result.pass, false);
  assert.equal(result.syntaxChecks.some((check) => check.status === 'fail'), true);
  assert.match(out.read(), /result: FAIL/);
  assert.match(out.read(), /Syntax checks:/);
});

test('doctor hints when sessions have never been verified', () => {
  const repo = tempRepo();
  writeFile(repo, '.git/HEAD', 'ref: refs/heads/main\n');
  writeFile(repo, '.chisel/20260704153000-a1b2c3.json', JSON.stringify({
    sessionId: '20260704153000-a1b2c3',
    task: 'add validation',
  }, null, 2));
  const out = outputBuffer();

  const result = doctor({ target: repo, provider: 'codex' }, out.stream);

  assert.equal(result.unverifiedSessions.includes('20260704153000-a1b2c3'), true);
  assert.match(out.read(), /run `chisel verify 20260704153000-a1b2c3` to audit that marker pass/);
});
