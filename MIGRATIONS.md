# Migration guide

When you upgrade `@vitriltd/editor-js-govuk-frontend`, previously saved documents may need updating. The migration system handles two things:

1. **Data migrations** — transforms block data shapes that changed between major versions.
2. **HTML re-rendering** — regenerates `renderedHtml` using the latest templates (relevant for any version bump, including minor and patch releases).

The result is a new `GovukOutputData` object with migrated blocks, fresh HTML, and the current `pluginVersion` stamp.

## How it works

Every `GovukOutputData` document carries a `pluginVersion` field recording which version of the plugin produced it. When you call `migrate()`:

1. The function compares the document's major version against the current plugin's major version.
2. **Same major version** — block data is left untouched. Only HTML is re-rendered (templates or CSS may have changed in a minor/patch bump).
3. **Different major version** — registered block-level migrations run first, transforming each block's `data` from the old shape to the new shape, then HTML is re-rendered.
4. The output is stamped with the current `pluginVersion`.

Migration is **idempotent** — calling `migrate()` on already-migrated data produces the same result. This makes it safe to run repeatedly or as part of an automated pipeline.

### Pre-versioning data

Documents saved before `pluginVersion` was introduced (i.e. the field is missing or `undefined`) are treated as major version `0`. They will have all registered migrations applied when upgrading to any `1.x` or later release.

## CLI usage

The package ships a CLI tool, `govuk-editorjs-migrate`, that reads JSON from stdin and writes the migrated result to stdout.

```bash
# Pipe a saved document through the CLI
cat saved-data.json | npx govuk-editorjs-migrate > migrated.json

# Inline JSON
echo '{"blocks":[...],"renderedHtml":"<stale>","pluginVersion":"0.1.0"}' | npx govuk-editorjs-migrate

# From a script or pipeline
curl https://your-api/documents/123 | npx govuk-editorjs-migrate | curl -X PUT https://your-api/documents/123 -d @-
```

### Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success — migrated JSON written to stdout |
| `1` | Error — invalid JSON, empty input, or migration failure. A message is written to stderr prefixed with `govuk-editorjs-migrate:` |

Output is pretty-printed JSON (2-space indentation).

## JavaScript API

```ts
import { migrate } from '@vitriltd/editor-js-govuk-frontend';
import type { GovukOutputData, MigrateOptions } from '@vitriltd/editor-js-govuk-frontend';

const saved: GovukOutputData = await fetchDocument();
const migrated: GovukOutputData = migrate(saved);

await saveDocument(migrated);
```

### `migrate(data, options?)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `GovukOutputData` | Previously saved document |
| `options.registry` | `MigrationRegistry` | Custom migration registry (defaults to the built-in one) |
| `options.version` | `string` | Override the target version (defaults to `PLUGIN_VERSION`) |

Returns a new `GovukOutputData` with:

- Migrated `blocks` (if major version changed)
- Fresh `renderedHtml`
- Current `pluginVersion`

The function is pure — it does not modify the input object.

## Data shape

`GovukOutputData` extends the standard Editor.js `OutputData` with two additional fields:

```ts
interface GovukOutputData extends OutputData {
  renderedHtml: string;   // Full HTML string rendered from all blocks
  pluginVersion: string;  // Semver version of the plugin that produced this data
}
```

The underlying `OutputData` contains:

```ts
{
  time: number;       // Timestamp
  version: string;    // Editor.js version
  blocks: Block[];    // Array of block objects with { id, type, data }
}
```

## Workflows

### Upgrading to a new minor or patch version

Block data shapes don't change in minor/patch releases, but templates or CSS classes might. Re-rendering ensures your stored HTML matches the latest output.

```ts
import { migrate } from '@vitriltd/editor-js-govuk-frontend';

// Re-renders HTML with current templates, stamps current version
const updated = migrate(existingDocument);
```

### Upgrading across a major version

Major versions may change block data shapes. The migration system applies all registered transformations in sequence, then re-renders.

```ts
// Document saved with v0.x — upgrading to v1.x
const migrated = migrate(oldDocument);
// migrated.blocks now have v1.x data shapes
// migrated.renderedHtml is freshly rendered
// migrated.pluginVersion is the current version
```

### Batch-migrating a database

```ts
import { migrate } from '@vitriltd/editor-js-govuk-frontend';

const documents = await db.query('SELECT id, editor_data FROM pages');

for (const doc of documents) {
  const data = JSON.parse(doc.editor_data);
  const migrated = migrate(data);
  await db.query('UPDATE pages SET editor_data = $1 WHERE id = $2', [
    JSON.stringify(migrated),
    doc.id,
  ]);
}
```

