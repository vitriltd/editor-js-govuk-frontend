/**
 * Migration registry for block data transformations across major versions.
 *
 * When a new major version introduces breaking data-shape changes,
 * add migration entries here keyed by tool name.
 */

/** A single migration step for one block tool type. */
export interface BlockMigration {
  /** The major version this migration upgrades FROM. */
  fromMajor: number;
  /** Transform the block's data from the old shape to the new shape. */
  migrate: (data: Record<string, any>) => Record<string, any>;
}

/** Map of tool name → ordered list of migrations. */
export type MigrationRegistry = Record<string, BlockMigration[]>;

/**
 * The migration registry. Empty until a future major version introduces
 * breaking data changes.
 *
 * Example entry for a hypothetical v2:
 * ```ts
 * const registry: MigrationRegistry = {
 *   heading: [
 *     { fromMajor: 1, migrate: (data) => ({ ...data, newField: 'default' }) },
 *   ],
 * };
 * ```
 */
export const registry: MigrationRegistry = {};
