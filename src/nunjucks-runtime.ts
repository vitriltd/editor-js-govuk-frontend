/**
 * Nunjucks runtime for rendering GOV.UK Frontend components client-side.
 *
 * Uses the nunjucks-slim browser runtime with precompiled templates.
 * No filesystem access or full nunjucks compiler needed at runtime.
 */

// @ts-expect-error — nunjucks-slim has no types; UMD module
import nunjucks from 'nunjucks/browser/nunjucks-slim.js';
import { getPrecompiledTemplates } from './precompiled-templates.js';

let env: any = null;

/**
 * Resolve a POSIX-style relative path against a parent template name.
 * e.g. resolve("govuk/components/inset-text/macro.njk", "../../macros/attributes.njk")
 *      → "govuk/macros/attributes.njk"
 */
function resolvePath(parent: string, relative: string): string {
  // Get the directory of the parent
  const parts = parent.split('/');
  parts.pop(); // remove filename
  for (const segment of relative.split('/')) {
    if (segment === '..') {
      parts.pop();
    } else if (segment !== '.') {
      parts.push(segment);
    }
  }
  return parts.join('/');
}

function getEnv(): any {
  if (env) return env;

  const templates = getPrecompiledTemplates();

  // Create a custom loader that extends PrecompiledLoader with relative path resolution.
  // The stock PrecompiledLoader doesn't handle relative includes (./template.njk)
  // which govuk-frontend's macro.njk files use extensively.
  const loader = new nunjucks.PrecompiledLoader(templates);
  loader.isRelative = (name: string) => name.startsWith('.') || name.startsWith('..');
  loader.resolve = (parentName: string, name: string) => resolvePath(parentName, name);

  env = new nunjucks.Environment(loader);
  return env;
}

/**
 * Render a GOV.UK Frontend component to HTML.
 *
 * @param component - Component slug, e.g. "inset-text", "warning-text"
 * @param params - Parameters matching the component's macro-options.json schema
 * @returns Rendered HTML string
 *
 * @example
 * ```ts
 * renderComponent('inset-text', { text: 'Important information' })
 * // → '<div class="govuk-inset-text">\n  Important information\n</div>'
 * ```
 */
export function renderComponent(
  component: string,
  params: Record<string, unknown>
): string {
  const nj = getEnv();
  // Use the precompiled wrapper template that imports and calls the macro
  return nj.render(`render/${component}.njk`, { params }).trim();
}
