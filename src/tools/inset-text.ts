import { GovukBlockTool } from '../base/govuk-block-tool.js';
import { icons } from '../icons/index.js';

export interface InsetTextData {
  html: string;
}

export class GovukInsetText extends GovukBlockTool<InsetTextData> {
  private contentEl!: HTMLElement;

  static get toolbox() {
    return { title: 'Inset text', icon: icons.insetText };
  }

  static get sanitize() {
    return {
      html: {
        br: true, a: { href: true }, b: true, i: true,
        strong: true, em: true, p: { class: true },
      },
    };
  }

  get defaultData(): InsetTextData {
    return { html: '' };
  }

  renderEdit(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'govuk-inset-text';

    this.contentEl = document.createElement('div');
    this.contentEl.innerHTML = this.data.html;
    this.makeEditable(this.contentEl, { placeholder: 'Inset text content...' });

    container.appendChild(this.contentEl);
    return container;
  }

  extractData(): InsetTextData {
    return {
      html: this.getEditableHtml(this.contentEl),
    };
  }
}
