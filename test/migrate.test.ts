import { describe, it, expect } from 'vitest';
import { migrate } from '../src/migrate/index.js';
import type { MigrateOptions } from '../src/migrate/index.js';
import type { MigrationRegistry } from '../src/migrate/registry.js';
import type { GovukOutputData } from '../src/index.js';
import { PLUGIN_VERSION } from '../src/version.js';

function makeSavedData(
  blocks: { type: string; data: Record<string, any> }[],
  overrides: Partial<GovukOutputData> = {}
): GovukOutputData {
  return {
    time: Date.now(),
    version: '2.30.0',
    blocks: blocks.map((b, i) => ({ id: String(i), ...b })),
    renderedHtml: '<stale>',
    pluginVersion: '0.1.0',
    ...overrides,
  };
}

describe('migrate()', () => {
  it('stamps current pluginVersion on output', () => {
    const input = makeSavedData([]);
    const result = migrate(input);
    expect(result.pluginVersion).toBe(PLUGIN_VERSION);
  });

  it('re-renders HTML even when version matches', () => {
    const input = makeSavedData(
      [{ type: 'heading', data: { text: 'Hello', level: 1 } }],
      { pluginVersion: PLUGIN_VERSION, renderedHtml: '<stale>' }
    );
    const result = migrate(input);
    expect(result.renderedHtml).toBe('<h1 class="govuk-heading-xl">Hello</h1>');
    expect(result.renderedHtml).not.toBe('<stale>');
  });

  it('preserves block data when no migrations are registered', () => {
    const blocks = [
      { type: 'paragraph', data: { text: 'Test paragraph', size: 'body' } },
    ];
    const input = makeSavedData(blocks, { pluginVersion: '0.0.1' });
    const result = migrate(input);
    expect(result.blocks[0].data).toEqual({ text: 'Test paragraph', size: 'body' });
  });

  it('is idempotent — calling twice produces the same result', () => {
    const input = makeSavedData([
      { type: 'heading', data: { text: 'Title', level: 2 } },
      { type: 'paragraph', data: { text: 'Body', size: 'body' } },
    ]);
    const first = migrate(input);
    const second = migrate(first);
    expect(second).toEqual(first);
  });

  it('handles data with no pluginVersion (pre-versioning)', () => {
    const input = makeSavedData(
      [{ type: 'paragraph', data: { text: 'Old data', size: 'body' } }],
      { pluginVersion: undefined as any }
    );
    const result = migrate(input);
    expect(result.pluginVersion).toBe(PLUGIN_VERSION);
    expect(result.renderedHtml).toContain('Old data');
  });

  it('renders multiple blocks correctly', () => {
    const input = makeSavedData([
      { type: 'heading', data: { text: 'Title', level: 1 } },
      { type: 'paragraph', data: { text: 'Body text', size: 'body' } },
    ]);
    const result = migrate(input);
    expect(result.renderedHtml).toContain('<h1 class="govuk-heading-xl">Title</h1>');
    expect(result.renderedHtml).toContain('<p class="govuk-body">Body text</p>');
  });
});

describe('block migrations', () => {
  // Fake scenario: warningText v0 → v1 renames iconFallbackText → assistiveText
  const fakeRegistry: MigrationRegistry = {
    warningText: [
      {
        fromMajor: 0,
        migrate: (data) => {
          const { iconFallbackText, ...rest } = data;
          return { ...rest, assistiveText: iconFallbackText ?? 'Warning' };
        },
      },
    ],
  };

  const v1Options: MigrateOptions = { registry: fakeRegistry, version: '1.0.0' };

  it('applies migration when major version differs', () => {
    const input = makeSavedData(
      [{ type: 'warningText', data: { text: 'Be careful', iconFallbackText: '!' } }],
      { pluginVersion: '0.1.0' }
    );
    const result = migrate(input, v1Options);
    expect(result.blocks[0].data).toEqual({ text: 'Be careful', assistiveText: '!' });
    expect(result.blocks[0].data).not.toHaveProperty('iconFallbackText');
    expect(result.pluginVersion).toBe('1.0.0');
  });

  it('skips migration for unaffected block types', () => {
    const input = makeSavedData(
      [
        { type: 'paragraph', data: { text: 'Hello', size: 'body' } },
        { type: 'warningText', data: { text: 'Warn', iconFallbackText: '!' } },
      ],
      { pluginVersion: '0.1.0' }
    );
    const result = migrate(input, v1Options);
    expect(result.blocks[0].data).toEqual({ text: 'Hello', size: 'body' });
    expect(result.blocks[1].data).toEqual({ text: 'Warn', assistiveText: '!' });
  });

  it('applies multi-step migration chain', () => {
    const chainRegistry: MigrationRegistry = {
      warningText: [
        {
          fromMajor: 0,
          migrate: (data) => {
            const { iconFallbackText, ...rest } = data;
            return { ...rest, assistiveText: iconFallbackText ?? 'Warning' };
          },
        },
        {
          fromMajor: 1,
          migrate: (data) => ({ ...data, severity: 'high' }),
        },
      ],
    };
    const input = makeSavedData(
      [{ type: 'warningText', data: { text: 'Warn', iconFallbackText: '!' } }],
      { pluginVersion: '0.1.0' }
    );
    const result = migrate(input, { registry: chainRegistry, version: '2.0.0' });
    expect(result.blocks[0].data).toEqual({
      text: 'Warn',
      assistiveText: '!',
      severity: 'high',
    });
  });

  it('skips migration when major version matches', () => {
    const input = makeSavedData(
      [{ type: 'warningText', data: { text: 'Warn', iconFallbackText: '!' } }],
      { pluginVersion: '1.2.3' }
    );
    const result = migrate(input, v1Options);
    expect(result.blocks[0].data).toEqual({ text: 'Warn', iconFallbackText: '!' });
  });

  it('is idempotent after migration', () => {
    const input = makeSavedData(
      [{ type: 'warningText', data: { text: 'Warn', iconFallbackText: '!' } }],
      { pluginVersion: '0.1.0' }
    );
    const first = migrate(input, v1Options);
    const second = migrate(first, v1Options);
    expect(second).toEqual(first);
  });
});

