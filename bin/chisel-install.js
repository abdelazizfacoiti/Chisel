#!/usr/bin/env node
'use strict';

const { main } = require('../lib/chisel');

try {
  const result = main(process.argv.slice(2));
  if (result && result.failed) process.exitCode = 1;
} catch (err) {
  process.stderr.write((err && err.message ? err.message : String(err)) + '\n');
  process.exit(1);
}
