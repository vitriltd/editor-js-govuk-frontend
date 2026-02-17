import { GovukBlockTool } from '../base/govuk-block-tool.js';
import { icons } from '../icons/index.js';

export interface DetailsData {
  summaryText: string;
  html: string;
}

export class GovukDetails extends GovukBlockTool<DetailsData> {
  private summaryTextEl!: HTMLElement;
  private contentEl!: HTMLElement;

  static get toolbox() {
    return { title: 'Details', icon: icons.details };
  }

  static get sanitize() {
    return {
      summaryText: {},
      html: {
        br: true, a: { href: true }, b: true, strong: true, em: true, i: true,
        p: { class: true }, ul: { class: true }, ol: { class: true }, li: true,
      },
    };
  }

  get defaultData(): DetailsData {
    return { summaryText: '', html: '' };
  }

  renderEdit(): HTMLElement {
    // Force open in editing mode so content is always visible
    const details = document.createElement('details');
    details.className = 'govuk-details';
    details.open = true;
    if (!this.readOnly) {
      details.classList.add('govuk-editor-details--forced-open');
    }

    const summary = document.createElement('summary');
    summary.className = 'govuk-details__summary';

    this.summaryTextEl = document.createElement('span');
    this.summaryTextEl.className = 'govuk-details__summary-text';
    this.summaryTextEl.textContent = this.data.summaryText;
    this.makeEditable(this.summaryTextEl, { placeholder: 'Summary text...' });

    summary.appendChild(this.summaryTextEl);

    // Prevent toggle when editing summary
    if (!this.readOnly) {
      summary.addEventListener('click', (e) => e.preventDefault());
    }

    const content = document.createElement('div');
    content.className = 'govuk-details__text';

    this.contentEl = document.createElement('div');
    this.contentEl.innerHTML = this.data.html;
    this.makeEditable(this.contentEl, { placeholder: 'Details content...' });

    content.appendChild(this.contentEl);
    details.appendChild(summary);
    details.appendChild(content);

    return details;
  }

  extractData(): DetailsData {
    return {
      summaryText: this.getEditableText(this.summaryTextEl),
      html: this.getEditableHtml(this.contentEl),
    };
  }
}
