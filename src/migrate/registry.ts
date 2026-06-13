/**
 * Migration registry for block data transformations across major versions.
 *
 * When a new major version introduces breaking data-shape or markup changes,
 * add migration entries here. Entries are keyed by block tool type, plus a
 * special `'*'` key whose migrations run for every block — useful for changes
 * (like inline class renames) that can appear inside any rich-text block.
 */

/** A single migration step for one block tool type. */
export interface BlockMigration {
  /** The major version this migration upgrades FROM. */
  fromMajor: number;
  /** Transform the block's data from the old shape to the new shape. */
  migrate: (data: Record<string, any>) => Record<string, any>;
}

/**
 * Map of tool name → ordered list of migrations. The `'*'` key holds migrations
 * applied to every block regardless of type; they run before the type-specific
 * migrations for that block.
 */
export type MigrationRegistry = Record<string, BlockMigration[]>;

/**
 * GOV.UK Frontend v6 tag colour changes (plugin major 0 → 1):
 * - `govuk-tag--turquoise` → `govuk-tag--teal` (turquoise deprecated in v6)
 * - `govuk-tag--pink` → `govuk-tag--magenta` (pink deprecated in v6)
 * - `govuk-tag--light-blue` removed → fall back to the default (blue) tag
 * - `govuk-tag--blue` removed → the default tag is already blue
 *
 * Tags appear both as standalone Tag blocks (colour in `data.classes`) and as
 * inline tags inside rich text (colour in the block's HTML), so the rewrite is
 * applied to every string in a block's data.
 */
const TAG_COLOUR_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bgovuk-tag--turquoise\b/g, 'govuk-tag--teal'],
  [/\bgovuk-tag--pink\b/g, 'govuk-tag--magenta'],
  // Optional leading space so an inline `class="govuk-tag govuk-tag--blue"`
  // collapses to `class="govuk-tag"` rather than leaving a double space, while
  // a bare `data.classes` value of `govuk-tag--blue` becomes `''`.
  [/ ?\bgovuk-tag--light-blue\b/g, ''],
  [/ ?\bgovuk-tag--blue\b/g, ''],
];

/** Rewrite legacy tag colour classes in a string (a `classes` value or inline HTML). */
function rewriteTagColours(value: string): string {
  return TAG_COLOUR_REPLACEMENTS.reduce((out, [re, to]) => out.replace(re, to), value);
}

/** Recursively apply a string transform to every string in a JSON-like value. */
function deepMapStrings(value: any, fn: (s: string) => string): any {
  if (typeof value === 'string') return fn(value);
  if (Array.isArray(value)) return value.map((v) => deepMapStrings(v, fn));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, deepMapStrings(v, fn)])
    );
  }
  return value;
}

/**
 * The migration registry, keyed by block tool type (plus `'*'` for all blocks).
 */
export const registry: MigrationRegistry = {
  '*': [{ fromMajor: 0, migrate: (data) => deepMapStrings(data, rewriteTagColours) }],
};
