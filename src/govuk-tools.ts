/**
 * Convenience helper for configuring Editor.js with GOV.UK Frontend tools.
 */

import type { EditorConfig } from '@editorjs/editorjs';
import { GovukHeading } from './tools/heading.js';
import { GovukParagraph } from './tools/paragraph.js';
import { GovukList } from './tools/list.js';
import { GovukInsetText } from './tools/inset-text.js';
import { GovukWarningText } from './tools/warning-text.js';
import { GovukDetails } from './tools/details.js';
import { GovukPanel } from './tools/panel.js';
import { GovukNotificationBanner } from './tools/notification-banner.js';
import { GovukTable } from './tools/table.js';
import { GovukSummaryList } from './tools/summary-list.js';
import { GovukAccordion } from './tools/accordion.js';
import { GovukTabs } from './tools/tabs.js';
import { GovukTag } from './tools/tag.js';
import { GovukButton } from './tools/button.js';
import { GovukSectionBreak } from './tools/section-break.js';
import { GovukTagInline } from './inline-tools/govuk-tag.js';
import { GovukVisuallyHidden } from './inline-tools/govuk-visually-hidden.js';

/** Registry of all available tools, keyed by component slug */
const TOOL_MAP = {
  heading: GovukHeading,
  paragraph: GovukParagraph,
  list: GovukList,
  'inset-text': GovukInsetText,
  'warning-text': GovukWarningText,
  details: GovukDetails,
  panel: GovukPanel,
  'notification-banner': GovukNotificationBanner,
  table: GovukTable,
  'summary-list': GovukSummaryList,
  accordion: GovukAccordion,
  tabs: GovukTabs,
  tag: GovukTag,
  button: GovukButton,
  'section-break': GovukSectionBreak,
} as const;

export type GovukComponentName = keyof typeof TOOL_MAP;

/** All available component names */
export const ALL_COMPONENTS: GovukComponentName[] = Object.keys(TOOL_MAP) as GovukComponentName[];

/** Slug to camelCase for Editor.js tool registration keys */
function toCamelCase(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/** Components that support the inline toolbar */
const INLINE_TOOLBAR_COMPONENTS: GovukComponentName[] = [
  'paragraph',
  'inset-text',
  'warning-text',
  'details',
  'panel',
  'notification-banner',
  'accordion',
  'tabs',
  'table',
  'summary-list',
];

export interface GovukToolsOptions {
  /**
   * Which components to enable. Omit to enable all.
   */
  components?: GovukComponentName[];

  /**
   * Per-component config overrides, keyed by component slug.
   * e.g. { heading: { levels: [1, 2, 3] } }
   */
  [componentName: string]: unknown;
}

/**
 * Build an Editor.js tools configuration object with GOV.UK Frontend block tools.
 *
 * @example
 * ```ts
 * const editor = new EditorJS({
 *   tools: govukTools({
 *     components: ['heading', 'paragraph', 'inset-text'],
 *     heading: { levels: [1, 2, 3] },
 *   })
 * });
 * ```
 */
export function govukTools(
  options: GovukToolsOptions = {}
): EditorConfig['tools'] {
  const { components, ...perComponentConfig } = options;
  const enabledComponents = components ?? ALL_COMPONENTS;

  const tools: Record<string, any> = {};

  for (const slug of enabledComponents) {
    const ToolClass = TOOL_MAP[slug];
    if (!ToolClass) {
      console.warn(`govukTools: unknown component "${slug}", skipping.`);
      continue;
    }

    const key = toCamelCase(slug);
    const config = perComponentConfig[slug] as Record<string, unknown> | undefined;

    const toolEntry: Record<string, unknown> = {
      class: ToolClass,
    };

    if (config) {
      toolEntry.config = config;
    }

    if (INLINE_TOOLBAR_COMPONENTS.includes(slug)) {
      toolEntry.inlineToolbar = true;
    }

    tools[key] = toolEntry;
  }

  // Register inline tools (always available when any block uses the inline toolbar)
  tools.govukTag = { class: GovukTagInline as any };
  tools.govukVisuallyHidden = { class: GovukVisuallyHidden as any };

  return tools;
}
