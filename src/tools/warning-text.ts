import { GovukBlockTool } from '../base/govuk-block-tool.js';
import { icons } from '../icons/index.js';

export interface WarningTextData {
  text: string;
  iconFallbackText: string;
}

export class GovukWarningText extends GovukBlockTool<WarningTextData> {
  private textEl!: HTMLElement;

  static get toolbox() {
    return { title: 'Warning text', icon: icons.warningText };
  }

  static get sanitize() {
    return { text: { br: true, a: { href: true }, strong: true, em: true } };
  }

  get defaultData(): WarningTextData {
    return { text: '', iconFallbackText: 'Warning' };
  }

  renderEdit(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'govuk-warning-text';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'govuk-warning-text__icon';
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.textContent = '!';

    const strong = document.createElement('strong');
    strong.className = 'govuk-warning-text__text';

    const srSpan = document.createElement('span');
    srSpan.className = 'govuk-visually-hidden';
    srSpan.textContent = this.data.iconFallbackText;

    this.textEl = document.createElement('span');
    this.textEl.innerHTML = this.data.text;
    this.makeEditable(this.textEl, { placeholder: 'Warning text...' });

    strong.appendChild(srSpan);
    strong.appendChild(this.textEl);
    container.appendChild(iconSpan);
    container.appendChild(strong);

    return container;
  }

  extractData(): WarningTextData {
    return {
      text: this.getEditableHtml(this.textEl),
      iconFallbackText: this.data.iconFallbackText,
    };
  }
}
