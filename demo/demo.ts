import EditorJS from '@editorjs/editorjs';
import { govukTools, saveWithHtml } from '../src/index.js';

const editor = new EditorJS({
  holder: 'editorjs',
  tools: govukTools(),
  data: {
    blocks: [
      {
        type: 'heading',
        data: { text: 'Apply for a fishing licence', level: 1 },
      },
      {
        type: 'paragraph',
        data: { text: 'Use this service to get a rod fishing licence for England and Wales.', size: 'body-l' },
      },
      {
        type: 'insetText',
        data: { html: 'It can take up to <strong>8 weeks</strong> to register a lasting power of attorney if there are no mistakes in the application.' },
      },
      {
        type: 'warningText',
        data: { text: 'You can be fined up to £5,000 if you do not register.', iconFallbackText: 'Warning' },
      },
      {
        type: 'details',
        data: { summaryText: 'Help with nationality', html: '<p class="govuk-body">If you\'re not sure about your nationality, try to find out from an official document such as a passport or national ID card.</p>' },
      },
      {
        type: 'panel',
        data: { titleText: 'Application complete', html: 'Your reference number<br><strong>HDJ2123F</strong>' },
      },
      {
        type: 'notificationBanner',
        data: { type: 'success', titleText: 'Success', html: '<p class="govuk-notification-banner__heading">You have 7 days left to send your application. <a class="govuk-notification-banner__link" href="#">View application</a>.</p>' },
      },
      {
        type: 'heading',
        data: { text: 'Lists', level: 2 },
      },
      {
        type: 'list',
        data: { style: 'bullet', items: ['Apples', 'Oranges', 'Pears'] },
      },
      {
        type: 'heading',
        data: { text: 'Table', level: 2 },
      },
      {
        type: 'table',
        data: {
          head: [{ html: 'Date' }, { html: 'Amount' }, { html: 'Status' }],
          rows: [
            [{ html: '1 Jan 2024' }, { html: '£50.00' }, { html: '<strong class="govuk-tag govuk-tag--green">Active</strong>' }],
            [{ html: '15 Mar 2024' }, { html: '£30.00' }, { html: '<strong class="govuk-tag govuk-tag--grey">Expired</strong>' }],
          ],
        },
      },
      {
        type: 'heading',
        data: { text: 'Summary list', level: 2 },
      },
      {
        type: 'summaryList',
        data: {
          rows: [
            { key: { text: 'Name' }, value: { html: 'Sarah Philips' } },
            { key: { text: 'Date of birth' }, value: { html: '5 January 1978' } },
            { key: { text: 'Contact information' }, value: { html: '72 Guild Street, London, SE23 6FH' } },
          ],
        },
      },
      {
        type: 'heading',
        data: { text: 'Accordion', level: 2 },
      },
      {
        type: 'accordion',
        data: {
          id: 'demo-accordion',
          items: [
            { heading: { text: 'Understanding agile project management' }, content: { html: '<p class="govuk-body">Agile project management is an iterative approach to delivering a project throughout its life cycle.</p>' } },
            { heading: { text: 'Working with agile methods' }, content: { html: '<p class="govuk-body">You can use agile methods for projects of any size, from small teams to large programmes.</p>' } },
          ],
        },
      },
      {
        type: 'heading',
        data: { text: 'Tabs', level: 2 },
      },
      {
        type: 'tabs',
        data: {
          items: [
            { label: 'Past day', id: 'past-day', panel: { html: '<p class="govuk-body">There were 123 applications submitted in the past day.</p>' } },
            { label: 'Past week', id: 'past-week', panel: { html: '<p class="govuk-body">There were 789 applications submitted in the past week.</p>' } },
          ],
        },
      },
      {
        type: 'heading',
        data: { text: 'Tags and buttons', level: 2 },
      },
      {
        type: 'tag',
        data: { text: 'Active', classes: 'govuk-tag--green' },
      },
      {
        type: 'paragraph',
        data: { text: 'The following is an example of a GOV.UK button component.' },
      },
      {
        type: 'button',
        data: { text: 'Submit application', element: 'button', classes: '', href: '' },
      },
      {
        type: 'sectionBreak',
        data: { size: 'xl', visible: true },
      },
      {
        type: 'paragraph',
        data: { text: 'End of demo content.', size: 'body-s' },
      },
    ],
  },
  onReady: () => {
    console.log('Editor.js is ready');
  },
});

// Export logic — save data to sessionStorage and navigate to output page
async function exportAndPreview() {
  const output = await saveWithHtml(editor);

  sessionStorage.setItem('editorjs-export-json', JSON.stringify(output, null, 2));
  sessionStorage.setItem('editorjs-export-html', output.renderedHtml);

  window.location.href = 'output.html';
}

document.getElementById('export-btn')?.addEventListener('click', exportAndPreview);
document.getElementById('floating-export-btn')?.addEventListener('click', exportAndPreview);
