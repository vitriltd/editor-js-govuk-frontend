import { GovukBlockTool } from '../base/govuk-block-tool.js';
import { icons } from '../icons/index.js';

export interface PanelData {
  titleText: string;
  html: string;
}

export class GovukPanel extends GovukBlockTool<PanelData> {
  private titleEl!: HTMLElement;
  private bodyEl!: HTMLElement;

  static get toolbox() {
    return { title: 'Panel', icon: icons.panel };
  }

  static get sanitize() {
    return {
      titleText: {},
      html: { br: true, strong: true },
    };
  }

  get defaultData(): PanelData {
    return { titleText: '', html: '' };
  }

  renderEdit(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'govuk-panel govuk-panel--confirmation';

    this.titleEl = document.createElement('h1');
    this.titleEl.className = 'govuk-panel__title';
    this.titleEl.textContent = this.data.titleText;
    this.makeEditable(this.titleEl, { placeholder: 'Panel title...' });

    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'govuk-panel__body';
    this.bodyEl.innerHTML = this.data.html;
    this.makeEditable(this.bodyEl, { placeholder: 'Panel body text...' });

    panel.appendChild(this.titleEl);
    panel.appendChild(this.bodyEl);

    return panel;
  }

  extractData(): PanelData {
    return {
      titleText: this.getEditableText(this.titleEl),
      html: this.getEditableHtml(this.bodyEl),
    };
  }
}
