import { initAll } from 'govuk-frontend';
import { JSONEditor, Mode } from 'vanilla-jsoneditor';
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
import 'highlight.js/styles/base16/dracula.css';

hljs.registerLanguage('xml', xml);

// Tab switching for the output page's own tabs (Rendered / Markup / JSON)
document.querySelectorAll('.output-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.output-tab').forEach((t) => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.output-panel').forEach((p) => {
      p.classList.remove('active');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    const target = (tab as HTMLElement).dataset.tab;
    document.getElementById('panel-' + target)!.classList.add('active');
  });
});

// Load data from sessionStorage
const html = sessionStorage.getItem('editorjs-export-html');
const json = sessionStorage.getItem('editorjs-export-json');

if (html && json) {
  document.getElementById('rendered-content')!.innerHTML = html;
  const markupEl = document.getElementById('markup-content')!;
  markupEl.textContent = html;
  hljs.highlightElement(markupEl);

  new JSONEditor({
    target: document.getElementById('json-content')!,
    props: {
      content: { json: JSON.parse(json) },
      mode: Mode.tree,
      readOnly: true,
    },
  });

  // Initialise GOV.UK Frontend JS for rendered components (tabs, accordion, etc.)
  initAll({ scope: document.getElementById('rendered-content')! });
} else {
  const msg =
    '<div class="output-empty"><p>No export data found.</p><p><a href="/">Go back to the editor</a> and click Export.</p></div>';
  document.getElementById('rendered-content')!.innerHTML = msg;
  document.getElementById('markup-content')!.textContent =
    'No data. Go back to the editor and click Export.';
  document.getElementById('json-content')!.textContent =
    'No data. Go back to the editor and click Export.';
}