Or using the CLI for a JSON-lines file:

```bash
while IFS= read -r line; do
  echo "$line" | npx govuk-editorjs-migrate
done < documents.jsonl > migrated.jsonl
```

### Dry-run / preview

Compare before and after without committing changes:

```bash
cat saved-data.json | npx govuk-editorjs-migrate | diff saved-data.json -
```

Or in JavaScript:

```ts
const migrated = migrate(data);

if (migrated.renderedHtml !== data.renderedHtml) {
  console.log('HTML changed — review before saving');
}

if (migrated.pluginVersion !== data.pluginVersion) {
  console.log(`Version: ${data.pluginVersion} → ${migrated.pluginVersion}`);
}
```

### CI pipeline integration

Run migration as a post-deploy step or in a GitHub Action:

```yaml
- name: Migrate documents
  run: |
    cat exported-data.json | npx govuk-editorjs-migrate > migrated.json
    # Validate exit code
    if [ $? -ne 0 ]; then
      echo "Migration failed" >&2
      exit 1
    fi
```

## Writing migrations (for contributors)

When a new major version introduces a breaking change to a block's data shape, add a migration to the registry in `src/migrate/registry.ts`.

### `BlockMigration` interface

```ts
interface BlockMigration {
  fromMajor: number;                                        // Major version this upgrades FROM
  migrate: (data: Record<string, any>) => Record<string, any>;  // Transform function
}
```

### `MigrationRegistry`

```ts
type MigrationRegistry = Record<string, BlockMigration[]>;
// Key:   block tool type name (e.g. 'heading', 'warningText'), or '*' for a
//        migration that runs on every block regardless of type
// Value: ordered array of migrations, earliest first
```

The special `'*'` key holds migrations that run for **every** block, before the
type-specific ones. This is useful for changes that can appear inside any
rich-text block — for example an inline class rename embedded in a block's HTML.

### Adding a migration

Suppose v2 renames the `iconFallbackText` field to `assistiveText` in `warningText` blocks:

```ts
// src/migrate/registry.ts
export const registry: MigrationRegistry = {
  warningText: [
    {
      fromMajor: 1,
      migrate: (data) => {
        const { iconFallbackText, ...rest } = data;
        return { ...rest, assistiveText: iconFallbackText ?? 'Warning' };
      },
    },
  ],
};
```

If v3 later adds another change, append to the same array:

```ts
warningText: [
  { fromMajor: 1, migrate: (data) => { /* v1 → v2 */ } },
  { fromMajor: 2, migrate: (data) => { /* v2 → v3 */ } },
],
```

The system applies all migrations where `fromMajor` falls between the document's major version (inclusive) and the current major version (exclusive), in array order.

### Example: the GOV.UK Frontend v6 tag-colour migration

The plugin's first real migration (plugin major 0 → 1) handles GOV.UK Frontend v6's Tag colour changes: `--turquoise` → `--teal`, `--pink` → `--magenta`, and the removed `--light-blue` / `--blue` fall back to the default (blue) tag.

Tags appear both as standalone Tag blocks (colour in `data.classes`) and as inline tags inside rich text (colour in the block's HTML), so the migration is registered under the global `'*'` key and rewrites the colour classes in every string of a block's data:

```ts
export const registry: MigrationRegistry = {
  '*': [{ fromMajor: 0, migrate: (data) => deepMapStrings(data, rewriteTagColours) }],
};
```

See `src/migrate/registry.ts` for the `rewriteTagColours` and `deepMapStrings` helpers.

### Guidelines

- Migrations must be **pure functions** — no side effects or I/O.
- Always provide sensible defaults for newly required fields.
- Add test cases to `test/migrate.test.ts` covering the transformation.
- Keep migrations small and focused on one data shape change each.

## FAQ

### What happens to unknown block types?

Blocks whose `type` has no entry in the migration registry pass through unchanged. Their data is preserved as-is and included in the re-rendered HTML (assuming the block tool is still registered with Editor.js).

### Is migration destructive?

No. `migrate()` returns a **new object** — the input is never modified. You control when (and whether) to persist the result.

### Can I skip versions?

Yes. If a document was saved with v0.x and you upgrade directly to v3.x, all intermediate migrations (fromMajor 0, 1, 2) are applied in sequence automatically.

### What if I call `migrate()` on already-current data?

Nothing changes — the major versions match, so no data migrations run. HTML is re-rendered (producing identical output) and the same version stamp is applied. The result is equal to the input.
