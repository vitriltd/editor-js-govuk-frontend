#!/usr/bin/env node

/**
 * CLI adapter for the migrate function.
 *
 * Reads JSON from stdin, runs migrate(), writes result to stdout.
 *
 * Usage:
 *   echo '{"blocks":[...], "pluginVersion":"0.1.0", "renderedHtml":"..."}' | npx govuk-editorjs-migrate
 *   cat saved-data.json | npx govuk-editorjs-migrate > migrated.json
 */

import process from 'node:process';
import readline from 'node:readline';
import { migrate } from '../migrate/index.js';

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    const rl = readline.createInterface({ input: process.stdin });
    rl.on('line', (line) => chunks.push(line));
    rl.on('close', () => resolve(chunks.join('\n')));
    rl.on('error', reject);
  });
}

async function main() {
  try {
    const input = await readStdin();
    const data = JSON.parse(input);
    const result = migrate(data);
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`govuk-editorjs-migrate: ${message}\n`);
    process.exit(1);
  }
}

main();
