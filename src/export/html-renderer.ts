/**
 * Converts Editor.js JSON output to GOV.UK Frontend HTML.
 *
 * Uses precompiled Nunjucks templates for components that need them,
 * and direct HTML construction for simple components.
 */

import type { OutputData, OutputBlockData } from '@editorjs/editorjs';
import { renderComponent } from '../nunjucks-runtime.js';
import { HEADING_SIZE_MAP } from '../tools/heading.js';

type BlockRenderer = (data: Record<string, any>) => string;

/** Link class to apply per block type. Undefined means use the default `govuk-link`. */
const linkClassByBlockType: Record<string, string> = {
  notificationBanner: 'govuk-notification-banner__link',
};

/** URL schemes allowed in `href`. Everything else is treated as unsafe. */
const SAFE_URL_SCHEME = /^(?:https?|mailto|tel):/i;

/**
 * Neutralise dangerous URL schemes (`javascript:`, `data:`, `vbscript:`, …) in an
 * href, returning `#` when the scheme is not allow-listed. Relative URLs and
 * anchors (no scheme) pass through unchanged.
 *
 * Defence-in-depth only — it does not decode HTML entities, so it is NOT a
 * substitute for sanitising untrusted rich-text output (see the Security section
 * of the README).
 */
function sanitizeUrl(raw: string): string {
  // Browsers ignore ASCII control chars/whitespace when parsing a scheme.
  const cleaned = raw.replace(/[\u0000-\u0020]/g, '');
  if (/^[a-z][a-z0-9+.-]*:/i.test(cleaned) && !SAFE_URL_SCHEME.test(cleaned)) {
    return '#';
  }
  return raw;
}

/**
 * Add GDS link classes to bare `<a>` tags in rendered HTML, and neutralise
 * dangerous href schemes. If the `<a>` already has a `class` attribute, the link
 * class is appended (unless already present); otherwise one is added.
 */
