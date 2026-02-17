import { GovukBlockTool } from '../base/govuk-block-tool.js';
import type { GovukMenuConfig } from '../base/govuk-block-tool.js';
import { icons } from '../icons/index.js';

export interface ButtonData {
  text: string;
  element: 'button' | 'a' | 'input';
  classes: string;
  href: string;
}

export class GovukButton extends GovukBlockTool<ButtonData> {
  private buttonEl!: HTMLElement;

  static get toolbox() {
    return { title: 'Button', icon: icons.button };
  }

  get defaultData(): ButtonData {
    return { text: 'Submit', element: 'button', classes: '', href: '' };
  }

  renderEdit(): HTMLElement {
    // Always render as a div in edit mode to allow contentEditable
    this.buttonEl = document.createElement('div');
    this.buttonEl.className = `govuk-button${this.data.classes ? ' ' + this.data.classes : ''}`;
    this.buttonEl.setAttribute('data-module', 'govuk-button');
    this.buttonEl.textContent = this.data.text;

    this.makeEditable(this.buttonEl, { placeholder: 'Button text' });

    return this.buttonEl;
  }

  extractData(): ButtonData {
    return {
      text: this.getEditableText(this.buttonEl),
      element: this.data.element,
      classes: this.data.classes,
      href: this.data.href,
    };
  }

  renderSettings(): GovukMenuConfig {
    const variants: { label: string; classes: string }[] = [
      { label: 'Primary', classes: '' },
      { label: 'Secondary', classes: 'govuk-button--secondary' },
      { label: 'Warning', classes: 'govuk-button--warning' },
      { label: 'Start', classes: 'govuk-button--start' },
    ];

    const elements: { label: string; element: ButtonData['element'] }[] = [
      { label: 'Button element', element: 'button' },
      { label: 'Link element', element: 'a' },
      { label: 'Input element', element: 'input' },
    ];

    return [
      ...variants.map(({ label, classes }) => ({
        icon: icons.button,
        label,
        isActive: this.data.classes === classes,
        closeOnActivate: true,
        onActivate: () => {
          this.data = { ...this.extractData(), classes };
          this.rerender();
        },
      })),
      ...elements.map(({ label, element }) => ({
        icon: icons.button,
        label,
        isActive: this.data.element === element,
        closeOnActivate: true,
        onActivate: () => {
          this.data = { ...this.extractData(), element };
        },
      })),
    ];
  }

}
