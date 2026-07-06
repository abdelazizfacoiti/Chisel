#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function readStdin() {
  return fs.readFileSync(0, 'utf8');
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return null;
  }
}

function toolFile(input) {
  const toolInput = input.tool_input || {};
  return toolInput.file_path || toolInput.path || toolInput.file || null;
}

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }) + '\n');
}

function activeManifestTouches(projectDir, targetFile) {
  const chiselDir = path.join(projectDir, '.chisel');
  if (!fs.existsSync(chiselDir)) return false;
  const absoluteTarget = path.resolve(projectDir, targetFile);
  for (const entry of fs.readdirSync(chiselDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const manifest = readJson(path.join(chiselDir, entry.name));
    if (!manifest || manifest.active === false || !Array.isArray(manifest.items)) continue;
    for (const item of manifest.items) {
      if (!item || !item.file) continue;
      if (path.resolve(projectDir, item.file) === absoluteTarget) return true;
    }
  }
  return false;
}

function main() {
  const input = JSON.parse(readStdin() || '{}');
  if (!['Edit', 'Write', 'MultiEdit'].includes(input.tool_name)) return;
  const file = toolFile(input);
  if (!file) return;
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  if (activeManifestTouches(projectDir, file)) {
    deny('Chisel: direct edits to this file are blocked during an active pass. Use `chisel insert` to place markers.');
  }
}

main();