function addLinkClasses(html: string, blockType: string): string {
  const linkClass = linkClassByBlockType[blockType] ?? 'govuk-link';

  return html.replace(/<a\b([^>]*)>/g, (_match, rawAttrs: string) => {
    const attrs = rawAttrs.replace(
      /(\bhref\s*=\s*)(["'])([\s\S]*?)\2/i,
      (_m, pre: string, quote: string, url: string) => pre + quote + sanitizeUrl(url) + quote
    );

    const classMatch = attrs.match(/class="([^"]*)"/);
    if (classMatch) {
      const existing = classMatch[1];
      if (existing.split(/\s+/).includes(linkClass)) {
        return `<a${attrs}>`;
      }
      return `<a${attrs.replace(`class="${existing}"`, `class="${existing} ${linkClass}"`)}>`;
    }
    return `<a class="${linkClass}"${attrs}>`;
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Allow-lists for structural fields interpolated into `class` attributes. Any
// other value falls back to the default, so untrusted data can't break out of
// the attribute (these are enums, never rich text — unlike `text`/`html`).
const PARAGRAPH_SIZES = new Set(['body-l', 'body', 'body-s']);
const LIST_STYLES = new Set(['bullet', 'number']);
const SECTION_BREAK_SIZES = new Set(['xl', 'l', 'm']);

/** Direct HTML renderers for simple components */
const directRenderers: Record<string, BlockRenderer> = {
  heading: (data) => {
    const level = Math.max(1, Math.min(6, Math.floor(Number(data.level)))) || 2;
    const cls = HEADING_SIZE_MAP[level] ?? 'govuk-heading-l';
    return `<h${level} class="${cls}">${data.text}</h${level}>`;
  },

  paragraph: (data) => {
    const size = PARAGRAPH_SIZES.has(data.size) ? data.size : 'body';
    return `<p class="govuk-${size}">${data.text}</p>`;
  },

  list: (data) => {
    const style = LIST_STYLES.has(data.style) ? data.style : 'bullet';
    const tag = style === 'number' ? 'ol' : 'ul';
    const items = (data.items ?? []).map((item: string) => `  <li>${item}</li>`).join('\n');
    return `<${tag} class="govuk-list govuk-list--${style}">\n${items}\n</${tag}>`;
  },

  sectionBreak: (data) => {
    const size = SECTION_BREAK_SIZES.has(data.size) ? data.size : 'xl';
    const visible = data.visible !== false ? ' govuk-section-break--visible' : '';
    return `<hr class="govuk-section-break govuk-section-break--${size}${visible}">`;
  },
};

/** Nunjucks-based renderers: map Editor.js tool name → govuk-frontend component slug */
const nunjucksComponents: Record<string, string> = {
  insetText: 'inset-text',
  warningText: 'warning-text',
  details: 'details',
  panel: 'panel',
  notificationBanner: 'notification-banner',
  table: 'table',
  summaryList: 'summary-list',
  accordion: 'accordion',
  tabs: 'tabs',
  tag: 'tag',
  button: 'button',
};

/**
 * Map Editor.js block data to govuk-frontend macro params.
 * Most map 1:1, but some need minor transformations.
 */
function toMacroParams(toolName: string, data: Record<string, any>): Record<string, any> {
  switch (toolName) {
    case 'warningText':
      return {
        text: data.text,
        iconFallbackText: data.iconFallbackText ?? 'Warning',
      };

    case 'notificationBanner':
      return {
        type: data.type || undefined,
        titleText: data.titleText,
        html: data.html,
      };

    case 'button': {
      // GOV.UK Frontend v6 derives the element from `href` (link if present,
      // otherwise a <button>); the old `element` param is no longer supported.
      const params: Record<string, any> = {
        text: data.text,
        classes: data.classes || undefined,
      };
      if (data.href) {
        params.href = sanitizeUrl(String(data.href));
      }
      return params;
    }

    case 'tabs':
      return {
        ...data,
        items: (data.items ?? []).map((item: Record<string, any>) => {
          let panelHtml = (item.panel?.html ?? '').trim();
          // Wrap bare text/inline content in a govuk-body paragraph
          if (panelHtml && !panelHtml.match(/^<(p|h[1-6]|ul|ol|table|div|hr)\b/i)) {
            panelHtml = `<p class="govuk-body">${panelHtml}</p>`;
          }
          return {
            ...item,
            panel: {
              html: `<h2 class="govuk-heading-l">${escapeHtml(item.label)}</h2>${panelHtml}`,
            },
          };
        }),
      };

    case 'table':
      return {
        head: (data.head ?? []).map((cell: any) => ({
          html: cell.html ?? '',
        })),
        rows: (data.rows ?? []).map((row: any[]) =>
          row.map((cell: any) => ({
            html: cell.html ?? '',
          }))
        ),
      };

    case 'summaryList':
      return {
        rows: (data.rows ?? []).map((row: any) => ({
          key: row.key,
          value: {
            html: row.value?.html ?? '',
          },
        })),
      };

    case 'tag':
      return {
        text: data.text,
        classes: data.classes || undefined,
      };

    default:
      return data;
  }
}

/**
 * Render a single Editor.js block to GOV.UK Frontend HTML.
 */
function renderBlock(block: OutputBlockData): string {
  const { type, data } = block;
  let html: string;

  // Direct HTML renderers
  if (type in directRenderers) {
    html = directRenderers[type](data);
  } else {
    // Nunjucks renderers
    const componentSlug = nunjucksComponents[type];
    if (componentSlug) {
      const params = toMacroParams(type, data);
      html = renderComponent(componentSlug, params);
    } else {
      // Unknown block type — return empty
      console.warn(`renderToHtml: unknown block type "${type}"`);
      return '';
    }
  }

  // Post-process: add GDS link classes to any <a> tags
  if (html.includes('<a ') || html.includes('<a>')) {
    html = addLinkClasses(html, type);
  }

  return html;
}

/**
 * Convert complete Editor.js output data to GOV.UK Frontend HTML.
 *
 * @param data - Editor.js save() output
 * @returns Full HTML string with all blocks rendered as GOV.UK components
 *
 * @example
 * ```ts
 * const editorData = await editor.save();
 * const html = renderToHtml(editorData);
 * ```
 */
export function renderToHtml(data: OutputData): string {
  return data.blocks.map(renderBlock).filter(Boolean).join('\n\n');
}
