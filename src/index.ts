/**
 * Editor.js GOV.UK Frontend Plugin
 *
 * Block tools that render GOV.UK Design System components in Editor.js.
 * Content is stored as clean Editor.js JSON and exports to pixel-perfect
 * GOV.UK Frontend HTML.
 */

import type { OutputData } from '@editorjs/editorjs';
import type EditorJS from '@editorjs/editorjs';

// Editor-specific styles
import './styles/editor-overrides.css';

import { renderToHtml } from './export/html-renderer.js';

// Configuration helper
export { govukTools } from './govuk-tools.js';
export type { GovukToolsOptions, GovukComponentName } from './govuk-tools.js';

// HTML export
export { renderToHtml };

export interface GovukOutputData extends OutputData {
  renderedHtml: string;
}

export async function saveWithHtml(editor: EditorJS): Promise<GovukOutputData> {
  const data = await editor.save();
  const renderedHtml = renderToHtml(data);
  return { ...data, renderedHtml };
}

// Nunjucks runtime (for advanced usage)
export { renderComponent } from './nunjucks-runtime.js';

// Base class (for extending)
export { GovukBlockTool } from './base/govuk-block-tool.js';

// Individual tools
export { GovukHeading } from './tools/heading.js';
export { GovukParagraph } from './tools/paragraph.js';
export { GovukList } from './tools/list.js';
export { GovukInsetText } from './tools/inset-text.js';
export { GovukWarningText } from './tools/warning-text.js';
export { GovukDetails } from './tools/details.js';
export { GovukPanel } from './tools/panel.js';
export { GovukNotificationBanner } from './tools/notification-banner.js';
export { GovukTable } from './tools/table.js';
export { GovukSummaryList } from './tools/summary-list.js';
export { GovukAccordion } from './tools/accordion.js';
export { GovukTabs } from './tools/tabs.js';
export { GovukTag } from './tools/tag.js';
export { GovukButton } from './tools/button.js';
export { GovukSectionBreak } from './tools/section-break.js';

// Inline tools
export { GovukTagInline } from './inline-tools/govuk-tag.js';
export { GovukVisuallyHidden } from './inline-tools/govuk-visually-hidden.js';

// Data types
export type { HeadingData } from './tools/heading.js';
export type { ParagraphData } from './tools/paragraph.js';
export type { ListData } from './tools/list.js';
export type { InsetTextData } from './tools/inset-text.js';
export type { WarningTextData } from './tools/warning-text.js';
export type { DetailsData } from './tools/details.js';
export type { PanelData } from './tools/panel.js';
export type { NotificationBannerData } from './tools/notification-banner.js';
export type { TableData } from './tools/table.js';
export type { SummaryListData } from './tools/summary-list.js';
export type { AccordionData } from './tools/accordion.js';
export type { TabsData } from './tools/tabs.js';
export type { TagData } from './tools/tag.js';
export type { ButtonData } from './tools/button.js';
export type { SectionBreakData } from './tools/section-break.js';
