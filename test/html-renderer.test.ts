import { describe, it, expect } from 'vitest';
import { renderToHtml } from '../src/export/html-renderer.js';
import type { OutputData } from '@editorjs/editorjs';

function makeOutput(...blocks: { type: string; data: Record<string, any> }[]): OutputData {
  return {
    time: Date.now(),
    version: '2.30.0',
    blocks: blocks.map((b, i) => ({ id: String(i), ...b })),
  };
}

describe('renderToHtml', () => {
  describe('Heading', () => {
    it('renders h1 with xl class', () => {
      const html = renderToHtml(makeOutput({ type: 'heading', data: { text: 'Title', level: 1 } }));
      expect(html).toBe('<h1 class="govuk-heading-xl">Title</h1>');
    });

    it('renders h2 with l class', () => {
      const html = renderToHtml(makeOutput({ type: 'heading', data: { text: 'Subtitle', level: 2 } }));
      expect(html).toBe('<h2 class="govuk-heading-l">Subtitle</h2>');
    });

    it('renders h3 with m class', () => {
      const html = renderToHtml(makeOutput({ type: 'heading', data: { text: 'Section', level: 3 } }));
      expect(html).toBe('<h3 class="govuk-heading-m">Section</h3>');
    });

    it('renders h4 with s class', () => {
      const html = renderToHtml(makeOutput({ type: 'heading', data: { text: 'Small', level: 4 } }));
      expect(html).toBe('<h4 class="govuk-heading-s">Small</h4>');
    });
  });

  describe('Paragraph', () => {
    it('renders body paragraph', () => {
      const html = renderToHtml(makeOutput({ type: 'paragraph', data: { text: 'Hello world', size: 'body' } }));
      expect(html).toBe('<p class="govuk-body">Hello world</p>');
    });

    it('renders large paragraph', () => {
      const html = renderToHtml(makeOutput({ type: 'paragraph', data: { text: 'Large text', size: 'body-l' } }));
      expect(html).toBe('<p class="govuk-body-l">Large text</p>');
    });

    it('renders small paragraph', () => {
      const html = renderToHtml(makeOutput({ type: 'paragraph', data: { text: 'Small text', size: 'body-s' } }));
      expect(html).toBe('<p class="govuk-body-s">Small text</p>');
    });
  });

  describe('List', () => {
    it('renders bullet list', () => {
      const html = renderToHtml(makeOutput({
        type: 'list',
        data: { style: 'bullet', items: ['Apples', 'Oranges'] },
      }));
      expect(html).toContain('<ul class="govuk-list govuk-list--bullet">');
      expect(html).toContain('<li>Apples</li>');
      expect(html).toContain('<li>Oranges</li>');
    });

    it('renders numbered list', () => {
      const html = renderToHtml(makeOutput({
        type: 'list',
        data: { style: 'number', items: ['First', 'Second'] },
      }));
      expect(html).toContain('<ol class="govuk-list govuk-list--number">');
    });
  });

  describe('Section break', () => {
    it('renders visible xl section break', () => {
      const html = renderToHtml(makeOutput({
        type: 'sectionBreak',
        data: { size: 'xl', visible: true },
      }));
      expect(html).toBe('<hr class="govuk-section-break govuk-section-break--xl govuk-section-break--visible">');
    });

    it('renders invisible section break', () => {
      const html = renderToHtml(makeOutput({
        type: 'sectionBreak',
        data: { size: 'm', visible: false },
      }));
      expect(html).toBe('<hr class="govuk-section-break govuk-section-break--m">');
    });
  });

  describe('Inset text (Nunjucks)', () => {
    it('renders inset text with text content', () => {
      const html = renderToHtml(makeOutput({
        type: 'insetText',
        data: { html: 'Important information here' },
      }));
      expect(html).toContain('govuk-inset-text');
      expect(html).toContain('Important information here');
    });
  });

  describe('Warning text (Nunjucks)', () => {
    it('renders warning text with icon', () => {
      const html = renderToHtml(makeOutput({
        type: 'warningText',
        data: { text: 'You can be fined', iconFallbackText: 'Warning' },
      }));
      expect(html).toContain('govuk-warning-text');
      expect(html).toContain('govuk-warning-text__icon');
      expect(html).toContain('You can be fined');
      expect(html).toContain('Warning');
    });
  });

  describe('Details (Nunjucks)', () => {
    it('renders details component', () => {
      const html = renderToHtml(makeOutput({
        type: 'details',
        data: { summaryText: 'Help with nationality', html: '<p>If you are not sure...</p>' },
      }));
      expect(html).toContain('govuk-details');
      expect(html).toContain('Help with nationality');
      expect(html).toContain('If you are not sure...');
    });
  });

  describe('Panel (Nunjucks)', () => {
    it('renders confirmation panel', () => {
      const html = renderToHtml(makeOutput({
        type: 'panel',
        data: { titleText: 'Application complete', html: 'Your reference number<br><strong>HDJ2123F</strong>' },
      }));
      expect(html).toContain('govuk-panel--confirmation');
      expect(html).toContain('Application complete');
      expect(html).toContain('HDJ2123F');
    });
  });

  describe('Notification banner (Nunjucks)', () => {
    it('renders success banner', () => {
      const html = renderToHtml(makeOutput({
        type: 'notificationBanner',
        data: { type: 'success', titleText: 'Success', html: '<p>Training added</p>' },
      }));
      expect(html).toContain('govuk-notification-banner--success');
      expect(html).toContain('Success');
      expect(html).toContain('Training added');
    });

    it('renders default banner', () => {
      const html = renderToHtml(makeOutput({
        type: 'notificationBanner',
        data: { type: '', titleText: 'Important', html: '<p>Info here</p>' },
      }));
      expect(html).toContain('govuk-notification-banner');
      expect(html).not.toContain('govuk-notification-banner--success');
      expect(html).toContain('Important');
    });
  });

  describe('Table (Nunjucks)', () => {
    it('renders table with headers and rows using html', () => {
      const html = renderToHtml(makeOutput({
        type: 'table',
        data: {
          head: [{ html: 'Name' }, { html: 'Age' }],
          rows: [[{ html: 'Alice' }, { html: '30' }]],
        },
      }));
      expect(html).toContain('govuk-table');
      expect(html).toContain('govuk-table__header');
      expect(html).toContain('Name');
      expect(html).toContain('Alice');
    });

    it('falls back from text to html for old data format', () => {
      const html = renderToHtml(makeOutput({
        type: 'table',
        data: {
          head: [{ text: 'Name' }],
          rows: [[{ text: 'Bob' }]],
        },
      }));
      expect(html).toContain('Name');
      expect(html).toContain('Bob');
    });

    it('renders table cells with tag markup', () => {
      const html = renderToHtml(makeOutput({
        type: 'table',
        data: {
          head: [{ html: 'Name' }, { html: 'Status' }],
          rows: [[{ html: 'Alice' }, { html: '<strong class="govuk-tag govuk-tag--green">Active</strong>' }]],
        },
      }));
      expect(html).toContain('govuk-tag');
      expect(html).toContain('govuk-tag--green');
      expect(html).toContain('Active');
    });
  });

  describe('Summary list (Nunjucks)', () => {
    it('renders key-value pairs with html values', () => {
      const html = renderToHtml(makeOutput({
        type: 'summaryList',
        data: {
          rows: [{ key: { text: 'Name' }, value: { html: 'Sarah' } }],
        },
      }));
      expect(html).toContain('govuk-summary-list');
      expect(html).toContain('Name');
      expect(html).toContain('Sarah');
    });

    it('falls back from text to html for old value format', () => {
      const html = renderToHtml(makeOutput({
        type: 'summaryList',
        data: {
          rows: [{ key: { text: 'Name' }, value: { text: 'Sarah' } }],
        },
      }));
      expect(html).toContain('govuk-summary-list');
      expect(html).toContain('Sarah');
    });
  });

  describe('Accordion (Nunjucks)', () => {
    it('renders accordion sections', () => {
      const html = renderToHtml(makeOutput({
        type: 'accordion',
        data: {
          id: 'test-acc',
          items: [
            { heading: { text: 'Section 1' }, content: { html: '<p>Content 1</p>' } },
          ],
        },
      }));
      expect(html).toContain('govuk-accordion');
      expect(html).toContain('data-module="govuk-accordion"');
      expect(html).toContain('Section 1');
      expect(html).toContain('Content 1');
    });
  });

  describe('Tabs (Nunjucks)', () => {
    it('renders tabs with panels', () => {
      const html = renderToHtml(makeOutput({
        type: 'tabs',
        data: {
          items: [
            { label: 'Past day', id: 'past-day', panel: { html: '<p>Day data</p>' } },
            { label: 'Past week', id: 'past-week', panel: { html: '<p>Week data</p>' } },
          ],
        },
      }));
      expect(html).toContain('govuk-tabs');
      expect(html).toContain('Past day');
      expect(html).toContain('Past week');
      expect(html).toContain('Day data');
      // Tab label is auto-generated as a heading in the panel
      expect(html).toContain('<h2 class="govuk-heading-l">Past day</h2>');
      expect(html).toContain('<h2 class="govuk-heading-l">Past week</h2>');
    });
  });

  describe('Tag (Nunjucks)', () => {
    it('renders tag with colour class', () => {
      const html = renderToHtml(makeOutput({
        type: 'tag',
        data: { text: 'Active', classes: 'govuk-tag--green' },
      }));
      expect(html).toContain('govuk-tag');
      expect(html).toContain('govuk-tag--green');
      expect(html).toContain('Active');
    });

    it('renders default tag', () => {
      const html = renderToHtml(makeOutput({
        type: 'tag',
        data: { text: 'Pending', classes: '' },
      }));
      expect(html).toContain('govuk-tag');
      expect(html).toContain('Pending');
    });
  });

  describe('Button (Nunjucks)', () => {
    it('renders button element', () => {
      const html = renderToHtml(makeOutput({
        type: 'button',
        data: { text: 'Save', element: 'button', classes: '', href: '' },
      }));
      expect(html).toContain('govuk-button');
      expect(html).toContain('Save');
      expect(html).toContain('<button');
    });

    it('renders secondary button', () => {
      const html = renderToHtml(makeOutput({
        type: 'button',
        data: { text: 'Cancel', element: 'button', classes: 'govuk-button--secondary', href: '' },
      }));
      expect(html).toContain('govuk-button--secondary');
    });
  });

  describe('Inline link classes', () => {
    it('adds govuk-link to bare links in paragraphs', () => {
      const html = renderToHtml(makeOutput({
        type: 'paragraph',
        data: { text: 'Visit <a href="https://example.com">Example</a> now', size: 'body' },
      }));
      expect(html).toContain('<a class="govuk-link" href="https://example.com">Example</a>');
    });

    it('adds govuk-link to bare links in headings', () => {
      const html = renderToHtml(makeOutput({
        type: 'heading',
        data: { text: 'See <a href="/help">help</a>', level: 2 },
      }));
      expect(html).toContain('<a class="govuk-link" href="/help">help</a>');
    });

    it('adds govuk-notification-banner__link to links in notification banners', () => {
      const html = renderToHtml(makeOutput({
        type: 'notificationBanner',
        data: {
          type: 'success',
          titleText: 'Success',
          html: '<p>You have <a href="/view">added a training course</a></p>',
        },
      }));
      expect(html).toContain('govuk-notification-banner__link');
      expect(html).not.toContain('"govuk-link"');
    });

    it('does not duplicate class when already present', () => {
      const html = renderToHtml(makeOutput({
        type: 'paragraph',
        data: { text: 'A <a class="govuk-link" href="/">link</a>', size: 'body' },
      }));
      const matches = html.match(/govuk-link/g);
      expect(matches).toHaveLength(1);
    });

    it('appends link class to existing classes', () => {
      const html = renderToHtml(makeOutput({
        type: 'paragraph',
        data: { text: 'A <a class="custom" href="/">link</a>', size: 'body' },
      }));
      expect(html).toContain('class="custom govuk-link"');
    });
  });

  describe('Multiple blocks', () => {
    it('renders all blocks separated by newlines', () => {
      const html = renderToHtml(makeOutput(
        { type: 'heading', data: { text: 'Title', level: 1 } },
        { type: 'paragraph', data: { text: 'Body text', size: 'body' } },
      ));
      expect(html).toContain('<h1 class="govuk-heading-xl">Title</h1>');
      expect(html).toContain('<p class="govuk-body">Body text</p>');
    });
  });
});
