/**
 * Core migration + re-rendering function.
 *
 * Pure function with no I/O — suitable for use in CLI tools,
 * HTTP handlers, or direct JS consumption.
 */

import type { GovukOutputData } from '../index.js';
import { renderToHtml } from '../export/html-renderer.js';
import { PLUGIN_VERSION } from '../version.js';
import { registry as defaultRegistry } from './registry.js';
import type { MigrationRegistry } from './registry.js';

export interface MigrateOptions {
  registry?: MigrationRegistry;
  version?: string;
}

/**
 * Extract the major version number from a semver string.
 * Returns 0 if the version is missing or unparseable.
 */
function getMajor(version: string | undefined): number {
  if (!version) return 0;
  const major = parseInt(version.split('.')[0], 10);
  return Number.isNaN(major) ? 0 : major;
}

/**
 * Migrate and re-render Editor.js GOV.UK output data.
 *
 * - Same major version → re-renders HTML only (templates/CSS may have changed in a minor bump)
 * - Different major version → applies registered block migrations, then re-renders
 * - Always stamps the current `pluginVersion`
 * - Idempotent — safe to call repeatedly
 *
 * @param data - Previously saved `GovukOutputData` (with or without `pluginVersion`)
 * @param options - Optional overrides for the migration registry and current version
 * @returns A new `GovukOutputData` with fresh `renderedHtml` and current `pluginVersion`
 */
export function migrate(data: GovukOutputData, options?: MigrateOptions): GovukOutputData {
  const reg = options?.registry ?? defaultRegistry;
  const currentVersion = options?.version ?? PLUGIN_VERSION;

  const inputMajor = getMajor(data.pluginVersion);
  const currentMajor = getMajor(currentVersion);

  let blocks = data.blocks;

  // If the major version differs, apply any registered migrations
  if (inputMajor !== currentMajor) {
    blocks = blocks.map((block) => {
      const migrations = reg[block.type];
      if (!migrations) return block;

      let blockData = { ...block.data };
      for (const migration of migrations) {
        if (migration.fromMajor >= inputMajor && migration.fromMajor < currentMajor) {
          blockData = migration.migrate(blockData);
        }
      }

      return { ...block, data: blockData };
    });
  }

  // Always re-render HTML (templates/CSS may have changed even in minor bumps)
  const renderedHtml = renderToHtml({ ...data, blocks });

  return {
    ...data,
    blocks,
    renderedHtml,
    pluginVersion: currentVersion,
  };
}
