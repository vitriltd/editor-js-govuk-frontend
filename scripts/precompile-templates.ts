/**
 * Precompile govuk-frontend Nunjucks templates into JavaScript functions.
 *
 * This script runs at build time and produces src/precompiled-templates.ts
 * which is then bundled with the nunjucks-slim runtime for client-side rendering.
 */

import nunjucks from 'nunjucks';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const GOVUK_DIST = path.resolve(
  ROOT,
  'node_modules/govuk-frontend/dist/govuk'
);
const OUTPUT_FILE = path.resolve(ROOT, 'src/precompiled-templates.ts');

// Components that our plugin renders via Nunjucks.
const NUNJUCKS_COMPONENTS = [
  'accordion',
  'button',
  'details',
  'inset-text',
  'notification-banner',
  'panel',
  'summary-list',
  'table',
  'tabs',
  'tag',
  'warning-text',
];

function slugToMacroName(slug: string): string {
  return (
    'govuk' +
    slug
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
  );
}

function discoverTemplates(): { name: string; fullPath: string }[] {
  const templates: { name: string; fullPath: string }[] = [];

  // Shared macros — needed by all component templates
  const macrosDir = path.join(GOVUK_DIST, 'macros');
  for (const file of fs.readdirSync(macrosDir)) {
    if (file.endsWith('.njk')) {
      templates.push({
        name: `govuk/macros/${file}`,
        fullPath: path.join(macrosDir, file),
      });
    }
  }

  // Component macro.njk and template.njk files
  const componentsDir = path.join(GOVUK_DIST, 'components');
  for (const component of NUNJUCKS_COMPONENTS) {
    const componentDir = path.join(componentsDir, component);
    if (!fs.existsSync(componentDir)) {
      console.warn(`Warning: component directory not found: ${componentDir}`);
      continue;
    }

    for (const file of fs.readdirSync(componentDir)) {
      if (file.endsWith('.njk')) {
        templates.push({
          name: `govuk/components/${component}/${file}`,
          fullPath: path.join(componentDir, file),
        });
      }
    }
  }

  return templates;
}

function precompile(): void {
  const templates = discoverTemplates();

  // nunjucks environment with govuk-frontend's dist parent as search root
  const searchRoot = path.resolve(GOVUK_DIST, '..');
  const env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(searchRoot)
  );

  const precompiledChunks: string[] = [];

  // 1. Precompile all discovered templates (macros + component files)
  for (const template of templates) {
    const source = fs.readFileSync(template.fullPath, 'utf-8');
    try {
      const compiled = nunjucks.precompileString(source, {
        name: template.name,
        env,
      });
      precompiledChunks.push(compiled);
      console.log(`  ✓ ${template.name}`);
    } catch (err) {
      console.error(`  ✗ ${template.name}: ${err}`);
      throw err;
    }
  }

  // 2. Create and precompile wrapper templates for each component.
  //    These import the macro and call it with a `params` context variable.
  //    This avoids needing renderString (which requires the full compiler).
  for (const component of NUNJUCKS_COMPONENTS) {
    const macro = slugToMacroName(component);
    const wrapperName = `render/${component}.njk`;
    const wrapperSource = `{% from "govuk/components/${component}/macro.njk" import ${macro} %}{{ ${macro}(params) }}`;

    try {
      const compiled = nunjucks.precompileString(wrapperSource, {
        name: wrapperName,
        env,
      });
      precompiledChunks.push(compiled);
      console.log(`  ✓ ${wrapperName} (wrapper)`);
    } catch (err) {
      console.error(`  ✗ ${wrapperName}: ${err}`);
      throw err;
    }
  }

  const allCode = precompiledChunks.join('\n');
  const totalTemplates = templates.length + NUNJUCKS_COMPONENTS.length;
  console.log(`\nPrecompiled ${totalTemplates} templates total`);

  const output = `// AUTO-GENERATED — do not edit. Run "npm run precompile" to regenerate.
// Precompiled govuk-frontend Nunjucks templates.
/* eslint-disable */
// @ts-nocheck

export function getPrecompiledTemplates(): Record<string, { root: Function }> {
  const templates: Record<string, any> = {};
  const fakeWindow = { nunjucksPrecompiled: templates };
  (function(window) {
${allCode}
  })(fakeWindow);
  return templates;
}
`;

  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
  console.log(`Wrote precompiled templates to ${OUTPUT_FILE}`);
}

precompile();