describe('GOV.UK Frontend v6 tag colour migration', () => {
  // Uses the real default registry; version 1.0.0 crosses the major boundary.
  const toV1: MigrateOptions = { version: '1.0.0' };

  it('renames deprecated standalone Tag colours (turquoise→teal, pink→magenta)', () => {
    const input = makeSavedData([
      { type: 'tag', data: { text: 'A', classes: 'govuk-tag--turquoise' } },
      { type: 'tag', data: { text: 'B', classes: 'govuk-tag--pink' } },
    ]);
    const result = migrate(input, toV1);
    expect(result.blocks[0].data.classes).toBe('govuk-tag--teal');
    expect(result.blocks[1].data.classes).toBe('govuk-tag--magenta');
    expect(result.renderedHtml).toContain('govuk-tag--teal');
    expect(result.renderedHtml).toContain('govuk-tag--magenta');
    expect(result.renderedHtml).not.toContain('govuk-tag--turquoise');
    expect(result.renderedHtml).not.toContain('govuk-tag--pink');
  });

  it('drops removed standalone Tag colours (blue, light-blue) back to the default', () => {
    const input = makeSavedData([
      { type: 'tag', data: { text: 'A', classes: 'govuk-tag--light-blue' } },
      { type: 'tag', data: { text: 'B', classes: 'govuk-tag--blue' } },
    ]);
    const result = migrate(input, toV1);
    expect(result.blocks[0].data.classes).toBe('');
    expect(result.blocks[1].data.classes).toBe('');
  });

  it('leaves already-valid colours and the default unchanged', () => {
    const input = makeSavedData([
      { type: 'tag', data: { text: 'A', classes: 'govuk-tag--green' } },
      { type: 'tag', data: { text: 'B', classes: '' } },
    ]);
    const result = migrate(input, toV1);
    expect(result.blocks[0].data.classes).toBe('govuk-tag--green');
    expect(result.blocks[1].data.classes).toBe('');
  });

  it('rewrites inline tag colours embedded in rich text', () => {
    const input = makeSavedData([
      {
        type: 'paragraph',
        data: {
          text:
            'See <strong class="govuk-tag govuk-tag--pink">NEW</strong> and ' +
            '<strong class="govuk-tag govuk-tag--light-blue">OLD</strong>.',
          size: 'body',
        },
      },
    ]);
    const result = migrate(input, toV1);
    expect(result.blocks[0].data.text).toContain(
      '<strong class="govuk-tag govuk-tag--magenta">NEW</strong>'
    );
    expect(result.blocks[0].data.text).toContain('<strong class="govuk-tag">OLD</strong>');
    expect(result.blocks[0].data.text).not.toContain('govuk-tag--pink');
    expect(result.blocks[0].data.text).not.toContain('light-blue');
  });

  it('only migrates across a major-version boundary', () => {
    const input = makeSavedData(
      [{ type: 'tag', data: { text: 'A', classes: 'govuk-tag--pink' } }],
      { pluginVersion: '1.0.0' } // already v1 → no block migration, re-render only
    );
    const result = migrate(input, toV1);
    expect(result.blocks[0].data.classes).toBe('govuk-tag--pink');
  });

  it('is idempotent', () => {
    const input = makeSavedData([
      { type: 'tag', data: { text: 'A', classes: 'govuk-tag--turquoise' } },
    ]);
    const first = migrate(input, toV1);
    const second = migrate(first, toV1);
    expect(second).toEqual(first);
  });
});
