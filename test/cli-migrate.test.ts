import { describe, it, expect, vi } from 'vitest';
import { execFile } from 'node:child_process';
import { resolve } from 'node:path';

// Each test spawns a real `npx tsx` subprocess, which cold-starts a TypeScript
// compile. Under parallel test workers that can take several seconds, so allow
// well beyond Vitest's 5s default to avoid flaky timeouts on busy machines/CI.
vi.setConfig({ testTimeout: 30_000 });

const CLI_PATH = resolve(__dirname, '../src/cli/migrate.ts');

function runCli(stdin: string): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    const child = execFile('npx', ['tsx', CLI_PATH], (err, stdout, stderr) => {
      resolve({ stdout, stderr, code: child.exitCode });
    });
    child.stdin!.write(stdin);
    child.stdin!.end();
  });
}

describe('govuk-editorjs-migrate CLI', () => {
  it('migrates valid JSON and writes result to stdout', async () => {
    const input = JSON.stringify({
      time: Date.now(),
      version: '2.30.0',
      blocks: [{ id: '1', type: 'paragraph', data: { text: 'Hello', size: 'body' } }],
      renderedHtml: '<stale>',
      pluginVersion: '0.1.0',
    });

    const { stdout, stderr, code } = await runCli(input);
    expect(code).toBe(0);
    expect(stderr).toBe('');

    const result = JSON.parse(stdout);
    expect(result.renderedHtml).toContain('<p class="govuk-body">Hello</p>');
    expect(result.pluginVersion).toBeDefined();
    expect(result.blocks[0].data).toEqual({ text: 'Hello', size: 'body' });
  });

  it('outputs pretty-printed JSON', async () => {
    const input = JSON.stringify({
      time: Date.now(),
      version: '2.30.0',
      blocks: [],
      renderedHtml: '',
      pluginVersion: '0.1.0',
    });

    const { stdout } = await runCli(input);
    // Pretty-printed JSON has newlines and indentation
    expect(stdout).toContain('\n');
    expect(stdout).toMatch(/^ {2}"/m);
  });

  it('exits with code 1 on invalid JSON', async () => {
    const { stdout, stderr, code } = await runCli('not json');
    expect(code).toBe(1);
    expect(stderr).toContain('govuk-editorjs-migrate:');
    expect(stdout).toBe('');
  });

  it('exits with code 1 on empty input', async () => {
    const { code, stderr } = await runCli('');
    expect(code).toBe(1);
    expect(stderr).toContain('govuk-editorjs-migrate:');
  });

  it('handles multiple blocks', async () => {
    const input = JSON.stringify({
      time: Date.now(),
      version: '2.30.0',
      blocks: [
        { id: '1', type: 'heading', data: { text: 'Title', level: 1 } },
        { id: '2', type: 'paragraph', data: { text: 'Body', size: 'body' } },
      ],
      renderedHtml: '<stale>',
      pluginVersion: '0.1.0',
    });

    const { stdout, code } = await runCli(input);
    expect(code).toBe(0);

    const result = JSON.parse(stdout);
    expect(result.renderedHtml).toContain('<h1 class="govuk-heading-xl">Title</h1>');
    expect(result.renderedHtml).toContain('<p class="govuk-body">Body</p>');
  });
});
